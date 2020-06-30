import { Controller, Request, PathParam, RequestBody, QueryParam, Context, Cookie, Header, ResponseHeader } from '../../decorators';
import Koa from 'koa';

@Controller("/api")
export default class {
  @Request({method: "GET", path: "/info/{user}"})
  getUserInfo(@PathParam("user")user: string, @RequestBody body: any) {
    return user
  }
  @Request({method: "POST", path: "/info/{user}"})
  getUserInfoPost(@PathParam("user")user: string, @RequestBody body: Buffer) {
    return body
  }
  
  @Request({method: "GET", path: "/query"})
  testGetQuery(@QueryParam("param1")param1: string){
    return param1;
  }

  @Request({method: "GET", path: "/other"})
  testGetOtherParam(@Context ctx: Koa.Context, @Cookie("cookie")cookie: string, @Header("header")header: string){
    return {
      ctx: ctx.app instanceof Koa,
      cookie,
      header
    }
  }

  @Request({method: "GET", path: "/match/test"})
  testPathDegradationMatch() {
    return 'success'
  }

  @Request({method: "GET", path: "/match/test1"})
  testPathDegradationMatch1() {
    return 'success1'
  }

  @Request({method: "GET", path: "/define-body"})
  defineBody(@Context ctx: Koa.Context) {
    ctx.body = "user define";
  }

  @Request({method: "GET", path: "/requests/test"})
  @Request({method: "GET", path: "/requests/test1"})
  testRequests(@Context ctx: Koa.Context) {
    return 'requests';
  }

  @Request({method: "POST", path: "/body"})
  testRequestBody(@RequestBody({type: "json"}) body: {msg: string}) {
    return body.msg;
  }

  @Request({method: "POST", path: "/body1"})
  test1RequestBody(@RequestBody({type: "string"}) body: string) {
    return body;
  }

  @ResponseHeader({"Content-Type": "application/xml;charset=utf-8"})
  @Request("/header")
  testHeader() {
    return ""
  }
}