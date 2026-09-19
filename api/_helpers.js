/* =========================================================
   Shared helpers for the /api/projects functions.
   ========================================================= */

const Busboy = require("busboy");
const crypto = require("crypto");
const FileType = require("file-type");
const { supabase } = require("./_supabase");

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per file
const MAX_FILES = 8;

const ALLOWED_EXTENSIONS = [
    "jpg", "jpeg", "png", "webp",
    "pdf",
    "step", "stp", "iges", "igs",
    "sldprt", "sldasm", "prt", 
    "dwg", "dxf",
    "zip", "7z"
];

// If a file's REAL content matches one of these, it's rejected no
// matter what extension it was uploaded with (disguised executable).
const DANGEROUS_MIME_SIGNATURES = [
    "application/x-msdownload",
    "application/x-executable",
    "application/x-mach-binary",
    "application/x-elf",
    "application/vnd.microsoft.portable-executable",
    "application/x-sh",
    "application/x-bat",
    "application/java-archive",
    "application/x-msi"
];

const STORAGE_BUCKET = "chronotech-bucket";


/* ---------------------------------------------------------
   PROJECT ID GENERATOR — CT-YYYYMMDD-XXXXX (unique-checked)
   --------------------------------------------------------- */

async function generateProjectId() {

    let projectId;
    let exists = true;

    while (exists) {

        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const random = crypto.randomBytes(3).toString("hex").toUpperCase();

        projectId = "CT-" + y + m + d + "-" + random;

        const { data } = await supabase
            .from("projects")
            .select("project_id")
            .eq("project_id", projectId)
            .maybeSingle();

        exists = !!data;
    }

    return projectId;
}


/* ---------------------------------------------------------
   PARSE multipart/form-data (Vercel gives raw req, no body
   parser for file uploads — Busboy reads the stream directly)
   --------------------------------------------------------- */

function parseMultipartForm(req) {

    return new Promise(function (resolve, reject) {

        const busboy = Busboy({
            headers: req.headers,
            limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
        });

        const fields = {};
        const files = [];
        let fileSizeExceeded = false;

        busboy.on("field", function (name, value) {
            fields[name] = value;
        });

        busboy.on("file", function (name, stream, info) {

            const chunks = [];

            stream.on("data", function (chunk) {
                chunks.push(chunk);
            });

            stream.on("limit", function () {
                fileSizeExceeded = true;
            });

            stream.on("end", function () {
                if (info.filename) {
                    files.push({
                        filename: info.filename,
                        mimeType: info.mimeType,
                        buffer: Buffer.concat(chunks)
                    });
                }
            });
        });

        busboy.on("finish", function () {

            if (fileSizeExceeded) {
                return reject(new Error("One or more files exceed the 15MB limit."));
            }

            resolve({ fields, files });
        });

        busboy.on("error", reject);

        req.pipe(busboy);
    });
}


/* ---------------------------------------------------------
   VALIDATE + UPLOAD one file to Supabase Storage
   Returns { ok:true, file } or { ok:false, message }
   --------------------------------------------------------- */

async function validateAndUploadFile(projectId, file) {

    const ext = (file.filename.split(".").pop() || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { ok: false, message: "File type not allowed: ." + ext };
    }

    if (file.buffer.length > MAX_FILE_SIZE) {
        return { ok: false, message: '"' + file.filename + '" is over the 15MB limit.' };
    }

    const detected = await FileType.fromBuffer(file.buffer);

    if (detected && DANGEROUS_MIME_SIGNATURES.includes(detected.mime)) {
        return {
            ok: false,
            message: 'Rejected "' + file.filename + '" — file content does not match a safe file type (detected as ' + detected.mime + ").'"
        };
    }

    const safeName = file.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storedName = Date.now() + "_" + safeName;
    const storagePath = projectId + "/" + storedName;

    const { error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file.buffer, {
            contentType: file.mimeType || "application/octet-stream",
            upsert: false
        });

    if (uploadError) {
        return { ok: false, message: "Upload failed for \"" + file.filename + "\": " + uploadError.message };
    }

    const { data: publicUrlData } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

    return {
        ok: true,
        file: {
            originalName: file.filename,
            storedName: storedName,
            size: file.buffer.length,
            mimetype: file.mimeType,
            url: publicUrlData.publicUrl
        }
    };
}


module.exports = {
    MAX_FILE_SIZE,
    MAX_FILES,
    generateProjectId,
    parseMultipartForm,
    validateAndUploadFile
};
