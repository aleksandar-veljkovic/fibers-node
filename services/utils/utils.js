const randomHex = require('crypto-random-hex');

class Utils {
    constructor({ config }) {
        this.logging = config.logging;
    }

    log(message) {
        if (this.logging) {
            // eslint-disable-next-line no-console
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }

    static generateId() { return randomHex(32); }
}

module.exports = Utils;
