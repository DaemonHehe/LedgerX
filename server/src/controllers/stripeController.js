import Stripe from 'stripe';
import { supabase } from '../config/supabase.js';

// Fallback to dummy key if not set to prevent crash during import/init
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;
    
    if (priceId.includes('placeholder')) {
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_dummy') {
        return res.status(400).json({ error: 'You are using a real Stripe Secret Key but your frontend is sending placeholder Price IDs. Please add VITE_STRIPE_PRICE_1_MONTH (etc.) to your client/.env file.' });
      }
      
      console.warn('STRIPE_SECRET_KEY is missing. Simulating successful checkout and webhook for testing.');

      
      // Simulate webhook database update for testing
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: 'cus_mock123',
          stripe_subscription_id: 'sub_mock123',
          status: 'active',
          plan_type: 'pro',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      return res.json({ clientSecret: 'mock_client_secret_123' });
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      return_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.json({ clientSecret: session.client_secret });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // req.body must be raw buffer for this to work
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy');
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        
        if (!userId) {
          console.warn('No client_reference_id in session. Skipping.');
          break;
        }

        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            plan_type: 'pro',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userSub) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('user_id', userSub.user_id);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, plan_type, current_period_end')
      .eq('user_id', req.user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is not found (0 rows)
      throw error;
    }
    
    if (!data) {
      return res.json({ status: 'inactive', plan_type: 'free' });
    }
    
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const verifySession = async (req, res, next) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

    // Validate the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid' || session.status === 'complete') {
      const userId = session.client_reference_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      if (!subscriptionId) {
        return res.json({ success: true, status: 'active', note: 'No subscription attached (one-time payment or mock)' });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update database manually since webhook isn't configured for localhost
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: subscription.status,
          plan_type: 'pro',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        });
        
      return res.json({ success: true, status: subscription.status });
    }
    
    res.json({ success: false, status: session.status });
  } catch (err) {
    next(err);
  }
};
