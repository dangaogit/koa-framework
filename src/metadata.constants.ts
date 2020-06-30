import { Context, RequestListeners } from "./decorators";

export interface ControllerInstance {
  ident: symbol;
  path: string;
  listeners: RequestListeners;
  target: any;
}

export const ControllerMetadata = {
  ident: Symbol("Koa Framework Controller"),
  path: Symbol("path"),
}

export const RequestMetadata = {
  listeners: Symbol("listeners"),
  paths: Symbol("paths"),
  methods: Symbol("methods"),
  params: Symbol("params"),
  paramsNotNull: Symbol("param not null")
}

export const ContextMetaData = {
  /** path和method可以同时多个注册到一个监听上，所以在Context上注入当前匹配的路径 */
  matchPath: Symbol("match path"),
  matchMethod: Symbol("match method")
}

export type ParamValueHandler = (ctx: Context) => Promise<any>;