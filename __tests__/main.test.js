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
let tmpFolderPath;

beforeAll(async () => {
  initData.htmlFile = 'successfulHTML.html';
  initData.hexletUrl = 'https://ru.hexlet.io/courses';
  initData.outputFilename = 'ru-hexlet-io-courses.html';
  initData.expectedHTML = await fs.readFile(getFixturePath(initData.htmlFile), { encoding: 'utf8' });
  initData.defaultPath = path.join(process.cwd(), 'output');
});

beforeEach(async () => {
  tmpFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('200 code, existed user path', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, initData.expectedHTML);
  const receivedPath = await loadHTML(initData.hexletUrl, tmpFolderPath);
  // check outputPath
  expect(receivedPath).toEqual(path.join(tmpFolderPath, initData.outputFilename));
  // check content
  const receivedHTML = await fs.readFile(receivedPath, { encoding: 'utf8' });
  expect(initData.expectedHTML).toEqual(receivedHTML);
});

test('404 code, existed user path', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(400, {
      error: {
        message: 'Bad request',
      },
    });
  await expect(
    loadHTML(initData.hexletUrl, tmpFolderPath),
  )
    .rejects
    .toThrow(new Error('Something went wrong!'));
});

test('200 code, non-existed user path', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, initData.expectedHTML);
  await expect(
    loadHTML(initData.hexletUrl, '/1/1'),
  )
    .rejects
    .toThrow(new Error('Non-existed path!'));
});

test('200 code, default path', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, initData.expectedHTML);
  const receivedPath = await loadHTML(initData.hexletUrl);
  // check outputPath
  expect(1).toEqual(1);
  expect(receivedPath).toEqual(path.join(initData.defaultPath, initData.outputFilename));
  // check content
  const receivedHTML = await fs.readFile(receivedPath, { encoding: 'utf8' });
  expect(initData.expectedHTML).toEqual(receivedHTML);
});
