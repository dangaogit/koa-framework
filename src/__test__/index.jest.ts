import "reflect-metadata";
import { getApp } from "./app";
import http from "http";
import Koa from "koa";
import KoaFramework from "../index";
import path from "path";
import { HttpClient } from "../utils/http";

jest.useFakeTimers();

describe("Framework", () => {
  const framework = getApp();
  test("测试配置目录后是否将所有Controller自动注入到application中", async () => {
    const app = await framework;
    expect(app.getControllerLength()).toBe(7);
  });

  test("测试onRequest触发后path匹配是否正确", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/info/user");
    expect(result + "").toBe("user");
  });

  test("测试请求不匹配controller路径返回结果是否正确", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/xxx/xxx");
    expect(JSON.parse(result + "").code).toBe(404);
  });

  test("测试请求不匹配监听路径", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/xxx");
    expect(JSON.parse(result + "").error).toMatch("No matching listener");
  });

  test("测试请求不匹配监听方法", async () => {
    await framework;
    const result = await HttpClient.deleted("http://127.0.0.1:8888/api/info/xxx");
    expect(JSON.parse(result + "").error).toMatch("No matching listener");
    const result1 = await HttpClient.get("http://127.0.0.1:8888/api/123/123/123");
    expect(JSON.parse(result1 + "").code).toEqual(404);
  });

  test("测试query参数解析", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/query?param1=1");
    expect(JSON.parse(result + "")).toBe(1);
  });

  test("测试其他参数解析", async () => {
    await framework;
    const result = JSON.parse(
      (await HttpClient.get("http://127.0.0.1:8888/api/other?param1=1", {
        headers: {
          cookie: "cookie=test",
          header: "header"
        }
      })) + ""
    );
    expect(result).toMatchObject({
      cookie: "test",
      header: "header",
      ctx: true
    });
  });

  test("测试用户自定义返回值", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/define-body");
    expect(result + "").toEqual("user define");
  });

  test("测试路径降级匹配功能", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/match/test");
    expect(result + "").toEqual("success");
    const result1 = await HttpClient.get("http://127.0.0.1:8888/api/match/test1");
    expect(result1 + "").toEqual("success1");
  });

  test("测试多路径(多个Request注解在一个函数上)匹配功能", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/requests/test");
    const result1 = await HttpClient.get("http://127.0.0.1:8888/api/requests/test1");
    expect(result).toEqual(result1);
  });

  test("测试路径降级匹配（当路径配置为空时最低匹配该配置）", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/path/xxx");
    const resul1 = await HttpClient.get("http://127.0.0.1:8888/path/test");
    expect(result + "").toEqual("hello");
    expect(resul1 + "").toEqual("test");
  });

  test("测试POST方式请求", async () => {
    await framework;
    const result = await HttpClient.post("http://127.0.0.1:8888/post/msg", { callback: "通过post请求提交数据" });
    expect(result + "").toEqual("通过post请求提交数据");
  });

  test("测试@RequestBody传入类型", async () => {
    await framework;
    const result = await HttpClient.post("http://127.0.0.1:8888/api/body", { msg: "test msg" });
    expect(result + "").toEqual("test msg");
    const result1 = await HttpClient.post("http://127.0.0.1:8888/api/body1", { msg: "test msg" });
    expect(result1 + "").toEqual(JSON.stringify({ msg: "test msg" }));
  });

  test("测试@ResponseHeader", async () => {
    await framework;
    const result = await new Promise<http.IncomingMessage>(resolve => {
      http.get("http://127.0.0.1:8888/api/header", res => {
        resolve(res);
      });
    });
    expect(result.headers["content-type"]).toEqual("application/xml;charset=utf-8");
    const result1 = await new Promise<http.IncomingMessage>(resolve => {
      http.get("http://127.0.0.1:8888/header/test", res => {
        resolve(res);
      });
    });
    expect(result1.headers["test"]).toEqual("header-test");
    expect(result1.headers["content-type"]).toEqual("text/html");
  });

  test("测试Controller模糊匹配", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/test1");
    expect(result + "").toEqual("test1");
  });
  test("测试path超出匹配范围", async () => {
    await framework;
    const result = await HttpClient.get("http://127.0.0.1:8888/api/info/123/123/123");
    expect(result + "").toMatch("404");
  });
});

describe("Middleware", () => {
  test("测试使用middleware方式装载到koa", async () => {
    await new Promise(resolve => {
      const app = new Koa();
      const frameworkMiddleware = KoaFramework.Application.getMiddleware(path.resolve(__dirname, "./middleware-controller"));
      app.use(frameworkMiddleware.middleware);
      app.listen(9999, async () => {
        await frameworkMiddleware.initialized;
        resolve();
      });
    });
    const result = await HttpClient.get("http://127.0.0.1:9999/test");
    expect(result + "").toMatch("hello");
  });
});
