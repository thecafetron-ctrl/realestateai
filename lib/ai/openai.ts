import OpenAI from "openai";

const API_KEY_ENV = ["OPENAI_API_KEY", "NEXT_PUBLIC_OPENAI_API_KEY", "OPENAI_KEY"] as const;

let cachedClient: OpenAI | null = null;

export function getOpenAIKey() {
  for (const key of API_KEY_ENV) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function getOpenAIClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return null;
  }

  cachedClient = new OpenAI({
    apiKey,
  });

  return cachedClient;
}

export function isTestingMode() {
  return !getOpenAIKey();
}

export async function generatePropertyImage(propertyDetails: {
  title?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  highlights?: string[];
  price?: string;
}): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI client not configured");
  }

  const description = [
    propertyDetails.title || "Luxury real estate property",
    propertyDetails.address ? `Located at ${propertyDetails.address}` : "",
    propertyDetails.bedrooms ? `${propertyDetails.bedrooms} bedrooms` : "",
    propertyDetails.bathrooms ? `${propertyDetails.bathrooms} bathrooms` : "",
    propertyDetails.description || "",
    propertyDetails.highlights?.length ? `Features: ${propertyDetails.highlights.slice(0, 3).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const prompt = `Professional real estate photography of a luxury property: ${description}. Architectural photography, natural lighting, modern design, elegant interior, high-end finishes, wide angle shot, magazine quality, 4K resolution`;

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("Failed to generate image");
  }

  return imageUrl;
}


