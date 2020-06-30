import 'reflect-metadata';
import { ControllerMetadata } from '../metadata.constants';

type Class<T> = {
  new (...args: any[]): T;
}

export interface ControllerConfig {
  path: string;
}

export function Controller<T extends Class<any>>(target: T): T;
export function Controller(config: ControllerConfig): <T extends Class<any>>(target: T) => T;
export function Controller(path: string): <T extends Class<any>>(target: T) => T;
export function Controller<T extends Class<any>>(param: T | ControllerConfig | string) {
  if(typeof param === "string"){
    return (target: T) => {
      return controllerFactory(target, param);
    }
  }
  else if(paramIsControllerConfig(param)) {
    return (target: T) => {
      return controllerFactory(target, param.path);
    }
  }
  else{
    return controllerFactory(param, "");
  }
}

function controllerFactory<T extends Class<any>>(target: T, path: string) {
  Reflect.defineMetadata(ControllerMetadata.ident, ControllerMetadata.ident, target); // 注入controller标识符元数据
  Reflect.defineMetadata(ControllerMetadata.path, path, target);// 注入path元数据
  return target;
}

function paramIsControllerConfig<T extends Class<any>>(par: T | ControllerConfig | string): par is ControllerConfig {
  return (par + "").indexOf("class") !== 0;
}