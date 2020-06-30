import http from 'http';

export namespace HttpClient {

  export function get<T>(url: string, options: http.RequestOptions = {}): Promise<T> {
    return new Promise((resolve) => {
      http.get(url,options, res => res.on('data', chunk => resolve(chunk)));
    })
  }

  export function post(url: string, body: any) {
    return new Promise(resolve => {
      const request = http.request(url, { method: "POST" }, res => {
        res.on('data', chunk => {
          resolve(chunk);
        })
      })
      request.write(JSON.stringify(body));
      request.end();
    })
  }

  export function deleted(url: string) {
    return new Promise(resolve => {
      const request = http.request(url, { method: "DELETE" }, res => {
        res.on('data', chunk => {
          resolve(chunk);
        })
      })
      request.end();
    })
  }
}