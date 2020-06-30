import { Controller, Request } from '../../decorators';

@Controller("/test")
export default class {
  @Request
  onReq() {
    return "hello"
  }
}
