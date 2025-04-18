'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { IOrder } from '@/lib/db/models/order.model';
import { formatDateTime } from '@/lib/utils';

import CheckoutFooter from '../checkout-footer';
import { redirect, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ProductPrice from '@/components/shared/product/product-price';
import StripeForm from './stripe-form';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import useSettingStore from '@/hooks/use-setting-store';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function OrderDetailsForm({
  order,
  clientSecret,
  razorpayOrder,
}: {
  order: IOrder;
  paypalClientId: string;
  isAdmin: boolean;
  clientSecret: string | null;
  razorpayOrder: string | undefined | null;
}) {
  const router = useRouter();
  const { getCurrency } = useSettingStore();
  const { toast } = useToast();
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
  } = order;

  const loadRazorpay = async () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayOrder || paymentMethod !== 'Razorpay' || isPaid) return;

    const res = await loadRazorpay();

    if (!res) {
      toast({
        description: 'Razorpay SDK failed to load. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Replace with your actual key if needed on client-side
      order_id: razorpayOrder,
      name: 'NxtAmzn',
      description: 'Payment for your order',
      amount: Math.round(totalPrice * getCurrency().convertRate * 100), // Amount in paise
      currency: getCurrency().code, // Or your store's currency
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async function (response: any) {
        // Verify payment signature on the server
        const paymentVerificationResult = await fetch(
          `/api/checkout/razorpay-verify`, // Create this API route
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: razorpayOrder,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              orderDatabaseId: order._id,
            }),
          }
        );

        const verificationData = await paymentVerificationResult.json();

        if (verificationData.success) {
          toast({
            description: verificationData.message,
          });
          router.push(`/account/orders/${order._id}`);
        } else {
          toast({
            description: verificationData.message + " Check your order status.",
            variant: 'destructive',
          });
          // Optionally, handle payment failure (e.g., update order status)
        }
      },
      prefill: {
        name: shippingAddress?.fullName,
        email: order.user as string, // Assuming user is the email for now, adjust as needed
        // contact: '9999999999', // Optional
        contact: shippingAddress?.phone,
      },
      theme: {
        color: '#3366CC',
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  if (isPaid) {
    redirect(`/account/orders/${order._id}`);
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className="p-4">
        <div>
          <div className="text-lg font-bold">Order Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items:</span>
              <span>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping & Handling:</span>
              <span>
                {shippingPrice === undefined ? (
                  '--'
                ) : shippingPrice === 0 ? (
                  'FREE'
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span> Tax:</span>
              <span>
                {taxPrice === undefined ? (
                  '--'
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>
            <div className="flex justify-between  pt-1 font-bold text-lg">
              <span> Order Total:</span>
              <span>
                {' '}
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>

            {!isPaid && paymentMethod === 'Razorpay' && razorpayOrder && (
              <Button className="w-full rounded-full" onClick={() => handleRazorpayPayment()}>
                Pay with Razorpay
              </Button>
            )}

            {!isPaid && paymentMethod === 'Stripe' && clientSecret && (
              <Elements
                options={{
                  clientSecret,
                }}
                stripe={stripePromise}
              >
                <StripeForm
                  priceInCents={Math.round(order.totalPrice * 100)}
                  orderId={order._id}
                />
              </Elements>
            )}

            {!isPaid && paymentMethod === 'Cash On Delivery' && (
              <Button
                className="w-full rounded-full"
                onClick={() => router.push(`/account/orders/${order._id}`)}
              >
                View Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {/* Shipping Address */}
          <div>
            <div className="grid md:grid-cols-3 my-3 pb-3">
              <div className="text-lg font-bold">
                <span>Shipping Address</span>
              </div>
              <div className="col-span-2">
                <p>
                  {shippingAddress.fullName} <br />
                  {shippingAddress.street} <br />
                  {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                </p>
              </div>
            </div>
          </div>

          {/* payment method */}
          <div className="border-y">
            <div className="grid md:grid-cols-3 my-3 pb-3">
              <div className="text-lg font-bold">
                <span>Payment Method</span>
              </div>
              <div className="col-span-2">
                <p>{paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 my-3 pb-3">
            <div className="flex text-lg font-bold">
              <span>Items and shipping</span>
            </div>
            <div className="col-span-2">
              <p>
                Delivery date:
                {formatDateTime(expectedDeliveryDate).dateOnly}
              </p>
              <ul>
                {items.map((item) => (
                  <li key={item.slug}>
                    {item.name} x {item.quantity} = {item.price}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="block md:hidden">
            <CheckoutSummary />
          </div>

          <CheckoutFooter />
        </div>
        <div className="hidden md:block">
          <CheckoutSummary />
        </div>
      </div>
    </main>
  );
}