// Media Processing and Handling Functions (Images, etc.)

// Constants
window.MAX_REVISI_PHOTOS = 6;
window.selectedRevisiPhotos = [];

window.setupRevisiPhotoUpload = function(roleId = 'User1') {
  const photoInput = document.getElementById(`revisiPhotoInput${roleId}`);
  const previewContainer = document.getElementById(`revisiImagePreview1${roleId}`);

  if (!photoInput || !previewContainer) return;

  // Hapus event listener lama dengan clone
  const newPhotoInput = photoInput.cloneNode(true);
  photoInput.parentNode.replaceChild(newPhotoInput, photoInput);

  newPhotoInput.addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    
    if (window.selectedRevisiPhotos.length + files.length > window.MAX_REVISI_PHOTOS) {
      showToast('warning', `Maksimal ${window.MAX_REVISI_PHOTOS} foto.`);
      return;
    }

    showGlobalLoading('Memproses foto...');

    try {
      // Tunggu semua file diproses
      const promises = files.map(file => {
        if (!file.type.startsWith('image/')) return null;
        return compressImage(file, 0.7);
      }).filter(p => p !== null);

      const results = await Promise.all(promises);
      results.forEach(base64 => {
        if (base64) window.selectedRevisiPhotos.push(base64);
      });

      renderRevisiPreviews(roleId);
    } catch (err) {
      console.error('Processing error:', err);
      showToast('error', 'Gagal memproses foto');
    } finally {
      hideGlobalLoading();
      // Reset input
      newPhotoInput.value = '';
    }
  });
};

window.compressImage = function(file, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Optional: Resize if too large
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

window.renderRevisiPreviews = function(roleId = 'User1') {
  const previewContainer = document.getElementById(`revisiImagePreview1${roleId}`);
  if (!previewContainer) return;

  if (window.selectedRevisiPhotos.length === 0) {
    previewContainer.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-images" style="font-size: 2rem; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
        <span>Belum ada foto yang dipilih</span>
      </div>
    `;
    return;
  }

  previewContainer.innerHTML = '';
  window.selectedRevisiPhotos.forEach((base64, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb-wrapper';
    thumb.style.position = 'relative';
    thumb.style.width = '80px';
    thumb.style.height = '80px';
    thumb.style.borderRadius = '8px';
    thumb.style.overflow = 'hidden';
    thumb.style.border = '2px solid #334155';
    thumb.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

    thumb.innerHTML = `
      <img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;" />
      <button type="button" onclick="removeRevisiPhoto(${index}, '${roleId}')" style="position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">&times;</button>
    `;
    previewContainer.appendChild(thumb);
  });
};

window.removeRevisiPhoto = function(index, roleId = 'User1') {
  window.selectedRevisiPhotos.splice(index, 1);
  renderRevisiPreviews(roleId);
};
