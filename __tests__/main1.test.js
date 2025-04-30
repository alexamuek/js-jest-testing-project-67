import { fileURLToPath } from 'url';
import nock from 'nock';
import path, { dirname } from 'path';
import fs from 'fs/promises';
import os from 'node:os';
import _ from 'lodash';
import * as cheerio from 'cheerio';
import loadHTML from '../src/index.js';
import { contentType, refTag } from '../src/downloadContent.js';

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
  initData.defaultPath = path.join(process.cwd(), 'output');
});

beforeEach(async () => {
  userFolderPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
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
  if (!nock.isDone()) {
    throw new Error("Остались невызванные nock-заглушки!");
  }
});

afterAll(() => {
  nock.restore(); // Отключает перехват запросов
});

test('400 code, HTML loading', async () => {
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

test('200 code, non-existed user path', async () => {
  await expect(
    loadHTML(initData.hexletUrl, '/1/1'),
  )
    .rejects
    .toThrow(new Error('Non-existed path!'));
});

test('400 code, Content loading', async () => {
  const scope = nock(/ru\.hexlet\.io/)
    .get(/\/professions/)
    .reply(400, {
      error: {
        message: 'Bad request',
      },
    });
  await expect(
    loadHTML(initData.hexletUrl, userFolderPath),
  )
    .rejects
    .toThrow(new Error('Content loading error!'));
});


