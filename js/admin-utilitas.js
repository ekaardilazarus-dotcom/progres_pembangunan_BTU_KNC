// Admin and Utilitas Module Functions

// Global state for admin utilitas
window.adminUtilitasData = {
  handover: null,
  utilitas: null,
  mutasiMasuk: '',
  mutasiKeluar: '',
  mutasi: []
};

// ========== LOAD UTILITAS DATA ==========
window.loadUtilitasDataFromData = function(data) {
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
};

// ========== LOAD ADMIN UTILITAS DATA (SERVER) ==========
window.loadAdminUtilitasData = async function(kavlingName) {
  if (!kavlingName) {
    showToast('warning', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  if (typeof showGlobalLoading === 'function') showGlobalLoading(`Memuat data admin untuk ${kavlingName}...`);
  
  try {
    const result = await getDataFromServer(ADMIN_UTILITAS_URL, { action: 'getHandoverData', kavling: kavlingName });
    if (result.success) {
      // Parse data mutasi
      const mutasiMasukEntries = window.parseMutasiDataFromString(result.mutasiMasuk || '');
      const mutasiKeluarEntries = window.parseMutasiDataFromString(result.mutasiKeluar || '');
      
      mutasiMasukEntries.forEach(entry => entry.jenis = 'MASUK');
      mutasiKeluarEntries.forEach(entry => entry.jenis = 'KELUAR');
      
      const allMutasi = [...mutasiMasukEntries, ...mutasiKeluarEntries];
      
      window.adminUtilitasData = {
        handover: result.handoverData || null,
        utilitas: result.utilitasData || null,
        mutasiMasuk: result.mutasiMasuk || '',
        mutasiKeluar: result.mutasiKeluar || '',
        mutasi: allMutasi
      };
      
      // Update UI
      window.updateAdminUI(kavlingName);
      
      const tabsContainer = document.getElementById('adminUtilitasTabsContainer');
      if (tabsContainer) tabsContainer.style.display = 'block';
      
      showToast('success', `Data admin untuk ${kavlingName} dimuat`);
    } else {
      showToast('info', 'Belum ada data admin untuk kavling ini');
      window.resetAdminUI();
    }
  } catch (error) {
    console.error('Error loading admin data:', error);
    showToast('error', 'Gagal memuat data admin');
    window.resetAdminUI();
  } finally {
    if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
  }
};

window.resetAdminUI = function() {
  const tabsContainer = document.getElementById('adminUtilitasTabsContainer');
  if (tabsContainer) tabsContainer.style.display = 'none';

  const inputs = document.querySelectorAll('#user4Page input');
  inputs.forEach(input => {
    if (input) {
      input.value = '';
      input.disabled = false;
      input.style.opacity = '1';
    }
  });
  
  const saveButtons = document.querySelectorAll('#user4Page .btn-save-section');
  saveButtons.forEach(btn => {
    if (btn) btn.style.display = 'block';
  });
  
  const editContainers = document.querySelectorAll('#user4Page .edit-container');
  editContainers.forEach(container => {
    if (container) container.style.display = 'none';
  });
  
  const mutasiInfos = document.querySelectorAll('.prev-mutasi-masuk-info, .prev-mutasi-keluar-info');
  mutasiInfos.forEach(info => {
    if (info) info.innerHTML = '<div class="no-data">Belum ada data</div>';
  });
};

window.updateAdminUI = function(kavlingName) {
  window.updateHOTab();
  window.updateMutasiTabs();
  window.updateUtilitasTab();
};

window.updateHOTab = function() {
  const hoTab = document.getElementById('tab-ho-user');
  if (!hoTab) return;
  
  const data = window.adminUtilitasData;
  const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
  const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
  const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
  const editContainer = document.getElementById('ho-edit-container');
  const saveBtn = hoTab.querySelector('.btn-save-section');
  
  if (dariInput) dariInput.value = data.handover?.dari || '';
  if (keInput) keInput.value = data.handover?.user || '';
  if (tglInput && data.handover?.tglHandover) {
    tglInput.value = formatDateForInput(data.handover.tglHandover);
  }

  if (data.handover && (data.handover.dari || data.handover.user)) {
    [dariInput, keInput, tglInput].forEach(input => {
      if (input) {
        input.disabled = true;
        input.style.opacity = '0.7';
      }
    });
    if (editContainer) editContainer.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'none';
  } else {
    [dariInput, keInput, tglInput].forEach(input => {
      if (input) {
        input.disabled = false;
        input.style.opacity = '1';
      }
    });
    if (editContainer) editContainer.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'block';
  }
};

window.updateMutasiTabs = function() {
  const data = window.adminUtilitasData;
  
  // Update mutasi masuk
  const masukTab = document.getElementById('tab-kunci-masuk');
  if (masukTab) {
    const masukInfo = masukTab.querySelector('.prev-mutasi-masuk-info');
    if (masukInfo) {
      const masukData = data.mutasi.filter(m => m.jenis === 'MASUK');
      if (masukData.length > 0) {
        masukInfo.innerHTML = masukData.map((m, index) => 
          `<div class="mutasi-entry" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span>
                <div style="margin-top: 2px;">
                  <span style="font-weight: 500;">${m.dari || '-'}</span>
                  <i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5;"></i>
                  <span style="font-weight: 500;">${m.ke || '-'}</span>
                </div>
              </div>
              <span style="color: #38bdf8; font-size: 0.85rem;">${m.tanggal || '-'}</span>
            </div>
          </div>`
        ).join('');
      } else {
        masukInfo.innerHTML = '<div class="no-data" style="padding: 20px; text-align: center; color: #64748b;">Belum ada riwayat mutasi masuk</div>';
      }
    }
  }
  
  // Update mutasi keluar
  const keluarTab = document.getElementById('tab-kunci-keluar');
  if (keluarTab) {
    const keluarInfo = keluarTab.querySelector('.prev-mutasi-keluar-info');
    if (keluarInfo) {
      const keluarData = data.mutasi.filter(m => m.jenis === 'KELUAR');
      if (keluarData.length > 0) {
        keluarInfo.innerHTML = keluarData.map((m, index) => 
          `<div class="mutasi-entry" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span>
                <div style="margin-top: 2px;">
                  <span style="font-weight: 500;">${m.dari || '-'}</span>
                  <i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5;"></i>
                  <span style="font-weight: 500;">${m.ke || '-'}</span>
                </div>
              </div>
              <span style="color: #38bdf8; font-size: 0.85rem;">${m.tanggal || '-'}</span>
            </div>
          </div>`
        ).join('');
      } else {
        keluarInfo.innerHTML = '<div class="no-data" style="padding: 20px; text-align: center; color: #64748b;">Belum ada riwayat mutasi keluar</div>';
      }
    }
  }
};

window.updateUtilitasTab = function() {
  const utilitasTab = document.getElementById('tab-utility-install');
  if (!utilitasTab) return;
  
  const data = window.adminUtilitasData;
  const listrikInput = utilitasTab.querySelector('#listrikInstallDate');
  const airInput = utilitasTab.querySelector('#airInstallDate');
  const editContainer = document.getElementById('utility-edit-container');
  const saveBtn = document.getElementById('btnSaveUtility');
  
  const listrikVal = formatDateForInput(data.utilitas?.tglListrik || '');
  const airVal = formatDateForInput(data.utilitas?.tglAir || '');
  
  if (listrikInput) listrikInput.value = listrikVal;
  if (airInput) airInput.value = airVal;

  if (listrikVal || airVal) {
    [listrikInput, airInput].forEach(input => {
      if (input) {
        input.disabled = true;
        input.style.opacity = '0.7';
      }
    });
    
    // Sembunyikan tombol "Hari Ini"
    const todayButtons = utilitasTab.querySelectorAll('.btn-today-admin');
    todayButtons.forEach(btn => btn.style.display = 'none');

    if (editContainer) editContainer.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'none';
  } else {
    [listrikInput, airInput].forEach(input => {
      if (input) {
        input.disabled = false;
        input.style.opacity = '1';
      }
    });

    // Tampilkan tombol "Hari Ini"
    const todayButtons = utilitasTab.querySelectorAll('.btn-today-admin');
    todayButtons.forEach(btn => btn.style.display = 'block');

    if (editContainer) editContainer.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'block';
  }
};

// ========== SAVE FUNCTIONS ==========
window.saveHandoverKunci = async function() {
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
  
  if (tgl && !validateDateInput(tgl)) {
    showToast('warning', 'Format tanggal tidak valid! Gunakan dd/mm/yyyy');
    return;
  }
  
  if (typeof showGlobalLoading === 'function') showGlobalLoading('Menyimpan data handover...');
  
  try {
    const result = await getDataFromServer(ADMIN_UTILITAS_URL, {
      action: 'saveHandoverKunci',
      kavling: selectedKavling,
      tglHandover: tgl,
      dari: dari,
      ke: ke
    });
    
    if (result.success) {
      showToast('success', 'Data handover berhasil disimpan!');
      await window.loadAdminUtilitasData(selectedKavling);
    } else {
      showToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error saving handover:', error);
    showToast('error', 'Error: ' + error.message);
  } finally {
    if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
  }
};

window.saveUtilitasDates = async function() {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  const listrikDate = document.getElementById('listrikInstallDate')?.value || '';
  const airDate = document.getElementById('airInstallDate')?.value || '';
  
  if (!listrikDate && !airDate) {
    showToast('warning', 'Tidak ada data yang diubah');
    return;
  }
  
  if (listrikDate && !validateDateInput(listrikDate)) {
    showToast('warning', 'Format tanggal listrik tidak valid! Gunakan dd/mm/yyyy');
    return;
  }
  
  if (airDate && !validateDateInput(airDate)) {
    showToast('warning', 'Format tanggal air tidak valid! Gunakan dd/mm/yyyy');
    return;
  }
  
  if (typeof showGlobalLoading === 'function') showGlobalLoading('Menyimpan data utilitas...');
  
  try {
    const result = await getDataFromServer(ADMIN_UTILITAS_URL, {
      action: 'saveHandoverKunci',
      kavling: selectedKavling,
      tglHandover: '',
      dari: '',
      ke: '',
      tglAir: airDate,
      tglListrik: listrikDate
    });

    if (result.success) {
      showToast('success', 'Data utilitas berhasil disimpan!');
      setTimeout(() => {
        window.loadAdminUtilitasData(selectedKavling);
      }, 500);
    } else {
      showToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
      
      // Fallback
      const result2 = await getDataFromServer(ADMIN_UTILITAS_URL, {
        action: 'saveUtilitasData',
        kavling: selectedKavling,
        listrikDate: listrikDate,
        airDate: airDate
      });

      if (result2.success) {
        showToast('success', 'Data utilitas berhasil disimpan (fallback)!');
        setTimeout(() => {
          window.loadAdminUtilitasData(selectedKavling);
        }, 500);
      }
    }
  } catch (error) {
    console.error('Error saving utilitas:', error);
    showToast('error', 'Error: ' + error.message);
  } finally {
    if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
  }
};

window.saveMutasi = async function(jenis) {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }

  const parentId = jenis === 'MASUK' ? '#tab-kunci-masuk' : '#tab-kunci-keluar';
  const parent = document.querySelector(parentId);
  if (!parent) return;

  const dari = parent.querySelector(jenis === 'MASUK' ? '.input-mutasi-masuk-dari' : '.input-mutasi-keluar-dari').value;
  const ke = parent.querySelector(jenis === 'MASUK' ? '.input-mutasi-masuk-ke' : '.input-mutasi-keluar-ke').value;
  const tgl = parent.querySelector(jenis === 'MASUK' ? '.input-mutasi-masuk-tgl' : '.input-mutasi-keluar-tgl').value;

  if (!dari || !ke || !tgl) {
    showToast('warning', 'Semua field (Dari, Ke, Tanggal) harus diisi!');
    return;
  }

  if (!validateDateInput(tgl)) {
    showToast('warning', 'Format tanggal tidak valid! Gunakan dd/mm/yyyy');
    return;
  }

  if (typeof showGlobalLoading === 'function') showGlobalLoading(`Menyimpan mutasi ${jenis}...`);

  try {
    const result = await getDataFromServer(ADMIN_UTILITAS_URL, {
      action: 'saveMutasiKunci',
      kavling: selectedKavling,
      jenis: jenis,
      dari: dari,
      ke: ke,
      tanggal: tgl
    });

    if (result.success) {
      showToast('success', `Mutasi ${jenis} berhasil disimpan!`);
      
      // Reset inputs
      parent.querySelector(jenis === 'MASUK' ? '.input-mutasi-masuk-dari' : '.input-mutasi-keluar-dari').value = '';
      parent.querySelector(jenis === 'MASUK' ? '.input-mutasi-masuk-ke' : '.input-mutasi-keluar-ke').value = '';
      parent.querySelector(jenis === 'MASUK' ? '.input-mutasi-masuk-tgl' : '.input-mutasi-keluar-tgl').value = '';

      await window.loadAdminUtilitasData(selectedKavling);
    } else {
      showToast('error', 'Gagal menyimpan: ' + result.message);
    }
  } catch (error) {
    showToast('error', 'Error: ' + error.message);
  } finally {
    if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
  }
};

// ========== SETUP FUNCTIONS ==========
window.setupUtilityTodayButtons = function() {
  const btnTodayListrik = document.querySelector('.btn-today-admin[data-target="#listrikInstallDate"]');
  if (btnTodayListrik) {
    // Clone to remove old listeners
    const newBtn = btnTodayListrik.cloneNode(true);
    btnTodayListrik.parentNode.replaceChild(newBtn, btnTodayListrik);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      document.getElementById('listrikInstallDate').value = `${day}/${month}/${year}`;
    });
  }

  const btnTodayAir = document.querySelector('.btn-today-admin[data-target="#airInstallDate"]');
  if (btnTodayAir) {
    const newBtn = btnTodayAir.cloneNode(true);
    btnTodayAir.parentNode.replaceChild(newBtn, btnTodayAir);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      document.getElementById('airInstallDate').value = `${day}/${month}/${year}`;
    });
  }
};

