const Stripe = require('stripe');
const Showtime = require('../models/Showtime');
const { getPremiumSeats } = require('./showtimeController');

// Inicializar Stripe solo si hay una clave en las variables de entorno.
// Si falta, evitamos lanzar una excepción y manejamos el caso en los handlers
let stripe = null;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey && String(stripeKey).trim()) {
  try {
    stripe = Stripe(stripeKey);
  } catch (err) {
    console.error('❌ Error inicializando Stripe:', err);
    stripe = null;
  }
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY no está definido. Endpoints de pago no estarán disponibles.');
}

exports.createPaymentIntent = async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado en el servidor' });
  try {
    const { showtimeId, seatIds, currency = 'GTQ', metadata = {} } = req.body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'showtimeId y una lista de seatIds son requeridos' });
    }

    const showtime = await Showtime.findById(showtimeId).lean();
    if (!showtime) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }

    const regularPrice = showtime.price || 0;
    const premiumPrice = showtime.premiumPrice || regularPrice; // Fallback al precio regular si no hay premium

    const premiumSeats = getPremiumSeats(seatIds);
    const regularSeatsCount = seatIds.length - premiumSeats.length;

    const totalAmount = (regularSeatsCount * regularPrice) + (premiumSeats.length * premiumPrice);

    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'El monto total debe ser mayor a cero.' });
    }

    // Stripe expects amount in the smallest currency unit (céntimos)
    const amountInCents = Math.round(totalAmount * 100);

    // Adjuntar datos importantes a los metadatos para usarlos en la confirmación de la compra
    metadata.showtimeId = showtimeId;
    metadata.seats = seatIds.join(',');

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
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado en el servidor' });
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
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado en el servidor' });
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

exports.retrieveCheckoutSession = async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado en el servidor' });
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    const session = await stripe.checkout.sessions.retrieve(id);
    res.json(session);
  } catch (err) {
    console.error('Error retrieving checkout session:', err);
    res.status(500).json({ message: 'Error retrieving checkout session' });
  }
};

// Procesar pago usando un PaymentMethod ID (método moderno y seguro)
exports.chargeWithToken = async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado en el servidor' });
  try {
    // Requiere auth en la ruta; bloquear admin/colaborador
    const role = req.user?.role;
    if (!role || role !== 'cliente') {
      return res.status(403).json({ message: 'Las compras están permitidas únicamente para usuarios regulares.' });
    }

    const { amount, currency = 'GTQ', paymentMethodId, metadata = {} } = req.body;

    if (!amount || !paymentMethodId) {
      return res.status(400).json({ message: 'Faltan el monto y el ID del método de pago.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: currency || 'gtq',
      payment_method: paymentMethodId,
      confirm: true, // Confirma el pago inmediatamente
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    res.json({ success: true, paymentIntentId: paymentIntent.id });
  } catch (error) {
    const message = error.raw?.message || error.message || 'Error interno del servidor.';
    res.status(error.statusCode || 500).json({ message });
  }
};
