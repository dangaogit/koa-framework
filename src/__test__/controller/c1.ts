import { Controller } from "../../decorators";
import { Request,  } from "../../decorators";
import { PathParam } from "../../decorators/param";

@Controller("/c1")
export default class {
  @Request
  // @ts-ignore
  test(@PathParam("") test: string) {}
  // @ts-ignore
  @Request
  test1!: any;
}