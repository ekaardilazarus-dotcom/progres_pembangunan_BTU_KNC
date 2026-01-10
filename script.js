// script.js - UPDATE DENGAN DUA APPS SCRIPT URL
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzSV8VtMY-xfXHHbLXZKF8Ul-3dx6MSdav97v0SH4DqemUGxEj9I8LSy8cFhz7UXw/exec';

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

// ========== USER MANAGEMENT FUNCTIONS ==========

// Fungsi untuk memuat data user ke dropdown
async function loadUsersForAdmin() {
  console.log('Loading users for admin...');
  
  const dropdown = document.getElementById('userSelectDropdown');
  const loading = document.getElementById('userLoading');
  const noUsersMsg = document.getElementById('noUsersMessage');
  const userEditForm = document.getElementById('userEditForm');
  
  if (!dropdown) return;
  
  // Tampilkan loading
  if (loading) loading.style.display = 'block';
  if (noUsersMsg) noUsersMsg.style.display = 'none';
  if (userEditForm) userEditForm.style.display = 'none';
  
  try {
    const users = await getUsersFromServer();
    
    // Reset dropdown
    dropdown.innerHTML = '<option value="">-- Pilih User --</option>';
    
    if (users && users.length > 0) {
      // Tambahkan setiap user ke dropdown
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.role;
        option.textContent = `${user.role} - ${user.displayName || user.role}`;
        option.setAttribute('data-displayname', user.displayName || user.role);
        dropdown.appendChild(option);
      });
      
      console.log(`Loaded ${users.length} users`);
    } else {
      if (noUsersMsg) noUsersMsg.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error loading users:', error);
    showUserMessage('error', 'Gagal memuat data user: ' + error.message);
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// Fungsi untuk mengambil data user dari server
function getUsersFromServer() {
  return new Promise((resolve) => {
    const callbackName = 'usersCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      console.log('Users data response:', data);
      
      if (data.success && data.users) {
        resolve(data.users);
      } else {
        console.error('Failed to get users:', data.message);
        resolve([]);
      }
      
      delete window[callbackName];
      const script = document.getElementById('usersScript');
      if (script) script.remove();
    };
    
    const url = USER_APPS_SCRIPT_URL + 
      '?action=getUsers&callback=' + callbackName;
    
    console.log('Fetching users from:', url);
    
    const script = document.createElement('script');
    script.id = 'usersScript';
    script.src = url;
    
    document.body.appendChild(script);
  });
}

// Fungsi ketika user dipilih dari dropdown
function loadSelectedUser() {
  const dropdown = document.getElementById('userSelectDropdown');
  const editForm = document.getElementById('userEditForm');
  const currentUserInfo = document.getElementById('currentUserInfo');
  const selectedOption = dropdown.options[dropdown.selectedIndex];
  
  if (!dropdown.value) {
    editForm.style.display = 'none';
    return;
  }
  
  // Tampilkan form edit
  editForm.style.display = 'block';
  
  // Isi info user
  const role = dropdown.value;
  const displayName = selectedOption.getAttribute('data-displayname') || role;
  
  currentUserInfo.textContent = `${role} - ${displayName}`;
  
  // Isi field form
  document.getElementById('editDisplayName').value = displayName;
  document.getElementById('editPassword').value = '';
  document.getElementById('editPasswordConfirm').value = '';
  
  // Reset status message
  const statusDiv = document.getElementById('userUpdateStatus');
  statusDiv.style.display = 'none';
  statusDiv.className = '';
  statusDiv.innerHTML = '';
}

