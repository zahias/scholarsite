import crypto from 'crypto';

interface MontyPayConfig {
  merchantKey: string;
  secretKey: string;
  checkoutHost: string;
}

interface OrderDetails {
  number: string;
  amount: string;
  currency: string;
  description: string;
}

interface CustomerDetails {
  name: string;
  email: string;
}

interface BillingAddress {
  country: string;
  city: string;
  address: string;
  zip: string;
  phone?: string;
  state?: string;
}

interface CreateSessionParams {
  order: OrderDetails;
  customer: CustomerDetails;
  billingAddress?: BillingAddress;
  successUrl: string;
  cancelUrl: string;
  notificationUrl?: string;
}

interface MontyPaySessionResponse {
  redirect_url?: string;
  session_id?: string;
  status?: string;
  error?: string;
  error_message?: string;
}

export class MontyPayService {
  private config: MontyPayConfig;

  constructor() {
    this.config = {
      merchantKey: process.env.MONTYPAY_MERCHANT_KEY || '',
      secretKey: process.env.MONTYPAY_SECRET_KEY || '',
      checkoutHost: process.env.MONTYPAY_CHECKOUT_HOST || 'https://checkout.montypay.com',
    };
  }

  // MontyPay (Akurateco) signature: sha1(md5(UPPER(fields... + merchant password))).
  // secretKey is the merchant *password* from the MontyPay admin panel.
  private sign(values: Array<string | number>): string {
    const raw = (values.map(String).join('') + this.config.secretKey).toUpperCase();
    const md5 = crypto.createHash('md5').update(raw).digest('hex');
    return crypto.createHash('sha1').update(md5).digest('hex');
  }

  private generateHash(payload: Record<string, any>): string {
    const { number, amount, currency, description } = payload.order;
    return this.sign([number, amount, currency, description]);
  }

  /** Verify a server-to-server callback (form-encoded POST to notification_url). */
  verifyCallback(body: Record<string, any>): boolean {
    if (!this.config.secretKey || typeof body?.hash !== 'string') return false;
    const expected = this.sign([body.id, body.order_number, body.order_amount, body.order_currency, body.order_description]);
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(body.hash.toLowerCase(), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async createCheckoutSession(params: CreateSessionParams): Promise<MontyPaySessionResponse> {
    if (!this.config.merchantKey || !this.config.secretKey) {
      console.warn('MontyPay credentials not configured');
      return {
        error: 'CONFIGURATION_ERROR',
        error_message: 'Payment gateway not configured. Please contact support.'
      };
    }

    const payload: Record<string, any> = {
      merchant_key: this.config.merchantKey,
      operation: 'purchase',
      methods: ['card'],
      order: {
        number: params.order.number,
        amount: params.order.amount,
        currency: params.order.currency,
        description: params.order.description,
      },
      customer: {
        name: params.customer.name,
        email: params.customer.email,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    };

    if (params.notificationUrl) {
      payload.notification_url = params.notificationUrl;
    }

    if (params.billingAddress) {
      payload.billing_address = {
        country: params.billingAddress.country,
        city: params.billingAddress.city,
        address: params.billingAddress.address,
        zip: params.billingAddress.zip,
        phone: params.billingAddress.phone || '',
        state: params.billingAddress.state || '',
      };
    }

    payload.hash = this.generateHash(payload);

    try {
      const response = await fetch(`${this.config.checkoutHost}/api/v1/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('MontyPay API error:', data);
        return {
          error: 'API_ERROR',
          error_message: data.message || 'Payment session creation failed'
        };
      }

      return data;
    } catch (error) {
      console.error('MontyPay request failed:', error);
      return {
        error: 'NETWORK_ERROR',
        error_message: 'Unable to connect to payment gateway'
      };
    }
  }

  verifyWebhookSignature(payload: Record<string, any>, signature: string): boolean {
    const expectedHash = this.generateHash(payload);
    return expectedHash === signature;
  }

  isConfigured(): boolean {
    return !!(this.config.merchantKey && this.config.secretKey);
  }
}

export const montyPayService = new MontyPayService();
