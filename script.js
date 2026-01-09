// script.js - Login dengan Google Apps Script API
// URL Web App Apps Script (ganti dengan URL deployment Anda)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXEY1FYf9Ov8srzR2FB2MrOOLyA6F7BnfJ68YdpsAJRUDUKDlD56iKCIkdIbRP9A3M/exec';

let currentRole = null;
let currentDisplayName = null;

// Mapping untuk login
const roleToDisplayName = {
  'user1': 'Laksana 1',
  'user2': 'Laksana 2', 
  'user3': 'Laksana 3',
  'user4': 'Laksana 4',
  'manager': 'Laksana 5',
  'admin': 'Laksana 6'
};

// FUNGSI LOGIN YANG DIPERBAIKI
function loginWithJSONP(username, password) {
  return new Promise((resolve, reject) => {
    const callbackName = 'loginCallback_' + Date.now();
    
    // Buat callback function
    window[callbackName] = function(data) {
      console.log('JSONP Response received:', data);
      resolve(data);
      delete window[callbackName];
      
      // Cleanup script
      const script = document.getElementById('jsonpScript');
      if (script) script.remove();
    };
    
    // Buat URL dengan parameter
    const params = new URLSearchParams({
      username: username,
      password: password,
      callback: callbackName
    });
    
    const url = APPS_SCRIPT_URL + '?' + params.toString();
    console.log('Requesting URL:', url);
    
    // Buat script tag
    const script = document.createElement('script');
    script.id = 'jsonpScript';
    script.src = url;
    
    // Handle error
    script.onerror = function() {
      console.error('Script load failed');
      resolve({
        success: false,
        message: 'Gagal menghubungi server'
      });
      delete window[callbackName];
      script.remove();
    };
    
    // Timeout
    setTimeout(() => {
      if (window[callbackName]) {
        console.error('JSONP timeout');
        resolve({
          success: false,
          message: 'Timeout: Server tidak merespon'
        });
        delete window[callbackName];
        const script = document.getElementById('jsonpScript');
        if (script) script.remove();
      }
    }, 10000);
    
    // Tambahkan ke DOM
    document.body.appendChild(script);
  });
}

// Alternatif dengan fetch
async function loginWithFetch(username, password) {
  try {
    console.log('Trying POST request...');
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('POST response:', data);
      return data;
    }
    
    console.log('POST failed, trying JSONP...');
    return await loginWithJSONP(username, password);
    
  } catch (error) {
    console.log('Fetch error, trying JSONP:', error);
    return await loginWithJSONP(username, password);
  }
}

// Fungsi login utama
async function handleLogin() {
  const modal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitPassword');
  
  if (!currentRole || !passwordInput) {
    console.error('Missing currentRole or passwordInput');
    return;
  }
  
  const password = passwordInput.value.trim();
  
  if (!password) {
    if (errorMsg) errorMsg.textContent = 'Masukkan password';
    return;
  }
  
  // Show loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memeriksa...';
  }
  
  console.log('Attempting login:', {
    role: currentRole,
    usernameForAPI: roleToDisplayName[currentRole],
    password: '***' // Jangan log password sebenarnya
  });
  
  try {
    // Gunakan displayName sebagai username
    const usernameForAPI = roleToDisplayName[currentRole] || currentRole;
    const result = await loginWithFetch(usernameForAPI, password);
    
    console.log('Login result:', result);
    
    if (result && result.success) {
      // Success
      if (modal) modal.style.display = 'none';
      
      // Apply user data
      const displayName = result.displayName || usernameForAPI;
      const role = result.role || currentRole;
      
      // Update UI
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = displayName;
      });
      
      // Save session
      sessionStorage.setItem('loggedRole', role);
      sessionStorage.setItem('loggedDisplayName', displayName);
      
      // Show dashboard
      showPage(role);
      
    } else {
      // Failed
      if (errorMsg) {
        errorMsg.textContent = result?.message || 'Login gagal';
      }
      passwordInput.value = '';
      passwordInput.focus();
    }
    
  } catch (error) {
    console.error('Login error:', error);
    if (errorMsg) {
      errorMsg.textContent = 'Terjadi kesalahan';
    }
  } finally {
    // Reset button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
  }
}

// ... fungsi lainnya tetap sama (applyDisplayName, showPage, dll) ...

document.addEventListener('DOMContentLoaded', function() {
  // Cache elements
  const modal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const submitBtn = document.getElementById('submitPassword');
  const errorMsg = document.getElementById('errorMessage');
  
  // Restore session
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  if (savedRole && savedName) {
    // Update UI
    document.querySelectorAll(`[data-role="${savedRole}"] h3`).forEach(el => {
      el.textContent = savedName;
    });
    showPage(savedRole);
  }
  
  // Role button click
  document.addEventListener('click', function(e) {
    const roleBtn = e.target.closest('.role-btn');
    if (roleBtn) {
      currentRole = roleBtn.getAttribute('data-role');
      
      if (modal && currentRole) {
        // Update modal title
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
          modalTitle.textContent = 'Login sebagai ' + 
            (roleToDisplayName[currentRole] || currentRole);
        }
        
        // Show modal
        modal.style.display = 'flex';
        passwordInput.value = '';
        passwordInput.focus();
        
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
      modal.style.display = 'none';
    }
  });
  
  // Test function
  window.testLogin = async function() {
    console.log('Testing login with JSONP...');
    const result = await loginWithJSONP('Laksana 1', '11');
    console.log('Test result:', result);
    return result;
  };
});
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
