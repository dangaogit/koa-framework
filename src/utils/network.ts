import os from 'os';


export namespace NetworkUtil {
  /**
   * 获取本机network实例
   */
  export function getLocalNetwork() {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
      const networks = interfaces[devName] || [];
      for (let i = 0; i < networks.length; i++) {
        if (networks[i].family === 'IPv4' && !networks[i].internal && networks[i].address.indexOf('127.0.0.1') === -1 && networks[i].address.indexOf('169') !== 0) {
          return networks[i];
        }
      }
    }
  }
  
  /**
   * 获取本机IP
   * @param defaultIP 查找不到默认IP
   */
  export function getLocalIP(defaultIP = 'localhost') {
    const network = getLocalNetwork();
    return network ? network.address : defaultIP;
  }
}