import fs from 'fs/promises';

const createFile = async (filePath, fileData) => {
  console.log('mark!! in createFile');
  await fs.writeFile(filePath, fileData);
};

const isExistedFolder = async (userPath) => {
  try {
    await fs.access(userPath, fs.constants.R_OK);
  } catch (err) {
    console.error('User filled in the non-existed path to save a page');
    throw new Error('Non-existed folder!');
  }
};

const createFolderIfNecessary = async (folderPath) => {
  try {
    await fs.access(folderPath, fs.constants.R_OK);
  } catch (err) {
    await fs.mkdir(folderPath, { recursive: true });
  }
};

export { createFile, isExistedFolder, createFolderIfNecessary };
