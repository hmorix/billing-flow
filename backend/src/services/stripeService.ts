import Stripe from 'stripe';
import { db } from '../config/db';

const isMock = process.env.STRIPE_MOCK === 'true';

const stripe = !isMock && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any })
  : null;

export const stripeService = {
  isMock,

  async createCheckoutSession(
    organizationId: string,
    plan: 'growth' | 'enterprise',
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const org = await db('organizations').where({ id: organizationId }).first();
    if (!org) throw new Error('Organization not found');

    const priceId = plan === 'growth' 
      ? process.env.STRIPE_PRICE_GROWTH_ID || 'price_growth_mock' 
      : process.env.STRIPE_PRICE_ENTERPRISE_ID || 'price_enterprise_mock';

    if (isMock) {
      // Return a simulated local URL that the frontend can load to mock the checkout UI
      const mockSessionId = `mock_sess_${Math.random().toString(36).substring(2, 15)}`;
      return `/billing/checkout-mock?session_id=${mockSessionId}&plan=${plan}&org_id=${organizationId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
    }

    if (!stripe) {
      throw new Error('Stripe is not configured and mock mode is off.');
    }

    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: `admin@${org.slug}.com`,
        name: org.name,
        metadata: { organizationId }
      });
      customerId = customer.id;
      await db('organizations').where({ id: organizationId }).update({ stripe_customer_id: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      metadata: { organizationId, plan }
    });

    return session.url || successUrl;
  },

  async createPortalSession(organizationId: string, returnUrl: string): Promise<string> {
    const org = await db('organizations').where({ id: organizationId }).first();
    if (!org) throw new Error('Organization not found');

    if (isMock) {
      return `/billing/portal-mock?org_id=${organizationId}&return_url=${encodeURIComponent(returnUrl)}`;
    }

    if (!stripe) {
      throw new Error('Stripe is not configured and mock mode is off.');
    }

    if (!org.stripe_customer_id) {
      throw new Error('No Stripe customer associated with this organization. Subscribe first.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl
    });

    return session.url;
  },

  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    if (isMock || !stripe) return;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is missing');

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (organizationId && plan && subscriptionId) {
          await db('organizations')
            .where({ id: organizationId })
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_plan: plan,
              updated_at: new Date()
            });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const customerId = subscription.customer as string;

        await db('organizations')
          .where({ stripe_customer_id: customerId })
          .update({
            subscription_status: status,
            updated_at: new Date()
          });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db('organizations')
          .where({ stripe_customer_id: customerId })
          .update({
            stripe_subscription_id: null,
            subscription_status: 'canceled',
            subscription_plan: 'free',
            updated_at: new Date()
          });
        break;
      }
    }
  },

  // Mock processing logic triggered directly via our Express endpoints in Dev/Mock mode
  async processMockSubscription(organizationId: string, plan: 'free' | 'growth' | 'enterprise'): Promise<void> {
    const status = plan === 'free' ? 'none' : 'active';
    await db('organizations')
      .where({ id: organizationId })
      .update({
        stripe_subscription_id: plan === 'free' ? null : `mock_sub_${Math.random().toString(36).substring(2, 12)}`,
        subscription_status: status,
        subscription_plan: plan,
        updated_at: new Date()
      });
  }
};
