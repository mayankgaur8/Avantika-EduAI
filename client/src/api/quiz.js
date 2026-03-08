/**
 * Calls the backend quiz generation endpoint.
 * @param {Object} formData - Teacher input
 * @returns {Promise<Object>} - Generated quiz JSON
 */
export async function generateQuiz(formData) {
  const res = await fetch("/api/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...formData,
      numberOfQuestions: Number(formData.numberOfQuestions),
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const message =
      json.details
        ? json.details.map((d) => d.message).join(", ")
        : json.error || "Something went wrong";
    throw new Error(message);
  }

  return json.data;
}
