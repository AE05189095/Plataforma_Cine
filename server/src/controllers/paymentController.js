const Stripe = require('stripe');

// Stripe key read from env; ensure STRIPE_SECRET_KEY is set in your .env
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'GTQ', metadata = {} } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount (number) is required' });
    }

    // Stripe expects amount in the smallest currency unit (céntimos)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: String(currency).toLowerCase(),
      metadata,
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
};

exports.retrievePaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'PaymentIntent id required' });
    const pi = await stripe.paymentIntents.retrieve(id);
    res.json(pi);
  } catch (err) {
    console.error('Error retrieving payment intent:', err);
    res.status(500).json({ message: 'Error retrieving payment intent' });
  }
};

// Crear una sesión de Stripe Checkout (hosted page)
exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = 'GTQ', metadata = {}, successPath = '/mis-compras', cancelPath = '/comprar' } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount (number) is required' });
    }

    const domain = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: String(currency).toLowerCase(),
            product_data: { name: metadata.movie || 'Compra de boletos' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: metadata.quantity || 1,
        },
      ],
      metadata,
      success_url: `${domain}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}${cancelPath}`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ message: 'Error creating checkout session' });
  }
};
