import { useState } from "react";

type CheckoutOptions = {
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
    razorpay_order_id: string;
    razorpay_signature: string;
    razorpay_subscription_id?: string;
  }) => void;
};

let razorpayScriptPromise: Promise<boolean> | null = null;

const loadRazorpayScript = async () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.Razorpay) {
    return true;
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

export const useRazorpayCheckout = () => {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: CheckoutOptions) => {
    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const RazorpayCheckout = window.Razorpay;

      return await new Promise<{
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
        razorpay_subscription_id?: string;
      }>((resolve, reject) => {
        const instance = new RazorpayCheckout({
          ...options,
          handler: (response) => resolve(response),
          modal: {
            ...(options.modal ?? {}),
            ondismiss: () => reject(new Error("Payment checkout was closed.")),
          },
        });

        instance.on("payment.failed", (event: { error?: { description?: string } }) => {
          reject(new Error(event.error?.description ?? "Payment failed."));
        });

        instance.open();
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    openCheckout,
    loading,
  };
};
