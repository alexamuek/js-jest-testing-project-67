//import axios from 'axios';
import process from 'node:process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('axios-debug-log');
const axios = require('axios');

const getHTML = async (url) => {
  try {
    const response = await axios.get(url);
    if (response.statusText != 'OK') {
      throw new Error('Status!!');  
    }
    return response.data;
  } catch (error) {
    console.error(`HTML page could not be loading, \n url = ${url}`);
    throw new Error('HTML loading error!');
  }
};

const getContent = async (contentUrl) => {
  try {
    const response = await axios({
      method: 'get',
      url: contentUrl,
      responseType: 'arraybuffer',
    });
    console.log('responce = ', response.status, contentUrl );
    if (response.statusText != 'OK') {
      throw new Error('Status!!');  
    }
    const fileData = Buffer.from(response.data, 'binary');
    return fileData;
  } catch (error) {
    console.log('contentUrl = ', contentUrl);
    console.error(`Content could not be loading, \n url = ${contentUrl}`);
    throw new Error('Content loading error!');
  }
};

export { getHTML, getContent };
