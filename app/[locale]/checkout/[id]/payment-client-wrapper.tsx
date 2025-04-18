'use client';

import React, { useEffect, useState } from 'react';
import Stripe from 'stripe';
import { razorpayApi } from '@/lib/razorpay';
import useSettingStore from '@/hooks/use-setting-store';
import PaymentForm from './payment-form';
import { IOrder } from '@/lib/db/models/order.model';
import { Session } from 'next-auth';

const PaymentClientWrapper = ({ order, session, stripeSecretKey }: { order: IOrder, session: Session | null, stripeSecretKey: string }) => {
  const { getCurrency } = useSettingStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (order.paymentMethod === 'Stripe' && !order.isPaid) {
        console.log('Stripe order:', order); // Log the order object for debugging
        console.log('Stripe secret key:', stripeSecretKey); // Log the secret key for debugging
        const stripe = new Stripe(stripeSecretKey);


        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(order.totalPrice * getCurrency().convertRate * 100),
          currency: getCurrency().code,
          metadata: { orderId: order._id },
        });

        setClientSecret(paymentIntent.client_secret);
      } else if (order.paymentMethod === 'Razorpay' && !order.isPaid) {
        const result = await razorpayApi.createOrder(
          order.totalPrice * getCurrency().convertRate,
          getCurrency().code
        );

        console.log('Razorpay order result:', result); // Log the result for debugging


        if (result && result.success) {
          setRazorpayOrder(result.data || null);
        } else {
          console.error('Error creating Razorpay order:', result?.message || 'Unknown error');
        }
      }
    };

    fetchPaymentDetails();
  }, [order, getCurrency]);

  return (
    <PaymentForm
      order={order}
      paypalClientId="sb"
      clientSecret={clientSecret}
      isAdmin={session?.user?.role === 'Admin' || false}
      razorpayOrder={razorpayOrder?.id || null}
    />
  );
};

export default PaymentClientWrapper;
