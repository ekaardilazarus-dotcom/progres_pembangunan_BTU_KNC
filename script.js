// versi 0.5 - Refactored
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4j4f2AlMMu1nZzLePeqdLzyMYj59lmlvVmnV9QywZwGwpLYhvNa7ExtrIAc3SWmDC/exec';

// Global variables
let currentRole = null;
let selectedKavling = null;
let currentKavlingData = null;
let allKavlings = [];

// Display names mapping
const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2',
  'user3': 'Pelaksana 3',
  'user4': 'Pelaksana 4',
  'manager': 'MANAGEMENT',
  'admin': 'Admin'
};

// ========== MAIN INITIALIZATION ==========
function initApp() {
  console.log('=== INITIALIZING APP (Refactored v0.5) ===');
  
  // Setup event delegation
  setupGlobalEventDelegation();
  
  // Setup all event listeners
  setupAllEventListeners();
  
  // Setup role buttons
  setupRoleButtons();
  
  // Setup login form
  setupLoginForm();
  
  // Check existing session
  const savedRole = sessionStorage.getItem('loggedRole');
  if (savedRole) {
    currentRole = savedRole;
    showPage(savedRole);
  }
  
  console.log('=== APP INITIALIZED ===');
}

// ========== GLOBAL EVENT DELEGATION ==========
function setupGlobalEventDelegation() {
  // Global event listener for sync buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('.sync-btn')) {
      searchKavling(true); // isSync = true
    }
  });
  
  // Event delegation untuk checkbox
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task') && e.target.type === 'checkbox') {
      const page = e.target.closest('.page-content');
      if (page) {
        updateProgress(page.id);
      }
    }
  });
  
  // Event delegation untuk tombol state
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target && (target.classList.contains('system-btn') || 
                   target.classList.contains('tiles-btn') || 
                   target.classList.contains('table-btn'))) {
      const type = target.classList.contains('system-btn') ? 'system' : 
                   target.classList.contains('tiles-btn') ? 'tiles' : 'table';
      
      if (type === 'system') {
        toggleSystemButton(target, target.getAttribute('data-state'));
      } else if (type === 'tiles') {
        toggleTilesButton(target, target.getAttribute('data-state'));
      } else if (type === 'table') {
        toggleTableButton(target, target.getAttribute('data-state'));
      }
    }
  });
}

// ========== SETUP ALL EVENT LISTENERS ==========
function setupAllEventListeners() {
  console.log('Setting up all event listeners...');
  
  // 1. Setup custom search inputs
  setupCustomSearch('searchKavlingUser1Input', 'searchKavlingUser1List', 'searchKavlingUser1');
  setupCustomSearch('searchKavlingUser2Input', 'searchKavlingUser2List', 'searchKavlingUser2');
  setupCustomSearch('searchKavlingUser3Input', 'searchKavlingUser3List', 'searchKavlingUser3');
  setupCustomSearch('searchKavlingUser4Input', 'searchKavlingUser4List', 'searchKavlingUser4');
  setupCustomSearch('searchKavlingManagerInput', 'searchKavlingManagerList', 'searchKavlingManager');
  
  // 2. Setup edit kavling modal
  setupEditKavlingModal();
  
  // 3. Setup add kavling modal
  setupAddKavlingModal();
  
  // 4. Setup delete kavling
  setupDeleteKavling();
  
  // 5. Setup page-specific functions
  setTimeout(() => {
    setupUser4Page();
    setupAdminTabs();
    setupManagerTabs();
    setupPelaksanaTabs();
  }, 100);
}

// ========== PAGE MANAGEMENT ==========
function showPage(role) {
  console.log(`Showing page for role: ${role}`);
  
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const savedName = sessionStorage.getItem('loggedDisplayName');
    if (savedName) updateDashboardTitle(role, savedName);
    
    // Load initial data based on role
    setTimeout(() => {
      loadInitialDataForRole(role);
    }, 300);
  }
}

function loadInitialDataForRole(role) {
  console.log(`Loading initial data for ${role}...`);
  
  // Load kavling list for all roles except admin (admin loads users instead)
  if (role !== 'admin') {
    loadKavlingList();
  }
  
  // Role-specific setups
  switch(role) {
    case 'admin':
      loadUsersForAdmin();
      break;
    case 'manager':
      // Manager specific setup
      break;
    case 'user4':
      setupUser4Tabs();
      setupUser4EventListeners();
      // Load admin utilitas script
      loadAdminUtilitasScript();
      break;
    case 'user1':
    case 'user2':
    case 'user3':
      setupPelaksanaTabs();
      // Setup checkbox listeners for pelaksana
      setTimeout(() => {
        setupCheckboxListeners(role + 'Page');
        setupStateButtons(role + 'Page');
      }, 500);
      break;
  }
}

// ========== UTILITY FUNCTIONS (kept here for now, will be moved to ui.js) ==========
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

function getSelectIdByRole(role) {
  const selectIds = {
    'user1': 'searchKavlingUser1',
    'user2': 'searchKavlingUser2', 
    'user3': 'searchKavlingUser3',
    'user4': 'searchKavlingUser4',
    'manager': 'searchKavlingManager'
  };
  return selectIds[role] || `searchKavling${role.charAt(0).toUpperCase() + role.slice(1)}`;
}

function getKavlingInfoIdByRole(role) {
  const infoIds = {
    'user1': 'kavlingInfoUser1',
    'user2': 'kavlingInfoUser2', 
    'user3': 'kavlingInfoUser3',
    'user4': 'kavlingInfoUser4',
    'manager': 'kavlingInfoManager'
  };
  return infoIds[role] || `kavlingInfo${role.charAt(0).toUpperCase() + role.slice(1)}`;
}

// ========== ADMIN UTILITAS SCRIPT LOADER ==========
function loadAdminUtilitasScript() {
  if (currentRole === 'user4') {
    if (!document.getElementById('admin-utilitas-script')) {
      const script = document.createElement('script');
      script.id = 'admin-utilitas-script';
      script.src = 'scriptadmin.js';
      script.onload = function() {
        console.log('Admin Utilitas script loaded');
        if (window.adminUtilitas && window.adminUtilitas.init) {
          window.adminUtilitas.init();
        }
      };
      document.head.appendChild(script);
    }
  }
}

// ========== START APPLICATION ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export functions needed by other modules
window.appGlobals = {
  USER_APPS_SCRIPT_URL,
  PROGRESS_APPS_SCRIPT_URL,
  currentRole,
  selectedKavling,
  currentKavlingData,
  allKavlings,
  defaultDisplayNames,
  getDataFromServer,
  getSelectIdByRole,
  getKavlingInfoIdByRole,
  showPage
};
