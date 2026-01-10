// script.js - VERSI DIPERBAIKI DENGAN FUNGSI BARU
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX_CGCCi7omTBhHc-0PCHnmmVE4rGFwmVbPav5gvSXE41EaF5-US8aFkRBHXmnwuVZzg/exec';

let currentRole = null;
let selectedKavling = null;
let currentKavlingData = null;

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

// ========== TOAST NOTIFICATION ==========
function showToast(type, message) {
  // Hapus toast sebelumnya
  const existingToast = document.getElementById('globalToast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.id = 'globalToast';
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
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

function getDataFromServer(url, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    window[callbackName] = function(data) {
      resolve(data);
      delete window[callbackName];
      
      const scriptId = 'script_' + callbackName;
      const scriptEl = document.getElementById(scriptId);
      if (scriptEl) scriptEl.remove();
    };
    
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
      showToast('error', 'Dropdown kavling tidak ditemukan!');
      return;
    }
    
    const kavlingName = selectElement.value.trim();
    
    if (!kavlingName) {
      showToast('warning', 'Pilih kavling terlebih dahulu dari dropdown!');
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
      
      const ltLb = extractLTandLB(data.tipe);
      currentKavlingData.lt = ltLb.lt;
      currentKavlingData.lb = ltLb.lb;
      
      updateKavlingInfo(data, rolePage);
      
      if (currentRole !== 'manager') {
        loadProgressData(data.data);
      }
      
      // ===== PERBAIKAN DI SINI =====
      if (currentRole === 'manager') {
        // Load catatan untuk kavling yang dipilih
        loadPropertyNotes(kavlingName);
        
        // Update badge kavling
        updateKavlingBadge(kavlingName);
        
        // Jika di tab reports, load laporan
        const activeTab = document.querySelector('#managerPage .admin-tab-btn.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'reports') {
          setTimeout(() => {
            loadSummaryReport();
          }, 500);
        }
      }
      // ========================
      
      showToast('success', `Data ${kavlingName} berhasil dimuat!`);
      
    } else {
      showToast('error', data.message || 'Kavling tidak ditemukan');
      selectElement.value = '';
    }
    
  } catch (error) {
    console.error('Error dalam searchKavling:', error);
    showToast('error', 'Gagal mengambil data: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

function extractLTandLB(tipeString) {
  if (!tipeString || tipeString === '-' || tipeString === '/') {
    return { lt: "", lb: "" };
  }
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
  
  if (role === 'manager') {
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
    `;
  } else {
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
}

// ========== MANAGER NOTES FUNCTIONS ==========
async function loadPropertyNotes(kavlingName = null) {
  const targetKavling = kavlingName || selectedKavling;
  
  if (!targetKavling) {
    // Reset notes jika tidak ada kavling yang dipilih
    const notesEl = document.getElementById('propertyNotesManager');
    if (notesEl) {
      notesEl.value = '';
      notesEl.placeholder = 'Pilih kavling terlebih dahulu untuk melihat catatan';
    }
    return;
  }
  
  const notesEl = document.getElementById('propertyNotesManager');
  if (!notesEl) return;
  
  try {
    // Tampilkan loading state
    const originalPlaceholder = notesEl.placeholder;
    notesEl.placeholder = 'Memuat catatan...';
    notesEl.disabled = true;
    
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getPropertyNotes',
      kavling: targetKavling
    });
    
    notesEl.disabled = false;
    
    if (result.success) {
      notesEl.value = result.notes || '';
      notesEl.placeholder = 'Masukkan catatan kondisi property di sini...';
      
      // Update character counter
      updateNotesCounter(notesEl.value.length);
      
    } else {
      notesEl.value = '';
      notesEl.placeholder = 'Tidak ada catatan untuk kavling ini';
    }
  } catch (error) {
    console.error('Error loading property notes:', error);
    const notesEl = document.getElementById('propertyNotesManager');
    if (notesEl) {
      notesEl.value = '';
      notesEl.placeholder = 'Gagal memuat catatan. Coba lagi.';
      notesEl.disabled = false;
    }
  }
}

function updateKavlingBadge(kavlingName) {
  const badge = document.getElementById('currentKavlingBadge');
  if (badge) {
    badge.textContent = kavlingName;
  } else {
    // Create badge jika belum ada
    const notesHeader = document.querySelector('.notes-section h3');
    if (notesHeader && kavlingName) {
      const badge = document.createElement('span');
      badge.id = 'currentKavlingBadge';
      badge.style.cssText = 'background: #38bdf8; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin-left: 10px;';
      badge.textContent = kavlingName;
      notesHeader.appendChild(badge);
    }
  }
}

function updateNotesCounter(charCount) {
  let counter = document.getElementById('notesCharCounter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'notesCharCounter';
    counter.style.cssText = 'font-size: 0.8rem; color: #94a3b8; text-align: right; margin-top: 5px;';
    
    const notesSection = document.querySelector('.notes-section');
    if (notesSection) {
      const saveBtn = notesSection.querySelector('.btn-save-section');
      if (saveBtn) {
        notesSection.insertBefore(counter, saveBtn);
      } else {
        notesSection.appendChild(counter);
      }
    }
  }
  
  counter.textContent = `${charCount} karakter`;
  
  // Warn jika terlalu panjang
  if (charCount > 1000) {
    counter.style.color = '#f59e0b';
  } else if (charCount > 2000) {
    counter.style.color = '#f43f5e';
  } else {
    counter.style.color = '#94a3b8';
  }
}

async function savePropertyNotes() {
  if (!selectedKavling) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const notesEl = document.getElementById('propertyNotesManager');
  const saveBtn = document.querySelector('#tab-notes .btn-save-section');
  if (!notesEl) return;
  
  const notes = notesEl.value.trim();
  
  // Simpan draft ke localStorage
  if (selectedKavling) {
    localStorage.setItem(`notes_draft_${selectedKavling}`, notes);
  }
  
  const ltLb = currentKavlingData ? extractLTandLB(currentKavlingData.tipe) : {lt: '', lb: ''};
  const totalProgress = currentKavlingData?.data?.totalProgress || '0%';
  
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveBtn.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'savePropertyNotes',
      kavling: selectedKavling,
      notes: notes,
      data: {
        'LT': ltLb.lt,
        'LB': ltLb.lb,
        'Persentase Keseluruhan': totalProgress
      },
      user: currentRole || 'manager'
    });
    
    if (result.success) {
      showToast('success', `Catatan untuk ${selectedKavling} berhasil disimpan!`);
      
      // Update counter
      updateNotesCounter(notes.length);
      
      // Hapus draft dari localStorage setelah sukses save
      localStorage.removeItem(`notes_draft_${selectedKavling}`);
      
    } else {
      showToast('error', result.message || 'Gagal menyimpan catatan');
    }
  } catch (error) {
    console.error('Error saving property notes:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Catatan';
      saveBtn.disabled = false;
    }
  }
}

// ========== PROGRESS FUNCTIONS ==========
function loadProgressData(progressData) {
  if (!progressData) return;
  
  const rolePage = currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  if (progressData.tahap1) {
    Object.keys(progressData.tahap1).forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
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

  if (progressData.keterangan) {
    const commentEl = pageElement.querySelector('.progress-section[data-tahap="3"] .tahap-comments');
    if (commentEl) {
      commentEl.value = progressData.keterangan;
    }
  }
    
  updateTotalProgressDisplay(progressData.totalProgress || '0%', rolePage);
  updateProgress(rolePage);
}

function findCheckboxByTaskName(taskName, tahap, pageId) {
  const checkboxes = document.querySelectorAll(`#${pageId} .progress-section[data-tahap="${tahap}"] .sub-task`);
  
  for (let checkbox of checkboxes) {
    const label = checkbox.closest('label');
    if (label) {
      const labelText = label.textContent.trim();
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

function updateProgress(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;

  const sections = page.querySelectorAll('.progress-section.detailed');
  let totalTasks = 0;
  let completedTasks = 0;

  sections.forEach(section => {
    const checkboxes = section.querySelectorAll('.sub-task');
    const subPercentEl = section.querySelector('.sub-percent');
    const progressBar = section.querySelector('.progress-fill');
    
    let sectionTotal = checkboxes.length;
    let sectionCompleted = 0;

    checkboxes.forEach(cb => {
      if (cb.checked) sectionCompleted++;
    });

    const sectionPercent = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0;
    
    if (subPercentEl) subPercentEl.textContent = sectionPercent + '%';
    if (progressBar) progressBar.style.width = sectionPercent + '%';

    totalTasks += sectionTotal;
    completedTasks += sectionCompleted;
  });

  const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  updateTotalProgressDisplay(overallPercent + '%', pageId);
}

// ========== SAVE FUNCTIONS ==========
async function saveTahap1() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
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
      data: tahapData,
      user: currentRole
    });
    
    if (result.success) {
      showToast('success', result.message);
      if (currentKavlingData.data) {
        Object.keys(tahapData).forEach(taskName => {
          if (currentKavlingData.data.tahap1 && currentKavlingData.data.tahap1[taskName] !== undefined) {
            currentKavlingData.data.tahap1[taskName] = tahapData[taskName];
          }
        });
      }
      updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 1');
    }
  } catch (error) {
    console.error('Error saving tahap 1:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 1';
      saveButton.disabled = false;
    }
  }
}

async function saveTahap2() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
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
      data: tahapData,
      user: currentRole
    });
    
    if (result.success) {
      showToast('success', result.message);
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
      showToast('error', result.message || 'Gagal menyimpan tahap 2');
    }
  } catch (error) {
    console.error('Error saving tahap 2:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 2';
      saveButton.disabled = false;
    }
  }
}

