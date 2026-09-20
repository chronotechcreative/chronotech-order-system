document.addEventListener("DOMContentLoaded", function () {

    // API sekarang satu domain sama frontend (Vercel), jadi path relatif saja.
    const API_BASE = "";

    const ADMIN_KEY_STORAGE = "chronotech_admin_key";

    const listView = document.getElementById("listView");
    const detailView = document.getElementById("detailView");
    const tableBody = document.getElementById("projectTableBody");
    const emptyState = document.getElementById("emptyState");
    const projectCount = document.getElementById("projectCount");
    const backButton = document.getElementById("backButton");

    const detailProjectId = document.getElementById("detailProjectId");
    const detailCreatedAt = document.getElementById("detailCreatedAt");
    const detailFormData = document.getElementById("detailFormData");
    const detailFiles = document.getElementById("detailFiles");
    const statusSelect = document.getElementById("statusSelect");

    let currentProjectId = null;


    function getAdminKey() {
        let key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
        if (!key) {
            key = prompt("Masukkan password admin:");
            if (key) sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        }
        return key;
    }

    function authHeaders() {
        return { "x-admin-key": getAdminKey() || "" };
    }

    function handleUnauthorized() {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        alert("Password salah atau belum diisi. Silakan coba lagi.");
        location.reload();
    }


    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }


    function formatDate(iso) {
        const date = new Date(iso);
        return date.toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    }


    async function loadProjects() {

        const res = await fetch(API_BASE + "/api/projects", { headers: authHeaders() });

        if (res.status === 401) {
            return handleUnauthorized();
        }

        const projects = await res.json();

        projectCount.textContent = projects.length + " project(s) submitted";

        tableBody.innerHTML = "";

        if (projects.length === 0) {
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;

        projects.forEach(function (project) {

            const tr = document.createElement("tr");
            tr.dataset.id = project.projectId;

            const clientName = project.formData.companyName || "-";
            const projectName = project.formData.projectName || "-";

            tr.innerHTML = `
                <td>${project.projectId}</td>
                <td>${clientName}</td>
                <td>${projectName}</td>
                <td>${formatDate(project.createdAt)}</td>
                <td>${project.files.length}</td>
                <td><span class="status-badge status-${project.status}">${project.status}</span></td>
            `;

            tr.addEventListener("click", function () {
                showDetail(project.projectId);
            });

            tableBody.appendChild(tr);
        });
    }


    async function showDetail(projectId) {

        const res = await fetch(API_BASE + "/api/projects/" + projectId, { headers: authHeaders() });

        if (res.status === 401) {
            return handleUnauthorized();
        }

        if (!res.ok) {
            alert("Project not found.");
            return;
        }

        const project = await res.json();

        currentProjectId = project.projectId;

        detailProjectId.textContent = project.projectId;
        detailCreatedAt.textContent = "Submitted " + formatDate(project.createdAt);
        statusSelect.value = project.status;

        detailFormData.innerHTML = "";

        Object.keys(project.formData).forEach(function (key) {

            const value = project.formData[key];

            if (!value) return;

            const field = document.createElement("div");
            field.className = "detail-field";
            field.innerHTML = `
                <div class="detail-field-label">${key}</div>
                <div class="detail-field-value">${value}</div>
            `;

            detailFormData.appendChild(field);
        });

        detailFiles.innerHTML = "";

        if (project.files.length === 0) {
            detailFiles.innerHTML = '<li class="no-files">No files were uploaded for this project.</li>';
        } else {

            project.files.forEach(function (file) {

                const li = document.createElement("li");
                li.innerHTML = `
                    <a href="${file.url}" target="_blank" rel="noopener">${file.originalName}</a>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                `;

                detailFiles.appendChild(li);
            });
        }

        listView.hidden = true;
        detailView.hidden = false;
    }


    backButton.addEventListener("click", function () {
        detailView.hidden = true;
        listView.hidden = false;
        loadProjects();
    });


    statusSelect.addEventListener("change", async function () {

        const res = await fetch(API_BASE + "/api/projects/" + currentProjectId + "/status", {
            method: "PATCH",
            headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
            body: JSON.stringify({ status: statusSelect.value })
        });

        if (res.status === 401) {
            return handleUnauthorized();
        }
    });


    loadProjects();

});