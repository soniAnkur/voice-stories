"use client";

import { useState } from "react";

interface PaymentButtonProps {
  storyId: string;
  userId: string;
  email: string;
}

export function PaymentButton({ storyId, userId, email }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

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

  const handleCouponRedeem = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: "error", text: "Please enter a coupon code" });
      return;
    }

    setIsLoading(true);
    setCouponMessage(null);

    try {
      const res = await fetch("/api/coupon/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, storyId }),
      });

      const data = await res.json();

      if (data.success) {
        setCouponMessage({ type: "success", text: data.message });
        // Redirect to story page
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        setCouponMessage({ type: "error", text: data.message });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      setCouponMessage({ type: "error", text: "Error redeeming coupon" });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
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
          "Get Full Story — $1.00"
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowCouponInput(!showCouponInput)}
          className="text-sm text-purple-600 hover:text-purple-800 underline"
          disabled={isLoading}
        >
          {showCouponInput ? "Hide coupon" : "Have a coupon?"}
        </button>
      </div>

      {showCouponInput && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={handleCouponRedeem}
              disabled={isLoading || !couponCode.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
          {couponMessage && (
            <p
              className={`text-sm ${
                couponMessage.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {couponMessage.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
