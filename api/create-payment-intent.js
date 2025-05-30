// api/create-payment-intent.js
// Este endpoint ha sido comentado ya que se prefirió usar api/stripe/create-payment-intent.js
/*
import Stripe from 'stripe';
// import { createClient } from '@supabase/supabase-js'; // Si necesitas interactuar con Supabase aquí

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { amount, currency //, customerId } = req.body;

            if (!amount || !currency) {
                return res.status(400).json({ error: 'Falta el monto o la moneda.' });
            }

            // Opcional: Buscar o crear cliente en Stripe
            // let stripeCustomerId;
            // if (customerId) {
            //     // Lógica para obtener el stripe_customer_id desde Supabase
            //     // const { data: userProfile, error: profileError } = await supabase
            //     //    .from('profiles')
            //     //    .select('stripe_customer_id')
            //     //    .eq('id', customerId)
            //     //    .single();
            //     // if (userProfile && userProfile.stripe_customer_id) {
            //     //     stripeCustomerId = userProfile.stripe_customer_id;
            //     // } else {
            //     //     const customer = await stripe.customers.create({ description: `Supabase user ${customerId}` });
            //     //     stripeCustomerId = customer.id;
            //     //     // Guardar stripeCustomerId en Supabase
            //     // }
            // }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: parseInt(amount),
                currency: currency,
                automatic_payment_methods: { enabled: true }, // Stripe optimiza los métodos de pago
                // customer: stripeCustomerId, // Si tienes un cliente de Stripe
            });

            res.status(200).json({ clientSecret: paymentIntent.client_secret });
        } catch (err) {
            console.error("Stripe Error:", err.message);
            res.status(500).json({ error: `Error al crear PaymentIntent: ${err.message}` });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
*/