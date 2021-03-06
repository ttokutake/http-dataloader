# HttpDataLoader

[![CircleCI](https://circleci.com/gh/ttokutake/http-dataloader.svg?style=svg)](https://circleci.com/gh/ttokutake/http-dataloader)
[![codecov](https://codecov.io/gh/ttokutake/http-dataloader/branch/master/graph/badge.svg)](https://codecov.io/gh/ttokutake/http-dataloader)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ttokutake/http-dataloader)](https://dependabot.com)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

HttpDataLoader is useful to load globally the immutable data like config file through HTTP.

## Notice

- HttpDataLoader highly depends on [DataLoader](https://github.com/facebook/dataloader).
- Please prepare a JavaScript environment which allow to use [ES6 Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) classes,
  and [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) API.

## Installation

```bash
npm install --save http-dataloader
```

## Getting Started

### Node.js (CommonJS)

```js
const { default: HttpDataLoader } = require("http-dataloader");
HttpDataLoader.set({
  key: "some_config",
  url: "http://example.com/some_config.json"
});

async function some_function1() {
  const config = await HttpDataLoader.loadOne("some_config"); // Fetch the data from "url"
  // Use config as you like
  console.log(config);
}

async function some_function2() {
  const config = await HttpDataLoader.loadOne("some_config"); // Load the data on memory cache
  // Use config as you like
  console.log(config);
}

some_function1();
some_function2();
```

### ES6 import/export

```js
import HttpDataLoader from "http-dataloader";
HttpDataLoader.set({
  key: "some_config",
  url: "http://example.com/some_config.json"
});

function some_function1() {
  // Fetch the data from "url"
  HttpDataLoader.loadOne("some_config").then(config => {
    // Use config as you like
    console.log(config);
  });
}

function some_function2() {
  // Use the data on memory cache
  HttpDataLoader.loadOne("some_config").then(config => {
    // Use config as you like
    console.log(config);
  });
}

some_function1();
some_function2();
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

async function some_function1() {
  HttpDataLoader.clear("config2", "config3");
  const [config2, config3] = await HttpDataLoader.load("config2", "config3");
  // Use fresh config2 and config3 as you like
}

// You can use method chaining
async function some_function2() {
  const config2 = await HttpDataLoader.clear("config2").loadOne("config2");
  // Use fresh config2 as you like
}
```

### `clearAll(): HttpDataLoader`

#### Example

```js
import HttpDataLoader from "http-dataloader"; // set() is done in other files

async function some_function1() {
  HttpDataLoader.clearAll();
  const [config1, config2, config3] = await HttpDataLoader.load(
    "config1",
    "config2",
    "config3"
  );
  // Use fresh config1, config2 and config3 as you like
}

// You can use method chaining
async function some_function2() {
  const [config1, config2, config3] = await HttpDataLoader.clearAll().loadOne(
    "config1",
    "config2",
    "config3"
  );
  // Use fresh config1, config2 and config3 as you like
}
```
