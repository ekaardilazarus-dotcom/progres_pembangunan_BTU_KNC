// kavling.js - Kavling Management (Search, CRUD)

// ========== KAVLING LIST MANAGEMENT ==========
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');
  
  try {
    const result = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_CRIPT_URL, {
      action: 'getKavlingList'
    });
    
    if (result.success && result.kavlings && result.kavlings.length > 0) {
      window.appGlobals.allKavlings = result.kavlings;
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);
      
      // Show success notification when data is loaded for Pelaksana/Manager roles
      if (window.appGlobals.currentRole && window.appGlobals.currentRole !== 'admin') {
        showStatusModal('success', 'Data Berhasil Dimuat', 'Data kavling terbaru telah berhasil dimuat dari server.');
      }
      
      if (window.appGlobals.selectedKavling) {
        setTimeout(() => {
          setSelectedKavlingInDropdowns(window.appGlobals.selectedKavling);
        }, 100);
      }
      
      return result.kavlings;
    } else {
      console.log('❌ No kavlings found:', result.message);
      showToast('warning', 'Tidak ada data kavling ditemukan');
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error loading kavling list:', error);
    showToast('error', 'Gagal memuat daftar kavling');
    return [];
  } finally {
    hideGlobalLoading();
  }
}

function updateAllKavlingSelects(kavlings) {
  const selectIds = [
    'searchKavlingUser1',
    'searchKavlingUser2', 
    'searchKavlingUser3',
    'searchKavlingUser4',
    'searchKavlingManager'
  ];
  
  selectIds.forEach(selectId => {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
      updateKavlingSelect(selectElement, kavlings);
    }
  });
}

function updateKavlingSelect(selectElement, kavlings) {
  const currentValue = selectElement.value;
  selectElement.innerHTML = '<option value="">-- Pilih Kavling --</option>';
  
  if (!kavlings || kavlings.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "Tidak ada kavling tersedia";
    option.disabled = true;
    selectElement.appendChild(option);
    return;
  }
  
  const sortedKavlings = [...kavlings].sort((a, b) => {
    const extractParts = (str) => {
      const match = str.match(/([A-Za-z]+)[_ ]*(\d+)/);
      if (match) {
        return { block: match[1].toUpperCase(), number: parseInt(match[2]) };
      }
      return { block: str, number: 0 };
    };
    
    const aParts = extractParts(a);
    const bParts = extractParts(b);
    
    if (aParts.block !== bParts.block) {
      return aParts.block.localeCompare(bParts.block);
    }
    return aParts.number - bParts.number;
  });
  
  sortedKavlings.forEach(kavling => {
    const option = document.createElement('option');
    option.value = kavling;
    option.textContent = kavling;
    selectElement.appendChild(option);
  });
  
  if (currentValue && kavlings.includes(currentValue)) {
    selectElement.value = currentValue;
  }
}

