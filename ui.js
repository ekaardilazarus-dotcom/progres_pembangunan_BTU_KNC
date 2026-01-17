// ui.js - UI Components and Utilities

// ========== LOADING MODAL ==========
function showStatusModal(type, title, message) {
  const modal = document.getElementById('loadingModal');
  const textEl = document.getElementById('loadingText');
  const modalContent = modal.querySelector('.modal-content');

  if (!modalContent) return;

  const isDelete = type === 'delete-success';
  const isSuccess = type === 'success' || isDelete;
  const isError = type === 'error';
  
  let iconHtml = '';
  if (type === 'loading') {
    iconHtml = '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>';
  } else if (isSuccess) {
    iconHtml = `
      <div class="success-checkmark">
        <div class="check-icon ${isDelete ? 'delete' : ''}">
          <span class="icon-line line-tip"></span>
          <span class="icon-line line-long"></span>
          <div class="icon-circle"></div>
          <div class="icon-fix"></div>
        </div>
      </div>
      <style>
        .success-checkmark { width: 80px; height: 115px; margin: 0 auto; position: relative; }
        .success-checkmark .check-icon { width: 80px; height: 80px; position: relative; border-radius: 50%; box-sizing: content-box; border: 4px solid #10b981; margin-bottom: 20px; }
        .success-checkmark .check-icon.delete { border-color: #ef4444; }
        .success-checkmark .check-icon .icon-line { height: 5px; background-color: #10b981; display: block; border-radius: 2px; position: absolute; z-index: 10; }
        .success-checkmark .check-icon.delete .icon-line { background-color: #ef4444; }
        .success-checkmark .check-icon .icon-line.line-tip { top: 46px; left: 14px; width: 25px; transform: rotate(45deg); animation: icon-line-tip 0.75s; }
        .success-checkmark .check-icon .icon-line.line-long { top: 38px; right: 8px; width: 47px; transform: rotate(-45deg); animation: icon-line-long 0.75s; }
        .success-checkmark .check-icon .icon-circle { top: -4px; left: -4px; z-index: 10; width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(16, 185, 129, 0.5); box-sizing: content-box; position: absolute; }
        .success-checkmark .check-icon.delete .icon-circle { border-color: rgba(239, 68, 68, 0.5); }
        .success-checkmark .check-icon .icon-fix { top: 8px; width: 5px; left: 26px; z-index: 1; height: 85px; position: absolute; transform: rotate(-45deg); }
        @keyframes icon-line-tip {
            0% { width: 0; left: 1px; top: 19px; }
            54% { width: 0; left: 1px; top: 19px; }
            70% { width: 50px; left: -8px; top: 37px; }
            84% { width: 17px; left: 21px; top: 48px; }
            100% { width: 25px; left: 14px; top: 46px; }
        }
        @keyframes icon-line-long {
            0% { width: 0; right: 46px; top: 54px; }
            65% { width: 0; right: 46px; top: 54px; }
            84% { width: 55px; right: 0px; top: 35px; }
            100% { width: 47px; right: 8px; top: 38px; }
        }
      </style>
    `;
  }

  modal.querySelector('.modal-content').innerHTML = `
    ${iconHtml}
    <h2 style="font-size: 1.25rem; margin-top: 10px;">${title}</h2>
    <p style="color: #94a3b8; margin-top: 5px;">${message}</p>
  `;
  
  modal.style.display = 'flex';

  if (isSuccess) {
    setTimeout(() => {
      hideGlobalLoading();
      const modalContentEl = modal.querySelector('.modal-content');
      if (modalContentEl) {
        modalContentEl.innerHTML = `
          <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>
          <h2 style="font-size: 1.25rem;">Mohon Tunggu</h2>
          <p id="loadingText">Sedang mengambil data...</p>
        `;
      }
    }, 2000);
  }
}

function showGlobalLoading(text = 'Mohon Tunggu...') {
  showStatusModal('loading', 'Mohon Tunggu', text);
}

function hideGlobalLoading() {
  const modal = document.getElementById('loadingModal');
  if (modal) modal.style.display = 'none';
}

