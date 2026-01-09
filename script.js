// script.js - FINAL VERSION
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVYzY6hl8Y7B4XHWOJS-f6LSSbxBvremKXejqfUJ8aWNPeqvQ0gV1L3O-kUk5QryrP/exec';

let currentRole = null;

// Role mapping ke display name di sheet
const roleToDisplayName = {
  'user1': 'Laksana 1',
  'user2': 'Laksana 2', 
  'user3': 'Laksana 3',
  'user4': 'Laksana 4',
  'manager': 'Laksana 5',
  'admin': 'Laksana 6'
};

// ========== CORE LOGIN FUNCTION ==========
function verifyLogin(username, password) {
  return new Promise((resolve) => {
    const callbackName = 'loginCallback_' + Date.now();
    
    window[callbackName] = function(data) {
      console.log('Login response:', data);
      resolve(data);
      delete window[callbackName];
      
      // Remove script tag
      const script = document.getElementById('loginScript');
      if (script) script.remove();
    };
    
    const script = document.createElement('script');
    script.id = 'loginScript';
    
    // Build URL dengan parameter
    const url = APPS_SCRIPT_URL + 
      '?username=' + encodeURIComponent(username) + 
      '&password=' + encodeURIComponent(password) + 
      '&callback=' + callbackName;
    
    console.log('Requesting:', url);
    script.src = url;
    
    document.body.appendChild(script);
  });
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
  
  // Ambil username berdasarkan role yang diklik
  const username = roleToDisplayName[currentRole];
  
  try {
    const result = await verifyLogin(username, password);
    
    if (result.success) {
      // LOGIN BERHASIL
      if (modal) modal.style.display = 'none';
      
      // Update button text dengan nama user
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = result.displayName || username;
      });
      
      // Simpan session
      sessionStorage.setItem('loggedRole', result.role || currentRole);
      sessionStorage.setItem('loggedDisplayName', result.displayName || username);
      
      // Tampilkan dashboard
      showPage(result.role || currentRole);
      
    } else {
      // LOGIN GAGAL
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

// ========== PAGE FUNCTIONS ==========
function showPage(role) {
  // Sembunyikan semua halaman
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  // Sembunyikan container utama
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });
  
  // Tampilkan halaman yang dipilih
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
  }
}

function goBack() {
  // Tampilkan container utama
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  
  // Sembunyikan semua halaman
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  currentRole = null;
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const modal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const submitBtn = document.getElementById('submitPassword');
  const errorMsg = document.getElementById('errorMessage');
  
  // Cek session yang tersimpan
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  
  if (savedRole && savedName) {
    // Jika ada session, langsung masuk
    document.querySelectorAll(`[data-role="${savedRole}"] h3`).forEach(el => {
      el.textContent = savedName;
    });
    showPage(savedRole);
  }
  
  // Klik role button
  document.addEventListener('click', function(e) {
    const roleBtn = e.target.closest('.role-btn');
    if (roleBtn) {
      currentRole = roleBtn.getAttribute('data-role');
      
      if (modal && currentRole) {
        // Update judul modal
        const title = modal.querySelector('.modal-title');
        if (title) {
          title.textContent = 'Login sebagai ' + (roleToDisplayName[currentRole] || currentRole);
        }
        
        // Tampilkan modal
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
  
  // Enter key di password field
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && submitBtn) {
        submitBtn.click();
      }
    });
  }
  
  // Tutup modal
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-btn') || e.target === modal) {
      if (modal) modal.style.display = 'none';
    }
  });
  
  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', goBack);
  });
  
  // Logout button
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.logout-btn');
    if (btn && confirm('Apakah Anda yakin ingin logout?')) {
      clearSession();
      goBack();
      
      // Reset button text ke default
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
});

// ========== DEBUG FUNCTIONS ==========
window.testLogin = async function(username = 'Laksana 1', password = '11') {
  console.log('Testing login...');
  const result = await verifyLogin(username, password);
  console.log('Result:', result);
  return result;
};

window.clearLogin = function() {
  clearSession();
  location.reload();
};
