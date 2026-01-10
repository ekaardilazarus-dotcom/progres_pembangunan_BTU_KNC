// script.js - UPDATE DENGAN DROPDOWN MOBILE-FRIENDLY
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfsrL9o9PnRsXYZFOb3yxSyUZZ33ZX3o1sR7dztJPNdmTZT1XXx767ZIenfWbhKfLDBA/exec';

let currentRole = null;

// Default display names (jika kolom B kosong)
const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2', 
  'user3': 'Pelaksana 3',
  'user4': 'Pelaksana 4',
  'manager': 'MANAGEMENT',
  'admin': 'Admin'
};

// ========== UTILITY FUNCTIONS ==========
function showGlobalLoading(text = 'Mohon Tunggu...') {
  const modal = document.getElementById('loadingModal');
  const textEl = document.getElementById('loadingText');
  if (modal && textEl) {
    textEl.textContent = text;
    modal.style.display = 'flex';
  }
}

function hideGlobalLoading() {
  const modal = document.getElementById('loadingModal');
  if (modal) modal.style.display = 'none';
}

// ========== FUNGSI UNTUK SELECT DROPDOWN ==========

let selectedKavling = null;
let currentKavlingData = null;

// Fungsi untuk memuat list kavling ke semua select dropdown
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');
  
  try {
    const kavlings = await getKavlingListFromServer();
    
    if (kavlings && kavlings.length > 0) {
      // Update semua select dropdown
      updateAllKavlingSelects(kavlings);
      
      console.log(`✅ Loaded ${kavlings.length} kavlings`);
      
      // Jika ada kavling yang dipilih sebelumnya, set ulang
      if (selectedKavling && kavlings.includes(selectedKavling)) {
        setTimeout(() => {
          setSelectedKavlingInDropdowns(selectedKavling);
        }, 100);
      }
      
      showProgressMessage('success', `Daftar kavling diperbarui (${kavlings.length} data)`);
    } else {
      console.log('❌ No kavlings found');
      showProgressMessage('info', 'Tidak ada data kavling ditemukan');
    }
    
  } catch (error) {
    console.error('❌ Error loading kavling list:', error);
    showProgressMessage('error', 'Gagal memuat daftar kavling');
  } finally {
    hideGlobalLoading();
  }
}

// Fungsi untuk mengambil list kavling dari server
function getKavlingListFromServer() {
  return new Promise((resolve) => {
    const callbackName = 'kavlingListCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      console.log('Kavling list response:', data);
      
      if (data.success && data.kavlings) {
        resolve(data.kavlings);
      } else {
        console.error('Failed to get kavling list:', data.message);
        resolve([]);
      }
      
      delete window[callbackName];
      const script = document.getElementById('kavlingListScript');
      if (script) script.remove();
    };
    
    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=getKavlingList&callback=' + callbackName;
    
    console.log('Fetching kavling list from:', url);
    
    const script = document.createElement('script');
    script.id = 'kavlingListScript';
    script.src = url;
    
    document.body.appendChild(script);
  });
}

// Update semua select dropdown di semua halaman
function updateAllKavlingSelects(kavlings) {
  const selectIds = [
    'searchKavling1',
    'searchKavling2', 
    'searchKavling3',
    'searchKavling4',
    'searchKavlingManager'
  ];
  
  selectIds.forEach(selectId => {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
      updateKavlingSelectWithGrouping(selectElement, kavlings);
    }
  });
}

