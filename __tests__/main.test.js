import { fileURLToPath } from 'url';
import nock from 'nock';
import path, { dirname } from 'path';
import fs from 'fs/promises';
import os from 'node:os';
import _ from 'lodash';
import * as cheerio from 'cheerio';
import loadHTML from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const initData = {};
let userFolderPath;

beforeAll(async () => {
  initData.sourceHTMLFile = 'sourceHTML.html';
  initData.expectedHTMLFile = 'expected.html';
  initData.imageFile = 'nodejs.png';
  initData.hexletUrl = 'https://ru.hexlet.io/courses';
  initData.outputFilename = 'ru-hexlet-io-courses.html';
  initData.outputContentFolder = 'ru-hexlet-io-courses_files';
  initData.sourceHTML = await fs.readFile(getFixturePath(initData.sourceHTMLFile), { encoding: 'utf8' });
  initData.expectedHTML = await fs.readFile(getFixturePath(initData.expectedHTMLFile), { encoding: 'utf8' });
  initData.expectedImage = await fs.readFile(getFixturePath(initData.imageFile), { encoding: 'utf8' });
  initData.defaultPath = path.join(process.cwd(), 'output');
});

beforeEach(async () => {
  userFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(() => {
  nock.cleanAll();
});

test('200 code, existed user path', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, initData.sourceHTML);
  nock(/ru\.hexlet\.io/)
    .get(/\/assets/)
    .reply(200, initData.expectedImage);
  const receivedHTMLPath = await loadHTML(initData.hexletUrl, userFolderPath);
  // check outputPath
  expect(receivedHTMLPath).toEqual(path.join(userFolderPath, initData.outputFilename));
  const isContentFolderExists = await fs.access(path.join(userFolderPath, initData.outputContentFolder));
  expect(isContentFolderExists).toBeUndefined();
  // check content
  const receivedHTML = await fs.readFile(receivedHTMLPath, { encoding: 'utf8' });
  expect(_.replace(initData.expectedHTML,/[\s]/g,'')).toEqual(_.replace(receivedHTML,/[\s]/g,''));
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
    loadHTML(initData.hexletUrl, userFolderPath),
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
    .reply(200, initData.sourceHTML);
  nock(/ru\.hexlet\.io/)
    .get(/\/assets/)
    .reply(200, initData.expectedImage);
  const receivedHTMLPath = await loadHTML(initData.hexletUrl);
  // check outputPath
  expect(receivedHTMLPath).toEqual(path.join(initData.defaultPath, initData.outputFilename));
  // check content
  const receivedHTML = await fs.readFile(receivedHTMLPath, { encoding: 'utf8' });
  expect(_.replace(initData.expectedHTML,/[\s]/g,'')).toEqual(_.replace(receivedHTML,/[\s]/g,''));
});

test('200 code, check IMGs', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, initData.sourceHTML);
  nock(/ru\.hexlet\.io/)
    .get(/\/assets/)
    .reply(200, initData.expectedImage);
  const receivedHTMLPath = await loadHTML(initData.hexletUrl, userFolderPath);
  const receivedHTML = await fs.readFile(receivedHTMLPath, { encoding: 'utf8' });
  const $received = cheerio.load(receivedHTML);
  expect(1).toEqual(1);
  /*$received('img').each((i, element) => {
    const $img = $received(element);
    const src = $img.attr('src');
    console.log('receivedSRC=', src);
  });*/
  const receivedSRCs = [];
  $received('img').map((i, element) => {
    const $img = $received(element);
    const src = $img.attr('src');
    receivedSRCs.push(src);
  });
  $expected = cheerio.load(initData.expectedHTML);
  const expectedSRCs = [];
  $expected('img').map((i, element) => {
    const $img = $expected(element);
    const src = $img.attr('src');
    expectedSRCs.push(src);
  });
  expect(receivedSRCs).toEqual(expectedSRCs);
});