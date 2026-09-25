#!/usr/bin/env node
require("dotenv").config({ quiet: true });

const { Command } = require("commander");
const path = require("path");
const { collectCommits } = require("../lib/git");
const { buildPrompt, stripPreamble } = require("../lib/prompts");

const program = new Command();

program
  .name("gitstandup-ai")
  .description("Muuntaa Git-commit-historian AI:n avulla luettavaksi yhteenvedoksi")
  .option("--days <n>", "kuinka monelta päivältä commitit kerätään", "1")
  .option("--target <target>", "tulostusprofiili: slack, linkedin tai markdown", "slack")
  .option("--model <model>", "generointimalli: ollama (paikallinen, ilmainen) tai claude", "ollama")
  .option("--repo <path>", "Git-repositorion polku", ".")
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const validTargets = ["slack", "linkedin", "markdown"];
  if (!validTargets.includes(opts.target)) {
    console.error(`Tuntematon --target: ${opts.target} (sallitut: ${validTargets.join(", ")})`);
    process.exit(1);
  }

  const validModels = ["ollama", "claude"];
  if (!validModels.includes(opts.model)) {
    console.error(`Tuntematon --model: ${opts.model} (sallitut: ${validModels.join(", ")})`);
    process.exit(1);
  }

  const repoPath = path.resolve(opts.repo);
  const days = Number(opts.days);
  if (!Number.isInteger(days) || days < 1) {
    console.error(`--days pitää olla positiivinen kokonaisluku, saatiin: ${opts.days}`);
    process.exit(1);
  }

  let commits;
  try {
    commits = await collectCommits(repoPath, days);
  } catch (err) {
    console.error(`Virhe Git-historian haussa: ${err.message}`);
    process.exit(1);
  }

  if (commits.length === 0) {
    console.log(`Ei commiteja viimeisen ${days} päivän ajalta polussa ${repoPath}.`);
    return;
  }

  const prompt = buildPrompt(commits, opts.target);

  const backend = opts.model === "claude" ? require("../lib/claude") : require("../lib/ollama");

  let summary;
  try {
    summary = await backend.generate(prompt);
  } catch (err) {
    console.error(`Virhe generoinnissa: ${err.message}`);
    process.exit(1);
  }

  console.log(stripPreamble(summary));
}

main();
