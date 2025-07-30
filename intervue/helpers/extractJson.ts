export function extractJsonArray(raw: string): any[] {
    console.log(raw)
  // Step 1: Remove the code block if present
  const cleaned = raw
    .replace(/^```json\s*/i, '')  // remove starting ```json
    .replace(/```$/, '')          // remove trailing ```
    .trim();

  // Step 2: Try to parse it as JSON
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      throw new Error("Parsed data is not an array");
    }
  } catch (error) {
    console.error("Invalid JSON format:", error);
    return [];
  }
}