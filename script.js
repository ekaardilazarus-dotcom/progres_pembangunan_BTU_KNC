// script.js - VERSI DIPERBAIKI DENGAN EVENT LISTENER YANG BENAR
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfsrL9o9PnRsXYZFOb3yxSyUZZ33ZX3o1sR7dztJPNdmTZT1XXx767ZIenfWbhKfLDBA/exec';

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
    const kavlings = await getKavlingListFromServer();
    
    if (kavlings && kavlings.length > 0) {
      updateAllKavlingSelects(kavlings);
      console.log(`✅ Loaded ${kavlings.length} kavlings`);
      
      if (selectedKavling) {
        setTimeout(() => {
          setSelectedKavlingInDropdowns(selectedKavling);
        }, 100);
      }
    } else {
      console.log('❌ No kavlings found');
    }
    
  } catch (error) {
    console.error('❌ Error loading kavling list:', error);
    showProgressMessage('error', 'Gagal memuat daftar kavling');
  } finally {
    hideGlobalLoading();
  }
}

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
      document.getElementById('kavlingListScript')?.remove();
    };
    
    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=getKavlingList&callback=' + callbackName;
    
    const script = document.createElement('script');
    script.id = 'kavlingListScript';
    script.src = url;
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
    const aMatch = a.match(/([A-Z]+)(\d+)/);
    const bMatch = b.match(/([A-Z]+)(\d+)/);
    
    if (aMatch && bMatch) {
      if (aMatch[1] !== bMatch[1]) {
        return aMatch[1].localeCompare(bMatch[1]);
      }
      return parseInt(aMatch[2]) - parseInt(bMatch[2]);
    }
    return a.localeCompare(b);
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
    if (selectElement) {
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
    
    const data = await getKavlingDataFromServer(kavlingName);
    
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

function getKavlingDataFromServer(kavlingName) {
  return new Promise((resolve) => {
    const callbackName = 'kavlingDataCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      resolve(data);
      delete window[callbackName];
      document.getElementById('kavlingDataScript')?.remove();
    };
    
    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=getKavlingData&kavling=' + encodeURIComponent(kavlingName) + 
      '&callback=' + callbackName;
    
    const script = document.createElement('script');
    script.id = 'kavlingDataScript';
    script.src = url;
    document.body.appendChild(script);
  });
}

function extractLTandLB(tipeString) {
  if (!tipeString || tipeString === '-') return { lt: "", lb: "" };
  
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

  // Load keterangan
  if (progressData.keterangan) {
    const commentEl = pageElement.querySelector('.progress-section[data-tahap="3"] .tahap-comments');
    if (commentEl) commentEl.value = progressData.keterangan;
  }
    
  updateTotalProgressDisplay(progressData.totalProgress || '0%', rolePage);
  updateProgress(rolePage);
}

function findCheckboxByTaskName(taskName, tahap, pageId) {
  const checkboxes = document.querySelectorAll(`#${pageId} .progress-section[data-tahap="${tahap}"] .sub-task`);
  
  for (let checkbox of checkboxes) {
    const label = checkbox.closest('label');
    if (label) {
      const labelText = label.textContent.trim().toLowerCase();
      const searchTask = taskName.trim().toLowerCase();
      if (labelText.includes(searchTask) || searchTask.includes(labelText)) {
        return checkbox;
      }
    }
  }
  
  return null;
}

function updateTotalProgressDisplay(totalProgress, pageId) {
  const totalPercentElement = document.querySelector(`#${pageId} .total-percent`);
  const totalBarElement = document.querySelector(`#${pageId} .total-bar`);
  
  if (totalPercentElement) {
    totalPercentElement.textContent = totalProgress;
  }
  
  if (totalBarElement) {
    const percentMatch = totalProgress.match(/(\d+)%/);
    const percent = percentMatch ? parseInt(percentMatch[1]) : 0;
    totalBarElement.style.width = percent + '%';
  }
}

