const fs = require('fs');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const trimTrailingSlash = (value) => (value || '').replace(/\/+$/, '').trim();
const parseBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const config = {
  bucketName:
    process.env.RAILWAY_BUCKET_NAME ||
    process.env.BUCKET_NAME ||
    process.env.S3_BUCKET ||
    '',
  endpoint:
    process.env.RAILWAY_BUCKET_ENDPOINT ||
    process.env.BUCKET_ENDPOINT ||
    process.env.S3_ENDPOINT ||
    '',
  region:
    process.env.RAILWAY_BUCKET_REGION ||
    process.env.BUCKET_REGION ||
    process.env.S3_REGION ||
    'auto',
  accessKeyId:
    process.env.RAILWAY_BUCKET_ACCESS_KEY_ID ||
    process.env.BUCKET_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    '',
  secretAccessKey:
    process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY ||
    process.env.BUCKET_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    '',
  forcePathStyle: parseBool(
    process.env.RAILWAY_BUCKET_FORCE_PATH_STYLE || process.env.S3_FORCE_PATH_STYLE,
    true
  ),
};

const bucketEnabled = Boolean(
  config.bucketName &&
    config.endpoint &&
    config.accessKeyId &&
    config.secretAccessKey
);

let s3Client = null;
if (bucketEnabled) {
  s3Client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

const ensureLocalUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

const uploadBuffer = async ({ key, buffer, contentType }) => {
  if (bucketEnabled) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      })
    );
    return;
  }

  ensureLocalUploadsDir();
  fs.writeFileSync(path.join(UPLOADS_DIR, key), buffer);
};

const listFiles = async () => {
  if (bucketEnabled) {
    const result = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
      })
    );
    return (result.Contents || [])
      .filter((obj) => obj.Key)
      .map((obj) => ({
        key: obj.Key,
        size: obj.Size || 0,
        createdAt: obj.LastModified || null,
      }));
  }

  ensureLocalUploadsDir();
  return fs.readdirSync(UPLOADS_DIR).map((filename) => {
    const stat = fs.statSync(path.join(UPLOADS_DIR, filename));
    return {
      key: filename,
      size: stat.size,
      createdAt: stat.birthtime,
    };
  });
};

const deleteFile = async (key) => {
  if (bucketEnabled) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );
    return;
  }

  const filePath = path.join(UPLOADS_DIR, key);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
};

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const getFile = async (key) => {
  if (bucketEnabled) {
    try {
      const result = await s3Client.send(
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        })
      );
      if (!result.Body) {
        return null;
      }
      const buffer = await streamToBuffer(result.Body);
      return {
        buffer,
        contentType: result.ContentType || null,
        size: result.ContentLength || buffer.length,
      };
    } catch (error) {
      const statusCode = error?.$metadata?.httpStatusCode;
      if (statusCode === 404 || error?.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  const filePath = path.join(UPLOADS_DIR, key);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  return {
    buffer,
    contentType: null,
    size: buffer.length,
  };
};

module.exports = {
  UPLOADS_DIR,
  bucketEnabled,
  ensureLocalUploadsDir,
  uploadBuffer,
  listFiles,
  deleteFile,
  getFile,
};
