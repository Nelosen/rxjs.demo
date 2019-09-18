"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const os = require('os');
const FINGERMARK = JSON.stringify(require('os').networkInterfaces());
const TIMESTAMP = 1485878400000;
const PERIOD = 30 * 24 * 3600 * 1000;
let keyCount = 0;
function genKey(fileMeta, sampleFileBuffer) {
    const now = Date.now();
    const metaBuf = new Buffer(FINGERMARK + (++keyCount) + JSON.stringify(fileMeta) + now);
    const time = Math.floor((now - TIMESTAMP) / PERIOD).toString(36);
    const key = '0' + time;
    return key + crypto.createHash('md5').update(metaBuf).update(sampleFileBuffer).digest('hex');
}
exports.genKey = genKey;
