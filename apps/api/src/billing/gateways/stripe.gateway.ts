import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";

@Injectable()
export class StripeGateway {
  private readonly logger = new Logger(StripeGateway.name);
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = "https://api.stripe.com/v1";

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.get("STRIPE_SECRET_KEY") ?? "";
    this.webhookSecret = config.get("STRIPE_WEBHOOK_SECRET") ?? "";
  }

  private get headers() {
    return { Authorization: `Bearer ${this.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" };
  }

  async createCheckoutSession(params: {
    amount: number; currency: string; productName: string;
    successUrl: string; cancelUrl: string; metadata: Record<string, string>;
  }): Promise<{ id: string; url: string }> {
    const body = new URLSearchParams({
      "line_items[0][price_data][currency]": params.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": params.productName,
      "line_items[0][price_data][unit_amount]": String(params.amount),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      ...Object.fromEntries(Object.entries(params.metadata).map(([k, v]) => [`metadata[${k}]`, v])),
    });
    const response = await fetch(`${this.baseUrl}/checkout/sessions`, { method: "POST", headers: this.headers, body });
    return response.json() as Promise<{ id: string; url: string }>;
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    const parts = signature.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2) ?? "";
    const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3) ?? "";
    const signedPayload = `${timestamp}.${payload.toString("utf8")}`;
    const expected = createHmac("sha256", this.webhookSecret).update(signedPayload).digest("hex");
    try { return timingSafeEqual(Buffer.from(expected), Buffer.from(v1)); } catch { return false; }
  }
}
