// script.js - VERSI DIPERBAIKI DENGAN FUNGSI BARU
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX_CGCCi7omTBhHc-0PCHnmmVE4rGFwmVbPav5gvSXE41EaF5-US8aFkRBHXmnwuVZzg/exec';

let currentRole = null;
let selectedKavling = null;
let currentKavlingData = null;

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

// ========== KAVLING FUNCTIONS ==========
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });
    
    if (result.success && result.kavlings && result.kavlings.length > 0) {
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);
      
      if (selectedKavling) {
        setTimeout(() => {
          setSelectedKavlingInDropdowns(selectedKavling);
        }, 100);
      }
      
      return result.kavlings;
    } else {
      console.log('❌ No kavlings found:', result.message);
      showProgressMessage('warning', 'Tidak ada data kavling ditemukan');
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error loading kavling list:', error);
    showProgressMessage('error', 'Gagal memuat daftar kavling');
    return [];
  } finally {
    hideGlobalLoading();
  }
}

// ========== FUNGSI HELPER GENERIC UNTUK SEMUA REQUEST ==========
function getDataFromServer(url, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    window[callbackName] = function(data) {
      resolve(data);
      delete window[callbackName];
      
      // Clean up script element
      const scriptId = 'script_' + callbackName;
      const scriptEl = document.getElementById(scriptId);
      if (scriptEl) scriptEl.remove();
    };
    
    // Build URL with parameters
    let requestUrl = url + '?';
    const urlParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        if (typeof params[key] === 'object') {
          urlParams.append(key, JSON.stringify(params[key]));
        } else {
          urlParams.append(key, params[key]);
        }
      }
    });
    
    urlParams.append('callback', callbackName);
    requestUrl += urlParams.toString();
    
    // Create and append script element
    const script = document.createElement('script');
    script.id = 'script_' + callbackName;
    script.src = requestUrl;
    script.onerror = () => {
      reject(new Error('Failed to load script'));
      delete window[callbackName];
      script.remove();
    };
    
    document.body.appendChild(script);
  });
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
  
  // Sort kavlings
  const sortedKavlings = [...kavlings].sort((a, b) => {
    // Try to extract block and number
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
  
  // Add options
  sortedKavlings.forEach(kavling => {
    const option = document.createElement('option');
    option.value = kavling;
    option.textContent = kavling;
    selectElement.appendChild(option);
  });
  
  // Restore selection
  if (currentValue && kavlings.includes(currentValue)) {
    selectElement.value = currentValue;
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
    if (selectElement && Array.from(selectElement.options).some(opt => opt.value === kavlingName)) {
      selectElement.value = kavlingName;
    }
  });
}

