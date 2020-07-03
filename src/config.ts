import { LogOption } from "@dangao/node-log";

export const logConfig: LogOption = {
  console: true
};

export function setOption(option: LogOption) {
  Object.entries(option).forEach(([key, value]) => {
    Reflect.set(logConfig, key, value);
  });
}

export default {
  logConfig,
  setOption
};
