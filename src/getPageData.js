import { createRequire } from 'module'
import axios from 'axios'

const require = createRequire(import.meta.url)
require('axios-debug-log')

const getHTML = async (url) => {
  try {
    const response = await axios.get(url)
    return response.data
  }
  catch (error) {
    console.error(error)
    console.error(`HTML page for ${url} could not be loaded`)
    throw new Error('HTML loading error!')
  }
}

const getContent = async (contentUrl) => {
  try {
    const response = await axios({
      method: 'get',
      url: contentUrl,
      responseType: 'arraybuffer',
    })
    const fileData = Buffer.from(response.data, 'binary')
    return fileData
  }
  catch (error) {
    console.error(error)
    console.error(`Content for ${contentUrl} could not be loaded`)
    throw new Error('Content loading error!');
  }
}

export { getHTML, getContent }
