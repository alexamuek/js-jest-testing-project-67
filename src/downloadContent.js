import * as cheerio from 'cheerio';
import _ from 'lodash';
import path from 'path';
import { getContent } from './getPageData.js';
import { createFile } from './handleFilesTasks.js';

const generateLocalSrcLink = (contentUrl, contentFolder) => {
  const URLWithoutExt = contentUrl.href.substring(0, contentUrl.href.lastIndexOf('.'));
  const extention = contentUrl.href.substring(contentUrl.href.lastIndexOf('.') + 1);
  const withoutHTTP = URLWithoutExt.substring(URLWithoutExt.indexOf('//') + 2);
  const fileName = `${_.replace(withoutHTTP, /[^0-9a-zA-Z]/g, '-')}.${extention}`;
  return [`${contentFolder}/${fileName}`, fileName];
};

// разобраться, что делать с www - его нет примерах хекслета
const getHTTPSrcLink = (src, targetURLobj) => {
  if (!src) {
    return '';
  }
  if (src.includes(targetURLobj.host)) {
    return src;
  }
  if (!src.includes('http')) {
    const contentUrl = new URL(src, targetURLobj.origin);
    if (!contentUrl.hostname.startsWith('www.')) {
      contentUrl.hostname = `www.${contentUrl.hostname}`;
    }
    return contentUrl.href;
  }
  return '';
};

const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html);
  const targetURLobj = new URL(targetURL);
  $('img').each(async (i, element) => {
    const $img = $(element);
    const src = $img.attr('src');
    const httpSrc = getHTTPSrcLink(src, targetURLobj);
    if (httpSrc.length === 0) {
      return;
    }
    console.log('httpSrc = ', httpSrc);
    const contentUrl = new URL(httpSrc);
    const [newSrc, fileName] = generateLocalSrcLink(contentUrl, contentFolder);
    console.log('newSrc=', newSrc);
    const fullPath = path.join(contentPath, fileName);
    $img.attr('src', newSrc);
    const contentData = await getContent(contentUrl.href);
    await createFile(fullPath, contentData);
  });
  return $.html();
};

export default downloadContent;
