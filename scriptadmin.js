// scriptadmin.js - ADMIN UTILITAS HANDOVER & MUTASI
// Dideploy terpisah untuk integrasi dengan adminutilitas.gs
console.log('Admin Utilitas script loaded');
// Variabel global untuk Admin Utilitas
if (typeof showGlobalLoading === 'undefined') {
    console.warn('showGlobalLoading not defined, creating placeholder');
    window.showGlobalLoading = function(text) {
        console.log('Loading:', text);
    };
    window.hideGlobalLoading = function() {
        console.log('Loading hidden');
    };
}

if (typeof showToast === 'undefined') {
    console.warn('showToast not defined, creating placeholder');
    window.showToast = function(type, message) {
        console.log(`Toast ${type}: ${message}`);
    };
}

// Variabel global untuk Admin Utilitas
let adminHandoverData = null;
let adminMutasiData = [];

// ========== INITIALIZATION ==========
function initAdminUtilitas() {
    console.log('Initializing Admin Utilitas functions...');
    
    // Cek jika sudah diinisialisasi oleh script utama
    const adminPage = document.getElementById('user4Page');
    if (!adminPage) {
        console.log('User4 page not found, skipping initialization');
        return;
    }
    
    // Hapus event listeners yang mungkin sudah ditambahkan oleh script utama
    cleanupDuplicateListeners();
    
    // Setup event listeners khusus Admin Utilitas
    setupAdminUtilitasListeners();
    
    // Setup tabs khusus Admin Utilitas (jika belum)
    if (!adminPage.hasAttribute('data-admin-tabs-setup')) {
        setupAdminUtilitasTabs();
        adminPage.setAttribute('data-admin-tabs-setup', 'true');
    }
    
    // Load data jika ada kavling yang dipilih
    if (typeof selectedKavling !== 'undefined' && selectedKavling) {
        console.log('Loading data for:', selectedKavling);
        setTimeout(() => {
            loadAdminUtilitasData(selectedKavling);
        }, 300);
    }
    
    console.log('Admin Utilitas initialized');
}
function cleanupDuplicateListeners() {
    console.log('Cleaning up duplicate listeners...');
    
    // Remove duplicate save button listeners
    const buttons = [
        '#tab-ho-user .btn-save-section',
        '#btnSaveUtility',
        '#tab-kunci-masuk .btn-save-section',
        '#tab-kunci-keluar .btn-save-section',
        '#btnSaveUtilityNotes'
    ];
    
    buttons.forEach(selector => {
        const btn = document.querySelector(selector);
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        }
    });
}

// ========== EVENT LISTENERS ==========
function setupAdminUtilitasListeners() {
    console.log('Setting up Admin Utilitas listeners...');
    
    // 1. Save Handover (HO) data
    const saveHOButton = document.querySelector('#tab-ho-user .btn-save-section');
    if (saveHOButton) {
        saveHOButton.addEventListener('click', function(e) {
            e.preventDefault();
            saveHandoverKunci();
        });
    }
    
    // 2. Save Utilitas (Listrik & Air)
    const saveUtilitasButton = document.getElementById('btnSaveUtility');
    if (saveUtilitasButton) {
        saveUtilitasButton.addEventListener('click', function(e) {
            e.preventDefault();
            saveUtilitasAdmin();
        });
    }
    
    // 3. Save Mutasi Masuk
    const saveMutasiMasukButton = document.querySelector('#tab-kunci-masuk .btn-save-section');
    if (saveMutasiMasukButton) {
        saveMutasiMasukButton.addEventListener('click', function(e) {
            e.preventDefault();
            saveMutasiAdmin('MASUK');
        });
    }
    
    // 4. Save Mutasi Keluar
    const saveMutasiKeluarButton = document.querySelector('#tab-kunci-keluar .btn-save-section');
    if (saveMutasiKeluarButton) {
        saveMutasiKeluarButton.addEventListener('click', function(e) {
            e.preventDefault();
            saveMutasiAdmin('KELUAR');
        });
    }
    
    // 5. Save Property Notes untuk Admin Utilitas
    const savePropertyNotesButton = document.getElementById('btnSaveUtilityNotes');
    if (savePropertyNotesButton) {
        savePropertyNotesButton.addEventListener('click', function(e) {
            e.preventDefault();
            savePropertyNotesAdmin();
        });
    }
}