// ========== KAVLING SEARCH FUNCTIONS ==========
async function searchKavling(isSync = false) {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');
  
  try {
    const rolePage = window.appGlobals.currentRole + 'Page';
    const selectId = window.appGlobals.getSelectIdByRole(window.appGlobals.currentRole);
    const selectElement = document.getElementById(selectId);
    
    if (!selectElement) {
      showToast('error', 'Dropdown kavling tidak ditemukan!');
      return;
    }
    
    // Check custom input first for current role
    const inputId = selectId + 'Input';
    const inputEl = document.getElementById(inputId);
    let kavlingName = selectElement.value.trim();
    
    if (!kavlingName && inputEl) {
      kavlingName = inputEl.value.trim();
      if (kavlingName) {
        selectElement.value = kavlingName;
      }
    }
    
    if (!kavlingName && !isSync) {
      showToast('warning', 'Pilih kavling terlebih dahulu dari pencarian!');
      if (inputEl) inputEl.focus();
      else selectElement.focus();
      return;
    }

    if (isSync && !kavlingName) {
      showGlobalLoading('Mengambil data terbaru dari spreadsheet...');
      try {
        // Refresh dropdown lists and clear selections
        await loadKavlingList();
        hideGlobalLoading();
        showToast('success', 'Data berhasil diperbarui!');
        return;
      } catch (err) {
        hideGlobalLoading();
        showToast('error', 'Gagal memperbarui data!');
        return;
      }
    }

    // Clear all inputs/status before sync to give "refresh" feel
    clearInputsForNewLoad();
    
    showGlobalLoading('Menyinkronkan data ' + kavlingName + '...');

    const data = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingData',
      kavling: kavlingName
    });
    
    if (data.success) {
      window.appGlobals.selectedKavling = kavlingName;
      
      // Ambil data progres dari server
      let serverProgress = data.totalAH || '0%';
      
      // Konversi desimal ke persen jika perlu
      if (typeof serverProgress === 'number') {
        serverProgress = (serverProgress <= 1 ? Math.round(serverProgress * 100) : Math.round(serverProgress)) + '%';
      } else if (typeof serverProgress === 'string' && !serverProgress.includes('%')) {
        const num = parseFloat(serverProgress);
        if (!isNaN(num)) {
          serverProgress = (num <= 1 ? Math.round(num * 100) : Math.round(num)) + '%';
        }
      }

      // Simpan SEMUA data dari server
      window.appGlobals.currentKavlingData = {
        kavling: data.kavling || kavlingName,
        type: data.type || '-', 
        lt: data.lt || '-',
        lb: data.lb || '-',
        propertyNotes: data.propertyNotes || '',
        totalAH: serverProgress,
        data: data.data || {}
      };
     
      setSelectedKavlingInDropdowns(kavlingName);
      updateKavlingInfo(window.appGlobals.currentKavlingData, rolePage);
      
      // LANGSUNG UPDATE PROGRESS DARI SERVER
      updateTotalProgressDisplay(window.appGlobals.currentKavlingData.totalAH, rolePage);
      const overallPercent = document.querySelector(`#${rolePage} .total-percent`);
      const overallBar = document.querySelector(`#${rolePage} .total-bar`);
      if (overallPercent) overallPercent.textContent = window.appGlobals.currentKavlingData.totalAH;
      if (overallBar) overallBar.style.width = window.appGlobals.currentKavlingData.totalAH;
           
      if (window.appGlobals.currentRole !== 'manager') {
        loadProgressData(data.data);
      }
      
      if (window.appGlobals.currentRole === 'manager') {
        loadPropertyNotesFromData(window.appGlobals.currentKavlingData);
        updateManagerProgressDisplay(window.appGlobals.currentKavlingData.totalAH);
        
        const activeTab = document.querySelector('#managerPage .admin-tab-btn.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'reports') {
          setTimeout(() => {
            loadSummaryReport();
          }, 500);
        }
      }
      
      if (window.appGlobals.currentRole === 'user4') {
        loadUtilitasDataFromData(window.appGlobals.currentKavlingData);
        updateUtilitasProgressDisplay(window.appGlobals.currentKavlingData.totalAH);
        
        const propNotesInput = document.getElementById('utilityPropertyNotes');
        if (propNotesInput) {
          propNotesInput.value = window.appGlobals.currentKavlingData.propertyNotes || '';
        }
      }
     
      // Tampilkan sukses dan auto close setelah 1.5 detik
      showStatusModal('success', 'Data Dimuat', `Data ${kavlingName} berhasil dimuat!`);
     
      setTimeout(() => {
        hideGlobalLoading();
        showToast('success', `Data ${kavlingName} berhasil dimuat!`);
      }, 1500);
      
    } else {
      hideGlobalLoading();
      showToast('error', data.message || 'Kavling tidak ditemukan');
      selectElement.value = '';
    }
    
  } catch (error) {
    console.error('Error dalam searchKavling:', error);
    hideGlobalLoading();
    showToast('error', 'Gagal mengambil data: ' + error.message);
  }
}

