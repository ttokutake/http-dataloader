import HttpDataLoader = require("../dist/http-dataloader");

interface Global {
  fetch?: any;
}

declare const global: Global;

describe("HttpDataLoader", () => {
  const origin: Global = {};

  beforeEach(() => {
    origin.fetch = global.fetch;
    global.fetch = jest.fn(async url => {
      return {
        json: async () => ({ name: "http-dataloader", version: "1.0.0" }),
        text: async () =>
          url.endsWith("/version.txt") ? "1.0.0" : "http-dataloader,1.0.0"
      };
    });

    HttpDataLoader.set(
      {
        key: "config.json",
        url: "https://example.com/config.json"
      },
      {
        key: "version.txt",
        responseType: "text", // TODO: Error occurs if globals.ts-jest.diagnostics.warnOnly is false (default)
        url: "https://example.com/version.txt"
      },
      {
        key: "config.csv",
        parseText: (text: string) => text.split(","),
        responseType: "custom",
        url: "https://example.com/config.csv"
      }
    );
  });

  afterEach(() => {
    global.fetch = origin.fetch;
  });

  test("responseType: json", async () => {
    const result = await HttpDataLoader.load("config.json");
    expect(result).toEqual({ name: "http-dataloader", version: "1.0.0" });
    expect(global.fetch.mock.calls.length).toBe(1);
    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://example.com/config.json"
    );
  });

  test("responseType: text", async () => {
    const result = await HttpDataLoader.load("version.txt");
    expect(result).toBe("1.0.0");
    expect(global.fetch.mock.calls.length).toBe(1);
    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://example.com/version.txt"
    );
  });

  test("responseType: custom", async () => {
    const result = await HttpDataLoader.load("config.csv");
    expect(result).toEqual(["http-dataloader", "1.0.0"]);
    expect(global.fetch.mock.calls.length).toBe(1);
    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://example.com/config.csv"
    );
  });
});
