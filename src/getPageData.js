import { fileURLToPath } from 'url';
import axios from 'axios';
import nock from 'nock';
import fs from 'fs/promises';
import path, { dirname }  from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const savePath = path.join(__dirname, '..', 'output' , 'downloaded_image.jpg');

const getHTML = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error('Something went wrong!');
  }
};

const getContent = async (contentUrl) => {
  try {
    const response = await axios({
      method: 'get',
      url: contentUrl,
      responseType: 'arraybuffer'
    });
    const fileData = Buffer.from(response.data, 'binary');
    return fileData;
  } catch (error) {
    console.log(error);
    throw new Error('Something went wrong!');
  }
};

export { getHTML, getContent };
