import axios from 'axios'

if (process.env.DEBUG?.includes('axios')) {
  const { addLogger } = await import('axios-debug-log')
  addLogger(axios)
}

const getHTML = async (url) => {
  try {
    const response = await axios.get(url)
    return response.data
  }
  catch {
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
  catch {
    console.error(`Content for ${contentUrl} could not be loaded`)
    throw new Error('Content loading error!')
  }
}

export { getHTML, getContent }
