// Password permanen untuk tiap role
const passwords = {
  user1: "BTUKNC@1A",
  user2: "kncbtu$2a",
  user3: "btukncmalan6!",
  manager: "malangbtu225$",
  admin: "qwerty1234asdf"
};

let currentRole = null;

// Fungsi tampilkan halaman sesuai role
function showPage(role) {
  // Sembunyikan semua halaman
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });

  // Sembunyikan menu role
  document.getElementById('roleSelector').style.display = 'none';

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
  document.getElementById('roleSelector').style.display = 'flex';
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

  // Efek hover tombol role
  document.querySelectorAll('.role-btn').forEach(button => {
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
