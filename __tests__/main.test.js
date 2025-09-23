import { fileURLToPath } from 'url'
import nock from 'nock'
import path, { dirname } from 'path'
import fs from 'fs/promises'
import os from 'node:os'
import _ from 'lodash'
import * as cheerio from 'cheerio'
import loadHTML from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const contentType = ['img', 'link', 'script']

const refTag = {
  img: 'src',
  link: 'href',
  script: 'src',
}

const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)
const initData = {}
const resources = {
  sourceHTML: 'sourceHTML.html',
  expectedHTML: 'expected.html',
  image: 'nodejs.png',
  css: 'application.css',
  script: 'runtime.js'
}
const loadedResources = {}
let userFolderPath

beforeAll(async () => {
  initData.hexletUrl = 'https://ru.hexlet.io/courses'
  initData.outputFilename = 'ru-hexlet-io-courses.html'
  initData.outputContentFolder = 'ru-hexlet-io-courses_files'
  initData.defaultPath = './'
  nock.disableNetConnect()
  for (const key in resources) {
    loadedResources[key] = await fs.readFile(getFixturePath(resources[key]), { encoding: 'utf8' })
  }
})

beforeEach(async () => {
  userFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

afterEach(() => {
  nock.cleanAll()
})

describe('positive', () => {
  beforeEach(async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(200, loadedResources.sourceHTML)
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

  test('200 code, existed user path to save', async () => {
    const receivedHTMLPathObj = await loadHTML(initData.hexletUrl, userFolderPath)
    expect(receivedHTMLPathObj.filepath).toEqual(path.join(userFolderPath, initData.outputFilename))
    const isContentFolderExists = await fs.access(
      path.join(
        userFolderPath,
        initData.outputContentFolder,
      ),
    )
    expect(isContentFolderExists).toBeUndefined()
    const receivedHTML = await fs.readFile(receivedHTMLPathObj.filepath, { encoding: 'utf8' })
    expect(_.replace(loadedResources.expectedHTML, /[\s]/g, '')).toEqual(_.replace(receivedHTML, /[\s]/g, ''))
  })

  test('200 code, default path to save', async () => {
    const receivedHTMLPathObj = await loadHTML(initData.hexletUrl)
    // check outputPath
    expect(receivedHTMLPathObj.filepath)
      .toEqual(path.join(initData.defaultPath, initData.outputFilename))
    // check content
    const receivedHTML = await fs.readFile(receivedHTMLPathObj.filepath, { encoding: 'utf8' })
    expect(_.replace(loadedResources.expectedHTML, /[\s]/g, '')).toEqual(_.replace(receivedHTML, /[\s]/g, ''))
    // delete data after test
    await fs.rm(path.join(initData.defaultPath, initData.outputContentFolder), { recursive: true })
    await fs.rm(receivedHTMLPathObj.filepath)
  })

  test('200 code, check content, existed user path to save', async () => {
    const receivedHTMLPathObj = await loadHTML(initData.hexletUrl, userFolderPath)
    const receivedHTML = await fs.readFile(receivedHTMLPathObj.filepath, { encoding: 'utf8' })
    const $received = cheerio.load(receivedHTML)
    const $expected = cheerio.load(loadedResources.expectedHTML)
    const receivedSRCs = []
    const expectedSRCs = []
    contentType.forEach((tag) => {
      $received(tag).each((i, element) => {
        const $tag = $received(element)
        const src = $tag.attr(refTag[tag])
        receivedSRCs.push(src)
      })
      $expected(tag).each((i, element) => {
        const $tag = $expected(element)
        const src = $tag.attr(refTag[tag])
        expectedSRCs.push(src)
      })
    })
    expect(receivedSRCs).toEqual(expectedSRCs)
  })
})

describe('negative', () => {
  test('400 code, HTML loading', async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(400, {
        error: {
          message: 'Bad request',
        },
      })
    await expect(
      loadHTML(initData.hexletUrl, userFolderPath),
    )
      .rejects
      .toThrow(new Error('HTML loading error!'))
  })

  test('non-existed user folder', async () => {
    await expect(
      loadHTML(initData.hexletUrl, '/1/1'),
    )
      .rejects
      .toThrow(/ENOENT/)
  })

  test('wrong path - file instead of directory', async () => {
    const directory = path.join(__dirname, '..', '__fixtures__', 'expected.html')
    await expect(
      loadHTML(initData.hexletUrl, directory),
    )
      .rejects
      .toThrow(/ENOTDIR/)
  })

  test('wrong path - access denied to dir', async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(200, loadedResources.sourceHTML)
      .persist()
      .get('/assets/professions/nodejs.png')
      .reply(200, loadedResources.image)
      .get('/assets/application.css')
      .reply(200, loadedResources.css)
      .get('/packs/js/runtime.js')
      .reply(200, loadedResources.script)
    const directory = '/sys'
    await expect(
      loadHTML(initData.hexletUrl, directory),
    )
      .rejects
      .toThrow(/EACCES/)
  })

  test('400 code, Content loading, default user path', async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(200, loadedResources.sourceHTML)
      .get('/assets/application.css')
      .reply(200, loadedResources.css)
      .get('/packs/js/runtime.js')
      .reply(200, loadedResources.script)
      .get('/assets/professions/nodejs.png')
      .reply(400, { error: { message: 'Bad request' } })
    const receivedHTMLPathObj = await loadHTML(initData.hexletUrl)
    expect(receivedHTMLPathObj.filepath)
      .toEqual(path.join(initData.defaultPath, initData.outputFilename))
    await fs.rm(path.join(initData.defaultPath, initData.outputContentFolder), { recursive: true })
    await fs.rm(receivedHTMLPathObj.filepath)
  })

  test('no connection', async () => {
    await expect(
      loadHTML(initData.hexletUrl, userFolderPath),
    )
      .rejects
      .toThrow(new Error('HTML loading error!'))
  })

  test('404 code, HTML loading', async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(404, {
        error: {
          message: 'Not Found',
        },
      })
    await expect(
      loadHTML(initData.hexletUrl, userFolderPath),
    )
      .rejects
      .toThrow(new Error('HTML loading error!'))
  })

  test('500 code, HTML loading', async () => {
    nock('https://ru.hexlet.io:443')
      .get('/courses')
      .reply(500, {
        error: {
          message: 'Internal Server Error',
        },
      })
    await expect(
      loadHTML(initData.hexletUrl, userFolderPath),
    )
      .rejects
      .toThrow(new Error('HTML loading error!'))
  })
})
