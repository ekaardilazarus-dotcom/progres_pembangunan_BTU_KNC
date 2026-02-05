// Data Loading Helper Functions

function loadUtilitasDataFromData(data) {
  // Key delivery
  const keyInput = document.getElementById('keyDeliveryInputUser4');
  if (keyInput) {
    keyInput.value = data.data?.tahap4?.['PENYERAHAN KUNCI'] || '';
  }

  // Utility Dates
  const listrikInput = document.getElementById('listrikInstallDate');
  const airInput = document.getElementById('airInstallDate');
  const propNotesInput = document.getElementById('utilityPropertyNotes');

  if (listrikInput) listrikInput.value = data.utilitas?.listrikDate || '';
  if (airInput) airInput.value = data.utilitas?.airDate || '';
  if (propNotesInput) propNotesInput.value = data.propertyNotes || '';
}

function loadPropertyNotesFromData(data) {
    const notesEl = document.getElementById('propertyNotesManager');
    if (notesEl && data) {
        notesEl.value = data.propertyNotes || '';
    }
    
    // TAMBAHKAN: Load handover data untuk Supervisor
    if (selectedKavling && currentRole === 'manager') {
        console.log('🔄 Loading handover data for Supervisor...');
        setTimeout(() => {
            loadSupervisorHandoverData(selectedKavling);
        }, 300);
    }
}

window.updateKavlingInfo = function(data, pageId) {
  const role = currentRole;
  const infoId = (function(role) {
    switch (role) {
      case 'user1': return 'kavlingInfoUser1';
      case 'user2': return 'kavlingInfoUser2';
      case 'user3': return 'kavlingInfoUser3';
      case 'user4': return 'kavlingInfoUser4';
      case 'manager': return 'kavlingInfoManager';
      default: return 'kavlingInfoUser1';
    }
  })(role);
  const infoDisplay = document.getElementById(infoId);
  if (!infoDisplay) return;
  const getHoDateText = (d) => {
    const hoDate = d.tglHandover || (d.data && d.data.handoverDate);
    if (hoDate && hoDate !== '-') return hoDate;
    if (hoDate === '-') return '-';
    return 'tidak diketahui, cek ulang data';
  };
  const hoDateText = getHoDateText(data);
  const hoDateColor = hoDateText === '-' ? '' : (hoDateText === 'tidak diketahui, cek ulang data' ? '#f43f5e' : '#10b981');
  const hoDateWeight = hoDateText === '-' ? '' : 'bold';
  if (role === 'manager') {
    infoDisplay.innerHTML = `
      <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">${data.kavling || '-'}</span></div>
      <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">${data.type || '-'}</span></div>
      <div class="info-item"><span class="info-label">Luas Tanah (LT):</span><span class="info-value val-lt">${data.lt || '-'}</span></div>
      <div class="info-item"><span class="info-label">Luas Bangunan (LB):</span><span class="info-value val-lb">${data.lb || '-'}</span></div>
      <div class="info-item"><span class="info-label">Tanggal HandOver ke User:</span><span class="info-value val-ho-date" style="color: ${hoDateColor}; font-weight: ${hoDateWeight}">${hoDateText}</span></div>
    `;
    if (data.data && data.data.tahap4 && data.data.tahap4.TOTAL && typeof window.updateManagerProgressDisplay === 'function') {
      window.updateManagerProgressDisplay(data.data.tahap4.TOTAL);
    }
  } else {
    infoDisplay.innerHTML = `
      <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">${data.kavling || '-'}</span></div>
      <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">${data.type || '-'}</span></div>
      <div class="info-item"><span class="info-label">LT:</span><span class="info-value val-lt">${data.lt || '-'}</span></div>
      <div class="info-item"><span class="info-label">LB:</span><span class="info-value val-lb">${data.lb || '-'}</span></div>
      <div class="info-item"><span class="info-label">Tanggal HandOver ke User:</span><span class="info-value val-ho-date" style="color: ${hoDateColor}; font-weight: ${hoDateWeight}">${hoDateText}</span></div>
    `;
  }
};

window.parseMutasiDataFromStringSupervisor = function(mutasiString) {
  if (!mutasiString || mutasiString.trim() === '') return [];
  const entries = [];
  const entryStrings = mutasiString.split('|').map(entry => entry.trim());
  entryStrings.forEach(entryStr => {
    if (entryStr.trim() === '') return;
    const parts = entryStr.split(',');
    if (parts.length >= 3) {
      entries.push({ dari: parts[0]?.trim() || '', ke: parts[1]?.trim() || '', tanggal: parts[2]?.trim() || '', jenis: '' });
    }
  });
  return entries;
};

