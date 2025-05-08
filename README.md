# Lognexus: Your All-in-One Node.js Logging Solution

Hey there, developer! Welcome to **Lognexus**, a powerful and flexible logging library for Node.js that makes logging a breeze. Whether you're building an Express app, streaming logs to AWS S3, or just want to capture `console.log` calls, Lognexus has you covered with Winston, Morgan, and S3 integration—all in one tidy package.

## Why Lognexus?

Lognexus is designed to simplify logging in your Node.js projects. Here’s what makes it awesome:

- **All-in-One Logging**: Combine console, file, and S3 logging seamlessly.
- **HTTP Logging**: Built-in Morgan middleware for tracking API requests.
- **S3 Streaming**: Send logs straight to AWS S3 for centralized storage.
- **Console Hijacking**: Automatically capture `console.log`, `console.error`, and more.
- **Error Handling**: Catch uncaught exceptions and promise rejections like a pro.
- **Super Configurable**: Tweak settings via code or environment variables.
- **Memory Friendly**: Optional cache clearing to keep things lightweight.
- **Express Ready**: Plug it into your Express app in minutes.

## Getting Started

### Installation

First, install Lognexus via npm:

```bash
npm install @your-username/lognexus
```

### Quick Example

Here’s how to get logging up and running in an Express app:

```javascript
const logger = require("@your-username/lognexus");
const express = require("express");

const { logger: winstonLogger, morgan } = logger.init();

// Set up Express
const app = express();

// Add Morgan for HTTP request logging
app.use(morgan);

// Log something
winstonLogger.info("App is up and running!");

// Even console.log gets logged to Winston and S3
console.log("This goes to the console AND S3!");

app.listen(3000, () => console.log("Server running on port 3000"));
```

## Setup Made Simple

Lognexus is highly configurable. Here’s a basic setup with AWS S3 logging:

```javascript
const logger = require("@your-username/lognexus");

const { logger: winstonLogger, morgan } = logger.init({
  awsConfig: {
    bucketName: "my-logs-bucket",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: "ap-south-1",
  },
  appType: "production",
  morganFormat: ":method :url :status :response-time ms",
});

winstonLogger.info("Logger initialized with S3 streaming!");
```

### Real-World Example

For a production-ready setup, you can pull configs from environment variables and fine-tune everything:

```javascript
const logger = require("@your-username/lognexus");

const isProd = process.env.NODE_ENV === "production";

const { logger: log, morgan } = logger.init({
  awsConfig: {
    bucketName: process.env.AWS_S3_BUCKET_NAME || "app-logs",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "ap-south-1",
  },
  appType: process.env.APP_NAME || "api-server",
  consoleOverride: true,
  morganFormat: isProd
    ? ":remote-addr :method :url :status :response-time ms"
    : ":method :url :status :response-time ms :referrer",
  winstonConfig: {
    level: isProd ? "info" : "debug",
    handleExceptions: true,
    handleRejections: true,
  },
  s3Config: {
    folder: `logs/${process.env.NODE_ENV}/${
      process.env.APP_NAME || "api-server"
    }/`,
    nameFormat: `%Y-%m-%d-${process.env.APP_NAME || "api-server"}.log`,
    rotateEvery: "1d",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadEvery: 60 * 60 * 1000, // 1 hour
    compress: isProd,
  },
  cacheInterval: 3 * 60 * 60 * 1000, // Clear cache every 3 hours
  enableConsoleLogging: true,
  enableS3Logging: isProd,
  enableUnhandledErrorLogging: true,
});

module.exports = { log, morgan };
```

## Configuration Options

Lognexus is packed with options to fit your needs. Here’s a rundown of the key ones:

| Option                        | Type    | Description                  | Default                               |
| ----------------------------- | ------- | ---------------------------- | ------------------------------------- |
| `awsConfig.bucketName`        | String  | S3 bucket for logs           | `AWS_S3_BUCKET_NAME` or 'logs-bucket' |
| `awsConfig.accessKeyId`       | String  | AWS access key ID            | `AWS_ACCESS_KEY_ID`                   |
| `awsConfig.secretAccessKey`   | String  | AWS secret access key        | `AWS_SECRET_ACCESS_KEY`               |
| `awsConfig.region`            | String  | AWS region                   | `AWS_REGION` or 'us-east-1'           |
| `appType`                     | String  | App identifier               | `APP_TYPE` or 'development'           |
| `consoleOverride`             | Boolean | Capture console methods      | `true`                                |
| `morganFormat`                | String  | Morgan logging format        | Detailed format                       |
| `winstonConfig.level`         | String  | Logging level                | 'info'                                |
| `s3Config.folder`             | String  | S3 folder path               | `logs/${appType}/`                    |
| `s3Config.nameFormat`         | String  | Log file name format         | `%Y-%m-%d-%H-%M-${appType}-error.log` |
| `s3Config.rotateEvery`        | String  | Log rotation period          | '1h'                                  |
| `s3Config.maxFileSize`        | Number  | Max log file size (bytes)    | 5MB                                   |
| `s3Config.uploadEvery`        | Number  | S3 upload interval (ms)      | 3 hours                               |
| `s3Config.compress`           | Boolean | Compress log files           | `true`                                |
| `cacheInterval`               | Number  | Cache clearing interval (ms) | 3 hours                               |
| `enableConsoleLogging`        | Boolean | Enable console logging       | `true`                                |
| `enableS3Logging`             | Boolean | Enable S3 logging            | `true`                                |
| `enableUnhandledErrorLogging` | Boolean | Enable global error handlers | `true`                                |

## Environment Variables

Prefer environment variables? Lognexus supports them for easy configuration:

- **AWS**:
  - `AWS_S3_BUCKET_NAME`: S3 bucket for logs.
  - `AWS_ACCESS_KEY_ID`: AWS access key.
  - `AWS_SECRET_ACCESS_KEY`: AWS secret key.
  - `AWS_REGION`: AWS region (default: 'us-east-1').
- **App**:
  - `APP_TYPE`: App identifier (default: 'development').
  - `ENABLE_CONSOLE_LOGGING`: Set to 'false' to disable console logs.
  - `ENABLE_S3_LOGGING`: Set to 'false' to disable S3 logging.
  - `ENABLE_UNHANDLED_ERROR_LOGGING`: Set to 'false' to disable error handlers.
- **S3 Logging**:
  - `S3_LOG_FOLDER`: S3 folder path.
  - `S3_LOG_NAME_FORMAT`: Log file name format.
  - `S3_LOG_ROTATE_EVERY`: Rotation period (default: '1h').
  - `S3_LOG_MAX_FILE_SIZE`: Max file size (bytes, default: 5MB).
  - `S3_LOG_UPLOAD_EVERY`: Upload interval (ms, default: 3 hours).
  - `S3_LOG_COMPRESS`: Set to 'false' to disable compression.

## AWS Permissions for S3

To stream logs to S3, your AWS credentials need these permissions:

- `s3:PutObject`
- `s3:GetObject`
- `s3:ListBucket`

## Contributing

We’d love your help to make Lognexus even better! Here’s how to contribute:

1. Fork the repo: `https://github.com/shivammaharaz/lognexus.git`.
2. Create a feature branch: `git checkout -b feature/cool-new-thing`.
3. Commit your changes: `git commit -m 'Add cool new thing'`.
4. Push to the branch: `git push origin feature/cool-new-thing`.
5. Open a Pull Request.

## License

Lognexus is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Happy logging, and let us know if you have questions or ideas to share!
