import fs from 'fs/promises';

const createFile = async (filePath, fileData) => {
  await fs.writeFile(filePath, fileData);
};

const isExistedFolder = async (userPath) => {
  try {
    await fs.access(userPath, fs.constants.R_OK);
  } catch (err) {
    throw new Error('Non-existed path!');
  }
};

export { createFile, isExistedFolder };
