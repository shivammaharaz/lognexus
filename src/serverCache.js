// Store interval reference to allow clearing
let cacheInterval = null;

/**
 * Clears Node's module cache and triggers garbage collection if enabled
 */
function clearCache() {
    try {
        // Note: Commented out as it might be too aggressive for general use
        // Uncomment if explicitly needed
        // Object.keys(require.cache).forEach(key => {
        //     delete require.cache[key];
        // });

        // Trigger garbage collection if enabled
        if (global.gc) {
            global.gc();
        }

        console.log(`Cache cleared at: ${new Date().toLocaleString()}`);
    } catch (error) {
        console.error('Cache clearing failed:', error);
    }
}

/**
 * Initializes periodic cache clearing with a specified interval
 * @param {Number} interval - Interval in milliseconds
 * @returns {NodeJS.Timeout} - The interval reference
 */
function initCacheClear(interval = 3 * 60 * 60 * 1000) { // Default: 3 hours
    // Clear any existing interval
    if (cacheInterval) {
        clearInterval(cacheInterval);
    }
    
    // Set new interval
    cacheInterval = setInterval(clearCache, interval);
    
    // Initial cache clear (optional)
    // clearCache();
    
    return cacheInterval;
}

/**
 * Stops periodic cache clearing
 */
function stopCacheClear() {
    if (cacheInterval) {
        clearInterval(cacheInterval);
        cacheInterval = null;
    }
}

module.exports = {
    clearCache,
    initCacheClear,
    stopCacheClear
};