/* =========================================================
   Simple shared-password check for admin-only endpoints.
   Not a full login system — just enough to stop strangers
   from viewing/editing client data via the raw API URL.
   ========================================================= */

function isAdminAuthorized(req) {
    const provided = req.headers["x-admin-key"];
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
        // Fail closed: if no password is configured in Vercel,
        // deny access instead of leaving the endpoint open.
        return false;
    }

    return provided === expected;
}

module.exports = { isAdminAuthorized };