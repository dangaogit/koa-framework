import { Controller, Request } from '../../decorators';

@Controller
export default class {

  @Request("/test1")
  test() {
    return "test1"
  }
}
