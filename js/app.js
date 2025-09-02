// --- Main application controller ---

import * as ui from './ui.js';
import * as fileManager from './filemanager.js';

let state = {
    version: 1,
    properties: [],
    tenants: [],
};

let currentView = {
    page: 'dashboard',
    tenantId: null,
};


// --- Initial Setup ---
function init() {
    // Decouple event binding: app.js tells fileManager to set up its own buttons
    // and provides the functions to call when actions happen.
    fileManager.setupFileHandlers({
        onFileOpened: handleFileOpened,
        onCreateNew: handleCreateFile
    });
}

// Renamed from handleOpenFile to avoid confusion
function handleFileOpened(fileResult) {
    if (fileResult.data && fileResult.data.properties && fileResult.data.tenants) {
        state = fileResult.data;
        // Ensure new data structures exist for older files (backward compatibility)
        state.tenants.forEach(t => {
            if (!t.bills) t.bills = [];
            if (!t.payments) t.payments = [];
        });
        startApp(fileResult.name);
    } else {
        ui.showAlert({ title: "Invalid File", message: "The selected file is not a valid RentLog JSON file. Please choose another file or create a new one." });
    }
}

async function handleCreateFile() {
    const defaultState = {
        version: 1,
        properties: [{id: Date.now(), name: "My First Property", address: "123 Example St"}],
        tenants: [],
    };
    
    // First, prompt user to save the new file.
    const { success, name } = await fileManager.saveFileAs(defaultState);

    // Only start the app if the file was successfully saved.
    if (success) {
        state = defaultState;
        startApp(name);
    }
}

function startApp(fileName) {
    document.getElementById('loader-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('file-name-display').textContent = fileName;
    
    bindAppEvents();
    renderAll();
    navigateTo('dashboard');
}


// --- Application Logic & Navigation ---

function bindAppEvents() {
    document.getElementById('menu-button').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => navigateTo(e.currentTarget.getAttribute('href').substring(1)));
    });
    
    document.getElementById('save-file-btn').addEventListener('click', async () => {
        const { success, name } = await fileManager.saveFile(state);
        if (success) {
            ui.showToast();
            if(name) document.getElementById('file-name-display').textContent = name;
        }
    });

    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        const tenantLink = e.target.closest('.tenant-link');

        if (tenantLink) {
            e.preventDefault();
            navigateTo('tenant-detail', { tenantId: parseInt(tenantLink.dataset.tenantId) });
            return;
        }
        
        if (button && button.id === 'back-to-tenants') {
             navigateTo('tenants');
             return;
        }

        if (!button) return;

        // Modals
        if (button.matches('#add-property-btn')) handleAddProperty();
        if (button.matches('.edit-property-btn')) handleEditProperty(button.dataset.id);
        if (button.matches('#save-property-btn')) saveProperty();
        if (button.matches('.cancel-modal-btn')) ui.hideModal(button.closest('.modal').id);

        if (button.matches('#add-tenant-btn')) handleAddTenant();
        if (button.matches('#save-tenant-btn')) saveTenant();

        // Tenant Detail Actions
        if (button.matches('#add-bill-btn')) handleAddBill(button.dataset.tenantId);
        if (button.matches('#save-bill-btn')) saveBill(button.dataset.tenantId);
        
        if (button.matches('#add-payment-btn')) handleAddPayment(button.dataset.tenantId);
        if (button.matches('#save-payment-btn')) savePayment(button.dataset.tenantId);
        if (button.matches('.delete-payment-btn')) deletePayment(button.dataset.tenantId, button.dataset.paymentId);
    });
}

function renderAll() {
    // Only render the visible page to improve performance
    const page = currentView.page;
    if (page === 'dashboard') ui.renderDashboard(state);
    else if (page === 'tenants') ui.renderTenantsPage(state);
    else if (page === 'properties') ui.renderPropertiesPage(state);
    else if (page === 'tenant-detail') ui.renderTenantDetailPage(state, currentView.tenantId);
}

