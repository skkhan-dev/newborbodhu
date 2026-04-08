import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SslcommerzGateway {
  private readonly logger = new Logger(SslcommerzGateway.name);
  private readonly baseUrl: string;
  private readonly storeId: string;
  private readonly storePassword: string;

  constructor(private readonly config: ConfigService) {
    const sandbox = config.get("SSLCOMMERZ_SANDBOX") !== "false";
    this.baseUrl = sandbox ? "https://sandbox.sslcommerz.com" : "https://secure.sslcommerz.com";
    this.storeId = config.get("SSLCOMMERZ_STORE_ID") ?? "";
    this.storePassword = config.get("SSLCOMMERZ_STORE_PASSWORD") ?? "";
  }

  async initiatePayment(params: {
    totalAmount: string; currency: string; transactionId: string;
    productName: string; customerName: string; customerEmail: string; customerPhone: string;
    successUrl: string; failUrl: string; cancelUrl: string; ipnUrl: string;
  }): Promise<{ GatewayPageURL: string; status: string }> {
    const body = new URLSearchParams({
      store_id: this.storeId, store_passwd: this.storePassword,
      total_amount: params.totalAmount, currency: params.currency, tran_id: params.transactionId,
      product_name: params.productName, product_category: "matrimony",
      product_profile: "non-physical-goods",
      cus_name: params.customerName, cus_email: params.customerEmail, cus_phone: params.customerPhone,
      success_url: params.successUrl, fail_url: params.failUrl, cancel_url: params.cancelUrl,
      ipn_url: params.ipnUrl, shipping_method: "NO",
    });
    const response = await fetch(`${this.baseUrl}/gwprocess/v4/api.php`, { method: "POST", body });
    return response.json() as Promise<{ GatewayPageURL: string; status: string }>;
  }

  async validatePayment(valId: string): Promise<{ status: string; tran_id: string; amount: string }> {
    const url = `${this.baseUrl}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${this.storeId}&store_passwd=${this.storePassword}&format=json`;
    const response = await fetch(url);
    return response.json() as Promise<{ status: string; tran_id: string; amount: string }>;
  }
}
