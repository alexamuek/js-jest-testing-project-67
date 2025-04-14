import * as cheerio from 'cheerio';
import _ from 'lodash';
import path from 'path';
import { getContent } from './getPageData.js';
import { createFile } from './handleFilesTasks.js';

const getNewSrcLink = (contentUrl, contentFolder) => {
  const URLWithoutExt = contentUrl.href.substring(0, contentUrl.href.lastIndexOf('.'));
  const extention = contentUrl.href.substring(contentUrl.href.lastIndexOf('.') + 1);
  const withoutHTTP = URLWithoutExt.substring(URLWithoutExt.indexOf('//') + 2);
  const fileName = `${_.replace(withoutHTTP, /[^0-9a-zA-Z]/g, '-')}.${extention}`;
  return [`${contentFolder}/${fileName}`, fileName];
};

const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html);
  $('img').each(async (i, element) => {
    const $img = $(element);
    const src = $img.attr('src');
    if (src) {
      const contentUrl = new URL(src, targetURL);
      if (!contentUrl.hostname.startsWith('www.')) {
        contentUrl.hostname = `www.${contentUrl.hostname}`;
      }
      const [newSrc, fileName] = getNewSrcLink(contentUrl, contentFolder);
      const fullPath = path.join(contentPath, fileName);
      $img.attr('src', newSrc);
      const contentData = await getContent(contentUrl.href);
      await createFile(fullPath, contentData);
    }
  });
  return $.html();
};

export default downloadContent;
