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
  const pageId = `${role}Page`;
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

  // Klik tombol role → buka modal
  document.querySelectorAll('.role-btn').forEach(button => {
    button.addEventListener('click', function () {
      currentRole = this.getAttribute('data-role');
      modal.style.display = 'flex';
      input.value = '';
      errorMsg.textContent = '';
      input.focus();
    });
  });

  // Submit password
  submitBtn.addEventListener('click', function () {
    if (input.value === passwords[currentRole]) {
      modal.style.display = 'none';
      showPage(currentRole);
    } else {
      errorMsg.textContent = "Password salah!";
    }
  });

  // Tutup modal
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Tombol kembali
  document.querySelectorAll('.back-btn').forEach(button => {
    button.addEventListener('click', goBack);
  });

  // Handler Sub-task Checkbox
  function updatePercentages(page) {
    const sections = page.querySelectorAll('.progress-section.detailed');
    let totalProgress = 0;
    let sectionCount = sections.length;

    sections.forEach(section => {
      const checkboxes = section.querySelectorAll('.sub-task');
      const checked = section.querySelectorAll('.sub-task:checked');
      const percent = checkboxes.length > 0 ? Math.round((checked.length / checkboxes.length) * 100) : 0;
      
      const bar = section.querySelector('.progress-fill');
      const label = section.querySelector('.sub-percent');
      
      if (bar) bar.style.width = percent + '%';
      if (label) label.textContent = percent + '%';
      
      totalProgress += percent;
    });

    const overallPercent = sectionCount > 0 ? Math.round(totalProgress / sectionCount) : 0;
    const mainBar = page.querySelector('.total-bar');
    const mainLabel = page.querySelector('.total-percent');
    
    if (mainBar) mainBar.style.width = overallPercent + '%';
    if (mainLabel) mainLabel.textContent = overallPercent + '%';

    // Update Kavling Info Display if a kavling is selected
    const selectedKavling = page.querySelector('.kavling-item.selected');
    if (selectedKavling) {
      const infoDisplay = page.querySelector('.kavling-info-display');
      if (infoDisplay) {
        const progressLabel = infoDisplay.querySelector('.val-progress');
        if (progressLabel) progressLabel.textContent = overallPercent + '%';
      }
    }
  }

  // Handle Kavling Selection
  document.querySelectorAll('.kavling-item').forEach(item => {
    item.addEventListener('click', function() {
      const page = this.closest('.page-content');
      
      // Remove previous selection
      page.querySelectorAll('.kavling-item').forEach(i => i.classList.remove('selected'));
      
      // Add new selection
      this.classList.add('selected');
      
      // Update Info Display
      const name = this.textContent;
      const type = this.getAttribute('data-type');
      const infoDisplay = page.querySelector('.kavling-info-display');
      
      if (infoDisplay) {
        infoDisplay.querySelector('.val-name').textContent = name;
        infoDisplay.querySelector('.val-type').textContent = type;
        // Trigger percentage update to get current progress
        updatePercentages(page);
      }
    });
  });

  // Handle Search Input
  document.querySelectorAll('.search-input-large').forEach(input => {
    input.addEventListener('input', function() {
      const term = this.value.toLowerCase();
      const page = this.closest('.page-content');
      const items = page.querySelectorAll('.kavling-item');
      
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'block' : 'none';
      });
    });
  });

  document.querySelectorAll('.sub-task').forEach(check => {
    check.addEventListener('change', function() {
      const page = this.closest('.page-content');
      updatePercentages(page);
    });
  });

  // Simpan Progres Tahapan
  document.querySelectorAll('.btn-save-section').forEach(btn => {
    btn.addEventListener('click', function() {
      const section = this.closest('.progress-section');
      const tahap = section.getAttribute('data-tahap');
      const percent = section.querySelector('.sub-percent').textContent;
      alert(`Berhasil!\nData Tahap ${tahap} (${percent}) telah disimpan.`);
    });
  });

  // Handle Manager Save
  document.querySelectorAll('.btn-manager-save').forEach(btn => {
    btn.addEventListener('click', function() {
      const page = this.closest('.page-content');
      const kavling = page.querySelector('.val-name').textContent;
      if (kavling === '-') {
        alert('Silakan pilih kavling terlebih dahulu!');
        return;
      }
      
      const isSiapJual = page.querySelector('#statusSiapJual').checked;
      const statusText = isSiapJual ? 'SIAP JUAL' : 'Monitoring';
      const statusVal = page.querySelector('.val-status');
      
      statusVal.textContent = statusText;
      statusVal.className = 'info-value val-status ' + (isSiapJual ? 'status-ready' : 'status-monitoring');
      
      alert(`Berhasil!\nStatus Kavling ${kavling} telah diperbarui menjadi: ${statusText}`);
    });
  });
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-10px) scale(1.05)';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Efek ketikan judul
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

// Global scope
window.showPage = showPage;
window.goBack = goBack;
