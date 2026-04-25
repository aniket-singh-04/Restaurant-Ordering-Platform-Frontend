declare global {
  interface Window {
    Razorpay?: new (options: {
      key?: string;
      amount?: number;
      currency?: string;
      order_id?: string;
      subscription_id?: string;
      name?: string;
      description?: string;
      notes?: Record<string, unknown>;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: {
        color?: string;
      };
      modal?: {
        ondismiss?: () => void;
      };
      handler?: (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature: string;
        razorpay_subscription_id?: string;
      }) => void;
    }) => {
      open: () => void;
      on: (
        event: string,
        handler: (payload: { error?: { description?: string } }) => void,
      ) => void;
    };
  }
}

export {};
