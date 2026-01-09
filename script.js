// script.js (ganti seluruh file lama dengan ini)
// URL Web App Apps Script (ganti jika perlu)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZYGrp9GI5zG4Zo-Qda-4O956fjChotqVwJc6fbO2V0LhExMnqfukDFwAKcHrEaQg/exec';

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

function safeParseJSON(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}

// script.js - gunakan JSON saja (lebih sederhana)
async function verifyRole(role, password) {
  try {
    // SELALU gunakan JSON format (direkomendasikan)
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: role,  // Kirim sebagai 'username'
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
  // update role selector buttons
  document.querySelectorAll(`[data-role="${role}"] h3`).forEach(el => el.textContent = displayName);

  // update page header title if page exists
  const page = document.getElementById(role + 'Page');
  if (page) {
    const titleEl = page.querySelector('.page-title h2');
    if (titleEl) titleEl.textContent = 'Dashboard ' + displayName;
  }

  // store in session
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
  document.querySelectorAll('.page-content').forEach(page => page.style.display = 'none');
  document.querySelectorAll('.section-container').forEach(container => container.style.display = 'none');
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) pageElement.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  document.querySelectorAll('.page-content').forEach(page => page.style.display = 'none');
  document.querySelectorAll('.section-container').forEach(container => container.style.display = 'block');
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

document.addEventListener('DOMContentLoaded', function () {
  // cache modal elements
  cache.modal = document.getElementById('passwordModal');
  cache.passwordInput = document.getElementById('passwordInput');
  cache.submitBtn = document.getElementById('submitPassword');
  cache.errorMsg = document.getElementById('errorMessage');

  // restore session if exists
  const savedRole = sessionStorage.getItem('loggedRole');
  const savedName = sessionStorage.getItem('loggedDisplayName');
  if (savedRole && savedName) {
    applyDisplayName(savedRole, savedName);
    showPage(savedRole);
  }

  // open modal when clicking role button (delegation)
  document.addEventListener('click', function(e) {
    const roleBtn = e.target.closest('.role-btn');
    if (roleBtn) {
      currentRole = roleBtn.getAttribute('data-role');
      if (!currentRole) return;
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

  // submit password
  if (cache.submitBtn) {
    cache.submitBtn.addEventListener('click', async function () {
      if (!currentRole) return;
      const pwd = cache.passwordInput ? cache.passwordInput.value : '';
      if (!pwd) {
        if (cache.errorMsg) cache.errorMsg.textContent = 'Masukkan password';
        return;
      }
      cache.submitBtn.disabled = true;
      cache.submitBtn.textContent = 'Memeriksa...';

      const result = await verifyRole(currentRole, pwd);

      cache.submitBtn.disabled = false;
      cache.submitBtn.textContent = 'Masuk';

      if (result && result.success) {
        if (cache.modal) cache.modal.style.display = 'none';
        const displayName = result.displayName || result.role;
        applyDisplayName(result.role, displayName);
        showPage(result.role);
      } else {
        if (cache.errorMsg) cache.errorMsg.textContent = result.message || 'Gagal verifikasi';
      }
    });
  }

  // allow Enter key in password input
  if (cache.passwordInput) {
    cache.passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        cache.submitBtn && cache.submitBtn.click();
      }
    });
  }

  // close modal
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (cache.modal) cache.modal.style.display = 'none'; });
  });
  window.addEventListener('click', e => {
    if (cache.modal && e.target === cache.modal) cache.modal.style.display = 'none';
  });

  // back buttons
  document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', goBack));

  // checkbox change (delegation)
  document.addEventListener('change', function(e) {
    const cb = e.target;
    if (cb && cb.classList && cb.classList.contains('sub-task')) {
      const page = cb.closest('.page-content');
      updatePercentages(page);
    }
  });

  // kavling selection (delegation)
  document.addEventListener('click', function(e) {
    const item = e.target.closest('.kavling-item');
    if (!item) return;
    const page = item.closest('.page-content');
    if (!page) return;
    page.querySelectorAll('.kavling-item').forEach(i => i.classList.remove('selected'));
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

  // debounce search inputs
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

  // save buttons (delegation)
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

  // logout button (delegation)
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.logout-btn');
    if (!btn) return;
    clearSession();
    goBack();
    // optionally refresh role labels to default (Pelaksana X)
    // reload page to reset labels if needed:
    // location.reload();
  });

  // small hover effects (optional)
  document.querySelectorAll('.role-btn').forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-6px) scale(1.03)';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // typewriter title (non-critical)
  const title = document.querySelector('h1');
  if (title) {
    const originalText = title.textContent;
    title.textContent = '';
    let i = 0;
    function typeWriter() {
      if (i < originalText.length) {
        title.textContent += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    }
    setTimeout(typeWriter, 500);
  }
});

// expose for debugging
window.showPage = showPage;
window.goBack = goBack;
