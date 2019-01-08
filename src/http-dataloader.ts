import DataLoader = require("dataloader");
import "isomorphic-fetch";

export enum ResponseType {
  Text = "text",
  Json = "json"
}

export interface ParamsEntry {
  key: string;
  url: string;
  requestInit?: RequestInit;
  responseType?: ResponseType;
  transform?: (body: any) => any;
}

interface InternalParamsEntry {
  index: number;
  url: string;
  requestInit: RequestInit;
  responseType: ResponseType;
  transform?: (body: any) => any;
}

async function request({
  url,
  requestInit,
  responseType,
  transform
}: InternalParamsEntry): Promise<any> {
  const resp = await fetch(url, requestInit);
  if (resp.status >= 400) {
    throw new URIError(
      `HTTP response's status is ${resp.status}, body is "${await resp.text()}"`
    );
  }
  let body: any;
  switch (responseType) {
    case ResponseType.Text: {
      body = await resp.text();
      break;
    }
    case ResponseType.Json:
    default: {
      body = await resp.json();
    }
  }
  return transform ? transform(body) : body;
}

type InternalDataLoader = DataLoader<string, any>;

class HttpDataLoader {
  private params: { [key: string]: InternalParamsEntry } = {};
  private data: InternalDataLoader[] = [];

  public set(...params: ParamsEntry[]): this {
    const newParams = params.filter(({ key }) => !this.params[key]);
    if (newParams.length) {
      newParams.forEach(
        ({ key, url, requestInit, responseType, transform }) => {
          this.params[key] = {
            index: this.data.length,
            requestInit: requestInit || {},
            responseType: responseType || ResponseType.Json,
            transform,
            url
          };
        }
      );
      const dataLoader = new DataLoader<string, any>(keys =>
        Promise.all(keys.map(key => request(this.params[key])))
      );
      this.data.push(dataLoader);
    }
    return this;
  }

  public async load(key: string): Promise<any> {
    const [result] = await this.loadAll(key);
    return result;
  }

  public loadAll(...keys: string[]): Promise<any[]> {
    return Promise.all(
      keys.map(key => {
        const data = this.getDataLoader(key);
        if (!data) {
          throw new ReferenceError(`Data for "key=${key}" is not set`);
        }
        return data.load(key);
      })
    );
  }

  public clear(...keys: string[]): this {
    keys.forEach(key => {
      const data = this.getDataLoader(key);
      if (data) {
        data.clear(key);
      }
    });
    return this;
  }

  public clearAll(): this {
    this.data.forEach(data => {
      data.clearAll();
    });
    return this;
  }

  private getDataLoader(key: string): InternalDataLoader | null {
    const { index } = this.params[key] || { index: null };
    return index === null ? null : this.data[index];
  }
}

export default new HttpDataLoader();
