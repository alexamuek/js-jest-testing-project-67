import path from 'node:path'
import _ from 'lodash'

import { getHTML } from './getPageData.js'
import { createFile, isExistedFolder, createFolderIfNecessary } from './handleFilesTasks.js'
import downloadContent from './downloadContent.js'

const defaultPath = './'

const loadHTML = async (url, outputPath = defaultPath) => {
  if (outputPath !== defaultPath) {
    await isExistedFolder(outputPath)
  }
  const html = await getHTML(url)
  const URLwithoutProtocol = url.substring(url.indexOf('//') + 2)
  const fileName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}.html`
  const contentFolderName = `${_.replace(URLwithoutProtocol, /[^0-9a-zA-Z]/g, '-')}_files`
  const folderPath = path.join(outputPath, contentFolderName)
  await createFolderIfNecessary(folderPath)
  const fullPathHTML = path.join(outputPath, fileName)
  const updatedHTML = await downloadContent(html, folderPath, url, contentFolderName)
  await createFile(fullPathHTML, updatedHTML)
  return { filepath: fullPathHTML }
}

export default loadHTML
