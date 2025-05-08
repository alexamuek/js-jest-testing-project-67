import path from 'path';
import _ from 'lodash';
import fs from 'fs/promises';

import { getHTML } from './getPageData.js';
import { createFile, isExistedFolder, createFolderIfNecessary } from './handleFilesTasks.js';
import downloadContent from './downloadContent.js';

 const defaultPath =path.join(process.cwd(), 'src');

const loadHTML = async (url, outputPath = defaultPath) => {
  console.log('outputPath in loadHTML = ', outputPath);
  console.log(`input user url: `, url);
  if (outputPath!==defaultPath) {
    await isExistedFolder(outputPath);
  } 
  const html = await getHTML(url);
  const URLwithoutProtocol = url.substring(url.indexOf('//') + 2);
  const fileName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}.html`;
  const contentFolderName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}_files`;
  const folderPath = path.join(outputPath, contentFolderName);
  await createFolderIfNecessary(folderPath);
  console.log('mark!! finish');
  // check created contentFolder
  try {
    await isExistedFolder(folderPath);  
  } catch(error) {
    console.log('folder content does not exists', folderPath);
  }
  
  // 
  const fullPathHTML = path.join(outputPath, fileName);
  // console.log('fullPathHTML in loadHTML= ', fullPathHTML);
  // console.log('folderPath in loadHTML= ', folderPath);
  const updatedHTML = await downloadContent(html, folderPath, url, contentFolderName);
  await createFile(fullPathHTML, updatedHTML);
  // await fs.access(fullPathHTML, fs.constants.R_OK);
  return { filepath: fullPathHTML };
};

export default loadHTML;

