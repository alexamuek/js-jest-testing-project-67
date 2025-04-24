import * as cheerio from 'cheerio';
import _ from 'lodash';
import path from 'path';
import { getContent } from './getPageData.js';
import { createFile } from './handleFilesTasks.js';

const contentType = ['img', 'link', 'script'];

const refTag = {
  img: 'src',
  link: 'href',
  script: 'src',
};

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
    /* if (!contentUrl.hostname.startsWith('www.')) {
      contentUrl.hostname = `www.${contentUrl.hostname}`;
    } */
    return contentUrl.href;
  }
  return '';
};

const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html);
  const targetURLobj = new URL(targetURL);
  contentType.forEach((tag) => {
    $(tag).each(async (i, element) => {
      const $tag = $(element);
      const src = $tag.attr(refTag[tag]);
      const httpSrc = getHTTPSrcLink(src, targetURLobj);
      if (httpSrc.length === 0) {
        return;
      }
      // console.log('tag = ', tag);
      // console.log('httpSrc = ', httpSrc);
      const contentUrl = new URL(httpSrc);
      const [newSrc, fileName] = generateLocalSrcLink(contentUrl, contentFolder);
      const fullPath = path.join(contentPath, fileName);
      $tag.attr(refTag[tag], newSrc);
      // console.log('contentUrl.href = ', contentUrl.href);
      const contentData = await getContent(contentUrl.href);
      await createFile(fullPath, contentData);
    });
  });
  return $.html();
};

export default downloadContent;
export { contentType, refTag };
