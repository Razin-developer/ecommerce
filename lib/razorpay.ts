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
        amount: Math.round(amount * 100), // Razorpay expects amount in paise (cents for INR)
        currency: currency,
        receipt: `order_${Date.now()}`, // Unique receipt ID
      });
      return { success: true, data: order };
    } catch (error) {
      return { success: false, message: formatError(error) };
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