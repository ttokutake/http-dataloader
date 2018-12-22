const DataLoader = require('dataloader');
require('isomorphic-fetch');

async function request(url, options) {
  const { responseType, parseText } = options;
  if (responseType === 'custom' && typeof parseText !== 'function') {
    throw new TypeError('"parseText" must be Function when "responseType" is "custom"');
  }
  try {
    const resp = await fetch(url, options);
    if (resp.status >= 400) {
      throw new URIError(`HTTP response's status is ${resp.status}, body is "${await resp.text()}"`);
    }
    switch (responseType) {
      case 'text': {
        return resp.text();
      }
      case 'custom': {
        const respBody = await resp.text();
        return parseText(respBody);
      }
      case 'json':
      default: {
        return resp.json();
      }
    }
  } catch (err) {
    throw err;
  }
}

class HttpDataLoader {
  constructor() {
    this.data = {};
  }

  set(...params) {
    for (let i = 0, { length } = params; i < length; i++) {
      const { key, url, options } = params[i];
      if (typeof key !== 'string') {
        throw new TypeError('"key" must be String');
      }
      if (typeof url !== 'string') {
        throw new TypeError('"url" must be String');
      }
      if (!(typeof options === 'object' || options === undefined)) {
        throw new TypeError('"options" must be Object, Null or Undefined');
      }
    }
    const ps = params.filter(({ key }) => !this.data[key]);
    const paramsMap = {};
    ps.forEach(param => {
      paramsMap[param.key] = param;
    });
    const dataLoader = new DataLoader(keys => Promise.all(keys.map(key => {
      const { url, options } = paramsMap[key];
      return request(url, options || {});
    })));
    ps.forEach(({ key }) => {
      this.data[key] = dataLoader;
    });
  }

  async load(...keys) {
    if (!keys.length) {
      throw new TypeError('Argument must be set');
    }
    for (let i = 0, { length } = keys; i < length; i++) {
      const key = keys[i];
      if (typeof key !== 'string') {
        throw new TypeError('"key" must be String');
      }
      if (!(this.data[key] instanceof DataLoader)) {
        throw new ReferenceError(`"url" whose "key" is "${key}" is not set`);
      }
    }
    const result = await Promise.all(keys.map(key => this.data[key].load(key)));
    if (result.length === 1) {
      return result[0];
    }
    return result;
  }
}

module.exports = new HttpDataLoader();
