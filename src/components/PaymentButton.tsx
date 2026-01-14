"use client";

import { useState } from "react";

interface PaymentButtonProps {
  storyId: string;
  userId: string;
  email: string;
}

export function PaymentButton({ storyId, userId, email }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, userId, email }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Error starting checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="btn-primary w-full text-lg"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        "Get Full Story — $4.99"
      )}
    </button>
  );
}