async function searchKavling() {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');
  
  try {
    const rolePage = currentRole + 'Page';
    const selectId = getSelectIdByRole(currentRole);
    const selectElement = document.getElementById(selectId);
    
    if (!selectElement) {
      alert('ERROR: Dropdown kavling tidak ditemukan!');
      return;
    }
    
    const kavlingName = selectElement.value.trim();
    
    if (!kavlingName) {
      alert('Pilih kavling terlebih dahulu dari dropdown!');
      selectElement.focus();
      return;
    }
    
    showGlobalLoading('Mengambil data kavling ' + kavlingName + '...');
    
    const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingData',
      kavling: kavlingName
    });
    
    if (data.success) {
      selectedKavling = kavlingName;
      currentKavlingData = data;
      
      setSelectedKavlingInDropdowns(kavlingName);
      
      // Ekstrak LT dan LB dari tipe
      const ltLb = extractLTandLB(data.tipe);
      currentKavlingData.lt = ltLb.lt;
      currentKavlingData.lb = ltLb.lb;
      
      updateKavlingInfo(data, rolePage);
      loadProgressData(data.data);
      
      showProgressMessage('success', `Data ${kavlingName} berhasil dimuat!`);
      
      // Jika manager, tampilkan laporan summary
      if (currentRole === 'manager') {
        setTimeout(() => {
          loadSummaryReport();
        }, 500);
      }
      
    } else {
      showProgressMessage('error', data.message || 'Kavling tidak ditemukan');
      selectElement.value = '';
    }
    
  } catch (error) {
    console.error('Error dalam searchKavling:', error);
    showProgressMessage('error', 'Gagal mengambil data: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

function extractLTandLB(tipeString) {
  if (!tipeString || tipeString === '-' || tipeString === '/') {
    return { lt: "", lb: "" };
  }
  
  // Handle various formats
  const parts = tipeString.split('/').map(part => part.trim());
  return {
    lt: parts[0] || "",
    lb: parts[1] || ""
  };
}

function getSelectIdByRole(role) {
  const selectIds = {
    'user1': 'searchKavlingUser1',
    'user2': 'searchKavlingUser2', 
    'user3': 'searchKavlingUser3',
    'user4': 'searchKavlingUser4',
    'manager': 'searchKavlingManager'
  };
  return selectIds[role] || 'searchKavlingManager';
}

function getKavlingInfoIdByRole(role) {
  const infoIds = {
    'user1': 'kavlingInfoUser1',
    'user2': 'kavlingInfoUser2', 
    'user3': 'kavlingInfoUser3',
    'user4': 'kavlingInfoUser4',
    'manager': 'kavlingInfoManager'
  };
  return infoIds[role] || 'kavlingInfoManager';
}

function updateKavlingInfo(data, pageId) {
  const role = currentRole;
  const infoId = getKavlingInfoIdByRole(role);
  const infoDisplay = document.getElementById(infoId);
  
  if (!infoDisplay) return;
  
  const ltLb = extractLTandLB(data.tipe);
  
  infoDisplay.innerHTML = `
    <div class="info-item">
      <span class="info-label">Blok/Kavling:</span>
      <span class="info-value val-name">${data.kavling || '-'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Luas Tanah (LT):</span>
      <span class="info-value val-lt">${ltLb.lt || '-'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Luas Bangunan (LB):</span>
      <span class="info-value val-lb">${ltLb.lb || '-'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Total Progress:</span>
      <span class="info-value val-progress">${data.data?.totalProgress || '0%'}</span>
    </div>
  `;
}

// ========== PROGRESS FUNCTIONS ==========
function loadProgressData(progressData) {
  if (!progressData) return;
  
  const rolePage = currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  // Tahap 1
  if (progressData.tahap1) {
    Object.keys(progressData.tahap1).forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        // Tambahkan visual feedback
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
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
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
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
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }

  // Load keterangan
  if (progressData.keterangan) {
    const commentEl = pageElement.querySelector('.progress-section[data-tahap="3"] .tahap-comments');
    if (commentEl) {
      commentEl.value = progressData.keterangan;
    }
  }
    
  // Update progress display
  updateTotalProgressDisplay(progressData.totalProgress || '0%', rolePage);
  updateProgress(rolePage);
}

function findCheckboxByTaskName(taskName, tahap, pageId) {
  const checkboxes = document.querySelectorAll(`#${pageId} .progress-section[data-tahap="${tahap}"] .sub-task`);
  
  for (let checkbox of checkboxes) {
    const label = checkbox.closest('label');
    if (label) {
      const labelText = label.textContent.trim();
      // Create mapping for common variations
      const normalizedLabel = labelText.toLowerCase()
        .replace(/[\.\-\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const normalizedTask = taskName.toLowerCase()
        .replace(/[\.\-\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (normalizedLabel.includes(normalizedTask) || normalizedTask.includes(normalizedLabel)) {
        return checkbox;
      }
    }
  }
  
  // Fallback: try to find by index
  const checkboxesList = Array.from(checkboxes);
  const taskMappings = {
    1: ['LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK', 
        'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'BIOTANK', 'PLESTER', 
        'ACIAN & BENANGAN', 'COR MEJA DAPUR'],
    2: ['ATAP GALV.', 'GENTENG', 'PLAFOND', 'KERAMIK DINDING TOILET & DAPUR', 
        'INSTS LISTRIK', 'KERAMIK LANTAI'],
    3: ['KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 
        'FITTING LAMPU', 'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR', 
        'BAK KONTROL & BATAS CARPORT', 'PAVING HALAMAN', 'GENERAL CLEANING', 
        'COMPLETION / Penyelesaian akhir']
  };
  
  const tasksForTahap = taskMappings[tahap] || [];
  const taskIndex = tasksForTahap.indexOf(taskName);
  
  if (taskIndex >= 0 && taskIndex < checkboxesList.length) {
    return checkboxesList[taskIndex];
  }
  
  return null;
}

function updateTotalProgressDisplay(totalProgress, pageId) {
  const totalPercentElement = document.querySelector(`#${pageId} .total-percent`);
  const totalBarElement = document.querySelector(`#${pageId} .total-bar`);
  
  if (totalPercentElement) {
    totalPercentElement.textContent = totalProgress;
    
    // Add color coding based on percentage
    const percentMatch = totalProgress.match(/(\d+)%/);
    const percent = percentMatch ? parseInt(percentMatch[1]) : 0;
    
    totalPercentElement.className = 'total-percent';
    if (percent >= 89) {
      totalPercentElement.classList.add('progress-high');
    } else if (percent >= 60) {
      totalPercentElement.classList.add('progress-medium');
    } else if (percent >= 10) {
      totalPercentElement.classList.add('progress-low');
    } else {
      totalPercentElement.classList.add('progress-very-low');
    }
  }
  
  if (totalBarElement) {
    const percentMatch = totalProgress.match(/(\d+)%/);
    const percent = percentMatch ? parseInt(percentMatch[1]) : 0;
    totalBarElement.style.width = percent + '%';
    
    // Update bar color
    totalBarElement.className = 'total-bar';
    if (percent >= 89) {
      totalBarElement.classList.add('bar-high');
    } else if (percent >= 60) {
      totalBarElement.classList.add('bar-medium');
    } else if (percent >= 10) {
      totalBarElement.classList.add('bar-low');
    } else {
      totalBarElement.classList.add('bar-very-low');
    }
  }
}

// ========== SAVE FUNCTIONS (DENGAN VALIDASI) ==========
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

  checkboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    const uiTaskName = label.textContent.trim();
    const spreadsheetTaskName = t1Mapping[uiTaskName] || uiTaskName;
    tahapData[spreadsheetTaskName] = checkbox.checked;
  });

  // Add LT and LB if available
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap1',
      kavling: selectedKavling,
      data: tahapData
    });
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      // Update current data
      if (currentKavlingData.data) {
        Object.keys(tahapData).forEach(taskName => {
          if (currentKavlingData.data.tahap1 && currentKavlingData.data.tahap1[taskName] !== undefined) {
            currentKavlingData.data.tahap1[taskName] = tahapData[taskName];
          }
        });
      }
      
      // Update progress display
      updateProgress(rolePage);
      
      // Update total progress in info display
      if (result.totalProgress) {
        updateTotalProgressDisplay(result.totalProgress, rolePage);
        
        // Update info display
        const infoDisplay = document.getElementById(getKavlingInfoIdByRole(currentRole));
        if (infoDisplay) {
          const progressSpan = infoDisplay.querySelector('.val-progress');
          if (progressSpan) {
            progressSpan.textContent = result.totalProgress;
          }
        }
      }
      
    } else {
      showProgressMessage('error', result.message || 'Gagal menyimpan tahap 1');
    }
    
  } catch (error) {
    console.error('Error saving tahap 1:', error);
    showProgressMessage('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 1';
      saveButton.disabled = false;
    }
  }
}

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

  checkboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    const uiTaskName = label.textContent.trim();
    const spreadsheetTaskName = t2Mapping[uiTaskName] || uiTaskName;
    tahapData[spreadsheetTaskName] = checkbox.checked;
  });

  // Add LT and LB if available
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap2',
      kavling: selectedKavling,
      data: tahapData
    });
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap2) currentKavlingData.data.tahap2 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB') {
            currentKavlingData.data.tahap2[taskName] = tahapData[taskName];
          }
        });
      }
      
      updateProgress(rolePage);
      
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

  checkboxes.forEach(checkbox => {
    const label = checkbox.closest('label');
    const uiTaskName = label.textContent.trim();
    const spreadsheetTaskName = t3Mapping[uiTaskName] || uiTaskName;
    tahapData[spreadsheetTaskName] = checkbox.checked;
  });

  // Add LT and LB if available
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  
  // Tambahkan komentar
  const commentEl = tahap3Section.querySelector('.tahap-comments');
  if (commentEl) {
    tahapData["Keterangan"] = commentEl.value;
  }
  
  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap3',
      kavling: selectedKavling,
      data: tahapData
    });
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap3) currentKavlingData.data.tahap3 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'Keterangan') {
            currentKavlingData.data.tahap3[taskName] = tahapData[taskName];
          }
        });
        // Update keterangan
        if (tahapData["Keterangan"]) {
          currentKavlingData.data.keterangan = tahapData["Keterangan"];
        }
      }
      
      updateProgress(rolePage);
      
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