// Update select dropdown dengan grouping berdasarkan blok
function updateKavlingSelectWithGrouping(selectElement, kavlings) {
  // Simpan nilai yang sedang dipilih
  const currentValue = selectElement.value;
  
  // Clear existing options kecuali placeholder
  selectElement.innerHTML = '<option value="">-- Pilih Kavling --</option>';
  
  if (!kavlings || kavlings.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "Tidak ada kavling tersedia";
    option.disabled = true;
    selectElement.appendChild(option);
    return;
  }
  
  // Group kavlings by block (e.g., "M1_11" -> "M1")
  const grouped = {};
  
  kavlings.forEach(kavling => {
    const match = kavling.match(/^([A-Z]+\d*)/);
    const block = match ? match[0] : 'Lainnya';
    
    if (!grouped[block]) {
      grouped[block] = [];
    }
    grouped[block].push(kavling);
  });
  
  // Sort blocks alphabetically
  const sortedBlocks = Object.keys(grouped).sort((a, b) => {
    // Sort by letter then number
    const aMatch = a.match(/([A-Z]+)(\d*)/);
    const bMatch = b.match(/([A-Z]+)(\d*)/);
    
    if (aMatch[1] !== bMatch[1]) {
      return aMatch[1].localeCompare(bMatch[1]);
    }
    const aNum = parseInt(aMatch[2] || 0);
    const bNum = parseInt(bMatch[2] || 0);
    return aNum - bNum;
  });
  
  // Add options with optgroups
  sortedBlocks.forEach(block => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `Blok ${block}`;
    optgroup.className = 'optgroup-label';
    
    // Sort kavlings within block numerically
    grouped[block].sort((a, b) => {
      const numA = parseInt(a.match(/_(\d+)/)?.[1] || a.match(/(\d+)/)?.[0] || 0);
      const numB = parseInt(b.match(/_(\d+)/)?.[1] || b.match(/(\d+)/)?.[0] || 0);
      return numA - numB;
    });
    
    grouped[block].forEach(kavling => {
      const option = document.createElement('option');
      option.value = kavling;
      option.textContent = kavling;
      
      // Tambahkan class berdasarkan progress (opsional - bisa diisi nanti)
      // option.className = getProgressClass(kavling);
      
      optgroup.appendChild(option);
    });
    
    selectElement.appendChild(optgroup);
  });
  
  // Restore previous selection if it exists in new list
  if (currentValue && kavlings.includes(currentValue)) {
    selectElement.value = currentValue;
  }
}

// Set selected kavling di semua dropdown
function setSelectedKavlingInDropdowns(kavlingName) {
  const selectIds = [
    'searchKavling1',
    'searchKavling2', 
    'searchKavling3',
    'searchKavling4',
    'searchKavlingManager'
  ];
  
  selectIds.forEach(selectId => {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
      selectElement.value = kavlingName;
    }
  });
}

