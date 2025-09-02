// --- Handles all interactions with the File System and file fallbacks ---

let fileHandle = null;
let fileName = '';
const isFileSystemApiSupported = 'showOpenFilePicker' in window;

function getElement(id) { return document.getElementById(id); }

// --- Public API ---

/**
 * Configures the initial file action buttons based on browser support.
 * This is the entry point called by app.js.
 * @param {object} callbacks - Functions to call on user action.
 * @param {function} callbacks.onFileOpened - Called with file data when a file is opened.
 * @param {function} callbacks.onCreateNew - Called when the user wants to create a new file.
 */
export function setupFileHandlers({ onFileOpened, onCreateNew }) {
    if (isFileSystemApiSupported) {
        // Modern browsers: Attach listeners to existing buttons
        getElement('open-file-btn').addEventListener('click', async () => {
            const fileResult = await openFile();
            if (fileResult) onFileOpened(fileResult);
        });
        getElement('create-file-btn').addEventListener('click', onCreateNew);
    } else {
        // Fallback for Firefox/Safari: Replace buttons with input/download logic
        const container = getElement('file-actions');
        container.innerHTML = `
            <label class="button-primary px-6 py-3 text-lg cursor-pointer">
                <i class="fas fa-folder-open mr-2"></i> Open File
                <input type="file" id="file-input" class="hidden" accept=".json">
            </label>
            <button id="create-file-fallback-btn" class="button-secondary px-6 py-3 text-lg">
                <i class="fas fa-plus-circle mr-2"></i>Create New
            </button>`;
        
        getElement('file-input').addEventListener('change', async (event) => {
            const fileResult = await openFileFallback(event);
            if (fileResult) onFileOpened(fileResult);
        });
        getElement('create-file-fallback-btn').addEventListener('click', onCreateNew);
    }
}

/**
 * Saves the provided data object. If a file handle exists, it writes to it.
 * Otherwise, it prompts the user to save as a new file.
 * @param {object} data - The application state to save.
 */
export async function saveFile(data) {
    if (isFileSystemApiSupported) {
        if (!fileHandle) {
            return saveFileAs(data); // Prompt to save if no file is open
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
    } else {
        return saveFileFallback(data);
    }
}

/**
 * Prompts the user to "Save As" a new file.
 * @param {object} data - The application state to save.
 */
export async function saveFileAs(data) {
    const suggestedName = `rentlog-data-${new Date().toISOString().split('T')[0]}.json`;
    if (isFileSystemApiSupported) {
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName,
                types: [{ description: 'RentLog Data File', accept: { 'application/json': ['.json'] } }],
            });
            fileName = fileHandle.name;
            // After getting the handle, call saveFile to actually write the data
            const saveResult = await saveFile(data);
            return { ...saveResult, name: fileName };
        } catch (err) {
            console.error("Error creating new file:", err);
            return { success: false, error: err };
        }
    } else {
        return saveFileFallback(data, suggestedName);
    }
}

// --- Internal Functions ---

// Modern API: Opens a file picker and reads the file.
async function openFile() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'RentLog Data Files', accept: { 'application/json': ['.json'] } }],
        });
        fileName = fileHandle.name;
        const file = await fileHandle.getFile();
        const contents = await file.text();
        return { name: fileName, data: JSON.parse(contents) };
    } catch (err) {
        console.error("Error opening file:", err);
        return null;
    }
}

// Fallback: Reads a file from a standard file input event.
function openFileFallback(event) {
    return new Promise((resolve) => {
        const file = event.target.files[0];
        if (!file) {
            resolve(null);
            return;
        }
        fileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve({ name: fileName, data });
            } catch (err) {
                console.error("Error parsing file:", err);
                resolve(null); // Indicate parsing error
            }
        };
        reader.readAsText(file);
    });
}

// Fallback: Saves a file by creating a download link.
function saveFileFallback(data, name) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || fileName || 'rentlog-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, name: a.download };
}

