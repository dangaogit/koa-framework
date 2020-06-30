import { Controller, Request, PathParam } from "../../../decorators";

@Controller("c2")
export default class {
  @Request
  test(@PathParam("") test: string) {}
}