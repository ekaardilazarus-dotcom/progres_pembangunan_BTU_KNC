// scriptadmin.js - Versi yang Diperbaiki
(function() {
    'use strict';
    
    console.log('=== ADMIN UTILITAS SCRIPT LOADING ===');
    
    // Tunggu sampai script.js selesai load
    function waitForMainScript() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkScript = () => {
                attempts++;
                
                // Cek apakah fungsi utama dari script.js sudah tersedia
                if (window.searchKavling && window.showToast && window.getDataFromServer) {
                    console.log('✅ Main script.js loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Timeout waiting for main script.js'));
                } else {
                    setTimeout(checkScript, 100);
                }
            };
            
            checkScript();
        });
    }
    
    // ========== KONFIGURASI ==========
    const ADMIN_UTILITAS_URL = 'https://script.google.com/macros/s/AKfycbwsAzZ8bUgp-jyWN09CNQ7_qLCOn7qfzqhoXOMjNKQ3GduLH5e7ySD_qdgQSO1wXeZTtQ/exec';
    
    // ========== VARIABEL ==========
    let adminData = {
        handover: null,
        mutasi: [],
        utilitas: null
    };
    
    // ========== UTILITY FUNCTIONS ==========
    function getSelectedKavling() {
        return window.selectedKavling || null;
    }
    
    function showAdminLoading(text) {
        if (window.showGlobalLoading) {
            window.showGlobalLoading(text);
        } else {
            console.log('[ADMIN LOADING]:', text);
        }
    }
    
    function hideAdminLoading() {
        if (window.hideGlobalLoading) {
            window.hideGlobalLoading();
        }
    }
    
    function showAdminToast(type, message) {
        if (window.showToast) {
            window.showToast(type, message);
        } else {
            console.log(`[ADMIN ${type.toUpperCase()}]: ${message}`);
        }
    }
    
    async function fetchAdminData(params) {
        try {
            const url = new URL(ADMIN_UTILITAS_URL);
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Admin fetch error:', error);
            throw error;
        }
    }
    
    // ========== CORE FUNCTIONS ==========
    async function loadAdminUtilitasData(kavlingName) {
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu');
            return;
        }
        
        showAdminLoading(`Memuat data admin untuk ${kavlingName}...`);
        
        try {
            // Load data handover dari admin DB
            const result = await fetchAdminData({
                action: 'getHandoverData',
                kavling: kavlingName
            });
            
            if (result.success) {
                adminData = {
                    handover: result.handoverData || null,
                    mutasi: result.mutasiData || [],
                    utilitas: result.utilitasData || null
                };
                
                // Update UI
                updateAdminUI(kavlingName);
                showAdminToast('success', `Data admin untuk ${kavlingName} dimuat`);
            } else {
                showAdminToast('info', 'Belum ada data admin untuk kavling ini');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            showAdminToast('error', 'Gagal memuat data admin');
        } finally {
            hideAdminLoading();
        }
    }
    
    function updateAdminUI(kavlingName) {
        // Update HO User tab
        updateHOTab();
        
        // Update Mutasi tabs
        updateMutasiTabs();
        
        // Update Utilitas tab
        updateUtilitasTab();
    }
    
    function updateHOTab() {
        const hoTab = document.getElementById('tab-ho-user');
        if (!hoTab || !adminData.handover) return;
        
        const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
        const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
        const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
        
        if (dariInput) dariInput.value = adminData.handover.dari || '';
        if (keInput) keInput.value = adminData.handover.user || '';
        if (tglInput && adminData.handover.tglHandover) {
            tglInput.value = formatDateForInput(adminData.handover.tglHandover);
        }
    }
    
    function updateMutasiTabs() {
        if (!adminData.mutasi || !Array.isArray(adminData.mutasi)) return;
        
        // Update mutasi masuk
        const masukTab = document.getElementById('tab-kunci-masuk');
        if (masukTab) {
            const masukInfo = masukTab.querySelector('.prev-mutasi-masuk-info');
            const masukData = adminData.mutasi.filter(m => m.jenis === 'MASUK');
            if (masukInfo && masukData.length > 0) {
                masukInfo.innerHTML = masukData.map(m => 
                    `<div>${m.tanggal}: ${m.dari} → ${m.ke}</div>`
                ).join('');
            }
        }
        
        // Update mutasi keluar
        const keluarTab = document.getElementById('tab-kunci-keluar');
        if (keluarTab) {
            const keluarInfo = keluarTab.querySelector('.prev-mutasi-keluar-info');
            const keluarData = adminData.mutasi.filter(m => m.jenis === 'KELUAR');
            if (keluarInfo && keluarData.length > 0) {
                keluarInfo.innerHTML = keluarData.map(m => 
                    `<div>${m.tanggal}: ${m.dari} → ${m.ke}</div>`
                ).join('');
            }
        }
    }
    
    function updateUtilitasTab() {
        const utilitasTab = document.getElementById('tab-utility-install');
        if (!utilitasTab || !adminData.utilitas) return;
        
        const listrikInput = utilitasTab.querySelector('#listrikInstallDate');
        const airInput = utilitasTab.querySelector('#airInstallDate');
        
        if (listrikInput && adminData.utilitas.tglListrik) {
            listrikInput.value = formatDateForInput(adminData.utilitas.tglListrik);
        }
        if (airInput && adminData.utilitas.tglAir) {
            airInput.value = formatDateForInput(adminData.utilitas.tglAir);
        }
    }
    
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Date format error:', error);
            return '';
        }
    }
    
    // ========== SAVE FUNCTIONS ==========
    async function saveHandoverKunci() {
        const kavlingName = getSelectedKavling();
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
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
            showAdminToast('warning', 'Nama pemberi dan penerima harus diisi!');
            return;
        }
        
        showAdminLoading('Menyimpan data handover...');
        
        try {
            const result = await fetchAdminData({
                action: 'saveHandoverKunci',
                kavling: kavlingName,
                tglHandover: tgl,
                dari: dari,
                ke: ke
            });
            
            if (result.success) {
                showAdminToast('success', 'Data handover berhasil disimpan!');
                await loadAdminUtilitasData(kavlingName);
            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving handover:', error);
            showAdminToast('error', 'Error: ' + error.message);
        } finally {
            hideAdminLoading();
        }
    }
    
    // ========== SETUP FUNCTIONS ==========
    function setupAdminEventListeners() {
        console.log('Setting up admin event listeners...');
        
        // HO User
        const saveHOButton = document.querySelector('#tab-ho-user .btn-save-section');
        if (saveHOButton) {
            saveHOButton.addEventListener('click', function(e) {
                e.preventDefault();
                saveHandoverKunci();
            });
        }
        
        // Fetch Mutasi Data Button
        const fetchBtn = document.getElementById('btnFetchMutasiData');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const kavling = getSelectedKavling();
                if (kavling) {
                    loadAdminUtilitasData(kavling);
                } else {
                    showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
                }
            });
        }
    }
    
    function setupAdminTabs() {
        const adminPage = document.getElementById('user4Page');
        if (!adminPage) return;
        
        const tabButtons = adminPage.querySelectorAll('.admin-tab-btn');
        const tabContents = adminPage.querySelectorAll('.tab-content-item');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Remove active from all
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active to clicked
                this.classList.add('active');
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }
    
    // ========== INTEGRATION WITH MAIN SCRIPT ==========
    function integrateWithMainScript() {
        console.log('Integrating with main script.js...');
        
        // Override fungsi di window object
        window.setupAdminUtilitasMutation = function(pageElement) {
            console.log('setupAdminUtilitasMutation called from admin script');
            const btnViewMutation = pageElement.querySelector('#btnViewMutationHistory');
            if (btnViewMutation) {
                btnViewMutation.onclick = function() {
                    const kavlingName = window.selectedKavling;
                    if (kavlingName) {
                        showAdminToast('info', `Mengambil riwayat mutasi ${kavlingName}`);
                        loadAdminUtilitasData(kavlingName);
                    } else {
                        showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
                    }
                };
            }
        };
        
        // Override loadAdminUtilitasData
        window.loadAdminUtilitasData = loadAdminUtilitasData;
        
        // Integrasi dengan fungsi searchKavling
        if (window.searchKavling) {
            const originalSearchKavling = window.searchKavling;
            window.searchKavling = async function(isSync = false) {
                const result = await originalSearchKavling.call(this, isSync);
                
                // Jika di user4 page dan ada kavling terpilih, load admin data
                if (window.currentRole === 'user4' && window.selectedKavling) {
                    setTimeout(() => {
                        loadAdminUtilitasData(window.selectedKavling);
                    }, 500);
                }
                
                return result;
            };
        }
    }
    
    // ========== INITIALIZATION ==========
    async function initAdminUtilitas() {
        try {
            // Tunggu main script
            await waitForMainScript();
            
            console.log('=== INITIALIZING ADMIN UTILITAS ===');
            
            // Setup
            setupAdminEventListeners();
            setupAdminTabs();
            integrateWithMainScript();
            
            console.log('✅ Admin Utilitas initialized successfully');
            
            // Auto-init jika sudah di user4 page
            if (window.currentRole === 'user4') {
                console.log('Auto-initializing for user4 page');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Admin Utilitas:', error);
        }
    }
    
    // ========== EXPORT ==========
    window.adminUtilitas = {
        init: initAdminUtilitas,
        loadData: loadAdminUtilitasData,
        saveHandover: saveHandoverKunci
    };
    
    // Auto-init saat DOM siap
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM ready, initializing Admin Utilitas...');
        initAdminUtilitas();
    });
    
    // Juga init jika DOM sudah siap
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        setTimeout(initAdminUtilitas, 100);
    }
    
})();
