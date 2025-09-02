// --- Handles all DOM rendering and manipulation ---

function getElement(id) {
    return document.getElementById(id);
}

// --- Reusable Components ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

// --- Page Rendering ---
export function renderDashboard(state) {
    const totalTenants = state.tenants.length;
    const totalProperties = state.properties.length;
    const rentExpected = state.tenants.reduce((sum, t) => sum + t.rent, 0);
    const recentPayments = state.tenants.flatMap(t => t.payments || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    getElement('dashboard').innerHTML = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="stat-card"><div class="stat-icon bg-blue-100 text-blue-500"><i class="fas fa-users"></i></div><div class="ml-4"><p>Total Tenants</p><p class="stat-value">${totalTenants}</p></div></div>
            <div class="stat-card"><div class="stat-icon bg-green-100 text-green-500"><i class="fas fa-building"></i></div><div class="ml-4"><p>Properties</p><p class="stat-value">${totalProperties}</p></div></div>
            <div class="stat-card"><div class="stat-icon bg-indigo-100 text-indigo-500"><i class="fas fa-wallet"></i></div><div class="ml-4"><p>Monthly Rent</p><p class="stat-value">${formatCurrency(rentExpected)}</p></div></div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-4">Recent Payments</h3>
            ${recentPayments.length === 0 ? '<p class="text-gray-500">No recent payments.</p>' : `
                <div class="divide-y divide-gray-200">
                    ${recentPayments.map(p => {
                        const tenant = state.tenants.find(t => t.payments.some(pm => pm.id === p.id));
                        return `<div class="py-3 flex justify-between items-center">
                            <div>
                                <p class="font-semibold">${tenant ? tenant.name : 'Unknown'}</p>
                                <p class="text-sm text-gray-500">${p.type.charAt(0).toUpperCase() + p.type.slice(1)} Payment</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-green-600">${formatCurrency(p.amount)}</p>
                                <p class="text-sm text-gray-500">${formatDate(p.date)}</p>
                            </div>
                        </div>`
                    }).join('')}
                </div>
            `}
        </div>`;
}

export function renderTenantsPage(state) {
    getElement('tenants').innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold text-gray-800">Tenants</h2>
            <button id="add-tenant-btn" class="button-primary"><i class="fas fa-plus mr-2"></i>Add Tenant</button>
        </div>
        <div class="bg-white p-2 sm:p-4 rounded-lg shadow-md">
            <div id="tenant-list" class="divide-y divide-gray-200">
                ${state.tenants.length === 0 ? '<p class="text-gray-500 p-4 text-center">No tenants found.</p>' :
                    state.tenants.map(tenant => {
                        const property = state.properties.find(p => p.id === tenant.propertyId);
                        return `
                        <div class="p-4 hover:bg-gray-50 rounded-lg cursor-pointer tenant-link" data-tenant-id="${tenant.id}">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center">
                                    <div class="avatar">${tenant.name.charAt(0)}</div>
                                    <div class="ml-4">
                                        <p class="font-semibold text-gray-800">${tenant.name}</p>
                                        <p class="text-sm text-gray-600">${property ? property.name : 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                     <p class="font-medium">${formatCurrency(tenant.rent)}</p>
                                     <p class="text-sm text-gray-500">per month</p>
                                </div>
                            </div>
                        </div>`;
                    }).join('')
                }
            </div>
        </div>`;
}

export function renderPropertiesPage(state) {
    getElement('properties').innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold text-gray-800">Properties</h2>
            <button id="add-property-btn" class="button-primary"><i class="fas fa-plus mr-2"></i>Add Property</button>
        </div>
        <div class="bg-white p-2 sm:p-4 rounded-lg shadow-md">
            <div id="property-list" class="divide-y divide-gray-200">
            ${state.properties.length === 0 ? '<p class="text-gray-500 p-4 text-center">No properties found.</p>' :
                state.properties.map(prop => {
                    const tenantCount = state.tenants.filter(t => t.propertyId === prop.id).length;
                    return `
                    <div class="p-4 flex justify-between items-center">
                        <div class="flex items-center">
                             <div class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"><i class="fas fa-building text-2xl text-gray-500"></i></div>
                             <div class="ml-4">
                                <p class="font-semibold text-gray-800">${prop.name}</p>
                                <p class="text-sm text-gray-600">${prop.address}</p>
                                <p class="text-xs text-blue-600 font-medium mt-1">${tenantCount} Tenant(s)</p>
                            </div>
                        </div>
                        <div><button data-id="${prop.id}" class="edit-property-btn button-icon"><i class="fas fa-pencil-alt"></i></button></div>
                    </div>`
                }).join('')
            }
            </div>
        </div>`;
}

export function renderTenantDetailPage(state, tenantId) {
    const tenant = state.tenants.find(t => t.id === tenantId);
    if (!tenant) {
        getElement('tenant-detail').innerHTML = `<p>Tenant not found.</p>`;
        return;
    }
    const property = state.properties.find(p => p.id === tenant.propertyId);
    const payments = (tenant.payments || []).sort((a,b) => new Date(b.date) - new Date(a.date));
    const bills = (tenant.bills || []).sort((a,b) => new Date(b.dueDate) - new Date(a.date));

    getElement('tenant-detail').innerHTML = `
        <div class="flex items-center mb-6">
             <button onclick="history.back()" class="text-gray-500 hover:text-indigo-600 mr-4"><i class="fas fa-arrow-left text-2xl"></i></button>
             <h2 class="text-3xl font-bold text-gray-800">${tenant.name}</h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                 <!-- Payment History -->
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold">Payment History</h3>
                        <button id="add-payment-btn" data-tenant-id="${tenant.id}" class="button-primary-sm"><i class="fas fa-plus mr-2"></i>Log Payment</button>
                    </div>
                    ${payments.length === 0 ? '<p class="text-center text-gray-500 py-4">No payments logged.</p>' : `
                    <ul class="divide-y divide-gray-200">
                        ${payments.map(p => `
                        <li class="py-3 flex justify-between items-center">
                            <div>
                                <p class="font-semibold">${formatCurrency(p.amount)} <span class="badge ${p.type === 'rent' ? 'badge-blue' : 'badge-green'}">${p.type}</span></p>
                                <p class="text-sm text-gray-500">${p.notes || 'No notes'}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-medium">${formatDate(p.date)}</p>
                                <button data-tenant-id="${tenant.id}" data-payment-id="${p.id}" class="delete-payment-btn text-xs text-red-500 hover:text-red-700">Delete</button>
                            </div>
                        </li>`).join('')}
                    </ul>`}
                </div>
                 <!-- Utility Bills -->
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold">Utility Bills</h3>
                        <button id="add-bill-btn" data-tenant-id="${tenant.id}" class="button-primary-sm"><i class="fas fa-bolt mr-2"></i>Add Bill</button>
                    </div>
                    ${bills.length === 0 ? '<p class="text-center text-gray-500 py-4">No bills recorded.</p>' : `
                     <ul class="divide-y divide-gray-200">
                        ${bills.map(b => `
                        <li class="py-3 flex justify-between items-center">
                             <div>
                                <p class="font-semibold">${formatCurrency(b.amount)}</p>
                                <p class="text-sm text-gray-500">Due: ${formatDate(b.dueDate)}</p>
                             </div>
                             <span class="badge ${b.paidOn ? 'badge-green' : 'badge-red'}">${b.paidOn ? 'Paid' : 'Unpaid'}</span>
                        </li>`).join('')}
                    </ul>`}
                </div>
            </div>
            <!-- Tenant Info Card -->
            <div class="bg-white p-6 rounded-lg shadow-md self-start">
                <h3 class="text-xl font-semibold border-b pb-3 mb-4">Details</h3>
                <div class="space-y-3">
                    <div class="info-row"><span class="info-label">Property</span><span class="info-value">${property.name}</span></div>
                    <div class="info-row"><span class="info-label">Rent</span><span class="info-value">${formatCurrency(tenant.rent)} / month</span></div>
                    <div class="info-row"><span class="info-label">Moved In</span><span class="info-value">${formatDate(tenant.moveInDate)}</span></div>
                </div>
            </div>
        </div>
    `;
}

// --- Modal Rendering ---
export function renderPropertyModal(properties, property = null) {
    const isEditing = property !== null;
    getElement('property-modal').innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header"><h3 class="text-2xl font-semibold">${isEditing ? 'Edit' : 'Add'} Property</h3></div>
            <div class="p-6 space-y-4">
                <input type="hidden" id="property-id" value="${isEditing ? property.id : ''}">
                <div>
                    <label class="label">Property Name</label>
                    <input type="text" id="property-name" value="${isEditing ? property.name : ''}" class="input" required>
                </div>
                <div>
                    <label class="label">Address</label>
                    <input type="text" id="property-address" value="${isEditing ? property.address : ''}" class="input" required>
                </div>
            </div>
            <div class="modal-footer">
                <button class="button-secondary cancel-modal-btn">Cancel</button>
                <button id="save-property-btn" class="button-primary">Save Property</button>
            </div>
        </div>`;
}

export function renderTenantModal(properties) {
    getElement('tenant-modal').innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header"><h3 class="text-2xl font-semibold">Add New Tenant</h3></div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="label">Property</label>
                    <select id="tenant-property" class="input">${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select>
                </div>
                <div><label class="label">Full Name</label><input type="text" id="tenant-name" class="input" required></div>
                <div><label class="label">Rent Amount (₹)</label><input type="number" id="tenant-rent" class="input" required></div>
                <div><label class="label">Move-in Date</label><input type="date" id="tenant-move-in" class="input" required></div>
            </div>
            <div class="modal-footer">
                <button class="button-secondary cancel-modal-btn">Cancel</button>
                <button id="save-tenant-btn" class="button-primary">Save Tenant</button>
            </div>
        </div>`;
}

export function renderBillModal(tenantId) {
    getElement('bill-modal').innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header"><h3 class="text-2xl font-semibold">Add Utility Bill</h3></div>
            <div class="p-6 space-y-4">
                 <div><label class="label">Amount (₹)</label><input type="number" id="bill-amount" class="input" required></div>
                 <div><label class="label">Due Date</label><input type="date" id="bill-due-date" class="input" required></div>
            </div>
            <div class="modal-footer">
                <button class="button-secondary cancel-modal-btn">Cancel</button>
                <button id="save-bill-btn" data-tenant-id="${tenantId}" class="button-primary">Save Bill</button>
            </div>
        </div>`;
}

export function renderPaymentModal(tenantId) {
    getElement('payment-modal').innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header"><h3 class="text-2xl font-semibold">Log Payment</h3></div>
            <div class="p-6 space-y-4">
                 <div><label class="label">Amount (₹)</label><input type="number" id="payment-amount" class="input" required></div>
                 <div><label class="label">Payment Date</label><input type="date" id="payment-date" class="input" required></div>
                 <div><label class="label">Payment Type</label><select id="payment-type" class="input"><option value="rent">Rent</option><option value="utility">Utility</option></select></div>
                 <div><label class="label">Notes (Optional)</label><textarea id="payment-notes" class="input" rows="2"></textarea></div>
            </div>
            <div class="modal-footer">
                <button class="button-secondary cancel-modal-btn">Cancel</button>
                <button id="save-payment-btn" data-tenant-id="${tenantId}" class="button-primary">Save Payment</button>
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

