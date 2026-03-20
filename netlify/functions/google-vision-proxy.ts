import type { Handler, HandlerEvent } from "@netlify/functions";

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY!;
const GOOGLE_VISION_ENDPOINT =
  "https://vision.googleapis.com/v1/images:annotate";

interface VisionProxyRequest {
  image: string; // base64 encoded image
  features: { type: string; maxResults?: number }[];
  languageHints?: string[];
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!GOOGLE_VISION_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Google Vision API key not configured" }),
    };
  }

  try {
    const payload: VisionProxyRequest = JSON.parse(event.body || "{}");

    if (!payload.image || typeof payload.image !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid image data" }),
      };
    }

    if (!payload.features || !Array.isArray(payload.features)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid features" }),
      };
    }

    // Limit image size to 10MB base64 (~7.5MB raw)
    if (payload.image.length > 10 * 1024 * 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Image too large (max 10MB)" }),
      };
    }

    const requestPayload = {
      requests: [
        {
          image: { content: payload.image },
          features: payload.features,
          imageContext: {
            languageHints: payload.languageHints || ["en"],
            textDetectionParams: {
              enableTextDetectionConfidenceScore: true,
            },
          },
        },
      ],
    };

    const response = await fetch(GOOGLE_VISION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_VISION_API_KEY,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Vision API error:", response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Google Vision API request failed" }),
      };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Google Vision proxy error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
