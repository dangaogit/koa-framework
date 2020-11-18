import Koa from "koa";
import { RequestMetadata, ControllerInstance, ContextMetaData } from "../metadata.constants";
import { RequestParams } from "./request";

export type Context = Koa.Context;

interface QueryParamOption {
  key: string;
  handler?(value: string): any;
}
function QueryHandler(option: QueryParamOption, ctx: Context) {
  const value = ctx.query[option.key];
  return option.handler ? option.handler(value) : value;
}
export function QueryParam(key: string): <T>(target: T, propertyKey: keyof T, argumentIndex: number) => void;
export function QueryParam(option: QueryParamOption): <T>(target: T, propertyKey: keyof T, argumentIndex: number) => void;
export function QueryParam(key: string | QueryParamOption) {
  return <T>(target: T, propertyKey: keyof T, argumentIndex: number) => {
    ParamFactory<T>(target, propertyKey, argumentIndex, QueryHandler.bind(null, typeof key === "string" ? { key } : key));
  };
}

function parsPathParams(ctx: Context, path: string) {
  const split_path = path.split("/");
  const param_reg = /(?<=^{)[^}]*/;
  const result: Record<string, string> = {};
  split_path.forEach((part, index) => {
    const param = part.match(param_reg);
    if (param) {
      result[param[0]] = ctx.path.split("/")[index];
    }
  });
  return result;
}
async function PathHandler(key: string, ctx: Context, controller: ControllerInstance) {
  const matchPath = Reflect.getMetadata(ContextMetaData.matchPath, ctx);
  return parsPathParams(ctx, controller.path + matchPath)[key];
}
export function PathParam(key: string) {
  return <T>(target: T, propertyKey: keyof T, argumentIndex: number) => {
    ParamFactory<T>(target, propertyKey, argumentIndex, PathHandler.bind(null, key));
  };
}

export type RequestBodyType = "string" | "json" | "buffer";
export interface RequestBodyOption {
  type: RequestBodyType;
}
function getRequestBody(type: RequestBodyType, ctx: Koa.Context) {
  return new Promise<any>((resolve) => {
    let buff = Buffer.from([]);
    ctx.req.on("data", (chunk: Buffer) => {
      buff = Buffer.concat([buff, chunk]);
    });
    ctx.req.on("end", () => {
      let result: Buffer | string | Object = buff;
      if (type === "string") {
        result = buff.toString();
      }
      if (type === "json") {
        result = JSON.parse(buff.toString());
      }
      resolve(result);
    });
  });
}

export function RequestBody(option: RequestBodyOption): <T>(target: T, propertyKey: keyof T, argumentIndex: number) => void;
export function RequestBody<T>(target: T, propertyKey: keyof T, argumentIndex: number): void;
export function RequestBody<T>(...args: any[]) {
  if (args.length === 1) {
    return (target: T, propertyKey: keyof T, argumentIndex: number) => {
      ParamFactory<T>(target, propertyKey, argumentIndex, getRequestBody.bind(null, args[0].type));
    };
  } else {
    ParamFactory<T>(args[0], args[1], args[2], getRequestBody.bind(null, "buffer"));
  }
}

async function getContext(ctx: Context) {
  return ctx;
}

export function Context<T>(target: T, propertyKey: keyof T, argumentIndex: number) {
  ParamFactory<T>(target, propertyKey, argumentIndex, getContext);
}

async function getHeader(key: string, ctx: Context) {
  return ctx.headers[key];
}
export function Header(key: string) {
  return <T>(target: T, propertyKey: keyof T, argumentIndex: number) => {
    ParamFactory<T>(target, propertyKey, argumentIndex, getHeader.bind(null, key));
  };
}

async function getCookie(key: string, ctx: Context) {
  return ctx.cookies.get(key);
}
export function Cookie(key: string) {
  return <T>(target: T, propertyKey: keyof T, argumentIndex: number) => {
    ParamFactory<T>(target, propertyKey, argumentIndex, getCookie.bind(null, key));
  };
}

function ParamFactory<T>(target: T, propertyKey: keyof T, argumentIndex: number, handler: (koactx: Context, controller: ControllerInstance) => Promise<any>) {
  let functionParams: RequestParams | undefined = Reflect.getMetadata(RequestMetadata.params, target[propertyKey]);
  if (!functionParams) {
    functionParams = [];
    Reflect.defineMetadata(RequestMetadata.params, functionParams, target[propertyKey]);
  }
  functionParams[argumentIndex] = handler;
}

export function NotNull<T>(target: T, propertyKey: keyof T, argumentIndex: number) {
  // 在request注解时会注入该数组，所以不会存在null
  let notNullIndexs: number[] | undefined = Reflect.getMetadata(RequestMetadata.paramsNotNull, target[propertyKey]);
  if (!notNullIndexs) {
    notNullIndexs = [];
    Reflect.defineMetadata(RequestMetadata.paramsNotNull, notNullIndexs, target[propertyKey]);
  }
  notNullIndexs.push(argumentIndex);
}