// ========== MESSAGE FUNCTIONS ==========
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
      transition: all 0.3s ease;
    `;
    document.body.appendChild(messageContainer);
  }
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               type === 'warning' ? 'exclamation-triangle' : 'info-circle';
  
  messageContainer.innerHTML = `
    <i class="fas fa-${icon}" 
       style="color: ${type === 'success' ? '#10b981' : type === 'error' ? '#f43f5e' : type === 'warning' ? '#f59e0b' : '#3b82f6'}; 
              font-size: 1.2rem;"></i>
    <span>${message}</span>
  `;
  
  messageContainer.style.display = 'flex';
  messageContainer.style.backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                                          type === 'error' ? 'rgba(244, 63, 94, 0.1)' :
                                          type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                                          'rgba(59, 130, 246, 0.1)';
  messageContainer.style.color = type === 'success' ? '#10b981' : 
                                type === 'error' ? '#f43f5e' :
                                type === 'warning' ? '#f59e0b' : '#3b82f6';
  messageContainer.style.border = `1px solid ${type === 'success' ? '#10b981' : 
                                         type === 'error' ? '#f43f5e' :
                                         type === 'warning' ? '#f59e0b' : '#3b82f6'}`;
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    if (messageContainer.style.display !== 'none') {
      messageContainer.style.opacity = '0';
      setTimeout(() => {
        messageContainer.style.display = 'none';
        messageContainer.style.opacity = '1';
      }, 300);
    }
  }, 3000);
}

// ========== LOGIN FUNCTIONS ==========
const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2', 
  'user3': 'Pelaksana 3',
  'user4': 'Pelaksana 4',
  'manager': 'MANAGEMENT',
  'admin': 'Admin'
};

async function verifyLogin(role, password) {
  return await getDataFromServer(USER_APPS_SCRIPT_URL, {
    role: role,
    password: password
  });
}

function updateDashboardTitle(role, displayName) {
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    let titleElement = pageElement.querySelector('.page-header .page-title h2');
    
    if (!titleElement) {
      titleElement = pageElement.querySelector('.page-title h2');
    }
    
    if (!titleElement) {
      titleElement = pageElement.querySelector('h2');
    }
    
    if (titleElement) {
      titleElement.textContent = `Selamat datang Pak ${displayName}`;
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
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memeriksa...';
  }
  
  try {
    const result = await verifyLogin(currentRole, password);
    
    if (result.success) {
      if (modal) modal.style.display = 'none';
      
      const displayName = result.displayName || defaultDisplayNames[currentRole];
      
      // Update role button text
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = displayName;
      });
      
      updateDashboardTitle(currentRole, displayName);
      
      // Save session
      sessionStorage.setItem('loggedRole', currentRole);
      sessionStorage.setItem('loggedDisplayName', displayName);
      sessionStorage.setItem('loginTime', new Date().toISOString());
      
      showPage(currentRole);
      
      // Show welcome message
      showProgressMessage('success', `Selamat datang, ${displayName}!`);
      
    } else {
      if (errorMsg) errorMsg.textContent = result.message || 'Password salah';
      passwordInput.value = '';
      passwordInput.focus();
      passwordInput.select();
      
      // Shake animation for error
      passwordInput.classList.add('shake-animation');
      setTimeout(() => {
        passwordInput.classList.remove('shake-animation');
      }, 500);
    }
    
  } catch (error) {
    console.error('Login error:', error);
    if (errorMsg) errorMsg.textContent = 'Gagal menghubungi server';
    showProgressMessage('error', 'Koneksi error. Periksa internet Anda.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
  }
}

function showPage(role) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });
  
  // Show selected page
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
    pageElement.setAttribute('aria-hidden', 'false');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update title
    const savedName = sessionStorage.getItem('loggedDisplayName');
    if (savedName) {
      updateDashboardTitle(role, savedName);
    }
    
    // Initial progress calculation
    updateProgress(role + 'Page');
    
    // Load specific data based on role
    if (role === 'admin') {
      setTimeout(() => {
        loadUsersForAdmin();
      }, 500);
    } else if (role === 'manager') {
      setTimeout(() => {
        loadKavlingList();
        loadActivityLog();
      }, 500);
    } else if (role.startsWith('user')) {
      setTimeout(() => {
        loadKavlingList();
      }, 500);
    }
  }
}

function goBack() {
  // Show all section containers
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  
  // Hide all page contents
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
    page.setAttribute('aria-hidden', 'true');
  });
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  sessionStorage.removeItem('loginTime');
  currentRole = null;
  selectedKavling = null;
  currentKavlingData = null;
  
  // Clear any pending timeouts/intervals
  const highestId = window.setTimeout(() => {}, 0);
  for (let i = 0; i < highestId; i++) {
    window.clearTimeout(i);
    window.clearInterval(i);
  }
}

// ========== SYNC FUNCTION ==========
async function syncData() {
  const rolePage = currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);
  
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }
  
  try {
    showGlobalLoading('Sinkronisasi data...');
    
    // Sync kavling list
    await loadKavlingList();
    
    // Sync current kavling data if selected
    if (selectedKavling) {
      const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
        action: 'getKavlingData',
        kavling: selectedKavling
      });
      
      if (data.success) {
        currentKavlingData = data;
        loadProgressData(data.data);
        showProgressMessage('success', 'Data berhasil disinkronisasi!');
      }
    } else {
      showProgressMessage('info', 'Daftar kavling diperbarui');
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

// ========== ADD KAVLING FUNCTIONS ==========
function handleAddKavling() {
  const modal = document.getElementById('addKavlingModal');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      document.getElementById('newKavlingName').focus();
    }, 100);
  }
}

async function submitNewKavling() {
  const nameInput = document.getElementById('newKavlingName');
  const ltInput = document.getElementById('newKavlingLT');
  const lbInput = document.getElementById('newKavlingLB');
  const submitBtn = document.getElementById('submitNewKavling');
  
  if (!nameInput || !ltInput || !lbInput || !submitBtn) return;
  
  const kavlingName = nameInput.value.trim();
  const lt = ltInput.value.trim();
  const lb = lbInput.value.trim();
  
  // Validasi
  if (!kavlingName) {
    showProgressMessage('error', 'Nama kavling harus diisi');
    nameInput.focus();
    return;
  }
  
  // Validasi format (optional, bisa disesuaikan)
  if (kavlingName.length < 2) {
    showProgressMessage('error', 'Nama kavling terlalu pendek');
    nameInput.focus();
    return;
  }
  
  if (!lt || lt === '0') {
    showProgressMessage('error', 'Luas tanah (LT) harus diisi');
    ltInput.focus();
    return;
  }
  
  if (!lb || lb === '0') {
    showProgressMessage('error', 'Luas bangunan (LB) harus diisi');
    lbInput.focus();
    return;
  }
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menambahkan...';
    submitBtn.disabled = true;
  }
  
  try {
    showGlobalLoading('Menambahkan kavling baru...');
    
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'addNewKavling',
      name: kavlingName,
      lt: lt,
      lb: lb
    });
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      // Tutup modal
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'none';
      
      // Clear form
      nameInput.value = '';
      ltInput.value = '';
      lbInput.value = '';
      
      // Refresh list kavling setelah 1 detik
      setTimeout(() => {
        loadKavlingList();
      }, 1000);
      
    } else {
      showProgressMessage('error', result.message || 'Gagal menambahkan kavling');
    }
    
  } catch (error) {
    console.error('Error adding kavling:', error);
    showProgressMessage('error', 'Gagal menambahkan kavling: ' + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Kavling Baru';
      submitBtn.disabled = false;
    }
    hideGlobalLoading();
  }
}

// ========== MANAGER FUNCTIONS (LAPORAN & LOG) ==========
async function loadSummaryReport() {
  try {
    showGlobalLoading('Mengambil laporan summary...');
    
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getSummaryReport'
    });
    
    if (result.success) {
      displaySummaryReport(result);
    } else {
      showProgressMessage('error', result.message || 'Gagal mengambil laporan');
    }
    
  } catch (error) {
    console.error('Error loading summary report:', error);
    showProgressMessage('error', 'Gagal mengambil laporan');
  } finally {
    hideGlobalLoading();
  }
}

function displaySummaryReport(summaryData) {
  const container = document.getElementById('summaryReportContainer');
  if (!container) return;
  
  const timestamp = new Date(summaryData.timestamp || new Date()).toLocaleString('id-ID');
  
  let html = `
    <div class="summary-header">
      <h3><i class="fas fa-chart-bar"></i> Laporan Summary Progress Kavling</h3>
      <p class="summary-timestamp">Diperbarui: ${timestamp}</p>
    </div>
    
    <div class="summary-stats">
      <div class="stat-card stat-total">
        <div class="stat-icon">
          <i class="fas fa-home"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${summaryData.totalKavlings || 0}</div>
          <div class="stat-label">Total Kavling</div>
        </div>
      </div>
      
      <div class="stat-card stat-completed">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${summaryData.categories?.completed?.count || 0}</div>
          <div class="stat-label">Selesai (89-100%)</div>
          <div class="stat-percent">${summaryData.categories?.completed?.percentage || 0}%</div>
        </div>
      </div>
      
      <div class="stat-card stat-almost">
        <div class="stat-icon">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${summaryData.categories?.almostCompleted?.count || 0}</div>
          <div class="stat-label">Hampir Selesai (60-88%)</div>
          <div class="stat-percent">${summaryData.categories?.almostCompleted?.percentage || 0}%</div>
        </div>
      </div>
      
      <div class="stat-card stat-progress">
        <div class="stat-icon">
          <i class="fas fa-tools"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${summaryData.categories?.inProgress?.count || 0}</div>
          <div class="stat-label">Sedang Berjalan (10-59%)</div>
          <div class="stat-percent">${summaryData.categories?.inProgress?.percentage || 0}%</div>
        </div>
      </div>
      
      <div class="stat-card stat-low">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${summaryData.categories?.lowProgress?.count || 0}</div>
          <div class="stat-label">Progress Rendah (0-9%)</div>
          <div class="stat-percent">${summaryData.categories?.lowProgress?.percentage || 0}%</div>
        </div>
      </div>
    </div>
  `;
  
  // Tambahkan daftar kavling jika ada
  if (summaryData.topCompleted && summaryData.topCompleted.length > 0) {
    html += `
      <div class="summary-section">
        <h4><i class="fas fa-trophy"></i> Top 5 Kavling Terlengkap</h4>
        <div class="kavling-list">
    `;
    
    summaryData.topCompleted.forEach((kavling, index) => {
      html += `
        <div class="kavling-item">
          <div class="kavling-rank">${index + 1}</div>
          <div class="kavling-info">
            <div class="kavling-name">${kavling.kavling}</div>
            <div class="kavling-details">LT: ${kavling.lt || '-'} | LB: ${kavling.lb || '-'}</div>
          </div>
          <div class="kavling-progress progress-high">${kavling.totalProgress}</div>
        </div>
      `;
    });
    
    html += `</div></div>`;
  }
  
  container.innerHTML = html;
}

async function loadActivityLog() {
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getActivityLog',
      limit: 20
    });
    
    if (result.success && result.logs) {
      displayActivityLog(result.logs);
    }
    
  } catch (error) {
    console.error('Error loading activity log:', error);
  }
}

function displayActivityLog(logs) {
  const container = document.getElementById('activityLogContainer');
  if (!container) return;
  
  if (logs.length === 0) {
    container.innerHTML = '<p class="no-data">Belum ada aktivitas yang tercatat</p>';
    return;
  }
  
  let html = `
    <div class="activity-header">
      <h4><i class="fas fa-history"></i> Log Aktivitas Terakhir</h4>
      <span class="activity-count">${logs.length} aktivitas</span>
    </div>
    <div class="activity-list">
  `;
  
  logs.forEach(log => {
    const time = new Date(log.timestamp).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
    
    const icon = log.action === 'LOGIN' ? 'sign-in-alt' :
                 log.action.includes('UPDATE') ? 'edit' :
                 log.action === 'ADD_KAVLING' ? 'plus-circle' :
                 log.action === 'EXPORT_REPORT' ? 'file-export' : 'info-circle';
    
    html += `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${log.description || log.action}</div>
          <div class="activity-details">
            ${log.kavling ? `<span class="activity-kavling">${log.kavling}</span>` : ''}
            ${log.user ? `<span class="activity-user">${log.user}</span>` : ''}
            <span class="activity-time">${time}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// ========== SETUP EVENT LISTENER DINAMIS ==========