// ========== FUNGSI SEARCH KAVLING DENGAN SELECT DROPDOWN ==========
async function searchKavling() {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');
  
  try {
    const rolePage = currentRole + 'Page';
    const roleNum = currentRole.match(/\d+$/);
    const selectId = 'searchKavling' + (roleNum ? roleNum[0] : 'Manager');
    const selectElement = document.getElementById(selectId);
    
    console.log('Select element:', selectElement);
    
    if (!selectElement) {
      alert('ERROR: Dropdown kavling tidak ditemukan!');
      return;
    }
    
    const kavlingName = selectElement.value.trim();
    console.log('Nama kavling selected:', kavlingName);
    
    if (!kavlingName) {
      alert('Pilih kavling terlebih dahulu dari dropdown!');
      selectElement.focus();
      return;
    }
    
    // Tampilkan loading
    showGlobalLoading('Mengambil data kavling ' + kavlingName + '...');
    
    // Panggil server
    console.log('Memanggil server untuk:', kavlingName);
    const data = await getKavlingDataFromServer(kavlingName);
    console.log('Response dari server:', data);
    
    if (data.success) {
      // Simpan ke variabel global
      selectedKavling = kavlingName;
      currentKavlingData = data;
      
      // Set di semua dropdown
      setSelectedKavlingInDropdowns(kavlingName);
      
      // Ekstrak LT dan LB dari tipe string
      const ltLb = extractLTandLB(data.tipe);
      currentKavlingData.lt = ltLb.lt;
      currentKavlingData.lb = ltLb.lb;
      
      console.log('LT/LB extracted:', ltLb);
      console.log('✅ selectedKavling di-set:', selectedKavling);
      
      // Update UI
      updateKavlingInfo(data, rolePage);
      loadProgressData(data.data);
      
      showProgressMessage('success', `Data ${kavlingName} berhasil dimuat!`);
      
    } else {
      console.error('Server error:', data.message);
      showProgressMessage('error', data.message || 'Kavling tidak ditemukan');
      
      // Reset selection
      selectElement.value = '';
    }
    
  } catch (error) {
    console.error('Error dalam searchKavling:', error);
    showProgressMessage('error', 'Gagal mengambil data: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

// Fungsi untuk mengambil data kavling dari server
function getKavlingDataFromServer(kavlingName) {
  return new Promise((resolve) => {
    const callbackName = 'kavlingDataCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      console.log('Kavling data response:', data);
      resolve(data);
      
      delete window[callbackName];
      const script = document.getElementById('kavlingDataScript');
      if (script) script.remove();
    };
    
    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=getKavlingData&kavling=' + encodeURIComponent(kavlingName) + 
      '&callback=' + callbackName;
    
    console.log('Fetching kavling data from:', url);
    
    const script = document.createElement('script');
    script.id = 'kavlingDataScript';
    script.src = url;
    
    document.body.appendChild(script);
  });
}

// Ekstrak LT dan LB dari string tipe
function extractLTandLB(tipeString) {
  if (!tipeString || tipeString === '-') return { lt: "", lb: "" };
  
  // Format: "LT / LB" atau "36 / 72"
  const parts = tipeString.split('/').map(part => part.trim());
  return {
    lt: parts[0] || "",
    lb: parts[1] || ""
  };
}

// ========== FUNGSI HELPER LAIN ==========

// Fungsi untuk update info kavling di sidebar
function updateKavlingInfo(data, pageId) {
  const infoDisplay = document.querySelector(`#${pageId} .kavling-info-display`);
  
  if (!infoDisplay) return;
  
  infoDisplay.innerHTML = `
    <div class="info-item">
      <span class="info-label">Blok/Kavling:</span>
      <span class="info-value val-name">${data.kavling || '-'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Tipe:</span>
      <span class="info-value val-type">${data.tipe || '-'}</span>
    </div>
  `;
}

// Fungsi untuk memuat data progress ke checkbox
function loadProgressData(progressData) {
  if (!progressData) return;
  
  const rolePage = currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  console.log('Loading progress data for:', rolePage, progressData);

  // Tahap 1
  if (progressData.tahap1) {
    Object.keys(progressData.tahap1).forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
      }
    });
  }
  
  // Tahap 2
  if (progressData.tahap2) {
    Object.keys(progressData.tahap2).forEach(taskName => {
      const isChecked = progressData.tahap2[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 2, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
      }
    });
  }
  
  // Tahap 3
  if (progressData.tahap3) {
    Object.keys(progressData.tahap3).forEach(taskName => {
      const isChecked = progressData.tahap3[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 3, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
      }
    });
  }

  // Load keterangan di textarea
  if (progressData.keterangan) {
    const commentEl = pageElement.querySelector('.progress-section[data-tahap="3"] .tahap-comments');
    if (commentEl) commentEl.value = progressData.keterangan;
  }
    
  // Update total progress
  updateTotalProgressDisplay(progressData.totalProgress || '0%', rolePage);
  
  // Hitung progress per tahap untuk update UI bar
  updateProgress(rolePage);
}

// Helper untuk mencari checkbox berdasarkan nama task
function findCheckboxByTaskName(taskName, tahap, pageId) {
  const checkboxes = document.querySelectorAll(`#${pageId} .progress-section[data-tahap="${tahap}"] .sub-task`);
  
  for (let checkbox of checkboxes) {
    const label = checkbox.closest('label');
    if (label) {
      const labelText = label.textContent.trim().toLowerCase();
      const searchTask = taskName.trim().toLowerCase();
      // Gunakan includes untuk pencocokan yang lebih fleksibel
      if (labelText.includes(searchTask) || searchTask.includes(labelText)) {
        return checkbox;
      }
    }
  }
  
  return null;
}

// Update total progress display
function updateTotalProgressDisplay(totalProgress, pageId) {
  const totalPercentElement = document.querySelector(`#${pageId} .total-percent`);
  const totalBarElement = document.querySelector(`#${pageId} .total-bar`);
  
  if (totalPercentElement) {
    totalPercentElement.textContent = totalProgress;
  }
  
  if (totalBarElement) {
    // Extract percentage number
    const percentMatch = totalProgress.match(/(\d+)%/);
    const percent = percentMatch ? parseInt(percentMatch[1]) : 0;
    totalBarElement.style.width = percent + '%';
  }
}