window.setupMutasiEventListeners = function() {
  const btnSaveMutasiMasuk = document.getElementById('btnSaveMutasiMasuk');
  if (btnSaveMutasiMasuk) {
    const newBtn = btnSaveMutasiMasuk.cloneNode(true);
    btnSaveMutasiMasuk.parentNode.replaceChild(newBtn, btnSaveMutasiMasuk);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.saveMutasi('MASUK');
    });
  }
  
  const btnSaveMutasiKeluar = document.getElementById('btnSaveMutasiKeluar');
  if (btnSaveMutasiKeluar) {
    const newBtn = btnSaveMutasiKeluar.cloneNode(true);
    btnSaveMutasiKeluar.parentNode.replaceChild(newBtn, btnSaveMutasiKeluar);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.saveMutasi('KELUAR');
    });
  }
  
  const btnSaveHO = document.querySelector('#tab-ho-user .btn-save-section');
  if (btnSaveHO) {
    const newBtn = btnSaveHO.cloneNode(true);
    btnSaveHO.parentNode.replaceChild(newBtn, btnSaveHO);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.saveHandoverKunci();
    });
  }

  const btnSaveUtility = document.getElementById('btnSaveUtility');
  if (btnSaveUtility) {
    const newBtn = btnSaveUtility.cloneNode(true);
    btnSaveUtility.parentNode.replaceChild(newBtn, btnSaveUtility);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.saveUtilitasDates();
    });
  }
};

