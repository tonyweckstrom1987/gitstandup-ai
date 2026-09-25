const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const simpleGit = require("simple-git");

const CLI = path.join(__dirname, "..", "bin", "cli.js");

function runCli(args, options = {}) {
  return spawnSync("node", [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, OLLAMA_URL: "http://127.0.0.1:1/nope" },
    ...options,
  });
}

test("tuntematon --target palauttaa virheen ja poistuu koodilla 1", () => {
  const result = runCli(["--target", "ei-olemassa"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Tuntematon --target/);
});

test("tuntematon --model palauttaa virheen ja poistuu koodilla 1", () => {
  const result = runCli(["--model", "ei-olemassa"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Tuntematon --model/);
});

test("virheellinen --days (ei kokonaisluku) palauttaa virheen", () => {
  const result = runCli(["--days", "abc"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--days pitää olla positiivinen kokonaisluku/);
});

test("osittain numeerinen --days (esim. '2abc') hylätään", () => {
  const result = runCli(["--days", "2abc"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--days pitää olla positiivinen kokonaisluku/);
});

test("negatiivinen --days hylätään", () => {
  const result = runCli(["--days", "-1"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--days pitää olla positiivinen kokonaisluku/);
});

test("olematon --repo-polku palauttaa virheen", () => {
  const result = runCli(["--repo", "/polkua/ei/ole/olemassa"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Virhe Git-historian haussa/);
});

test("tuore repo ilman committeja tulostaa ystävällisen viestin ja poistuu koodilla 0", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gitstandup-cli-"));
  const git = simpleGit(dir);
  await git.init();

  const result = runCli(["--repo", dir]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Ei commiteja/);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("generointivirhe (Ollama ei vastaa) raportoidaan ja poistutaan koodilla 1", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gitstandup-cli-gen-"));
  const git = simpleGit(dir);
  await git.init();
  await git.addConfig("user.email", "test@example.com");
  await git.addConfig("user.name", "Test");
  fs.writeFileSync(path.join(dir, "a.txt"), "eka");
  await git.add(".");
  await git.commit("Ensimmäinen commit");

  const result = runCli(["--repo", dir]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Virhe generoinnissa/);

  fs.rmSync(dir, { recursive: true, force: true });
});
