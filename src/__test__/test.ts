import { getApp } from "./app";
import { App } from "..";
import { ParameterizedContext, DefaultState, Next } from "koa";

getApp();

new App({
  scanPath: "",
  middlewares: [testMiddleware],
});

async function testMiddleware(ctx: AppServer.KoaContext, next: AppServer.KoaNext) {}

export namespace AppServer {
  export interface Context {
    $param: {};
  }
  export type KoaContext = ParameterizedContext<DefaultState, Context>;
  export type KoaNext = Next;
}