function setSelectedKavlingInDropdowns(kavlingName) {
  const selectIds = [
    'searchKavlingUser1',
    'searchKavlingUser2', 
    'searchKavlingUser3',
    'searchKavlingUser4',
    'searchKavlingManager'
  ];
  
  selectIds.forEach(selectId => {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
      if (kavlingName === '') {
        selectElement.value = '';
      } else if (Array.from(selectElement.options).some(opt => opt.value === kavlingName)) {
        selectElement.value = kavlingName;
      }
      
      // Also update the custom search inputs if they exist
      const inputId = selectId + 'Input';
      const inputEl = document.getElementById(inputId);
      if (inputEl) inputEl.value = kavlingName || '';
    }
  });
}

// ========== CUSTOM SEARCH FUNCTIONS ==========
function setupCustomSearch(inputId, listId, selectId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const select = document.getElementById(selectId);

  if (!input || !list || !select) {
    console.error(`Custom search elements not found: ${inputId}, ${listId}, ${selectId}`);
    return;
  }

  // Pastikan input selalu aktif
  input.disabled = false;
  input.style.pointerEvents = 'auto';
  input.style.cursor = 'text';
  
  // Hapus event listener lama jika ada
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  
  // Setup event listeners baru
  newInput.addEventListener('focus', () => {
    console.log(`Input ${inputId} focused`);
    if (window.appGlobals.allKavlings.length > 0) {
      renderSearchList(window.appGlobals.allKavlings, list, newInput, select);
      list.style.display = 'block';
      list.style.zIndex = '1000';
    }
  });

  newInput.addEventListener('input', (e) => {
    console.log(`Input ${inputId} changed:`, e.target.value);
    const searchTerm = e.target.value.toLowerCase();
    const filtered = window.appGlobals.allKavlings.filter(k => k.toLowerCase().includes(searchTerm));
    renderSearchList(filtered, list, newInput, select);
    list.style.display = 'block';
  });

  newInput.addEventListener('click', (e) => {
    console.log(`Input ${inputId} clicked`);
    e.stopPropagation();
    if (window.appGlobals.allKavlings.length > 0 && list.style.display === 'none') {
      renderSearchList(window.appGlobals.allKavlings, list, newInput, select);
      list.style.display = 'block';
    }
  });

  // Tutup dropdown ketika klik di luar
  document.addEventListener('click', (e) => {
    if (!newInput.contains(e.target) && !list.contains(e.target)) {
      list.style.display = 'none';
    }
  });

  // Prevent closing when clicking inside dropdown
  list.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  console.log(`Custom search setup complete for ${inputId}`);
}

function renderSearchList(items, listEl, inputEl, selectEl) {
  listEl.innerHTML = '';
  
  if (items.length === 0) {
    const noResult = document.createElement('div');
    noResult.className = 'custom-dropdown-item no-results';
    noResult.textContent = 'Tidak ada kavling ditemukan';
    listEl.appendChild(noResult);
    return;
  }

  // Limit to first 100 items for performance
  const displayItems = items.slice(0, 100);

  displayItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'custom-dropdown-item';
    div.textContent = item;
    div.onclick = async function() {
      console.log('Selected item via onclick:', item);
      
      // Tampilkan loading popup
      showStatusModal('loading', 'Mohon Tunggu', `Sedang mengambil data kavling ${item}...`);
      
      inputEl.value = item;
      selectEl.value = item;
      listEl.style.display = 'none';
      
      // Ensure the value is synced and trigger search
      window.appGlobals.selectedKavling = item;
      
      // Clear all inputs and progress displays before loading new data
      clearInputsForNewLoad();
      
      // Force change event for any listeners
      const event = new Event('change', { bubbles: true });
      selectEl.dispatchEvent(event);
      
      // Tunggu 300ms untuk efek visual
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        const data = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_SCRIPT_URL, {
          action: 'getKavlingData',
          kavling: item
        });
        
        if (data.success) {
          window.appGlobals.currentKavlingData = {
            kavling: data.kavling || item,
            type: data.type || '-', 
            lt: data.lt || '-',
            lb: data.lb || '-',
            propertyNotes: data.propertyNotes || '',
            totalAH: data.totalAH || '0%',
            data: data.data || {}
          };
          
          updateKavlingInfo(window.appGlobals.currentKavlingData, window.appGlobals.currentRole + 'Page');
          loadProgressData(data.data);
          
          // Tampilkan sukses dan auto close
          showStatusModal('success', 'Data Dimuat', `Data ${item} berhasil dimuat!`);
          
          setTimeout(() => {
            hideGlobalLoading();
            showToast('success', `Data ${item} berhasil dimuat!`);
          }, 1500);
          
        } else {
          hideGlobalLoading();
          showToast('error', data.message || 'Kavling tidak ditemukan');
        }
      } catch (error) {
        hideGlobalLoading();
        showToast('error', 'Gagal mengambil data: ' + error.message);
      }
    };
    listEl.appendChild(div);
  });
  
  if (items.length > 100) {
    const more = document.createElement('div');
    more.className = 'custom-dropdown-item no-results';
    more.textContent = `...dan ${items.length - 100} lainnya (ketik untuk mencari)`;
    listEl.appendChild(more);
  }
}

