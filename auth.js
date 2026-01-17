// auth.js - Authentication and Session Management

// ========== LOGIN FUNCTIONS ==========
async function handleLogin() {
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitPassword');
  
  if (!passwordInput || !window.appGlobals.currentRole) return;
  
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
    const result = await window.appGlobals.getDataFromServer(window.appGlobals.USER_APPS_SCRIPT_URL, {
      action: 'login',
      role: window.appGlobals.currentRole,
      password: password
    });
    
    if (result.success) {
      // Save session
      sessionStorage.setItem('loggedRole', window.appGlobals.currentRole);
      sessionStorage.setItem('loggedDisplayName', result.displayName);
      sessionStorage.setItem('loginTime', new Date().toISOString());
      
      // Update UI
      document.querySelectorAll(`[data-role="${window.appGlobals.currentRole}"] h3`).forEach(el => {
        el.textContent = result.displayName;
      });
      
      updateDashboardTitle(window.appGlobals.currentRole, result.displayName);
      
      // Close modal and show page
      const modal = document.getElementById('passwordModal');
      if (modal) modal.style.display = 'none';
      
      showToast('success', `Login berhasil sebagai ${result.displayName}`);
      window.appGlobals.showPage(window.appGlobals.currentRole);
      
      // Load initial data for pelaksana roles
      if (window.appGlobals.currentRole.startsWith('user')) {
        setTimeout(async () => {
          await loadKavlingList();
        }, 100);
      }
      
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

  // Reset selected kavling when entering dashboard
  window.appGlobals.selectedKavling = null;
  window.appGlobals.currentKavlingData = null;
  
  // Clear all kavling selections including custom search inputs
  setSelectedKavlingInDropdowns('');

  // Clear info displays
  const infoIds = ['kavlingInfoUser1', 'kavlingInfoUser2', 'kavlingInfoUser3', 'kavlingInfoUser4', 'kavlingInfoManager'];
  infoIds.forEach(id => {
    const info = document.getElementById(id);
    if (info) {
      if (id === 'kavlingInfoManager') {
        info.innerHTML = `
          <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
          <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
          <div class="info-item"><span class="info-label">Luas Tanah (LT):</span><span class="info-value val-lt">-</span></div>
          <div class="info-item"><span class="info-label">Luas Bangunan (LB):</span><span class="info-value val-lb">-</span></div>
        `;
      } else {
        info.innerHTML = `
         <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
          <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
          <div class="info-item"><span class="info-label">LT:</span><span class="info-value val-lt">-</span></div>
          <div class="info-item"><span class="info-label">LB:</span><span class="info-value val-lb">-</span></div>
        `;
      }
    }
  });

  // Reset specific displays
  if (role === 'manager') {
    const progressDisplay = document.getElementById('managerProgressDisplay');
    if (progressDisplay) progressDisplay.style.display = 'none';
    const notesEl = document.getElementById('propertyNotesManager');
    if (notesEl) {
      notesEl.value = '';
      notesEl.placeholder = 'Pilih kavling terlebih dahulu untuk melihat catatan';
    }
  } else {
    const pageId = role + 'Page';
    updateTotalProgressDisplay('0%', pageId);
    // Reset checkboxes
    const checkboxes = document.querySelectorAll(`#${pageId} .sub-task`);
    checkboxes.forEach(cb => {
      cb.checked = false;
      const label = cb.closest('label');
      if (label) label.classList.remove('task-completed');
    });
    const subPercents = document.querySelectorAll(`#${pageId} .sub-percent`);
    subPercents.forEach(el => el.textContent = '0%');
    const fills = document.querySelectorAll(`#${pageId} .progress-fill`);
    fills.forEach(el => el.style.width = '0%');
  }
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  sessionStorage.removeItem('loginTime');
  window.appGlobals.currentRole = null;
  window.appGlobals.selectedKavling = null;
  window.appGlobals.currentKavlingData = null;
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

function setupLoginForm() {
  const submitPasswordBtn = document.getElementById('submitPassword');
  if (submitPasswordBtn) {
    submitPasswordBtn.addEventListener('click', handleLogin);
  }
  
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }
}

function setupRoleButtons() {
  const roleButtons = document.querySelectorAll('.role-btn');
  console.log(`Found ${roleButtons.length} role buttons`);
  
  roleButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Role button clicked:', this.getAttribute('data-role'));
      
      window.appGlobals.currentRole = this.getAttribute('data-role');
      const modal = document.getElementById('passwordModal');
      
      if (modal) {
        // Reset modal state
        document.getElementById('errorMessage').textContent = '';
        document.getElementById('passwordInput').value = '';
        
        modal.style.display = 'flex';
        document.getElementById('passwordInput').focus();
        
        // Update modal title berdasarkan role
        const roleNames = {
          'user1': 'Pelaksana 1',
          'user2': 'Pelaksana 2', 
          'user3': 'Pelaksana 3',
          'user4': 'Admin Utilitas',
          'manager': 'Supervisor',
          'admin': 'AdminSystemWeb'
        };
        
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
          modalTitle.textContent = `Login sebagai ${roleNames[window.appGlobals.currentRole] || window.appGlobals.currentRole}`;
        }
      }
    });
  });
}

// Export functions
window.auth = {
  handleLogin,
  updateDashboardTitle,
  clearSession,
  goBack,
  setupLoginForm,
  setupRoleButtons
};