// Fungsi untuk menyimpan perubahan user
async function saveUserChanges() {
  const dropdown = document.getElementById('userSelectDropdown');
  const displayNameInput = document.getElementById('editDisplayName');
  const passwordInput = document.getElementById('editPassword');
  const confirmInput = document.getElementById('editPasswordConfirm');
  const statusDiv = document.getElementById('userUpdateStatus');
  const saveBtn = document.getElementById('btnSaveUser');
  
  if (!dropdown.value) {
    showUserMessage('error', 'Pilih user terlebih dahulu');
    return;
  }
  
  const role = dropdown.value;
  const newDisplayName = displayNameInput.value.trim();
  const newPassword = passwordInput.value.trim();
  const confirmPassword = confirmInput.value.trim();
  
  // Validasi
  if (!newDisplayName) {
    showUserMessage('error', 'Display name tidak boleh kosong');
    return;
  }
  
  if (newPassword && newPassword !== confirmPassword) {
    showUserMessage('error', 'Password dan konfirmasi password tidak sama');
    return;
  }
  
  // Tampilkan loading
  if (saveBtn) {
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveBtn.disabled = true;
  }
  
  try {
    const result = await updateUserOnServer(role, newDisplayName, newPassword);
    
    if (result.success) {
      showUserMessage('success', result.message);
      
      // Update dropdown display name
      const selectedOption = dropdown.options[dropdown.selectedIndex];
      selectedOption.textContent = `${role} - ${newDisplayName}`;
      selectedOption.setAttribute('data-displayname', newDisplayName);
      
      // Update current user info
      document.getElementById('currentUserInfo').textContent = `${role} - ${newDisplayName}`;
      
      // Jika admin mengubah display name sendiri, update UI
      if (currentRole === 'admin' && role === 'admin') {
        updateDashboardTitle('admin', newDisplayName);
      }
      
      // Reset password fields
      passwordInput.value = '';
      confirmInput.value = '';
      
      console.log('User updated successfully:', result);
    } else {
      showUserMessage('error', result.message || 'Gagal mengupdate user');
    }
    
  } catch (error) {
    console.error('Error saving user:', error);
    showUserMessage('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    // Restore button
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
      saveBtn.disabled = false;
    }
  }
}

// Fungsi untuk update user di server
function updateUserOnServer(role, displayName, password) {
  return new Promise((resolve) => {
    const callbackName = 'updateUserCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      console.log('Update user response:', data);
      resolve(data);
      
      delete window[callbackName];
      const script = document.getElementById('updateUserScript');
      if (script) script.remove();
    };
    
    const url = USER_APPS_SCRIPT_URL + 
      '?action=updateUser&role=' + encodeURIComponent(role) + 
      '&displayName=' + encodeURIComponent(displayName) + 
      '&password=' + encodeURIComponent(password) + 
      '&callback=' + callbackName;
    
    console.log('Updating user via:', url);
    
    const script = document.createElement('script');
    script.id = 'updateUserScript';
    script.src = url;
    
    document.body.appendChild(script);
  });
}

