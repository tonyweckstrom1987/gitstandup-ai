const test = require("node:test");
const assert = require("node:assert/strict");

function withMockedFetch(mockImpl, fn) {
  const original = global.fetch;
  global.fetch = mockImpl;
  return fn().finally(() => {
    global.fetch = original;
  });
}

test("ollama.generate palauttaa trimmatun vastauksen onnistuessa", async () => {
  await withMockedFetch(
    async () => ({
      ok: true,
      json: async () => ({ response: "  Valmis yhteenveto  \n" }),
    }),
    async () => {
      delete require.cache[require.resolve("../lib/ollama")];
      const { generate } = require("../lib/ollama");
      const result = await generate("jokin prompti");
      assert.equal(result, "Valmis yhteenveto");
    }
  );
});

test("ollama.generate heittää selkeän virheen kun yhteys epäonnistuu", async () => {
  await withMockedFetch(
    async () => {
      throw new Error("connect ECONNREFUSED");
    },
    async () => {
      delete require.cache[require.resolve("../lib/ollama")];
      const { generate } = require("../lib/ollama");
      await assert.rejects(() => generate("jokin prompti"), /Ei saatu yhteyttä Ollamaan/);
    }
  );
});

test("ollama.generate heittää virheen kun palvelin vastaa ei-ok-statuksella", async () => {
  await withMockedFetch(
    async () => ({
      ok: false,
      status: 500,
      text: async () => "internal error",
    }),
    async () => {
      delete require.cache[require.resolve("../lib/ollama")];
      const { generate } = require("../lib/ollama");
      await assert.rejects(() => generate("jokin prompti"), /Ollama palautti virheen 500/);
    }
  );
});