function setupDynamicEventListeners() {
  console.log('Setting up dynamic event listeners...');
    // Setup admin event listeners
  setupAdminEventListeners();
  
  // 1. Tombol "Tambah Kavling" di semua halaman
  document.querySelectorAll('.btn-add-kavling').forEach(btn => {
    btn.addEventListener('click', handleAddKavling);
  });
  
  // 2. Tombol Submit di modal tambah kavling
  const submitNewKavlingBtn = document.getElementById('submitNewKavling');
  if (submitNewKavlingBtn) {
    submitNewKavlingBtn.addEventListener('click', submitNewKavling);
  }
  
  // 3. Tombol close modal tambah kavling
  const closeAddKavlingBtn = document.getElementById('closeAddKavling');
  if (closeAddKavlingBtn) {
    closeAddKavlingBtn.addEventListener('click', function() {
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'none';
    });
  }
  
  // 4. Close modal dengan klik di luar
  const addKavlingModal = document.getElementById('addKavlingModal');
  if (addKavlingModal) {
    addKavlingModal.addEventListener('click', function(e) {
      if (e.target === addKavlingModal) {
        addKavlingModal.style.display = 'none';
      }
    });
  }
  
  // 5. Tombol "Sinkronkan Data" di semua halaman
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', syncData);
  });
  
  // 6. Tombol "Kembali ke Menu Awal & Logout" di semua halaman
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (confirm('Apakah Anda yakin ingin logout?')) {
        clearSession();
        goBack();
        
        // Reset button text to default
        document.querySelectorAll('.role-btn h3').forEach(el => {
          const role = el.closest('.role-btn').getAttribute('data-role');
          el.textContent = defaultDisplayNames[role] || role;
        });
        
        showProgressMessage('info', 'Anda telah logout');
      }
    });
  });
  
  // 7. Tombol "Simpan Tahap" di semua halaman
  document.querySelectorAll('.btn-save-section').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const section = btn.closest('.progress-section');
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
    });
  });
  
  // 8. Tombol search kavling (dropdown change)
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
      selectElement.addEventListener('change', searchKavling);
    }
  });
  
  // 9. Checkbox change listener for progress
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task')) {
      const page = e.target.closest('.page-content');
      if (page) {
        updateProgress(page.id);
        
        // Visual feedback for completion
        const label = e.target.closest('label');
        if (label) {
          if (e.target.checked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    }
  });
  
  // 10. Enter key pada form tambah kavling
  document.addEventListener('keypress', function(e) {
    if (e.target.id === 'newKavlingName' && e.key === 'Enter') {
      submitNewKavling();
    } else if (e.target.id === 'newKavlingLT' && e.key === 'Enter') {
      document.getElementById('newKavlingLB').focus();
    } else if (e.target.id === 'newKavlingLB' && e.key === 'Enter') {
      submitNewKavling();
    }
  });
  
  console.log('Dynamic event listeners setup complete');
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  
  // Setup semua event listener dinamis
  setupDynamicEventListeners();
  
  // Check saved session
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  
  if (savedRole && savedName) {
    document.querySelectorAll(`[data-role="${savedRole}"] h3`).forEach(el => {
      el.textContent = savedName;
    });
    
    updateDashboardTitle(savedRole, savedName);
    
    showPage(savedRole);
  }
  
  // Role button click
  document.addEventListener('click', function(e) {
    const roleBtn = e.target.closest('.role-btn');
    if (roleBtn) {
      currentRole = roleBtn.getAttribute('data-role');
      
      const modal = document.getElementById('passwordModal');
      if (modal && currentRole) {
        const title = modal.querySelector('h2#modalTitle');
        if (title) {
          const displayName = defaultDisplayNames[currentRole] || currentRole;
          title.textContent = 'Login sebagai ' + displayName;
        }
        
        modal.style.display = 'flex';
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) errorMsg.textContent = '';
      }
    }
  });
  
  // Submit password
  const submitBtn = document.getElementById('submitPassword');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleLogin);
  }
  
  // Enter key in password
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && submitBtn) {
        submitBtn.click();
      }
    });
  }
  
  // Close modal by clicking outside
  const passwordModal = document.getElementById('passwordModal');
  if (passwordModal) {
    passwordModal.addEventListener('click', function(e) {
      if (e.target === passwordModal) {
        passwordModal.style.display = 'none';
        currentRole = null;
      }
    });
  }

  // Admin Tab Switching
  document.addEventListener('click', function(e) {
    const tabBtn = e.target.closest('.admin-tab-btn');
    if (tabBtn) {
      const tabId = tabBtn.getAttribute('data-tab');
      
      // Update active tab
      document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#94a3b8';
        btn.style.borderBottom = 'none';
      });
      tabBtn.classList.add('active');
      tabBtn.style.color = 'white';
      tabBtn.style.borderBottom = '3px solid #38bdf8';
      
      // Show corresponding content
      document.querySelectorAll('.tab-content-item').forEach(content => {
        content.style.display = 'none';
      });
      const targetContent = document.getElementById('tab-' + tabId);
      if (targetContent) targetContent.style.display = 'block';
      
      // Load data for tab
      if (tabId === 'users') {
        loadUsersForAdmin();
      } else if (tabId === 'reports') {
        loadSummaryReport();
        loadActivityLog();
      }
    }
  });
  
  // Initialize mobile enhancements
  initializeMobileEnhancements();
});