// Fungsi untuk menampilkan pesan di form user
function showUserMessage(type, message) {
  const statusDiv = document.getElementById('userUpdateStatus');
  if (!statusDiv) return;
  
  statusDiv.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" 
         style="color: ${type === 'success' ? '#10b981' : '#f43f5e'}; font-size: 1.2rem;"></i>
      <span>${message}</span>
    </div>
  `;
  
  statusDiv.style.display = 'block';
  statusDiv.className = '';
  statusDiv.style.padding = '12px';
  statusDiv.style.borderRadius = '8px';
  statusDiv.style.backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)';
  statusDiv.style.color = type === 'success' ? '#10b981' : '#f43f5e';
  statusDiv.style.border = `1px solid ${type === 'success' ? '#10b981' : '#f43f5e'}`;
  
  // Auto hide setelah 5 detik untuk success message
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Fungsi untuk reset form user
function resetUserForm() {
  const dropdown = document.getElementById('userSelectDropdown');
  dropdown.selectedIndex = 0;
  
  document.getElementById('userEditForm').style.display = 'none';
  document.getElementById('editDisplayName').value = '';
  document.getElementById('editPassword').value = '';
  document.getElementById('editPasswordConfirm').value = '';
  
  const statusDiv = document.getElementById('userUpdateStatus');
  statusDiv.style.display = 'none';
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded. Initializing app...');
  
  // Attach event listeners to all sync buttons
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Sync button clicked');
      // Panggil loadKavlingList untuk merefresh datalist dari server
      loadKavlingList();
      
      // Jika ada kavling yang sedang terpilih, refresh datanya juga
      if (selectedKavling) {
        searchKavling();
      }
    });
  });
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      console.log('Role button clicked:', role);
      // ... logic to show password modal and login
    });
  });

  // Event Listeners for Add Kavling
  document.querySelectorAll('.btn-add-kavling').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('addKavlingModal').style.display = 'flex';
    });
  });

  document.getElementById('closeAddKavling')?.addEventListener('click', () => {
    document.getElementById('addKavlingModal').style.display = 'none';
  });

  document.getElementById('submitNewKavling')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('newKavlingName');
    const lbInput = document.getElementById('newKavlingLB');
    const ltInput = document.getElementById('newKavlingLT');
    const name = nameInput.value.trim();
    const lb = lbInput.value.trim();
    const lt = ltInput.value.trim();

    if (!name) {
      alert('Nama Kavling wajib diisi!');
      return;
    }

    showGlobalLoading('Menambahkan kavling baru...');
    try {
      const result = await addNewKavlingToServer(name, lb, lt);
      if (result.success) {
        showProgressMessage('success', 'Kavling baru berhasil ditambahkan!');
        document.getElementById('addKavlingModal').style.display = 'none';
        nameInput.value = '';
        lbInput.value = '';
        ltInput.value = '';
        loadKavlingList(); // Refresh list
      } else {
        showProgressMessage('error', result.message || 'Gagal menambahkan kavling');
      }
    } catch (error) {
      console.error('Error adding kavling:', error);
      showProgressMessage('error', 'Terjadi kesalahan: ' + error.message);
    } finally {
      hideGlobalLoading();
    }
  });
});

async function addNewKavlingToServer(name, lb, lt) {
  return new Promise((resolve) => {
    const callbackName = 'addKavlingCallback_' + Date.now();
    window[callbackName] = (data) => {
      resolve(data);
      delete window[callbackName];
      document.getElementById('addKavlingScript')?.remove();
    };

    const url = PROGRESS_APPS_SCRIPT_URL + 
      '?action=addKavling&kavling=' + encodeURIComponent(name) + 
      '&lb=' + encodeURIComponent(lb) + 
      '&lt=' + encodeURIComponent(lt) + 
      '&callback=' + callbackName;

    const script = document.createElement('script');
    script.id = 'addKavlingScript';
    script.src = url;
    document.body.appendChild(script);
  });
}

// ========== FUNGSI DATA PROGRESS PELAKSANA 1 ==========

let selectedKavling = null;
let currentKavlingData = null;

// Fungsi untuk memuat list kavling ke dropdown
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Sinkronisasi list kavling...');
  
  const searchInput = document.getElementById('searchKavling1');
  const loading = document.getElementById('kavlingLoading');
  
  if (loading) loading.style.display = 'block';
  
  try {
    const kavlings = await getKavlingListFromServer();
    
    if (kavlings && kavlings.length > 0) {
      // Update search input dengan datalist
      updateSearchDatalist(kavlings);
      console.log(`Loaded ${kavlings.length} kavlings`);
      showProgressMessage('success', 'Sinkronisasi berhasil! Silakan cari kavling.');
    } else {
      console.log('No kavlings found');
    }
    
  } catch (error) {
    console.error('Error loading kavling list:', error);
    showProgressMessage('error', 'Gagal memuat data kavling');
  } finally {
    if (loading) loading.style.display = 'none';
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

// Fungsi untuk update search dengan datalist agar bisa diinput & dipilih
function updateSearchDatalist(kavlings) {
  const roleNum = currentRole ? currentRole.match(/\d+$/) : null;
  const suffix = roleNum ? roleNum[0] : 'Manager';
  const searchInputId = 'searchKavling' + suffix;
  const datalistId = 'kavlingDatalist' + (suffix === 'Manager' ? '' : suffix);
  
  const input = document.getElementById(searchInputId);
  const datalist = document.getElementById(datalistId);
  
  if (!input || !datalist) return;
  
  // Clear current options
  datalist.innerHTML = '';
  
  kavlings.forEach(kavling => {
    const option = document.createElement('option');
    option.value = kavling;
    datalist.appendChild(option);
  });
  
  // Auto-search saat input berubah dan cocok dengan salah satu opsi
  input.oninput = () => {
    if (kavlings.includes(input.value)) {
      searchKavling();
    }
  };
  
  // Tetap support enter
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      searchKavling();
    }
  };
}

async function searchKavling() {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');
  
  try {
    const rolePage = currentRole + 'Page';
    // Gunakan regex untuk mengambil angka di akhir role atau default ke Manager
    const roleNum = currentRole.match(/\d+$/);
    const searchInputId = 'searchKavling' + (roleNum ? roleNum[0] : 'Manager');
    const searchInput = document.getElementById(searchInputId);
    
    console.log('Input element:', searchInput);
    
    if (!searchInput) {
      alert('ERROR: Input pencarian tidak ditemukan!');
      return;
    }
    
    const kavlingName = searchInput.value.trim();
    console.log('Nama kavling:', kavlingName);
    
    if (!kavlingName) {
      alert('Masukkan nama kavling terlebih dahulu!');
      searchInput.focus();
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
      
      // Simpan LB dan LT ke level atas agar mudah diakses saat menyimpan
      currentKavlingData.lb = data.lb || "";
      currentKavlingData.lt = data.lt || "";
      
      console.log('✅ selectedKavling di-set:', selectedKavling);
      
      // Update UI
      updateKavlingInfo(data, rolePage);
      loadProgressData(data.data);
      
      showProgressMessage('success', `Data ${kavlingName} berhasil dimuat!`);
      
    // Pasang event listener global untuk tombol sync saat inisialisasi
    // Dihapus dari sini karena sudah dipindah ke global listener
      
    } else {
      console.error('Server error:', data.message);
      showProgressMessage('error', data.message || 'Kavling tidak ditemukan');
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
  
  // Tahap 3 (tanpa COMPLETE)
  if (progressData.tahap3) {
    Object.keys(progressData.tahap3).forEach(taskName => {
      if (taskName === "KETERANGAN_TAHAP3") {
        const commentEl = pageElement.querySelector('.progress-section[data-tahap="3"] .tahap-comments');
        if (commentEl) commentEl.value = progressData.tahap3[taskName] || "";
        return;
      }
      const isChecked = progressData.tahap3[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 3, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
      }
    });
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
  
  // Urutan Database A-AG:
  // BLOK, LT, LB, LAND CLEARING, PONDASI, SLOOF, PAS.DDG S/D2 CANOPY, PAS.DDG S/D RING BLK, 
  // CONDUIT+INBOW DOOS, PIPA AIR KOTOR, PIPA AIR BERSIH, BIOTANK, PLESTER, ACIAN & BENANGAN, 
  // COR MEJA DAPUR, ATAP GALV., GENTENG, PLAFOND, KERAMIK DINDING TOILET & DAPUR, 
  // INSTS LISTRIK, KERAMIK LANTAI, KUSEN PINTU & JENDELA, DAUN PINTU & JENDELA, 
  // CAT DASAR + LAPIS AWAL, FITTING LAMPU, FIXTURE & SANITER, CAT FINISH INTERIOR, 
  // CAT FINISH EXTERIOR, BAK KONTROL & BATAS CARPORT, PAVING HALAMAN, 
  // GENERAL CLEANING, Completion, Keterangan

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
    "Completion": "Completion"
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
  // Buat atau temukan message container
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

// ========== LOGIN FUNCTION ==========
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

// ========== UPDATE DASHBOARD TITLE ==========
function updateDashboardTitle(role, displayName) {
  console.log(`Updating title for ${role} to: Selamat datang Pak ${displayName}`);
  
  const pageElement = document.getElementById(role + 'Page');
  console.log('Page element found:', !!pageElement);
  
  if (pageElement) {
    // Coba beberapa selector
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

// ========== LOGIN HANDLER ==========
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
      
      // Gunakan displayName dari server, atau default
      const displayName = result.displayName || defaultDisplayNames[currentRole];
      console.log('Display name to use:', displayName);
      
      // 1. Update role button text
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = displayName;
      });
      
      // 2. Update dashboard title
      updateDashboardTitle(currentRole, displayName);
      
      // Simpan session
      sessionStorage.setItem('loggedRole', currentRole);
      sessionStorage.setItem('loggedDisplayName', displayName);
      
      // 3. Tampilkan dashboard
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

// ========== SHOW PAGE ==========
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

// ========== EVENT LISTENERS ==========

  // Tombol search dengan ID spesifik
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('sync-btn') || e.target.closest('.sync-btn')) {
      console.log('🔄 Tombol Sync diklik via global listener');
      syncData();
    }
    if (e.target.id === 'searchButton1' || e.target.closest('#searchButton1')) {
      console.log('🔍 Tombol Search 1 diklik!');
      searchKavling();
    }
  });

// 2. Atau gunakan event listener langsung (lebih reliable)
setTimeout(() => {
  const searchBtn = document.getElementById('searchButton1');
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      console.log('Tombol search diklik via direct event listener');
      searchKavling();
    });
  }
}, 1000);
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

// Fungsi untuk sinkronisasi data (mengambil ulang list kavling)
async function syncData() {
  const rolePage = currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);
  
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }
  
  try {
    // Gunakan showGlobalLoading untuk feedback visual
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
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronisasi Data';
    }
    hideGlobalLoading();
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing elements...');
  
  // Setup event listeners for role selection
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      currentRole = role;
      
      // Jika butuh password
      const modal = document.getElementById('passwordModal');
      if (modal) {
        const title = modal.querySelector('h2#modalTitle');
        if (title) title.textContent = 'Login sebagai ' + (defaultDisplayNames[role] || role);
        modal.style.display = 'flex';
        const input = document.getElementById('passwordInput');
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    });
  });

  // Setup search button listeners for all pages
  document.querySelectorAll('.btn-search').forEach(btn => {
    btn.addEventListener('click', searchKavling);
  });

  // Setup sync button listeners for all pages
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', syncData);
  });
  
  // Setup enter key for search inputs
  document.querySelectorAll('input[id^="searchKavling"]').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchKavling();
    });
  });
});

// Remove duplicate sync button listener
// Dihapus agar tidak konflik dengan inisialisasi di atas
  
  // Save User button listener
  document.addEventListener('click', function(e) {
    if (e.target.id === 'btnSaveUser' || e.target.closest('#btnSaveUser')) {
      saveUserChanges();
    }
  });
  
  // Search button for kavling
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-search')) {
    const searchBtn = e.target.closest('.btn-search');
    const searchBox = searchBtn.closest('.search-box');
    const searchInput = searchBox.querySelector('input[type="text"], input[list]');
      if (searchInput && searchInput.id.startsWith('searchKavling')) {
        searchKavling();
      }
    }
  });
  
  // Enter key in kavling search
 document.addEventListener('keypress', function(e) {
  if (e.target.id && e.target.id.startsWith('searchKavling') && e.key === 'Enter') {
    console.log('Enter pressed on search input');
    searchKavling();
  }
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
    // Simulate UI update
    const displayName = result.displayName || defaultDisplayNames[role];
    console.log('Would update UI with:', displayName);
    
    // Test title update
    updateDashboardTitle(role, displayName);
  }
  
  return result;
};

window.checkTitleElement = function(role = 'user1') {
  const page = document.getElementById(role + 'Page');
  console.log('Page:', page);
  
  if (page) {
    const selectors = [
      '.page-header .page-title h2',
      '.page-title h2',
      'h2'
    ];
    
    selectors.forEach(selector => {
      const element = page.querySelector(selector);
      console.log(`Selector "${selector}":`, element);
      if (element) {
        console.log('Current text:', element.textContent);
      }
    });
  }
};

window.clearAll = function() {
  sessionStorage.clear();
  location.reload();
};

window.testUserManagement = function() {
  console.log('Testing user management...');
  loadUsersForAdmin();
};

window.updateUserTest = function() {
  const testData = {
    role: 'user1',
    displayName: 'Test User Updated',
    password: 'newpassword123'
  };
  
  updateUserOnServer(testData.role, testData.displayName, testData.password)
    .then(result => console.log('Update result:', result))
    .catch(error => console.error('Update error:', error));
};

window.testProgressSystem = function() {
  console.log('Testing progress system...');
  loadKavlingList();
};
