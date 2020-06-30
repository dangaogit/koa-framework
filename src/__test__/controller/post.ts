import { Controller, Request, RequestBody } from "../../../src/decorators";

@Controller("/post")
export default class {

  @Request({
    method: "POST",
    path: "/msg"
  })
  doPost(@RequestBody body: Buffer) {
    return JSON.parse(body.toString()).callback;
  }
}