// ========== ADMIN FUNCTIONS ==========
async function loadUsersForAdmin() {
  try {
    showGlobalLoading('Memuat data pengguna...');
    
    const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
      action: 'getUsers'
    });
    
    if (result.success && result.users) {
      displayUsersForAdmin(result.users);
    } else {
      showProgressMessage('error', result.message || 'Gagal memuat data pengguna');
    }
    
  } catch (error) {
    console.error('Error loading users:', error);
    showProgressMessage('error', 'Gagal memuat data pengguna');
  } finally {
    hideGlobalLoading();
  }
}

function displayUsersForAdmin(users) {
  const container = document.getElementById('usersListContainer');
  if (!container) {
    console.error('Container usersListContainer tidak ditemukan');
    return;
  }
  
  if (!users || users.length === 0) {
    container.innerHTML = '<p class="no-data">Tidak ada data pengguna</p>';
    return;
  }
  
  let html = `
    <div class="users-header">
      <h4><i class="fas fa-users"></i> Daftar Pengguna</h4>
      <span class="users-count">${users.length} pengguna</span>
    </div>
    <div class="users-list">
  `;
  
  users.forEach(user => {
    const roleName = defaultDisplayNames[user.role] || user.role;
    
    html += `
      <div class="user-item">
        <div class="user-info">
          <div class="user-role">
            <span class="role-name">${roleName}</span>
            <span class="role-code">(${user.role})</span>
          </div>
          <div class="user-name">
            <i class="fas fa-user"></i> ${user.displayName || '-'}
          </div>
          <div class="user-password">
            <i class="fas fa-key"></i> ${user.password ? '••••••••' : 'Tidak ada'}
          </div>
          <div class="user-id">
            <i class="fas fa-hashtag"></i> Baris: ${user.id}
          </div>
        </div>
        <div class="user-actions">
          <button class="btn-edit-user" onclick="handleEditUser('${user.role.replace(/'/g, "\\'")}', '${(user.displayName || '').replace(/'/g, "\\'")}')">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// Fungsi untuk handle klik tombol Edit
function handleEditUser(role, currentName) {
  console.log('Edit user clicked:', role, currentName);
  
  // Decode jika ada escape characters
  const decodedName = currentName.replace(/\\'/g, "'");
  
  // Panggil fungsi untuk menampilkan modal
  showEditUserModal(role, decodedName);
}

function showEditUserModal(role, currentName) {
  console.log('Showing edit modal for:', role, currentName);
  
  const modal = document.getElementById('editUserModal');
  if (!modal) {
    console.error('Modal editUserModal tidak ditemukan');
    return;
  }
  
  const roleName = defaultDisplayNames[role] || role;
  
  // Update modal content
  const roleDisplay = document.getElementById('editUserRole');
  const nameInput = document.getElementById('editUserName');
  const passwordInput = document.getElementById('editUserPassword');
  
  if (roleDisplay) roleDisplay.textContent = roleName;
  if (nameInput) nameInput.value = currentName || '';
  if (passwordInput) passwordInput.value = '';
  
  // Store data in modal for saving
  modal.setAttribute('data-role', role);
  modal.setAttribute('data-original-name', currentName || '');
  
  // Show modal
  modal.style.display = 'flex';
  
  // Focus on name input
  setTimeout(() => {
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }, 100);
}

// Fungsi untuk menutup modal edit user
function closeEditUserModal() {
  const modal = document.getElementById('editUserModal');
  if (modal) {
    modal.style.display = 'none';
    modal.removeAttribute('data-role');
    modal.removeAttribute('data-original-name');
  }
}

async function saveUserChanges() {
  const modal = document.getElementById('editUserModal');
  if (!modal) {
    showProgressMessage('error', 'Modal tidak ditemukan');
    return;
  }
  
  const role = modal.getAttribute('data-role');
  const originalName = modal.getAttribute('data-original-name') || '';
  const nameInput = document.getElementById('editUserName');
  const passwordInput = document.getElementById('editUserPassword');
  
  if (!nameInput || !passwordInput) {
    showProgressMessage('error', 'Form input tidak ditemukan');
    return;
  }
  
  const newName = nameInput.value.trim();
  const newPassword = passwordInput.value.trim();
  
  console.log('Saving user changes:', {
    role,
    originalName,
    newName,
    passwordChanged: !!newPassword
  });
  
  // Validasi
  if (!role) {
    showProgressMessage('error', 'Role tidak ditemukan');
    return;
  }
  
  if (!newName) {
    showProgressMessage('error', 'Nama tidak boleh kosong');
    nameInput.focus();
    return;
  }
  
  // Jika tidak ada perubahan
  if (newName === originalName && !newPassword) {
    showProgressMessage('info', 'Tidak ada perubahan yang disimpan');
    closeEditUserModal();
    return;
  }
  
  // Konfirmasi
  const confirmMessage = `Apakah Anda yakin ingin mengubah data ${role}?\n\nNama: ${originalName || '(kosong)'} → ${newName}\n${newPassword ? 'Password akan diubah' : 'Password tidak diubah'}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  const saveButton = document.getElementById('saveUserChangesBtn');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
  }
  
  try {
    showGlobalLoading('Menyimpan perubahan pengguna...');
    
    const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
      action: 'updateUser',
      role: role,
      displayName: newName,
      password: newPassword
    });
    
    console.log('Save user result:', result);
    
    if (result.success) {
      showProgressMessage('success', result.message || 'Perubahan berhasil disimpan');
      
      // Close modal
      closeEditUserModal();
      
      // Refresh user list setelah 1 detik
      setTimeout(() => {
        loadUsersForAdmin();
        
        // Jika user yang sedang login diubah, update session
        const loggedRole = sessionStorage.getItem('loggedRole');
        if (loggedRole === role) {
          sessionStorage.setItem('loggedDisplayName', newName);
          
          // Update UI jika sedang di halaman yang sesuai
          if (currentRole === role) {
            updateDashboardTitle(role, newName);
            document.querySelectorAll(`[data-role="${role}"] h3`).forEach(el => {
              el.textContent = newName;
            });
          }
        }
      }, 1000);
      
    } else {
      showProgressMessage('error', result.message || 'Gagal menyimpan perubahan');
    }
    
  } catch (error) {
    console.error('Error saving user changes:', error);
    showProgressMessage('error', 'Gagal menyimpan perubahan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan';
    }
    hideGlobalLoading();
  }
}