window.loadSupervisorHandoverData = async function(kavlingName) {
  if (!kavlingName) return;
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, { action: 'getHandoverData', kavling: kavlingName });
    if (result.success && result.handoverData) {
      const ho = result.handoverData;
      const u = document.getElementById('supervisorHOUser');
      const d = document.getElementById('supervisorHODari');
      const t = document.getElementById('supervisorHOTanggal');
      if (d) d.textContent = ho.dariPelaksana || '-';
      if (u) u.textContent = ho.keUser || '-';
      if (t) t.textContent = ho.tanggal || '-';
      const id = document.getElementById('inputSupervisorHODari');
      const ik = document.getElementById('inputSupervisorHOKe');
      const it = document.getElementById('inputSupervisorHOTgl');
      if (id) id.value = ho.dariPelaksana || '';
      if (ik) ik.value = ho.keUser || '';
      if (it) it.value = ho.tanggal || '';
    }
  } catch (error) {
  }
};

window.saveSupervisorHandoverData = async function() {
  if (!selectedKavling) return;
  const dari = document.getElementById('inputSupervisorHODari')?.value.trim() || '';
  const ke = document.getElementById('inputSupervisorHOKe')?.value.trim() || '';
  const tgl = document.getElementById('inputSupervisorHOTgl')?.value.trim() || '';
  if (!dari || !ke) {
    showToast('warning', 'Nama pemberi dan penerima harus diisi!');
    return;
  }
  showGlobalLoading('Menyimpan data HandOver Kunci...');
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, { action: 'saveHandoverKunci', kavling: selectedKavling, tglHandover: tgl, dariPelaksana: dari, keUser: ke });
    if (result.success) {
      showToast('success', 'Data HandOver Kunci berhasil disimpan!');
      await loadSupervisorHandoverData(selectedKavling);
      toggleSupervisorHOEditMode(false);
    } else {
      showToast('error', 'Gagal menyimpan');
    }
  } catch (error) {
    showToast('error', 'Error: ' + (error && error.message ? error.message : 'Unknown'));
  } finally {
    hideGlobalLoading();
  }
};

window.resetSupervisorHOSection = function() {
  const btnContainer = document.getElementById('supervisorHOBtnContainer');
  const displayMode = document.getElementById('supervisorHODisplayMode');
  const editMode = document.getElementById('supervisorHOEditMode');
  const loadingEl = document.getElementById('supervisorHOLoading');
  if (btnContainer) btnContainer.style.display = 'block';
  if (displayMode) displayMode.style.display = 'none';
  if (editMode) editMode.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'none';
  const hoUserEl = document.getElementById('supervisorHOUser');
  const hoDariEl = document.getElementById('supervisorHODari');
  const hoTanggalEl = document.getElementById('supervisorHOTanggal');
  if (hoUserEl) hoUserEl.textContent = '-';
  if (hoDariEl) hoDariEl.textContent = '-';
  if (hoTanggalEl) hoTanggalEl.textContent = '-';
  const inputDari = document.getElementById('inputSupervisorHODari');
  const inputKe = document.getElementById('inputSupervisorHOKe');
  const inputTgl = document.getElementById('inputSupervisorHOTgl');
  if (inputDari) inputDari.value = '';
  if (inputKe) inputKe.value = '';
  if (inputTgl) inputTgl.value = '';
};

window.initSupervisorMutationButton = function() {
  const btnMutation = document.getElementById('btnShowMutationSupervisor');
  if (btnMutation && !btnMutation.dataset.setupDone) {
    btnMutation.dataset.setupDone = 'true';
    btnMutation.onclick = async (e) => {
      e.preventDefault();
      const container = document.getElementById('mutasiHistoryContainerSupervisor');
      const kavling = selectedKavling || (document.querySelector('#kavlingInfoManager .val-name')?.textContent !== '-' ? document.querySelector('#kavlingInfoManager .val-name')?.textContent : null);
      if (!kavling || kavling === '-') {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
      }
      if (container.style.display === 'none') {
        container.style.display = 'block';
        window.supervisorMutationVisible = true;
        await loadMutationHistoryForSupervisor(kavling);
      } else {
        container.style.display = 'none';
        window.supervisorMutationVisible = false;
      }
    };
  }
};

