import { fileURLToPath } from 'node:url'
import nock from 'nock'
import path, { dirname } from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import _ from 'lodash'
import loadHTML from '../src/index.js'
import { expectedResourcesList } from '../__fixtures__/expectedResourcesList.js'
import { httpCodeData } from '../__fixtures__/httpCodeData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const contentType = ['img', 'link', 'script']

const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)
const initData = {}
const resources = {
  sourcePage: 'sourceHTML.html',
  expectedPage: 'expected.html',
  expectedPageNotFull: 'expectedPageNotFull.html',
  image: 'nodejs.png',
  css: 'application.css',
  script: 'runtime.js',
}
const loadedResources = {}
let tempFolderPath

beforeAll(async () => {
  initData.hexletUrl = 'https://ru.hexlet.io/courses'
  initData.outputFilename = 'ru-hexlet-io-courses.html'
  initData.outputContentFolder = 'ru-hexlet-io-courses_files'
  initData.defaultPath = './'
  initData.unloadedResource = 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png'
  nock.disableNetConnect()
  for (const key in resources) {
    loadedResources[key] = await fs.readFile(getFixturePath(resources[key]), { encoding: 'utf8' })
  }
})

beforeEach(async () => {
  tempFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

afterEach(() => {
  nock.cleanAll()
})

describe('positive', () => {
  beforeEach(async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(200, loadedResources.sourcePage)
      .persist()
      .get('/assets/professions/nodejs.png')
      .reply(200, loadedResources.image)
      .get('/assets/application.css')
      .reply(200, loadedResources.css)
      .get('/packs/js/runtime.js')
      .reply(200, loadedResources.script)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  test('check custom path to save', async () => {
    const actualPageInfo = await loadHTML(initData.hexletUrl, tempFolderPath)
    const expectedPagePath = path.join(tempFolderPath, initData.outputFilename)
    expect(actualPageInfo.filepath).toEqual(expectedPagePath)
    await expect(fs.access(actualPageInfo.filepath))
      .resolves.not.toThrow()
  })

  test('check HTML-page', async () => {
    const actualPageInfo = await loadHTML(initData.hexletUrl, tempFolderPath)
    const actualPage = await fs.readFile(actualPageInfo.filepath, { encoding: 'utf8' })
    const cleanedActualPage = _.replace(actualPage, /[\s]/g, '')
    const cleanedExpectedPage = _.replace(loadedResources.expectedPage, /[\s]/g, '')
    expect(cleanedExpectedPage).toEqual(cleanedActualPage)
  })

  test('check default path to save', async () => {
    const actualPageInfo = await loadHTML(initData.hexletUrl)
    const expectedPagePath = path.join(initData.defaultPath, initData.outputFilename)
    expect(actualPageInfo.filepath).toEqual(expectedPagePath)
    await expect(fs.access(actualPageInfo.filepath))
      .resolves.not.toThrow()
    const resourcesFolderPath = path.join(initData.defaultPath, initData.outputContentFolder)
    await fs.rm(resourcesFolderPath, { recursive: true })
    await fs.rm(actualPageInfo.filepath)
  })

  test.each(contentType)('check %s-resource', async (format) => {
    await loadHTML(initData.hexletUrl, tempFolderPath)
    const { fixtureFileName, actualFileName } = expectedResourcesList.find(content => content.format === format)
    const expectedFilePath = getFixturePath(fixtureFileName)
    const actualFilePath = path.join(tempFolderPath, initData.outputContentFolder, actualFileName)
    await expect(fs.access(actualFilePath))
      .resolves.not.toThrow()
    const actualContent = await fs.readFile(actualFilePath, { encoding: 'utf8' })
    const expectedContent = await fs.readFile(expectedFilePath, { encoding: 'utf8' })
    expect(actualContent).toStrictEqual(expectedContent)
  })
})

describe('negative', () => {
  const fileErrors = [
    { code: 'ENOENT', customPath: '/1/1' },
    { code: 'ENOTDIR', customPath: getFixturePath('expected.html') },
    { code: 'EACCES', customPath: '/sys' },
  ]

  test.each(fileErrors)('check $code file code', async (data) => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(200, loadedResources.sourcePage)
      .persist()
      .get('/assets/professions/nodejs.png')
      .reply(200, loadedResources.image)
      .get('/assets/application.css')
      .reply(200, loadedResources.css)
      .get('/packs/js/runtime.js')
      .reply(200, loadedResources.script)
    await expect(
      loadHTML(initData.hexletUrl, data.customPath),
    )
      .rejects
      .toThrow(new RegExp(`\\b${data.code}\\b`))
  })

  test('400 code for one html resource', async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(200, loadedResources.sourcePage)
      .persist()
      .get('/assets/application.css')
      .reply(200, loadedResources.css)
      .get('/packs/js/runtime.js')
      .reply(200, loadedResources.script)
      .get('/assets/professions/nodejs.png')
      .reply(400, { error: { message: 'Bad request' } })
    const actualPageInfo = await loadHTML(initData.hexletUrl)
    const unloadedResourcePath = path.join(tempFolderPath, initData.unloadedResource)
    await expect(fs.access(unloadedResourcePath))
      .rejects.toThrow()
    const actualPage = await fs.readFile(actualPageInfo.filepath, { encoding: 'utf8' })
    const cleanedActualPage = _.replace(actualPage, /[\s]/g, '')
    const cleanedExpectedPage = _.replace(loadedResources.expectedPageNotFull, /[\s]/g, '')
    expect(cleanedActualPage).toEqual(cleanedExpectedPage)
    const resourcesFolderPath = path.join(initData.defaultPath, initData.outputContentFolder)
    await fs.rm(resourcesFolderPath, { recursive: true })
    await fs.rm(actualPageInfo.filepath)
  })

  test('no connection', async () => {
    await expect(
      loadHTML(initData.hexletUrl, tempFolderPath),
    )
      .rejects
      .toThrow(new Error('HTML loading error! No connection'))
  })

  test.each(httpCodeData)('check $code code', async (data) => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(data.code, {
        error: {
          message: data.message,
        },
      })
    await expect(
      loadHTML(initData.hexletUrl, tempFolderPath),
    )
      .rejects
      .toThrow(`HTML loading error! ${data.code} status`)
  })
})
