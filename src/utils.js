import path from 'node:path'
import _ from 'lodash'

const getHTTPLinkToDownload = (src, targetURLobj) => {
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

const makeLocalSrcLink = (contentUrl, contentFolder) => {
  const extentionOrNull = path.extname(contentUrl.pathname).replace('.', '')
  const extention = extentionOrNull || 'html'
  const URLWithoutExt = extention === 'html' ? contentUrl.href : contentUrl.href.substring(0, contentUrl.href.lastIndexOf('.'))
  const withoutHTTP = URLWithoutExt.substring(URLWithoutExt.indexOf('//') + 2)
  const fileName = `${_.replace(withoutHTTP, /[^0-9a-zA-Z]/g, '-')}.${extention}`
  return [`${contentFolder}/${fileName}`, fileName]
}

export { getHTTPLinkToDownload, makeLocalSrcLink }
