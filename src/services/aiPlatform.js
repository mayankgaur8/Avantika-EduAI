const AI_PLATFORM_URL = process.env.AI_PLATFORM_URL?.trim();
const AI_PLATFORM_API_KEY = process.env.AI_PLATFORM_API_KEY?.trim();

/**
 * Calls shared-ai-interface-backend for any AI generation task.
 *
 * @param {object} opts
 * @param {string} opts.feature   - e.g. "assignment_generator"
 * @param {string} opts.prompt    - e.g. "assignment.generate.v1"
 * @param {object} opts.input     - feature-specific variables
 * @param {string} [opts.model]   - optional model override
 * @param {string} [opts.userId]  - optional, for platform-side logging
 * @returns {Promise<{data: object, meta: object}>}
 */
async function callAIPlatform({ feature, prompt, input, model, userId }) {
  if (!AI_PLATFORM_URL) {
    const err = new Error("AI_PLATFORM_URL is not configured in environment.");
    err.code = "CONFIG_ERROR";
    throw err;
  }
  if (!AI_PLATFORM_API_KEY) {
    const err = new Error("AI_PLATFORM_API_KEY is not configured in environment.");
    err.code = "CONFIG_ERROR";
    throw err;
  }

  const t0 = Date.now();
  console.log(`[AIPlatform] REQUEST  feature=${feature}  prompt=${prompt}  model=${model || "platform-default"}`);
  console.log(`[AIPlatform] calling ${AI_PLATFORM_URL}/v1/ai/generate … (+0 ms)`);

  // 110 s — intentionally below Azure App Service's ~120 s gateway timeout so we
  // get a clean TIMEOUT_ERROR instead of an opaque 504 from the load balancer.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);

  const body = {
    app: "eduai",
    feature,
    prompt,
    input: { ...input, _user_id: userId },
  };
  if (model) body.model = model;

  let response;
  try {
    response = await fetch(`${AI_PLATFORM_URL}/v1/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": AI_PLATFORM_API_KEY,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    console.log(`[AIPlatform] HTTP ${response.status} received after ${Date.now() - t0} ms`);
  } catch (fetchErr) {
    console.error(`[AIPlatform] fetch ERROR after ${Date.now() - t0} ms — ${fetchErr.message}`);
    if (fetchErr.name === "AbortError") {
      const err = new Error(
        `AI platform request timed out after ${Date.now() - t0} ms (limit 110 s). ` +
        "The Azure gateway would have killed it at ~120 s anyway — likely a slow model or retry loop inside the platform."
      );
      err.code = "TIMEOUT_ERROR";
      throw err;
    }
    const err = new Error(`AI platform unreachable: ${fetchErr.message}`);
    err.code = "UPSTREAM_ERROR";
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    console.error(`[AIPlatform] non-OK response body: ${responseBody.slice(0, 500)}`);
    const err = new Error(`AI platform error (${response.status}): ${responseBody}`);
    err.code = "UPSTREAM_ERROR";
    err.status = response.status;
    throw err;
  }

  console.log(`[AIPlatform] parsing response JSON … (+${Date.now() - t0} ms)`);
  const result = await response.json();
  console.log(`[AIPlatform] response parsed — total ${Date.now() - t0} ms`);

  if (result.status !== "success" || !result.data) {
    const err = new Error("AI platform returned unexpected response structure.");
    err.code = "UPSTREAM_ERROR";
    throw err;
  }

  return { data: result.data, meta: result.meta };
}

module.exports = { callAIPlatform };
