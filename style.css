// Password permanen untuk tiap role
const passwords = {
  user1: "00",
  user2: "00",
  user3: "00",
  manager: "00",
  admin: "00"
};

let currentRole = null;

// Fungsi tampilkan halaman sesuai role
function showPage(role) {
  // Sembunyikan semua halaman
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });

  // Sembunyikan menu role
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });

  // Tampilkan halaman sesuai role
  const pageId = role + 'Page';
  const pageElement = document.getElementById(pageId);

  if (pageElement) {
    pageElement.style.display = 'block';
  }

  // Scroll ke atas
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fungsi kembali ke menu utama
function goBack() {
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('passwordModal');
  const input = document.getElementById('passwordInput');
  const submitBtn = document.getElementById('submitPassword');
  const errorMsg = document.getElementById('errorMessage');
  const closeBtn = document.querySelector('.close-btn');

  // Klik tombol role -> buka modal
  document.querySelectorAll('.role-btn').forEach(button => {
    button.addEventListener('click', function () {
      currentRole = this.getAttribute('data-role');
      if (modal) {
        modal.style.display = 'flex';
        if (input) {
          input.value = '';
          input.focus();
        }
        if (errorMsg) errorMsg.textContent = '';
      }
    });
  });

  // Submit password
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      if (input && input.value === passwords[currentRole]) {
        if (modal) modal.style.display = 'none';
        showPage(currentRole);
      } else if (errorMsg) {
        errorMsg.textContent = "Password salah!";
      }
    });
  }

  // Tutup modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }
  window.addEventListener('click', e => {
    if (modal && e.target === modal) modal.style.display = 'none';
  });

  // Tombol kembali
  document.querySelectorAll('.back-btn').forEach(button => {
    button.addEventListener('click', goBack);
  });

  // Handler Percentages
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

    // Update Info Display
    const selectedKavling = page.querySelector('.kavling-item.selected');
    if (selectedKavling) {
      const infoDisplay = page.querySelector('.kavling-info-display');
      if (infoDisplay) {
        const progressLabel = infoDisplay.querySelector('.val-progress');
        if (progressLabel) progressLabel.textContent = overallPercent + '%';
      }
    }
  }

  // Kavling Selection
  document.querySelectorAll('.kavling-item').forEach(item => {
    item.addEventListener('click', function() {
      const page = this.closest('.page-content');
      if (!page) return;
      page.querySelectorAll('.kavling-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      
      const name = this.textContent;
      const type = this.getAttribute('data-type');
      const infoDisplay = page.querySelector('.kavling-info-display');
      
      if (infoDisplay) {
        const nameVal = infoDisplay.querySelector('.val-name');
        const typeVal = infoDisplay.querySelector('.val-type');
        if (nameVal) nameVal.textContent = name;
        if (typeVal) typeVal.textContent = type;
        updatePercentages(page);
      }
    });
  });

  // Search Input
  document.querySelectorAll('.search-input-large').forEach(inputEl => {
    inputEl.addEventListener('input', function() {
      const term = this.value.toLowerCase();
      const page = this.closest('.page-content');
      if (!page) return;
      page.querySelectorAll('.kavling-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'block' : 'none';
      });
    });
  });

  // Checkbox Change
  document.querySelectorAll('.sub-task').forEach(check => {
    check.addEventListener('change', function() {
      const page = this.closest('.page-content');
      updatePercentages(page);
    });
  });

  // Save Buttons
  document.querySelectorAll('.btn-save-section').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.classList.contains('btn-manager-save')) {
        const page = this.closest('.page-content');
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
        const section = this.closest('.progress-section');
        const tahap = section ? section.getAttribute('data-tahap') : 'Data';
        const percentEl = section ? section.querySelector('.sub-percent') : null;
        const percent = percentEl ? percentEl.textContent : '0%';
        alert('Berhasil!\n' + tahap + ' (' + percent + ') telah disimpan.');
      }
    });
  });

  // Hover Effects
  document.querySelectorAll('.role-btn').forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-10px) scale(1.05)';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Typewriter Title
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

window.showPage = showPage;
window.goBack = goBack;