// ========== EDIT KAVLING FUNCTIONS ==========
window.setupEditKavling = function() {
  const editBtns = document.querySelectorAll('.btn-edit-kavling');
  const modal = document.getElementById('editKavlingModal');
  const closeBtn = document.getElementById('closeEditKavling');
  const submitBtn = document.getElementById('submitEditKavling');

  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedKavling || !currentKavlingData) {
        showToast('warning', 'Pilih kavling terlebih dahulu di menu "Pilih Kavling"!');
        const selectId = getSelectIdByRole(currentRole);
        const selectEl = document.getElementById(selectId);
        if (selectEl) {
          selectEl.focus();
          selectEl.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)';
          setTimeout(() => selectEl.style.boxShadow = '', 2000);
        }
        return;
      }

      document.getElementById('editKavlingName').value = currentKavlingData.kavling;
      document.getElementById('editKavlingType').value = currentKavlingData.type || '';
      document.getElementById('editKavlingLT').value = currentKavlingData.lt || '';
      document.getElementById('editKavlingLB').value = currentKavlingData.lb || '';

      if (modal) modal.style.display = 'flex';
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
  }

  if (submitBtn && modal) {
    submitBtn.addEventListener('click', async () => {
      const name = document.getElementById('editKavlingName').value;
      const type = document.getElementById('editKavlingType').value;
      const lt = document.getElementById('editKavlingLT').value;
      const lb = document.getElementById('editKavlingLB').value;

      if (!name) {
        showToast('warning', 'Nama kavling harus diisi!');
        return;
      }

      showGlobalLoading('Mengupdate data kavling...');

      try {
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'editKavling',
          kavling: name,
          type: type || '',
          lt: lt || '',
          lb: lb || '',
          user: currentRole
        });

        if (result.success) {
          if (typeof showStatusModal === 'function') {
            showStatusModal('success', 'Berhasil Update', `Data kavling ${name} telah diperbarui.`);
          } else {
            showToast('success', 'Berhasil update data kavling');
          }
          modal.style.display = 'none';
          if (typeof clearInputsForNewLoad === 'function') clearInputsForNewLoad();
          if (typeof loadKavlingList === 'function') await loadKavlingList();
          if (typeof searchKavling === 'function') await searchKavling(true);
        } else {
          showToast('error', 'Gagal update: ' + (result.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating kavling:', error);
        showToast('error', 'Gagal update: ' + error.message);
      } finally {
        if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
      }
    });
  }

  // Setup Delete Button
  window.setupDeleteKavling();
};

