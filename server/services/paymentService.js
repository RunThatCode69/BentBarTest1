/**
 * Payment Service - Stripe Integration
 *
 * IMPORTANT: This service is DISABLED until Stripe is properly configured.
 * All payment operations will throw errors in production if STRIPE_SECRET_KEY is not set.
 *
 * To enable:
 * 1. npm install stripe
 * 2. Set STRIPE_SECRET_KEY in your .env file
 * 3. Set STRIPE_WEBHOOK_SECRET for webhook verification
 */

// Check if Stripe is configured
const isStripeConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your-stripe-secret-key');
};

// Initialize Stripe only if configured
let stripe = null;
if (isStripeConfigured()) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe payment service initialized');
  } catch (error) {
    console.error('Failed to initialize Stripe:', error.message);
  }
}

/**
 * Throws an error if payment service is not configured in production
 */
const ensurePaymentEnabled = () => {
  if (process.env.NODE_ENV === 'production' && !isStripeConfigured()) {
    throw new Error('Payment service not configured. Set STRIPE_SECRET_KEY in environment variables.');
  }
  if (!isStripeConfigured()) {
    console.warn('WARNING: Payment service running in placeholder mode (development only)');
  }
};

/**
 * Create a Stripe customer
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Promise<object>} - Customer object with customerId
 */
const createCustomer = async (email, name) => {
  ensurePaymentEnabled();

  if (stripe) {
    const customer = await stripe.customers.create({ email, name });
    return { customerId: customer.id, email, name };
  }

  // Development placeholder
  console.log('[DEV] Creating placeholder customer:', email);
  return {
    customerId: 'cus_dev_' + Date.now(),
    email,
    name
  };
};

/**
 * Create a subscription for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<object>} - Subscription object
 */
const createSubscription = async (customerId, priceId) => {
  ensurePaymentEnabled();

  if (stripe) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    };
  }

  // Development placeholder
  console.log('[DEV] Creating placeholder subscription for:', customerId);
  return {
    subscriptionId: 'sub_dev_' + Date.now(),
    status: 'active',
    clientSecret: 'pi_dev_secret'
  };
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<object>} - Cancellation result
 */
const cancelSubscription = async (subscriptionId) => {
  ensurePaymentEnabled();

  if (stripe) {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return { subscriptionId, status: subscription.status };
  }

  // Development placeholder
  console.log('[DEV] Cancelling placeholder subscription:', subscriptionId);
  return { subscriptionId, status: 'cancelled' };
};

/**
 * Get subscription status
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<object>} - Subscription status
 */
const getSubscriptionStatus = async (subscriptionId) => {
  ensurePaymentEnabled();

  if (stripe) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return { subscriptionId, status: subscription.status };
  }

  // Development placeholder
  console.log('[DEV] Getting placeholder subscription status:', subscriptionId);
  return { subscriptionId, status: 'active' };
};

/**
 * Handle Stripe webhook events
 * @param {object} event - Stripe webhook event
 * @returns {Promise<object>} - Handler result
 */
const handleWebhook = async (event) => {
  console.log('Handling webhook event:', event.type);

  switch (event.type) {
    case 'invoice.paid':
      console.log('Invoice paid:', event.data.object.id);
      // TODO: Update user's payment status to 'active'
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      // TODO: Notify user of failed payment
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription deleted:', event.data.object.id);
      // TODO: Update user's payment status to 'cancelled'
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object.id);
      // TODO: Update subscription status in database
      break;
    default:
      console.log('Unhandled webhook event type:', event.type);
  }

  return { received: true };
};

/**
 * Create a payment intent for one-time payment
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (default: 'usd')
 * @returns {Promise<object>} - Payment intent
 */
const createPaymentIntent = async (amount, currency = 'usd') => {
  ensurePaymentEnabled();

  if (stripe) {
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency });
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  }

  // Development placeholder
  console.log('[DEV] Creating placeholder payment intent:', amount, currency);
  return {
    clientSecret: 'pi_dev_secret_' + Date.now(),
    paymentIntentId: 'pi_dev_' + Date.now()
  };
};

module.exports = {
  createCustomer,
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  handleWebhook,
  createPaymentIntent
};