// ========== TOAST NOTIFICATION ==========
function showToast(type, message) {
  // Hapus toast sebelumnya
  const existingToast = document.getElementById('globalToast');
  if (existingToast) existingToast.remove();
  
  const template = document.getElementById('toastTemplate');
  if (!template) return;
  
  const toast = template.content.cloneNode(true).querySelector('.toast');
  toast.id = 'globalToast';
  toast.classList.add(`toast-${type}`);
  
  const icon = toast.querySelector('i');
  icon.classList.add(type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
  
  const messageSpan = toast.querySelector('.toast-message');
  messageSpan.textContent = message;
  
  document.body.appendChild(toast);
  
  // Tampilkan toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hapus setelah 2.5 detik
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

// Ganti fungsi lama
function showProgressMessage(type, message) {
  showToast(type, message);
}

// ========== TAB MANAGEMENT ==========
function updateTabsState() {
  const pelaksanaTabs = document.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
  const pelaksanaContent = document.querySelector('.pelaksana-tab-content');
  
  // SELALU AKTIFKAN TABS
  pelaksanaTabs.forEach(btn => {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
  });
  
  if (pelaksanaContent) {
    pelaksanaContent.style.opacity = '1';
    pelaksanaContent.style.pointerEvents = 'auto';
  }
  
  // Selalu pastikan input aktif
  enableAllInputs();
}

function setupAdminTabs() {
  const tabBtns = document.querySelectorAll('#adminPage .admin-tab-btn');
  const tabContents = document.querySelectorAll('#adminPage .tab-content-item');
  
  if (tabBtns.length === 0) return;
  
  // Set active tab pertama kali
  if (tabBtns.length > 0 && !document.querySelector('#adminPage .admin-tab-btn.active')) {
    tabBtns[0].classList.add('active');
    const firstTabId = tabBtns[0].getAttribute('data-tab');
    const firstTab = document.getElementById(`tab-${firstTabId}-admin`);
    if (firstTab) firstTab.classList.add('active');
  }
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Hapus active dari semua
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Tambah active ke yang dipilih
      this.classList.add('active');
      const targetTab = document.getElementById(`tab-${tabId}-admin`);
      if (targetTab) {
        targetTab.classList.add('active');
        
        // Load data sesuai tab
        if (tabId === 'reports') {
          setTimeout(() => window.report.loadSummaryReport(), 100);
        } else if (tabId === 'users') {
          setTimeout(() => window.report.loadUsersForAdmin(), 100);
        } else if (tabId === 'activity') {
          setTimeout(() => window.report.loadActivityLog(), 100);
        }
      }
    });
  });
}

function setupManagerTabs() {
  const tabBtns = document.querySelectorAll('#managerPage .admin-tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      const parentPage = this.closest('.page-content');
      
      const siblingBtns = parentPage.querySelectorAll('.admin-tab-btn');
      const siblingContents = parentPage.querySelectorAll('.tab-content-item');
      
      // Hapus active dari saudara
      siblingBtns.forEach(b => b.classList.remove('active'));
      siblingContents.forEach(c => c.classList.remove('active'));
      
      // Tambah active ke yang dipilih
      this.classList.add('active');
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        
        // Load data sesuai tab (Manager)
        if (parentPage.id === 'managerPage') {
          if (tabId === 'reports') {
            setTimeout(window.report.loadSummaryReport, 100);
          } else if (tabId === 'notes' && window.appGlobals.selectedKavling) {
            loadPropertyNotes(window.appGlobals.selectedKavling);
          }
        }
      }
    });
  });
}

function setupPelaksanaTabs() {
  const roles = ['user1', 'user2', 'user3'];
  
  roles.forEach(role => {
    const pageId = role + 'Page';
    const page = document.getElementById(pageId);
    if (!page) return;
    
    const tabBtns = page.querySelectorAll('.admin-tab-btn');
    
    if (tabBtns.length === 0) return;
    
    // Set active tab pertama kali jika belum ada yang active
    if (tabBtns.length > 0 && !page.querySelector('.admin-tab-btn.active')) {
      tabBtns[0].classList.add('active');
      const firstTabId = tabBtns[0].getAttribute('data-tab');
      const firstTab = page.querySelector(`#tab-${firstTabId}`);
      if (firstTab) firstTab.classList.add('active');
      page.setAttribute('data-active-tab', firstTabId);
    } else {
      const currentActiveBtn = page.querySelector('.admin-tab-btn.active');
      if (currentActiveBtn) {
        page.setAttribute('data-active-tab', currentActiveBtn.getAttribute('data-tab'));
      }
    }

    tabBtns.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        const allBtns = page.querySelectorAll('.admin-tab-btn');
        const allContents = page.querySelectorAll('.tab-content-item');
        
        allBtns.forEach(b => b.classList.remove('active'));
        allContents.forEach(c => c.classList.remove('active'));
        
        this.classList.add('active');
        const targetTab = page.querySelector(`#tab-${tabId}`);
        if (targetTab) {
          targetTab.classList.add('active');
        }

        page.setAttribute('data-active-tab', tabId);
      });
    });
  });
}

