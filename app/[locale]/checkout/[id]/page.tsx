import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/actions/order.actions';
import { auth } from '@/auth';
import PaymentClientWrapper from './payment-client-wrapper'; // Move client-side logic here

export const metadata = {
  title: 'Payment',
};

const CheckoutPaymentPage = async ({ params }: { params: Promise<{ id: string; locale: string }> }) => {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return notFound();

  const session = await auth();

  console.log(process.env); // Log the order object for debugging    );

  return (
    <PaymentClientWrapper order={order} session={session} stripeSecretKey={process.env.STRIPE_SECRET_KEY as string} />
  );
};

export default CheckoutPaymentPage;
