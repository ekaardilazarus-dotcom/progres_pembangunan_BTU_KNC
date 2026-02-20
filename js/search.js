// Search and Kavling Selection Functions

// Global variable for all kavlings (initialized empty, populated later)
window.allKavlings = [];
window.allKavlingDetails = []; // Store details including source

/**
 * Setup custom search functionality for a specific set of input, list, and select elements
 */
window.setupCustomSearch = function(inputId, listId, selectId) {
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
    if (window.allKavlings.length > 0) {
      renderSearchList(window.allKavlings, list, newInput, select);
      list.style.display = 'block';
      list.style.zIndex = '1000';
    }
  });

  newInput.addEventListener('input', (e) => {
    console.log(`Input ${inputId} changed:`, e.target.value);
    const searchTerm = e.target.value.toLowerCase();
    const filtered = window.allKavlings.filter(k => k.toLowerCase().includes(searchTerm));
    renderSearchList(filtered, list, newInput, select);
    list.style.display = 'block';
  });

  newInput.addEventListener('click', (e) => {
    console.log(`Input ${inputId} clicked`);
    e.stopPropagation();
    if (window.allKavlings.length > 0 && list.style.display === 'none') {
      renderSearchList(window.allKavlings, list, newInput, select);
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
};

/**
 * Render the search list dropdown
 */
window.renderSearchList = function(items, listEl, inputEl, selectEl) {
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
      selectedKavling = item;

      // Clear all inputs and progress displays before loading new data
      if (typeof clearInputsForNewLoad === 'function') {
        clearInputsForNewLoad();
      }

      // Force change event for any listeners
      const event = new Event('change', { bubbles: true });
      selectEl.dispatchEvent(event);

      // Tunggu 300ms untuk efek visual
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'getKavlingData',
          kavling: item
        });

        if (data.success) {
          currentKavlingData = {
            kavling: data.kavling || item,
            type: data.type || '-', 
            lt: data.lt || '-',
            lb: data.lb || '-',
            propertyNotes: data.propertyNotes || '',
            totalAH: data.totalAH || '0%',
            data: data.data || {}
          };

          updateKavlingInfo(currentKavlingData, currentRole + 'Page');
          
          if (typeof loadProgressData === 'function') {
            loadProgressData(data.data);
          }
          
          // Fix: Ensure notes are updated for manager (progress handled by updateSupervisorStagesUI)
          if (currentRole === 'manager') {
            if (typeof loadPropertyNotesFromData === 'function') {
              loadPropertyNotesFromData(currentKavlingData);
            }
            if (typeof loadRevisionPhotos === 'function') {
              loadRevisionPhotos(selectedKavling);
            }
            // Update supervisor stages UI with calculated progress
            const totalPercent = parseInt(currentKavlingData.totalAH) || 0;
            if (typeof updateSupervisorStagesUI === 'function') {
              updateSupervisorStagesUI(totalPercent, data.data);
            }
            setTimeout(() => {
                if (typeof loadSupervisorHandoverData === 'function') {
                  loadSupervisorHandoverData(selectedKavling);
                }
                if (typeof initSupervisorMutationButton === 'function') {
                  initSupervisorMutationButton(); // Ensure button is ready when data is loaded
                }
            }, 500);
          } else if (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3') {
            if (typeof loadRevisionPhotosForPelaksana === 'function') {
              loadRevisionPhotosForPelaksana(selectedKavling, currentRole);
            }
          }

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
};

/**
 * Update all kavling select dropdowns
 */
window.updateAllKavlingSelects = function(kavlings) {
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
};

/**
 * Update a single kavling select dropdown
 */
window.updateKavlingSelect = function(selectElement, kavlings) {
  const currentValue = selectElement.value;
  selectElement.innerHTML = '<option value="">-- Pilih Kavling --</option>';

  let filteredKavlings = kavlings;

  // Filter by Project if set
  if (window.currentProject && kavlings && kavlings.length > 0) {
      const projectKey = window.currentProject.toUpperCase(); // KNC or BTU
      
      // Use details if available, otherwise fallback to name check
      if (window.allKavlingDetails && window.allKavlingDetails.length > 0) {
        const matchingNames = window.allKavlingDetails
          .filter(item => {
            const source = (item.source || '').toUpperCase();
            return source.includes(projectKey);
          })
          .map(item => item.name);
          
        if (matchingNames.length > 0) {
          filteredKavlings = matchingNames;
          console.log(`Filtered kavlings for project ${projectKey} via Source (Col AS): ${matchingNames.length}`);
        } else {
           console.log(`No kavlings matched project ${projectKey} via Source, checking names...`);
           // Fallback to name check if source check returns empty (maybe data missing)
           const matches = kavlings.filter(k => k.toUpperCase().includes(projectKey));
           if (matches.length > 0) filteredKavlings = matches;
        }
      } else {
        // Fallback if details not loaded
        const matches = kavlings.filter(k => k.toUpperCase().includes(projectKey));
        if (matches.length > 0) {
            filteredKavlings = matches;
            console.log(`Filtered kavlings for project ${projectKey} via Name: ${matches.length}`);
        }
      }
  }

  if (!filteredKavlings || filteredKavlings.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "Tidak ada kavling tersedia";
    option.disabled = true;
    selectElement.appendChild(option);
    return;
  }

  const sortedKavlings = [...filteredKavlings].sort((a, b) => {
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
};

/**
 * Set selected kavling in all dropdowns
 */
window.setSelectedKavlingInDropdowns = function(kavlingName) {
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
};

/**
 * Main search function
 */
window.searchKavling = async function(isSync = false) {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');

  try {
    const rolePage = currentRole + 'Page';
    const selectId = getSelectIdByRole(currentRole);
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
        if (typeof initializeApp === 'function') {
          await initializeApp(); 
        }
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
    if (typeof clearInputsForNewLoad === 'function') {
      clearInputsForNewLoad();
    }

    showGlobalLoading('Menyinkronkan data ' + kavlingName + '...');


    const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingData',
      kavling: kavlingName
    });

     console.log('📦 Full response from server:', data);

    if (data.success) {
       // Periksa data sebelum memuat
       console.log('Data dari server:', {
            sistemPembuangan: data.data?.tahap1?.['SISTEM PEMBUANGAN'],
            corMejaDapur: data.data?.tahap1?.['COR MEJA DAPUR'],
            keramikDinding: data.data?.tahap2?.['KERAMIK DINDING TOILET & DAPUR']
        });
      selectedKavling = kavlingName;
      if (typeof updateTabsState === 'function') {
        updateTabsState(); // Enable tabs when kavling is loaded
      }

      // Ambil data progres dari server
      let serverProgress = data.totalAH || '0%';

      // Konversi desimal (misal 0.14) ke persen (14%) jika perlu
      if (typeof serverProgress === 'number') {
        serverProgress = (serverProgress <= 1 ? Math.round(serverProgress * 100) : Math.round(serverProgress)) + '%';
      } else if (typeof serverProgress === 'string' && !serverProgress.includes('%')) {
        const num = parseFloat(serverProgress);
        if (!isNaN(num)) {
          serverProgress = (num <= 1 ? Math.round(num * 100) : Math.round(num)) + '%';
        }
      }

      // ✅ Simpan SEMUA data dari server dengan struktur yang benar
      currentKavlingData = {
        kavling: data.kavling || kavlingName,
        type: data.type || '-', 
        lt: data.lt || '-',
        lb: data.lb || '-',
        propertyNotes: data.propertyNotes || '',
        totalAH: serverProgress, // Gunakan nilai yang sudah diformat
        data: data.data || {}
      };

      setSelectedKavlingInDropdowns(kavlingName);
      updateKavlingInfo(currentKavlingData, rolePage);

      // LANGSUNG UPDATE PROGRESS DARI SERVER AGAR TIDAK MUNCUL 0%
      if (typeof updateTotalProgressDisplay === 'function') {
        updateTotalProgressDisplay(currentKavlingData.totalAH, rolePage);
      }
      
      const overallPercent = document.querySelector(`#${rolePage} .total-percent`);
      const overallBar = document.querySelector(`#${rolePage} .total-bar`);
      if (overallPercent) overallPercent.textContent = currentKavlingData.totalAH;
      if (overallBar) overallBar.style.width = currentKavlingData.totalAH;

      if (currentRole !== 'manager') {
        if (typeof loadProgressData === 'function') {
          loadProgressData(data.data);
        }
      }

      if (currentRole === 'manager') {
        if (typeof loadPropertyNotesFromData === 'function') {
          loadPropertyNotesFromData(currentKavlingData);
        }

        // Update progress display untuk manager menggunakan data AH
        if (typeof updateManagerProgressDisplay === 'function') {
          updateManagerProgressDisplay(currentKavlingData.totalAH);
        }

        // Update Supervisor Stages UI dengan progress data dari kavling
        const totalPercent = parseInt(currentKavlingData.totalAH) || 0;
        if (typeof updateSupervisorStagesUI === 'function') {
          updateSupervisorStagesUI(totalPercent, data.data);
        }

        // Load dan tampilkan data Hand Over Kunci ke User
        if (typeof loadSupervisorHandoverData === 'function') {
          loadSupervisorHandoverData(kavlingName);
        }

        // Auto load Riwayat Mutasi Kunci 3 detik setelah kavling dipilih
        setTimeout(async () => {
          if (selectedKavling === kavlingName) {
            console.log('⏰ Auto loading mutation history for:', kavlingName);
            // Non-blocking auto load attempt
            if (typeof loadMutationHistoryForSupervisor === 'function') {
              loadMutationHistoryForSupervisor(kavlingName).catch(err => console.error('Auto-load failed:', err));
            }
          }
        }, 3000);

        // Jika di tab reports, load laporan
        const activeTab = document.querySelector('#managerPage .admin-tab-btn.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'reports') {
          setTimeout(() => {
            if (typeof loadSummaryReport === 'function') {
              loadSummaryReport();
            }
          }, 500);
        }
      }

      if (currentRole === 'user4') {
        // Load data untuk Admin Utilitas
        if (typeof loadUtilitasDataFromData === 'function') {
          loadUtilitasDataFromData(currentKavlingData);
        }
        if (typeof updateUtilitasProgressDisplay === 'function') {
          updateUtilitasProgressDisplay(currentKavlingData.totalAH);
        }

        // Load additional data from Admin Utilitas Apps Script
        if (typeof loadAdminUtilitasData === 'function') {
            loadAdminUtilitasData(kavlingName);
        }
      }

     // ⚡ Aktifkan semua input setelah data dimuat
            setTimeout(() => {
        if (typeof enableAllInputs === 'function') {
          enableAllInputs();
        }

        // Tambahkan event listener untuk checkbox
        if (typeof setupCheckboxListeners === 'function') {
          setupCheckboxListeners(rolePage);
        }

        // Update tabs state
        if (typeof updateTabsState === 'function') {
          updateTabsState();
        }
      }, 100);

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
};

/**
 * Load list of kavlings from server
 */
window.loadKavlingList = async function() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });

    if (result.success && result.kavlings && result.kavlings.length > 0) {
      window.allKavlings = result.kavlings; // Store globally
      window.allKavlingDetails = result.kavlingDetails || []; // Store details
      
      // Update dropdowns using details for better filtering
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);

      // Show success notification when data is loaded for Pelaksana/Manager roles
      if (currentRole && currentRole !== 'admin') {
        showStatusModal('success', 'Data Berhasil Dimuat', 'Data kavling terbaru telah berhasil dimuat dari server.');
      }

      if (selectedKavling) {
        setTimeout(() => {
          setSelectedKavlingInDropdowns(selectedKavling);
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
};

/**
 * Load list of kavlings with loading modal
 */
window.loadKavlingListWithLoading = async function() {
  console.log('Loading kavling list with loading modal...');

  try {
    if (typeof showGlobalLoading === 'function') {
      showGlobalLoading('Memuat daftar kavling...');
    } else {
      console.warn('showGlobalLoading function is not available');
    }

    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });

    if (result.success && result.kavlings && result.kavlings.length > 0) {
      window.allKavlings = result.kavlings; // Store globally
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);

      // Tampilkan sukses dan auto close
      showStatusModal('success', 'Daftar Dimuat', `${result.kavlings.length} kavling berhasil dimuat!`);

      setTimeout(() => {
        hideGlobalLoading();
      }, 1500);

      return result.kavlings;
    } else {
      hideGlobalLoading();
      console.log('❌ No kavlings found:', result.message);
      showToast('warning', 'Tidak ada data kavling ditemukan');
      return [];
    }

  } catch (error) {
    if (typeof hideGlobalLoading === 'function') {
      hideGlobalLoading();
    }
    console.error('❌ Error loading kavling list:', error);
    showToast('error', 'Gagal memuat daftar kavling');
    return [];
  }
};

/**
 * Sync data with server
 */
window.syncData = async function() {
  const rolePage = currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);

  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }

  try {
    showGlobalLoading('Sinkronisasi data...');
    await loadKavlingListWithLoading();

    // Clear selections and reset UI
    selectedKavling = null;
    currentKavlingData = null;

    // Clear all selections including custom search inputs
    setSelectedKavlingInDropdowns('');

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
    if (currentRole === 'manager') {
      const progressDisplay = document.getElementById('managerProgressDisplay');
      if (progressDisplay) progressDisplay.style.display = 'none';
      const notesEl = document.getElementById('propertyNotesManager');
      if (notesEl) {
        notesEl.value = '';
      }
    }

    showToast('success', 'Sinkronisasi berhasil!');
  } catch (error) {
    console.error('Error syncing data:', error);
    showToast('error', 'Gagal melakukan sinkronisasi');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
    }
    hideGlobalLoading();
  }
};