function setupUser4Tabs() {
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
        if (window.appGlobals.selectedKavling) {
          switch(tabId) {
            case 'delivery':
              loadKeyDeliveryData();
              break;
            case 'utility-install':
              loadUtilitasData();
              break;
          }
        }
      }
    });
  });
}

// ========== INPUT MANAGEMENT ==========
function disableAllInputs() {
  console.log("Freeze disabled: All inputs remain active");
  return;
}

function enableAllInputs() {
  const pageId = window.appGlobals.currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) {
    console.error(`❌ Page ${pageId} not found for enableAllInputs`);
    return;
  }
  
  console.log(`🔧 Enabling all inputs for ${pageId}`);
  
  // 1. Enable semua checkbox
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb, index) => {
    cb.disabled = false;
    cb.readOnly = false;
    cb.style.opacity = '1';
    cb.style.cursor = 'pointer';
    cb.style.pointerEvents = 'auto';
    
    if (!cb.hasAttribute('data-listener-added')) {
      cb.addEventListener('change', function() {
        const label = this.closest('label');
        if (label) {
          if (this.checked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
        window.progress.updateProgress(pageId);
      });
      cb.setAttribute('data-listener-added', 'true');
    }
  });
  
  // 2. Enable tombol state
  const stateButtons = page.querySelectorAll('.state-btn, .system-btn, .tiles-btn, .table-btn');
  stateButtons.forEach((btn, index) => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
    
    if (!btn.hasAttribute('data-listener-added')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.classList.contains('system-btn')) {
          window.progress.toggleSystemButton(this, this.getAttribute('data-state'));
        } else if (this.classList.contains('tiles-btn')) {
          window.progress.toggleTilesButton(this, this.getAttribute('data-state'));
        } else if (this.classList.contains('table-btn')) {
          window.progress.toggleTableButton(this, this.getAttribute('data-state'));
        }
      });
      btn.setAttribute('data-listener-added', 'true');
    }
  });
  
  // 3. Enable input text/date/textarea
  const textInputs = page.querySelectorAll('input[type="text"], input[type="date"], textarea');
  textInputs.forEach(input => {
    input.disabled = false;
    input.readOnly = false;
    input.style.opacity = '1';
    input.style.cursor = 'text';
    input.style.pointerEvents = 'auto';
  });
  
  // 4. Enable tombol save
  const saveButtons = page.querySelectorAll('.btn-save-section');
  saveButtons.forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
  });
  
  console.log(`✅ Enabled: ${checkboxes.length} checkboxes, ${stateButtons.length} state buttons, ${saveButtons.length} save buttons`);
}

function enableSearchInputs() {
  const pageId = window.appGlobals.currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;
  
  // Aktifkan semua input pencarian
  const searchInputs = page.querySelectorAll('.search-input-custom, input[id*="searchKavling"]');
  searchInputs.forEach(input => {
    input.disabled = false;
    input.style.opacity = '1';
    input.style.pointerEvents = 'auto';
    input.style.cursor = 'text';
  });
  
  // Aktifkan dropdown list jika ada
  const dropdownLists = page.querySelectorAll('.custom-dropdown-list');
  dropdownLists.forEach(list => {
    list.style.pointerEvents = 'auto';
  });
}

