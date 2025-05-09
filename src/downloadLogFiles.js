const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");
const { promisify } = require("util");

const gunzip = promisify(zlib.gunzip);

/**
 * Downloads and decompresses log files from an S3 bucket to a local directory.
 *
 * @async
 * @function downloadS3Logs
 * @param {string} s3Prefix - The S3 folder prefix (e.g., 'logs/service/').
 * @param {string} localDownloadDir - The local directory where logs will be saved.
 * @throws Will throw an error if AWS credentials, bucket name, or parameters are missing or if the download/decompression fails.
 */
const downloadS3Logs = async (s3Prefix, localDownloadDir) => {
  if (!s3Prefix || !localDownloadDir) {
    throw new Error(
      "Both S3 prefix and local download directory are required."
    );
  }

  if (!fs.existsSync(localDownloadDir)) {
    fs.mkdirSync(localDownloadDir, { recursive: true });
  }

  const region = global.awsConfig?.region || process.env.AWS_REGION;
  const accessKeyId =
    global.awsConfig?.accessKeyId || process.env.AWS_S3_ACCESS_KEY_ID;
  const secretAccessKey =
    global.awsConfig?.secretAccessKey || process.env.AWS_S3_SECRET_ACCESS_KEY;
  const bucket = global.awsConfig?.bucketName || process.env.AWS_S3_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing AWS S3 configuration.");
  }

  const S3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: s3Prefix,
    });
    const data = await S3.send(listCommand);

    if (!data.Contents || data.Contents.length === 0) {
      throw new Error("No log files found at the specified S3 location.");
    }

    for (const file of data.Contents) {
      const key = file.Key;
      const baseName = path.basename(key);
      const decompressedPath = path.join(
        localDownloadDir,
        baseName + ".decompressed"
      );

      if (fs.existsSync(decompressedPath)) {
        console.log(`Skipping ${key} (already decompressed)`);
        continue;
      }

      console.log(`Downloading and decompressing: ${key}`);
      try {
        const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await S3.send(getCommand);

        const chunks = [];
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const decompressedData = await gunzip(buffer);
        await fs.promises.writeFile(decompressedPath, decompressedData);
        console.log(`Saved decompressed file: ${decompressedPath}`);
      } catch (err) {
        console.warn(`Failed to decompress or download ${key}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Error during log download:", err);
    throw err;
  }
};

module.exports = downloadS3Logs;
