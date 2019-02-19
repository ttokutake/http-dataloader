import DataLoader = require("dataloader");

type ResponseData = any;

export enum ResponseType {
  Text = "text",
  Json = "json"
}

export interface ParamsEntry {
  key: string;
  url: string;
  requestInit?: RequestInit;
  responseType?: ResponseType;
  transform?: (body: ResponseData) => ResponseData;
}

interface InternalParamsEntry {
  index: number;
  url: string;
  requestInit: RequestInit;
  responseType: ResponseType;
  transform?: (body: ResponseData) => ResponseData;
}

async function request({
  url,
  requestInit,
  responseType,
  transform
}: InternalParamsEntry): Promise<ResponseData> {
  const resp = await fetch(url, requestInit);
  if (resp.status >= 400) {
    throw new URIError(
      `HTTP response's status is ${resp.status}, body is "${await resp.text()}"`
    );
  }
  let body: ResponseData;
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

type InternalDataLoader = DataLoader<string, ResponseData>;

class HttpDataLoader {
  private params: { [key: string]: InternalParamsEntry } = {};
  private dataLoaders: InternalDataLoader[] = [];

  public set(...params: ParamsEntry[]): this {
    const newParams = params.filter(({ key }) => !this.params[key]);
    if (!newParams.length) {
      return this;
    }
    for (const {
      key,
      url,
      requestInit,
      responseType,
      transform
    } of newParams) {
      this.params[key] = {
        index: this.dataLoaders.length,
        requestInit: requestInit || {},
        responseType: responseType || ResponseType.Json,
        transform,
        url
      };
    }
    const dataLoader: InternalDataLoader = new DataLoader(keys =>
      Promise.all(keys.map(key => request(this.params[key])))
    );
    this.dataLoaders.push(dataLoader);
    return this;
  }

  public async loadOne(key: string): Promise<ResponseData> {
    const [result] = await this.load(key);
    return result;
  }

  public load(...keys: string[]): Promise<ResponseData[]> {
    return Promise.all(
      keys.map(key => {
        try {
          return this.getDataLoader(key).load(key);
        } catch (err) {
          return Promise.reject(err);
        }
      })
    );
  }

  public clear(...keys: string[]): this {
    for (const key of keys) {
      this.getDataLoader(key).clear(key);
    }
    return this;
  }

  public clearAll(): this {
    for (const dataLoader of this.dataLoaders) {
      dataLoader.clearAll();
    }
    return this;
  }

  private getDataLoader(key: string): InternalDataLoader {
    const paramsEntry = this.params[key];
    if (!paramsEntry) {
      throw new ReferenceError(`Data for "key=${key}" is not set`);
    }
    return this.dataLoaders[paramsEntry.index];
  }
}

export default new HttpDataLoader();
