// --- Handles all interactions with the File System Access API ---
// --- Now includes a fallback for unsupported browsers ---

let fileHandle = null;
const isModernApiSupported = 'showOpenFilePicker' in window;

// --- Legacy Fallback Methods (for Firefox, Safari) ---

/**
 * Opens a file using a hidden <input type="file"> element.
 */
function openFileLegacy() {
    return new Promise((resolve) => {
        // We need to create this element dynamically as it might not be in the HTML
        let importer = document.getElementById('legacy-file-importer');
        if (!importer) {
            importer = document.createElement('input');
            importer.type = 'file';
            importer.id = 'legacy-file-importer';
            importer.style.display = 'none'; // Hide it
            importer.accept = '.json,application/json';
            document.body.appendChild(importer);
        }
        
        importer.onchange = () => {
            const file = importer.files[0];
            if (!file) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const contents = JSON.parse(event.target.result);
                    resolve(contents);
                } catch (err) {
                    console.error("Error parsing legacy file:", err);
                    alert("Failed to parse the selected file. It may be corrupt.");
                    resolve(null);
                }
            };
            reader.readAsText(file);
        };
        importer.click();
    });
}

/**
 * Saves a file by creating a temporary download link and clicking it.
 * @param {object} data - The application state to save.
 */
function saveFileLegacy(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rentlog-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return Promise.resolve({ success: true }); // Mimic modern API response
}


// --- Modern API Methods (for Chrome, Edge) ---

async function openFileModern() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'RentLog JSON Files',
                accept: { 'application/json': ['.json'] },
            }],
        });
        const file = await fileHandle.getFile();
        const contents = await file.text();
        return JSON.parse(contents);
    } catch (err) {
        // It's normal for this to error if the user cancels, so we don't log it as a big error.
        console.log("File open picker was cancelled.");
        return null;
    }
}

async function saveFileAsModern(data) {
    try {
        // *** FIX: Suggest a default filename with the correct extension ***
        fileHandle = await window.showSaveFilePicker({
            suggestedName: 'rentlog-data.json',
            types: [{
                description: 'RentLog Data File',
                accept: { 'application/json': ['.json'] },
            }],
        });
        return saveFileModern(data); // Call the regular save function now that we have a handle
    } catch (err) {
       console.log("File save picker was cancelled.");
       return { success: false, error: err };
    }
}

async function saveFileModern(data) {
    if (!fileHandle) {
        return saveFileAsModern(data);
    }
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        return { success: true };
    } catch (err) {
        console.error("Error saving file:", err);
        return { success: false, error: err };
    }
}


// --- Public-Facing Universal Functions ---

export function openFile() {
    if (isModernApiSupported) {
        return openFileModern();
    } else {
        return openFileLegacy();
    }
}

export function saveFile(data) {
    if (isModernApiSupported) {
        return saveFileModern(data);
    } else {
        // For legacy, every save is a "save as" / download.
        return saveFileLegacy(data);
    }
}

export function saveFileAs(data) {
    if (isModernApiSupported) {
        return saveFileAsModern(data);
    } else {
        return saveFileLegacy(data);
    }
}

export function configureInterface() {
    if (!isModernApiSupported) {
        const saveBtn = document.getElementById('save-file-btn').querySelector('span');
        if (saveBtn) {
            saveBtn.textContent = 'Download Data File';
        }
    }
}

