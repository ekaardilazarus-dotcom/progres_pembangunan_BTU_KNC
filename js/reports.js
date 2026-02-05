
/**
 * Laporan Summary Logic
 * Menangani pengambilan, tampilan, dan filtering laporan summary
 */

// ========== HELPERS ==========
window.formatExcelValue = function(value) {
  if (value === true || value === 'TRUE' || value === '✓' || value === 1) {
    return '✓';
  }
  if (value === false || value === 'FALSE' || value === '' || value === 0) {
    return '';
  }
  return value || '';
};

window.formatExcelDate = function(value) {
  if (!value) return '';

  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Jika parsing gagal, return as is
  }

  return value;
};

window.formatCellValue = function(value) {
  if (value === null || value === undefined || value === '') return '-';

  // Jika boolean (checkbox)
  if (value === true || value === 'TRUE') return '✓';
  if (value === false || value === 'FALSE') return '';

  // Untuk nilai persentase atau teks lainnya, tampilkan apa adanya (raw)
  return value;
};

// ========== SUMMARY REPORT FUNCTIONS ==========

window.showProcessingProgress = function(duration = 3500) {
  return new Promise((resolve) => {
    const modal = document.getElementById('loadingModal');
    const modalContent = modal.querySelector('.modal-content');
    
    if (!modalContent) {
      resolve();
      return;
    }
    
    // Simpan konten asli modal loading jika perlu dikembalikan nanti
    // Tapi karena ini biasanya step terakhir loading, kita overwrite saja
    
    modalContent.innerHTML = `
      <i class="fas fa-cogs fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>
      <h2 style="font-size: 1.25rem; margin-top: 10px;">Mohon Tunggu</h2>
      <p style="color: #94a3b8; margin-top: 5px;">Sedang memproses data</p>
      <div style="width: 100%; max-width: 300px; margin: 20px auto 0; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; height: 20px;">
        <div id="processingProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #10b981); border-radius: 10px; transition: width 0.05s linear;"></div>
      </div>
      <p id="processingProgressText" style="color: #38bdf8; margin-top: 10px; font-weight: bold;">0%</p>
    `;
    
    modal.style.display = 'flex';
    
    const progressBar = document.getElementById('processingProgressBar');
    const progressText = document.getElementById('processingProgressText');
    const startTime = Date.now();
    const interval = 50;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      if (progressBar) progressBar.style.width = progress + '%';
      if (progressText) progressText.textContent = Math.round(progress) + '%';
      
      if (progress < 100) {
        setTimeout(updateProgress, interval);
      } else {
        setTimeout(() => {
          resolve();
        }, 200);
      }
    };
    
    updateProgress();
  });
};

window.loadSummaryReport = async function() {
  try {
    showGlobalLoading('Mengambil laporan summary...');

    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getSummaryReport'
    });

    if (result.success) {
      await showProcessingProgress(3500);
      hideGlobalLoading();
      displaySummaryReport(result);
      setTimeout(() => filterKavlingByProgress('all'), 100);
    } else {
      hideGlobalLoading();
      showToast('error', result.message || 'Gagal mengambil laporan');
    }

  } catch (error) {
    console.error('Error loading summary report:', error);
    hideGlobalLoading();
    showToast('error', 'Gagal mengambil laporan');
  }
};