function navigateTo(pageId, params = {}) {
    currentView.page = pageId;
    currentView.tenantId = params.tenantId || null;

    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href').substring(1);
        let isActive = (linkPage === pageId) || (pageId === 'tenant-detail' && linkPage === 'tenants');
        link.classList.toggle('bg-gray-200', isActive);
    });
    
    renderAll(); // Re-render the UI for the new view

    if (document.getElementById('sidebar').classList.contains('open')) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

// --- Action Handlers ---

function handleAddProperty() {
    ui.renderPropertyModal();
    ui.showModal('property-modal');
}
function handleEditProperty(propId) {
    const property = state.properties.find(p => p.id == propId);
    ui.renderPropertyModal(property);
    ui.showModal('property-modal');
}
function saveProperty() {
    const idInput = document.getElementById('property-id');
    const id = idInput.value ? parseInt(idInput.value) : null;
    const name = document.getElementById('property-name').value;
    const address = document.getElementById('property-address').value;
    if (!name || !address) return ui.showAlert({ title: "Missing Info", message: "Property name and address are required." });

    if (id) { // Editing existing
        const prop = state.properties.find(p => p.id === id);
        if (prop) { prop.name = name; prop.address = address; }
    } else { // Adding new
        state.properties.push({ id: Date.now(), name, address });
    }
    ui.renderPropertiesPage(state);
    ui.hideModal('property-modal');
}

function handleAddTenant() {
    if (state.properties.length === 0) return ui.showAlert({ title: "No Properties", message: "Please add a property before adding a tenant." });
    ui.renderTenantModal(state.properties);
    ui.showModal('tenant-modal');
}
function saveTenant() {
    const name = document.getElementById('tenant-name').value;
    const rent = parseFloat(document.getElementById('tenant-rent').value);
    const propertyId = parseInt(document.getElementById('tenant-property').value);
    const moveInDate = document.getElementById('tenant-move-in').value;

    if (!name || !rent || !propertyId || !moveInDate) return ui.showAlert({ title: "Missing Info", message: "Please fill out all fields for the tenant." });
    
    state.tenants.push({ id: Date.now(), name, rent, propertyId, moveInDate, bills: [], payments: [] });
    ui.renderTenantsPage(state);
    ui.hideModal('tenant-modal');
}

function handleAddBill(tenantId) {
    ui.renderBillModal(tenantId);
    ui.showModal('bill-modal');
}
function saveBill(tenantId) {
    const tenant = state.tenants.find(t => t.id == tenantId);
    if (!tenant) return;
    
    const amount = parseFloat(document.getElementById('bill-amount').value);
    const dueDate = document.getElementById('bill-due-date').value;
    if (!amount || !dueDate) return ui.showAlert({ title: "Missing Info", message: "Please provide both an amount and a due date." });

    tenant.bills.push({ id: Date.now(), amount, dueDate, paidOn: null });
    renderAll();
    ui.hideModal('bill-modal');
}

function handleAddPayment(tenantId) {
    ui.renderPaymentModal(tenantId);
    ui.showModal('payment-modal');
}
function savePayment(tenantId) {
    const tenant = state.tenants.find(t => t.id == tenantId);
    if (!tenant) return;

    const amount = parseFloat(document.getElementById('payment-amount').value);
    const date = document.getElementById('payment-date').value;
    const type = document.getElementById('payment-type').value;
    const notes = document.getElementById('payment-notes').value;
    if (!amount || !date || !type) return ui.showAlert({ title: "Missing Info", message: "Amount, date, and type are required." });

    tenant.payments.push({ id: Date.now(), amount, date, type, notes });
    renderAll();
    ui.hideModal('payment-modal');
}

function deletePayment(tenantId, paymentId) {
    const tenant = state.tenants.find(t => t.id == tenantId);
    if (!tenant) return;
    
    ui.showConfirm({
        title: "Delete Payment?",
        message: "Are you sure you want to permanently delete this payment record?",
        onConfirm: () => {
            tenant.payments = tenant.payments.filter(p => p.id != paymentId);
            renderAll();
        }
    });
}

// --- App Entry Point ---
init();

