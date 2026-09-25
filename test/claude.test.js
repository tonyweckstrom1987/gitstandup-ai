const test = require("node:test");
const assert = require("node:assert/strict");

function withMockedFetch(mockImpl, fn) {
  const original = global.fetch;
  global.fetch = mockImpl;
  return fn().finally(() => {
    global.fetch = original;
  });
}

test("claude.generate heittää selkeän virheen kun API-avain puuttuu", async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete require.cache[require.resolve("../lib/claude")];
  const { generate } = require("../lib/claude");

  await assert.rejects(() => generate("jokin prompti"), /ANTHROPIC_API_KEY puuttuu/);

  if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
});

test("claude.generate palauttaa trimmatun vastauksen onnistuessa", async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";

  await withMockedFetch(
    async () => ({
      ok: true,
      json: async () => ({ content: [{ text: "  Valmis yhteenveto  \n" }] }),
    }),
    async () => {
      delete require.cache[require.resolve("../lib/claude")];
      const { generate } = require("../lib/claude");
      const result = await generate("jokin prompti");
      assert.equal(result, "Valmis yhteenveto");
    }
  );

  if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
  else delete process.env.ANTHROPIC_API_KEY;
});

test("claude.generate heittää virheen kun API vastaa ei-ok-statuksella", async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";

  await withMockedFetch(
    async () => ({
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    }),
    async () => {
      delete require.cache[require.resolve("../lib/claude")];
      const { generate } = require("../lib/claude");
      await assert.rejects(() => generate("jokin prompti"), /Claude API palautti virheen 401/);
    }
  );

  if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
  else delete process.env.ANTHROPIC_API_KEY;
});
