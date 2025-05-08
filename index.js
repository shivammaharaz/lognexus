/**
 * Advanced Node Logger
 * A comprehensive logging solution with Winston, Morgan and S3 streaming capabilities
 */

const winstonLogger = require('./src/winstonLogger');
const morganMiddleware = require('./src/morganMiddleware');
const s3Stream = require('./src/s3Stream');
const serverCache = require('./src/serverCache');

/**
 * Initialize the logger with custom options
 * @param {Object} options - Configuration options
 * @param {Object} options.awsConfig - AWS S3 configuration
 * @param {String} options.awsConfig.bucketName - S3 bucket name
 * @param {String} options.awsConfig.accessKeyId - AWS access key ID
 * @param {String} options.awsConfig.secretAccessKey - AWS secret access key
 * @param {String} options.awsConfig.region - AWS region
 * @param {String} options.appType - Application type identifier
 * @param {Boolean} options.consoleOverride - Whether to override console methods
 * @param {String} options.morganFormat - Custom Morgan format string
 * @param {Object} options.winstonConfig - Custom Winston configuration
 * @param {Number} options.cacheInterval - Cache clearing interval in milliseconds
 * @param {Object} options.s3Config - Additional S3 streaming configuration
 * @param {String} options.s3Config.folder - S3 folder path for logs
 * @param {String} options.s3Config.nameFormat - Format for log file names
 * @param {String} options.s3Config.rotateEvery - Rotation period ('1h', '1d', etc.)
 * @param {Number} options.s3Config.maxFileSize - Maximum file size in bytes
 * @param {Number} options.s3Config.uploadEvery - Upload interval in milliseconds
 * @param {Boolean} options.s3Config.compress - Whether to compress log files
 * @param {Boolean} options.enableConsoleLogging - Whether to enable console transport
 * @param {Boolean} options.enableS3Logging - Whether to enable S3 streaming
 * @param {Boolean} options.enableUnhandledErrorLogging - Whether to set up global error handlers
 * @returns {Object} - The logger instance
 */
function init(options = {}) {
  const defaults = {
    awsConfig: {
      bucketName: process.env.AWS_S3_BUCKET_NAME || 'logs-bucket',
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    },
    appType: process.env.APP_TYPE || 'development',
    consoleOverride: true,
    morganFormat: ':date[iso] :method :url :status :response-time ms :referrer :remote-addr :user-agent :remote-user',
    winstonConfig: {},
    cacheInterval: 3 * 60 * 60 * 1000, // 3 hours
    s3Config: {
      folder: process.env.S3_LOG_FOLDER || `logs/${process.env.APP_TYPE || 'development'}/`,
      nameFormat: process.env.S3_LOG_NAME_FORMAT || `%Y-%m-%d-%H-%M-${process.env.APP_TYPE || 'development'}-error.log`,
      rotateEvery: process.env.S3_LOG_ROTATE_EVERY || '1h',
      maxFileSize: parseInt(process.env.S3_LOG_MAX_FILE_SIZE || (1024 * 1024 * 5)), // 5 MB
      uploadEvery: parseInt(process.env.S3_LOG_UPLOAD_EVERY || (3 * 60 * 60 * 1000)), // 3 hours
      compress: process.env.S3_LOG_COMPRESS !== 'false'
    },
    enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableS3Logging: process.env.ENABLE_S3_LOGGING !== 'false',
    enableUnhandledErrorLogging: process.env.ENABLE_UNHANDLED_ERROR_LOGGING !== 'false'
  };

  // Merge options with defaults
  const config = {
    ...defaults,
    ...options,
    awsConfig: {
      ...defaults.awsConfig,
      ...(options.awsConfig || {})
    },
    winstonConfig: {
      ...defaults.winstonConfig,
      ...(options.winstonConfig || {})
    },
    s3Config: {
      ...defaults.s3Config,
      ...(options.s3Config || {})
    }
  };

  // Initialize the cache clearing interval if enabled
  if (config.cacheInterval) {
    serverCache.initCacheClear(config.cacheInterval);
  }

  // Set global constants for S3Stream
  global.APP_TYPE = config.appType;
  global.awsCred = {
    awsS3BucketId: config.awsConfig.accessKeyId,
    awsBucketNameForLogs: config.awsConfig.bucketName,
    awsS3BucketSecret: config.awsConfig.secretAccessKey,
    region: config.awsConfig.region
  };
  
  // Set S3 stream config
  const s3StreamConfig = {
    bucket: config.awsConfig.bucketName,
    access_key_id: config.awsConfig.accessKeyId,
    secret_access_key: config.awsConfig.secretAccessKey,
    region: config.awsConfig.region,
    folder: config.s3Config.folder,
    name_format: config.s3Config.nameFormat,
    rotate_every: config.s3Config.rotateEvery,
    max_file_size: config.s3Config.maxFileSize,
    upload_every: config.s3Config.uploadEvery,
    compress: config.s3Config.compress
  };

  // Get S3 stream if S3 logging is enabled
  let s3LogStream = null;
  if (config.enableS3Logging) {
    s3LogStream = s3Stream.getStream(s3StreamConfig);
  }

  // Initialize Winston logger with configuration
  const logger = winstonLogger.createLogger({
    ...config.winstonConfig,
    enableConsoleLogging: config.enableConsoleLogging,
    enableS3Logging: config.enableS3Logging,
    s3Stream: s3LogStream,
    enableUnhandledErrorLogging: config.enableUnhandledErrorLogging
  }, config.consoleOverride);

  // Initialize Morgan middleware with the logger
  const morgan = morganMiddleware.create(config.morganFormat, logger);

  return {
    logger,
    morgan,
    s3Stream: s3LogStream,
    clearCache: serverCache.clearCache,
    config // Return the merged config for reference
  };
}

module.exports = {
  init,
  // Export individual components for advanced usage
  winstonLogger,
  morganMiddleware,
  s3Stream,
  serverCache
};