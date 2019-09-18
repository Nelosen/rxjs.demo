"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var Blls_1;
const crypto = require("crypto");
const fs = require("fs");
const path_1 = require("path");
const rawBody = require("raw-body");
const router_1 = require("./router");
const utils_1 = require("./utils");
const config = require('config');
let Blls = Blls_1 = class Blls {
    getChunksMeta(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileSize, fileMD5, lastUpdated, fileName } = ctx.request.body;
            const fileInfo = { fileSize, fileMD5, lastUpdated, fileName };
            const chunkSize = config.CHUNK_SIZE;
            const chunks = Math.ceil(fileSize / chunkSize);
            const buffer = Buffer.concat([new Buffer(JSON.stringify(fileInfo)), crypto.randomBytes(1024)]);
            const fileKey = utils_1.genKey(fileInfo, buffer);
            Blls_1.fileKeyPairs.set(fileKey, {
                name: fileName, chunks
            });
            ctx.body = { chunkSize, chunks, fileKey, fileSize: parseInt(fileSize) };
            yield next();
        });
    }
    upload(ctx, next) {
        const { chunk, chunks } = ctx.request.query;
        if (chunk && chunks) {
            return this.uploadChunk(ctx, next);
        }
        else if (!chunk && !chunks) {
            return this.settle(ctx, next);
        }
        else {
            ctx.body = 'bad request';
            ctx.status = 400;
            return next();
        }
    }
    uploadChunk(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileKey } = ctx.params;
            const { chunk, chunks } = ctx.request.query;
            const raw = yield new Promise((resolve, reject) => {
                rawBody(ctx.req, {
                    length: ctx.req.headers['content-length']
                }, (err, body) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(body);
                });
            });
            try {
                yield new Promise((resolve, reject) => {
                    const fileName = `${fileKey}_${chunk}`;
                    const dir = path_1.join(process.cwd(), `chunks`);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.writeFile(`${dir}/${fileName}`, raw, (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                });
            }
            catch (e) {
                ctx.body = e.message ? e.message : e;
                ctx.status = 500;
                yield next(e);
            }
            ctx.body = 'ok';
            yield next();
        });
    }
    settle(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileKey } = ctx.params;
            const { name, chunks } = Blls_1.fileKeyPairs.get(fileKey);
            const dir = path_1.join(process.cwd(), `chunks`);
            const promises = [];
            let blob;
            for (let i = 1; i <= chunks; i++) {
                const path = `${dir}/${fileKey}_${i}`;
                const promise = this.readFileAsPromise(path)
                    .then(newBlob => {
                    blob = !blob ? newBlob : Buffer.concat([blob, newBlob]);
                    return this.deleteFileAsPromise(path);
                });
                promises.push(promise);
            }
            try {
                yield Promise.all(promises);
                yield this.writeFileAsPromise(`${dir}/${name}`, blob);
            }
            catch (e) {
                ctx.status = 500;
                ctx.body = e.message ? e.message : e;
                return yield next(e);
            }
            ctx.body = 'ok';
            yield next();
        });
    }
    writeFileAsPromise(path, blob) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, blob, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
    readFileAsPromise(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }
    deleteFileAsPromise(path) {
        return new Promise((resolve, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
};
Blls.fileKeyPairs = new Map();
__decorate([
    router_1.default.post('/upload/chunk')
], Blls.prototype, "getChunksMeta", null);
__decorate([
    router_1.default.post('/upload/chunk/:fileKey')
], Blls.prototype, "upload", null);
Blls = Blls_1 = __decorate([
    router_1.default.root('/api')
], Blls);
exports.Blls = Blls;