// Fungsi untuk sinkronisasi data
async function syncData() {
  const rolePage = currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);
  
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }
  
  try {
    showGlobalLoading('Sinkronisasi data...');
    await loadKavlingList();
    
    // Jika ada kavling yang sedang dipilih, ambil ulang datanya
    if (selectedKavling) {
      const data = await getKavlingDataFromServer(selectedKavling);
      if (data.success) {
        currentKavlingData = data;
        loadProgressData(data.data);
        showProgressMessage('success', 'Data berhasil disinkronisasi!');
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
    showProgressMessage('error', 'Gagal sinkronisasi data');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronisasi';
    }
    hideGlobalLoading();
  }
}

// ========== FITUR MOBILE ENHANCEMENT ==========

// Inisialisasi fitur mobile-friendly
function initializeMobileEnhancements() {
  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Setup semua select dropdown
  const selectElements = document.querySelectorAll('select[id^="searchKavling"]');
  
  selectElements.forEach(select => {
    // Auto-search ketika kavling dipilih
    select.addEventListener('change', function() {
      if (this.value.trim() !== '') {
        searchKavling();
      }
    });
    
    // Keyboard navigation untuk dropdown panjang
    if (!isMobile) {
      select.addEventListener('keydown', function(e) {
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          // User typed a character - jump to matching option
          const char = e.key.toLowerCase();
          const options = Array.from(this.options);
          
          for (let i = 0; i < options.length; i++) {
            if (options[i].text.toLowerCase().startsWith(char)) {
              this.selectedIndex = i;
              break;
            }
          }
        }
      });
    }
    
    // Touch feedback untuk mobile
    if (isMobile) {
      select.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
      });
      
      select.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
      });
      
      // Pastikan font size cukup besar untuk mobile
      select.style.fontSize = '16px';
      select.style.minHeight = '50px';
    }
  });
}

// ========== FUNGSI SAVE TAHAP (tetap sama) ==========

// Fungsi untuk menyimpan tahap 1
async function saveTahap1() {
  if (!selectedKavling || !currentKavlingData) {
    showProgressMessage('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap1Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="1"]`);
  if (!tahap1Section) return;
  
  const checkboxes = tahap1Section.querySelectorAll('.sub-task');
  const saveButton = tahap1Section.querySelector('.btn-save-section');
  
  const t1Mapping = {
    "Land Clearing": "LAND CLEARING",
    "Pondasi": "PONDASI",
    "Sloof": "SLOOF",
    "Pas.Ddg S/D2 Canopy": "PAS.DDG S/D2 CANOPY",
    "Pas.Ddg S/D Ring Blk": "PAS.DDG S/D RING BLK",
    "Conduit + Inbow Doos": "CONDUIT+INBOW DOOS",
    "Pipa Air Kotor": "PIPA AIR KOTOR",
    "Pipa Air Bersih": "PIPA AIR BERSIH",
    "Biotank": "BIOTANK",
    "Plester": "PLESTER",
    "Acian & Benangan": "ACIAN & BENANGAN",
    "Cor Meja Dapur": "COR MEJA DAPUR"
  };

  const tahapData = {};
  tahapData["LT"] = currentKavlingData.lt || "";
  tahapData["LB"] = currentKavlingData.lb || "";

  checkboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    const uiTaskName = label.textContent.trim();
    const spreadsheetTaskName = t1Mapping[uiTaskName] || uiTaskName;
    tahapData[spreadsheetTaskName] = checkbox.checked;
  });

  // Show loading
  if (saveButton) {
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const overallPercent = calculateOverallPercent(rolePage);
    const result = await saveTahapDataToServer('saveTahap1', selectedKavling, tahapData, overallPercent);
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      // Update current data
      if (currentKavlingData.data) {
        Object.keys(tahapData).forEach(taskName => {
          if (currentKavlingData.data.tahap1[taskName] !== undefined) {
            currentKavlingData.data.tahap1[taskName] = tahapData[taskName];
          }
        });
      }
      
      console.log('Tahap 1 saved successfully:', result);
    } else {
      showProgressMessage('error', result.message || 'Gagal menyimpan tahap 1');
    }
    
  } catch (error) {
    console.error('Error saving tahap 1:', error);
    showProgressMessage('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    // Restore button
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 1';
      saveButton.disabled = false;
    }
  }
}

