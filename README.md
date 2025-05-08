# Advanced Node Logger

A robust Node.js logging library with Winston, Morgan HTTP logging, AWS S3 streaming, and console overrides. Configurable, extensible, and production-ready.

## Features

- **Unified Logging System** - Combine console, file, and S3 bucket logging in one solution
- **HTTP Request Logging** - Integrated Morgan middleware for detailed API request tracking
- **AWS S3 Integration** - Stream logs directly to S3 buckets for centralized storage
- **Console Method Overrides** - Automatically capture all console.log/error/info calls
- **Global Error Handling** - Catch and log uncaught exceptions and unhandled promise rejections
- **Highly Configurable** - Extensive options via code or environment variables
- **Memory Management** - Optional periodic cache clearing and garbage collection
- **Express.js Compatible** - Seamless integration with Express applications

## Installation

```bash
npm install
```

## Quick Start

```javascript
const logger = require("lognexus");
const express = require("express");

// Initialize with default settings (reads from environment variables)
const { logger: winstonLogger, morgan } = logger.init();

// Create Express app
const app = express();

// Add Morgan middleware for HTTP logging
app.use(morgan);

// Use the logger directly
winstonLogger.info("Application started");

// Console methods are automatically logged via Winston and S3
console.log("This will be logged to the console AND S3");
```

## Basic Configuration

```javascript
const logger = require("lognexus");

const { logger: winstonLogger, morgan } = logger.init({
  // AWS Configuration
  awsConfig: {
    bucketName: "my-logs-bucket",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: "ap-south-1",
  },

  // Application identifier
  appType: "production",

  // Morgan HTTP logging format
  morganFormat: ":method :url :status :response-time ms",
});
```

## Complete Configuration

Here's a real-world configuration example:

```javascript
// logger-config.js - Centralized logger configuration
const logger = require('lognexus');

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Configure and export the logger
const { logger: log, morgan } = logger.init({
  // AWS Configuration
  awsConfig: {
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'app-logs',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
  },

  // Application identifier
  appType: process.env.APP_NAME || 'api-server',

  // Always capture console methods
  consoleOverride: true,

  // HTTP request logging - simpler in production
  morganFormat: isProd
    ? ':remote-addr :method :url :status :response-time ms'
    : ':method :url :status :response-time ms :referrer',

  // Logger configuration
  winstonConfig: {
    level: isProd ? 'info' : 'debug',
    handleExceptions: true,
    handleRejections: true
  },

  // S3 configuration
  s3Config: {
    folder: `logs/${NODE_ENV}/${process.env.APP_NAME || 'api-server'}/`,
    nameFormat: `%Y-%m-%d-${process.env.APP_NAME || 'api-server'}.log`,
    rotateEvery: '1d',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadEvery: 60 * 60 * 1000,    // 1 hour
    compress: isProd
  },

  // Memory management
  cacheInterval: 3 * 60 * 60 * 1000, // 3 hours

  // Feature flags
  enableConsoleLogging: true,
  enableS3Logging: isProd,
  enableUnhandledErrorLogging: true
});

// Export the configured logger
module.exports = { log, morgan };
    transports: [
      // Add custom transports here
    ]
  },

  // S3 Streaming Configuration
  s3Config: {
    folder: 'logs/production/api/',
    nameFormat: '%Y-%m-%d-%H-%M-api-production-error.log',
    rotateEvery: '1d',
    maxFileSize: 1024 * 1024 * 10, // 10 MB
    uploadEvery: 1 * 60 * 60 * 1000, // 1 hour
    compress: true
  },

  // Cache Management
  cacheInterval: 1800000, // Clear cache every 30 minutes

  // Feature Flags
  enableConsoleLogging: true,
  enableS3Logging: true,
  enableUnhandledErrorLogging: true
});
```

## Configuration Options