// Setup admin event listeners
function setupAdminEventListeners() {
  console.log('Setting up admin event listeners...');
  
  // Close edit user modal button
  const closeEditUserBtn = document.getElementById('closeEditUserBtn');
  if (closeEditUserBtn) {
    closeEditUserBtn.addEventListener('click', closeEditUserModal);
  }
  
  // Another close button if exists
  const closeEditUserBtn2 = document.getElementById('closeEditUserBtn2');
  if (closeEditUserBtn2) {
    closeEditUserBtn2.addEventListener('click', closeEditUserModal);
  }
  
  // Close modal by clicking outside
  const editUserModal = document.getElementById('editUserModal');
  if (editUserModal) {
    editUserModal.addEventListener('click', function(e) {
      if (e.target === editUserModal) {
        closeEditUserModal();
      }
    });
  }
  
  // Save user changes button
  const saveUserChangesBtn = document.getElementById('saveUserChangesBtn');
  if (saveUserChangesBtn) {
    saveUserChangesBtn.addEventListener('click', saveUserChanges);
  }
  
  // Enter key in edit user form
  document.addEventListener('keypress', function(e) {
    if (e.target.id === 'editUserName' && e.key === 'Enter') {
      document.getElementById('editUserPassword').focus();
    } else if (e.target.id === 'editUserPassword' && e.key === 'Enter') {
      saveUserChanges();
    }
  });
  
  console.log('Admin event listeners setup complete');
}

