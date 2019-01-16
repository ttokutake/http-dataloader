# http-dataloader

[![CircleCI](https://circleci.com/gh/ttokutake/http-dataloader.svg?style=svg)](https://circleci.com/gh/ttokutake/http-dataloader)
[![codecov](https://codecov.io/gh/ttokutake/http-dataloader/branch/master/graph/badge.svg)](https://codecov.io/gh/ttokutake/http-dataloader)

`HttpDataLoader` is useful to load globally the immutable data like config file through HTTP.

## Getting Started

### Node.js (CommonJS)

```js
const { default: HttpDataLoader } = require("http-dataloader");
HttpDataLoader.set({
  key: "some_config",
  url: "http://example.com/some_config.json"
});

async function main() {
  const config = await HttpDataLoader.loadOne("some_config");
  // Use config as you like
  console.log(config);
}

main();
```

### ES6 import/export

```js
import HttpDataLoader from "http-dataloader";
HttpDataLoader.set({
  key: "some_config",
  url: "http://example.com/some_config.json"
});

function main() {
  HttpDataLoader.loadOne("some_config").then(config => {
    // Use config as you like
    console.log(config);
  });
}

main();
```

## APIs

### `set(...{ key: string, url: string, requestInit?: object, responseType?: "text" | "json", transform?: string | object => any }): HttpDataLoader`

#### Example

```js
import HttpDataLoader from "http-dataloader";

HttpDataLoader.set(
  { key: "config1", url: "http://example.com/config1.json" },
  {
    key: "config2",
    url: "http://example.com/config2.json",
    responseType: "text"
  },
  {
    key: "config3",
    url: "http://example.com/config3.json",
    responseType: "text",
    transform: text => text.split(",")
  }
);

// You can use method chaining
HttpDataLoader.set({ key: "config1", url: "http://example.com/config1.json" })
  .set({
    key: "config2",
    url: "http://example.com/config2.json",
    responseType: "text"
  })
  .set({
    key: "config3",
    url: "http://example.com/config3.json",
    responseType: "text",
    transform: text => text.split(",")
  });
```

#### Parameters

- `key`: Key string to load the data by `loadOne()` and `load()`.
- `url`: URL from which the data is loaded.
- `requestInit`: Request options same as [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_your_own_request_object).
- `responseType`: `"text"` or `"json"`.
- `transform`: Function to transform response body.

### `loadOne(key: string): any`

#### Example

```js
import HttpDataLoader from "http-dataloader"; // set() is done in other files

async function some_function() {
  const config2 = await HttpDataLoader.loadOne("config2");
  // Use config2 as you like
}
```

### `load(...keys: string[]): any[]`

#### Example

```js
import HttpDataLoader from "http-dataloader"; // set() is done in other files

async function some_function() {
  const [config1, config2, config3] = await HttpDataLoader.load(
    "config1",
    "config2",
    "config3"
  );
  // Use config1, config2 and config3 as you like
}
```

### `clear(...keys: string[]): HttpDataLoader`

#### Example

```js
import HttpDataLoader from "http-dataloader"; // set() is done in other files

async function some_function() {
  HttpDataLoader.clear("config2", "config3");
  const [config2, config3] = await HttpDataLoader.load("config2", "config3");
  // Use fresh config2 and config3 as you like
}

// You can use method chaining
async function some_function() {
  const config2 = await HttpDataLoader.clear("config2").loadOne("config2");
  // Use fresh config2 as you like
}
```

### `clearAll(): HttpDataLoader`

#### Example

```js
import HttpDataLoader from "http-dataloader"; // set() is done in other files

async function some_function() {
  HttpDataLoader.clearAll();
  const [config1, config2, config3] = await HttpDataLoader.load(
    "config1",
    "config2",
    "config3"
  );
  // Use fresh config1, config2 and config3 as you like
}

// You can use method chaining
async function some_function() {
  const [config1, config2, config3] = await HttpDataLoader.clearAll().loadOne(
    "config1",
    "config2",
    "config3"
  );
  // Use fresh config1, config2 and config3 as you like
}
```
