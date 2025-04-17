import { razorpayApi } from '@/lib/razorpay';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orderId, paymentId, signature, orderDatabaseId } = await req.json();

    const isAuthentic = razorpayApi.verifyPayment(orderId, paymentId, signature);

    if (await isAuthentic) {
      const result = await updateOrderToPaid(orderDatabaseId);
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Payment successful!' });
      } else {
        return NextResponse.json({ success: false, message: result.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ success: false, message: 'Payment signature verification failed.' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error verifying Razorpay payment:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: 'An unknown error occurred.' }, { status: 500 });
  }
}
// This is a server-side route to verify Razorpay payments. It checks the payment signature and updates the order status accordingly.
// The Razorpay API is used to create and verify payments, and the order status is updated in the database.
// The function handles errors and returns appropriate responses based on the success or failure of the operations.
// The Razorpay API is used to create and verify payments, and the order status is updated in the database.