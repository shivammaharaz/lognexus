const { S3StreamLogger } = require("s3-streamlogger");

let _s3Stream = null;

/**
 * Creates an S3 stream logger instance or returns a cached one
 * @param {Object} config - Optional configuration to override defaults
 * @param {String} config.bucket - S3 bucket name
 * @param {String} config.access_key_id - AWS access key ID
 * @param {String} config.secret_access_key - AWS secret access key
 * @param {String} config.region - AWS region
 * @param {String} config.folder - S3 folder path for logs
 * @param {String} config.name_format - Format for log file names
 * @param {String} config.rotate_every - Rotation period ('1h', '1d', etc.)
 * @param {Number} config.max_file_size - Maximum file size in bytes
 * @param {Number} config.upload_every - Upload interval in milliseconds
 * @param {Boolean} config.compress - Whether to compress log files
 * @returns {Object} - S3StreamLogger instance
 */
function getStream(config = {}) {
  if (_s3Stream && Object.keys(config).length === 0 && !config.forceRefresh) {
    return _s3Stream;
  }

  const awsCred = global.awsCred || {
    awsS3BucketId: process.env.AWS_S3_ACCESS_KEY_ID,
    awsBucketNameForLogs: process.env.AWS_S3_BUCKET_NAME || "logs-bucket",
    awsS3BucketSecret: process.env.AWS_S3_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
  };

  const APP_TYPE = global.APP_TYPE || process.env.APP_TYPE || "development";

  const defaultConfig = {
    bucket: awsCred.awsBucketNameForLogs,
    access_key_id: awsCred.awsS3BucketId,
    secret_access_key: awsCred.awsS3BucketSecret,
    region: awsCred.region || process.env.AWS_REGION || "ap-south-1",
    folder: process.env.S3_LOG_FOLDER || `logs/${APP_TYPE}/`,
    name_format:
      process.env.S3_LOG_NAME_FORMAT || `%Y-%m-%d-%H-%M-${APP_TYPE}-error.log`,
    rotate_every: process.env.S3_LOG_ROTATE_EVERY || "1h",
    max_file_size: parseInt(
      process.env.S3_LOG_MAX_FILE_SIZE || 1024 * 1024 * 5
    ), // 5 MB
    upload_every: parseInt(
      process.env.S3_LOG_UPLOAD_EVERY || 3 * 60 * 60 * 1000
    ), // 3 hours
    compress: process.env.S3_LOG_COMPRESS !== "false",
  };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
  };

  if (!mergedConfig.bucket) {
    console.warn("S3StreamLogger: No bucket specified. S3 logging disabled.");
    return null;
  }

  if (!mergedConfig.access_key_id || !mergedConfig.secret_access_key) {
    console.warn(
      "S3StreamLogger: Missing AWS credentials. S3 logging disabled."
    );
    return null;
  }

  try {
    _s3Stream = new S3StreamLogger(mergedConfig);
    return _s3Stream;
  } catch (error) {
    console.error("S3StreamLogger: Failed to create S3 stream:", error);
    return null;
  }
}

function resetStream() {
  _s3Stream = null;
}

module.exports = {
  getStream,
  resetStream,
};
