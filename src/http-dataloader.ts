import DataLoader = require("dataloader");
import "isomorphic-fetch";

enum ResponseType {
  Text = "text",
  Custom = "custom",
  Json = "json"
}

interface ParamsEntry {
  key: string;
  url: string;
  requestInit?: RequestInit;
  responseType?: ResponseType;
  parseText?: (text: string) => any;
}

interface InternalParamsEntry {
  index: number;
  url: string;
  requestInit: RequestInit;
  responseType: ResponseType;
  parseText?: (text: string) => any;
}

async function request({
  url,
  requestInit,
  responseType,
  parseText
}: InternalParamsEntry): Promise<any> {
  const resp = await fetch(url, requestInit);
  if (resp.status >= 400) {
    throw new URIError(
      `HTTP response's status is ${resp.status}, body is "${await resp.text()}"`
    );
  }
  switch (responseType) {
    case ResponseType.Text: {
      return resp.text();
    }
    case ResponseType.Custom: {
      const text = await resp.text();
      return parseText ? parseText(text) : text;
    }
    case ResponseType.Json:
    default: {
      return resp.json();
    }
  }
}

type InternalDataLoader = DataLoader<string, any>;

class HttpDataLoader {
  private params: { [key: string]: InternalParamsEntry } = {};
  private data: InternalDataLoader[] = [];

  public set(...params: ParamsEntry[]): this {
    if (!params.length) {
      throw new TypeError("Arguments must not be empty");
    }
    const newParams = params.filter(({ key }) => !this.params[key]);
    if (newParams.length) {
      newParams.forEach(
        ({ key, url, requestInit, responseType, parseText }) => {
          this.params[key] = {
            index: this.data.length,
            parseText,
            requestInit: requestInit || {},
            responseType: responseType || ResponseType.Json,
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

  public async load(...keys: string[]): Promise<any> {
    if (!keys.length) {
      throw new TypeError("Arguments must not be empty");
    }
    const result = await Promise.all(
      keys.map(key => {
        const data = this.getDataLoader(key);
        if (!data) {
          throw new ReferenceError(`Data for "key=${key}" is not set`);
        }
        return data.load(key);
      })
    );
    if (result.length === 1) {
      return result[0];
    }
    return result;
  }

  public clear(...keys: string[]): this {
    if (!keys.length) {
      this.data.forEach(data => {
        data.clearAll();
      });
    }
    keys.forEach(key => {
      const data = this.getDataLoader(key);
      if (data) {
        data.clear(key);
      }
    });
    return this;
  }

  private getDataLoader(key: string): InternalDataLoader | null {
    const { index } = this.params[key] || { index: null };
    return index === null ? null : this.data[index];
  }
}

export = new HttpDataLoader();
