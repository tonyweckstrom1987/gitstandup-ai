/**
 * Rakentaa promptin annetulle kohdeprofiilille (--target).
 * Sama data, eri esitystapa - kts. README miksi tämä on kaikki mitä
 * kohdeprofiilit tekevät (ei erillistä logiikkaa per profiili).
 */
function buildPrompt(commits, target) {
  const commitList = commits
    .map((c) => `- [${c.hash}] ${c.message} (${c.author}, ${c.date})\n${indent(c.diffSummary)}`)
    .join("\n\n");

  const instructions = {
    slack: [
      "Kirjoita tiivis Slack-standup-viesti annetuista Git-commiteista.",
      "Käytä bullet-pointteja ja säästeliäästi emojeita.",
      "Rakenne: mitä tehtiin, mahdolliset esteet (jos pääteltävissä), mitä seuraavaksi (jos pääteltävissä).",
      "Pidä koko viesti alle 100 sanassa.",
    ],
    linkedin: [
      "Kirjoita 'build in public' -tyylinen LinkedIn-päivitys annetuista Git-commiteista.",
      "Tarinallinen mutta ei ylimyyvä sävy - kerro mitä opit tai rakensit, miksi se oli kiinnostavaa.",
      "Ei hashtag-spämmiä, korkeintaan 2-3 relevanttia hashtagia lopussa.",
      "150-250 sanaa.",
    ],
    markdown: [
      "Kirjoita jäsennelty Markdown-yhteenveto annetuista Git-commiteista, sopiva oppimispäiväkirjaan.",
      "Käytä otsikkoa, ja ryhmittele muutokset teemoittain jos useampi commit liittyy samaan asiaan.",
      "Mainitse teknisiä yksityiskohtia tarkemmin kuin Slack-versiossa - tämä on itselle, ei julkiselle yleisölle.",
    ],
  };

  const targetInstructions = instructions[target].join("\n");

  return `Olet avustaja joka muuntaa Git-commit-historian luettavaksi tekstiksi.

${targetInstructions}

Vastaa VAIN pyydetyllä tekstillä, ei selityksiä tai johdantoa ("Tässä yhteenveto:" tms.).

Git-commitit:

${commitList}`;
}

function indent(text) {
  return text
    .split("\n")
    .map((line) => (line ? `    ${line}` : line))
    .join("\n");
}

// Pienemmät paikalliset mallit (esim. Llama 3.2 3B) eivät aina noudata
// ohjetta jättää preambeli pois. Siivotaan yleisimmät tapaukset jälkikäteen
// sen sijaan että luotettaisiin pelkkään promptiohjeistukseen.
const PREAMBLE_PATTERN = /^(tässä|here'?s|voin auttaa|certainly|sure|of course),?\s.*:\s*$/i;

function stripPreamble(text) {
  const lines = text.split("\n");
  while (lines.length > 1 && PREAMBLE_PATTERN.test(lines[0].trim())) {
    lines.shift();
    while (lines.length && lines[0].trim() === "") lines.shift();
  }
  return lines.join("\n").trim();
}

module.exports = { buildPrompt, stripPreamble };