// ========== MOBILE ENHANCEMENTS ==========
function initializeMobileEnhancements() {
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Improve touch targets
    document.querySelectorAll('button, input[type="checkbox"], label, select').forEach(el => {
      if (!el.style.minHeight) {
        el.style.minHeight = '44px';
      }
    });
    
    // Prevent zoom on input focus
    document.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('focus', function() {
        this.style.fontSize = '16px';
      });
    });
  }
  
  // Handle viewport for mobile
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta && window.innerWidth <= 768) {
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
}

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

window.clearAllData = function() {
  if (confirm('Hapus semua data session lokal?')) {
    clearSession();
    localStorage.clear();
    sessionStorage.clear();
    showProgressMessage('success', 'Data lokal berhasil dihapus');
    location.reload();
  }
};

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
  .task-completed {
    background-color: rgba(16, 185, 129, 0.1) !important;
    border-left: 3px solid #10b981 !important;
  }
  
  .progress-high { color: #10b981; font-weight: bold; }
  .progress-medium { color: #f59e0b; }
  .progress-low { color: #3b82f6; }
  .progress-very-low { color: #94a3b8; }
  
  .bar-high { background-color: #10b981 !important; }
  .bar-medium { background-color: #f59e0b !important; }
  .bar-low { background-color: #3b82f6 !important; }
  .bar-very-low { background-color: #94a3b8 !important; }
  
  .shake-animation {
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  /* Summary Report Styles */
  .summary-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .summary-header h3 {
    color: #1e293b;
    margin-bottom: 5px;
  }
  
  .summary-timestamp {
    color: #64748b;
    font-size: 0.9rem;
  }
  
  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .stat-icon {
    font-size: 1.5rem;
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-total .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .stat-completed .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .stat-almost .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  .stat-progress .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
  .stat-low .stat-icon { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1e293b;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #64748b;
  }
  
  .stat-percent {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 2px;
  }
  
  .summary-section {
    margin-top: 25px;
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .summary-section h4 {
    color: #1e293b;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .kavling-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .kavling-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .kavling-rank {
    background: #3b82f6;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 15px;
  }
  
  .kavling-info {
    flex: 1;
  }
  
  .kavling-name {
    font-weight: 600;
    color: #1e293b;
  }
  
  .kavling-details {
    font-size: 0.9rem;
    color: #64748b;
    margin-top: 2px;
  }
  
  .kavling-progress {
    font-weight: bold;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
  }
  
  /* Activity Log Styles */
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .activity-count {
    background: #3b82f6;
    color: white;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 5px;
  }
  
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
  }
  
  .activity-icon {
    color: #3b82f6;
    font-size: 1.2rem;
    margin-top: 2px;
  }
  
  .activity-title {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
  }
  
  .activity-details {
    display: flex;
    gap: 10px;
    font-size: 0.85rem;
    color: #64748b;
    flex-wrap: wrap;
  }
  
  .activity-kavling, .activity-user, .activity-time {
    background: #e2e8f0;
    padding: 2px 8px;
    border-radius: 4px;
  }
  
  /* Users List Styles */
  .users-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .users-count {
    background: #10b981;
    color: white;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
  }
  
  .users-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .user-role {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }
  
  .user-name {
    color: #475569;
    font-size: 0.95rem;
  }
  
  .user-id {
    color: #94a3b8;
    font-size: 0.8rem;
    margin-top: 2px;
  }
  
  .btn-edit-user {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  
  .btn-edit-user:hover {
    background: #2563eb;
  }
  
  .no-data {
    text-align: center;
    color: #94a3b8;
    font-style: italic;
    padding: 30px;
  }
`;
document.head.appendChild(style);
