const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPrompt, stripPreamble } = require("../lib/prompts");

const sampleCommits = [
  {
    hash: "abc1234",
    date: "2024-01-01T10:00:00Z",
    message: "Lisää uusi ominaisuus",
    author: "Tony",
    diffSummary: "lib/foo.js | 3 +++",
  },
  {
    hash: "def5678",
    date: "2024-01-02T10:00:00Z",
    message: "Korjaa bugi",
    author: "Tony",
    diffSummary: "",
  },
];

test("buildPrompt sisältää kaikki commitit hashilla ja viestillä", () => {
  const prompt = buildPrompt(sampleCommits, "slack");
  assert.match(prompt, /abc1234/);
  assert.match(prompt, /Lisää uusi ominaisuus/);
  assert.match(prompt, /def5678/);
  assert.match(prompt, /Korjaa bugi/);
});

test("buildPrompt sisentää diffSummaryn rivit", () => {
  const prompt = buildPrompt(sampleCommits, "slack");
  assert.match(prompt, /\n {4}lib\/foo\.js \| 3 \+\+\+/);
});

for (const target of ["slack", "linkedin", "markdown"]) {
  test(`buildPrompt tukee kohdeprofiilia "${target}"`, () => {
    const prompt = buildPrompt(sampleCommits, target);
    assert.equal(typeof prompt, "string");
    assert.ok(prompt.length > 0);
  });
}

test("buildPrompt heittää virheen tuntemattomalle kohdeprofiilille", () => {
  assert.throws(() => buildPrompt(sampleCommits, "ei-olemassa"));
});

test("stripPreamble poistaa suomenkielisen preambelirivin", () => {
  const text = "Tässä yhteenveto:\nEnsimmäinen rivi\nToinen rivi";
  assert.equal(stripPreamble(text), "Ensimmäinen rivi\nToinen rivi");
});

test("stripPreamble poistaa englanninkielisen preambelirivin", () => {
  const text = "Here's a summary:\n- kohta yksi\n- kohta kaksi";
  assert.equal(stripPreamble(text), "- kohta yksi\n- kohta kaksi");
});

test("stripPreamble ei koske sisältöä jossa ei ole preambelia", () => {
  const text = "- kohta yksi\n- kohta kaksi";
  assert.equal(stripPreamble(text), text);
});

test("stripPreamble ei tyhjennä koko tekstiä vaikka koko sisältö näyttäisi preambelilta", () => {
  const text = "Tässä yhteenveto:";
  assert.equal(stripPreamble(text), "Tässä yhteenveto:");
});

test("stripPreamble poistaa tyhjät rivit preambelin jälkeen", () => {
  const text = "Certainly, here it is:\n\n\nSisältö alkaa tästä";
  assert.equal(stripPreamble(text), "Sisältö alkaa tästä");
});
