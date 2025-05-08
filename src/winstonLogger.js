const winston = require('winston');
const s3Stream = require('./s3Stream');

/**
 * Creates a Winston logger instance with optional console method overrides
 * @param {Object} config - Winston configuration options
 * @param {String} config.level - Log level (default: 'info')
 * @param {Object} config.format - Winston format object
 * @param {Array} config.transports - Array of Winston transports
 * @param {Boolean} config.enableConsoleLogging - Whether to enable console transport
 * @param {Boolean} config.enableS3Logging - Whether to enable S3 streaming
 * @param {Object} config.s3Stream - Preconfigured S3 stream object
 * @param {Boolean} config.enableUnhandledErrorLogging - Whether to set up global error handlers
 * @param {Boolean} overrideConsole - Whether to override console methods
 * @returns {Object} - Winston logger instance
 */
function createLogger(config = {}, overrideConsole = true) {
    // Get configuration options
    const enableConsoleLogging = config.enableConsoleLogging !== false;
    const enableS3Logging = config.enableS3Logging !== false;
    const enableUnhandledErrorLogging = config.enableUnhandledErrorLogging !== false;
    const s3LogStream = config.s3Stream;
    
    // Default Winston configuration
    const defaultConfig = {
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(), 
            winston.format.json(), 
            winston.format.errors()
        ),
        transports: []
    };

    // Add console transport if enabled
    if (enableConsoleLogging) {
        defaultConfig.transports.push(new winston.transports.Console());
    }

    // Merge with custom config, but handle transports specially
    const userTransports = config.transports || [];
    const mergedConfig = {
        ...defaultConfig,
        ...config,
        // Filter out any explicitly provided transports that match the type we're conditionally adding
        transports: [
            ...defaultConfig.transports,
            ...userTransports.filter(t => {
                // Keep all transports except those that might conflict with our conditional ones
                if (!enableConsoleLogging && t instanceof winston.transports.Console) {
                    return false;
                }
                return true;
            })
        ]
    };

    // Add S3 stream transport if enabled and not already included
    if (enableS3Logging && s3LogStream && 
        !mergedConfig.transports.some(t => t instanceof winston.transports.Stream && t.stream === s3LogStream)) {
        mergedConfig.transports.push(
            new winston.transports.Stream({ stream: s3LogStream })
        );
    }

    // Create the logger
    const logger = winston.createLogger(mergedConfig);

    // Set up global error handlers if enabled
    if (enableUnhandledErrorLogging) {
        _setupGlobalErrorHandlers(logger);
    }

    // Override console methods if requested
    if (overrideConsole) {
        _overrideConsoleMethods(logger);
    }

    return logger;
}

/**
 * Sets up global error handlers to catch unhandled errors
 * @param {Object} logger - Winston logger instance
 * @private
 */
function _setupGlobalErrorHandlers(logger) {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection:', {
            reason: reason,
            promise: promise,
            timestamp: new Date().toISOString()
        });
    });

    process.on("TypeError", (err) => {
        logger.error('TypeError:', {
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    });
}

/**
 * Overrides default console methods to use the Winston logger
 * @param {Object} logger - Winston logger instance
 * @private
 */
function _overrideConsoleMethods(logger) {
    // Store original console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };

    // Override console methods
    console.log = (...args) => {
        logger.info(args);
        originalConsole.log(...args);
    };

    console.error = (...args) => {
        logger.error(args);
        originalConsole.error(...args);
    };

    console.warn = (...args) => {
        logger.warn(args);
        originalConsole.warn(...args);
    };

    console.info = (...args) => {
        logger.info(args);
        originalConsole.info(...args);
    };

    console.debug = (...args) => {
        logger.debug(args);
        originalConsole.debug(...args);
    };
}

module.exports = {
    createLogger,
    _setupGlobalErrorHandlers,
    _overrideConsoleMethods
};