export async function fetchQlooSuggestions(category: string, query: string): Promise<string[]> {
  const apiKey = import.meta.env.VITE_QLOO_API_KEY;
  // Use the correct hackathon API server URL
  const baseUrl = "https://hackathon.api.qloo.com/production/search";
  const url = `${baseUrl}?query=${encodeURIComponent(query)}`;

  // Debug logs
  console.log("[Qloo] Using API key:", apiKey);
  console.log("[Qloo] Endpoint:", url);
  console.log("[Qloo] Query:", query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Qloo] Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error("Qloo API error: " + response.statusText);
  }

  const data = await response.json();
  // Adjust this based on Qloo's actual response structure
  // Assume data.results is an array of entities with a 'name' property
  return (data.results || []).map((item: any) => item.name);
} 