// Fungsi untuk menyimpan tahap 2
async function saveTahap2() {
  if (!selectedKavling || !currentKavlingData) {
    showProgressMessage('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap2Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="2"]`);
  if (!tahap2Section) return;
  
  const checkboxes = tahap2Section.querySelectorAll('.sub-task');
  const saveButton = tahap2Section.querySelector('.btn-save-section');
  
  const t2Mapping = {
    "Atap Galv": "ATAP GALV.",
    "Genteng": "GENTENG",
    "Plafond": "PLAFOND",
    "Keramik Dinding Toilet & Dapur": "KERAMIK DINDING TOILET & DAPUR",
    "Insts Listrik": "INSTS LISTRIK",
    "Keramik Lantai": "KERAMIK LANTAI"
  };

  const tahapData = {};
  tahapData["LT"] = currentKavlingData.lt || "";
  tahapData["LB"] = currentKavlingData.lb || "";

  checkboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    const uiTaskName = label.textContent.trim();
    const spreadsheetTaskName = t2Mapping[uiTaskName] || uiTaskName;
    tahapData[spreadsheetTaskName] = checkbox.checked;
  });

  if (saveButton) {
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const overallPercent = calculateOverallPercent(rolePage);
    const result = await saveTahapDataToServer('saveTahap2', selectedKavling, tahapData, overallPercent);
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap2) currentKavlingData.data.tahap2 = {};
        Object.keys(tahapData).forEach(taskName => {
          currentKavlingData.data.tahap2[taskName] = tahapData[taskName];
        });
      }
      
      console.log('Tahap 2 saved successfully:', result);
    } else {
      showProgressMessage('error', result.message || 'Gagal menyimpan tahap 2');
    }
    
  } catch (error) {
    console.error('Error saving tahap 2:', error);
    showProgressMessage('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 2';
      saveButton.disabled = false;
    }
  }
}

// Fungsi untuk menyimpan tahap 3
async function saveTahap3() {
  if (!selectedKavling || !currentKavlingData) {
    showProgressMessage('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap3Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="3"]`);
  if (!tahap3Section) return;
  
  const checkboxes = tahap3Section.querySelectorAll('.sub-task');
  const saveButton = tahap3Section.querySelector('.btn-save-section');
  
  const t3Mapping = {
    "Kusen Pintu & Jendela": "KUSEN PINTU & JENDELA",
    "Daun Pintu & Jendela": "DAUN PINTU & JENDELA",
    "Cat Dasar + Lapis Awal": "CAT DASAR + LAPIS AWAL",
    "Fitting Lampu": "FITTING LAMPU",
    "Fixture & Saniter": "FIXTURE & SANITER",
    "Cat Finish Interior": "CAT FINISH INTERIOR",
    "Cat Finish Exterior": "CAT FINISH EXTERIOR",
    "Bak Kontrol & Batas Carport": "BAK KONTROL & BATAS CARPORT",
    "Paving Halaman": "PAVING HALAMAN",
    "General Cleaning": "GENERAL CLEANING",
    "Completion": "COMPLETION / Penyelesaian akhir"
  };

  const tahapData = {};
  tahapData["LT"] = currentKavlingData.lt || "";
  tahapData["LB"] = currentKavlingData.lb || "";

  checkboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    const uiTaskName = label.textContent.trim();
    const spreadsheetTaskName = t3Mapping[uiTaskName] || uiTaskName;
    tahapData[spreadsheetTaskName] = checkbox.checked;
  });

  // Tambahkan komentar ke data yang akan dikirim
  const commentEl = tahap3Section.querySelector('.tahap-comments');
  if (commentEl) {
    tahapData["Keterangan"] = commentEl.value;
  }
  
  if (saveButton) {
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const overallPercent = calculateOverallPercent(rolePage);
    const result = await saveTahapDataToServer('saveTahap3', selectedKavling, tahapData, overallPercent);
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap3) currentKavlingData.data.tahap3 = {};
        Object.keys(tahapData).forEach(taskName => {
          currentKavlingData.data.tahap3[taskName] = tahapData[taskName];
        });
        // Update keterangan
        if (tahapData["Keterangan"]) {
          currentKavlingData.data.keterangan = tahapData["Keterangan"];
        }
      }
      
      console.log('Tahap 3 saved successfully:', result);
    } else {
      showProgressMessage('error', result.message || 'Gagal menyimpan tahap 3');
    }
    
  } catch (error) {
    console.error('Error saving tahap 3:', error);
    showProgressMessage('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 3';
      saveButton.disabled = false;
    }
  }
}

