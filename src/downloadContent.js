import * as cheerio from 'cheerio'
import path from 'path'
import debug from 'debug'
import { getContent } from './getPageData.js'
import { createFile } from './handleFilesTasks.js'
import { getHTTPLinkToDownload, makeLocalSrcLink } from './utils.js'

const contentType = ['img', 'link', 'script']

const refTag = {
  img: 'src',
  link: 'href',
  script: 'src',
}

const logLoader = debug('page-loader')

const downloadAndUpdateHTML = async (filePath, url, $tag, srcName, newLink) => {
  const content = await getContent(url)
  if (content) {
    $tag.attr(srcName, newLink)
    await createFile(filePath, content)
  }
  return
}

const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html)
  const targetURLobj = new URL(targetURL)
  const arrayOfNodes = $('img, link, script').toArray()
  const promises = arrayOfNodes.map(async (element) => {
    const $tag = $(element)
    const src = $tag.attr(refTag[element.tagName])
    const httpSrc = getHTTPLinkToDownload(src, targetURLobj)
    if (httpSrc.length === 0) {
      return
    }
    logLoader(`content src from page = ${src}`)
    const contentUrl = new URL(httpSrc)
    const [newSrc, fileName] = makeLocalSrcLink(contentUrl, contentFolder)
    const fullPath = path.join(contentPath, fileName)
    logLoader(`stored content file: ${newSrc}`)
    return downloadAndUpdateHTML(fullPath, contentUrl.href, $tag, refTag[element.tagName], newSrc)
  })
  await Promise.allSettled(promises)
  return $.html()
}

export default downloadContent
export { contentType, refTag }
