import { NextResponse } from "next/server";
import { z } from "zod";

import { getOpenAIClient, isTestingMode } from "@/lib/ai/openai";
import { ApiError, handleApiError, requireUser } from "@/lib/api/route-helpers";

const requestSchema = z.object({
  propertyDetails: z.object({
    title: z.string().optional(),
    address: z.string().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    price: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const { propertyDetails } = requestSchema.parse(await req.json());
    await requireUser();

    if (isTestingMode()) {
      // Return a sample property image from Unsplash
      const sampleImages = [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505692794403-55b9b9d2a3aa?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1200&q=80",
      ];
      const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      return NextResponse.json({
        imageUrl: randomImage,
      });
    }

    const client = getOpenAIClient();
    if (!client) {
      throw new ApiError("OpenAI client not configured", 500);
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
      throw new ApiError("Failed to generate image", 500);
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return handleApiError(error);
  }
}

