import path from 'path';
import _ from 'lodash';
import fs from 'fs/promises';

import { getHTML } from './getPageData.js';
import { createFile, isExistedFolder, createFolderIfNecessary } from './handleFilesTasks.js';
import downloadContent from './downloadContent.js';

 const defaultPath = path.join(process.cwd(), 'bin');

const loadHTML = async (url, outputPath = defaultPath) => {
  console.log('outputPath=!!!!!! ', outputPath);
  await isExistedFolder(outputPath);
  const html = await getHTML(url);
  console.log('html_url = ', url);
  const URLwithoutProtocol = url.substring(url.indexOf('//') + 2);
  const fileName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}.html`;
  const contentFolderName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}_files`;
  const folderPath = path.join(outputPath, contentFolderName);
  await createFolderIfNecessary(folderPath);
  const fullPathHTML = path.join(outputPath, fileName);
  console.log('fullPathHTML = ', fullPathHTML);
  const updatedHTML = await downloadContent(html, folderPath, url, contentFolderName);
  await createFile(fullPathHTML, updatedHTML);
  await fs.access(fullPathHTML, fs.constants.R_OK);
  return { filepath: fullPathHTML };
};

export default loadHTML;
