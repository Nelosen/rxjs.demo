"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const KoaRouter = require("koa-router");
class Router {
    constructor() {
        const allowMethod = 'GET,PUT,DELETE,POST,OPTIONS';
        Router.koaRouter.options('*', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            ctx.status = 200;
            ctx.res.setHeader('Allow', allowMethod);
            ctx.body = allowMethod;
            yield next();
        }));
    }
    root(path) {
        return this.decorator(path);
    }
    get(path) {
        return this.decorator({
            path, method: 'get'
        });
    }
    post(path) {
        return this.decorator({
            path, method: 'post'
        });
    }
    put(path) {
        return this.decorator({
            path, method: 'put'
        });
    }
    delete(path) {
        return this.decorator({
            path, method: 'delete'
        });
    }
    setRouters(app) {
        Router.routerMap.forEach((_, RouterClass) => new RouterClass());
        Router.routerSet.forEach(Func => Func());
        app.use(Router.koaRouter.routes());
        app.use(ctx => {
            ctx.res.setHeader('Access-Control-Allow-Origin', ctx.request.header.origin || '*');
            ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');
            ctx.res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
            ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, AUTHORIZATION, X-Socket-Id');
        });
    }
    decorator(config) {
        if (typeof config === 'string') {
            return function (target) {
                Router.routerMap.set(target, config);
            };
        }
        else {
            return function (target, _key, desc) {
                let path = config['path'];
                const method = config['method'];
                Router.routerSet.add(() => {
                    const constructor = target.constructor;
                    const parentPath = Router.routerMap.get(constructor);
                    if (typeof parentPath !== 'undefined') {
                        path = parentPath + path;
                    }
                    Router.koaRouter[method](path, (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                        let result;
                        try {
                            result = yield desc.value.call(target, ctx, next);
                        }
                        catch (e) {
                            console.error(e);
                            ctx.throw(400, e);
                        }
                        return result;
                    }));
                });
            };
        }
    }
}
Router.koaRouter = new KoaRouter();
Router.routerMap = new Map();
Router.routerSet = new Set();
exports.default = new Router;