async function saveTahap3() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap3Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="3"]`);
  if (!tahap3Section) return;
  
  const checkboxes = tahap3Section.querySelectorAll('.sub-task');
  const commentEl = tahap3Section.querySelector('.tahap-comments');
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

  if (commentEl) tahapData["Keterangan"] = commentEl.value;
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap3',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });
    
    if (result.success) {
      showToast('success', result.message);
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap3) currentKavlingData.data.tahap3 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'Keterangan') {
            currentKavlingData.data.tahap3[taskName] = tahapData[taskName];
          }
        });
        if (tahapData["Keterangan"]) currentKavlingData.data.keterangan = tahapData["Keterangan"];
      }
      updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 3');
    }
  } catch (error) {
    console.error('Error saving tahap 3:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 3';
      saveButton.disabled = false;
    }
  }
}

// ========== SUMMARY REPORT FUNCTIONS ==========
async function loadSummaryReport() {
  try {
    showGlobalLoading('Mengambil laporan summary...');
    
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getSummaryReport'
    });
    
    if (result.success) {
      displaySummaryReport(result);
    } else {
      showToast('error', result.message || 'Gagal mengambil laporan');
    }
    
  } catch (error) {
    console.error('Error loading summary report:', error);
    showToast('error', 'Gagal mengambil laporan');
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

// ========== ADMIN FUNCTIONS ==========
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

async function loadUsersForAdmin() {
  try {
    showGlobalLoading('Memuat data pengguna...');
    
    const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
      action: 'getUsers'
    });
    
    if (result.success && result.users) {
      displayUsersForAdmin(result.users);
    } else {
      showToast('error', result.message || 'Gagal memuat data pengguna');
    }
    
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('error', 'Gagal memuat data pengguna');
  } finally {
    hideGlobalLoading();
  }
}

function displayUsersForAdmin(users) {
  const container = document.getElementById('usersListContainer');
  if (!container) return;
  
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
          <button class="btn-edit-user" onclick="handleEditUser('${user.role}', '${user.displayName}', '${user.id}')">
            <i class="fas fa-user-edit"></i> Edit
          </button>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// ========== TAMBAH KAVLING BARU ==========
async function submitNewKavling() {
  const nameInput = document.getElementById('newKavlingName');
  const ltInput = document.getElementById('newKavlingLT');
  const lbInput = document.getElementById('newKavlingLB');
  const submitBtn = document.getElementById('submitNewKavling');
  
  if (!nameInput || !ltInput || !lbInput) return;
  
  const kavlingName = nameInput.value.trim();
  const lt = ltInput.value.trim();
  const lb = lbInput.value.trim();
  
  if (!kavlingName) {
    showToast('error', 'Nama kavling harus diisi');
    nameInput.focus();
    return;
  }
  
  // Validasi format kavling
  if (!kavlingName.match(/^[A-Za-z0-9]+_[A-Za-z0-9]+$/)) {
    showToast('error', 'Format kavling tidak valid. Gunakan format: Blok_Nomor (contoh: M1_11)');
    nameInput.focus();
    return;
  }
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    submitBtn.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'addNewKavling',
      kavling: kavlingName,
      lt: lt || '',
      lb: lb || '',
      createdBy: currentRole || 'admin'
    });
    
    if (result.success) {
      showToast('success', result.message);
      
      // Reset form
      nameInput.value = '';
      ltInput.value = '';
      lbInput.value = '';
      
      // Tutup modal
      document.getElementById('addKavlingModal').style.display = 'none';
      
      // Refresh daftar kavling
      setTimeout(loadKavlingList, 1000);
      
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

// ========== LOGIN & SESSION ==========
async function handleLogin() {
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitPassword');
  
  if (!passwordInput || !currentRole) return;
  
  const password = passwordInput.value.trim();
  if (!password) {
    if (errorMsg) errorMsg.textContent = 'Password harus diisi!';
    showToast('warning', 'Password harus diisi');
    return;
  }
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';
  }
  
  try {
    const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
      action: 'login',
      role: currentRole,
      password: password
    });
    
    if (result.success) {
      sessionStorage.setItem('loggedRole', currentRole);
      sessionStorage.setItem('loggedDisplayName', result.displayName);
      sessionStorage.setItem('loginTime', new Date().toISOString());
      
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = result.displayName;
      });
      
      updateDashboardTitle(currentRole, result.displayName);
      
      const modal = document.getElementById('passwordModal');
      if (modal) modal.style.display = 'none';
      
      showToast('success', `Login berhasil sebagai ${result.displayName}`);
      showPage(currentRole);
      
    } else {
      if (errorMsg) errorMsg.textContent = result.message || 'Password salah!';
      showToast('error', 'Password salah');
      passwordInput.value = '';
      passwordInput.focus();
    }
    
  } catch (error) {
    console.error('Login error:', error);
    if (errorMsg) errorMsg.textContent = 'Gagal menghubungi server';
    showToast('error', 'Gagal menghubungi server');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Masuk';
    }
  }
}

function updateDashboardTitle(role, name) {
  const titleIds = {
    'user1': 'user1Title',
    'user2': 'user2Title',
    'user3': 'user3Title',
    'user4': 'user4Title',
    'manager': 'managerTitle',
    'admin': 'adminTitle'
  };
  
  const el = document.getElementById(titleIds[role]);
  if (el) {
    const prefix = role === 'manager' ? 'Dashboard' : (role === 'admin' ? 'Panel' : 'Dashboard');
    el.textContent = `${prefix} ${name}`;
  }
}

function showPage(role) {
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });
  
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
    pageElement.setAttribute('aria-hidden', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const savedName = sessionStorage.getItem('loggedDisplayName');
    if (savedName) updateDashboardTitle(role, savedName);
    
    updateProgress(role + 'Page');
    
    if (role === 'admin') {
      setTimeout(() => {
        loadUsersForAdmin();
        setupAdminTabs();
      }, 500);
    } else if (role === 'manager') {
      setTimeout(() => {
        loadKavlingList();
        setupManagerTabs();
      }, 500);
    } else {
      setTimeout(loadKavlingList, 500);
    }
  }
}

function goBack() {
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  
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
}

// ========== SYNC & SETUP ==========
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
    
    if (selectedKavling) {
      const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
        action: 'getKavlingData',
        kavling: selectedKavling
      });
      
      if (data.success) {
        currentKavlingData = data;
        loadProgressData(data.data);
        showToast('success', 'Data berhasil disinkronisasi!');
      }
    } else {
      showToast('info', 'Pilih kavling terlebih dahulu untuk sinkronisasi data');
    }
  } catch (error) {
    console.error('Sync error:', error);
    showToast('error', 'Gagal sinkronisasi data');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
    }
    hideGlobalLoading();
  }
}

// ========== TAB FUNCTIONS ==========
function setupManagerTabs() {
  const tabBtns = document.querySelectorAll('#managerPage .admin-tab-btn');
  const tabContents = document.querySelectorAll('#managerPage .tab-content-item');
  
  // Set active tab pertama kali
  if (tabBtns.length > 0 && !document.querySelector('#managerPage .admin-tab-btn.active')) {
    tabBtns[0].classList.add('active');
    const firstTabId = tabBtns[0].getAttribute('data-tab');
    const firstTab = document.getElementById(`tab-${firstTabId}`);
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
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        
        // Load data sesuai tab
        if (tabId === 'reports') {
          setTimeout(loadSummaryReport, 100);
        } else if (tabId === 'notes' && selectedKavling) {
          // Load notes jika ada kavling yang dipilih
          loadPropertyNotes(selectedKavling);
        }
      }
    });
  });
}

function setupAdminTabs() {
  const tabBtns = document.querySelectorAll('#adminPage .admin-tab-btn');
  const tabContents = document.querySelectorAll('#adminPage .tab-content-item');
  
  // Set active tab pertama kali
  if (tabBtns.length > 0 && !document.querySelector('#adminPage .admin-tab-btn.active')) {
    tabBtns[0].classList.add('active');
    const firstTabId = tabBtns[0].getAttribute('data-tab');
    const firstTab = document.getElementById(`tab-${firstTabId}-admin`);
    if (firstTab) firstTab.classList.add('active');
  }
  
  // Tambahkan tombol sync di tab laporan admin
  const adminButtons = document.getElementById('adminButtons');
  
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
        
        // Jika tab laporan, load report dan tambahkan tombol sync
        if (tabId === 'reports') {
          setTimeout(loadSummaryReport, 100);
          
          // Tambahkan tombol sync jika belum ada
          if (!document.querySelector('#adminButtons .sync-btn')) {
            const syncBtn = document.createElement('button');
            syncBtn.className = 'sync-btn combined-btn';
            syncBtn.type = 'button';
            syncBtn.style.cssText = 'background: linear-gradient(135deg, #f59e0b, #d97706); padding:8px 12px; border-radius:10px; color:white; border:none; font-weight:700; font-size: 0.9rem; cursor: pointer;';
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
            syncBtn.addEventListener('click', syncData);
            adminButtons.appendChild(syncBtn);
          }
        } else {
          // Hapus tombol sync jika ada
          const existingSyncBtn = document.querySelector('#adminButtons .sync-btn');
          if (existingSyncBtn) {
            existingSyncBtn.remove();
          }
        }
        
        // Load data sesuai tab
        if (tabId === 'users') {
          setTimeout(loadUsersForAdmin, 100);
        } else if (tabId === 'activity') {
          setTimeout(loadActivityLog, 100);
        }
      }
    });
  });
}

// ========== SETUP EVENT LISTENERS ==========
function setupDynamicEventListeners() {
  // Tombol tambah kavling
  document.querySelectorAll('.btn-add-kavling').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'flex';
    });
  });
  
  // Tombol submit tambah kavling
  const submitNewKavlingBtn = document.getElementById('submitNewKavling');
  if (submitNewKavlingBtn) {
    submitNewKavlingBtn.addEventListener('click', submitNewKavling);
  }
  
  // Tombol sync
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', syncData);
  });
  
  // Tombol logout
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (confirm('Apakah Anda yakin ingin logout?')) {
        clearSession();
        goBack();
      }
    });
  });
  
  // Tombol save catatan manager
  const managerSaveNotesBtn = document.querySelector('#tab-notes .btn-save-section');
  if (managerSaveNotesBtn) {
    managerSaveNotesBtn.addEventListener('click', savePropertyNotes);
  }

  // Tombol save tahap progress
  document.querySelectorAll('.btn-save-section:not(#tab-notes .btn-save-section)').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const section = btn.closest('.progress-section');
      if (section) {
        const tahap = section.getAttribute('data-tahap');
        if (tahap === '1') saveTahap1();
        else if (tahap === '2') saveTahap2();
        else if (tahap === '3') saveTahap3();
      }
    });
  });
  
  // Dropdown kavling
  const selectIds = ['searchKavlingUser1', 'searchKavlingUser2', 'searchKavlingUser3', 'searchKavlingUser4', 'searchKavlingManager'];
  selectIds.forEach(selectId => {
    const el = document.getElementById(selectId);
    if (el) el.addEventListener('change', searchKavling);
  });
  
  // Tombol close modal
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  // Tutup modal ketika klik di luar konten modal
  window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Enter key untuk password input
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }
  
  // Auto-save draft untuk notes
  const notesTextarea = document.getElementById('propertyNotesManager');
  if (notesTextarea) {
    let saveDraftTimeout;
    notesTextarea.addEventListener('input', function() {
      clearTimeout(saveDraftTimeout);
      saveDraftTimeout = setTimeout(() => {
        if (selectedKavling && this.value.trim() !== '') {
          localStorage.setItem(`notes_draft_${selectedKavling}`, this.value);
        }
      }, 1000);
    });
  }
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', function() {
  setupDynamicEventListeners();
  
  const savedRole = sessionStorage.getItem('loggedRole');
  if (savedRole) {
    currentRole = savedRole;
    showPage(savedRole);
  }
  
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRole = btn.getAttribute('data-role');
      const modal = document.getElementById('passwordModal');
      if (modal) {
        modal.style.display = 'flex';
        document.getElementById('passwordInput').focus();
      }
    });
  });
  
  const submitPasswordBtn = document.getElementById('submitPassword');
  if (submitPasswordBtn) {
    submitPasswordBtn.addEventListener('click', handleLogin);
  }
  
  // Checkbox event untuk update progress langsung
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task')) {
      const rolePage = currentRole + 'Page';
      updateProgress(rolePage);
    }
  });
});

// Fungsi untuk edit user (placeholder)
function handleEditUser(role, displayName, id) {
  showToast('info', 'Fitur edit pengguna akan segera hadir');
  console.log('Edit user:', { role, displayName, id });
}
