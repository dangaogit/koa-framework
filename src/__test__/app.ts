import path from "path";
import Koa from "koa";
import KoaFramework from "../index";

const controller_path = path.resolve(__dirname, "./controller");
const port = 8888;

export function getApp(): [Promise<KoaFramework.Application>, Koa] {
  const app = new Koa();
  return [
    new Promise(resolve => {
      new KoaFramework.Application(controller_path, app).onInitialized(async ctx => {
        await new Promise(rs => {
          app.listen(port, () => {
            rs();
          })
        })
        resolve(ctx);
      });
    }),
    app
  ];
}