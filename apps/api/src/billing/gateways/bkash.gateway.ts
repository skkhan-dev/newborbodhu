import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BkashGateway {
  private readonly logger = new Logger(BkashGateway.name);
  private readonly baseUrl: string;
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly username: string;
  private readonly password: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get("BKASH_BASE_URL") ?? "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
    this.appKey = config.get("BKASH_APP_KEY") ?? "";
    this.appSecret = config.get("BKASH_APP_SECRET") ?? "";
    this.username = config.get("BKASH_USERNAME") ?? "";
    this.password = config.get("BKASH_PASSWORD") ?? "";
  }

  async grantToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: this.username,
        password: this.password,
      },
      body: JSON.stringify({ app_key: this.appKey, app_secret: this.appSecret }),
    });
    const data = await response.json() as { id_token: string };
    return data.id_token;
  }

  async createPayment(params: {
    amount: string;
    currency: string;
    intent: "sale";
    merchantInvoiceNumber: string;
    callbackURL: string;
  }): Promise<{ bkashURL: string; paymentID: string }> {
    const token = await this.grantToken();
    const response = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: token,
        "x-app-key": this.appKey,
      },
      body: JSON.stringify(params),
    });
    return response.json() as Promise<{ bkashURL: string; paymentID: string }>;
  }

  async executePayment(paymentID: string): Promise<{ transactionStatus: string; trxID: string }> {
    const token = await this.grantToken();
    const response = await fetch(`${this.baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: token,
        "x-app-key": this.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });
    return response.json() as Promise<{ transactionStatus: string; trxID: string }>;
  }
}
