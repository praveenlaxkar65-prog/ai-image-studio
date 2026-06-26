const fs = require('fs/promises');
const path = require('path');

const UPLOAD_DIR = path.join(process.cwd(), 'backend', 'uploads');

async function uploadFile(fileBuffer, fileName) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.writeFile(filePath, fileBuffer);

    return `/uploads/${fileName}`;
  } catch (err) {
    throw err;
  }
}

async function deleteFile(fileUrl) {
  try {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.unlink(filePath);

    return true;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  uploadFile,
  deleteFile
};
