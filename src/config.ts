import { LogOutputOption } from "@dangao/node-log";

export const logConfig: LogOutputOption = {
  console: true
};

export function setOption(option: LogOutputOption) {
  Object.entries(option).forEach(([key, value]) => {
    Reflect.set(logConfig, key, value);
  });
}

export default {
  logConfig,
  setOption
};
