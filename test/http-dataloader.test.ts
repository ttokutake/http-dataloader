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

  describe("ok", () => {
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

    test("do not fetch data twice", async () => {
      const result = await HttpDataLoader.load("config.json");
      expect(result).toEqual({ name: "http-dataloader", version: "1.0.0" });
      expect(global.fetch.mock.calls.length).toBe(0);
    });

    test("clear data", async () => {
      const result = await HttpDataLoader.clear("config.json").load(
        "config.json"
      );
      expect(result).toEqual({ name: "http-dataloader", version: "1.0.0" });
      expect(global.fetch.mock.calls.length).toBe(1);
      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://example.com/config.json"
      );
    });

    test("clear all data", async () => {
      HttpDataLoader.clear();
      const [json, text, csv] = await HttpDataLoader.load(
        "config.json",
        "version.txt",
        "config.csv"
      );
      expect(json).toEqual({ name: "http-dataloader", version: "1.0.0" });
      expect(text).toBe("1.0.0");
      expect(csv).toEqual(["http-dataloader", "1.0.0"]);
      expect(global.fetch.mock.calls.length).toBe(3);
      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://example.com/config.json"
      );
      expect(global.fetch.mock.calls[1][0]).toBe(
        "https://example.com/version.txt"
      );
      expect(global.fetch.mock.calls[2][0]).toBe(
        "https://example.com/config.csv"
      );
    });
  });

  describe("error", () => {
    test("set()", () => {
      const run = () => HttpDataLoader.set();
      expect(run).toThrow(TypeError);
    });

    describe("load()", () => {
      test("empty arguments", async () => {
        await expect(HttpDataLoader.load()).rejects.toBeInstanceOf(TypeError);
      });

      test("non-existent key", async () => {
        await expect(HttpDataLoader.load("config.xml")).rejects.toBeInstanceOf(
          ReferenceError
        );
      });
    });
  });
});
