import Razorpay from 'razorpay';
import { formatError } from './utils';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
  key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET as string,
});

export const razorpayApi = {
  createOrder: async (amount: number, currency: string = 'INR') => {
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency,
        receipt: `order_${Date.now()}`,
      });

      if (!order || !order.id) {
        throw new Error('Failed to create Razorpay order');
      }

      console.log('Razorpay Order:', order); // <== log the order object for debugging
      return { success: true, data: order };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Razorpay Order Error:', error); // <== log the raw error
      return { success: false, message: formatError(error) || 'Failed to create order' };
    }
  },

  verifyPayment: async (razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) => {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Razorpay payment verification error:', error);
      return false;
    }
  },
};