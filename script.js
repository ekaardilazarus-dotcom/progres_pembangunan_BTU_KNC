// script.js - SIMPLE VERSION
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXEY1FYf9Ov8srzR2FB2MrOOLyA6F7BnfJ68YdpsAJRUDUKDlD56iKCIkdIbRP9A3M/exec';

let currentRole = null;

// Mapping role ke username di sheet
const roleToDisplayName = {
  'user1': 'Laksana 1',
  'user2': 'Laksana 2', 
  'user3': 'Laksana 3',
  'user4': 'Laksana 4',
  'manager': 'Laksana 5',
  'admin': 'Laksana 6'
};

// Fungsi login sederhana
async function verifyLogin(username, password) {
  try {
    console.log('Sending login request:', { username });
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);
    return result;
    
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Gagal menghubungi server'
    };
  }
}

// Fungsi utama untuk handle login
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
  
  // Tampilkan loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memeriksa...';
  }
  
  // Ambil username berdasarkan role
  const usernameForAPI = roleToDisplayName[currentRole];
  
  if (!usernameForAPI) {
    if (errorMsg) errorMsg.textContent = 'Role tidak valid';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
    return;
  }
  
  try {
    // Panggil API login
    const result = await verifyLogin(usernameForAPI, password);
    
    if (result.success) {
      // Login berhasil
      if (modal) modal.style.display = 'none';
      
      // Update tampilan
      const displayName = result.displayName || usernameForAPI;
      const role = result.role || currentRole;
      
      // Update role button text
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = displayName;
      });
      
      // Simpan session
      sessionStorage.setItem('loggedRole', role);
      sessionStorage.setItem('loggedDisplayName', displayName);
      
      // Tampilkan halaman dashboard
      showPage(role);
      
    } else {
      // Login gagal
      if (errorMsg) {
        errorMsg.textContent = result.message || 'Password salah';
      }
      passwordInput.value = '';
      passwordInput.focus();
    }
    
  } catch (error) {
    console.error('Error:', error);
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

// ====== FUNGSI YANG PERLU DITAMBAHKAN ======

function applyDisplayName(role, displayName) {
  // Update role buttons
  document.querySelectorAll(`[data-role="${role}"] h3`).forEach(el => {
    el.textContent = displayName;
  });
  
  // Update page title
  const page = document.getElementById(role + 'Page');
  if (page) {
    const titleEl = page.querySelector('.page-title h2');
    if (titleEl) titleEl.textContent = 'Dashboard ' + displayName;
  }
  
  // Save session
  sessionStorage.setItem('loggedRole', role);
  sessionStorage.setItem('loggedDisplayName', displayName);
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
  
  // Show the selected page
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
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
  });
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  currentRole = null;
}

// ====== EVENT LISTENERS ======

document.addEventListener('DOMContentLoaded', function() {
  // Cache elements
  const modal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const submitBtn = document.getElementById('submitPassword');
  const errorMsg = document.getElementById('errorMessage');
  
  // Restore session if exists
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  if (savedRole && savedName) {
    applyDisplayName(savedRole, savedName);
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
  
  // Enter key in password field
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
  
  // Logout button
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.logout-btn');
    if (btn && confirm('Apakah Anda yakin ingin logout?')) {
      clearSession();
      goBack();
      // Reset role labels
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
  
  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', goBack);
  });
});

// Untuk debugging di console
window.testLogin = async function(username = 'Laksana 1', password = '11') {
  console.log('Testing login...');
  const result = await verifyLogin(username, password);
  console.log('Result:', result);
  return result;
};
