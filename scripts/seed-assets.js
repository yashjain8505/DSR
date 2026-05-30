#!/usr/bin/env node
/**
 * Seed global assets with sample Linkrunner content.
 *
 * Usage:
 *   node scripts/seed-assets.js
 */

const fs = require("fs");
const path = require("path");

// Load .env.local
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const assets = [
  {
    category: "what_is_linkrunner",
    title: "What is Linkrunner",
    asset_type: "markdown",
    sort_order: 0,
    content: `# What is Linkrunner?

Linkrunner is a **mobile measurement and attribution platform** built for growth teams who need accurate, real-time insights into where their users come from and what drives installs.

## The Problem

Every app marketer faces the same challenge: you're spending across Google, Meta, TikTok, influencers, and a dozen other channels — but you can't tell which ones actually work. Traditional MMPs are expensive, bloated, and built for enterprises with dedicated BI teams.

## Our Solution

Linkrunner gives you **one SDK, one dashboard, and complete clarity** on your acquisition funnel:

- **Deep link attribution** — Know exactly which campaign, creative, and channel drove each install
- **Real-time analytics** — See installs, events, and revenue as they happen, not 24 hours later
- **Smart links** — Create branded short links with automatic routing (iOS → App Store, Android → Play Store, web → landing page)
- **Fraud detection** — Flag suspicious installs with built-in anomaly detection
- **Postback integrations** — Send conversion data back to ad networks automatically

## Who Uses Linkrunner

Linkrunner is used by 100+ apps across fintech, e-commerce, edtech, and content — from early-stage startups to apps with 10M+ MAU. Our sweet spot is growth teams that need enterprise-grade attribution without enterprise-grade complexity.

## Why Teams Switch

Most teams come to us from either AppsFlyer or Adjust. The #1 reason: **they're paying 5-10x more for features they don't use**. Linkrunner gives you the 80% of MMP functionality that actually matters, at a fraction of the cost.`,
    url: null,
  },
  {
    category: "features",
    title: "Features",
    asset_type: "markdown",
    sort_order: 0,
    content: `# Core Features

## Attribution & Measurement

### Multi-Touch Attribution
Track the full user journey across channels. Linkrunner supports **last-click, first-click, and multi-touch** attribution models so you can see the complete picture of how users discover your app.

### Deep Linking
Create smart links that route users to the right destination — App Store, Play Store, or a web fallback. Supports **deferred deep linking** so users land on the right in-app screen even after installing.

### SKAdNetwork Support
Full SKAN 4.0 compliance with coarse and fine-grained conversion values. Get iOS attribution without compromising user privacy.

---

## Analytics & Reporting

### Real-Time Dashboard
See installs, sessions, events, and revenue updating in real time. No more waiting hours for your data to populate.

### Cohort Analysis
Track retention, LTV, and ROAS by acquisition cohort. Compare channel performance over 7, 14, 30, and 90-day windows.

### Custom Events
Track any in-app event — signups, purchases, subscriptions, level completions. Map them to conversion values for ad network optimization.

### Revenue Tracking
Attribute revenue to acquisition sources. Supports in-app purchases, subscriptions, and ad revenue with automatic currency conversion.

---

## Campaign Management

### Smart Links
Branded short links with UTM parameter support. One link handles iOS, Android, and web routing automatically.

### Postback Integration
Automated server-to-server callbacks to all major ad networks: Meta, Google Ads, TikTok, Snapchat, Unity, ironSource, and 30+ others.

### Fraud Protection
Built-in anomaly detection flags click flooding, click injection, SDK spoofing, and device farms. Get alerted before bad traffic drains your budget.

---

## Developer Experience

### Lightweight SDK
Under 200KB. Initialize with 3 lines of code. Supports **iOS (Swift/ObjC), Android (Kotlin/Java), React Native, Flutter**, and Unity.

### REST API
Full programmatic access to attribution data, link management, and reporting. Comprehensive webhook support for event streaming.

### Privacy-First
GDPR and CCPA compliant out of the box. No fingerprinting, no device graphs, no shady workarounds. Clean, consent-based attribution.`,
    url: null,
  },
  {
    category: "how_it_works",
    title: "How It Works",
    asset_type: "markdown",
    sort_order: 0,
    content: `# How Linkrunner Works

## 1. Integrate the SDK

Add the Linkrunner SDK to your app — it takes under 10 minutes.

\`\`\`swift
// iOS — 3 lines to get started
import Linkrunner

func application(_ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    Linkrunner.configure(apiKey: "YOUR_API_KEY")
    return true
}
\`\`\`

\`\`\`kotlin
// Android — equally simple
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Linkrunner.configure(this, "YOUR_API_KEY")
    }
}
\`\`\`

The SDK automatically captures installs, sessions, and device-level identifiers (IDFA/GAID with consent).

---

## 2. Create Smart Links

Generate attribution links for each campaign. Linkrunner links handle platform routing automatically:

- **iOS users** → App Store (or TestFlight for beta)
- **Android users** → Play Store
- **Desktop/web users** → Your landing page
- **Existing users** → Deep link directly into the app

Each link carries campaign metadata (source, medium, campaign name, creative ID) that flows through to attribution.

---

## 3. Run Campaigns

Use your Linkrunner links across every channel:

| Channel | How |
|---------|-----|
| **Paid ads** | Use as click-through URL in Meta, Google, TikTok campaigns |
| **Influencers** | Give each influencer a unique branded link |
| **Organic** | Add UTM parameters to social bio links, QR codes, emails |
| **Referral** | Generate per-user referral links with in-app SDK |

---

## 4. Attribute & Analyze

When a user installs your app, Linkrunner matches them to the campaign that drove the install:

1. **Click recorded** — User taps your Linkrunner link, we store the click with device + campaign data
2. **Install detected** — SDK fires on first app open, sends device identifiers
3. **Match made** — Our attribution engine matches the install to the originating click
4. **Data flows** — Attribution data appears in your dashboard and gets posted back to ad networks

The entire process happens in **under 2 seconds**.

---

## 5. Optimize & Scale

With accurate attribution data flowing, you can:

- **Kill underperforming campaigns** before they waste budget
- **Double down on winners** with confidence in your ROAS numbers
- **Negotiate better rates** with partners using verified install counts
- **Build custom audiences** from high-LTV user segments
- **Automate postbacks** so ad networks optimize toward your actual conversions`,
    url: null,
  },
  {
    category: "differentiators",
    title: "What Makes Us Different",
    asset_type: "markdown",
    sort_order: 0,
    content: `# What Makes Linkrunner Different

## 1. Built for Speed, Not Complexity

Other MMPs were built in 2012 for a world with 3 ad networks. Linkrunner was built in 2024 for growth teams that move fast and hate bloat.

- **10-minute integration** vs. days of setup
- **Real-time data** vs. hours of processing delay
- **Clean UI** vs. 47 tabs you'll never open

## 2. Transparent, Predictable Pricing

No per-install fees that scale with your success. No surprise overages. Linkrunner pricing is flat-rate, based on your tier — so your costs don't spike when your campaigns work.

## 3. India-First, Global-Ready

We understand the nuances of the Indian app ecosystem — UPI-first flows, regional language deep linking, Jio-era device fragmentation. But our infrastructure runs globally across AWS edge locations.

## 4. Privacy Without Compromise

We don't use probabilistic fingerprinting, device graphs, or any gray-area matching. Every attribution is deterministic and consent-based. When regulators come knocking, you'll sleep well.

## 5. Founder-Led Support

You won't get routed to a ticket queue. Our founding team handles onboarding, migration, and ongoing support directly. When something breaks at 2 AM, we pick up the phone.`,
    url: null,
  },
  {
    category: "integrations",
    title: "Integrations",
    asset_type: "markdown",
    sort_order: 0,
    content: `# Integrations

Linkrunner connects to your entire growth stack out of the box.

## Ad Networks

| Network | Postbacks | Deep Links | SKAN |
|---------|-----------|------------|------|
| **Meta (Facebook/Instagram)** | ✅ | ✅ | ✅ |
| **Google Ads** | ✅ | ✅ | ✅ |
| **TikTok** | ✅ | ✅ | ✅ |
| **Snapchat** | ✅ | ✅ | ✅ |
| **Twitter/X** | ✅ | ✅ | — |
| **Unity Ads** | ✅ | — | ✅ |
| **ironSource** | ✅ | — | ✅ |
| **AppLovin** | ✅ | — | ✅ |
| **InMobi** | ✅ | ✅ | — |
| **Mintegral** | ✅ | — | ✅ |

## Analytics & BI

- **Mixpanel** — Enrich user profiles with attribution source
- **Amplitude** — Send install + event data with campaign metadata
- **CleverTap** — Segment users by acquisition channel
- **MoEngage** — Trigger campaigns based on attribution source
- **BigQuery / Snowflake** — Raw event export via S2S webhooks

## Platforms

- **iOS** — Swift, Objective-C (iOS 13+)
- **Android** — Kotlin, Java (API 21+)
- **React Native** — npm package
- **Flutter** — pub.dev package
- **Unity** — Unity Package Manager

## API & Webhooks

Full REST API with real-time webhooks for install, event, and revenue callbacks. Supports custom endpoint configuration with retry logic and payload signing.`,
    url: null,
  },
];

async function main() {
  console.log(`Seeding ${assets.length} assets...\n`);

  for (const asset of assets) {
    // Check if asset already exists for this category
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/assets?category=eq.${asset.category}&asset_type=eq.${asset.asset_type}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const existing = await checkRes.json();

    if (existing.length > 0) {
      // Update existing
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/assets?id=eq.${existing[0].id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            title: asset.title,
            content: asset.content,
            url: asset.url,
          }),
        }
      );
      if (res.ok) {
        console.log(`  ✅ Updated: ${asset.category}`);
      } else {
        const err = await res.text();
        console.log(`  ❌ Failed to update ${asset.category}: ${err}`);
      }
    } else {
      // Insert new
      const res = await fetch(`${SUPABASE_URL}/rest/v1/assets`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(asset),
      });
      if (res.ok) {
        console.log(`  ✅ Created: ${asset.category}`);
      } else {
        const err = await res.text();
        console.log(`  ❌ Failed to create ${asset.category}: ${err}`);
      }
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
