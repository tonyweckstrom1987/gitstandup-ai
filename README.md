# gitstandup-ai

Lukee Git-commit-historiasi ja muuntaa sen tekoälyn avulla luettavaksi yhteenvedoksi — Slack-standup-viestiksi, LinkedIn-päivitykseksi tai oppimispäiväkirjamerkinnäksi.

[![CI](https://github.com/tonyweckstrom1987/gitstandup-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/tonyweckstrom1987/gitstandup-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> *"Kyllästyin miettimään joka aamu standupissa mitä tein eilen — joten rakensin CLI-työkalun joka tekee sen puolestani."*

## Käyttö

```bash
npx gitstandup-ai --target slack --days 1
```

```
Käyttö: gitstandup-ai [optiot]

Optiot:
  --days <n>       kuinka monelta päivältä commitit kerätään (oletus: 1)
  --target <t>     tulostusprofiili: slack, linkedin tai markdown (oletus: slack)
  --model <m>      generointimalli: ollama tai claude (oletus: ollama)
  --repo <path>    Git-repositorion polku (oletus: nykyinen hakemisto)
```

### Esimerkkejä

```bash
# Tämän viikon commitit LinkedIn-päivitykseksi
gitstandup-ai --target linkedin --days 7

# Oppimispäiväkirjamerkintä toisesta repositoriosta
gitstandup-ai --target markdown --repo ../toinen-projekti

# Claude API käytössä (parempi laatu, maksaa senttiluokkaa per ajo)
gitstandup-ai --model claude --target slack
```

## Asennus paikalliseen kehitykseen

```bash
git clone <repo>
cd gitstandup-ai
npm install
node bin/cli.js --target slack --days 1
```

## Kaksi generointivaihtoehtoa

- **`--model ollama`** (oletus) — täysin ilmainen ja paikallinen, vaatii [Ollaman](https://ollama.com) asennettuna (`ollama serve` käynnissä). Laatu riippuu suoraan käytetystä mallista — pienet mallit (esim. 3B-parametriset kuten `llama3.2`) tuottavat toimivan mutta ajoittain kömpelön yhteenvedon eivätkä aina noudata muotoiluohjeita täydellisesti.
- **`--model claude`** — parempi laatu, vaatii `ANTHROPIC_API_KEY`:n `.env`-tiedostoon (kopioi `.env.example`). Kustannus senttiluokkaa per ajo (Haiku-malli, lyhyt konteksti).

## Miksi ei LangChainia tai vektoritietokantaa

Tietoisesti pidetty yksinkertaisena: Git-historian lukeminen (`simple-git`) ja yksi LLM-kutsu per ajo eivät tarvitse kehystä välissä — jokainen pala on itse rakennettu ja ymmärrettävä.

## Rakenne

```
bin/cli.js       komentorivin jäsennys (commander) ja pääsilmukka
lib/git.js       Git-historian haku (simple-git), --days-ikkunan suodatus
lib/prompts.js   promptin rakennus per kohdeprofiili + preambelin siivous
lib/ollama.js    generointibackend: paikallinen Ollama-palvelin
lib/claude.js    generointibackend: Anthropic Claude API
test/            node:test-testit jokaiselle yllä olevalle moduulille
.github/
  workflows/
    ci.yml       aja testit joka pushissa ja pull requestissa
```

Kaikki `--target`-profiilit (`slack`, `linkedin`, `markdown`) käyttävät samaa
`buildPrompt`-funktiota eri ohjeteksteillä — ei erillistä logiikkaa per
profiili, ks. `lib/prompts.js`.

## Testit

Testit on kirjoitettu Node.js:n sisäänrakennetulla `node:test`-moduulilla
(ei ulkoista testikehystä), samassa "ei ylimääräisiä riippuvuuksia"
-hengessä kuin loppu projekti.

```bash
npm test
```

Kattaa:

- `lib/prompts.js` — promptin rakennus per kohdeprofiili, preambelin siivous
- `lib/git.js` — commit-historian haku, `--days`-ikkunan suodatus, virheet
  (repo ei ole olemassa, ei yhtään committia)
- `lib/ollama.js` / `lib/claude.js` — onnistunut generointi ja virhetilanteet
  (fetch epäonnistuu, virheellinen API-vastaus, puuttuva API-avain) mockatulla
  `fetch`-funktiolla
- `bin/cli.js` — komentoriviargumenttien validointi ja poistumiskoodit
  (spawnattuna erillisenä prosessina)

CI (`.github/workflows/ci.yml`) ajaa testit automaattisesti joka pushilla ja
pull requestilla Node.js-versioilla 18, 20 ja 22.

## Tunnetut rajoitukset

- Pienet paikalliset mallit voivat tuottaa epätarkkoja "mahdollisia esteitä" tai muuta spekulaatiota jota commit-viesteistä ei suoraan voi päätellä — lue tuloste kriittisesti, älä kopioi sokeasti.
- `--days`-ikkuna perustuu commit-aikaleimoihin, ei kellonaikaan päivän vaihtumisesta.
