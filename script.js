document.addEventListener("DOMContentLoaded", function () {

    const projectForm = document.getElementById("projectForm");

    if (!projectForm) {
        return;
    }


    /* =========================================================
       CONFIG
       ========================================================= */

    // Point this at your backend once deployed, e.g.
    // "https://api.synchrotechcreative.com/api/projects"
    // Same-origin now that the frontend and API both live on Vercel.
    const UPLOAD_API_URL = "/api/projects";

    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    const MAX_FILES = 8;

    const ALLOWED_EXTENSIONS = [
        "jpg", "jpeg", "png", "webp",
        "pdf",
        "step", "stp", "iges", "igs",
        "sldprt", "sldasm",
        "dwg", "dxf",
        "zip", "7z"
    ];


    /* =========================================================
       INLINE VALIDATION HELPERS
       (red = error, green = valid, small message below field)
       ========================================================= */

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    function applyState(wrapper, valid, message) {

        if (!wrapper) {
            return;
        }

        wrapper.classList.remove("is-valid", "is-invalid");
        wrapper.classList.add(valid ? "is-valid" : "is-invalid");

        let msg = wrapper.querySelector(":scope > .field-message");

        if (!msg) {
            msg = document.createElement("p");
            msg.className = "field-message";
            wrapper.appendChild(msg);
        }

        msg.textContent = message;
        msg.classList.toggle("valid-message", valid);
        msg.classList.toggle("error-message", !valid);
    }


    function clearWrapperState(wrapper) {

        if (!wrapper) {
            return;
        }

        wrapper.classList.remove("is-valid", "is-invalid");

        const msg = wrapper.querySelector(":scope > .field-message");

        if (msg) {
            msg.textContent = "";
        }
    }


    function fieldWrapper(field) {
        return field.closest(".form-group") || field.closest(".other-input");
    }


    function setFieldValid(field, message) {
        applyState(fieldWrapper(field), true, message || "Looks good.");
    }


    function setFieldInvalid(field, message) {
        applyState(fieldWrapper(field), false, message);
    }


    function clearFieldState(field) {
        clearWrapperState(fieldWrapper(field));
    }


    /* =========================================================
       REQUIRED TEXT / DATE / TEXTAREA FIELDS — LIVE VALIDATION
       ========================================================= */

    const requiredFields = [

        { id: "companyName", message: "Client / company name is required." },
        { id: "contactPerson", message: "Contact person is required." },
        { id: "phone", message: "WhatsApp / phone number is required." },
        { id: "projectName", message: "Project name is required." },
        { id: "clientName", message: "Client name is required." },
        { id: "confirmationDate", message: "Please select a date." },
        { id: "approval", message: "Signature / approval is required." }

    ];

    const requiredValidators = [];

    requiredFields.forEach(function (field) {

        const input = document.getElementById(field.id);

        if (!input) {
            return;
        }

        function validate() {

            const value = input.value.trim();

            if (value === "") {
                setFieldInvalid(input, field.message);
                return false;
            }

            setFieldValid(input, "Looks good.");
            return true;
        }

        input.addEventListener("input", validate);
        input.addEventListener("blur", validate);

        requiredValidators.push(validate);
    });


    /* =========================================================
       EMAIL — LIVE FORMAT VALIDATION
       ========================================================= */

    const emailField = document.getElementById("email");

    function validateEmail() {

        if (!emailField) {
            return true;
        }

        const value = emailField.value.trim();

        if (value === "") {
            setFieldInvalid(emailField, "Email is required.");
            return false;
        }

        if (!EMAIL_PATTERN.test(value)) {
            setFieldInvalid(emailField, "Please enter a valid email address.");
            return false;
        }

        setFieldValid(emailField, "Valid email address.");
        return true;
    }

    if (emailField) {
        emailField.addEventListener("input", validateEmail);
        emailField.addEventListener("blur", validateEmail);
        requiredValidators.push(validateEmail);
    }


    /* =========================================================
       PROJECT TYPE (radio, required) — LIVE VALIDATION
       ========================================================= */

    const projectTypeInputs = document.querySelectorAll('input[name="projectType"]');
    const projectTypeWrapper = projectTypeInputs.length
        ? projectTypeInputs[0].closest(".form-group")
        : null;

    function validateProjectType() {

        const selected = document.querySelector('input[name="projectType"]:checked');

        if (!selected) {
            applyState(projectTypeWrapper, false, "Please select a project type.");
            return false;
        }

        applyState(projectTypeWrapper, true, "Selected.");
        return true;
    }

    projectTypeInputs.forEach(function (input) {
        input.addEventListener("change", validateProjectType);
    });


    /* =========================================================
       SERVICE REQUIRED (checkbox, at least one) — LIVE VALIDATION
       ========================================================= */

    const serviceInputs = document.querySelectorAll('input[name="services"]');
    const servicesWrapper = serviceInputs.length
        ? serviceInputs[0].closest(".form-group")
        : null;

    function validateServices() {

        const anyChecked = document.querySelector('input[name="services"]:checked');

        if (!anyChecked) {
            applyState(servicesWrapper, false, "Please select at least one service.");
            return false;
        }

        applyState(servicesWrapper, true, "Selected.");
        return true;
    }

    serviceInputs.forEach(function (input) {
        input.addEventListener("change", validateServices);
    });


    /* =========================================================
       OTHER / PLEASE SPECIFY FUNCTION
       (unchanged — shows/hides the "please specify" field)
       ========================================================= */

    function setupOtherField(toggleId, inputId) {

        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (!toggle || !input) {
            return;
        }

        const container = input.closest(".other-input");

        if (!container) {
            return;
        }


        function updateOtherField() {

            if (toggle.checked) {

                container.style.display = "block";
                container.setAttribute("aria-hidden", "false");

            } else {

                container.style.display = "none";
                container.setAttribute("aria-hidden", "true");

                input.value = "";
                clearFieldState(input);
            }
        }


        // Initial state
        updateOtherField();


        // When checkbox / radio changes
        toggle.addEventListener("change", function () {

            updateOtherField();

            if (toggle.checked) {
                input.focus();
            }

        });
    }


    /* =========================================================
       SETUP ALL "OTHER" FIELDS
       ========================================================= */

    setupOtherField(
        "projectTypeOther",
        "projectTypeOtherText"
    );

    setupOtherField(
        "serviceOther",
        "serviceOtherText"
    );

    setupOtherField(
        "referenceOther",
        "referenceOtherText"
    );

    setupOtherField(
        "standardOther",
        "standardOtherText"
    );

    setupOtherField(
        "deliverableOther",
        "deliverableOtherText"
    );

    setupOtherField(
        "fileFormatOther",
        "fileFormatOtherText"
    );

    setupOtherField(
        "paymentOther",
        "paymentOtherText"
    );


    /* =========================================================
       "OTHER" -> REQUIRED TEXT — LIVE VALIDATION
       ========================================================= */

    const otherPairs = [

        { toggleId: "projectTypeOther", textId: "projectTypeOtherText" },
        { toggleId: "serviceOther", textId: "serviceOtherText" },
        { toggleId: "referenceOther", textId: "referenceOtherText" },
        { toggleId: "standardOther", textId: "standardOtherText" },
        { toggleId: "deliverableOther", textId: "deliverableOtherText" },
        { toggleId: "fileFormatOther", textId: "fileFormatOtherText" },
        { toggleId: "paymentOther", textId: "paymentOtherText" }

    ];

    const otherValidators = [];

    otherPairs.forEach(function (pair) {

        const toggle = document.getElementById(pair.toggleId);
        const textField = document.getElementById(pair.textId);

        if (!toggle || !textField) {
            return;
        }

        function validateOtherText() {

            if (!toggle.checked) {
                clearFieldState(textField);
                return true;
            }

            const value = textField.value.trim();

            if (value === "") {
                setFieldInvalid(textField, 'Please specify — required when "Other" is selected.');
                return false;
            }

            setFieldValid(textField, "Looks good.");
            return true;
        }

        toggle.addEventListener("change", validateOtherText);
        textField.addEventListener("input", validateOtherText);

        otherValidators.push(validateOtherText);
    });


    /* =========================================================
       REFERENCE FILE UPLOAD
       (drag & drop + click to browse, preview list, remove,
        client-side size/type/count validation)
       ========================================================= */

    const uploadArea = document.getElementById("referenceUploadArea");
    const fileInput = document.getElementById("referenceFiles");
    const uploadError = document.getElementById("referenceUploadError");
    const filesContainer = document.getElementById("selectedFilesContainer");
    const filesList = document.getElementById("selectedFilesList");
    const filesCount = document.getElementById("selectedFilesCount");

    let selectedFiles = [];


    function formatFileSize(bytes) {

        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }


    function fileIcon(name) {

        const ext = name.split(".").pop().toLowerCase();

        if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "🖼️";
        if (ext === "pdf") return "📄";
        if (["step", "stp", "iges", "igs", "sldprt", "sldasm", "dwg", "dxf"].includes(ext)) return "📐";
        if (["zip", "7z"].includes(ext)) return "🗜️";
        return "📎";
    }


    function showUploadError(message) {

        if (uploadError) {
            uploadError.textContent = message;
        }
    }


    function clearUploadError() {

        if (uploadError) {
            uploadError.textContent = "";
        }
    }


    function renderFileList() {

        if (!filesList || !filesContainer || !filesCount) {
            return;
        }

        filesList.innerHTML = "";

        if (selectedFiles.length === 0) {
            filesContainer.hidden = true;
            return;
        }

        filesContainer.hidden = false;
        filesCount.textContent = selectedFiles.length + " file" + (selectedFiles.length > 1 ? "s" : "");

        selectedFiles.forEach(function (file, index) {

            const item = document.createElement("div");
            item.className = "selected-file-item";

            item.innerHTML = `
                <div class="selected-file-icon">${fileIcon(file.name)}</div>
                <div class="selected-file-info">
                    <span class="selected-file-name">${file.name}</span>
                    <span class="selected-file-size">${formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="remove-file-btn" aria-label="Remove file">&times;</button>
            `;

            item.querySelector(".remove-file-btn").addEventListener("click", function () {
                selectedFiles.splice(index, 1);
                renderFileList();
            });

            filesList.appendChild(item);
        });
    }


    function addFiles(fileListLike) {

        clearUploadError();

        const incoming = Array.from(fileListLike);
        const rejected = [];

        incoming.forEach(function (file) {

            if (selectedFiles.length >= MAX_FILES) {
                rejected.push(file.name + " (max " + MAX_FILES + " files)");
                return;
            }

            const ext = file.name.split(".").pop().toLowerCase();

            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                rejected.push(file.name + " (file type not allowed)");
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                rejected.push(file.name + " (over 15MB)");
                return;
            }

            const alreadyAdded = selectedFiles.some(function (f) {
                return f.name === file.name && f.size === file.size;
            });

            if (!alreadyAdded) {
                selectedFiles.push(file);
            }
        });

        if (rejected.length > 0) {
            showUploadError("Some files were skipped: " + rejected.join(", "));
        }

        renderFileList();
    }


    if (uploadArea && fileInput) {

        uploadArea.addEventListener("click", function () {
            fileInput.click();
        });

        uploadArea.addEventListener("keydown", function (event) {

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInput.click();
            }
        });

        fileInput.addEventListener("change", function () {
            addFiles(fileInput.files);
            fileInput.value = ""; // allow re-adding the same file later
        });

        ["dragenter", "dragover"].forEach(function (eventName) {
            uploadArea.addEventListener(eventName, function (event) {
                event.preventDefault();
                uploadArea.classList.add("drag-over");
            });
        });

        ["dragleave", "drop"].forEach(function (eventName) {
            uploadArea.addEventListener(eventName, function (event) {
                event.preventDefault();
                uploadArea.classList.remove("drag-over");
            });
        });

        uploadArea.addEventListener("drop", function (event) {
            if (event.dataTransfer && event.dataTransfer.files) {
                addFiles(event.dataTransfer.files);
            }
        });
    }


    /* =========================================================
       HELPER FUNCTION
       GET CHECKBOX VALUES
       ========================================================= */

    function getCheckboxValues(
        name,
        otherId,
        otherTextId
    ) {

        const selectedItems = Array.from(
            document.querySelectorAll(
                'input[name="' + name + '"]:checked'
            )
        );

        return selectedItems.map(function (item) {

            if (item.id === otherId) {

                const otherInput =
                    document.getElementById(otherTextId);

                const customValue =
                    otherInput
                        ? otherInput.value.trim()
                        : "";

                if (customValue !== "") {
                    return "Other: " + customValue;
                }

                return "Other";
            }

            return item.value;
        });
    }


    /* =========================================================
       HELPER FUNCTION
       GET RADIO VALUE
       ========================================================= */

    function getRadioValue(
        name,
        otherId,
        otherTextId
    ) {

        const selected =
            document.querySelector(
                'input[name="' + name + '"]:checked'
            );

        if (!selected) {
            return "-";
        }


        if (selected.id === otherId) {

            const otherInput =
                document.getElementById(otherTextId);

            const customValue =
                otherInput
                    ? otherInput.value.trim()
                    : "";

            if (customValue !== "") {
                return "Other: " + customValue;
            }

            return "Other";
        }


        return selected.value;
    }


    /* =========================================================
       SUBMIT SUMMARY MESSAGE
       ========================================================= */

    let submitMessage = projectForm.querySelector(".form-submit-message");

    if (!submitMessage) {

        submitMessage = document.createElement("p");
        submitMessage.className = "form-submit-message";

        const submitWrap = projectForm.querySelector(".form-submit");

        if (submitWrap) {
            submitWrap.appendChild(submitMessage);
        }
    }

    const submitButton = projectForm.querySelector('button[type="submit"]');


    function setSubmitLoading(isLoading) {

        if (!submitButton) {
            return;
        }

        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading
            ? "Uploading…"
            : "Submit Project Request";
    }


    /* =========================================================
       FORM SUBMIT
       1) Validate (inline, live)
       2) Upload form data + files to the backend -> get Project ID
       3) Open WhatsApp with the confirmed Project ID
       ========================================================= */

    projectForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        /* ---- VALIDATION ---- */

        const fieldResults = requiredValidators.map(function (validate) {
            return validate();
        });

        const projectTypeValid = validateProjectType();
        const servicesValid = validateServices();

        const otherResults = otherValidators.map(function (validate) {
            return validate();
        });

        const isValid =
            fieldResults.every(Boolean) &&
            projectTypeValid &&
            servicesValid &&
            otherResults.every(Boolean);


        if (!isValid) {

            const firstInvalid = projectForm.querySelector(
                ".is-invalid input, .is-invalid textarea"
            );

            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
                firstInvalid.focus();
            }

            submitMessage.textContent =
                "Please complete the highlighted fields above before submitting.";

            submitMessage.classList.remove("valid-message");
            submitMessage.classList.add("error-message");

            return;
        }


        submitMessage.textContent = "";
        submitMessage.classList.remove("error-message", "valid-message");


        /* ---- UPLOAD TO BACKEND (Project ID + file storage) ---- */

        let projectId = null;

        try {

            setSubmitLoading(true);

            const formData = new FormData(projectForm);

            // Replace whatever the raw file input contributed with the
            // files we've actually validated/tracked in selectedFiles.
            formData.delete("referenceFiles");

            selectedFiles.forEach(function (file) {
                formData.append("referenceFiles", file, file.name);
            });

            const response = await fetch(UPLOAD_API_URL, {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Upload failed.");
            }

            projectId = result.projectId;

        } catch (error) {

            console.error(error);

            setSubmitLoading(false);

            submitMessage.textContent =
                "Couldn't upload your project right now (" + error.message + "). Please try again.";

            submitMessage.classList.remove("valid-message");
            submitMessage.classList.add("error-message");

            return;

        }

        setSubmitLoading(false);


        /* =====================================================
           SECTION 1 - CLIENT INFORMATION
           ===================================================== */

        const companyName =
            document.getElementById(
                "companyName"
            ).value.trim();


        const contactPerson =
            document.getElementById(
                "contactPerson"
            ).value.trim();


        const phone =
            document.getElementById(
                "phone"
            ).value.trim();


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const companyAddress =
            document.getElementById(
                "companyAddress"
            )?.value.trim() || "-";


        /* =====================================================
           SECTION 2 - PROJECT INFORMATION
           ===================================================== */

        const projectName =
            document.getElementById(
                "projectName"
            ).value.trim();


        const projectCode =
            document.getElementById(
                "projectCode"
            )?.value.trim() || "-";


        const projectType =
            getRadioValue(
                "projectType",
                "projectTypeOther",
                "projectTypeOtherText"
            );


        const targetDeadline =
            document.getElementById(
                "targetDeadline"
            )?.value.trim() || "-";


        /* =====================================================
           SECTION 3 - SERVICE REQUIRED
           ===================================================== */

        const services =
            getCheckboxValues(
                "services",
                "serviceOther",
                "serviceOtherText"
            );


        const serviceText =
            services.length > 0
                ? services.join(", ")
                : "-";


        /* =====================================================
           SECTION 4 - PROJECT DESCRIPTION
           ===================================================== */

        const projectDescription =
            document.getElementById(
                "projectDescription"
            )?.value.trim() || "-";


        /* =====================================================
           SECTION 5 - INPUT FILES / REFERENCES
           ===================================================== */

        const references =
            getCheckboxValues(
                "references",
                "referenceOther",
                "referenceOtherText"
            );


        const referenceText =
            references.length > 0
                ? references.join(", ")
                : "-";


        const uploadedFileNames =
            selectedFiles.length > 0
                ? selectedFiles.map(function (f) { return f.name; }).join(", ")
                : "No files uploaded";


        /* =====================================================
           SECTION 6 - TECHNICAL REQUIREMENTS
           ===================================================== */

        const material =
            document.getElementById(
                "material"
            )?.value.trim() || "-";


        const mainDimensions =
            document.getElementById(
                "mainDimensions"
            )?.value.trim() || "-";


        const tolerance =
            document.getElementById(
                "tolerance"
            )?.value.trim() || "-";


        const loadForceSpeed =
            document.getElementById(
                "loadForceSpeed"
            )?.value.trim() || "-";


        const productionProcess =
            document.getElementById(
                "productionProcess"
            )?.value.trim() || "-";


        const standards =
            getCheckboxValues(
                "standards",
                "standardOther",
                "standardOtherText"
            );


        const standardText =
            standards.length > 0
                ? standards.join(", ")
                : "-";


        /* =====================================================
           SECTION 7 - DELIVERABLES
           ===================================================== */

        const deliverables =
            getCheckboxValues(
                "deliverables",
                "deliverableOther",
                "deliverableOtherText"
            );


        const deliverableText =
            deliverables.length > 0
                ? deliverables.join(", ")
                : "-";


        const fileFormats =
            getCheckboxValues(
                "fileFormat",
                "fileFormatOther",
                "fileFormatOtherText"
            );


        const fileFormatText =
            fileFormats.length > 0
                ? fileFormats.join(", ")
                : "-";


        const revisionModification =
            document.querySelector(
                'input[name="revisionModification"]:checked'
            )?.value || "-";


        /* =====================================================
           SECTION 8 - BUDGET & COMMERCIAL INFORMATION
           ===================================================== */

        const clientBudget =
            document.getElementById(
                "clientBudget"
            )?.value.trim() || "-";


        const paymentMethod =
            getRadioValue(
                "paymentMethod",
                "paymentOther",
                "paymentOtherText"
            );


        const commercialNotes =
            document.getElementById(
                "commercialNotes"
            )?.value.trim() || "-";


        /* =====================================================
           SECTION 9 - CONFIRMATION
           ===================================================== */

        const clientName =
            document.getElementById(
                "clientName"
            ).value.trim();


        const confirmationDate =
            document.getElementById(
                "confirmationDate"
            ).value.trim();


        const approval =
            document.getElementById(
                "approval"
            ).value.trim();


        /* =====================================================
           WHATSAPP MESSAGE
           ===================================================== */

        const message = `

*SYNCHROTECH CREATIVE*
*INTEGRATED ENGINEERING & MANUFACTURING DESIGN SOLUTIONS*

*CLIENT PROJECT ORDER FORM*

Project ID: *${projectId}*

━━━━━━━━━━━━━━━━━━━━━━

*1. CLIENT INFORMATION*

Client / Company Name:
${companyName}

Contact Person:
${contactPerson}

WhatsApp / Phone:
${phone}

Email:
${email}

Company / Project Address:
${companyAddress}


*2. PROJECT INFORMATION*

Project Name:
${projectName}

Project / Part Code:
${projectCode}

Project Type:
${projectType}

Target / Deadline:
${targetDeadline}


*3. SERVICE REQUIRED*

${serviceText}


*4. PROJECT DESCRIPTION & REQUIREMENTS*

${projectDescription}


*5. INPUT FILES / REFERENCES*

Reference Types:
${referenceText}

Uploaded Files (already stored in our system under this Project ID):
${uploadedFileNames}


*6. TECHNICAL REQUIREMENTS*

Material / Specification:
${material}

Main Dimensions / Envelope:
${mainDimensions}

Tolerance / Accuracy:
${tolerance}

Load / Force / Speed:
${loadForceSpeed}

Production Process / Machine:
${productionProcess}

Applicable Standard:
${standardText}


*7. DELIVERABLES*

Requested Output:
${deliverableText}

File Format:
${fileFormatText}

Revision / Modification:
${revisionModification}


*8. BUDGET & COMMERCIAL INFORMATION*

Client Budget:
${clientBudget}

Preferred Payment Method:
${paymentMethod}

Special Commercial Notes:
${commercialNotes}


*9. CONFIRMATION*

Client Name:
${clientName}

Date:
${confirmationDate}

Signature / Approval:
${approval}

━━━━━━━━━━━━━━━━━━━━━━

*SYNCHROTECH CREATIVE*
*FROM IDEAS TO ENGINEERING SOLUTIONS*

Thank you for your project request.
We will review the information and files and contact you for further discussion and quotation.

        `.trim();


        /* =====================================================
           WHATSAPP
           ===================================================== */

        const whatsappNumber =
            "6283153101468";


        const whatsappURL =
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            encodeURIComponent(message);


        submitMessage.textContent =
            "Project submitted — ID " + projectId + ". Opening WhatsApp…";

        submitMessage.classList.remove("error-message");
        submitMessage.classList.add("valid-message");


        window.open(
            whatsappURL,
            "_blank"
        );

    });

});