// ========== SAVE FUNCTIONS (TANPA LT/LB) ==========
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

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const result = await saveTahapDataToServer('saveTahap1', selectedKavling, tahapData);
    
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
      
      // Update progress display
      updateProgress(rolePage);
      
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

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  try {
    const result = await saveTahapDataToServer('saveTahap2', selectedKavling, tahapData);
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap2) currentKavlingData.data.tahap2 = {};
        Object.keys(tahapData).forEach(taskName => {
          currentKavlingData.data.tahap2[taskName] = tahapData[taskName];
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
    const result = await saveTahapDataToServer('saveTahap3', selectedKavling, tahapData);
    
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

function saveTahapDataToServer(action, kavling, data) {
  return new Promise((resolve) => {
    const callbackName = 'saveTahapCallback_' + Date.now();
    
    window[callbackName] = function(response) {
      resolve(response);
      delete window[callbackName];
      document.getElementById('saveTahapScript')?.remove();
    };
    
    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=' + action + 
      '&kavling=' + encodeURIComponent(kavling) + 
      '&data=' + encodeURIComponent(JSON.stringify(data)) + 
      '&callback=' + callbackName;
    
    const script = document.createElement('script');
    script.id = 'saveTahapScript';
    script.src = url;
    document.body.appendChild(script);
  });
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
  
  setTimeout(() => {
    messageContainer.style.display = 'none';
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

function verifyLogin(role, password) {
  return new Promise((resolve) => {
    const callbackName = 'loginCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      resolve(data);
      delete window[callbackName];
      document.getElementById('loginScript')?.remove();
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
      
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = displayName;
      });
      
      updateDashboardTitle(currentRole, displayName);
      
      sessionStorage.setItem('loggedRole', currentRole);
      sessionStorage.setItem('loggedDisplayName', displayName);
      
      showPage(currentRole);
      
    } else {
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
    
    const savedName = sessionStorage.getItem('loggedDisplayName');
    if (savedName) {
      updateDashboardTitle(role, savedName);
    }
    
    updateProgress(role + 'Page');
    
    if (role === 'admin') {
      setTimeout(() => {
        loadUsersForAdmin();
      }, 500);
    } else if (role.startsWith('user') || role === 'manager') {
      setTimeout(() => {
        loadKavlingList();
      }, 500);
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
  currentRole = null;
  selectedKavling = null;
  currentKavlingData = null;
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
    await loadKavlingList();
    
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

// ========== TOMBOL LAINNYA ==========
function handleAddKavling() {
  const modal = document.getElementById('addKavlingModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('newKavlingName').focus();
  }
}

function handleSaveNotes() {
  if (!selectedKavling || !currentRole) {
    showProgressMessage('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const notesTextarea = document.querySelector(`#${rolePage} #propertyNotesManager`);
  if (!notesTextarea) return;
  
  const notes = notesTextarea.value.trim();
  showProgressMessage('info', 'Catatan disimpan secara lokal');
  // Catatan: Simpan ke server jika diperlukan
}

// ========== ADD KAVLING FUNCTIONS ==========
async function handleAddKavling() {
  const modal = document.getElementById('addKavlingModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('newKavlingName').focus();
    
    // Reset form
    document.getElementById('newKavlingName').value = '';
    document.getElementById('newKavlingLT').value = '';
    document.getElementById('newKavlingLB').value = '';
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
  
  // Validasi format: harus mengandung blok dan nomor (contoh: M1_11, A_05)
  const namePattern = /^[A-Z]+\d*_\d+$/i;
  if (!namePattern.test(kavlingName)) {
    showProgressMessage('error', 'Format nama kavling salah. Contoh: M1_11, A_05');
    nameInput.focus();
    return;
  }
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menambahkan...';
    submitBtn.disabled = true;
  }
  
  try {
    showGlobalLoading('Menambahkan kavling baru...');
    
    const result = await addKavlingToServer(kavlingName, lt, lb);
    
    if (result.success) {
      showProgressMessage('success', result.message);
      
      // Tutup modal
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'none';
      
      // Refresh list kavling
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
      submitBtn.innerHTML = 'Simpan Kavling Baru';
      submitBtn.disabled = false;
    }
    hideGlobalLoading();
  }
}

function addKavlingToServer(name, lt, lb) {
  return new Promise((resolve) => {
    const callbackName = 'addKavlingCallback_' + Date.now();
    
    window[callbackName] = function(response) {
      resolve(response);
      delete window[callbackName];
      document.getElementById('addKavlingScript')?.remove();
    };
    
    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=addNewKavling' +
      '&name=' + encodeURIComponent(name) +
      '&lt=' + encodeURIComponent(lt) +
      '&lb=' + encodeURIComponent(lb) +
      '&callback=' + callbackName;
    
    const script = document.createElement('script');
    script.id = 'addKavlingScript';
    script.src = url;
    document.body.appendChild(script);
  });
}

// ========== UPDATE SETUP DYNAMIC EVENT LISTENERS ==========
function setupDynamicEventListeners() {
  console.log('Setting up dynamic event listeners...');
  
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
        } else {
          // Untuk manager save atau lainnya
          handleSaveNotes();
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
  
  // 9. Tombol Save di Admin (jika ada)
  const btnSaveUser = document.getElementById('btnSaveUser');
  if (btnSaveUser) {
    btnSaveUser.addEventListener('click', function() {
      // Handle user save
      console.log('User save clicked');
    });
  }
  
  // 10. Tombol close modal lainnya
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = btn.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  // 11. Checkbox change listener for progress
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task')) {
      const page = e.target.closest('.page-content');
      if (page) {
        updateProgress(page.id);
      }
    }
  });
  
  // 12. Enter key pada form tambah kavling
  document.addEventListener('keypress', function(e) {
    if (e.target.id === 'newKavlingName' && e.key === 'Enter') {
      submitNewKavling();
    }
  });
  
  console.log('Dynamic event listeners setup complete');
}


// ========== SETUP EVENT LISTENER DINAMIS ==========
function setupDynamicEventListeners() {
  console.log('Setting up dynamic event listeners...');
  
  // 1. Tombol "Tambah Kavling" di semua halaman
  document.querySelectorAll('.btn-add-kavling').forEach(btn => {
    btn.addEventListener('click', handleAddKavling);
  });
  
  // 2. Tombol "Sinkronkan Data" di semua halaman
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', syncData);
  });
  
  // 3. Tombol "Kembali ke Menu Awal & Logout" di semua halaman
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', function() {
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
    });
  });
  
  // 4. Tombol "Simpan Tahap" di semua halaman
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
        } else {
          // Untuk manager save atau lainnya
          handleSaveNotes();
        }
      }
    });
  });
  
  // 5. Tombol search kavling (dropdown change)
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
  
  // 6. Tombol Save di Admin (jika ada)
  const btnSaveUser = document.getElementById('btnSaveUser');
  if (btnSaveUser) {
    btnSaveUser.addEventListener('click', function() {
      // Handle user save
      console.log('User save clicked');
    });
  }
  
  // 7. Tombol close modal
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = btn.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  // 8. Checkbox change listener for progress
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task')) {
      const page = e.target.closest('.page-content');
      if (page) {
        updateProgress(page.id);
      }
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
          title.textContent = 'Login sebagai ' + (defaultDisplayNames[currentRole] || currentRole);
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
      }
    });
  }

  // Admin Tab Switching
  document.addEventListener('click', function(e) {
    const tabBtn = e.target.closest('.admin-tab-btn');
    if (tabBtn) {
      const tabId = tabBtn.getAttribute('data-tab');
      
      document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#94a3b8';
        btn.style.borderBottom = 'none';
      });
      tabBtn.classList.add('active');
      tabBtn.style.color = 'white';
      tabBtn.style.borderBottom = '3px solid #38bdf8';
      
      document.querySelectorAll('.tab-content-item').forEach(content => {
        content.style.display = 'none';
      });
      const targetContent = document.getElementById('tab-' + tabId);
      if (targetContent) targetContent.style.display = 'block';
      
      if (tabId === 'users') {
        loadUsersForAdmin();
      }
    }
  });
});

// ========== ADMIN FUNCTIONS ==========
async function loadUsersForAdmin() {
  try {
    // Fungsi untuk mengambil data user
    // Implementasi sesuai kebutuhan
    console.log('Loading users for admin...');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function resetUserForm() {
  const form = document.getElementById('userEditForm');
  if (form) form.style.display = 'none';
  
  const dropdown = document.getElementById('userSelectDropdown');
  if (dropdown) dropdown.value = '';
}

// ========== MOBILE ENHANCEMENTS ==========
function initializeMobileEnhancements() {
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Improve touch targets
    document.querySelectorAll('button, input[type="checkbox"], label').forEach(el => {
      if (!el.style.minHeight) {
        el.style.minHeight = '44px';
      }
    });
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

window.testButtons = function() {
  console.log('Available buttons:');
  console.log('Add kavling buttons:', document.querySelectorAll('.btn-add-kavling').length);
  console.log('Sync buttons:', document.querySelectorAll('.sync-btn').length);
  console.log('Logout buttons:', document.querySelectorAll('.logout-btn').length);
  console.log('Save section buttons:', document.querySelectorAll('.btn-save-section').length);
};
