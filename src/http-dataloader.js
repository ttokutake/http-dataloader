const DataLoader = require('dataloader');
require('isomorphic-fetch');

async function request(url, options) {
  const { responseType, parseText } = options;
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
}

class HttpDataLoader {
  constructor() {
    this.params = {};
    this.data = [];
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
      if (options && options.responseType === 'custom' && typeof options.parseText !== 'function') {
        throw new TypeError('"options.parseText" must be Function when "options.responseType" is "custom"');
      }
    }
    params.filter(({ key }) => !this.params[key]).forEach(({ key, url, options }) => {
      this.params[key] = {
        index: this.data.length,
        url,
        options: options || {}
      };
    });
    const dataLoader = new DataLoader(keys => Promise.all(keys.map(key => {
      const { url, options } = this.params[key];
      return request(url, options);
    })));
    this.data.push(dataLoader);
  }

  getDataLoader(key) {
    const { index } = this.params[key];
    return this.data[index];
  }

  async load(...keys) {
    if (!keys.length) {
      throw new TypeError('Arguments must not be empty');
    }
    for (let i = 0, { length } = keys; i < length; i++) {
      const key = keys[i];
      if (typeof key !== 'string') {
        throw new TypeError('"key" must be String');
      }
      if (!(this.getDataLoader(key) instanceof DataLoader)) {
        throw new ReferenceError(`Data for key="${key}" is not set`);
      }
    }
    const result = await Promise.all(keys.map(key => this.getDataLoader(key).load(key)));
    if (result.length === 1) {
      return result[0];
    }
    return result;
  }
}

module.exports = new HttpDataLoader();
