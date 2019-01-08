import HttpDataLoader, { ResponseType } from "../dist/http-dataloader";

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
        status: url.endsWith("/non-existent.json") ? 404 : 200,
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
        key: "config.json.name",
        responseType: ResponseType.Json,
        transform: (json: any) => json.name,
        url: "https://example.com/config.json"
      },
      {
        key: "version.txt",
        responseType: ResponseType.Text,
        url: "https://example.com/version.txt"
      },
      {
        key: "config.csv",
        responseType: ResponseType.Text,
        transform: (text: string) => text.split(","),
        url: "https://example.com/config.csv"
      },
      {
        key: "non-existent.json",
        url: "https://example.com/non-existent.json"
      }
    );
  });

  afterEach(() => {
    global.fetch = origin.fetch;
  });

  describe("ok", () => {
    test("responseType=json", async () => {
      const result = await HttpDataLoader.load("config.json");
      expect(result).toEqual({ name: "http-dataloader", version: "1.0.0" });
      expect(global.fetch.mock.calls.length).toBe(1);
      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://example.com/config.json"
      );
    });

    test("responseType=json with transform", async () => {
      const result = await HttpDataLoader.load("config.json.name");
      expect(result).toEqual("http-dataloader");
      expect(global.fetch.mock.calls.length).toBe(1);
      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://example.com/config.json"
      );
    });

    test("responseType=text", async () => {
      const result = await HttpDataLoader.load("version.txt");
      expect(result).toBe("1.0.0");
      expect(global.fetch.mock.calls.length).toBe(1);
      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://example.com/version.txt"
      );
    });

    test("responseType=text with transform", async () => {
      const result = await HttpDataLoader.load("config.csv");
      expect(result).toEqual(["http-dataloader", "1.0.0"]);
      expect(global.fetch.mock.calls.length).toBe(1);
      expect(global.fetch.mock.calls[0][0]).toBe(
        "https://example.com/config.csv"
      );
    });

    test("do not fetch data twice", async () => {
      const [json, text, csv] = await HttpDataLoader.load(
        "config.json",
        "version.txt",
        "config.csv"
      );
      expect(json).toEqual({ name: "http-dataloader", version: "1.0.0" });
      expect(text).toBe("1.0.0");
      expect(csv).toEqual(["http-dataloader", "1.0.0"]);
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
      const [json, text, csv] = await HttpDataLoader.clearAll().load(
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

      test("HTTP status is 404", async () => {
        await expect(
          HttpDataLoader.load("non-existent.json")
        ).rejects.toBeInstanceOf(URIError);
      });
    });
  });
});
