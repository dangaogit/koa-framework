import { Controller, Request, ResponseHeader } from '../../decorators';

@Controller("/header")
export default class {
  @Request
  @ResponseHeader({"content-type": "text/html"})
  @ResponseHeader({"test": "header-test"})
  handler() {
    return "1"
  }
}