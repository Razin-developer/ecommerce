import { notFound } from 'next/navigation';
import React from 'react';

import { auth } from '@/auth';
import { getOrderById } from '@/lib/actions/order.actions';
import PaymentForm from './payment-form';
import Stripe from 'stripe';
import { razorpayApi } from '@/lib/razorpay';

export const metadata = {
  title: 'Payment',
};

const CheckoutPaymentPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const params = await props.params;
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const session = await auth();

  let client_secret: string | null = null;
  let razorpayOrder: { id: string } | null = null;

  if (order.paymentMethod === 'Stripe' && !order.isPaid) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'USD',
      metadata: { orderId: order._id },
    });
    client_secret = paymentIntent.client_secret;
  } else if (order.paymentMethod === 'Razorpay' && !order.isPaid) {
    const razorpayResult = await razorpayApi.createOrder(order.totalPrice, 'INR'); // Assuming INR as default currency
    if (razorpayResult.success) {
      razorpayOrder = razorpayResult.data || null;
    } else {
      console.error('Error creating Razorpay order:', razorpayResult.message);
      // Handle error appropriately, maybe redirect or show a message
    }
  }

  return (
    <PaymentForm
      order={order}
      paypalClientId={'sb'} // Keep this as it's not used anymore
      clientSecret={client_secret}
      isAdmin={session?.user?.role === 'Admin' || false}
      razorpayOrder={razorpayOrder?.id}
    />
  );
};

export default CheckoutPaymentPage;