// ========== KAVLING CRUD FUNCTIONS ==========
async function submitNewKavling() {
  console.log('submitNewKavling called');
  const nameInput = document.getElementById('newKavlingName');
  const ltInput = document.getElementById('newKavlingLT');
  const lbInput = document.getElementById('newKavlingLB');
  const typeInput = document.getElementById('newKavlingType');
  const submitBtn = document.getElementById('submitNewKavling');
  
  if (!nameInput) { 
    console.error('Missing name input');
    showToast('error', 'Elemen form tidak ditemukan!');
    return;
  }
  
  const name = nameInput.value.trim();
  const lt = ltInput ? ltInput.value.trim() : '';
  const lb = lbInput ? lbInput.value.trim() : ''; 
  const type = typeInput ? typeInput.value.trim() : '';
  
  console.log('Kavling data:', { name, lt, lb, type });

  if (!name) { 
    showToast('error', 'Nama kavling harus diisi');
    nameInput.focus();
    return;
  }
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    submitBtn.disabled = true;
  }
  
  try {
    const result = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_SCRIPT_URL, {
      action: 'addNewKavling',
      name: name, 
      lt: lt || '',
      lb: lb || '',
      type: type || '',
      createdBy: window.appGlobals.currentRole || 'admin'
    });
    
    console.log('Server result:', result);

    if (result.success) {
      showToast('success', result.message || 'Kavling berhasil ditambahkan');
      
      // Clear all inputs and progress displays to start fresh
      clearInputsForNewLoad();
      
      // Reset form fields in the modal
      if (nameInput) nameInput.value = '';
      if (ltInput) ltInput.value = '';
      if (lbInput) lbInput.value = '';
      if (typeInput) typeInput.value = '';
      
      // Tutup modal
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'none';
      
      // Refresh daftar kavling dari server
      await loadKavlingList();
      
      // Optional: Auto-select the newly created kavling
      if (name) {
        window.appGlobals.selectedKavling = name;
        setSelectedKavlingInDropdowns(name);
        // Trigger a sync for the new kavling (which should have 0% progress)
        await searchKavling(true);
      }
      
    } else {
      showToast('error', result.message || 'Gagal menambahkan kavling');
    }
  } catch (error) {
    console.error('Error adding kavling:', error);
    showToast('error', 'Gagal menambahkan kavling: ' + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Kavling Baru';
      submitBtn.disabled = false;
    }
  }
}

function setupAddKavlingModal() {
  const addBtns = document.querySelectorAll('.btn-add-kavling');
  const modal = document.getElementById('addKavlingModal');
  const closeBtn = document.getElementById('closeAddKavling');
  const submitBtn = document.getElementById('submitNewKavling');

  addBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'flex';
    });
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitNewKavling();
    });
  }
}

