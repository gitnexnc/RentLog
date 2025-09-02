// --- Handles all DOM rendering and manipulation ---

function getElement(id) {
    return document.getElementById(id);
}

// --- Page Rendering ---

export function renderDashboard(state) {
    const totalTenants = state.tenants.length;
    const totalProperties = state.properties.length;
    const rentExpected = state.tenants.reduce((sum, t) => sum + t.rent, 0);
    
    getElement('dashboard').innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-md flex items-center">
                <div class="bg-blue-100 p-4 rounded-full"><i class="fas fa-users text-2xl text-blue-500"></i></div>
                <div class="ml-4"><p class="text-gray-500">Total Tenants</p><p class="text-2xl font-bold">${totalTenants}</p></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md flex items-center">
                <div class="bg-green-100 p-4 rounded-full"><i class="fas fa-building text-2xl text-green-500"></i></div>
                <div class="ml-4"><p class="text-gray-500">Properties</p><p class="text-2xl font-bold">${totalProperties}</p></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md flex items-center">
                <div class="bg-indigo-100 p-4 rounded-full"><i class="fas fa-wallet text-2xl text-indigo-500"></i></div>
                <div class="ml-4"><p class="text-gray-500">Rent Expected</p><p class="text-2xl font-bold">₹${rentExpected.toLocaleString('en-IN')}</p></div>
            </div>
        </div>`;
}

export function renderTenantsPage(state) {
    getElement('tenants').innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold text-gray-800">Tenants</h2>
            <button id="add-tenant-btn" class="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors">
                <i class="fas fa-plus mr-2"></i>Add Tenant
            </button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <div id="tenant-list" class="divide-y divide-gray-200">
                ${state.tenants.length === 0 ? '<p class="text-gray-500 p-4 text-center">No tenants found.</p>' :
                    state.tenants.map(tenant => {
                        const property = state.properties.find(p => p.id === tenant.propertyId);
                        return `
                        <div class="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div class="flex items-center mb-2 sm:mb-0">
                                <div class="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">${tenant.name.charAt(0)}</div>
                                <div class="ml-4">
                                    <p class="font-semibold text-gray-800">${tenant.name}</p>
                                    <p class="text-sm text-gray-600">${property ? property.name : 'N/A'}</p>
                                </div>
                            </div>
                            <div class="font-medium">₹${tenant.rent.toLocaleString('en-IN')}</div>
                        </div>`;
                    }).join('')
                }
            </div>
        </div>`;
}

export function renderPropertiesPage(state) {
    getElement('properties').innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Properties</h2>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <div id="property-list" class="divide-y divide-gray-200">
            ${state.properties.length === 0 ? '<p class="text-gray-500 p-4 text-center">No properties found.</p>' :
                state.properties.map(prop => `
                <div class="p-4 flex justify-between items-center">
                    <div class="flex items-center">
                         <div class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"><i class="fas fa-building text-2xl text-gray-500"></i></div>
                         <div class="ml-4">
                            <p class="font-semibold text-gray-800">${prop.name}</p>
                            <p class="text-sm text-gray-600">${prop.address}</p>
                        </div>
                    </div>
                    <div>
                        <button data-id="${prop.id}" class="edit-property-btn text-gray-400 hover:text-indigo-600 px-3 py-2 rounded-md"><i class="fas fa-pencil-alt"></i></button>
                    </div>
                </div>`).join('')
            }
            </div>
        </div>`;
}

// --- Modal Rendering ---

export function renderTenantModal(properties) {
    getElement('tenant-modal').innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="p-6 border-b"><h3 class="text-2xl font-semibold">Add New Tenant</h3></div>
            <form id="tenant-form" class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Property</label>
                    <select id="tenant-property" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select>
                </div>
                <div>
                    <label class="block text-sm font-medium">Full Name</label>
                    <input type="text" id="tenant-name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                </div>
                <div>
                    <label class="block text-sm font-medium">Rent Amount (₹)</label>
                    <input type="number" id="tenant-rent" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                </div>
            </form>
            <div class="p-4 bg-gray-50 flex justify-end space-x-2">
                <button id="cancel-tenant-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button id="save-tenant-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Tenant</button>
            </div>
        </div>`;
}

export function renderEditPropertyModal(property) {
    getElement('edit-property-modal').innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content" data-id="${property.id}">
            <div class="p-6 border-b"><h3 class="text-2xl font-semibold">Edit Property</h3></div>
            <form id="edit-property-form" class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium">Property Name</label>
                    <input type="text" id="edit-property-name" value="${property.name}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                </div>
                <div>
                    <label class="block text-sm font-medium">Address</label>
                    <input type="text" id="edit-property-address" value="${property.address}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                </div>
            </form>
            <div class="p-4 bg-gray-50 flex justify-end space-x-2">
                <button id="cancel-edit-property-btn" class="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button id="save-edit-property-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Changes</button>
            </div>
        </div>`;
}

// --- UI Helpers ---

export function showModal(id) {
    getElement(id).classList.remove('hidden');
}

export function hideModal(id) {
    getElement(id).classList.add('hidden');
}

export function showToast() {
    const toast = getElement('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

