import axios from 'axios';

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
      responseType: 'arraybuffer',
    });
    const fileData = Buffer.from(response.data, 'binary');
    return fileData;
  } catch (error) {
    console.log(error);
    throw new Error('Something went wrong!');
  }
};

export { getHTML, getContent };
