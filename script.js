// script.js - FINAL FIXED VERSION
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUYtck_xszKJN0_5GREfiuxraUajGMaXwzldidxsCxlwzWo3iCEMb3a3HMdoqABUkA/exec';

let currentRole = null;

// Default display names (jika kolom B kosong)
const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2', 
  'user3': 'Pelaksana 3',
  'user4': 'Pelaksana 4',
  'manager': 'Manager',
  'admin': 'Admin'
};

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
    script.src = APPS_SCRIPT_URL + 
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
      // Debug: cek struktur HTML
      console.log('HTML structure:', pageElement.innerHTML.substring(0, 500));
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
