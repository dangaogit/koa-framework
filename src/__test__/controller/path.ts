import { Controller, Request } from "../../../main";

@Controller("/path")
export default class {
  @Request("")
  doReq() {
    return "hello";
  }

  @Request("/test")
  test() {
    return "test";
  }
}
