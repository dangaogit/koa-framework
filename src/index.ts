import "reflect-metadata";
import "@dangao/date-util-es";
import { ControllerInstance, ControllerMetadata, RequestMetadata, ContextMetaData } from "./metadata.constants";
import Koa from "koa";
import { RequestListener, RequestParams, Context, ResponseMetadata, ResponseHandler } from "./decorators";
import { KoaFrameworkError } from "./error";
import { config } from "./config";
import { Log } from "@dangao/node-log";
import { FileUtils } from "./utils/file";
import { NetworkUtil } from "./utils/network";

const log = new Log("KoaFramework", config.log);

export namespace KoaFramework {
  interface MatchInfo<T> {
    match: T;
    isExact: boolean;
  }

  export interface Config {
    scanPath: string;
    port?: number;
    middlewares?: Koa.Middleware[];
    afterMiddlewares?: Koa.Middleware[];
  }

  export class Application {
    private controller_map = new Map<string, ControllerInstance>();
    private onInitializedFun = (instance: Application) => instance;
    private __config: Required<Config>;
    private __initPromise: Promise<void>;
    /**
     *
     * @param controller_path scan controller path
     * @param app `Koa` instance
     */
    constructor(option: string | Config, private app: Koa = new Koa()) {
      log.info("App starting...");
      const { scanPath, port = 8888, middlewares = [], afterMiddlewares = [] } = typeof option === "string" ? ({ scanPath: option } as Config) : option;

      middlewares.forEach((middleware) => app.use(middleware));

      app.use(this.onRequest);

      afterMiddlewares.forEach((middleware) => app.use(middleware));

      this.__config = {
        scanPath,
        port,
        middlewares,
        afterMiddlewares,
      };

      this.__initPromise = this.init();
    }

    public async start(call?: () => void) {
      await this.__initPromise;

      const { port } = this.__config;
      log.info("App listen start...");
      this.app.listen(port, () => {
        log.info("App listen completed, please open", `http://${NetworkUtil.getLocalIP()}:${port}`);
        call && call();
      });
    }

    private onRequest = async (ctx: Koa.Context, next: Koa.Next) => {
      log.info(`onRequest: ${ctx.method} ${ctx.href}`);
      const result = await new Promise(async (resolve, reject) => {
        // 匹配监听
        const listenerMatchResult = this.matchController(ctx);
        if (!listenerMatchResult) {
          return reject("No matching listener");
        }
        const { listener, controller } = listenerMatchResult.match;
        const params: RequestParams = Reflect.getMetadata(RequestMetadata.params, listener) || [];
        this.handleResponse(listener, ctx);
        const resultParams = await Promise.all(params.map((param) => param(ctx, controller)));
        const checkParamsNotNullResultIndex = this.handleParamsNotNull(listener, resultParams);
        if (typeof checkParamsNotNullResultIndex === "number") {
          ctx.status = 401;
          log.warn(`[${ctx.method.toUpperCase()}] path=[${ctx.path}] listener=[${listener.name}] Parameter index ${checkParamsNotNullResultIndex} cannot be null!`);
          return resolve(KoaFrameworkError(`Parameter index ${checkParamsNotNullResultIndex} cannot be null!`, ctx));
        }
        resolve(await listener(...resultParams));
      }).catch(async (e) => {
        log.warn(e);
        ctx.status = 404;
        return KoaFrameworkError(e, ctx);
      });
      /** 如果用户自己输出了数据，则不再使用函数返回值作为response.body */
      if (typeof result !== "undefined") {
        ctx.body = result;
      }

      await next();
    };

    private handleParamsNotNull(listener: RequestListener<any>, params: any[]) {
      const notNull: number[] | undefined = Reflect.getMetadata(RequestMetadata.paramsNotNull, listener);
      if (!notNull) {
        return;
      }
      for (let argumentIndex of notNull) {
        if (params[argumentIndex] === null || params[argumentIndex] === "" || params[argumentIndex] === undefined) {
          return argumentIndex;
        }
      }
    }

    private handleResponse(listener: RequestListener<any>, ctx: Context) {
      const handlers: ResponseHandler[] = Reflect.getMetadata(ResponseMetadata.response_handler, listener) || [];
      handlers.forEach((handler) => handler(ctx));
    }

    private matchController(ctx: Context) {
      const controllers = [...this.controller_map.keys()];
      let result: MatchInfo<{ controller: ControllerInstance; listener: RequestListener<any> }> | undefined;
      for (let controllerPath of controllers) {
        const controller = this.controller_map.get(controllerPath)!;
        const matchPath = ctx.path.replace(controllerPath, "");
        if (this.matchPath(ctx.path, controllerPath)) {
          const matchListenerPathResult = this.matchListenerPath(controller, matchPath, ctx);
          if (!matchListenerPathResult) {
            continue;
          }
          result = {
            isExact: matchListenerPathResult.isExact,
            match: {
              controller,
              listener: matchListenerPathResult.match,
            },
          };
          if (matchListenerPathResult.isExact) {
            // 精确匹配直接跳出循环
            break;
          }
        } else if (controllerPath === "" && !result) {
          const matchListenerPathResult = this.matchListenerPath(controller, matchPath, ctx);
          if (!matchListenerPathResult) {
            continue;
          }
          result = {
            isExact: false,
            match: {
              controller,
              listener: matchListenerPathResult.match,
            },
          };
        }
      }

      return result;
    }

