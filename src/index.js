import path from 'path';
import _ from 'lodash';

import { getHTML } from './getPageData.js';
import { createFile, isExistedFolder } from './handleFilesTasks.js';
import { downloadContent } from './downloadContent.js';

const defaultPath = path.join(process.cwd(), 'output');

const loadHTML = async (url, outputPath = defaultPath) => {
  console.log(url);
  console.log(outputPath);
  await isExistedFolder(outputPath);
  const html = await getHTML(url);
  const URLwithoutProtocol = url.substring(url.indexOf('//') + 2);
  const fileName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}.html`;
  const contentFolder = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}_files`;
  const fullPath = path.join(outputPath, fileName);
  
  const updatedHTML = downloadContent(html, `${outputPath}/${contentFolder}`, url, contentFolder);
  await createFile(fullPath, html); // заменить на updatedHTML
  return fullPath;
};

export default loadHTML;
