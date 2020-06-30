import { Controller, Request } from '../../decorators';

@Controller
export default class {

  @Request("/test")
  test() {
    return "test"
  }
}
