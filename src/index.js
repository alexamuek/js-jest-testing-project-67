import path from 'path';
import _ from 'lodash';
import getData from './getPageData.js';
import { createFile, isExistedFolder } from './handleFilesTasks.js';

const defaultPath = path.join(process.cwd(), 'output');

const loadHTML = async (url, outputPath = defaultPath) => {
  console.log(url);
  console.log(outputPath);
  await isExistedFolder(outputPath);
  const html = await getData(url);
  const URLwithoutProtocol = url.substring(url.indexOf('//') + 2);
  const fileName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}.html`;
  const fullPath = path.join(outputPath, fileName);
  await createFile(fullPath, html);
  return fullPath;
};

export default loadHTML;
