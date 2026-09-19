/* =========================================================
   /api/projects/[id]
   GET -> single project detail + its files
   ========================================================= */

const { supabase } = require("../_supabase");

module.exports = async function handler(req, res) {

    const { id } = req.query;

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed." });
    }

    const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    if (!project) {
        return res.status(404).json({ message: "Project not found." });
    }

    const { data: files } = await supabase
        .from("files")
        .select("*")
        .eq("project_id", id);

    res.json({
        projectId: project.project_id,
        createdAt: project.created_at,
        status: project.status,
        formData: project.form_data,
        files: (files || []).map(function (f) {
            return {
                originalName: f.original_name,
                storedName: f.stored_name,
                size: f.size,
                mimetype: f.mimetype,
                url: f.url
            };
        })
    });
};
