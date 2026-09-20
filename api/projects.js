/* =========================================================
   /api/projects
   GET  -> list all projects (used by admin dashboard)
   POST -> client submits the form (multipart/form-data),
           files go under the "referenceFiles" field
   ========================================================= */

const { supabase } = require("./_supabase");
const { generateProjectId, parseMultipartForm, validateAndUploadFile } = require("./_helpers");
const { isAdminAuthorized } = require("./_auth");
// Vercel: disable the default JSON body parser so Busboy can
// read the raw multipart stream itself.
const config = { api: { bodyParser: false } };


async function listProjects(req, res) {

    const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    const withFiles = await Promise.all(projects.map(async function (p) {

        const { data: files } = await supabase
            .from("files")
            .select("*")
            .eq("project_id", p.project_id);

        return {
            projectId: p.project_id,
            createdAt: p.created_at,
            status: p.status,
            formData: p.form_data,
            files: (files || []).map(function (f) {
                return {
                    originalName: f.original_name,
                    storedName: f.stored_name,
                    size: f.size,
                    mimetype: f.mimetype,
                    url: f.url
                };
            })
        };
    }));

    res.json(withFiles);
}


async function createProject(req, res) {

    let fields, files;

    try {
        const parsed = await parseMultipartForm(req);
        fields = parsed.fields;
        files = parsed.files.filter(function (f) { return f.filename && f.filename.length; });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }

    const projectId = await generateProjectId();
    const savedFiles = [];

    for (const file of files) {

        const result = await validateAndUploadFile(projectId, file);

        if (!result.ok) {
            return res.status(400).json({ success: false, message: result.message });
        }

        savedFiles.push(result.file);
    }

    const { error: insertError } = await supabase
        .from("projects")
        .insert({
            project_id: projectId,
            status: "New",
            company_name: fields.companyName || null,
            project_name: fields.projectName || null,
            email: fields.email || null,
            phone: fields.phone || null,
            form_data: fields
        });

    if (insertError) {
        return res.status(500).json({ success: false, message: insertError.message });
    }

    if (savedFiles.length > 0) {

        const { error: filesError } = await supabase
            .from("files")
            .insert(savedFiles.map(function (f) {
                return {
                    project_id: projectId,
                    original_name: f.originalName,
                    stored_name: f.storedName,
                    size: f.size,
                    mimetype: f.mimetype,
                    url: f.url
                };
            }));

        if (filesError) {
            return res.status(500).json({ success: false, message: filesError.message });
        }
    }

    res.json({ success: true, projectId: projectId, filesReceived: savedFiles.length });
}


module.exports = async function handler(req, res) {

    try {

        if (req.method === "GET") {
            if (!isAdminAuthorized(req)) {
                return res.status(401).json({ message: "Unauthorized." });
            }
            return await listProjects(req, res);
        }

        if (req.method === "POST") {
            return await createProject(req, res);
        }

        res.status(405).json({ message: "Method not allowed." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
};
