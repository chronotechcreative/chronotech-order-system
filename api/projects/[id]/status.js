/* =========================================================
   /api/projects/[id]/status
   PATCH -> update review status (New/Reviewed/Quoted/Won/Lost)
   ========================================================= */

const { supabase } = require("../../_supabase");

module.exports = async function handler(req, res) {

    const { id } = req.query;

    if (req.method !== "PATCH") {
        return res.status(405).json({ message: "Method not allowed." });
    }

    let body = req.body;

    // Vercel's default body parser handles JSON automatically for
    // routes that don't disable it, but guard just in case it
    // arrives as a raw string.
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { data: updated, error } = await supabase
        .from("projects")
        .update({ status: (body && body.status) || "New" })
        .eq("project_id", id)
        .select()
        .maybeSingle();

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    if (!updated) {
        return res.status(404).json({ message: "Project not found." });
    }

    res.json({
        success: true,
        project: {
            projectId: updated.project_id,
            createdAt: updated.created_at,
            status: updated.status,
            formData: updated.form_data
        }
    });
};
