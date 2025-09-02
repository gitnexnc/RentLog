// --- Main application controller ---

import * as ui from './ui.js';
import * as fileManager from './filemanager.js';

const state = {
    properties: [],
    tenants: [],
};

// --- Initial Setup ---
function init() {
    document.getElementById('open-file-btn').addEventListener('click', handleOpenFile);
    document.getElementById('create-file-btn').addEventListener('click', handleCreateFile);
    fileManager.configureInterface(); // Adjust UI elements for legacy browsers
}

async function handleOpenFile() {
    const data = await fileManager.openFile();
    if (data && data.properties && data.tenants) {
        Object.assign(state, data);
        startApp();
    } else if (data) {
        // This case handles a file that is valid JSON but not a valid rentlog file
        alert("Invalid data file. Please select a valid RentLog JSON file or create a new one.");
    }
    // If data is null (meaning the user cancelled the file picker), we simply do nothing.
}

// *** This function now immediately starts the app with a default state. ***
// This provides a much better user experience than forcing a save immediately.
function handleCreateFile() {
    const defaultState = {
        properties: [{id: Date.now(), name: "My First Property", address: "123 Example St"}],
        tenants: [],
    };
    
    Object.assign(state, defaultState);
    startApp();
}

function startApp() {
    // We don't need to directly manipulate the fileHandle from here anymore.
    // The fileManager will correctly handle if it's null or not.
    document.getElementById('loader-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    bindAppEvents();
    renderAll();
    navigateTo('dashboard');
}

// --- Application Logic ---

function bindAppEvents() {
    document.getElementById('menu-button').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => navigateTo(e.currentTarget.getAttribute('href').substring(1)));
    });
    
    document.getElementById('save-file-btn').addEventListener('click', async () => {
        // Now, this button will correctly trigger a "Save As" if no file is open
        const { success } = await fileManager.saveFile(state);
        if (success) ui.showToast();
    });

    // Event delegation for dynamically created content
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        // Tenant Modal
        if (target.id === 'add-tenant-btn') handleAddTenant();
        if (target.id === 'save-tenant-btn') saveTenant();
        if (target.id === 'cancel-tenant-btn') ui.hideModal('tenant-modal');

        // Property Modal
        if (target.matches('.edit-property-btn')) handleEditProperty(target.dataset.id);
        if (target.id === 'save-edit-property-btn') saveProperty();
        if (target.id === 'cancel-edit-property-btn') ui.hideModal('edit-property-modal');
    });
}

function renderAll() {
    ui.renderDashboard(state);
    ui.renderTenantsPage(state);
    ui.renderPropertiesPage(state);
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.toggle('hidden', page.id !== pageId));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('bg-gray-200', link.getAttribute('href') === `#${pageId}`);
    });
    if (document.getElementById('sidebar').classList.contains('open')) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

// --- Tenant Actions ---
function handleAddTenant() {
    if (state.properties.length === 0) {
        alert("Please add a property before adding a tenant.");
        return;
    }
    ui.renderTenantModal(state.properties);
    ui.showModal('tenant-modal');
}

function saveTenant() {
    const newTenant = {
        id: Date.now(),
        propertyId: parseInt(document.getElementById('tenant-property').value),
        name: document.getElementById('tenant-name').value,
        rent: parseFloat(document.getElementById('tenant-rent').value),
    };
    if (!newTenant.name || !newTenant.rent) return alert('Please fill all fields.');
    
    state.tenants.push(newTenant);
    renderAll();
    ui.hideModal('tenant-modal');
}

// --- Property Actions ---
function handleEditProperty(propertyId) {
    const property = state.properties.find(p => p.id == propertyId);
    if (property) {
        ui.renderEditPropertyModal(property);
        ui.showModal('edit-property-modal');
    }
}

function saveProperty() {
    const modalContent = document.querySelector('#edit-property-modal .modal-content');
    const propertyId = parseInt(modalContent.dataset.id);
    const property = state.properties.find(p => p.id === propertyId);
    
    const newName = document.getElementById('edit-property-name').value;
    const newAddress = document.getElementById('edit-property-address').value;
    
    if (!newName || !newAddress) {
        alert("Property name and address cannot be empty.");
        return;
    }

    if (property) {
        property.name = newName;
        property.address = newAddress;
    }
    
    renderAll();
    ui.hideModal('edit-property-modal');
}

// --- App Entry Point ---
init();