// ========== SYNC FUNCTION ==========
async function syncData() {
  const rolePage = window.appGlobals.currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);
  
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }
  
  try {
    showGlobalLoading('Sinkronisasi data...');
    await window.kavling.loadKavlingList();
    
    // Clear selections and reset UI
    window.appGlobals.selectedKavling = null;
    window.appGlobals.currentKavlingData = null;
    
    window.kavling.setSelectedKavlingInDropdowns('');

    // Clear info displays
    const infoIds = ['kavlingInfoUser1', 'kavlingInfoUser2', 'kavlingInfoUser3', 'kavlingInfoUser4', 'kavlingInfoManager'];
    infoIds.forEach(id => {
      const info = document.getElementById(id);
      if (info) {
        if (id === 'kavlingInfoManager') {
          info.innerHTML = `
            <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
            <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
            <div class="info-item"><span class="info-label">Luas Tanah (LT):</span><span class="info-value val-lt">-</span></div>
            <div class="info-item"><span class="info-label">Luas Bangunan (LB):</span><span class="info-value val-lb">-</span></div>
          `;
        } else {
          info.innerHTML = `
            <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
            <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
            <div class="info-item"><span class="info-label">LT:</span><span class="info-value val-lt">-</span></div>
            <div class="info-item"><span class="info-label">LB:</span><span class="info-value val-lb">-</span></div>
          `;
        }
      }
    });

    // Reset specific displays
    if (window.appGlobals.currentRole === 'manager') {
      const progressDisplay = document.getElementById('managerProgressDisplay');
      if (progressDisplay) progressDisplay.style.display = 'none';
      const notesEl = document.getElementById('propertyNotesManager');
      if (notesEl) {
        notesEl.value = '';
        notesEl.placeholder = 'Pilih kavling terlebih dahulu untuk melihat catatan';
      }
    } else {
      window.progress.updateTotalProgressDisplay('0%', rolePage);
      const checkboxes = document.querySelectorAll(`#${rolePage} .sub-task`);
      checkboxes.forEach(cb => {
        cb.checked = false;
        const label = cb.closest('label');
        if (label) label.classList.remove('task-completed');
      });
      const subPercents = document.querySelectorAll(`#${rolePage} .sub-percent`);
      subPercents.forEach(el => el.textContent = '0%');
      const fills = document.querySelectorAll(`#${rolePage} .progress-fill`);
      fills.forEach(el => el.style.width = '0%');
    }

    showStatusModal('success', 'Sinkronisasi Berhasil', 'Data berhasil disinkronisasi!');
    
    setTimeout(() => {
      hideGlobalLoading();
      showToast('success', 'Data berhasil disinkronisasi dan tampilan dibersihkan!');
    }, 1500);
    
  } catch (error) {
    console.error('Sync error:', error);
    hideGlobalLoading();
    showToast('error', 'Gagal sinkronisasi data');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
    }
  }
}

// ========== UTILITY FUNCTIONS ==========
function loadUtilitasDataFromData(data) {
  // Key delivery
  const keyInput = document.getElementById('keyDeliveryInputUser4');
  if (keyInput) {
    keyInput.value = data.data?.tahap4?.['PENYERAHAN KUNCI'] || '';
  }
  
  // Utility Dates
  const listrikInput = document.getElementById('listrikInstallDate');
  const airInput = document.getElementById('airInstallDate');
  const propNotesInput = document.getElementById('utilityPropertyNotes');
  
  if (listrikInput) listrikInput.value = data.utilitas?.listrikDate || '';
  if (airInput) airInput.value = data.utilitas?.airDate || '';
  if (propNotesInput) propNotesInput.value = data.propertyNotes || '';
}

function loadKeyDeliveryData() {
  if (!window.appGlobals.selectedKavling) return;
  
  // This is a placeholder - implement based on your data structure
  console.log('Loading key delivery data for:', window.appGlobals.selectedKavling);
}

function updateKeyDeliveryDisplay(data) {
  const deliverySection = document.getElementById('tab-delivery');
  if (!deliverySection) return;
  
  const deliveryToInput = deliverySection.querySelector('.delivery-section');
  const deliveryDateInput = deliverySection.querySelector('.key-delivery-date');
  
  if (deliveryToInput) {
    deliveryToInput.value = data.deliveryTo || '';
  }
  
  if (deliveryDateInput) {
    deliveryDateInput.value = data.deliveryDate || '';
  }
}

function resetKeyDeliveryForm() {
  const deliverySection = document.getElementById('tab-delivery');
  if (!deliverySection) return;
  
  const deliveryToInput = deliverySection.querySelector('.delivery-section');
  const deliveryDateInput = deliverySection.querySelector('.key-delivery-date');
  
  if (deliveryToInput) deliveryToInput.value = '';
  if (deliveryDateInput) deliveryDateInput.value = '';
}

