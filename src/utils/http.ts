import * as http from "http";

export function getURL(url: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    const request: http.ClientRequest = http.get(url, (response) => {
      const bodyParts = [];
      response.on('data', (chunk) => bodyParts.push(chunk));
      response.on('end', () => {
        const body: any = JSON.stringify(bodyParts.join(''));

        return body.error
          ? reject(new Error(body.error))
          : resolve(body);
      });
    });
    request.on('error', (err) => reject(err))
  });
}
