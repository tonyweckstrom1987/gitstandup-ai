const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function generate(prompt) {
  let response;
  try {
    response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });
  } catch (err) {
    throw new Error(
      `Ei saatu yhteyttä Ollamaan osoitteessa ${OLLAMA_URL}. ` +
        `Onko Ollama käynnissä? (aja: ollama serve). Alkuperäinen virhe: ${err.message}`
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama palautti virheen ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.response.trim();
}

module.exports = { generate };