window.loadMutationHistoryForSupervisor = async function(kavling) {
  const container = document.getElementById('mutasiHistoryContainerSupervisor');
  if (!container) return;
  try {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> Memuat data mutasi...</div>';
    container.style.display = 'block';
    const result = await getDataFromServer(ADMIN_UTILITAS_URL_SUPERVISOR, { action: 'getHandoverData', kavling });
    if (result.success) {
      const mutasiMasukEntries = window.parseMutasiDataFromStringSupervisor(result.mutasiMasuk || '');
      const mutasiKeluarEntries = window.parseMutasiDataFromStringSupervisor(result.mutasiKeluar || '');
      const handoverData = result.handoverData || null;
      mutasiMasukEntries.forEach(entry => entry.jenis = 'MASUK');
      mutasiKeluarEntries.forEach(entry => entry.jenis = 'KELUAR');
      const allMutasi = [...mutasiMasukEntries, ...mutasiKeluarEntries];
      const hasData = allMutasi.length > 0 || handoverData;
      if (hasData) {
        let html = `<div class="progress-section detailed" style="border-left: 6px solid #8b5cf6; margin-bottom: 15px; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 12px;"><h3 style="color: #8b5cf6; margin-bottom: 15px;"><i class="fas fa-history"></i> Riwayat Mutasi Kunci</h3>`;
        if (handoverData && (handoverData.dari || handoverData.user || handoverData.tglHandover)) {
          html += `<div style="margin-bottom: 15px; padding: 12px; background: rgba(139, 92, 246, 0.15); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);"><h4 style="color: #a78bfa; margin-bottom: 10px; font-size: 0.95rem;"><i class="fas fa-key"></i> HO Kunci ke User</h4><div style="display: grid; gap: 8px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">Diserahkan Oleh:</span><span style="color: #f1f5f9; font-weight: 500;">${handoverData.dari || '-'}</span></div><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">Diterima Oleh (User):</span><span style="color: #f1f5f9; font-weight: 500;">${handoverData.user || '-'}</span></div><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">Tanggal HO:</span><span style="color: #a78bfa; font-weight: 600;">${handoverData.tglHandover || '-'}</span></div></div></div>`;
        }
        if (mutasiMasukEntries.length > 0) {
          html += `<div style="margin-bottom: 15px;"><h4 style="color: #10b981; margin-bottom: 10px; font-size: 0.95rem;"><i class="fas fa-sign-in-alt"></i> Mutasi Kunci Masuk</h4><div style="display: grid; gap: 8px;">`;
          mutasiMasukEntries.forEach((item, index) => {
            html += `<div style="padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);"><div style="display: flex; justify-content: space-between; align-items: center;"><div><span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span><div style="margin-top: 2px;"><span style="font-weight: 500; color: #f1f5f9;">${item.dari || '-'}</span><i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5; color: #94a3b8;"></i><span style="font-weight: 500; color: #f1f5f9;">${item.ke || '-'}</span></div></div><span style="color: #10b981; font-size: 0.85rem;">${item.tanggal || '-'}</span></div></div>`;
          });
          html += `</div></div>`;
        }
        if (mutasiKeluarEntries.length > 0) {
          html += `<div style="margin-bottom: 15px;"><h4 style="color: #f59e0b; margin-bottom: 10px; font-size: 0.95rem;"><i class="fas fa-sign-out-alt"></i> Mutasi Kunci Keluar</h4><div style="display: grid; gap: 8px;">`;
          mutasiKeluarEntries.forEach((item, index) => {
            html += `<div style="padding: 10px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3);"><div style="display: flex; justify-content: space-between; align-items: center;"><div><span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span><div style="margin-top: 2px;"><span style="font-weight: 500; color: #f1f5f9;">${item.dari || '-'}</span><i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5; color: #94a3b8;"></i><span style="font-weight: 500; color: #f1f5f9;">${item.ke || '-'}</span></div></div><span style="color: #f59e0b; font-size: 0.85rem;">${item.tanggal || '-'}</span></div></div>`;
          });
          html += `</div></div>`;
        }
        if (allMutasi.length === 0 && handoverData) {
          html += `<p style="color: #64748b; font-size: 0.85rem; text-align: center; margin-top: 10px;">Tidak ada data mutasi kunci masuk/keluar</p>`;
        }
        html += `</div>`;
        container.innerHTML = html;
      } else {
        container.innerHTML = `<div class="progress-section detailed" style="border-left: 6px solid #8b5cf6; margin-bottom: 15px; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 12px;"><h3 style="color: #8b5cf6; margin-bottom: 15px;"><i class="fas fa-history"></i> Riwayat Mutasi Kunci</h3><p style="color: #94a3b8; text-align: center; padding: 20px;">Belum ada data mutasi untuk kavling ini</p></div>`;
      }
    } else {
      container.innerHTML = `<div class="progress-section detailed" style="border-left: 6px solid #8b5cf6; margin-bottom: 15px; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 12px;"><h3 style="color: #8b5cf6; margin-bottom: 15px;"><i class="fas fa-history"></i> Riwayat Mutasi Kunci</h3><p style="color: #94a3b8; text-align: center; padding: 20px;">Gagal mengambil data</p></div>`;
    }
  } catch (error) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #f87171;"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data mutasi</div>`;
  }
};
