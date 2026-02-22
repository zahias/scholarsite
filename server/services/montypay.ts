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

  private generateHash(payload: Record<string, any>): string {
    const sortedKeys = Object.keys(payload).sort();
    const dataString = sortedKeys.map(key => {
      const value = payload[key];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    }).join('');
    
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(dataString + this.config.secretKey)
      .digest('hex');
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
