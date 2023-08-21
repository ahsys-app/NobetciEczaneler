const log4js = require('log4js');

// Configure log4js based on the environment level
if (process.env.LEVEL === 'debug') {
    log4js.configure({
        appenders: { console: { type: 'console' } },
        categories: { default: { appenders: ['console'], level: 'debug' } }
    });
} else {
    log4js.configure({
        appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
        categories: { default: { appenders: ['cheese'], level: 'all' } },
    });
}

class Logger {
    static logger = log4js.getLogger();

    static d(message, ...args) {
        this.logger.debug(message, ...args);
    }

    static i(message, ...args) {
        this.logger.info(message, ...args);
    }

    static w(message, ...args) {
        this.logger.warn(message, ...args);
    }

    static e(message, ...args) {
        this.logger.error(message, ...args);
    }
    
}

module.exports = Logger;