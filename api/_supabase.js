/* =========================================================
   Shared Supabase client for all /api serverless functions.
   Uses the SERVICE ROLE key (server-side only, never exposed
   to the browser) so these functions can bypass Row Level
   Security and write on the client's behalf.
   ========================================================= */

const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
        "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. " +
        "Set them in your Vercel project's Environment Variables."
    );
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase };
