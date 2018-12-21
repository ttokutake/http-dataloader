const DataLoader = require('dataloader');
require('isomorphic-fetch');

async function request(url, options = {}) {
  const { responseType, parseText } = options;
  const resp = await fetch(url, options);
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
    this.data = {};
  }

  set({key, url, options}) {
    if (this.data[key]) {
      return;
    }
    this.data[key] = new DataLoader(async () => [await request(url, options)]);
  }

  setAll(...params) {
    const ps = params.filter(({ key }) => !this.data[key]);
    const paramsMap = {};
    ps.forEach(param => {
      paramsMap[param.key] = param;
    });
    const dataLoader = new DataLoader(keys => Promise.all(keys.map(key => {
      const { url, options } = paramsMap[key];
      return request(url, options);
    })));
    ps.forEach(({ key }) => {
      this.data[key] = dataLoader;
    });
  }

  load(key) {
    return this.data[key].load(key);
  }
}

module.exports = new HttpDataLoader();
