"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  "Unlock all stories",
  "New stories every month",
  "Create up to 20 custom stories / month",
  "Cancel anytime",
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");

  return (
    <div className="page-container-no-tabs">
      {/* Header with back button */}
      <header className="flex items-center px-4 py-4 pt-14">
        <Link href="/" className="btn-icon">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-2xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-secondary">Get premium now and unlock all app features</p>
        </div>

        {/* Features List */}
        <ul className="features-list mb-8">
          {FEATURES.map((feature, index) => (
            <li key={index} className="feature-item">
              <span className="feature-check">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Pricing Cards */}
        <div className="space-y-3 mb-8">
          {/* Annual Plan */}
          <button
            onClick={() => setSelectedPlan("annual")}
            className={`pricing-card ${selectedPlan === "annual" ? "selected" : ""}`}
          >
            <span className="discount-badge">40% OFF</span>
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === "annual"
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-500"
                }`}
              >
                {selectedPlan === "annual" && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="plan-name">Annual Plan</h3>
                <p className="plan-price">Get full access for just $29.99 / year</p>
              </div>
            </div>
          </button>

          {/* Monthly Plan */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`pricing-card ${selectedPlan === "monthly" ? "selected" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === "monthly"
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-500"
                }`}
              >
                {selectedPlan === "monthly" && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="plan-name">Monthly Plan</h3>
                <p className="plan-price">Get full access for just $4.99 / month</p>
              </div>
            </div>
          </button>
        </div>

        {/* CTA Button */}
        <button className="btn-purple w-full mb-4">
          Get 1 free month now
        </button>

        {/* Restore Purchase */}
        <div className="text-center">
          <span className="text-secondary text-sm">Already subscribed? </span>
          <button className="text-purple-400 text-sm font-medium">
            Restore Purchase
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* One-time purchase option */}
        <div className="dark-card p-4 text-center">
          <h3 className="font-semibold mb-2">Pay per story</h3>
          <p className="text-secondary text-sm mb-3">
            Create individual stories for just $1.00 each
          </p>
          <Link href="/create" className="btn-secondary inline-flex">
            Create a Story
          </Link>
        </div>
      </main>
    </div>
  );
}
