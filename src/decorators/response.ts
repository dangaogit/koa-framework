import { Context } from "./param";

export type ResponseHandler = (ctx: Context) => void;

export const ResponseMetadata = {
  response_handler: Symbol("response_handler")
};

export function ResponseHeader(headers: Record<string, string>) {
  return <T>(target: T, propertyKey: keyof T) => {
    let handlers: ResponseHandler[] | undefined = Reflect.getMetadata(ResponseMetadata.response_handler, target[propertyKey]);
    if (!handlers) {
      handlers = [];
      Reflect.defineMetadata(ResponseMetadata.response_handler, handlers, target[propertyKey]);
    }

    handlers.push(ctx => {
      Object.keys(headers).map(key => {
        ctx.set(key, headers[key]);
      });
    });
  };
}