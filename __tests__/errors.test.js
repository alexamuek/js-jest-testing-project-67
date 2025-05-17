import { fileURLToPath } from 'url'
import nock from 'nock'
import path, { dirname } from 'path'
import fs from 'fs/promises'
import os from 'node:os'
import loadHTML from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)
const initData = {}
let userFolderPath

beforeAll(async () => {
  initData.sourceHTMLFile = 'sourceHTML.html'
  initData.imageFile = 'nodejs.png'
  initData.css = 'application.css'
  initData.script = 'runtime.js'
  initData.hexletUrl = 'https://ru.hexlet.io/courses'
  initData.sourceHTML = await fs.readFile(getFixturePath(initData.sourceHTMLFile), { encoding: 'utf8' })
  initData.expectedCSS = await fs.readFile(getFixturePath(initData.css), { encoding: 'utf8' })
  initData.expectedScript = await fs.readFile(getFixturePath(initData.script), { encoding: 'utf8' })
  initData.defaultPath = './' // path.join(process.cwd(), 'src');
  initData.outputFilename = 'ru-hexlet-io-courses.html'
  initData.outputContentFolder = 'ru-hexlet-io-courses_files'
})

beforeEach(async () => {
  userFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

afterEach(() => {
  nock.cleanAll()
})

test('400 code, HTML loading', async () => {
  nock.cleanAll();
  const scope = nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(400, {
      error: {
        message: 'Bad request',
      },
    })
  console.log(nock.activeMocks());
  await expect(
    loadHTML(initData.hexletUrl, userFolderPath),
  )
    .rejects
    .toThrow(new Error('HTML loading error!'))
});

test('200 code, non-existed user folder', async () => {
  nock.cleanAll();
  console.log(nock.activeMocks());
  await expect(
    loadHTML(initData.hexletUrl, '/1/1'),
  )
    .rejects
    .toThrow(new Error('Non-existed folder!'))
})

/* test('400 code, Content loading, default user path', async () => {
  nock('https://ru.hexlet.io/')
    .get(/\/courses/)
    .reply(200, initData.sourceHTML);
  nock('https://ru.hexlet.io/')
    .get(/\/professions/)
    .reply(400, {
      error: {
        message: 'Bad request',
      },
    });
  const receivedHTMLPathObj = await loadHTML(initData.hexletUrl);
  expect(receivedHTMLPathObj.filepath)
    .toEqual(path.join(initData.defaultPath, initData.outputFilename));
  // delete files and folder
  await fs.rm(path.join(initData.defaultPath, initData.outputContentFolder), { recursive: true });
  await fs.rm(receivedHTMLPathObj.filepath);
}); */

test('no connection', async () => {
  nock.cleanAll()
  nock.disableNetConnect();
  console.log(nock.activeMocks());
  await expect(
    loadHTML(initData.hexletUrl, userFolderPath),
  )
    .rejects
    .toThrow(new Error('HTML loading error!'))
})
