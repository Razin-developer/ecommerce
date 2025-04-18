import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/actions/order.actions';
import { auth } from '@/auth';
import PaymentClientWrapper from './payment-client-wrapper'; // Move client-side logic here

export const metadata = {
  title: 'Payment',
};

const CheckoutPaymentPage = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return notFound();

  const session = await auth();

  return (
    <PaymentClientWrapper order={order} session={session} />
  );
};

export default CheckoutPaymentPage;
