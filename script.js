// script.js - Login dengan Google Apps Script API
// URL Web App Apps Script (ganti dengan URL deployment Anda)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbylrP5opJkox2ViDNeyrMdzXF1BK7JcGwjiGGpwrIP_QNL2aHTOtO_Gln0nHE5QEm6O/exec';

let currentRole = null;
let currentDisplayName = null;

// Cache DOM references
const cache = {};

function debounce(fn, wait = 250) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// FUNGSI LOGIN YANG SUDAH DIPERBAIKI
async function verifyRole(username, password) {
  try {
    // Gunakan 'username' bukan 'role' karena Apps Script mencari berdasarkan displayName
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,  // Gunakan username yang diklik user
        password: password
      })
    });

    const result = await response.json();
    
    // Debug log untuk development
    console.log('Login response:', result);
    
    return result;
    
  } catch (err) {
    console.error('Network error:', err);
    return {
      success: false,
      message: 'Gagal terhubung ke server'
    };
  }
}

function applyDisplayName(role, displayName) {
  // Update role selector buttons
  const roleButtons = document.querySelectorAll(`[data-role="${role}"] h3`);
  roleButtons.forEach(el => {
    el.textContent = displayName;
  });

  // Update page header title if page exists
  const page = document.getElementById(role + 'Page');
  if (page) {
    const titleEl = page.querySelector('.page-title h2');
    if (titleEl) {
      // Tampilkan role yang sesuai dari login response
      if (role === 'user1') {
        titleEl.textContent = 'Dashboard Pelaksana 1';
      } else if (role === 'user2') {
        titleEl.textContent = 'Dashboard Pelaksana 2';
      } else if (role === 'user3') {
        titleEl.textContent = 'Dashboard Pelaksana 3';
      } else if (role === 'user4') {
        titleEl.textContent = 'Dashboard Pelaksana 4';
      } else if (role === 'manager') {
        titleEl.textContent = 'Dashboard Manager';
      } else if (role === 'admin') {
        titleEl.textContent = 'Dashboard Admin';
      } else {
        titleEl.textContent = 'Dashboard ' + displayName;
      }
    }
  }

  // Store in session
  sessionStorage.setItem('loggedRole', role);
  sessionStorage.setItem('loggedDisplayName', displayName);
  currentRole = role;
  currentDisplayName = displayName;
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  currentRole = null;
  currentDisplayName = null;
}

function showPage(role) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  // Hide main container
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });
  
  // Show the selected role's page
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  // Show main container
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePercentages(page) {
  if (!page) return;
  
  const sections = page.querySelectorAll('.progress-section.detailed');
  let totalProgress = 0;
  let sectionCount = 0;

  sections.forEach(section => {
    const checkboxes = section.querySelectorAll('.sub-task');
    const checked = section.querySelectorAll('.sub-task:checked');
    if (checkboxes.length > 0) {
      sectionCount++;
      const percent = Math.round((checked.length / checkboxes.length) * 100);
      const bar = section.querySelector('.progress-fill');
      const label = section.querySelector('.sub-percent');
      if (bar) bar.style.width = percent + '%';
      if (label) label.textContent = percent + '%';
      totalProgress += percent;
    }
  });

  const overallPercent = sectionCount > 0 ? Math.round(totalProgress / sectionCount) : 0;
  const mainBar = page.querySelector('.total-bar');
  const mainLabel = page.querySelector('.total-percent');
  if (mainBar) mainBar.style.width = overallPercent + '%';
  if (mainLabel) mainLabel.textContent = overallPercent + '%';

  const infoDisplay = page.querySelector('.kavling-info-display');
  if (infoDisplay) {
    const progressLabel = infoDisplay.querySelector('.val-progress');
    if (progressLabel) progressLabel.textContent = overallPercent + '%';
  }
}

// Mapping role dari data-role di HTML ke displayName di sheet
const roleToDisplayName = {
  'user1': 'Laksana 1',
  'user2': 'Laksana 2', 
  'user3': 'Laksana 3',
  'user4': 'Laksana 4',
  'manager': 'Laksana 5',
  'admin': 'Laksana 6'
};

