import * as cheerio from 'cheerio'
import _ from 'lodash'
import path from 'path'
import debug from 'debug'
import { getContent } from './getPageData.js'
import { createFile } from './handleFilesTasks.js'

const contentType = ['img', 'link', 'script']

const refTag = {
  img: 'src',
  link: 'href',
  script: 'src',
}

const logLoader = debug('page-loader')

const generateLocalSrcLink = (contentUrl, contentFolder) => {
  const extentionOrNull = path.extname(contentUrl.pathname).replace('.','')
  const extention = !extentionOrNull ? 'html' : extentionOrNull
  const URLWithoutExt = extention === 'html' ? contentUrl.href : contentUrl.href.substring(0, contentUrl.href.lastIndexOf('.'))
  const withoutHTTP = URLWithoutExt.substring(URLWithoutExt.indexOf('//') + 2)
  const fileName = `${_.replace(withoutHTTP, /[^0-9a-zA-Z]/g, '-')}.${extention}`
  return [`${contentFolder}/${fileName}`, fileName]
}

const getHTTPSrcLink = (src, targetURLobj) => {
  if (!src) {
    return ''
  }
  if (src.includes(targetURLobj.origin)) {
    return src
  }
  if (!src.includes('http')) {
    const contentUrl = new URL(src, targetURLobj.origin)
    return contentUrl.href
  }
  return ''
}

const resolveAndSave = async (filePath, url, $tag, srcName, newLink) => {
  const content = await getContent(url)
  if (content) {
    $tag.attr(srcName, newLink)
    await createFile(filePath, content)
  }
  return
  /*if (!content) {
    console.log(`Content is empty! content url = ${url}`)
  }
  else {
    $tag.attr(srcName, newLink)
    await createFile(filePath, content)
  }*/
}

const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
  const $ = cheerio.load(html)
  const targetURLobj = new URL(targetURL)
  const httpPromises = contentType.reduce((acc, tag) => {
    const arrayOfNodes = $(tag).toArray()
    const promises = arrayOfNodes.map((element) => {
      const $tag = $(element)
      const src = $tag.attr(refTag[tag])
      const httpSrc = getHTTPSrcLink(src, targetURLobj)
      if (httpSrc.length === 0) {
        return null
      }
      logLoader(`content src from page = ${src}`)
      const contentUrl = new URL(httpSrc)
      const [newSrc, fileName] = generateLocalSrcLink(contentUrl, contentFolder)
      const fullPath = path.join(contentPath, fileName)
      logLoader(`stored content file: ${newSrc}`)
      return resolveAndSave(fullPath, contentUrl.href, $tag, refTag[tag], newSrc)
    })
      .filter(item => item !== null)
    return [...acc, ...promises]
  }, [])
  await Promise.all(httpPromises)
  return $.html()
}

export default downloadContent
export { contentType, refTag }
