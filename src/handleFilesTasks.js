import fs from 'fs/promises'

const createFile = async (filePath, fileData) => {
  try {
    await fs.writeFile(filePath, fileData)
  }
  catch (error) {
    console.log(error)
    throw error
  }
}

const isExistedFolder = async (userPath) => {
  try {
    await fs.access(userPath, fs.constants.F_OK)
    await fs.readdir(userPath)
  }
  catch (error) {
    console.log(error)
    throw error
  }
}

const createFolderIfNecessary = async (folderPath) => {
  try {
    await fs.access(folderPath, fs.constants.R_OK)
  }
  catch {
    try {
      await fs.mkdir(folderPath, { recursive: true })
    }
    catch (error) {
      console.log(error)
      throw error
    }
  }
}

export { createFile, isExistedFolder, createFolderIfNecessary }
