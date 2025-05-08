/**
 * Centralized logger configuration
 * This file configures the logger and exports it for use across the application
 */
const logger = require("lognexus");

// Determine environment
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

/**
 * Configure the logger based on environment
 */
const {
  logger: log,
  morgan,
  clearCache,
} = logger.init({
  // AWS Configuration
  awsConfig: {
    bucketName: process.env.AWS_S3_BUCKET_NAME || "app-logs",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "ap-south-1",
  },

  // Application identifier
  appType: process.env.APP_NAME || "api-server",

  // Always capture console methods
  consoleOverride: true,

  // HTTP request logging format
  // In production, use a more concise format
  morganFormat: isProd
    ? ":remote-addr :method :url :status :response-time ms"
    : ":date[iso] :method :url :status :response-time ms :referrer :user-agent",

  // Logger configuration
  winstonConfig: {
    // In production, only log info and above
    // In development, log everything
    level: isProd ? "info" : "debug",
    handleExceptions: true,
    handleRejections: true,
  },

  // S3 configuration
  s3Config: {
    folder: `logs/${NODE_ENV}/${process.env.APP_NAME || "api-server"}/`,
    nameFormat: `%Y-%m-%d-${
      process.env.APP_NAME || "api-server"
    }-${NODE_ENV}.log`,
    rotateEvery: isProd ? "1d" : "12h",
    maxFileSize: isProd ? 10 * 1024 * 1024 : 5 * 1024 * 1024, // 10MB prod, 5MB dev
    uploadEvery: isProd ? 60 * 60 * 1000 : 2 * 60 * 60 * 1000, // 1h prod, 2h dev
    compress: isProd,
  },

  // Memory management
  cacheInterval: isProd ? 3 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000, // 3h prod, 6h dev

  // Feature flags
  enableConsoleLogging: true,
  enableS3Logging: isProd || process.env.ENABLE_S3_LOGS === "true",
  enableUnhandledErrorLogging: true,
});

// Initial application log
log.info(`Logger initialized in ${NODE_ENV} environment`);

// Export the configured logger for use in other files
module.exports = {
  log,
  morgan,
  clearCache,
  env: NODE_ENV,
  isProd,
};
