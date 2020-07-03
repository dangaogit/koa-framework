import { RequestMetadata, ControllerInstance } from '../metadata.constants';
import { Context } from './param';
import { Log } from '@dangao/node-log';
import config from '../config';
import { HttpTypes } from '../http.types';

const log = new Log("RequestDecorator", config.logConfig);

export type RequestMethodType = HttpTypes.Method | "";
export type RequestListeners<Res = any> = Set<RequestListener<Res>>;
export type RequestParams = RequestParamCall[];
export type RequestParamCall = (ctx: Context, controller: ControllerInstance) => Promise<any>;
export type RequestListener<T> = (...args: any[]) => T;
export interface RequestConfig {
  /**  */
  path: string;
  /** 传空字符串代表全部监听 */
  method: RequestMethodType;
}
/**
 * 返回值将作为请求返回内容
 * @param config 
 */
export function Request(config: RequestConfig): <T>(target: T, propertyKey: keyof T) => void;
/**
 * 返回值将作为请求返回内容
 * @param path 
 */
export function Request(path: string): <T>(target: T, propertyKey: keyof T) => void;
/**
 * 返回值将作为请求返回内容
 * @param target 
 * @param propertyKey 
 * @param desc 
 */
export function Request<T>(target: T, propertyKey: keyof T): void;
export function Request<T>(...args: any[]) {
  const [param1, param2] = args;
  let config: RequestConfig = {
    path: "",
    method: ""
  };
  if (typeof param1 === "string") {
    config.path = param1;
  }
  else if (args.length === 1 && isTypeRequestConfig(param1)) {
    config = Object.assign(config, param1);
  }

  if (args.length !== 1 && param1 instanceof Object) {
    RequestFactory(config, param1, param2);
  }
  else {
    return (target: T, propertyKey: keyof T) => {
      RequestFactory(config, target, propertyKey);
    }
  }
}

function RequestFactory<T>(config: RequestConfig, target: T, propertyKey: keyof T) {
  const { path, method } = config;
  let list: RequestListeners | undefined = Reflect.getMetadata(RequestMetadata.listeners, target);
  const call = target[propertyKey];
  if (!isTypeRequestListener(call)) {
    return log.warn(`This annotation can only be used on Methods! decorator = [Request] target = [${(target as Object).constructor.toString().replace(/[\r\n]/g, "")}] property = [${propertyKey}]`);
  }
  if (!list) {
    list = new Set();
    Reflect.defineMetadata(RequestMetadata.listeners, list, target);
  }

  let paths: string[] | undefined = Reflect.getMetadata(RequestMetadata.paths, call);
  if(!paths) {
    paths = [];
    Reflect.defineMetadata(RequestMetadata.paths, paths, call);
  }
  paths.push(path);

  let methods: string[] | undefined = Reflect.getMetadata(RequestMetadata.methods, call);
  if(!methods) {
    methods = [];
    Reflect.defineMetadata(RequestMetadata.methods, methods, call);
  }
  methods.push(method);

  list.add(call);
}

function isTypeRequestConfig(config: any): config is RequestConfig {
  return config instanceof Object;
}
function isTypeRequestListener(fn: any): fn is RequestListener<any> {
  return typeof fn === 'function';
}