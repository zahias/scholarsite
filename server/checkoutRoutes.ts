import { Router, Request, Response } from 'express';
import { montyPayService } from './services/montypay';
import { checkoutSessionSchema } from '@shared/schema';
import { PRICING } from '@shared/pricing';
import { storage } from './storage';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { renderEmailHtml } from './emailTemplates';
import { sendNewClaimAdminEmail } from './auth';

const router = Router();

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `SN-${timestamp}-${random}`.toUpperCase();
}

async function sendWelcomeEmail(email: string, name: string, _tenantId: string): Promise<void> {
  if (!process.env.SMTP_PASSWORD) {
    console.error(`[checkout] SMTP not configured (SMTP_PASSWORD unset) — welcome email to ${email} was not sent`);
    return;
  }
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
    html: renderEmailHtml({
      preheader: 'Your Scholar.name portfolio is now active.',
      heading: `Welcome, ${firstName}!`,
      bodyHtml: `
        <p style="margin:0 0 14px;">Your Scholar.name portfolio is now active. Log in to your dashboard to:</p>
        <ul style="margin:0 0 14px; padding-left:20px;">
          <li>Update your profile and bio</li>
          <li>Feature your best publications</li>
          <li>Track visitor analytics</li>
        </ul>
        <p style="margin:0;">Questions? Just reply to this email.</p>
      `,
      ctaLabel: 'Go to dashboard',
      ctaUrl: 'https://scholar.name/dashboard/login',
    }),
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
    // MontyPay posts callbacks form-encoded, signed with
    // sha1(md5(UPPER(id + order_number + order_amount + order_currency + order_description + merchant password))).
    // Unverifiable callbacks are rejected: a forged "success" would provision a paid tenant for free.
    if (!montyPayService.verifyCallback(req.body)) {
      console.warn('Webhook rejected: invalid or missing hash');
      return res.status(403).send('Forbidden');
    }

    const payload = req.body;
    console.log(`MontyPay callback: order=${payload.order_number} type=${payload.type} status=${payload.status} order_status=${payload.order_status}`);

    const orderNumber = payload.order_number;
    const transactionId = payload.id;
    const isPaid = payload.type === 'sale' && payload.status === 'success';
    const isFailed = payload.status === 'fail';

    if (!orderNumber) {
      console.warn('Webhook missing order number');
      return res.send('OK');
    }

    const payment = await storage.getPaymentByOrderNumber(orderNumber);
    if (!payment) {
      console.warn(`Payment not found for order: ${orderNumber}`);
      return res.send('OK');
    }

    if (isPaid && Number(payload.order_amount) !== Number(payment.amount)) {
      console.error(`Webhook amount mismatch for ${orderNumber}: paid ${payload.order_amount}, expected ${payment.amount}`);
      return res.send('OK');
    }

    if (isPaid) {
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
          const provisioned = await storage.getTenant(tenant.id);
          if (provisioned && !provisioned.claimApprovedAt) {
            const metadata = payment.metadata as { openalexId?: string } | null;
            sendNewClaimAdminEmail(payment.customerEmail, payment.customerName, metadata?.openalexId)
              .catch((err) => console.error('New-claim admin email failed:', err));
          }
        }
      }
    } else if (isFailed) {
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
      amount: payment.amount,
      currency: payment.currency,
      billingPeriod: payment.billingPeriod,
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
