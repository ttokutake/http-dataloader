# http-dataloader

[![CircleCI](https://circleci.com/gh/ttokutake/http-dataloader.svg?style=svg)](https://circleci.com/gh/ttokutake/http-dataloader)
[![codecov](https://codecov.io/gh/ttokutake/http-dataloader/branch/master/graph/badge.svg)](https://codecov.io/gh/ttokutake/http-dataloader)

`HttpDataLoader` is useful to load globally the immutable data like config file through HTTP.

## Getting Started

### Node.js (CommonJS)

```js
const { default: HttpDataLoader } = require('http-dataloader');
HttpDataLoader.set({ key: 'some_config', url: 'http://example.com/some_config.json' });

async function main() {
  const config = await HttpDataLoader.loadOne('some_config');
  // Use config as you like
  console.log(config);
}

main();
```

### ES6 import/export

```js
import HttpDataLoader from 'http-dataloader';
HttpDataLoader.set({ key: 'some_config', url: 'http://example.com/some_config.json' });

function main() {
  HttpDataLoader
    .loadOne('some_config')
    .then(config => {
      // Use config as you like
      console.log(config);
    });
}

main();
```

## APIs

- `set(...{ key: string, url: string, requestInit?: object, responseType?: 'text' | 'json', transform?: string | object => any }): HttpDataLoader`

TBD

- `loadOne(key: string): any`

TBD

- `load(...keys: string[]): any[]`

TBD

- `clear(...keys: string[]): HttpDataLoader`

TBD

- `clearAll(): HttpDataLoader`

TBD
