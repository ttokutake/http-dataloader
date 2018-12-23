import DataLoader = require('dataloader');
import 'isomorphic-fetch';

enum ResponseType {
  Text = "text",
  Custom = "custom",
  Json = "json",
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

async function request({ url, requestInit, responseType, parseText }: InternalParamsEntry): Promise<any> {
  const resp = await fetch(url, requestInit);
  if (resp.status >= 400) {
    throw new URIError(`HTTP response's status is ${resp.status}, body is "${await resp.text()}"`);
  }
  switch (responseType) {
    case 'text': {
      return resp.text();
    }
    case 'custom': {
      const respBody = await resp.text();
      return parseText ? parseText(respBody) : respBody;
    }
    case 'json':
    default: {
      return resp.json();
    }
  }
}

class HttpDataLoader {
  private params: {[key: string]: InternalParamsEntry} = {};
  private data: Array<DataLoader<string, any>> = [];

  set(...params: Array<ParamsEntry>): void {
    if (!params.length) {
      throw new TypeError("Arguments must not be empty");
    }
    params
      .filter(({ key }: ParamsEntry) => !this.params[key])
      .forEach(({ key, url, requestInit, responseType, parseText }: ParamsEntry) => {
        this.params[key] = {
          index: this.data.length,
          url,
          requestInit: requestInit || {},
          responseType: responseType || ResponseType.Json,
          parseText
        };
      });
    const dataLoader = new DataLoader<string, any>(
      keys => Promise.all(keys.map(key => request(this.params[key])))
    );
    this.data.push(dataLoader);
  }

  private getDataLoader(key: string): DataLoader<string, any> | null {
    const { index } = this.params[key];
    return index === undefined ? null : this.data[index];
  }

  async load(...keys: Array<string>): Promise<any> {
    if (!keys.length) {
      throw new TypeError("Arguments must not be empty");
    }
    const result = await Promise.all(keys.map(key => {
      const data = this.getDataLoader(key);
      if (!data) {
        throw new ReferenceError(`Data for "key=${key}" is not set`);
      }
      return data.load(key);
    }));
    if (result.length === 1) {
      return result[0];
    }
    return result;
  }
}

export = new HttpDataLoader();
