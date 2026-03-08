const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const DEFAULT_OLLAMA_MODEL = "llama3.1";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

function extractJson(rawText) {
  // Extract JSON block if model wraps it in markdown code fences
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
  return JSON.parse(jsonString);
}

async function callAnthropic(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    const err = new Error("ANTHROPIC_API_KEY is missing or still using placeholder value.");
    err.code = "CONFIG_ERROR";
    throw err;
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = message.content[0].text;
  return extractJson(rawText);
}

async function callOllama(systemPrompt, userPrompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Ollama request failed (${response.status}): ${body || "No body"}`);
    err.code = "UPSTREAM_ERROR";
    throw err;
  }

  const payload = await response.json();
  if (!payload?.response || typeof payload.response !== "string") {
    const err = new Error("Ollama response missing expected `response` text.");
    err.code = "UPSTREAM_ERROR";
    throw err;
  }

  return extractJson(payload.response);
}

/**
 * Calls Claude API with a given prompt and returns parsed JSON.
 * Throws if the response is not valid JSON.
 */
async function callClaude(systemPrompt, userPrompt) {
  const provider = (process.env.AI_PROVIDER || "anthropic").trim().toLowerCase();

  if (provider === "ollama") {
    return callOllama(systemPrompt, userPrompt);
  }

  if (provider !== "anthropic") {
    const err = new Error("AI_PROVIDER must be either `anthropic` or `ollama`.");
    err.code = "CONFIG_ERROR";
    throw err;
  }

  return callAnthropic(systemPrompt, userPrompt);
}

module.exports = { callClaude };