// ========== TABS SETUP ==========
function setupAdminUtilitasTabs() {
    const adminPage = document.getElementById('user4Page');
    if (!adminPage) return;
    
    const tabButtons = adminPage.querySelectorAll('.admin-tab-btn');
    const tabContents = adminPage.querySelectorAll('.tab-content-item');
    
    console.log(`Found ${tabButtons.length} admin tabs`);
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabId}`);
            if (targetTab) {
                targetTab.classList.add('active');
                
                // Load data for specific tab if needed
                if (selectedKavling) {
                    switch(tabId) {
                        case 'ho-user':
                            loadHandoverData();
                            break;
                        case 'utility-install':
                            loadUtilitasDataAdmin();
                            break;
                        case 'kunci-masuk':
                            loadMutasiDataAdmin('MASUK');
                            break;
                        case 'kunci-keluar':
                            loadMutasiDataAdmin('KELUAR');
                            break;
                    }
                }
            }
        });
    });
}

// ========== SEARCH SETUP ==========
function setupAdminUtilitasSearch() {
    const searchInput = document.getElementById('searchKavlingUser4Input');
    const searchSelect = document.getElementById('searchKavlingUser4');
    
    if (searchSelect) {
        searchSelect.addEventListener('change', async function() {
            if (this.value) {
                await loadAdminUtilitasData(this.value);
            }
        });
    }
    
    if (searchInput) {
        // Setup custom search untuk admin
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const dropdownList = document.getElementById('searchKavlingUser4List');
            
            if (dropdownList) {
                const items = dropdownList.querySelectorAll('.custom-dropdown-item');
                let hasVisibleItems = false;
                
                items.forEach(item => {
                    if (item.textContent.toLowerCase().includes(searchTerm)) {
                        item.style.display = 'block';
                        hasVisibleItems = true;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Show no results if none visible
                const noResults = dropdownList.querySelector('.no-results');
                if (!hasVisibleItems && !noResults) {
                    const noResultDiv = document.createElement('div');
                    noResultDiv.className = 'custom-dropdown-item no-results';
                    noResultDiv.textContent = 'Tidak ada kavling ditemukan';
                    dropdownList.appendChild(noResultDiv);
                } else if (noResults && hasVisibleItems) {
                    noResults.remove();
                }
            }
        });
    }
}

// ========== LOAD ADMIN UTILITAS DATA ==========
async function loadAdminUtilitasData(kavlingName) {
    if (!kavlingName) return;
    
    showGlobalLoading('Memuat data handover & mutasi...');
    
    try {
        // 1. Load data dari Apps Script 2 (adminutilitas.gs)
        const handoverData = await getAdminData({
            action: 'getHandoverData',
            kavling: kavlingName
        });
        
        // 2. Load data dari Apps Script 1 (progres data) untuk info dasar
        const progressData = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'getKavlingData',
            kavling: kavlingName
        });
        
        if (handoverData.success) {
            adminHandoverData = handoverData;
            adminMutasiData = handoverData.mutasiData || [];
            
            // Update UI dengan data handover
            updateAdminUtilitasUI(kavlingName, progressData, handoverData);
            
            showToast('success', `Data handover untuk ${kavlingName} berhasil dimuat`);
        } else {
            // Jika belum ada data, buat UI kosong
            updateAdminUtilitasUI(kavlingName, progressData, null);
            showToast('info', `Belum ada data handover untuk ${kavlingName}`);
        }
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('error', 'Gagal memuat data handover: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

// ========== UPDATE UI FUNCTIONS ==========
function updateAdminUtilitasUI(kavlingName, progressData, handoverData) {
    // 1. Update basic info (dari progress data)
    updateBasicInfo(progressData);
    
    // 2. Update handover section
    updateHandoverSection(handoverData);
    
    // 3. Update utilitas section
    updateUtilitasSection(handoverData);
    
    // 4. Update mutasi sections
    updateMutasiSections(handoverData);
    
    // 5. Update property notes
    updatePropertyNotes(progressData, handoverData);
}

function updateBasicInfo(progressData) {
    if (!progressData.success) return;
    
    const infoDisplay = document.getElementById('kavlingInfoUser4');
    if (!infoDisplay) return;
    
    infoDisplay.innerHTML = `
        <div class="info-item">
            <span class="info-label">Blok/Kavling:</span>
            <span class="info-value val-name">${progressData.kavling || '-'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Type:</span>
            <span class="info-value val-type">${progressData.type || '-'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Luas Tanah (LT):</span>
            <span class="info-value val-lt">${progressData.lt || '-'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Luas Bangunan (LB):</span>
            <span class="info-value val-lb">${progressData.lb || '-'}</span>
        </div>
    `;
}

function updateHandoverSection(handoverData) {
    const hoTab = document.getElementById('tab-ho-user');
    if (!hoTab) return;
    
    const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
    const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
    const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
    
    if (handoverData && handoverData.handoverData) {
        if (dariInput) dariInput.value = handoverData.handoverData.dari || '';
        if (keInput) keInput.value = handoverData.handoverData.user || '';
        
        // Format tanggal untuk input type="date"
        if (tglInput && handoverData.handoverData.tglHandover) {
            const dateStr = formatDateForInput(handoverData.handoverData.tglHandover);
            tglInput.value = dateStr;
        }
    } else {
        // Reset jika tidak ada data
        if (dariInput) dariInput.value = '';
        if (keInput) keInput.value = '';
        if (tglInput) tglInput.value = '';
    }
}

function updateUtilitasSection(handoverData) {
    const utilitasTab = document.getElementById('tab-utility-install');
    if (!utilitasTab) return;
    
    const listrikInput = utilitasTab.querySelector('#listrikInstallDate');
    const airInput = utilitasTab.querySelector('#airInstallDate');
    
    if (handoverData && handoverData.utilitasData) {
        if (listrikInput) listrikInput.value = formatDateForInput(handoverData.utilitasData.tglListrik) || '';
        if (airInput) airInput.value = formatDateForInput(handoverData.utilitasData.tglAir) || '';
    } else {
        // Reset jika tidak ada data
        if (listrikInput) listrikInput.value = '';
        if (airInput) airInput.value = '';
    }
}

function updateMutasiSections(handoverData) {
    // Update mutasi masuk
    updateMutasiSection('MASUK', handoverData);
    
    // Update mutasi keluar
    updateMutasiSection('KELUAR', handoverData);
}

function updateMutasiSection(jenis, handoverData) {
    let tabId, infoSelector;
    
    if (jenis === 'MASUK') {
        tabId = 'tab-kunci-masuk';
        infoSelector = '.prev-mutasi-masuk-info';
    } else {
        tabId = 'tab-kunci-keluar';
        infoSelector = '.prev-mutasi-keluar-info';
    }
    
    const tab = document.getElementById(tabId);
    if (!tab) return;
    
    const infoDiv = tab.querySelector(infoSelector);
    if (!infoDiv) return;
    
    // Filter mutasi berdasarkan jenis
    if (handoverData && handoverData.mutasiData && handoverData.mutasiData.length > 0) {
        const filteredMutasi = handoverData.mutasiData.filter(m => {
            // Anda perlu menyesuaikan logika filtering berdasarkan struktur data
            return true; // Placeholder
        });
        
        if (filteredMutasi.length > 0) {
            let html = '<ul style="margin: 0; padding-left: 20px;">';
            filteredMutasi.forEach((mutasi, index) => {
                html += `<li>${mutasi.tanggal}: ${mutasi.dari} → ${mutasi.ke}</li>`;
            });
            html += '</ul>';
            infoDiv.innerHTML = html;
        } else {
            infoDiv.textContent = 'Belum ada data mutasi ' + jenis.toLowerCase();
        }
    } else {
        infoDiv.textContent = 'Belum ada data mutasi ' + jenis.toLowerCase();
    }
}

function updatePropertyNotes(progressData, handoverData) {
    const notesTextarea = document.getElementById('utilityPropertyNotes');
    if (!notesTextarea) return;
    
    // Prioritize notes dari handover data, fallback ke progress data
    if (handoverData && handoverData.notes) {
        notesTextarea.value = handoverData.notes;
    } else if (progressData && progressData.propertyNotes) {
        notesTextarea.value = progressData.propertyNotes;
    } else {
        notesTextarea.value = '';
    }
}

// ========== SAVE FUNCTIONS ==========
async function saveHandoverKunci() {
    if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
    }
    
    const hoTab = document.getElementById('tab-ho-user');
    if (!hoTab) return;
    
    const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
    const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
    const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
    
    const dari = dariInput?.value.trim() || '';
    const ke = keInput?.value.trim() || '';
    const tgl = tglInput?.value || '';
    
    if (!dari || !ke) {
        showToast('warning', 'Nama pemberi dan penerima harus diisi!');
        return;
    }
    
    showGlobalLoading('Menyimpan data handover...');
    
    try {
        const result = await getAdminData({
            action: 'saveHandoverKunci',
            kavling: selectedKavling,
            tglHandover: tgl,
            dari: dari,
            ke: ke
        });
        
        if (result.success) {
            showToast('success', 'Data handover berhasil disimpan!');
            
            // Reload data
            await loadAdminUtilitasData(selectedKavling);
        } else {
            showToast('error', 'Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving handover:', error);
        showToast('error', 'Error: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

async function saveUtilitasAdmin() {
    if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
    }
    
    const utilitasTab = document.getElementById('tab-utility-install');
    if (!utilitasTab) return;
    
    const listrikInput = utilitasTab.querySelector('#listrikInstallDate');
    const airInput = utilitasTab.querySelector('#airInstallDate');
    
    const listrikDate = listrikInput?.value || '';
    const airDate = airInput?.value || '';
    
    showGlobalLoading('Menyimpan data utilitas...');
    
    try {
        const result = await getAdminData({
            action: 'saveUtilitas',
            kavling: selectedKavling,
            tglListrik: listrikDate,
            tglAir: airDate
        });
        
        if (result.success) {
            showToast('success', 'Data utilitas berhasil disimpan!');
            
            // Reload data
            await loadAdminUtilitasData(selectedKavling);
        } else {
            showToast('error', 'Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving utilitas:', error);
        showToast('error', 'Error: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

async function saveMutasiAdmin(jenisMutasi) {
    if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
    }
    
    let tabId, dariSelector, keSelector, tglSelector;
    
    if (jenisMutasi === 'MASUK') {
        tabId = 'tab-kunci-masuk';
        dariSelector = '.input-mutasi-masuk-dari';
        keSelector = '.input-mutasi-masuk-ke';
        tglSelector = '.input-mutasi-masuk-tgl';
    } else {
        tabId = 'tab-kunci-keluar';
        dariSelector = '.input-mutasi-keluar-dari';
        keSelector = '.input-mutasi-keluar-ke';
        tglSelector = '.input-mutasi-keluar-tgl';
    }
    
    const tab = document.getElementById(tabId);
    if (!tab) return;
    
    const dariInput = tab.querySelector(dariSelector);
    const keInput = tab.querySelector(keSelector);
    const tglInput = tab.querySelector(tglSelector);
    
    const dari = dariInput?.value.trim() || '';
    const ke = keInput?.value.trim() || '';
    const tanggal = tglInput?.value || '';
    
    if (!dari || !ke) {
        showToast('warning', 'Nama pemberi dan penerima harus diisi!');
        return;
    }
    
    showGlobalLoading('Menyimpan data mutasi...');
    
    try {
        const result = await getAdminData({
            action: 'saveMutasi',
            kavling: selectedKavling,
            jenisMutasi: jenisMutasi,
            dari: dari,
            ke: ke,
            tanggal: tanggal
        });
        
        if (result.success) {
            showToast('success', `Data mutasi ${jenisMutasi.toLowerCase()} berhasil disimpan!`);
            
            // Clear form
            if (dariInput) dariInput.value = '';
            if (keInput) keInput.value = '';
            if (tglInput) tglInput.value = '';
            
            // Reload data
            await loadAdminUtilitasData(selectedKavling);
        } else {
            showToast('error', 'Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving mutasi:', error);
        showToast('error', 'Error: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

async function savePropertyNotesAdmin() {
    if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
    }
    
    const notesTextarea = document.getElementById('utilityPropertyNotes');
    if (!notesTextarea) return;
    
    const notes = notesTextarea.value.trim();
    
    showGlobalLoading('Menyimpan catatan...');
    
    try {
        // Simpan ke Apps Script 1 (kolom property notes)
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'savePropertyNotes',
            kavling: selectedKavling,
            notes: notes,
            user: 'user4'
        });
        
        if (result.success) {
            showToast('success', 'Catatan berhasil disimpan!');
            
            // Update lokal data jika ada
            if (currentKavlingData) {
                currentKavlingData.propertyNotes = notes;
            }
        } else {
            showToast('error', 'Gagal menyimpan: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving property notes:', error);
        showToast('error', 'Error: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

// ========== LOAD DATA FUNCTIONS ==========
async function loadHandoverData() {
    if (!selectedKavling) return;
    
    try {
        const result = await getAdminData({
            action: 'getHandoverData',
            kavling: selectedKavling
        });
        
        if (result.success) {
            updateHandoverSection(result);
        }
    } catch (error) {
        console.error('Error loading handover data:', error);
    }
}

async function loadUtilitasDataAdmin() {
    if (!selectedKavling) return;
    
    try {
        const result = await getAdminData({
            action: 'getHandoverData',
            kavling: selectedKavling
        });
        
        if (result.success) {
            updateUtilitasSection(result);
        }
    } catch (error) {
        console.error('Error loading utilitas data:', error);
    }
}

async function loadMutasiDataAdmin(jenis) {
    if (!selectedKavling) return;
    
    try {
        const result = await getAdminData({
            action: 'getHandoverData',
            kavling: selectedKavling
        });
        
        if (result.success) {
            updateMutasiSection(jenis, result);
        }
    } catch (error) {
        console.error('Error loading mutasi data:', error);
    }
}

// ========== HELPER FUNCTIONS ==========
async function getAdminData(params) {
    return new Promise((resolve, reject) => {
        try {
            let requestUrl = ADMIN_UTILITAS_URL + '?';
            const urlParams = new URLSearchParams();
            
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    urlParams.append(key, params[key]);
                }
            });
            
            // Tambahkan callback untuk JSONP
            const callbackName = 'admin_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            window[callbackName] = function(data) {
                resolve(data);
                delete window[callbackName];
                document.getElementById('script_' + callbackName)?.remove();
            };
            
            urlParams.append('callback', callbackName);
            requestUrl += urlParams.toString();
            
            const script = document.createElement('script');
            script.id = 'script_' + callbackName;
            script.src = requestUrl;
            script.onerror = () => {
                reject(new Error('Failed to load script'));
                delete window[callbackName];
                script.remove();
            };
            
            document.body.appendChild(script);
        } catch (error) {
            reject(error);
        }
    });
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    
    try {
        // Coba parse berbagai format tanggal
        let date;
        
        if (typeof dateStr === 'string') {
            // Format dd-MM-yyyy
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    date = new Date(year, month, day);
                }
            }
            // Format lain, coba parse langsung
            if (!date || isNaN(date.getTime())) {
                date = new Date(dateStr);
            }
        } else if (dateStr instanceof Date) {
            date = dateStr;
        }
        
        if (date && !isNaN(date.getTime())) {
            // Format ke yyyy-MM-dd untuk input[type="date"]
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (error) {
        console.error('Error formatting date:', error);
    }
    
    return '';
}

// ========== INTEGRATION WITH MAIN SCRIPT ==========
// Fungsi untuk diintegrasikan dengan script.js utama
 if (typeof window.searchKavling === 'function') {
        const originalSearchKavling = window.searchKavling;
        
        window.searchKavling = async function(isSync = false) {
            // Simpan kavling lama
            const oldKavling = window.selectedKavling;
            
            // Panggil fungsi original
            const result = await originalSearchKavling.call(this, isSync);
            
            // Jika kavling berubah dan kita di user4, load data admin
            if (window.currentRole === 'user4' && window.selectedKavling && window.selectedKavling !== oldKavling) {
                setTimeout(async () => {
                    try {
                        await loadAdminUtilitasData(window.selectedKavling);
                    } catch (error) {
                        console.error('Error loading admin data after search:', error);
                    }
                }, 500);
            }
            
            return result;
        };
    }
    // Setup integration dengan showPage
    if (typeof window.showPage === 'function') {
        const originalShowPage = window.showPage;
        
        window.showPage = function(role) {
            originalShowPage.call(this, role);
            
            if (role === 'user4') {
                // Tunggu sedikit lalu inisialisasi
                setTimeout(() => {
                    if (typeof initAdminUtilitas === 'function') {
                        initAdminUtilitas();
                    }
                }, 400);
            }
        };
    }
    
    console.log('Admin Utilitas integration setup complete');
}

window.adminUtilitas = {
    init: initAdminUtilitas,
    loadData: loadAdminUtilitasData,
    saveHandover: saveHandoverKunci,
    saveUtilitas: saveUtilitasAdmin,
    saveMutasi: saveMutasiAdmin,
    saveNotes: savePropertyNotesAdmin,
    isLoaded: true
};

// Initialize ketika DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Utilitas DOM ready');
    
    // Setup integrasi
    setupAdminUtilitasIntegration();
    
    // Jika sudah di halaman user4, inisialisasi
    if (typeof currentRole !== 'undefined' && currentRole === 'user4') {
        setTimeout(() => {
            initAdminUtilitas();
        }, 800);
    }
});

// Jika script dimuat secara dinamis, langsung setup integrasi
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(setupAdminUtilitasIntegration, 100);
}