// ========== DEBUG FUNCTIONS ==========
function debugInputStatus() {
  if (!window.appGlobals.currentRole) return;
  
  const pageId = window.appGlobals.currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;
  
  console.log(`🔍 DEBUG INPUT STATUS untuk ${pageId}:`);
  
  // Checkboxes
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  console.log(`Total checkbox: ${checkboxes.length}`);
}

function fixFontStyles() {
  console.log('Applying font style fixes...');
  // Add font styling fixes here if needed
}

// ========== SETUP USER4 PAGE ==========
function setupUser4Page() {
  console.log('Setting up User4 page...');
  
  // Setup tabs
  setupUser4Tabs();
  
  // Setup save button untuk utilitas
  const btnSaveUtility = document.getElementById('btnSaveUtility');
  if (btnSaveUtility) {
    const newBtn = btnSaveUtility.cloneNode(true);
    btnSaveUtility.parentNode.replaceChild(newBtn, btnSaveUtility);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      saveUtilitasData();
      setupKeyDeliveryButton();
    });
  }
  
  // Setup save buttons untuk mutasi kunci
  setupMutasiButtons();
  
  // Setup dropdown search
  const searchSelect = document.getElementById('searchKavlingUser4');
  if (searchSelect) {
    searchSelect.addEventListener('change', function() {
      if (this.value) {
        window.kavling.searchKavling();
      }
    });
  }
  
  console.log('User4 page setup complete');
}

function setupKeyDeliveryButton() {
  const btnSaveKeyDelivery = document.querySelector('#tab-delivery .btn-save-section');
  if (btnSaveKeyDelivery) {
    const newBtn = btnSaveKeyDelivery.cloneNode(true);
    btnSaveKeyDelivery.parentNode.replaceChild(newBtn, btnSaveKeyDelivery);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      saveKeyDelivery();
    });
  }
}

function setupMutasiButtons() {
  // Button mutasi masuk
  const btnMutasiMasuk = document.querySelector('#tab-kunci-masuk .btn-save-section');
  if (btnMutasiMasuk) {
    btnMutasiMasuk.addEventListener('click', function(e) {
      e.preventDefault();
      saveMutasi('masuk');
    });
  }
  
  // Button mutasi keluar
  const btnMutasiKeluar = document.querySelector('#tab-kunci-keluar .btn-save-section');
  if (btnMutasiKeluar) {
    btnMutasiKeluar.addEventListener('click', function(e) {
      e.preventDefault();
      saveMutasi('keluar');
    });
  }
  
  // Button mutasi HO
  const btnMutasiHO = document.querySelector('#tab-ho-user .btn-save-section');
  if (btnMutasiHO) {
    btnMutasiHO.addEventListener('click', function(e) {
      e.preventDefault();
      saveMutasi('ho');
    });
  }
}

// ========== SAVE FUNCTIONS (Placeholders - implement based on your needs) ==========
async function saveUtilitasData() {
  if (!window.appGlobals.selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  // Implement based on your data structure
  console.log('Saving utilitas data for:', window.appGlobals.selectedKavling);
}

async function saveKeyDelivery() {
  if (!window.appGlobals.selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  // Implement based on your data structure
  console.log('Saving key delivery for:', window.appGlobals.selectedKavling);
}

async function saveMutasi(type) {
  if (!window.appGlobals.selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  // Implement based on your data structure
  console.log(`Saving mutasi ${type} for:`, window.appGlobals.selectedKavling);
}

// Export functions
window.ui = {
  showStatusModal,
  showGlobalLoading,
  hideGlobalLoading,
  showToast,
  updateTabsState,
  setupAdminTabs,
  setupManagerTabs,
  setupPelaksanaTabs,
  setupUser4Tabs,
  disableAllInputs,
  enableAllInputs,
  enableSearchInputs,
  syncData,
  loadUtilitasDataFromData,
  loadKeyDeliveryData,
  updateKeyDeliveryDisplay,
  resetKeyDeliveryForm,
  debugInputStatus,
  fixFontStyles,
  setupUser4Page,
  setupKeyDeliveryButton,
  setupMutasiButtons,
  saveUtilitasData,
  saveKeyDelivery,
  saveMutasi
};