    private matchListenerPath(controller: ControllerInstance, matchPath: string, ctx: Context) {
      let result: MatchInfo<RequestListener<any>> | undefined;
      let resultPath: string | undefined;
      const listeners = controller.listeners;
      for (let listener of listeners) {
        const paths: string[] = Reflect.getMetadata(RequestMetadata.paths, listener);
        const matchMethodResult = this.matchMethod(listener, ctx);
        if (!matchMethodResult) {
          // 如果该listener没有匹配的method，就直接跳过
          continue;
        }
        for (let path of paths) {
          if (this.matchPath(matchPath, path, true)) {
            if (matchMethodResult.isExact) {
              result = {
                isExact: true,
                match: listener,
              };
            } else {
              result = {
                isExact: false,
                match: listener,
              };
            }
          } else if (path === "") {
            result = {
              isExact: false,
              match: listener,
            };
          }
          if (result) {
            resultPath = path;
            if (result.isExact) {
              break;
            }
          }
        }
        // 精确匹配到就跳出循环
        if (result && result.isExact) {
          break;
        }
      }

      if (result && typeof resultPath === "string") {
        Reflect.defineMetadata(ContextMetaData.matchPath, resultPath, ctx);
      }
      return result;
    }

    private matchMethod(listener: RequestListener<any>, ctx: Context) {
      const methods: string[] = Reflect.getMetadata(RequestMetadata.methods, listener);
      let result: MatchInfo<string> | undefined;
      for (let method of methods) {
        if (new RegExp(ctx.method, "i").test(method)) {
          result = {
            isExact: true,
            match: method,
          };
          break;
        } else if (method === "") {
          result = {
            isExact: false,
            match: method,
          };
        }
      }

      if (result) {
        Reflect.defineMetadata(ContextMetaData.matchMethod, result.match, ctx);
      }
      return result;
    }

    /**
     *
     * @param path 被匹配的路径
     * @param pathRule 匹配规则，支持`{param}`方式设置动态值，并可通过**@PathParam("param")**注解取出
     * @param isMatchLength 是否绝对匹配路径长度，一般用于Request注解下的匹配
     */
    private matchPath(path: string, pathRule: string, isMatchLength = false) {
      const path_fragment = path.replace("//", "/").split("/");
      const path_rule_fragment = pathRule.split("/");
      if (isMatchLength && path_fragment.length !== path_rule_fragment.length) {
        return false;
      } else if (pathRule === "") {
        // 规则为空，不匹配
        return false;
      }
      for (let i = 0; i < path_rule_fragment.length; i++) {
        const rule_item = path_rule_fragment[i];
        const path_item = path_fragment[i];
        if (path_item === rule_item) {
          // 直接匹配，放行
          continue;
        }
        if (/^{\w+}$/.test(rule_item)) {
          // 动态参数匹配，放行
          continue;
        }
        // 都不匹配，直接退出并返回不匹配
        return false;
      }
      return true;
    }

    private async init() {
      
      await this.scanController().catch((e) => {
        log.error(e);
      });
      log.info(`App startup.`);
      this.onInitializedFun(this);
    }

    private async scanController() {
      const { scanPath } = this.__config;
      const paths = await FileUtils.readDir(scanPath);
      await this.deepPath(paths, async (path) => {
        await this.registerController(path);
      });
    }

    private async registerController(filepath: string) {
      const { controller_map } = this;
      const target = (await import(filepath)).default;
      if (typeof target !== "function" && !/^class/i.test(target + "")) {
        return log.warn(`Module default export is not a class! This file will be ignored [${filepath}]`);
      }
      if (!Application.isDecoratedWithController(target)) {
        return log.warn(`module default export is not Controller, Please use the "Controller" decorator to wrap this export! This file will be ignored [${filepath}]`);
      }
      const mapping_path = Reflect.getMetadata(ControllerMetadata.path, target);
      const instance = new target();
      log.info(`registerController: [${mapping_path}] ${filepath}`);
      controller_map.set(mapping_path, {
        path: mapping_path,
        ident: ControllerMetadata.ident,
        target,
        listeners: Reflect.getMetadata(RequestMetadata.listeners, instance),
      });
    }

    private async deepPath(pathinfo: FileUtils.PathInfo | FileUtils.PathInfo[], call: (path: string) => Promise<void>) {
      let children: FileUtils.PathInfo[] = [];
      if (pathinfo instanceof Array) {
        children = pathinfo;
      } else {
        if (!pathinfo.isDir) {
          await call(pathinfo.path);
        } else {
          children = pathinfo.children;
        }
      }
      for (let info of children) {
        await this.deepPath(info, call);
      }
    }

    public onInitialized(listen: (instance: Application) => any) {
      this.onInitializedFun = listen;
    }

    public getControllerLength() {
      return this.controller_map.size;
    }

    public static getMiddleware(controller_path: string): { middleware: Koa.Middleware; initialized: Promise<Application> } {
      const app = new Application(controller_path);
      return {
        middleware: app.onRequest,
        initialized: new Promise((resolve) => app.onInitialized(() => resolve(app))),
      };
    }

    private static isDecoratedWithController(target: any) {
      return Reflect.getMetadata(ControllerMetadata.ident, target) === ControllerMetadata.ident;
    }
  }
}
export default KoaFramework;

export * from "./decorators";
export const App = KoaFramework.Application;
export { Koa };