function setupEditKavlingModal() {
  const editBtns = document.querySelectorAll('.btn-edit-kavling');
  const modal = document.getElementById('editKavlingModal');
  const closeBtn = document.getElementById('closeEditKavling');
  const submitBtn = document.getElementById('submitEditKavling');

  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!window.appGlobals.selectedKavling || !window.appGlobals.currentKavlingData) {
        showToast('warning', 'Pilih kavling terlebih dahulu di menu "Pilih Kavling"!');
        const selectId = window.appGlobals.getSelectIdByRole(window.appGlobals.currentRole);
        const selectEl = document.getElementById(selectId);
        if (selectEl) {
          selectEl.focus();
          selectEl.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)';
          setTimeout(() => selectEl.style.boxShadow = '', 2000);
        }
        return;
      }

      // Fill modal with current data
      document.getElementById('editKavlingName').value = window.appGlobals.currentKavlingData.kavling;
      document.getElementById('editKavlingType').value = window.appGlobals.currentKavlingData.type || '';
      document.getElementById('editKavlingLT').value = window.appGlobals.currentKavlingData.lt || '';
      document.getElementById('editKavlingLB').value = window.appGlobals.currentKavlingData.lb || '';

      if (modal) modal.style.display = 'flex';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }

  if (submitBtn) {
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
        const result = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_SCRIPT_URL, {
          action: 'editKavling',
          kavling: name,
          type: type || '',
          lt: lt || '',
          lb: lb || '',
          user: window.appGlobals.currentRole
        });

        if (result.success) {
          showStatusModal('success', 'Berhasil Update', `Data kavling ${name} telah diperbarui.`);
          if (modal) modal.style.display = 'none';
          
          // Clear all inputs before re-sync
          clearInputsForNewLoad();
          
          // Refresh list of kavlings first
          await loadKavlingList();
          
          // Re-sync specific kavling data
          await searchKavling(true);
        } else {
          showToast('error', 'Gagal update: ' + (result.message || 'Unknown error'));
        }
      } catch (error) {
        showToast('error', 'Error: ' + error.message);
      } finally {
        hideGlobalLoading();
      }
    });
  }

  const deleteBtn = document.getElementById('deleteKavlingData');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const name = document.getElementById('editKavlingName').value;
      
      if (!confirm(`Apakah Anda yakin ingin menghapus data kavling ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
        return;
      }

      showGlobalLoading('Menghapus data kavling...');

      try {
        const result = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_SCRIPT_URL, {
          action: 'deleteKavling',
          kavling: name,
          user: window.appGlobals.currentRole
        });

        if (result.success) {
          showStatusModal('delete-success', 'Berhasil Hapus', `Data kavling ${name} telah dihapus.`);
          if (modal) modal.style.display = 'none';
          
          // Reset internal selection state
          window.appGlobals.selectedKavling = null;
          window.appGlobals.currentKavlingData = null;
          
          // Reset UI inputs and progress displays
          clearInputsForNewLoad();
          
          // Refresh kavling list from database
          await loadKavlingList();
          
          // Reset display info to neutral
          const rolePage = window.appGlobals.currentRole + 'Page';
          updateKavlingInfo({kavling: '-', type: '-', lt: '-', lb: '-'}, rolePage);
        } else {
          showToast('error', 'Gagal menghapus: ' + (result.message || 'Unknown error'));
        }
      } catch (error) {
        showToast('error', 'Error: ' + error.message);
      } finally {
        hideGlobalLoading();
      }
    });
  }
}

function setupDeleteKavling() {
  const btnDelete = document.getElementById('btnDeleteKavling');
  if (btnDelete) {
    btnDelete.addEventListener('click', async function() {
      if (!window.appGlobals.selectedKavling) {
        showToast('warning', 'Pilih kavling yang akan dihapus terlebih dahulu!');
        return;
      }
      
      const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus kavling ${window.appGlobals.selectedKavling}? Tindakan ini tidak dapat dibatalkan.`);
      
      if (confirmDelete) {
        showGlobalLoading(`Menghapus kavling ${window.appGlobals.selectedKavling}...`);
        
        try {
          const result = await window.appGlobals.getDataFromServer(window.appGlobals.PROGRESS_APPS_SCRIPT_URL, {
            action: 'deleteKavling',
            kavling: window.appGlobals.selectedKavling
          });
          
          if (result.success) {
            showToast('success', `Kavling ${window.appGlobals.selectedKavling} berhasil dihapus.`);
            window.appGlobals.selectedKavling = null;
            window.appGlobals.currentKavlingData = null;
            // Reload list
            await loadKavlingList();
            // Reset display
            const infoId = window.appGlobals.getKavlingInfoIdByRole(window.appGlobals.currentRole);
            const infoDisplay = document.getElementById(infoId);
            if (infoDisplay) {
              infoDisplay.innerHTML = `
                <div class="info-item">
                  <span class="info-label">Blok/Kavling:</span>
                  <span class="info-value val-name">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type:</span>
                  <span class="info-value val-type">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Luas Tanah (LT):</span>
                  <span class="info-value val-lt">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Luas Bangunan (LB):</span>
                  <span class="info-value val-lb">-</span>
                </div>
              `;
            }
          } else {
            showToast('error', 'Gagal menghapus: ' + result.message);
          }
        } catch (error) {
          showToast('error', 'Error: ' + error.message);
        } finally {
          hideGlobalLoading();
        }
      }
    });
  }
}

