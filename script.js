// Fungsi untuk menampilkan halaman berdasarkan peran
function showPage(role) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Sembunyikan tombol peran
    document.getElementById('roleSelector').style.display = 'none';
    
    // Tampilkan halaman yang sesuai
    const pageId = `${role}Page`;
    const pageElement = document.getElementById(pageId);
    
    if (pageElement) {
        pageElement.style.display = 'block';
        
        // Animasi progress bar saat halaman dibuka
        setTimeout(() => {
            const progressFill = pageElement.querySelector('.progress-fill');
            if (progressFill) {
                const width = progressFill.style.width;
                progressFill.style.width = '0';
                setTimeout(() => {
                    progressFill.style.width = width;
                }, 300);
            }
        }, 100);
    }
    
    // Scroll ke atas halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fungsi untuk kembali ke menu utama
function goBack() {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Tampilkan kembali tombol peran
    document.getElementById('roleSelector').style.display = 'flex';
    
    // Scroll ke atas halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Tambahkan event listener ke setiap tombol peran
document.addEventListener('DOMContentLoaded', function() {
    // Tambahkan event listener ke setiap tombol peran
    document.querySelectorAll('.role-btn').forEach(button => {
        button.addEventListener('click', function() {
            const role = this.getAttribute('data-role');
            showPage(role);
        });
    });
    
    // Tambahkan event listener ke tombol back
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', goBack);
    });
    
    // Tambahkan efek hover dinamis pada tombol
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Efek ketikan pada judul
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
        
        // Mulai efek ketikan setelah halaman dimuat
        setTimeout(typeWriter, 500);
    }
    
    // Animasi progress bar awal
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach(progress => {
            const width = progress.style.width;
            progress.style.width = '0';
            setTimeout(() => {
                progress.style.width = width;
            }, 500);
        });
    }, 800);
});

// Tambahkan fungsi ke global scope untuk akses dari HTML
window.showPage = showPage;
window.goBack = goBack;
