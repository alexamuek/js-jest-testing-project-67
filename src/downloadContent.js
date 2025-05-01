import * as cheerio from 'cheerio';
import _ from 'lodash';
import path from 'path';
import debug from 'debug';
import { getContent } from './getPageData.js';
import { createFile } from './handleFilesTasks.js';

const contentType = ['img', 'link', 'script'];

const refTag = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const logLoader = debug('page-loader');

const generateLocalSrcLink = (contentUrl, contentFolder) => {
  const extIndex = contentUrl.pathname.indexOf('.');
  const extention = extIndex === -1 ? 'html' : contentUrl.pathname.substring(extIndex + 1);
  const URLWithoutExt = extIndex === -1 ? contentUrl.href : contentUrl.href.substring(0, contentUrl.href.lastIndexOf('.'));
  const withoutHTTP = URLWithoutExt.substring(URLWithoutExt.indexOf('//') + 2);
  const fileName = `${_.replace(withoutHTTP, /[^0-9a-zA-Z]/g, '-')}.${extention}`;
  return [`${contentFolder}/${fileName}`, fileName];
};

const getHTTPSrcLink = (src, targetURLobj) => {
  if (!src) {
    return '';
  }
  if (src.includes(targetURLobj.host)) {
    return src;
  }
  if (!src.includes('http')) {
    const contentUrl = new URL(src, targetURLobj.origin);
    return contentUrl.href;
  }
  return '';
};

const resolve = async (filePath, url) => {
  const content = await getContent(url);
  await createFile(filePath, content);
};

const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html);
  const targetURLobj = new URL(targetURL);
  const httpPromises = [];
  for (let index = 0; index < contentType.length; index += 1) {
    const itemContentType = contentType[index];
    const arrayOfNodes = $(itemContentType).toArray();
    for (const element of arrayOfNodes) {
      const $tag = $(element);
      const src = $tag.attr(refTag[itemContentType]);
      const httpSrc = getHTTPSrcLink(src, targetURLobj);
      if (httpSrc.length === 0) {
        continue;
      }
      logLoader(`content src from page = ${src}`);
      const contentUrl = new URL(httpSrc);
      const [newSrc, fileName] = generateLocalSrcLink(contentUrl, contentFolder);
      const fullPath = path.join(contentPath, fileName);
      $tag.attr(refTag[itemContentType], newSrc);
      logLoader(`upgraded content src  = ${newSrc}`);
      httpPromises.push(resolve(fullPath, contentUrl.href));
    }
  }
  Promise.all(httpPromises);
  return $.html();
};

/*const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html);
  const targetURLobj = new URL(targetURL);
  for (let index = 0; index < contentType.length; index += 1) {
    const itemContentType = contentType[index];
    const arrayOfNodes = $(itemContentType).toArray();
    for (const element of arrayOfNodes) {
      const $tag = $(element);
      const src = $tag.attr(refTag[itemContentType]);
      const httpSrc = getHTTPSrcLink(src, targetURLobj);
      if (httpSrc.length === 0) {
        continue;
      }
      logLoader(`content src from page = ${src}`);
      const contentUrl = new URL(httpSrc);
      const [newSrc, fileName] = generateLocalSrcLink(contentUrl, contentFolder);
      const fullPath = path.join(contentPath, fileName);
      $tag.attr(refTag[itemContentType], newSrc);
      logLoader(`upgraded content src  = ${newSrc}`);
      const contentData = await getContent(contentUrl.href);
      if (!contentData) {
        throw new Error('Error of content loading');
      }
      await createFile(fullPath, contentData);
    }
  }
  return $.html();
};*/

export default downloadContent;
export { contentType, refTag };
