import HttpDataLoader = require("../dist/http-dataloader");

describe("HttpDataLoader", () => {
  test("ok", async () => {
    HttpDataLoader.set({
      key: "package",
      url:
        "https://raw.githubusercontent.com/ttokutake/http-dataloader/master/package.json"
    });
    const result = await HttpDataLoader.load("package");
    expect(result.name).toBe("http-dataloader");
  });
});
