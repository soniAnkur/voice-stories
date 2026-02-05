# Stripe Production Setup Plan

## Executive Summary

**Goal:** Complete Stripe setup for production and add refund webhook handling.

**What's working:**
- Local development with test mode keys ✅
- Stripe product & price created ($1.00) ✅
- Checkout flow implemented ✅

**What's missing:**
- Production environment variables in Vercel ❌
- Webhook endpoint not registered in Stripe ❌
- Refund handling not implemented ❌

---

## Current Status Summary

| Component | Local | Production |
|-----------|-------|------------|
| Stripe keys | ✅ Test mode | ❌ Missing |
| Webhook endpoint | ✅ Code ready | ❌ Not registered in Stripe |
| Refund handling | ❌ Not implemented | ❌ Not implemented |
| Product/Price | ✅ Created ($1.00) | ✅ Same (test mode) |

**Stripe CLI Info:**
- Account: Your Stripe account
- Product: "Full Bedtime Story"
- Price: $1.00 (set via Stripe Dashboard)

---

## Implementation Steps

### Step 1: Add Refund Webhook Handler

**File:** `src/app/api/webhook/route.ts`

Add handler for `charge.refunded` event:
```typescript
} else if (event.type === "charge.refunded") {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId = charge.payment_intent as string;

  // Find story by payment intent
  await connectDB();
  const story = await Story.findOne({ stripePaymentIntentId: paymentIntentId });

  if (story) {
    await Story.findByIdAndUpdate(story._id, { status: "refunded" });
    console.log(`Refund processed for story ${story._id}`);
  }
}
```

### Step 2: Update Story Model

**File:** `src/models/Story.ts`

Add `"refunded"` status:
```typescript
export type StoryStatus = "preview" | "paid" | "generating" | "complete" | "failed" | "refunded";
```

Update enum in schema:
```typescript
enum: ["preview", "paid", "generating", "complete", "failed", "refunded"],
```

Add `stripePaymentIntentId` field for refund tracking:
```typescript
stripePaymentIntentId: {
  type: String,
},
```

### Step 3: Store Payment Intent ID on Checkout Complete

**File:** `src/app/api/webhook/route.ts`

Update checkout handler to also save payment_intent:
```typescript
await Story.findByIdAndUpdate(storyId, {
  status: "paid",
  stripeSessionId: session.id,
  stripePaymentIntentId: session.payment_intent,
});
```

### Step 4: Create Production Webhook in Stripe

```bash
stripe webhook_endpoints create \
  --url "https://voicestories.vercel.app/api/webhook" \
  --enabled-events checkout.session.completed,charge.refunded
```

This will output a webhook secret (`whsec_...`) to use in Vercel.

### Step 5: Add Stripe Environment Variables to Vercel

```bash
# Using test mode keys (get from Stripe Dashboard)
vercel env add STRIPE_SECRET_KEY production
# Enter: sk_test_YOUR_SECRET_KEY

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_test_YOUR_PUBLISHABLE_KEY

vercel env add STRIPE_PRICE_ID production
# Enter: price_YOUR_PRICE_ID

vercel env add STRIPE_WEBHOOK_SECRET production
# Enter: (webhook secret from Step 4)
```

### Step 6: Redeploy to Vercel

```bash
vercel --prod
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/models/Story.ts` | Add `"refunded"` status, add `stripePaymentIntentId` field |
| `src/app/api/webhook/route.ts` | Add `charge.refunded` handler, store `payment_intent` |

---

## Verification

### Local Testing
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks locally
stripe listen --forward-to localhost:3000/api/webhook --events checkout.session.completed,charge.refunded

# Terminal 3: Test events
stripe trigger checkout.session.completed
stripe trigger charge.refunded
```

### Production Testing
1. After deploying, make a test purchase using Stripe test card `4242 4242 4242 4242`
2. Check that story status updates to `paid`
3. Issue a refund via Stripe Dashboard
4. Verify story status updates to `refunded`

---

## Stripe CLI Useful Commands

```bash
# List products
stripe products list

# List prices
stripe prices list

# List webhooks
stripe webhook_endpoints list

# Check balance
stripe balance retrieve

# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger charge.refunded
```