window.setupDeleteKavling = function() {
  const deleteBtn = document.getElementById('btnDeleteKavling');
  if (deleteBtn) {
    // Remove old listeners
    const newBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
    
    newBtn.addEventListener('click', async () => {
      if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
      }

      if (!confirm(`Apakah Anda yakin ingin menghapus data kavling ${selectedKavling}? Tindakan ini tidak dapat dibatalkan.`)) {
        return;
      }

      showGlobalLoading(`Menghapus kavling ${selectedKavling}...`);

      try {
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'deleteKavling',
          kavling: selectedKavling,
          user: currentRole
        });

        if (result.success) {
          showToast('success', `Kavling ${selectedKavling} berhasil dihapus`);
          document.getElementById('editKavlingModal').style.display = 'none';
          
          if (typeof clearInputsForNewLoad === 'function') clearInputsForNewLoad();
          if (typeof loadKavlingList === 'function') await loadKavlingList();
        } else {
          showToast('error', 'Gagal menghapus: ' + result.message);
        }
      } catch (error) {
        console.error('Error deleting kavling:', error);
        showToast('error', 'Gagal menghapus: ' + error.message);
      } finally {
        if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
      }
    });
  }
};

// ========== ADD NEW KAVLING FUNCTIONS ==========
window.setupAddNewKavling = function() {
  const addBtn = document.querySelector('.add-kavling-btn');
  const modal = document.getElementById('addKavlingModal');
  const closeBtn = document.getElementById('closeAddKavling');
  const submitBtn = document.getElementById('submitAddKavling');
  
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Reset form
      const inputs = modal.querySelectorAll('input, select');
      inputs.forEach(input => input.value = '');
      if (modal) modal.style.display = 'flex';
    });
  }
  
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  if (submitBtn) {
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    
    newBtn.addEventListener('click', async () => {
      const name = document.getElementById('addKavlingName').value;
      const type = document.getElementById('addKavlingType').value;
      const lt = document.getElementById('addKavlingLT').value;
      const lb = document.getElementById('addKavlingLB').value;
      
      if (!name) {
        showToast('warning', 'Nama kavling harus diisi!');
        return;
      }
      
      showGlobalLoading('Menambahkan kavling baru...');
      
      try {
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'addKavling',
          kavling: name,
          type: type || '',
          lt: lt || '',
          lb: lb || '',
          user: currentRole
        });
        
        if (result.success) {
          if (typeof showStatusModal === 'function') {
            showStatusModal('success', 'Berhasil Menambahkan', `Kavling ${name} berhasil ditambahkan.`);
          } else {
            showToast('success', 'Berhasil menambahkan kavling');
          }
          if (modal) modal.style.display = 'none';
          
          if (typeof loadKavlingList === 'function') await loadKavlingList();
          
          // Select the new kavling
          if (typeof setSelectedKavlingInDropdowns === 'function') {
            setSelectedKavlingInDropdowns(name);
          }
          
          // Trigger search/load for the new kavling
          if (typeof searchKavling === 'function') {
            const searchInput = document.getElementById('searchKavlingManagerInput');
            if (searchInput) searchInput.value = name;
            await searchKavling(true);
          }
        } else {
          showToast('error', 'Gagal menambahkan: ' + (result.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error adding kavling:', error);
        showToast('error', 'Gagal menambahkan: ' + error.message);
      } finally {
        if (typeof hideGlobalLoading === 'function') hideGlobalLoading();
      }
    });
  }
};

