import { Request, Response } from 'express';
import { stripeService } from '../services/stripeService';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createCheckoutSession(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { plan, successUrl, cancelUrl } = req.body;

  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });
  if (!plan || !['growth', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'Valid plan choice (growth or enterprise) is required.' });
  }
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Checkout success and cancel return URLs are required.' });
  }

  try {
    const sessionUrl = await stripeService.createCheckoutSession(orgId, plan, successUrl, cancelUrl);
    return res.json({ url: sessionUrl, isMock: stripeService.isMock });
  } catch (err: any) {
    console.error('Stripe checkout session creation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create subscription checkout session.' });
  }
}

export async function createPortalSession(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { returnUrl } = req.body;

  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });
  if (!returnUrl) return res.status(400).json({ error: 'Return URL is required.' });

  try {
    const portalUrl = await stripeService.createPortalSession(orgId, returnUrl);
    return res.json({ url: portalUrl, isMock: stripeService.isMock });
  } catch (err: any) {
    console.error('Stripe billing portal session error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initialize billing management portal.' });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    await stripeService.handleWebhookEvent(payload, sig as string);
    return res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook handling error:', err);
    return res.status(400).send(`Webhook Event Verification Error: ${err.message}`);
  }
}

// Development checkouts bypass endpoint
export async function completeMockCheckout(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { plan } = req.body;

  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });
  if (!plan || !['free', 'growth', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'A valid plan tier selection is required.' });
  }

  try {
    await stripeService.processMockSubscription(orgId, plan);
    return res.json({ 
      message: `Successfully updated organization plan to '${plan}' in mock environment.` 
    });
  } catch (err: any) {
    console.error('Mock checkout processing error:', err);
    return res.status(500).json({ error: 'Failed to apply subscription change (Mock Mode).' });
  }
}
