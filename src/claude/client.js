const OpenAI = require("openai");

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_OLLAMA_MODEL = "llama3.1";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

function extractJson(rawText) {
  // Extract JSON block if model wraps it in markdown code fences
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
  return JSON.parse(jsonString);
}

async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    const err = new Error("OPENAI_API_KEY is missing or still using placeholder value.");
    err.code = "CONFIG_ERROR";
    throw err;
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4096,
  });

  const rawText = completion.choices?.[0]?.message?.content?.trim();
  if (!rawText) {
    const err = new Error("OpenAI returned an empty response.");
    err.code = "UPSTREAM_ERROR";
    throw err;
  }

  return extractJson(rawText);
}

async function callOllama(systemPrompt, userPrompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min timeout

  let response;
  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
      }),
    });
  } catch (fetchErr) {
    const err = new Error(`Ollama unreachable: ${fetchErr.message}`);
    err.code = "UPSTREAM_ERROR";
    throw err;
  } finally {
    clearTimeout(timeout);
  }

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

async function callLLM(systemPrompt, userPrompt) {
  const provider = (process.env.AI_PROVIDER || "ollama").trim().toLowerCase();

  if (provider === "ollama") {
    return callOllama(systemPrompt, userPrompt);
  }

  if (provider !== "openai") {
    const err = new Error("AI_PROVIDER must be either `openai` or `ollama`.");
    err.code = "CONFIG_ERROR";
    throw err;
  }

  return callOpenAI(systemPrompt, userPrompt);
}

module.exports = { callLLM };