// ========== USER4 TABS & EVENT LISTENERS ==========
window.setupUser4Tabs = function() {
  const page = document.getElementById('user4Page');
  if (!page) return;

  const tabButtons = page.querySelectorAll('.admin-tab-btn');
  
  tabButtons.forEach(btn => {
    if (btn.dataset.listenerAttached) return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Hide all content sections
      const contents = page.querySelectorAll('.tab-content-item');
      contents.forEach(c => c.classList.remove('active'));
      
      // Show target content
      const tabId = this.getAttribute('data-tab');
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // If switching to admin tabs, load admin data if needed
      if (tabId === 'ho-user' || tabId === 'kunci-masuk' || tabId === 'kunci-keluar' || tabId === 'utility-install') {
        if (typeof selectedKavling !== 'undefined' && selectedKavling) {
            // Check if we need to refresh data? 
            // Maybe better to just rely on initial load, but for consistency we can reload
            // window.loadAdminUtilitasData(selectedKavling);
        }
      }
    });
    
    btn.dataset.listenerAttached = 'true';
  });
};

window.setupEditListeners = function() {
  // Edit HO Button
  const btnEditHO = document.getElementById('btn-edit-ho');
  if (btnEditHO) {
    // Clone to remove old listeners and avoid duplicates
    const newBtn = btnEditHO.cloneNode(true);
    btnEditHO.parentNode.replaceChild(newBtn, btnEditHO);
    
    newBtn.addEventListener('click', function() {
      const targetHoTab = document.getElementById('tab-ho-user');
      const inputs = targetHoTab.querySelectorAll('input');
      const saveBtn = targetHoTab.querySelector('.btn-save-section');
      
      inputs.forEach(input => {
        input.disabled = false;
        input.style.opacity = '1';
      });
      if (saveBtn) saveBtn.style.display = 'block';
      this.parentElement.style.display = 'none';
    });
  }

  // Edit Utility Button
  const btnEditUtility = document.getElementById('btn-edit-utility');
  if (btnEditUtility) {
    const newBtn = btnEditUtility.cloneNode(true);
    btnEditUtility.parentNode.replaceChild(newBtn, btnEditUtility);

    newBtn.addEventListener('click', function() {
      const utilityTab = document.getElementById('tab-utility-install');
      const inputs = utilityTab.querySelectorAll('input');
      const saveBtn = document.getElementById('btnSaveUtility');
      const todayButtons = utilityTab.querySelectorAll('.btn-today-admin');
      
      inputs.forEach(input => {
        input.disabled = false;
        input.style.opacity = '1';
      });
      
      todayButtons.forEach(btn => {
        btn.style.display = 'block';
      });

      if (saveBtn) saveBtn.style.display = 'block';
      this.parentElement.style.display = 'none';
    });
  }
};

