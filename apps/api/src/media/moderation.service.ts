import { Injectable, Logger } from "@nestjs/common";

export type SafeSearchLikelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

export type AiModerationResult = {
  adult: SafeSearchLikelihood;
  violence: SafeSearchLikelihood;
  racy: SafeSearchLikelihood;
  flagged: boolean;
  checkedAt: string;
};

const LIKELY_LEVELS = new Set<SafeSearchLikelihood>(["LIKELY", "VERY_LIKELY"]);
const POSSIBLE_ADULT = new Set<SafeSearchLikelihood>(["POSSIBLE", "LIKELY", "VERY_LIKELY"]);

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  /**
   * Run Google Vision SafeSearch on a GCS object.
   * Returns null if Vision is unavailable (local dev, no credentials, etc.)
   */
  async checkPhoto(
    gcsUri: string,
  ): Promise<AiModerationResult | null> {
    try {
      const token = await this.getGcpToken();
      if (!token) return null;

      const res = await fetch(
        "https://vision.googleapis.com/v1/images:annotate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: { source: { gcsImageUri: gcsUri } },
                features: [{ type: "SAFE_SEARCH_DETECTION" }],
              },
            ],
          }),
        },
      );

      if (!res.ok) {
        this.logger.warn(`Vision API returned ${res.status} for ${gcsUri}`);
        return null;
      }

      const data = (await res.json()) as {
        responses: Array<{
          safeSearchAnnotation?: {
            adult: SafeSearchLikelihood;
            violence: SafeSearchLikelihood;
            racy: SafeSearchLikelihood;
          };
          error?: { message: string };
        }>;
      };

      const annotation = data.responses[0]?.safeSearchAnnotation;
      if (!annotation) return null;

      const flagged =
        LIKELY_LEVELS.has(annotation.violence) ||
        POSSIBLE_ADULT.has(annotation.adult) ||
        LIKELY_LEVELS.has(annotation.racy);

      return {
        adult: annotation.adult,
        violence: annotation.violence,
        racy: annotation.racy,
        flagged,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(
        `Vision SafeSearch check failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private async getGcpToken(): Promise<string | null> {
    try {
      const res = await fetch(
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
        { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(2000) },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { access_token: string };
      return json.access_token;
    } catch {
      return null;
    }
  }
}
