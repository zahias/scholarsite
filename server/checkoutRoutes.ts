import { Router, Request, Response } from 'express';
import { montyPayService } from './services/montypay';
import { checkoutSessionSchema } from '@shared/schema';
import { storage } from './storage';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();

const PRICING = {
  starter: { monthly: 9.99, yearly: 95.88 },
  pro: { monthly: 19.99, yearly: 191.88 },
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `SN-${timestamp}-${random}`.toUpperCase();
}

async function sendWelcomeEmail(email: string, name: string, _tenantId: string): Promise<void> {
  if (!process.env.SMTP_PASSWORD) return;
  const smtpHost = process.env.SMTP_HOST || 'mail.scholar.name';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || 'noreply@scholar.name';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: process.env.SMTP_PASSWORD },
    tls: { rejectUnauthorized: false },
  });

  const firstName = name.split(' ')[0];
  await transporter.sendMail({
    from: `"Scholar.name" <${smtpUser}>`,
    to: email,
    subject: 'Welcome to Scholar.name — your portfolio is active!',
    text: [
      `Hi ${firstName},`,
      '',
      'Your Scholar.name portfolio is now active. Log in to your dashboard to:',
      '  • Update your profile and bio',
      '  • Feature your best publications',
      '  • Track visitor analytics',
      '',
      'Log in at: https://scholar.name/dashboard/login',
      '',
      'Questions? Reply to this email.',
      '',
      'The Scholar.name team',
    ].join('\n'),
  });
}

router.post('/create-session', async (req: Request, res: Response) => {
  try {
    const validation = checkoutSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const { plan, billingPeriod, customerName, customerEmail, openalexId } = validation.data;

    if (!montyPayService.isConfigured()) {
      return res.status(503).json({
        error: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
        message: 'Payment processing is currently unavailable. Please contact support.',
        fallbackUrl: '/contact'
      });
    }

    const amount = PRICING[plan][billingPeriod].toFixed(2);
    const orderNumber = generateOrderNumber();
    
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}/checkout/success?order=${orderNumber}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order=${orderNumber}`;
    const notificationUrl = `${baseUrl}/api/checkout/webhook`;

    const paymentRecord = await storage.createPayment({
      orderNumber,
      amount,
      currency: 'USD',
      status: 'pending',
      plan: plan === 'pro' ? 'professional' : 'starter',
      billingPeriod,
      customerEmail,
      customerName,
      metadata: { openalexId },
    });

    const sessionResponse = await montyPayService.createCheckoutSession({
      order: {
        number: orderNumber,
        amount,
        currency: 'USD',
        description: `ScholarName ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
      },
      customer: {
        name: customerName,
        email: customerEmail,
      },
      successUrl,
      cancelUrl,
      notificationUrl,
    });

    if (sessionResponse.error) {
      await storage.updatePaymentStatus(orderNumber, 'failed');
      return res.status(400).json({
        error: sessionResponse.error,
        message: sessionResponse.error_message,
      });
    }

    if (sessionResponse.session_id) {
      await storage.updatePaymentSessionId(orderNumber, sessionResponse.session_id);
    }

    res.json({
      redirectUrl: sessionResponse.redirect_url,
      orderNumber,
      sessionId: sessionResponse.session_id,
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create checkout session',
    });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // C1: Verify webhook authenticity via shared secret
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const rawSig = req.headers['x-webhook-signature'] || req.headers['x-signature'];
      const signature = Array.isArray(rawSig) ? rawSig[0] : rawSig;
      if (!signature) {
        console.warn('Webhook rejected: missing signature header');
        return res.status(403).send('Forbidden');
      }
      const expectedSig = crypto.createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      // Use constant-time comparison to prevent timing attacks
      const expectedBuf = Buffer.from(expectedSig, 'hex');
      const receivedBuf = Buffer.from(signature, 'hex');
      if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        console.warn('Webhook rejected: invalid signature');
        return res.status(403).send('Forbidden');
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: WEBHOOK_SECRET not set — webhook signature verification disabled');
    }

    const payload = req.body;
    
    console.log('MontyPay webhook received:', JSON.stringify(payload, null, 2));

    const orderNumber = payload.order?.number;
    const status = payload.result || payload.status;
    const transactionId = payload.transaction_id;

    if (!orderNumber) {
      console.warn('Webhook missing order number');
      return res.send('OK');
    }

    const payment = await storage.getPaymentByOrderNumber(orderNumber);
    if (!payment) {
      console.warn(`Payment not found for order: ${orderNumber}`);
      return res.send('OK');
    }

    if (status === 'SUCCESS' || status === 'SETTLED') {
      await storage.updatePaymentStatus(orderNumber, 'completed', transactionId);
      
      // H6: Skip provisioning if tenant already created (idempotent webhook)
      if (payment.tenantId) {
        console.log(`Tenant already provisioned for order ${orderNumber}, skipping`);
      } else {
        const tenant = await storage.provisionTenantFromPayment(payment.id);
        console.log(`Tenant provisioned for payment ${orderNumber}:`, tenant?.id);
        if (tenant) {
          sendWelcomeEmail(payment.customerEmail, payment.customerName, tenant.id)
            .catch((err) => console.error('Welcome email failed:', err));
        }
      }
    } else if (status === 'DECLINE' || status === 'ERROR') {
      await storage.updatePaymentStatus(orderNumber, 'failed', transactionId);
    }

    res.send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.send('ERROR');
  }
});

router.get('/status/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const payment = await storage.getPaymentByOrderNumber(orderNumber);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      orderNumber: payment.orderNumber,
      status: payment.status,
      plan: payment.plan,
    });
  } catch (error) {
    console.error('Payment status check failed:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

router.get('/config', async (_req: Request, res: Response) => {
  res.json({
    isConfigured: montyPayService.isConfigured(),
    pricing: PRICING,
  });
});

export default router;
