const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

function createClient(bucketConfig) {
  return new S3Client({
    region: bucketConfig.region,
    credentials: {
      accessKeyId: bucketConfig.accessKey,
      secretAccessKey: bucketConfig.secretKey
    }
  });
}

async function uploadFile(fileBuffer, fileName, bucketConfig) {
  try {
    const client = createClient(bucketConfig);

    await client.send(
      new PutObjectCommand({
        Bucket: bucketConfig.bucketName,
        Key: fileName,
        Body: fileBuffer
      })
    );

    return `${bucketConfig.publicBaseUrl}/${fileName}`;
  } catch (err) {
    throw err;
  }
}

async function deleteFile(fileUrl, bucketConfig) {
  try {
    const client = createClient(bucketConfig);
    const key = fileUrl.split('/').pop();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketConfig.bucketName,
        Key: key
      })
    );

    return true;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  uploadFile,
  deleteFile
};
