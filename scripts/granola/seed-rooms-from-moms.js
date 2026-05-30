#!/usr/bin/env node

/**
 * Seed DSR rooms from MOM markdown files.
 *
 * For each .md file in the moms/ directory:
 *   1. Creates a room in Supabase (company_name, slug, contact info from MOM header)
 *   2. Inserts the MOM content as the meeting brief
 *   3. Creates empty child rows (overview_sub_tabs, pricing, getting_started)
 *
 * Usage:
 *   node scripts/granola/seed-rooms-from-moms.js
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MOMS_DIR = path.join(__dirname, "moms");
const TRUST_PAGE_URL = "https://trust.linkrunner.io";

const OVERVIEW_SUB_TAB_KEYS = [
  "what_is_linkrunner",
  "product_demo",
  "features",
  "how_it_works",
  "differentiators",
  "integrations",
  "customers_references",
  "security_compliance",
];

const OVERVIEW_SUB_TAB_LABELS = {
  what_is_linkrunner: "What is Linkrunner",
  product_demo: "Product Demo",
  features: "Features",
  how_it_works: "How It Works",
  differentiators: "What Makes Us Different",
  integrations: "Integrations",
  customers_references: "Our Customers & References",
  security_compliance: "Security & Compliance",
};

const OVERVIEW_SUB_TAB_SORT_ORDER = {
  what_is_linkrunner: 0,
  product_demo: 1,
  features: 2,
  how_it_works: 3,
  differentiators: 4,
  integrations: 5,
  customers_references: 6,
  security_compliance: 7,
};

function generateSlug(companyName) {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse MOM markdown to extract metadata.
 * Extracts company name from filename, attendees/contact info from header.
 */
function parseMOM(filename, content) {
  const companyName = filename.replace(".md", "");

  // Extract attendees line
  const attendeesMatch = content.match(/\*\*Attendees:\*\*\s*(.+)/);
  let contactName = null;
  let contactEmail = null;

  if (attendeesMatch) {
    const attendeesStr = attendeesMatch[1];
    // Find the first non-Linkrunner attendee
    const parts = attendeesStr.split("·");
    if (parts.length > 0) {
      const prospectPart = parts[0].trim();
      // Extract first name (before any parentheses or commas)
      const names = prospectPart.split(",").map((n) => n.trim());
      if (names.length > 0) {
        contactName = names[0].replace(/\s*\(.*\)/, "").trim();
      }
    }
  }

  // Extract date
  const dateMatch = content.match(/\*\*Date:\*\*\s*(.+)/);
  const meetingDate = dateMatch ? dateMatch[1].trim() : null;

  return { companyName, contactName, contactEmail, meetingDate };
}

async function seedRoom(filename) {
  const filePath = path.join(MOMS_DIR, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  const { companyName, contactName, contactEmail } = parseMOM(filename, content);
  const slug = generateSlug(companyName);

  console.log(`\n📦 Creating room for: ${companyName} (slug: ${slug})`);

  // Check if room with this slug already exists
  const { data: existing } = await supabase
    .from("rooms")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    console.log(`   ⚠️  Room "${slug}" already exists (id: ${existing.id}). Updating meeting brief only.`);

    // Update the meeting brief content
    const { error: updateError } = await supabase
      .from("meeting_briefs")
      .update({ content })
      .eq("room_id", existing.id);

    if (updateError) {
      console.error(`   ❌ Failed to update meeting brief: ${updateError.message}`);
    } else {
      console.log(`   ✅ Meeting brief updated.`);
    }
    return;
  }

  // Create the room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      slug,
      company_name: companyName,
      contact_name: contactName,
      contact_email: contactEmail,
    })
    .select()
    .single();

  if (roomError) {
    console.error(`   ❌ Failed to create room: ${roomError.message}`);
    return;
  }

  console.log(`   ✅ Room created (id: ${room.id})`);

  const roomId = room.id;

  // Create child rows in parallel
  const [briefResult, subTabsResult, pricingResult, gettingStartedResult] =
    await Promise.all([
      // Meeting brief with MOM content
      supabase.from("meeting_briefs").insert({
        room_id: roomId,
        content: content,
      }),

      // Overview sub-tabs (empty defaults)
      supabase.from("overview_sub_tabs").insert(
        OVERVIEW_SUB_TAB_KEYS.map((key) => ({
          room_id: roomId,
          sub_tab_key: key,
          title: OVERVIEW_SUB_TAB_LABELS[key],
          content: "",
          youtube_url: key === "product_demo" ? "" : null,
          iframe_url: key === "security_compliance" ? TRUST_PAGE_URL : null,
          sort_order: OVERVIEW_SUB_TAB_SORT_ORDER[key],
        }))
      ),

      // Pricing (empty)
      supabase.from("pricing").insert({
        room_id: roomId,
        content: "",
      }),

      // Getting started (empty)
      supabase.from("getting_started").insert({
        room_id: roomId,
        integration_timeline: "",
        migration_steps: "",
        onboarding_plan: "",
      }),
    ]);

  const errors = [
    briefResult.error,
    subTabsResult.error,
    pricingResult.error,
    gettingStartedResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error(`   ❌ Child insert errors:`, errors.map((e) => e.message));
    // Clean up the room
    await supabase.from("rooms").delete().eq("id", roomId);
    console.log(`   🗑️  Room cleaned up due to errors.`);
  } else {
    console.log(`   ✅ Meeting brief + all tabs seeded.`);
    console.log(`   🔗 Room URL: /room/${slug}`);
  }
}

async function main() {
  const files = fs
    .readdirSync(MOMS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(`Found ${files.length} MOM files to seed.\n`);

  for (const file of files) {
    await seedRoom(file);
  }

  console.log(`\n✨ Done! ${files.length} rooms processed.`);
}

main().catch(console.error);
