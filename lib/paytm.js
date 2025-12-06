const PaytmChecksum = require('paytmchecksum');

class PaytmHelper {
    static async generateSignature(params, key) {
        return await PaytmChecksum.generateSignature(params, key);
    }

    static async verifySignature(params, key, checksum) {
        return await PaytmChecksum.verifySignature(params, key, checksum);
    }
}

module.exports = PaytmHelper;