window.setupUser4EventListeners = function() {
  // Setup tabs
  window.setupUser4Tabs();
  
  // Setup today buttons for utilities
  window.setupUtilityTodayButtons();
  
  // Setup mutasi save buttons
  window.setupMutasiEventListeners();

  // Setup edit buttons
  if (typeof window.setupEditListeners === 'function') {
      window.setupEditListeners();
  }
  
  // Setup refresh button
  const refreshBtn = document.querySelector('.btn-refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      if (selectedKavling) {
        window.loadAdminUtilitasData(selectedKavling);
      } else {
        showToast('warning', 'Pilih kavling terlebih dahulu');
      }
    });
  }
};

window.setupUser4Page = function() {
  console.log('Setting up User4 page (Modular)...');
  
  try {
    // Setup tabs and event listeners
    if (typeof window.setupUser4EventListeners === 'function') {
      window.setupUser4EventListeners();
    } else {
        console.error('setupUser4EventListeners is not defined');
    }
    
    // Setup dropdown search listener
    const searchSelect = document.getElementById('searchKavlingUser4');
    if (searchSelect && !searchSelect.dataset.listenerAttached) {
      searchSelect.addEventListener('change', function() {
        if (this.value) {
          if (typeof searchKavling === 'function') searchKavling();
        }
      });
      searchSelect.dataset.listenerAttached = 'true';
    } else if (!searchSelect) {
        console.warn('searchKavlingUser4 dropdown not found in setupUser4Page');
    }

    console.log('User4 page setup complete (Modular)');
  } catch (error) {
      console.error('Error in setupUser4Page:', error);
      if (typeof showToast === 'function') showToast('error', 'Gagal inisialisasi halaman Admin Utilitas');
  }
};
