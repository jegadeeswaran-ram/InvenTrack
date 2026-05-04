const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let s3Client = null;

if (env.USE_S3) {
  s3Client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

const ensureLocalDir = () => {
  const dir = path.resolve(env.LOCAL_UPLOAD_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * Upload a file buffer.
 * @param {Buffer} buffer
 * @param {string} filename  - unique filename with extension
 * @param {string} mimetype
 * @returns {Promise<string>} public URL
 */
const uploadFile = async (buffer, filename, mimetype) => {
  if (env.USE_S3) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    const base = (env.S3_PUBLIC_URL || env.S3_ENDPOINT).replace(/\/+$/, '');
    return `${base}/${filename}`;
  }

  const dir = ensureLocalDir();
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/static/${filename}`;
};

module.exports = { uploadFile };