| Option                        | Type    | Description                         | Default                               |
| ----------------------------- | ------- | ----------------------------------- | ------------------------------------- |
| `awsConfig.bucketName`        | String  | S3 bucket name for logs             | From env or 'logs-bucket'             |
| `awsConfig.accessKeyId`       | String  | AWS access key ID                   | From env                              |
| `awsConfig.secretAccessKey`   | String  | AWS secret access key               | From env                              |
| `awsConfig.region`            | String  | AWS region                          | From env or 'us-east-1'               |
| `appType`                     | String  | Application type identifier         | From env or 'development'             |
| `consoleOverride`             | Boolean | Whether to override console methods | `true`                                |
| `morganFormat`                | String  | Custom Morgan format string         | Detailed format                       |
| `winstonConfig`               | Object  | Custom Winston configuration        | Default Winston config                |
| `winstonConfig.level`         | String  | Logging level                       | 'info'                                |
| `winstonConfig.format`        | Object  | Winston format object               | Combined format                       |
| `winstonConfig.transports`    | Array   | Winston transports                  | [Console, S3Stream]                   |
| `s3Config.folder`             | String  | S3 folder path for logs             | `logs/${appType}/`                    |
| `s3Config.nameFormat`         | String  | Format for log file names           | `%Y-%m-%d-%H-%M-${appType}-error.log` |
| `s3Config.rotateEvery`        | String  | Rotation period                     | '1h'                                  |
| `s3Config.maxFileSize`        | Number  | Maximum file size in bytes          | 5 MB                                  |
| `s3Config.uploadEvery`        | Number  | Upload interval in ms               | 3 hours                               |
| `s3Config.compress`           | Boolean | Whether to compress log files       | `true`                                |
| `cacheInterval`               | Number  | Cache clearing interval in ms       | 3 hours                               |
| `enableConsoleLogging`        | Boolean | Enable console transport            | `true`                                |
| `enableS3Logging`             | Boolean | Enable S3 streaming                 | `true`                                |
| `enableUnhandledErrorLogging` | Boolean | Set up global error handlers        | `true`                                |

## Environment Variables

You can configure the library using environment variables:

### AWS Configuration

- `AWS_S3_BUCKET_NAME`: S3 bucket name for logs
- `AWS_S3_ACCESS_KEY_ID`: AWS access key ID
- `AWS_S3_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region (default: 'us-east-1')

### Application Configuration

- `APP_TYPE`: Application type identifier (default: 'development')
- `ENABLE_CONSOLE_LOGGING`: Set to 'false' to disable console logging
- `ENABLE_S3_LOGGING`: Set to 'false' to disable S3 logging
- `ENABLE_UNHANDLED_ERROR_LOGGING`: Set to 'false' to disable global error handlers

### S3 Logging Configuration

- `S3_LOG_FOLDER`: S3 folder path for logs (default: `logs/${APP_TYPE}/`)
- `S3_LOG_NAME_FORMAT`: Format for log file names (default: `%Y-%m-%d-%H-%M-${APP_TYPE}-error.log`)
- `S3_LOG_ROTATE_EVERY`: Rotation period (default: '1h')
- `S3_LOG_MAX_FILE_SIZE`: Maximum file size in bytes (default: 5 MB)
- `S3_LOG_UPLOAD_EVERY`: Upload interval in milliseconds (default: 3 hours)
- `S3_LOG_COMPRESS`: Set to 'false' to disable compression

## Advanced Usage

### Using Components Individually

```javascript
const {
  winstonLogger,
  morganMiddleware,
  s3Stream,
  serverCache,
} = require("lognexus");

// Create custom logger
const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winstonLogger.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.timestamp(), customFormat),
});

// Create custom Morgan middleware
const morgan = morganMiddleware.create(":method :url :status", logger);

// Access S3 stream with custom configuration
const stream = s3Stream.getStream({
  folder: "custom/logs/path/",
  compress: false,
});

// Manually trigger cache clearing
serverCache.clearCache();
```

### Adding Custom Transports

```javascript
const winston = require("winston");
const { winstonLogger } = require("lognexus");
require("winston-daily-rotate-file");

// Add custom transports
const logger = winstonLogger.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});
```

## Required AWS Permissions

For S3 streaming to work, your AWS credentials must have the following permissions:

- `s3:PutObject`
- `s3:GetObject`
- `s3:ListBucket`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
