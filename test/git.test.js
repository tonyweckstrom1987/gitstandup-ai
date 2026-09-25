const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const simpleGit = require("simple-git");
const { collectCommits } = require("../lib/git");

async function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gitstandup-test-"));
  const git = simpleGit(dir);
  await git.init();
  await git.addConfig("user.email", "test@example.com");
  await git.addConfig("user.name", "Test");
  return { dir, git };
}

test("collectCommits palauttaa tehdyt commitit uusimmasta vanhimpaan", async () => {
  const { dir, git } = await makeTempRepo();
  fs.writeFileSync(path.join(dir, "a.txt"), "eka");
  await git.add(".");
  await git.commit("Ensimmäinen commit");

  fs.writeFileSync(path.join(dir, "b.txt"), "toka");
  await git.add(".");
  await git.commit("Toinen commit");

  const commits = await collectCommits(dir, 1);

  assert.equal(commits.length, 2);
  assert.equal(commits[0].message, "Toinen commit");
  assert.equal(commits[1].message, "Ensimmäinen commit");
  assert.match(commits[0].hash, /^[0-9a-f]{7}$/);
  assert.match(commits[0].diffSummary, /b\.txt/);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("collectCommits palauttaa tyhjän listan tuoreelle repolle ilman committeja", async () => {
  const { dir } = await makeTempRepo();

  const commits = await collectCommits(dir, 1);

  assert.deepEqual(commits, []);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("collectCommits heittää virheen kun polku ei ole Git-repositorio", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gitstandup-notrepo-"));

  await assert.rejects(() => collectCommits(dir, 1), /ei ole Git-repositorio/);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("collectCommits ei palauta committeja days-ikkunan ulkopuolelta", async () => {
  const { dir, git } = await makeTempRepo();
  fs.writeFileSync(path.join(dir, "a.txt"), "eka");
  await git.add(".");
  // git log --since suodattaa commit-päivämäärän (GIT_COMMITTER_DATE)
  // perusteella, ei author-päivämäärän - asetetaan siis molemmat kauas
  // menneisyyteen ympäristömuuttujilla.
  await git.env({
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00",
  }).commit("Vanha commit");

  const commits = await collectCommits(dir, 1);

  assert.deepEqual(commits, []);

  fs.rmSync(dir, { recursive: true, force: true });
});
