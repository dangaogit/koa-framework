import path from "path";
import KoaFramework from "../index";

const controller_path = path.resolve(__dirname, "./controller");

export async function getApp(): Promise<KoaFramework.Application> {
  const app = new KoaFramework.Application({
    scanPath: controller_path,
    port: 8888,
  });
  await app.start();
  return app;
}
