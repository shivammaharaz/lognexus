const morgan = require('morgan');

/**
 * Creates a Morgan middleware instance configured to use the provided logger
 * @param {String} format - Morgan log format string
 * @param {Object} logger - Winston logger instance
 * @returns {Function} - Configured Morgan middleware
 */
function create(format, logger) {
    // Default format if none provided
    const logFormat = format || ':date[iso] :method :url :status :response-time ms :referrer :remote-addr :user-agent :remote-user';

    // Return configured Morgan middleware
    return morgan(logFormat, {
        stream: {
            write: (message) => {
                if (logger) {
                    logger.info(message && message.trim());
                }
            }
        }
    });
}

module.exports = {
    create
};