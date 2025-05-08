import { fileURLToPath } from 'url';
import nock from 'nock';
import path, { dirname } from 'path';
import fs from 'fs/promises';
import os from 'node:os';
import loadHTML from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const initData = {};
let userFolderPath;

beforeAll(async () => {
  initData.sourceHTMLFile = 'sourceHTML.html';
  initData.imageFile = 'nodejs.png';
  initData.css = 'application.css';
  initData.script = 'runtime.js';
  initData.hexletUrl = 'https://ru.hexlet.io/courses';
  initData.sourceHTML = await fs.readFile(getFixturePath(initData.sourceHTMLFile), { encoding: 'utf8' });
  initData.expectedCSS = await fs.readFile(getFixturePath(initData.css), { encoding: 'utf8' });
  initData.expectedScript = await fs.readFile(getFixturePath(initData.script), { encoding: 'utf8' });
  initData.defaultPath = process.cwd(); // path.join(process.cwd(), 'bin');
  initData.outputFilename = 'ru-hexlet-io-courses.html';
});

beforeEach(async () => {
  userFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  nock.disableNetConnect();
  nock(/ru\.hexlet\.io/)
    .persist()
    .get(/\/courses/)
    .reply(200, initData.sourceHTML);
  nock(/ru\.hexlet\.io/)
    .get(/\/assets\/application.css/)
    .reply(200, initData.expectedCSS);
  nock(/ru\.hexlet\.io/)
    .get(/\/packs/)
    .reply(200, initData.expectedScript);
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.restore();
});

/*test('400 code, HTML loading', async () => {
  nock.cleanAll();
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(400, {
      error: {
        message: 'Bad request',
      },
    });
  await expect(
    loadHTML(initData.hexletUrl, userFolderPath),
  )
    .rejects
    .toThrow(new Error('HTML loading error!'));
});

test('200 code, non-existed user folder', async () => {
  await expect(
    loadHTML(initData.hexletUrl, '/1/1'),
  )
    .rejects
    .toThrow(new Error('Non-existed folder!'));
});

test('400 code, Content loading', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/professions/)
    .reply(400, {
      error: {
        message: 'Bad request',
      },
    });
  const receivedHTMLPathObj = await loadHTML(initData.hexletUrl);
  expect(receivedHTMLPathObj.filepath)
    .toEqual(path.join(initData.defaultPath, initData.outputFilename));
});*/

test('no connection', async () => {
  nock.cleanAll();
  await expect(
    loadHTML(initData.hexletUrl, userFolderPath),
  )
    .rejects
    .toThrow(new Error('HTML loading error!'));
});
