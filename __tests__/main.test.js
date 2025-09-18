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
let userFolderPath

beforeAll(async () => {
  initData.sourceHTMLFile = 'sourceHTML.html'
  initData.expectedHTMLFile = 'expected.html'
  initData.imageFile = 'nodejs.png'
  initData.css = 'application.css'
  initData.script = 'runtime.js'
  initData.hexletUrl = 'https://ru.hexlet.io/courses'
  initData.outputFilename = 'ru-hexlet-io-courses.html'
  initData.outputContentFolder = 'ru-hexlet-io-courses_files'
  initData.sourceHTML = await fs.readFile(getFixturePath(initData.sourceHTMLFile), { encoding: 'utf8' })
  initData.expectedHTML = await fs.readFile(getFixturePath(initData.expectedHTMLFile), { encoding: 'utf8' })
  initData.expectedImage = await fs.readFile(getFixturePath(initData.imageFile), { encoding: 'utf8' })
  initData.expectedCSS = await fs.readFile(getFixturePath(initData.css), { encoding: 'utf8' })
  initData.expectedScript = await fs.readFile(getFixturePath(initData.script), { encoding: 'utf8' })
  initData.defaultPath = './'
  nock.disableNetConnect()
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
      .reply(200, initData.sourceHTML)
      .persist()
      .get('/assets/professions/nodejs.png')
      .reply(200, initData.expectedImage)
      .get('/assets/application.css')
      .reply(200, initData.expectedCSS)
      .get('/packs/js/runtime.js')
      .reply(200, initData.expectedScript)
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
    expect(_.replace(initData.expectedHTML, /[\s]/g, '')).toEqual(_.replace(receivedHTML, /[\s]/g, ''))
  })

  test('200 code, default path to save', async () => {
    const receivedHTMLPathObj = await loadHTML(initData.hexletUrl)
    // check outputPath
    expect(receivedHTMLPathObj.filepath)
      .toEqual(path.join(initData.defaultPath, initData.outputFilename))
    // check content
    const receivedHTML = await fs.readFile(receivedHTMLPathObj.filepath, { encoding: 'utf8' })
    expect(_.replace(initData.expectedHTML, /[\s]/g, '')).toEqual(_.replace(receivedHTML, /[\s]/g, ''))
    // delete data after test
    await fs.rm(path.join(initData.defaultPath, initData.outputContentFolder), { recursive: true })
    await fs.rm(receivedHTMLPathObj.filepath)
  })

  test('200 code, check content, existed user path to save', async () => {
    const receivedHTMLPathObj = await loadHTML(initData.hexletUrl, userFolderPath)
    const receivedHTML = await fs.readFile(receivedHTMLPathObj.filepath, { encoding: 'utf8' })
    const $received = cheerio.load(receivedHTML)
    const $expected = cheerio.load(initData.expectedHTML)
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
      .reply(200, initData.sourceHTML)
      .persist()
      .get('/assets/professions/nodejs.png')
      .reply(200, initData.expectedImage)
      .get('/assets/application.css')
      .reply(200, initData.expectedCSS)
      .get('/packs/js/runtime.js')
      .reply(200, initData.expectedScript)
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
      .reply(200, initData.sourceHTML)
      .get('/assets/application.css')
      .reply(200, initData.expectedCSS)
      .get('/packs/js/runtime.js')
      .reply(200, initData.expectedScript)
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