// Mapping password berdasarkan data di sheet
const rolePassword = {
  'user1': '11',
  'user2': '22',
  'user3': '33',
  'user4': '44',
  'manager': '55',
  'admin': '66'
};

document.addEventListener('DOMContentLoaded', function () {
  // Cache modal elements
  cache.modal = document.getElementById('passwordModal');
  cache.passwordInput = document.getElementById('passwordInput');
  cache.submitBtn = document.getElementById('submitPassword');
  cache.errorMsg = document.getElementById('errorMessage');

  // Restore session if exists
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  if (savedRole && savedName) {
    applyDisplayName(savedRole, savedName);
    showPage(savedRole);
  }

  // Open modal when clicking role button
  document.addEventListener('click', function(e) {
    const roleBtn = e.target.closest('.role-btn');
    if (roleBtn) {
      currentRole = roleBtn.getAttribute('data-role');
      if (!currentRole) return;
      
      // Tampilkan info login di modal
      const modalTitle = document.querySelector('#passwordModal .modal-title');
      if (modalTitle && roleToDisplayName[currentRole]) {
        modalTitle.textContent = 'Login sebagai ' + roleToDisplayName[currentRole];
      }
      
      if (cache.modal) {
        cache.modal.style.display = 'flex';
        if (cache.passwordInput) {
          cache.passwordInput.value = '';
          cache.passwordInput.focus();
        }
        if (cache.errorMsg) cache.errorMsg.textContent = '';
      }
    }
  });

  // Submit password
  if (cache.submitBtn) {
    cache.submitBtn.addEventListener('click', async function () {
      if (!currentRole) return;
      
      const pwd = cache.passwordInput ? cache.passwordInput.value : '';
      if (!pwd) {
        if (cache.errorMsg) cache.errorMsg.textContent = 'Masukkan password';
        return;
      }
      
      // Untuk testing: otomatis gunakan password yang benar
      const testPassword = rolePassword[currentRole];
      const useTest = false; // Set true untuk testing tanpa server
      
      if (useTest && testPassword) {
        // Mode testing lokal
        if (pwd === testPassword) {
          if (cache.modal) cache.modal.style.display = 'none';
          applyDisplayName(currentRole, roleToDisplayName[currentRole] || currentRole);
          showPage(currentRole);
        } else {
          if (cache.errorMsg) cache.errorMsg.textContent = 'Password salah! Coba: ' + testPassword;
        }
      } else {
        // Mode production dengan Apps Script API
        cache.submitBtn.disabled = true;
        cache.submitBtn.textContent = 'Memeriksa...';

        // Gunakan displayName sebagai username untuk API
        const usernameForAPI = roleToDisplayName[currentRole] || currentRole;
        const result = await verifyRole(usernameForAPI, pwd);

        cache.submitBtn.disabled = false;
        cache.submitBtn.textContent = 'Masuk';

        if (result && result.success) {
          if (cache.modal) cache.modal.style.display = 'none';
          // Result dari API: result.role adalah role dari sheet (misal: 'user1')
          // result.displayName adalah displayName dari sheet (misal: 'Laksana 1')
          applyDisplayName(result.role, result.displayName);
          showPage(result.role);
        } else {
          if (cache.errorMsg) {
            cache.errorMsg.textContent = result.message || 'Gagal verifikasi';
            // Untuk debugging, tampilkan password yang seharusnya
            if (testPassword) {
              cache.errorMsg.textContent += ' (Password seharusnya: ' + testPassword + ')';
            }
          }
        }
      }
    });
  }

  // Allow Enter key in password input
  if (cache.passwordInput) {
    cache.passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        cache.submitBtn && cache.submitBtn.click();
      }
    });
  }

  // Close modal
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => { 
      if (cache.modal) cache.modal.style.display = 'none'; 
    });
  });
  
  window.addEventListener('click', e => {
    if (cache.modal && e.target === cache.modal) {
      cache.modal.style.display = 'none';
    }
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', goBack);
  });

  // Checkbox change (delegation)
  document.addEventListener('change', function(e) {
    const cb = e.target;
    if (cb && cb.classList && cb.classList.contains('sub-task')) {
      const page = cb.closest('.page-content');
      updatePercentages(page);
    }
  });

  // Kavling selection (delegation)
  document.addEventListener('click', function(e) {
    const item = e.target.closest('.kavling-item');
    if (!item) return;
    
    const page = item.closest('.page-content');
    if (!page) return;
    
    page.querySelectorAll('.kavling-item').forEach(i => {
      i.classList.remove('selected');
    });
    item.classList.add('selected');

    const name = item.textContent.trim();
    const type = item.getAttribute('data-type') || '-';
    const infoDisplay = page.querySelector('.kavling-info-display');
    
    if (infoDisplay) {
      const nameVal = infoDisplay.querySelector('.val-name');
      const typeVal = infoDisplay.querySelector('.val-type');
      if (nameVal) nameVal.textContent = name;
      if (typeVal) typeVal.textContent = type;
      updatePercentages(page);
    }
  });

  // Debounce search inputs
  document.querySelectorAll('.search-input-large').forEach(inputEl => {
    const handler = debounce(function() {
      const term = this.value.toLowerCase();
      const page = this.closest('.page-content');
      if (!page) return;
      
      page.querySelectorAll('.kavling-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'block' : 'none';
      });
    }, 250);
    
    inputEl.addEventListener('input', handler);
  });

  // Save buttons (delegation)
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-save-section');
    if (!btn) return;
    
    if (btn.classList.contains('btn-manager-save')) {
      const page = btn.closest('.page-content');
      if (!page) return;
      
      const nameEl = page.querySelector('.val-name');
      const kavling = nameEl ? nameEl.textContent : '-';
      
      if (kavling === '-') {
        alert('Silakan pilih kavling terlebih dahulu!');
        return;
      }
      
      const siapJualCheck = page.querySelector('#statusSiapJual');
      const isSiapJual = siapJualCheck ? siapJualCheck.checked : false;
      const statusText = isSiapJual ? 'SIAP JUAL' : 'Monitoring';
      const statusVal = page.querySelector('.val-status');
      
      if (statusVal) {
        statusVal.textContent = statusText;
        statusVal.className = 'info-value val-status ' + (isSiapJual ? 'status-ready' : 'status-monitoring');
      }
      
      alert('Berhasil!\nStatus Kavling ' + kavling + ' diperbarui: ' + statusText);
    } else {
      const section = btn.closest('.progress-section');
      const tahap = section ? section.getAttribute('data-tahap') : 'Data';
      const percentEl = section ? section.querySelector('.sub-percent') : null;
      const percent = percentEl ? percentEl.textContent : '0%';
      alert('Berhasil!\n' + tahap + ' (' + percent + ') telah disimpan.');
    }
  });

  // Logout button
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.logout-btn');
    if (!btn) return;
    
    if (confirm('Apakah Anda yakin ingin logout?')) {
      clearSession();
      goBack();
      // Reset role labels to default
      document.querySelectorAll('.role-btn h3').forEach(el => {
        const role = el.closest('.role-btn').getAttribute('data-role');
        if (role === 'user1') el.textContent = 'Pelaksana 1';
        else if (role === 'user2') el.textContent = 'Pelaksana 2';
        else if (role === 'user3') el.textContent = 'Pelaksana 3';
        else if (role === 'user4') el.textContent = 'Pelaksana 4';
        else if (role === 'manager') el.textContent = 'Manager';
        else if (role === 'admin') el.textContent = 'Admin';
      });
    }
  });

  // Small hover effects (optional)
  document.querySelectorAll('.role-btn').forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-6px) scale(1.03)';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Initialize percentages on page load
  document.querySelectorAll('.page-content').forEach(page => {
    updatePercentages(page);
  });
});

// Expose for debugging
window.showPage = showPage;
window.goBack = goBack;
window.verifyRole = verifyRole;