// Fungsi helper untuk menyimpan data tahap ke server
function saveTahapDataToServer(action, kavling, data, totalProgress) {
  return new Promise((resolve) => {
    const callbackName = 'saveTahapCallback_' + Date.now();
    
    window[callbackName] = function(response) {
      console.log('Save tahap response:', response);
      resolve(response);
      
      delete window[callbackName];
      const script = document.getElementById('saveTahapScript');
      if (script) script.remove();
    };
    
    let url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=' + action + 
      '&kavling=' + encodeURIComponent(kavling) + 
      '&data=' + encodeURIComponent(JSON.stringify(data)) + 
      '&callback=' + callbackName;
      
    if (totalProgress !== undefined) {
      url += '&totalProgress=' + encodeURIComponent(totalProgress + '%');
    }
    
    console.log('Saving tahap data via:', url);
    
    const script = document.createElement('script');
    script.id = 'saveTahapScript';
    script.src = url;
    
    document.body.appendChild(script);
  });
}

// Fungsi untuk menampilkan pesan progress
function showProgressMessage(type, message) {
  let messageContainer = document.getElementById('progressMessage');
  
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'progressMessage';
    messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      padding: 15px 20px;
      border-radius: 10px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(messageContainer);
  }
  
  messageContainer.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" 
       style="color: ${type === 'success' ? '#10b981' : '#f43f5e'}; font-size: 1.2rem;"></i>
    <span>${message}</span>
  `;
  
  messageContainer.style.display = 'flex';
  messageContainer.style.backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)';
  messageContainer.style.color = type === 'success' ? '#10b981' : '#f43f5e';
  messageContainer.style.border = `1px solid ${type === 'success' ? '#10b981' : '#f43f5e'}`;
  
  // Auto hide setelah 3 detik
  setTimeout(() => {
    messageContainer.style.display = 'none';
  }, 3000);
}

// ========== PROGRESS CALCULATION ==========
function calculateOverallPercent(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return 0;

  const sections = page.querySelectorAll('.progress-section.detailed');
  let totalTasks = 0;
  let completedTasks = 0;

  sections.forEach(section => {
    const checkboxes = section.querySelectorAll('.sub-task');
    totalTasks += checkboxes.length;
    checkboxes.forEach(cb => {
      if (cb.checked) completedTasks++;
    });
  });

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function updateProgress(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;

  const totalBar = page.querySelector('.total-bar');
  const totalPercent = page.querySelector('.total-percent');
  
  const sections = page.querySelectorAll('.progress-section.detailed');
  let totalTasks = 0;
  let completedTasks = 0;

  sections.forEach(section => {
    const checkboxes = section.querySelectorAll('.sub-task');
    const weight = checkboxes.length;
    let sectionCompleted = 0;

    checkboxes.forEach(cb => {
      if (cb.checked) sectionCompleted++;
    });

    const sectionPercent = weight > 0 ? Math.round((sectionCompleted / weight) * 100) : 0;
    
    // Update section UI
    const sectionBar = section.querySelector('.progress-fill');
    const sectionText = section.querySelector('.sub-percent');
    
    if (sectionBar) sectionBar.style.width = sectionPercent + '%';
    if (sectionText) sectionText.textContent = sectionPercent + '%';

    totalTasks += weight;
    completedTasks += sectionCompleted;
  });

  const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  if (totalBar) totalBar.style.width = overallPercent + '%';
  if (totalPercent) totalPercent.textContent = overallPercent + '%';
}

// ========== LOGIN & SESSION FUNCTIONS ==========

function verifyLogin(role, password) {
  return new Promise((resolve) => {
    const callbackName = 'loginCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      console.log('Login response:', data);
      resolve(data);
      delete window[callbackName];
      
      const script = document.getElementById('loginScript');
      if (script) script.remove();
    };
    
    const script = document.createElement('script');
    script.id = 'loginScript';
    script.src = USER_APPS_SCRIPT_URL + 
      '?role=' + encodeURIComponent(role) + 
      '&password=' + encodeURIComponent(password) + 
      '&callback=' + callbackName;
    
    document.body.appendChild(script);
  });
}

function updateDashboardTitle(role, displayName) {
  console.log(`Updating title for ${role} to: Selamat datang Pak ${displayName}`);
  
  const pageElement = document.getElementById(role + 'Page');
  console.log('Page element found:', !!pageElement);
  
  if (pageElement) {
    let titleElement = pageElement.querySelector('.page-header .page-title h2');
    
    if (!titleElement) {
      titleElement = pageElement.querySelector('.page-title h2');
    }
    
    if (!titleElement) {
      titleElement = pageElement.querySelector('h2');
    }
    
    console.log('Title element found:', !!titleElement);
    
    if (titleElement) {
      console.log('Before update:', titleElement.textContent);
      titleElement.textContent = `Selamat datang Pak ${displayName}`;
      console.log('After update:', titleElement.textContent);
    } else {
      console.error('❌ Tidak ditemukan elemen h2 di page:', role + 'Page');
    }
  }
}

async function handleLogin() {
  const modal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitPassword');
  
  if (!currentRole || !passwordInput) return;
  
  const password = passwordInput.value.trim();
  if (!password) {
    if (errorMsg) errorMsg.textContent = 'Masukkan password';
    return;
  }
  
  // Loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memeriksa...';
  }
  
  console.log('Login attempt for:', currentRole, 'password:', '***');
  
  try {
    const result = await verifyLogin(currentRole, password);
    console.log('Login result:', result);
    
    if (result.success) {
      // SUCCESS
      if (modal) modal.style.display = 'none';
      
      const displayName = result.displayName || defaultDisplayNames[currentRole];
      console.log('Display name to use:', displayName);
      
      // Update role button text
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = displayName;
      });
      
      // Update dashboard title
      updateDashboardTitle(currentRole, displayName);
      
      // Simpan session
      sessionStorage.setItem('loggedRole', currentRole);
      sessionStorage.setItem('loggedDisplayName', displayName);
      
      // Tampilkan dashboard
      showPage(currentRole);
      
    } else {
      // FAILED
      if (errorMsg) errorMsg.textContent = result.message || 'Password salah';
      passwordInput.value = '';
      passwordInput.focus();
    }
    
  } catch (error) {
    console.error('Login error:', error);
    if (errorMsg) errorMsg.textContent = 'Gagal menghubungi server';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
  }
}

function showPage(role) {
  console.log('Showing page for:', role);
  
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  // Hide main container
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });
  
  // Show selected page
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
    pageElement.setAttribute('aria-hidden', 'false');
    
    // Update title juga saat show page (untuk session restore)
    const savedName = sessionStorage.getItem('loggedDisplayName');
    if (savedName) {
      updateDashboardTitle(role, savedName);
    }
    
    // Trigger initial progress calc
    updateProgress(role + 'Page');
    
    // Load data khusus berdasarkan role
    if (role === 'admin') {
      setTimeout(() => {
        loadUsersForAdmin();
      }, 500);
    } else if (role.startsWith('user')) {
      // Untuk pelaksana, load kavling list
      setTimeout(() => {
        loadKavlingList();
      }, 500);
    }
  }
}

function goBack() {
  // Show main container
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
    page.setAttribute('aria-hidden', 'true');
  });
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  currentRole = null;
}

// ========== USER MANAGEMENT FUNCTIONS (sama) ==========

// ... (user management functions tetap sama seperti sebelumnya)
// ... (loadUsersForAdmin, getUsersFromServer, loadSelectedUser, saveUserChanges, etc.)

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  
  // Elements
  const modal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const submitBtn = document.getElementById('submitPassword');
  const errorMsg = document.getElementById('errorMessage');
  
  // Check saved session
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  
  console.log('Saved session:', { savedRole, savedName });
  
  if (savedRole && savedName) {
    // Auto login dengan session
    document.querySelectorAll(`[data-role="${savedRole}"] h3`).forEach(el => {
      el.textContent = savedName;
    });
    
    // Update dashboard title juga
    updateDashboardTitle(savedRole, savedName);
    
    showPage(savedRole);
  }
  
  // Role button click
  document.addEventListener('click', function(e) {
    const roleBtn = e.target.closest('.role-btn');
    if (roleBtn) {
      currentRole = roleBtn.getAttribute('data-role');
      console.log('Role button clicked:', currentRole);
      
      if (modal && currentRole) {
        // Update modal title with default name
        const title = modal.querySelector('h2#modalTitle');
        if (title) {
          title.textContent = 'Login sebagai ' + (defaultDisplayNames[currentRole] || currentRole);
        }
        
        // Show modal
        modal.style.display = 'flex';
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
        if (errorMsg) errorMsg.textContent = '';
      }
    }
  });
  
  // Submit button
  if (submitBtn) {
    submitBtn.addEventListener('click', handleLogin);
  }
  
  // Enter key in password
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && submitBtn) {
        submitBtn.click();
      }
    });
  }
  
  // Close modal
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-btn') || e.target === modal) {
      if (modal) modal.style.display = 'none';
    }
  });

  // Admin Tab Switching
  document.addEventListener('click', function(e) {
    const tabBtn = e.target.closest('.admin-tab-btn');
    if (tabBtn) {
      const tabId = tabBtn.getAttribute('data-tab');
      
      // Update buttons
      document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#94a3b8';
        btn.style.borderBottom = 'none';
      });
      tabBtn.classList.add('active');
      tabBtn.style.color = 'white';
      tabBtn.style.borderBottom = '3px solid #38bdf8';
      
      // Update content
      document.querySelectorAll('.tab-content-item').forEach(content => {
        content.style.display = 'none';
      });
      const targetContent = document.getElementById('tab-' + tabId);
      if (targetContent) targetContent.style.display = 'block';
      
      // Jika pindah ke tab users, load user data
      if (tabId === 'users') {
        loadUsersForAdmin();
      }
    }
  });

  // Checkbox change listener for progress
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task')) {
      const page = e.target.closest('.page-content');
      if (page) {
        updateProgress(page.id);
      }
    }
  });

  // Logout button
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.logout-btn');
    if (btn) {
      clearSession();
      goBack();
      
      // Reset button text to default
      document.querySelectorAll('.role-btn h3').forEach(el => {
        const role = el.closest('.role-btn').getAttribute('data-role');
        el.textContent = defaultDisplayNames[role] || role;
      });
      
      // Reset dashboard titles
      document.querySelectorAll('.page-content h2').forEach(h2 => {
        if (h2.textContent.includes('Selamat datang Pak')) {
          const role = h2.closest('.page-content').id.replace('Page', '');
          h2.textContent = defaultDisplayNames[role] ? `Dashboard ${defaultDisplayNames[role]}` : `Dashboard ${role}`;
        }
      });
    }
  });

  // Initialize mobile enhancements
  initializeMobileEnhancements();
  
  // Setup sync button listeners for all pages
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', syncData);
  });
  
  // Save tahap buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-save-section')) {
      const button = e.target.closest('.btn-save-section');
      const section = button.closest('.progress-section');
      if (section) {
        const tahap = section.getAttribute('data-tahap');
        
        if (tahap === '1') {
          saveTahap1();
        } else if (tahap === '2') {
          saveTahap2();
        } else if (tahap === '3') {
          saveTahap3();
        }
      }
    }
  });
});

// ========== DEBUG FUNCTIONS ==========
window.testLogin = async function(role = 'user1', password = '11') {
  console.log('Testing login for:', role);
  const result = await verifyLogin(role, password);
  console.log('Result:', result);
  
  if (result.success) {
    const displayName = result.displayName || defaultDisplayNames[role];
    console.log('Would update UI with:', displayName);
    updateDashboardTitle(role, displayName);
  }
  
  return result;
};

window.testProgressSystem = function() {
  console.log('Testing progress system...');
  loadKavlingList();
};