// ========== KAVLING INFO DISPLAY ==========
function updateKavlingInfo(data, pageId) {
  const role = window.appGlobals.currentRole;
  const infoId = window.appGlobals.getKavlingInfoIdByRole(role);
  const infoDisplay = document.getElementById(infoId);
  
  if (!infoDisplay) return;
  
  if (role === 'manager') {
    infoDisplay.innerHTML = `
      <div class="info-item">
        <span class="info-label">Blok/Kavling:</span>
        <span class="info-value val-name">${data.kavling || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type:</span>
        <span class="info-value val-type">${data.type || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Luas Tanah (LT):</span>
        <span class="info-value val-lt">${data.lt || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Luas Bangunan (LB):</span>
        <span class="info-value val-lb">${data.lb || '-'}</span>
      </div>
    `;

    // Update progress display untuk manager
    if (data.data?.tahap4?.TOTAL) {
      updateManagerProgressDisplay(data.data.tahap4.TOTAL);
    }
  } else {
    infoDisplay.innerHTML = `
      <div class="info-item">
        <span class="info-label">Blok/Kavling:</span>
        <span class="info-value val-name">${data.kavling || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type:</span>
        <span class="info-value val-type">${data.type || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">LT:</span>
        <span class="info-value val-lt">${data.lt || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">LB:</span>
        <span class="info-value val-lb">${data.lb || '-'}</span>
      </div>
    `;
  }
}

// ========== CLEAR INPUTS ==========
function clearInputsForNewLoad() {
  console.log('Clearing all inputs and progress displays...');
  
  // 1. Reset Checkboxes and Labels
  const checkboxes = document.querySelectorAll('.sub-task[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = false;
    const label = cb.closest('.task-item');
    if (label) label.classList.remove('task-completed');
  });

  // 2. Reset Text, Hidden, and Date Inputs
  const textInputs = document.querySelectorAll('.sub-task-text, .tahap-comments, .key-delivery-input, .key-delivery-date, input[type="hidden"].sub-task, .search-input-custom');
  textInputs.forEach(input => {
    if (!input.classList.contains('search-input-custom')) {
      input.value = '';
    }
  });

  // 3. Reset Dual-State Buttons
  const stateButtons = document.querySelectorAll('.state-btn');
  stateButtons.forEach(btn => {
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
  });

  // 4. Reset ALL Progress Bars and Percentage Texts
  const progressFills = document.querySelectorAll('.progress-fill');
  progressFills.forEach(fill => {
    fill.style.width = '0%';
  });

  const percentTexts = document.querySelectorAll('.total-percent, .sub-percent, .sub-percent-tahap');
  percentTexts.forEach(text => {
    text.textContent = '0%';
  });

  // 5. Reset Info Display values
  const valDisplays = document.querySelectorAll('.info-value');
  valDisplays.forEach(display => {
    if (!display.classList.contains('val-name')) {
      display.textContent = '-';
    }
  });
}

// Export functions
window.kavling = {
  loadKavlingList,
  searchKavling,
  setSelectedKavlingInDropdowns,
  setupCustomSearch,
  submitNewKavling,
  setupAddKavlingModal,
  setupEditKavlingModal,
  setupDeleteKavling,
  updateKavlingInfo,
  clearInputsForNewLoad
};