window.displaySummaryReport = function(summaryData) {
  const container = document.getElementById('summaryReportContainer');
  if (!container) return;

  console.log("Summary data received:", summaryData);

  // Store summary data for filtering
  window.lastSummaryData = summaryData;

  // PERBAIKAN: Jika server tidak mengirimkan allKavlings atau items, kita kumpulkan dari kategori
  if (!summaryData.allKavlings && !summaryData.items) {
    summaryData.allKavlings = [
      ...(summaryData.categories?.completed?.items || summaryData.categories?.completed?.kavlings || summaryData.topCompleted || []),
      ...(summaryData.categories?.almostCompleted?.items || summaryData.categories?.almostCompleted?.kavlings || summaryData.topAlmost || []),
      ...(summaryData.categories?.inProgress?.items || summaryData.categories?.inProgress?.kavlings || []),
      ...(summaryData.categories?.lowProgress?.items || summaryData.categories?.lowProgress?.kavlings || summaryData.needAttention || [])
    ];
  }

  const timestamp = new Date(summaryData.timestamp || new Date()).toLocaleString('id-ID');

  // Ensure we have numbers for the badges
  const totalCount = summaryData.totalKavlings || 
                     (summaryData.items ? summaryData.items.length : 0) || 
                     (summaryData.allKavlings ? summaryData.allKavlings.length : 0) || 0;

  const completedCount = summaryData.categories?.completed?.count || 
                         summaryData.completedKavlings?.length || 
                         summaryData.items?.filter(k => {
                           const progress = parseProgressValue(k.totalProgress || k.aj);
                           return progress >= 89;
                         }).length || 0;

  const almostCount = summaryData.categories?.almostCompleted?.count || 
                      summaryData.almostCompletedKavlings?.length || 
                      summaryData.items?.filter(k => {
                        const progress = parseProgressValue(k.totalProgress || k.aj);
                        return progress >= 60 && progress < 89;
                      }).length || 0;

  const progressCount = summaryData.categories?.inProgress?.count || 
                        summaryData.inProgressKavlings?.length || 
                        summaryData.items?.filter(k => {
                          const progress = parseProgressValue(k.totalProgress || k.aj);
                          return progress >= 10 && progress < 60;
                        }).length || 0;

  const lowCount = summaryData.categories?.lowProgress?.count || 
                   summaryData.lowProgressKavlings?.length || 
                   summaryData.items?.filter(k => {
                     const progress = parseProgressValue(k.totalProgress || k.aj);
                     return progress < 10;
                   }).length || 0;

  let html = `
    <div class="summary-header" style="margin-top: 25px; margin-bottom: 30px; border-bottom: 2px solid rgba(255, 255, 255, 0.1); padding-bottom: 20px;">
      <h3><i class="fas fa-chart-bar"></i> Laporan Summary Progress Kavling</h3>
      <p class="summary-timestamp">Diperbarui: ${timestamp}</p>
    </div>

    <div class="summary-stats" style="margin-bottom: 35px; padding-bottom: 25px; border-bottom: 2px dashed rgba(255, 255, 255, 0.1);">
      <div class="stat-card stat-total" onclick="filterKavlingByProgress('all')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat semua">
        <div class="stat-icon">
          <i class="fas fa-home"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${totalCount}</div>
          <div class="stat-label">Total Kavling</div>
        </div>
      </div>

      <div class="stat-card stat-completed" onclick="filterKavlingByProgress('completed')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail selesai">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${completedCount}</div>
          <div class="stat-label">Selesai (89-100%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%</div>
        </div>
      </div>

      <div class="stat-card stat-almost" onclick="filterKavlingByProgress('almostCompleted')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail hampir selesai">
        <div class="stat-icon">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${almostCount}</div>
          <div class="stat-label">Hampir Selesai (60-88%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((almostCount/totalCount)*100) : 0}%</div>
        </div>
      </div>

      <div class="stat-card stat-progress" onclick="filterKavlingByProgress('inProgress')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail sedang berjalan">
        <div class="stat-icon">
          <i class="fas fa-tools"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${progressCount}</div>
          <div class="stat-label">Sedang Berjalan (10-59%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((progressCount/totalCount)*100) : 0}%</div>
        </div>
      </div>

      <div class="stat-card stat-low" onclick="filterKavlingByProgress('lowProgress')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail progress rendah">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${lowCount}</div>
          <div class="stat-label">Progress Rendah (0-9%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((lowCount/totalCount)*100) : 0}%</div>
        </div>
      </div>
    </div>


    <div id="filteredKavlingSection">
      <div class="summary-section">
        <p class="no-data">Pilih kategori di atas untuk melihat detail data</p>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Tambahkan styles untuk table jika belum ada
  if (typeof addTableStyles === 'function') {
    addTableStyles();
  }
};

window.filterKavlingByProgress = function(filter) {
  const summaryData = window.lastSummaryData;
  if (!summaryData) {
    console.log('filterKavlingByProgress: No summary data available');
    return;
  }

  let kavlings = [];
  let title = '';
  const allItems = summaryData.items || summaryData.allKavlings || [];
  
  console.log('filterKavlingByProgress: filter =', filter, ', allItems count =', allItems.length);

  switch(filter) {
    case 'all':
      kavlings = allItems;
      title = 'Semua Data Kavling';
      break;
    case 'completed':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p >= 89;
      });
      title = 'Kavling Selesai (89-100%)';
      break;
    case 'almostCompleted':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p >= 60 && p < 89;
      });
      title = 'Kavling Hampir Selesai (60-88%)';
      break;
    case 'inProgress':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p >= 10 && p < 60;
      });
      title = 'Kavling Sedang Berjalan (10-59%)';
      break;
    case 'lowProgress':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p < 10;
      });
      title = 'Kavling Progress Rendah (0-9%)';
      break;
  }

  window.currentFilteredKavlings = kavlings;
  window.currentFilteredTitle = title;
  
  console.log('filterKavlingByProgress: Set currentFilteredKavlings count =', kavlings.length);

  const filteredSection = document.getElementById('filteredKavlingSection');
  if (filteredSection) {
    filteredSection.innerHTML = renderKavlingSection(title, kavlings);
  }
};

window.renderKavlingSection = function(title, kavlings) {
  if (!kavlings || kavlings.length === 0) {
    return `
      <div class="summary-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h4><i class="fas fa-list"></i> ${title}</h4>
        </div>
        <p class="no-data">Tidak ada data untuk kategori ini</p>
      </div>
    `;
  }

  // Header dengan nama tugas yang sebenarnya
  const headers = [
    { key: 'kavling', label: 'BLOK', width: '100px' },
    { key: 'total_progress', label: 'TOTAL', width: '80px' },
    { key: 'lt', label: 'LT', width: '60px' },
    { key: 'lb', label: 'LB', width: '60px' },
    { key: 'type', label: 'Type', width: '80px' },

    // Tahap 1
    { key: 'land_clearing', label: 'LAND CLEARING', width: '120px' },
    { key: 'pondasi', label: 'PONDASI', width: '90px' },
    { key: 'sloof', label: 'SLOOF', width: '80px' },
    { key: 'pas_ddg_sd2_canopy', label: 'PAS.DDG S/D2 CANOPY', width: '140px' },
    { key: 'pas_ddg_sd_ring_blk', label: 'PAS.DDG S/D RING BLK', width: '140px' },
    { key: 'conduit_inbow_doos', label: 'CONDUIT+INBOW DOOS', width: '140px' },
    { key: 'pipa_air_kotor', label: 'PIPA AIR KOTOR', width: '110px' },
    { key: 'pipa_air_bersih', label: 'PIPA AIR BERSIH', width: '110px' },
    { key: 'sistem_pembuangan', label: 'Sistem Pembuangan', width: '130px' },
    { key: 'plester', label: 'PLESTER', width: '90px' },
    { key: 'acian_benangan', label: 'ACIAN & BENANGAN', width: '120px' },
    { key: 'cor_meja_dapur', label: 'COR MEJA DAPUR', width: '120px' },

    // Tahap 2
    { key: 'rangka_atap', label: 'RANGKA ATAP', width: '110px' },
    { key: 'genteng', label: 'GENTENG', width: '90px' },
    { key: 'plafond', label: 'PLAFOND', width: '90px' },
    { key: 'keramik_dinding_toilet_dapur', label: 'KERAMIK DINDING TOILET & DAPUR', width: '180px' },
    { key: 'instalasi_listrik', label: 'INSTS LISTRIK', width: '110px' },
    { key: 'keramik_lantai', label: 'KERAMIK LANTAI', width: '120px' },

    // Tahap 3
    { key: 'kusen_pintu_jendela', label: 'KUSEN PINTU & JENDELA', width: '160px' },
    { key: 'daun_pintu_jendela', label: 'DAUN PINTU & JENDELA', width: '160px' },
    { key: 'cat_dasar_lapis_awal', label: 'CAT DASAR + LAPIS AWAL', width: '160px' },
    { key: 'fitting_lampu', label: 'FITTING LAMPU', width: '110px' },
    { key: 'fixture_saniter', label: 'FIXTURE & SANITER', width: '130px' },
    { key: 'cat_finish_interior', label: 'CAT FINISH INTERIOR', width: '140px' },
    { key: 'cat_finish_exterior', label: 'CAT FINISH EXTERIOR', width: '140px' },
    { key: 'bak_kontrol_batas_carport', label: 'BAK KONTROL & BATAS CARPORT', width: '180px' },
    { key: 'paving_halaman', label: 'PAVING HALAMAN', width: '130px' },
    { key: 'meteran_listrik', label: 'Meteran Listrik', width: '110px' },
    { key: 'meteran_air', label: 'Meteran Air', width: '100px' },
    { key: 'general_cleaning', label: 'GENERAL CLEANING', width: '130px' },

    // Tahap 4 & Lainnya
    { key: 'completion_penyelesaian_akhir', label: 'COMPLETION / Penyelesaian akhir', width: '180px' },
    { key: 'keterangan', label: 'Keterangan', width: '200px' },
    { key: 'penyerahan_kunci_dari_pelaksana_ke', label: 'Penyerahan Kunci dari Pelaksana Ke', width: '220px' },
    { key: 'tanggal_penyerahan_kunci_dari_pelaksana', label: 'Tanggal Penyerahan Kunci dari Pelaksana', width: '220px' }
  ];

  let html = `
    <div class="summary-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4><i class="fas fa-list"></i> ${title} <span class="badge" style="background: #3b82f6; margin-left: 10px;">${kavlings.length}</span></h4>
        <button class="action-btn secondary small" onclick="downloadSummaryToExcel('${title}')">
          <i class="fas fa-file-excel"></i> Download Excel
        </button>
      </div>
      
      <div class="table-responsive-custom">
        <table class="summary-table">
          <thead>
            <tr>
              <th style="width: 40px; position: sticky; left: 0; z-index: 10;">No</th>
              ${headers.map((h, i) => {
                const isSticky = i === 0 ? 'position: sticky; left: 40px; z-index: 10;' : '';
                return `<th style="width: ${h.width}; ${isSticky}">${h.label}</th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
  `;

  kavlings.forEach((kavling, index) => {
    // Helper untuk mengambil value dengan berbagai kemungkinan key (Robust Key Checking)
    const getVal = (header) => {
      let rawValue = null;
      
      // 1. Coba mapping manual berdasarkan label (Priority: UPPERCASE Label)
      const labelUpper = header.label.toUpperCase();
      if (kavling[labelUpper] !== undefined && kavling[labelUpper] !== null) {
        return kavling[labelUpper];
      }
      
      // 2. Coba mapping berdasarkan label asli
      if (kavling[header.label] !== undefined && kavling[header.label] !== null) {
        return kavling[header.label];
      }

      // 3. Coba berbagai variasi key
      const possibleKeys = [
        header.key,
        header.key.replace(/_/g, ' '),
        header.key.toUpperCase(),
        header.label
      ];
      
      // Tambahan khusus untuk beberapa field yang sering beda format
      if (header.key === 'total_progress') possibleKeys.push('total', 'aj', 'totalProgress');
      if (header.key === 'kavling') possibleKeys.push('nama', 'blok', 'block');
      if (header.key === 'lt') possibleKeys.push('LT');
      if (header.key === 'lb') possibleKeys.push('LB');
      if (header.key === 'type') possibleKeys.push('TYPE', 'tipe');

      for (const k of possibleKeys) {
        if (kavling[k] !== undefined && kavling[k] !== null) {
          return kavling[k];
        }
      }
      
      return '';
    };

    const rowClass = index % 2 === 0 ? 'even' : 'odd';
    
    // Tentukan warna progress total
    let totalProgress = getVal({ key: 'total_progress', label: 'TOTAL' });
    let progressClass = '';
    const pVal = parseProgressValue(totalProgress);
    
    if (pVal >= 89) progressClass = 'text-success';
    else if (pVal >= 60) progressClass = 'text-warning';
    else if (pVal >= 10) progressClass = 'text-info';
    else progressClass = 'text-danger';

    if (totalProgress && !String(totalProgress).includes('%')) totalProgress += '%';

    // Helper untuk cell content
    const getCellContent = (header) => {
      const val = getVal(header);
      return formatCellValue(val);
    };

    html += `<tr class="${rowClass}">
      <td style="position: sticky; left: 0; background: #0f172a; z-index: 5;">${index + 1}</td>
      <td style="position: sticky; left: 40px; background: #0f172a; z-index: 5; font-weight: bold;">${getVal({key: 'kavling', label: 'BLOK'}) || '-'}</td>
      <td class="${progressClass}" style="font-weight: bold;">${totalProgress || '0%'}</td>
      <td>${getVal({key: 'lt', label: 'LT'}) || '-'}</td>
      <td>${getVal({key: 'lb', label: 'LB'}) || '-'}</td>
      <td>${getVal({key: 'type', label: 'Type'}) || '-'}</td>
      
      <!-- Tahap 1 -->
      ${headers.slice(6).map(h => `<td>${getCellContent(h)}</td>`).join('')}
    </tr>`;
  });


  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  return html;
};

window.downloadSummaryToExcel = async function(title) {
  // Try to get data from currentFilteredKavlings first, then fallback to lastSummaryData
  let kavlings = window.currentFilteredKavlings;
  
  // Fallback: if currentFilteredKavlings is empty but we have lastSummaryData, use all items
  if ((!kavlings || kavlings.length === 0) && window.lastSummaryData) {
    kavlings = window.lastSummaryData.items || window.lastSummaryData.allKavlings || [];
    console.log('downloadSummaryToExcel: Using fallback from lastSummaryData, count =', kavlings.length);
  }
  
  if (!kavlings || kavlings.length === 0) {
    showToast('warning', 'Tidak ada data untuk didownload. Silakan pilih kategori terlebih dahulu.');
    return;
  }

  // Header dengan label yang benar
  const headers = [
    'BLOK', 'TOTAL', 'LT', 'LB', 'Type', 
    'LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK', 
    'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'Sistem Pembuangan', 
    'PLESTER', 'ACIAN & BENANGAN', 'COR MEJA DAPUR', 
    'RANGKA ATAP', 'GENTENG', 'PLAFOND', 'KERAMIK DINDING TOILET & DAPUR', 
    'INSTS LISTRIK', 'KERAMIK LANTAI', 
    'KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 
    'FITTING LAMPU', 'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR', 
    'BAK KONTROL & BATAS CARPORT', 'PAVING HALAMAN', 'Meteran Listrik', 'Meteran Air', 
    'GENERAL CLEANING', 'COMPLETION / Penyelesaian akhir', 'Keterangan', 
    'Penyerahan Kunci dari Pelaksana Ke', 'Tanggal Penyerahan Kunci dari Pelaksana'
  ];

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += headers.join(';') + "\n";

  kavlings.forEach((kavling, index) => {
    let totalValue = kavling.total_progress || kavling.total || kavling.aj || '0';
    if (totalValue && !String(totalValue).includes('%')) {
      totalValue = totalValue + '%';
    }
    
    // Helper untuk mengambil value dengan berbagai kemungkinan key
    const getVal = (keys) => {
      if (!Array.isArray(keys)) keys = [keys];
      for (const k of keys) {
        if (kavling[k] !== undefined) return kavling[k];
      }
      return '';
    };

    const rowData = [
      // Data dasar
      getVal(['kavling', 'nama', 'blok']) || '',
      totalValue,
      getVal(['lt', 'LT']) || '',
      getVal(['lb', 'LB']) || '',
      getVal(['type', 'TYPE']) || '',

      // Tahap 1 - mapping key yang sesuai
      formatExcelValue(getVal(['LAND CLEARING', 'land_clearing'])),
      formatExcelValue(getVal(['PONDASI', 'pondasi'])),
      formatExcelValue(getVal(['SLOOF', 'sloof'])),
      formatExcelValue(getVal(['PAS.DDG S/D2 CANOPY', 'pas_ddg_sd2_canopy'])),
      formatExcelValue(getVal(['PAS.DDG S/D RING BLK', 'pas_ddg_sd_ring_blk'])),
      formatExcelValue(getVal(['CONDUIT+INBOW DOOS', 'conduit_inbow_doos'])),
      formatExcelValue(getVal(['PIPA AIR KOTOR', 'pipa_air_kotor'])),
      formatExcelValue(getVal(['PIPA AIR BERSIH', 'pipa_air_bersih'])),
      formatExcelValue(getVal(['SISTEM PEMBUANGAN', 'sistem_pembuangan', 'sistemPembuangan'])),
      formatExcelValue(getVal(['PLESTER', 'plester'])),
      formatExcelValue(getVal(['ACIAN & BENANGAN', 'acian_benangan'])),
      formatExcelValue(getVal(['COR MEJA DAPUR', 'cor_meja_dapur', 'corMejaDapur'])),

      // Tahap 2
      formatExcelValue(getVal(['RANGKA ATAP', 'rangka_atap'])),
      formatExcelValue(getVal(['GENTENG', 'genteng'])),
      formatExcelValue(getVal(['PLAFOND', 'plafond'])),
      formatExcelValue(getVal(['KERAMIK DINDING TOILET & DAPUR', 'keramik_dinding_toilet_dapur', 'keramikDinding'])),
      formatExcelValue(getVal(['INSTALASI LISTRIK', 'instalasi_listrik'])),
      formatExcelValue(getVal(['KERAMIK LANTAI', 'keramik_lantai'])),

      // Tahap 3
      formatExcelValue(getVal(['KUSEN PINTU & JENDELA', 'kusen_pintu_jendela'])),
      formatExcelValue(getVal(['DAUN PINTU & JENDELA', 'daun_pintu_jendela'])),
      formatExcelValue(getVal(['CAT DASAR + LAPIS AWAL', 'cat_dasar_lapis_awal'])),
      formatExcelValue(getVal(['FITTING LAMPU', 'fitting_lampu'])),
      formatExcelValue(getVal(['FIXTURE & SANITER', 'fixture_saniter'])),
      formatExcelValue(getVal(['CAT FINISH INTERIOR', 'cat_finish_interior'])),
      formatExcelValue(getVal(['CAT FINISH EXTERIOR', 'cat_finish_exterior'])),
      formatExcelValue(getVal(['BAK KONTROL & BATAS CARPORT', 'bak_kontrol_batas_carport'])),
      formatExcelValue(getVal(['PAVING HALAMAN', 'paving_halaman'])),
      formatExcelValue(getVal(['METERAN LISTRIK', 'meteran_listrik'])),
      formatExcelValue(getVal(['METERAN AIR', 'meteran_air'])),
      formatExcelValue(getVal(['GENERAL CLEANING', 'general_cleaning'])),

      // Tahap 4
      formatExcelValue(getVal(['COMPLETION / Penyelesaian akhir', 'completion_penyelesaian_akhir'])),
      getVal(['keterangan', 'Keterangan']) || '',
      getVal(['PENYERAHAN KUNCI', 'penyerahan_kunci_dari_pelaksana_ke']) || '',
      formatExcelDate(getVal(['TANGGAL_PENYERAHAN_KUNCI', 'tanggal_penyerahan_kunci_dari_pelaksana', 'keyDeliveryDate']))
    ];

    csvContent += rowData.join(';') + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('success', 'Laporan berhasil didownload');
};

// ========== PDF DOWNLOAD FUNCTIONS ==========

window.showDownloadCategoryPopup = function() {
  const popupHtml = `
    <div id="downloadCategoryPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: #1e293b; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h3 style="color: #f1f5f9; margin: 0 0 20px 0; text-align: center; font-size: 1.2rem;">
          <i class="fas fa-file-excel" style="color: #10b981; margin-right: 8px;"></i>
          Pilih Kategori Download
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="downloadByCategory('all')" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-th-large"></i> Semua Kavling
          </button>
          <button onclick="downloadByCategory('completed')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle"></i> Selesai (89-100%)
          </button>
          <button onclick="downloadByCategory('almostCompleted')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-clock"></i> Hampir Selesai (60-88%)
          </button>
          <button onclick="downloadByCategory('inProgress')" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-spinner"></i> Sedang Berjalan (10-59%)
          </button>
          <button onclick="downloadByCategory('lowProgress')" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle"></i> Progress Rendah (&lt;60%)
          </button>
        </div>
        <button onclick="closeDownloadCategoryPopup()" style="background: #475569; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; width: 100%; margin-top: 16px;">
          <i class="fas fa-times"></i> Batal
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHtml);
};

window.closeDownloadCategoryPopup = function() {
  const popup = document.getElementById('downloadCategoryPopup');
  if (popup) popup.remove();
};

window.downloadByCategory = function(category) {
  closeDownloadCategoryPopup();
  
  if (!window.lastSummaryData) {
    showToast('warning', 'Tidak ada data. Silakan muat ulang halaman.');
    return;
  }
  
  const summaryData = window.lastSummaryData;
  const categories = summaryData.categories || {};
  let kavlings = [];
  let title = '';
  
  function getCategoryItems(cat) {
    if (!cat) return [];
    return cat.items || cat.kavlings || [];
  }
  
  switch(category) {
    case 'all':
      kavlings = summaryData.items || summaryData.allKavlings || [
        ...getCategoryItems(categories.completed),
        ...getCategoryItems(categories.almostCompleted),
        ...getCategoryItems(categories.inProgress),
        ...getCategoryItems(categories.lowProgress)
      ];
      title = 'Semua_Kavling';
      break;
    case 'completed':
      kavlings = getCategoryItems(categories.completed) || summaryData.topCompleted || [];
      title = 'Sudah_Selesai';
      break;
    case 'almostCompleted':
      kavlings = getCategoryItems(categories.almostCompleted) || summaryData.topAlmost || [];
      title = 'Hampir_Selesai';
      break;
    case 'inProgress':
      kavlings = getCategoryItems(categories.inProgress) || [];
      title = 'Sedang_Berjalan';
      break;
    case 'lowProgress':
      kavlings = getCategoryItems(categories.lowProgress) || summaryData.needAttention || [];
      title = 'Progress_Rendah';
      break;
    default:
      kavlings = summaryData.items || summaryData.allKavlings || [];
      title = 'Data_Kavling';
  }
  
  if (!kavlings || kavlings.length === 0) {
    showToast('warning', 'Tidak ada data untuk kategori ini.');
    return;
  }
  
  // Use existing downloadSummaryToExcel but we need to set filteredKavlings temporarily or adapt the function
  // Ideally, we should adapt downloadSummaryToExcel to accept data, but it currently uses window.currentFilteredKavlings
  // Let's reuse downloadSummaryToExcelWithData logic here directly or call it if we add it.
  // I will add downloadSummaryToExcelWithData for clarity.
  downloadSummaryToExcelWithData(title, kavlings);
};

window.downloadSummaryToExcelWithData = function(title, kavlings) {
  // Reuse the logic from downloadSummaryToExcel but with passed data
  // Since we can't easily refactor downloadSummaryToExcel without changing its signature and usages, 
  // I'll just duplicate the logic slightly or set the global variable.
  // Setting global variable is risky if async, but here it's sync.
  const oldFiltered = window.currentFilteredKavlings;
  window.currentFilteredKavlings = kavlings;
  downloadSummaryToExcel(title);
  window.currentFilteredKavlings = oldFiltered;
};

window.showDownloadPDFCategoryPopup = function() {
  const popupHtml = `
    <div id="downloadPDFCategoryPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: #1e293b; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h3 style="color: #f1f5f9; margin: 0 0 20px 0; text-align: center; font-size: 1.2rem;">
          <i class="fas fa-file-pdf" style="color: #ef4444; margin-right: 8px;"></i>
          Pilih Kategori Download PDF
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="downloadPDFByCategory('all')" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-th-large"></i> Semua Kavling
          </button>
          <button onclick="downloadPDFByCategory('completed')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle"></i> Selesai (89-100%)
          </button>
          <button onclick="downloadPDFByCategory('almostCompleted')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-clock"></i> Hampir Selesai (60-88%)
          </button>
          <button onclick="downloadPDFByCategory('inProgress')" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-spinner"></i> Sedang Berjalan (10-59%)
          </button>
          <button onclick="downloadPDFByCategory('lowProgress')" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle"></i> Progress Rendah (&lt;60%)
          </button>
        </div>
        <button onclick="closeDownloadPDFCategoryPopup()" style="background: #475569; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; width: 100%; margin-top: 16px;">
          <i class="fas fa-times"></i> Batal
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHtml);
};

window.closeDownloadPDFCategoryPopup = function() {
  const popup = document.getElementById('downloadPDFCategoryPopup');
  if (popup) popup.remove();
};

window.downloadPDFByCategory = function(category) {
  closeDownloadPDFCategoryPopup();
  
  if (!window.lastSummaryData) {
    showToast('warning', 'Tidak ada data. Silakan muat ulang halaman.');
    return;
  }
  
  const summaryData = window.lastSummaryData;
  const categories = summaryData.categories || {};
  let kavlings = [];
  let title = '';
  let categoryLabel = '';
  
  function getCategoryItems(cat) {
    if (!cat) return [];
    return cat.items || cat.kavlings || [];
  }
  
  switch(category) {
    case 'all':
      kavlings = summaryData.items || summaryData.allKavlings || [
        ...getCategoryItems(categories.completed),
        ...getCategoryItems(categories.almostCompleted),
        ...getCategoryItems(categories.inProgress),
        ...getCategoryItems(categories.lowProgress)
      ];
      title = 'Semua_Kavling';
      categoryLabel = 'Semua Kavling';
      break;
    case 'completed':
      kavlings = getCategoryItems(categories.completed) || summaryData.topCompleted || [];
      title = 'Sudah_Selesai';
      categoryLabel = 'Selesai (89-100%)';
      break;
    case 'almostCompleted':
      kavlings = getCategoryItems(categories.almostCompleted) || summaryData.topAlmost || [];
      title = 'Hampir_Selesai';
      categoryLabel = 'Hampir Selesai (60-88%)';
      break;
    case 'inProgress':
      kavlings = getCategoryItems(categories.inProgress) || [];
      title = 'Sedang_Berjalan';
      categoryLabel = 'Sedang Berjalan (10-59%)';
      break;
    case 'lowProgress':
      kavlings = getCategoryItems(categories.lowProgress) || summaryData.needAttention || [];
      title = 'Progress_Rendah';
      categoryLabel = 'Progress Rendah (0-9%)';
      break;
    default:
      kavlings = summaryData.items || summaryData.allKavlings || [];
      title = 'Data_Kavling';
      categoryLabel = 'Data Kavling';
  }
  
  if (!kavlings || kavlings.length === 0) {
    showToast('warning', 'Tidak ada data untuk kategori ini.');
    return;
  }
  
  generateAndDownloadPDF(title, categoryLabel, kavlings);
};

window.generateAndDownloadPDF = function(title, categoryLabel, kavlings) {
  showGlobalLoading('Membuat file PDF...');
  
  const dateStr = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const timeStr = new Date().toLocaleTimeString('id-ID');
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan ${categoryLabel}</title>
      <style>
        @media print {
          @page { size: landscape; margin: 10mm; }
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 9px; 
          margin: 0; 
          padding: 15px;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 15px; 
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 { 
          margin: 0; 
          font-size: 16px; 
          color: #1a365d;
        }
        .header h2 { 
          margin: 5px 0; 
          font-size: 12px; 
          color: #2d3748;
        }
        .header p { 
          margin: 3px 0; 
          font-size: 10px; 
          color: #718096;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 8px;
        }
        th { 
          background: #2d3748; 
          color: white; 
          padding: 6px 3px; 
          text-align: center; 
          border: 1px solid #1a202c;
          font-size: 7px;
        }
        td { 
          padding: 4px 3px; 
          border: 1px solid #cbd5e0; 
          text-align: center;
        }
        tr:nth-child(even) { background: #f7fafc; }
        tr:hover { background: #edf2f7; }
        .progress-high { background: #c6f6d5 !important; color: #22543d; font-weight: bold; }
        .progress-medium { background: #fefcbf !important; color: #744210; }
        .progress-low { background: #fed7d7 !important; color: #742a2a; }
        .footer { 
          margin-top: 15px; 
          text-align: center; 
          font-size: 9px; 
          color: #718096;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
        .summary-box {
          display: inline-block;
          padding: 5px 15px;
          background: #ebf8ff;
          border: 1px solid #90cdf4;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DATA PROGRES & KONDISI KAVLING BTU KNC</h1>
        <h2>Laporan: ${categoryLabel}</h2>
        <p>Tanggal: ${dateStr} | Jam: ${timeStr}</p>
        <div class="summary-box">
          <strong>Total Data: ${kavlings.length} Kavling</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>BLOK</th>
            <th>TOTAL</th>
            <th>LT</th>
            <th>LB</th>
            <th>Type</th>
            <th>Keterangan</th>
            <th>Penyerahan Kunci dari Pelaksana Ke</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  kavlings.forEach((kavling, index) => {
    const totalProgress = parseProgressValue(kavling.total_progress || kavling.total || kavling.aj);
    const progressClass = totalProgress >= 89 ? 'progress-high' : 
                         (totalProgress >= 60 ? 'progress-medium' : 'progress-low');
    
    let totalValue = kavling.total_progress || kavling.total || kavling.aj || '0';
    if (totalValue && !String(totalValue).includes('%')) {
      totalValue = totalValue + '%';
    }
    
    htmlContent += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${kavling.kavling || '-'}</strong></td>
        <td class="${progressClass}">${totalValue}</td>
        <td>${kavling.lt || '-'}</td>
        <td>${kavling.lb || '-'}</td>
        <td>${kavling.type || '-'}</td>
        <td>${kavling.keterangan || '-'}</td>
        <td>${kavling.penyerahan_kunci_dari_pelaksana_ke || '-'}</td>
      </tr>
    `;
  });
  
  htmlContent += `
        </tbody>
      </table>
      <div class="footer">
        <p>Dokumen ini digenerate secara otomatis oleh Sistem Monitoring Kavling BTU KNC</p>
        <p>© ${new Date().getFullYear()} - BTU KNC Property</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    hideGlobalLoading();
    showToast('success', `PDF untuk ${kavlings.length} kavling siap dicetak`);
  } else {
    hideGlobalLoading();
    showToast('error', 'Popup diblokir. Silakan izinkan popup untuk download PDF.');
  }
};


window.addTableStyles = function() {
  if (document.getElementById('summary-table-styles')) return;

  const style = document.createElement('style');
  style.id = 'summary-table-styles';
  style.textContent = `
    .summary-actions {
      display: flex;
      justify-content: flex-end;
      margin: 20px 0;
      gap: 10px;
    }

    .kavling-table-container {
      overflow-x: auto;
      max-height: 500px;
      margin-top: 20px;
      border-radius: 8px;
      border: 1px solid #334155;
    }

    .table-responsive-custom {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-top: 15px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      position: relative;
      max-height: 70vh; /* Limit height for vertical scrolling */
    }
    
    .summary-table {
      width: 100%;
      border-collapse: separate; /* Required for sticky headers */
      border-spacing: 0;
      font-size: 0.85rem;
      white-space: nowrap;
    }
    
    .summary-table th, .summary-table td {
      padding: 12px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      vertical-align: middle;
    }
    
    .summary-table th {
      background: #1e293b;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .summary-table td {
      color: #cbd5e1;
    }

    /* Sticky Columns: No (1st) and Blok (2nd) */
    .summary-table th:first-child,
    .summary-table td:first-child {
      position: sticky;
      left: 0;
      z-index: 20;
      width: 40px;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    
    .summary-table th:nth-child(2),
    .summary-table td:nth-child(2) {
      position: sticky;
      left: 40px; /* Adjust based on width of first column */
      z-index: 20;
      border-right: 1px solid rgba(255,255,255,0.1);
    }

    /* Fix Z-Index for intersection of Sticky Header + Sticky Columns (Top Left Corner) */
    .summary-table th:first-child,
    .summary-table th:nth-child(2) {
      z-index: 30;
      background: #1e293b;
    }
    
    /* Row Hover Effect */
    .summary-table tbody tr:hover td {
      background: rgba(255, 255, 255, 0.05);
    }

    /* Fix background for sticky columns on hover */
    .summary-table tbody tr:hover td:first-child,
    .summary-table tbody tr:hover td:nth-child(2) {
      background: #1e293b; 
    }
    
    /* Alternating Row Colors */
    .summary-table tbody tr:nth-child(even) td {
      background: rgba(255, 255, 255, 0.02);
    }
    .summary-table tbody tr:nth-child(odd) td {
      background: #0f172a; 
    }
    
    /* Ensure sticky columns have solid background to hide scrolling content */
    .summary-table tbody tr:nth-child(even) td:first-child,
    .summary-table tbody tr:nth-child(even) td:nth-child(2) {
      background: #1e293b; /* Slightly lighter for even rows */
    }
    .summary-table tbody tr:nth-child(odd) td:first-child,
    .summary-table tbody tr:nth-child(odd) td:nth-child(2) {
      background: #0f172a; /* Dark for odd rows */
    }
    
    .text-success { color: #10b981; }
    .text-warning { color: #f59e0b; }
    .text-info { color: #3b82f6; }
    .text-danger { color: #ef4444; }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .summary-table th {
        padding: 8px 5px;
        font-size: 0.7rem;
        min-width: 80px;
      }
      
      .summary-table td {
        padding: 8px 5px;
        font-size: 0.75rem;
      }

      .summary-table th:first-child,
      .summary-table td:first-child {
        min-width: 30px;
        width: 30px;
      }
      
      .summary-table th:nth-child(2),
      .summary-table td:nth-child(2) {
        left: 30px; /* Adjust for smaller first column */
        min-width: 80px;
      }
    }
  `;
  document.head.appendChild(style);
};

window.downloadKavlingToExcel = function(title) {
  // Simple CSV generation as a proxy for Excel since we are in client-side JS without heavy libraries
  const sectionContainer = document.getElementById('filteredKavlingSection');
  const items = sectionContainer.querySelectorAll('.kavling-item');

  if (items.length === 0) {
    showToast('warning', 'Tidak ada data untuk didownload');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "No,Kavling,LT,LB,Progress\n";

  items.forEach(item => {
    const rank = item.querySelector('.kavling-rank').textContent;
    const name = item.querySelector('.kavling-name').textContent;
    const details = item.querySelector('.kavling-details').textContent;
    const progress = item.querySelector('.kavling-progress').textContent;

    // Parse details LT: 72 | LB: 36
    const lt = details.match(/LT: (.*?) \|/) ? details.match(/LT: (.*?) \|/)[1] : '-';
    const lb = details.match(/LB: (.*)$/) ? details.match(/LB: (.*)$/)[1] : '-';

    csvContent += `"${rank}","${name}","${lt}","${lb}","${progress}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('success', 'Laporan berhasil didownload');
};
