import { Controller } from '../controller';
import { Request, RequestListeners } from '../request';
import { QueryParam, RequestBody, Context, PathParam, Cookie, Header } from '../param';
import { ControllerMetadata, RequestMetadata } from '../../metadata.constants';

describe("装饰器测试集", () => {

  describe("Controller", () => {
    function judgeControllerInject(target: any, path: string) {
      expect(Reflect.getMetadata(ControllerMetadata.ident, target)).toBe(ControllerMetadata.ident);
      expect(Reflect.getMetadata(ControllerMetadata.path, target)).toBe(path);
    }
    test("测试装饰器直接调用注入是否正常", () => {
      @Controller
      class Test {}
      judgeControllerInject(Test, "");
    })
    test("测试装饰器传入string参数注入是否正常", () => {
      @Controller("/path")
      class Test {}
      judgeControllerInject(Test, "/path");
    })
    test("测试装饰器传入ControllerConfig参数注入是否正常", () => {
      @Controller({
        path: "/path"
      })
      class Test {}
      judgeControllerInject(Test, "/path");
    })
  });

  describe("Request", () => {
    test("测试装饰器直接调用注入是否正常", () => {
      class Test {
        @Request
        getData() {}
      }
      const target = new Test();
      const listeners: RequestListeners = Reflect.getMetadata(RequestMetadata.listeners, target);
      expect(listeners).toBeInstanceOf(Set);
      expect(listeners.size).toEqual(1);
    })
    test("测试装饰器只传入path注入是否正常", () => {
      class Test {
        @Request("/path")
        getData() {}
      }
      const target = new Test();
      const listeners: RequestListeners = Reflect.getMetadata(RequestMetadata.listeners, target);
      expect(Reflect.getMetadata(RequestMetadata.paths, listeners.values().next().value)[0]).toEqual("/path");
    })
    test("测试装饰器传入配置是否正常", () => {
      class Test {
        @Request({
          path: "/path",
          method: "POST"
        })
        getData() {}
      }
      const target = new Test();
      const listeners: RequestListeners = Reflect.getMetadata(RequestMetadata.listeners, target);
      expect(Reflect.getMetadata(RequestMetadata.paths, listeners.values().next().value)[0]).toEqual("/path");
      expect(Reflect.getMetadata(RequestMetadata.methods, listeners.values().next().value)[0]).toEqual("POST");
    })
    test("测试将装饰器使用到不支持的属性上", () => {
      expect(class Test {
        // @ts-ignore
        @Request
        public a!: any;
      }).toThrowError();
      expect(class Test {
        // @ts-ignore
        @Request("")
        public a!: any;
      }).toThrowError();
      expect(class Test {
        // @ts-ignore
        @Request({path: "", method: ""})
        public a!: any;
      }).toThrowError();
      expect(new class Test {
        // @ts-ignore
        @Request({path: "", method: ""})
        public a!: any;
      }).toEqual({})
    })

  });

  describe("Param", () => {
    test("测试装饰器调用后元数据是否注入", () => {
      class Test {
        @Request
        getData(@QueryParam("par1")par1: string) {
          return par1
        }
      }
      const target = new Test();
      const listeners: RequestListeners = Reflect.getMetadata(RequestMetadata.listeners, target);
      expect(Reflect.getMetadata(RequestMetadata.params, listeners.values().next().value).length).toEqual(1);
    })

    test("测试装饰器传参后调用", () => {
      class Test {
        @Request
        getData(@QueryParam("par1")par1: string, @RequestBody body: any, @Context ctx: any, @PathParam("path") path: string, @Cookie("")cookie: string, @Header("")header: string) {
          
          return par1
        }
      }
      const target = new Test();
      const listeners: RequestListeners = Reflect.getMetadata(RequestMetadata.listeners, target);
      const listener = listeners.values().next().value;
      const params = Reflect.getMetadata(RequestMetadata.params, listener);
      expect(params.length).toBe(6);
    })
  });
})