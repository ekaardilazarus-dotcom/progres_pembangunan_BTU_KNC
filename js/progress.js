
window.updateSupervisorStagesUI = function(totalPercent, progressData = null) {
  const stages = [
    { id: 1, gridId: 'gridTahap1', tasks: ['LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK', 'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'SISTEM PEMBUANGAN', 'PLESTER', 'ACIAN & BENANGAN', 'COR MEJA DAPUR'] },
    { id: 2, gridId: 'gridTahap2', tasks: ['RANGKA ATAP', 'GENTENG', 'PLAFOND', 'KERAMIK DINDING TOILET & DAPUR', 'INSTALASI LISTRIK', 'KERAMIK LANTAI'] },
    { id: 3, gridId: 'gridTahap3', tasks: ['KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 'FITTING LAMPU', 'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR', 'BAK KONTROL & BATAS CARPORT', 'PAVING HALAMAN', 'METERAN LISTRIK', 'METERAN AIR', 'GENERAL CLEANING'] },
    { id: 4, gridId: 'gridTahap4', tasks: ['COMPLETION / Penyelesaian akhir'] }
  ];

  const taskDisplayNames = {
    'LAND CLEARING': 'Land Clearing',
    'PONDASI': 'Pondasi',
    'SLOOF': 'Sloof',
    'PAS.DDG S/D2 CANOPY': 'Pas.Ddg S/D Canopy',
    'PAS.DDG S/D RING BLK': 'Pas.Ddg S/D Ring Blk',
    'CONDUIT+INBOW DOOS': 'Conduit + Inbow Doos',
    'PIPA AIR KOTOR': 'Pipa Air Kotor',
    'PIPA AIR BERSIH': 'Pipa Air Bersih',
    'SISTEM PEMBUANGAN': 'Sistem Pembuangan',
    'PLESTER': 'Plester',
    'ACIAN & BENANGAN': 'Acian & Benangan',
    'COR MEJA DAPUR': 'Cor Meja Dapur',
    'RANGKA ATAP': 'Rangka Atap',
    'GENTENG': 'Genteng',
    'PLAFOND': 'Plafond',
    'KERAMIK DINDING TOILET & DAPUR': 'Keramik Dinding Toilet & Dapur',
    'INSTALASI LISTRIK': 'Instalasi Listrik',
    'KERAMIK LANTAI': 'Keramik Lantai',
    'KUSEN PINTU & JENDELA': 'Kusen Pintu & Jendela',
    'DAUN PINTU & JENDELA': 'Daun Pintu & Jendela',
    'CAT DASAR + LAPIS AWAL': 'Cat Dasar + Lapis Awal',
    'FITTING LAMPU': 'Fitting Lampu',
    'FIXTURE & SANITER': 'Fixture & Saniter',
    'CAT FINISH INTERIOR': 'Cat Finish Interior',
    'CAT FINISH EXTERIOR': 'Cat Finish Exterior',
    'BAK KONTROL & BATAS CARPORT': 'Bak Kontrol & Batas Carport',
    'PAVING HALAMAN': 'Paving Halaman',
    'METERAN LISTRIK': 'Meteran Listrik',
    'METERAN AIR': 'Meteran Air',
    'GENERAL CLEANING': 'General Cleaning',
    'COMPLETION / Penyelesaian akhir': 'Completion / Penyelesaian Akhir'
  };

  let t13_total = 0;
  let t13_completed = 0;
  let completionProgress = 0;
  let deliveryDateProgress = 0;

  stages.forEach(stage => {
    const gridEl = document.getElementById(stage.gridId);
    if (!gridEl) return;
    
    gridEl.innerHTML = '';
    
    let completedCount = 0;
    
    const specialTasks = ['SISTEM PEMBUANGAN', 'COR MEJA DAPUR', 'KERAMIK DINDING TOILET & DAPUR'];
    
    stage.tasks.forEach(taskName => {
      let taskValue = null;
      let isCompleted = false;
      
      if (progressData && progressData[`tahap${stage.id}`]) {
        taskValue = progressData[`tahap${stage.id}`][taskName];
        isCompleted = (taskValue === 'Selesai' || taskValue === true || taskValue === '100%' || 
                       (taskValue && taskValue !== '' && specialTasks.includes(taskName)));
      }
      
      if (isCompleted) completedCount++;
      
      if (stage.id === 1 || stage.id === 2 || stage.id === 3) {
        t13_total++;
        if (isCompleted) t13_completed++;
      }
      
      if (stage.id === 4 && taskName === 'COMPLETION / Penyelesaian akhir' && isCompleted) {
        completionProgress = 5;
      }
      
      const isSpecialTask = specialTasks.includes(taskName);
      
      if (isSpecialTask) {
        const taskContainer = document.createElement('div');
        taskContainer.className = 'supervisor-task-item-special' + (isCompleted ? ' task-completed' : '');
        taskContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px 8px;
          background: ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(51, 65, 85, 0.5)'};
          border-radius: 4px;
          border: 1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};
          font-size: 0.7rem;
          grid-column: span 2;
        `;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'item-title';
        titleSpan.textContent = (taskDisplayNames[taskName] || taskName) + ' =';
        titleSpan.style.cssText = `
          color: #94a3b8;
          font-weight: 600;
        `;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'item-value';
        valueSpan.style.cssText = `
          color: ${isCompleted ? '#10b981' : '#64748b'};
          font-weight: 500;
          padding: 3px 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
          text-align: center;
        `;
        
        if (taskValue && taskValue !== '' && taskValue !== true && taskValue !== 'Selesai') {
          valueSpan.textContent = taskValue;
        } else {
          valueSpan.textContent = '- Belum dipilih -';
          valueSpan.style.color = '#64748b';
          valueSpan.style.fontStyle = 'italic';
        }
        
        taskContainer.appendChild(titleSpan);
        taskContainer.appendChild(valueSpan);
        gridEl.appendChild(taskContainer);
      } else {
        const taskLabel = document.createElement('label');
        taskLabel.className = 'supervisor-task-item' + (isCompleted ? ' task-completed' : '');
        taskLabel.style.cssText = `
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          background: ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(51, 65, 85, 0.5)'};
          border-radius: 4px;
          border: 1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};
          cursor: default;
          font-size: 0.7rem;
          color: ${isCompleted ? '#10b981' : '#94a3b8'};
          transition: all 0.2s ease;
        `;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        checkbox.disabled = true;
        checkbox.style.cssText = `
          width: 14px;
          height: 14px;
          accent-color: #10b981;
          cursor: default;
        `;
        
        const span = document.createElement('span');
        span.textContent = taskDisplayNames[taskName] || taskName;
        
        taskLabel.appendChild(checkbox);
        taskLabel.appendChild(span);
        gridEl.appendChild(taskLabel);
      }
    });
    
    // Update persentase per tahap
    let percent = 0;
    if (stage.tasks.length > 0) {
      percent = Math.round((completedCount / stage.tasks.length) * 100);
    }
    const percentEl = document.getElementById(`supervisorTahap${stage.id}Percent`);
    if (percentEl) {
      percentEl.textContent = `${percent}%`;
      percentEl.style.color = percent === 100 ? '#10b981' : '#818cf8';
    }
    
    // Checkbox utama tahap
    const stageCheck = document.getElementById(`checkTahap${stage.id}`);
    if (stageCheck) {
      stageCheck.checked = percent === 100;
    }
  });
  
  // Calculate delivery date progress (if delivery date exists, +5%)
  // This logic should match calculateProgress in progress.js
  // Since we don't have direct access to delivery date here easily without parsing again, 
  // we rely on totalPercent passed in, but we might want to recalculate if needed.
  // For now, let's trust totalPercent for the main display, but the breakdown is calculated above.
};

// Fungsi untuk memperbarui tampilan progress total
window.updateTotalProgressDisplay = function(progress, pageId) {
    const pageElement = document.getElementById(pageId);
    if (!pageElement) return;

    const totalPercentEl = pageElement.querySelector('.total-percent');
    const totalBarEl = pageElement.querySelector('.total-bar');

    if (totalPercentEl) {
        totalPercentEl.textContent = progress;
    }

    if (totalBarEl) {
        let percentValue = 0;
        if (typeof progress === 'string') {
            const match = progress.match(/(\d+)%/);
            if (match) {
                percentValue = parseInt(match[1]);
            } else {
                percentValue = parseInt(progress) || 0;
            }
        } else if (typeof progress === 'number') {
            percentValue = progress;
        }

        totalBarEl.style.width = percentValue + '%';
        totalBarEl.className = 'total-bar'; // Reset classes

        if (percentValue >= 89) {
            totalBarEl.classList.add('bar-high');
        } else if (percentValue >= 60) {
            totalBarEl.classList.add('bar-medium');
        } else if (percentValue >= 10) {
            totalBarEl.classList.add('bar-low');
        } else {
            totalBarEl.classList.add('bar-very-low');
        }
        
        console.log(`Total progress updated: ${percentValue}%`);
    }
};

// Konfigurasi bobot tugas untuk User 2 (Pelaksana)
window.setupTaskWeightsForUser2 = function() {
    return {
        'LAND CLEARING': 2.0,
        'PONDASI': 4.0,
        'SLOOF': 4.0,
        'PAS.DDG S/D2 CANOPY': 7.0,
        'PAS.DDG S/D RING BLK': 7.0,
        'CONDUIT+INBOW DOOS': 1.0,
        'PIPA AIR KOTOR': 1.0,
        'PIPA AIR BERSIH': 1.0,
        'SISTEM PEMBUANGAN': 1.5,
        'RANGKA ATAP': 5.0,
        'GENTENG': 4.0,
        'PLESTER': 5.0,
        'ACIAN & BENANGAN': 5.0,
        'PLAFOND': 5.0,
        'KUSEN PINTU & JENDELA': 4.0,
        'DAUN PINTU & JENDELA': 4.0,
        'KERAMIK DINDING TOILET & DAPUR': 4.0,
        'KERAMIK LANTAI': 6.0,
        'CAT DASAR + LAPIS AWAL': 3.0,
        'INSTALASI LISTRIK': 2.0,
        'FITTING LAMPU': 1.0,
        'FIXTURE & SANITER': 2.5,
        'CAT FINISH INTERIOR': 3.0,
        'CAT FINISH EXTERIOR': 3.0,
        'COR MEJA DAPUR': 1.0,
        'BAK KONTROL & BATAS CARPORT': 1.0,
        'PAVING HALAMAN': 3.0,
        'METERAN LISTRIK': 0.5,
        'METERAN AIR': 0.5,
        'GENERAL CLEANING': 1.0,
        'COMPLETION / Penyelesaian akhir': 3.0
    };
};

// Konfigurasi bobot untuk User 1 dan User 3 (sama dengan User 2)
window.setupTaskWeightsForUser1 = window.setupTaskWeightsForUser2;
window.setupTaskWeightsForUser3 = window.setupTaskWeightsForUser2;

// Helper to get correct task weight
window.getTaskWeight = function(taskElement) {
    // 1. Get task name
    const taskName = taskElement.getAttribute('data-task');
    
    // 2. Get default weight from DOM
    let weight = parseFloat(taskElement.getAttribute('data-weight')) || 1;
    
    // 3. Try to get weight from config
    let weightsConfig = null;
    if (typeof currentRole !== 'undefined') {
        if (currentRole === 'user1' && typeof window.setupTaskWeightsForUser1 === 'function') weightsConfig = window.setupTaskWeightsForUser1();
        else if (currentRole === 'user2' && typeof window.setupTaskWeightsForUser2 === 'function') weightsConfig = window.setupTaskWeightsForUser2();
        else if (currentRole === 'user3' && typeof window.setupTaskWeightsForUser3 === 'function') weightsConfig = window.setupTaskWeightsForUser3();
    }
    
    if (weightsConfig && taskName && weightsConfig[taskName] !== undefined) {
        weight = weightsConfig[taskName];
    }
    
    return weight;
};

// Fungsi menghitung progress tahap
window.calculateProgress = function(tahapSection) {
  let totalWeight = 0;
  let completedWeight = 0;

  const subTasks = tahapSection.querySelectorAll('.sub-task');
  subTasks.forEach(task => {
      // Skip hidden inputs dan textarea yang tidak relevan
      if (task.type === 'hidden' && !task.hasAttribute('data-weight') || 
          task.tagName === 'TEXTAREA' || 
          task.classList.contains('tahap-comments')) {
          return;
      }
      
      // Get weight (use helper)
      const weight = window.getTaskWeight(task);
      totalWeight += weight;
      
      // Check completion
      if (task.classList.contains('progress-slider')) {
          // Slider: contribute partial progress based on value
          const value = parseInt(task.value) || 0;
          completedWeight += weight * (value / 100);
      } else if (task.type === 'checkbox') {
          // Checkbox: checked = complete
          if (task.checked) completedWeight += weight;
      } else if (task.type === 'hidden' || task.type === 'text') {
          // Hidden/Text: ada value = complete
          if (task.value && task.value.trim() !== '') completedWeight += weight;
      }
  });

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
};

// Fungsi update UI progress tahap
window.updateTahapProgressUI = function(tahapSection, tahap) {
  const percent = calculateProgress(tahapSection);

  // Update bar dan teks
  const bar = tahapSection.querySelector('.progress-fill');
  const text = tahapSection.querySelector('.sub-percent-tahap');

  if (bar) bar.style.width = percent + '%';
  if (text) text.textContent = percent + '%';

  console.log(`UI updated for tahap ${tahap}: ${percent}%`);
};

// Fungsi utama load progress data ke UI
window.loadProgressData = function(progressData) {
  if (!progressData) return;

  const rolePage = currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  // Tentukan suffix ID berdasarkan role
  let idSuffix = '';
  if (currentRole === 'user2') idSuffix = '2';
  else if (currentRole === 'user3') idSuffix = '3';

  // Aktifkan Tanggal Handover jika ada
  const hoContainers = pageElement.querySelectorAll('.info-item');
  hoContainers.forEach(container => {
    const label = container.querySelector('.info-label');
    if (label && label.textContent.includes('Tanggal HandOver')) {
      container.style.display = 'flex';
      const input = container.querySelector('input');
      if (input) {
        input.disabled = false;
        input.style.opacity = '1';
        input.style.pointerEvents = 'auto';
      }
    }
  });

  // ===== Tahap 1 =====
  if (progressData.tahap1) {
    // SISTEM PEMBUANGAN
    const sistemPembuanganValue = progressData.tahap1['SISTEM PEMBUANGAN'];
    const taskItem = pageElement.querySelector('.waste-system');
    if (taskItem) {
      const buttons = taskItem.querySelectorAll('.system-btn');

      // Cari hidden input berdasarkan role
      let hiddenInput;
      if (currentRole === 'user1') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser1');
      } else if (currentRole === 'user2') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser2');
      } else if (currentRole === 'user3') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser3');
      } else if (currentRole === 'user4') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser4');
      } else if (currentRole === 'user5') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser5');
      }

      // Reset dulu
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('data-active', 'false');
      });

      // Apply kalau ada value
      if (sistemPembuanganValue) {
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === sistemPembuanganValue.toLowerCase()) {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        if (hiddenInput) hiddenInput.value = sistemPembuanganValue;
      }
    }

    // COR MEJA DAPUR
    const corMejaDapurValue = progressData.tahap1['COR MEJA DAPUR'];
    const kitchenItem = pageElement.querySelector('.table-kitchen');
    if (kitchenItem) {
      const buttons = kitchenItem.querySelectorAll('.table-btn');

      // Cari hidden input berdasarkan role
      let hiddenInput;
      if (currentRole === 'user1') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser1');
      } else if (currentRole === 'user2') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser2');
      } else if (currentRole === 'user3') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser3');
      } else if (currentRole === 'user4') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser4');
      } else if (currentRole === 'user5') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser5');
      }

      // Reset dulu
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('data-active', 'false');
      });

      // Apply kalau ada value
      if (corMejaDapurValue) {
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && corMejaDapurValue === 'Dengan Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && corMejaDapurValue === 'Tanpa Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        if (hiddenInput) hiddenInput.value = corMejaDapurValue;
      }
    }

    // Checkbox biasa Tahap 1
    const checkboxTasks1 = [
      'LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY',
      'PAS.DDG S/D RING BLK', 'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR',
      'PIPA AIR BERSIH', 'PLESTER', 'ACIAN & BENANGAN'
    ];
    checkboxTasks1.forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
      if (checkbox) {
        checkbox.checked = !!isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) label.classList.add('task-completed');
          else label.classList.remove('task-completed');
        }
      }
    });
    
    // Load Sliders from database data (User 1, 2, 3)
    if (['user1', 'user2', 'user3'].includes(currentRole)) {
      // Determine suffix
      let suffix = 'User2';
      if (currentRole === 'user1') suffix = 'User1';
      else if (currentRole === 'user3') suffix = 'User3';

      // Combine all slider tasks from all stages
      const sliderTasks = [
          // Tahap 1
          'LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK', 
          'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'PLESTER', 'ACIAN & BENANGAN',
          // Tahap 2
          'RANGKA ATAP', 'GENTENG', 'PLAFOND', 'INSTALASI LISTRIK', 'KERAMIK LANTAI',
          // Tahap 3
          'KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 'FITTING LAMPU',
          'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR', 'BAK KONTROL & BATAS CARPORT',
          'PAVING HALAMAN', 'METERAN LISTRIK', 'METERAN AIR', 'Konekting Air Bersih',
          // Tahap 4
          'Konekting Air Kotor', 'Gorong-gorong', 'Akses Jalan', 'GENERAL CLEANING'
      ];
      
      sliderTasks.forEach(taskName => {
        // Find value in any stage
        let value = undefined;
        if (progressData.tahap1 && progressData.tahap1[taskName] !== undefined) value = progressData.tahap1[taskName];
        else if (progressData.tahap2 && progressData.tahap2[taskName] !== undefined) value = progressData.tahap2[taskName];
        else if (progressData.tahap3 && progressData.tahap3[taskName] !== undefined) value = progressData.tahap3[taskName];
        else if (progressData.tahap4 && progressData.tahap4[taskName] !== undefined) value = progressData.tahap4[taskName];

        if (value !== undefined && typeof window.updateSliderFromDB === 'function') {
          window.updateSliderFromDB(taskName, value, suffix);
        }
      });
    }
  }

  // ===== Tahap 2 =====
  if (progressData.tahap2) {
    // KERAMIK DINDING TOILET & DAPUR
    const keramikDindingValue = progressData.tahap2['KERAMIK DINDING TOILET & DAPUR'];
    const bathroomItem = pageElement.querySelector('.bathroom-tiles');
    if (bathroomItem) {
      const buttons = bathroomItem.querySelectorAll('.tiles-btn');

      // Cari hidden input berdasarkan role
      let hiddenInput;
      if (currentRole === 'user1') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser1');
      } else if (currentRole === 'user2') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser2');
      } else if (currentRole === 'user3') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser3');
      } else if (currentRole === 'user4') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser4');
      } else if (currentRole === 'user5') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser5');
      }

      // Reset dulu
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('data-active', 'false');
      });

      // Apply kalau ada value
      if (keramikDindingValue) {
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && keramikDindingValue === 'Dengan Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && keramikDindingValue === 'Tanpa Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        if (hiddenInput) hiddenInput.value = keramikDindingValue;
      }
    }

    // Checkbox biasa Tahap 2
    const checkboxTasks2 = ['RANGKA ATAP', 'GENTENG', 'PLAFOND', 'INSTALASI LISTRIK', 'KERAMIK LANTAI'];
    checkboxTasks2.forEach(taskName => {
      const isChecked = progressData.tahap2[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 2, rolePage);
      if (checkbox) {
        checkbox.checked = !!isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) label.classList.add('task-completed');
          else label.classList.remove('task-completed');
        }
      }
    });
  }

  // ===== Tahap 3 =====
  if (progressData.tahap3) {
    Object.keys(progressData.tahap3).forEach(taskName => {
      const isChecked = progressData.tahap3[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 3, rolePage);
      if (checkbox) {
        checkbox.checked = !!isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) label.classList.add('task-completed');
          else label.classList.remove('task-completed');
        }
      }
    });
  }

  // ===== Tahap 4 =====
  if (progressData.tahap4) {
    // Keterangan
    if (progressData.tahap4['KETERANGAN']) {
      const commentEl = pageElement.querySelector('.tahap-comments');
      if (commentEl) commentEl.value = progressData.tahap4['KETERANGAN'];
    }

    // Penyerahan Kunci
    if (progressData.tahap4['PENYERAHAN KUNCI']) {
      const deliveryEl = pageElement.querySelector('.key-delivery-input');
      if (deliveryEl) deliveryEl.value = progressData.tahap4['PENYERAHAN KUNCI'];
    }

    // Tanggal Penyerahan Kunci
    if (progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI']) {
      const dateEl = pageElement.querySelector('.key-delivery-date');
      if (dateEl) {
        const rawDate = progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI'];

        // Konversi ke yyyy-MM-dd untuk input date
        let formattedDate = '';

        if (rawDate) {
          // 1. Jika sudah format dd/mm/yyyy, konversi ke yyyy-MM-dd
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
            const [day, month, year] = rawDate.split('/');
            formattedDate = `${year}-${month}-${day}`;
          }
          // 2. Jika sudah format yyyy-MM-dd, langsung pakai
          else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            formattedDate = rawDate;
          }
          // 3. Format lain, coba parse
          else {
            formattedDate = formatDateForInput(rawDate);
          }
        }

        dateEl.value = formattedDate;
        console.log(`Loaded date for ${selectedKavling}: ${rawDate} → ${formattedDate}`);
      }
    }
    
    if (typeof setupTodayButtons === 'function') {
      setupTodayButtons();
    }

    // Completion
    if (progressData.tahap4['COMPLETION / Penyelesaian akhir']) {
      const completionCheckbox = findCheckboxByTaskName('COMPLETION / Penyelesaian akhir', 4, rolePage);
      if (completionCheckbox) {
        completionCheckbox.checked = true;
        const label = completionCheckbox.closest('label');
        if (label) label.classList.add('task-completed');
      }
    }

    // Total progress
    if (progressData.tahap4['TOTAL']) {
      updateTotalProgressDisplay(progressData.tahap4['TOTAL'] || '0%', rolePage);
    }
  }

  updateProgress(rolePage);
};

// Fungsi update progress keseluruhan (re-calculation)
window.updateProgress = function(rolePage) {
    const pageElement = document.getElementById(rolePage);
    if (!pageElement) return 0;

    const progressSections = pageElement.querySelectorAll('.progress-section[data-tahap]');
    
    let totalWeight = 0;
    let completedWeight = 0;
    
    progressSections.forEach(section => {
        const tahap = section.getAttribute('data-tahap');
        const subTasks = section.querySelectorAll('.sub-task');
        
        subTasks.forEach(task => {
            // Skip hidden inputs dan textarea
            if (task.type === 'hidden' && !task.hasAttribute('data-weight') || 
                task.tagName === 'TEXTAREA' || 
                task.classList.contains('tahap-comments')) {
                return;
            }
            
            // Get weight (use helper)
            const weight = window.getTaskWeight(task);
            
            // Count task
            totalWeight += weight;
            
            // Check completion
            if (task.classList.contains('progress-slider')) {
                // Slider: contribute partial progress based on value
                const value = parseInt(task.value) || 0;
                completedWeight += weight * (value / 100);
             }
            else if (task.type === 'checkbox') {
                // Checkbox: checked = complete
                if (task.checked) completedWeight += weight;
            }
            else if (task.type === 'hidden' || task.type === 'text') {
                // Hidden/Text: ada value = complete
                if (task.value && task.value.trim() !== '') completedWeight += weight;
            }
        });

        // Update setiap tahap progress bar
        updateTahapProgressUI(section, tahap);
    });
    
    // Hitung persentase overall
    let totalPercent = 0;
    if (totalWeight > 0) {
        totalPercent = Math.round((completedWeight / totalWeight) * 100);
    }
    
     // Update overall progress display
    updateTotalProgressDisplay(totalPercent + '%', rolePage);
    
    return totalPercent;
};

// Fungsi update slider User2 dari data DB
window.updateSliderFromDB = function(task, value, roleSuffix = 'User2') {
    const taskBaseNames = {
        'LAND CLEARING': 'landClearing',
        'PONDASI': 'pondasi',
        'SLOOF': 'sloof',
        'PAS.DDG S/D2 CANOPY': 'pasDdgCanopy',
        'PAS.DDG S/D RING BLK': 'pasDdgRingBlk',
        'CONDUIT+INBOW DOOS': 'conduit',
        'PIPA AIR KOTOR': 'pipaAirKotor',
        'PIPA AIR BERSIH': 'pipaAirBersih',
        'PLESTER': 'plester',
        'ACIAN & BENANGAN': 'acianBen',
        
        'RANGKA ATAP': 'rangkaAtap',
        'GENTENG': 'genteng',
        'PLAFOND': 'plafond',
        'INSTALASI LISTRIK': 'instalasiListrik',
        'KERAMIK LANTAI': 'keramikLantai',
        
        'KUSEN PINTU & JENDELA': 'kusen',
        'DAUN PINTU & JENDELA': 'daunPintu',
        'CAT DASAR + LAPIS AWAL': 'catDasar',
        'FITTING LAMPU': 'fittingLampu',
        'FIXTURE & SANITER': 'fixtureSaniter',
        'CAT FINISH INTERIOR': 'catInterior',
        'CAT FINISH EXTERIOR': 'catExterior',
        'BAK KONTROL & BATAS CARPORT': 'bakKontrol',
        'PAVING HALAMAN': 'pavingHalaman',
        'METERAN LISTRIK': 'meteranListrik',
        'METERAN AIR': 'meteranAir',
        'Konekting Air Bersih': 'konektingBersih',
        
        'Konekting Air Kotor': 'konektingKotor',
        'Gorong-gorong': 'gorongGorong',
        'Akses Jalan': 'aksesJalan',
        'GENERAL CLEANING': 'generalCleaning'
    };
    
    const baseName = taskBaseNames[task];
    if (!baseName) {
        return;
    }
    
    const sliderId = `${baseName}Slider${roleSuffix}`;
    const percentId = `${baseName}Percent${roleSuffix}`;
    const trackId = `${baseName}Track${roleSuffix}`;
    const hiddenId = `${baseName}Input${roleSuffix}`;
    
    const slider = document.getElementById(sliderId);
    const percentBox = document.getElementById(percentId);
    const trackFill = document.getElementById(trackId);
    const hiddenInput = document.getElementById(hiddenId);
    const sliderContainer = slider ? slider.closest('.slider-container') : null;
    const checkbox100 = document.querySelector(`input.check-100[data-slider="${sliderId}"]`);
    
    if (!slider || !percentBox || !trackFill) {
        return;
    }
    
    let numValue = 0;
    if (value) {
        if (typeof value === 'string') {
            numValue = parseInt(value.replace('%', '')) || 0;
        } else if (typeof value === 'number') {
            numValue = value;
        } else if (typeof value === 'boolean' && value === true) {
            numValue = 100;
        }
    }
    
    slider.value = numValue;
    percentBox.textContent = numValue + '%';
    trackFill.style.width = numValue + '%';
    if (hiddenInput) hiddenInput.value = numValue > 0 ? numValue + '%' : '';
    if (sliderContainer && typeof window.updateSnapMarkers === 'function') window.updateSnapMarkers(sliderContainer, numValue);
    if (checkbox100) checkbox100.checked = (numValue === 100);
    
    console.log(`📊 Updated ${roleSuffix} slider ${task} to ${numValue}% from DB`);
};

// Backwards compatibility alias
window.updateUser2SliderFromDB = function(task, value) {
    window.updateSliderFromDB(task, value, 'User2');
};

// ========== SAVETAHAPREVISI ==========
window.saveTahapRevisi = async function() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const revisiSection = document.querySelector(`#${rolePage} .progress-section[data-tahap="revisi"]`);
  if (!revisiSection) return;

  const saveButton = revisiSection.querySelector('.btn-save-revisi');
  const notesEl = revisiSection.querySelector('#kondisiUnitNotesUser1');
  
  const tahapData = {};
  if (notesEl) {
    tahapData['KETERANGAN_KONDISI_UNIT'] = notesEl.value.trim();
  }

  // Tambahkan foto ke data yang dikirim (sebagai array base64)
  tahapData['FOTO_KONDISI_PROPERTI'] = selectedRevisiPhotos;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }

  showGlobalLoading('Menyimpan Kondisi Unit Saat Ini & Foto...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahapRevisi',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });

    hideGlobalLoading();

    if (result.success) {
      showToast('success', `Berhasil! Kondisi Unit Saat Ini untuk Blok ${selectedKavling} telah tersimpan.`);
      // Reset foto setelah sukses
      selectedRevisiPhotos = [];
      if (typeof renderRevisiPreviews === 'function') renderRevisiPreviews();
    } else {
      showToast('error', result.message || 'Gagal menyimpan kondisi unit');
    }
  } catch (error) {
    console.error('Error saving kondisi unit:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Kondisi Unit';
      saveButton.disabled = false;
    }
  }
};

// ========== SAVETAHAP1 ==========
window.saveTahap1 = async function() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap1Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="1"]`);
  if (!tahap1Section) return;

  const checkboxes = tahap1Section.querySelectorAll('.sub-task');

  // PERBAIKAN: Cari input berdasarkan role yang sedang aktif
  let currentWasteSystemInput, currentTableKitchenInput;

  if (currentRole === 'user1') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser1');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser1');
  } else if (currentRole === 'user2') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser2');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser2');
  } else if (currentRole === 'user3') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser3');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser3');
  } else if (currentRole === 'user4') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser4');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser4');
  } else if (currentRole === 'user5') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser5');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser5');
  } else {
    // Fallback untuk role lain
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInput');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInput');
  }

  const saveButton = tahap1Section.querySelector('.btn-save-section');

  const t1Mapping = {
    "Land Clearing": "LAND CLEARING",
    "Pondasi": "PONDASI",
    "Sloof": "SLOOF",
    "Pas.Ddg S/D2 CANOPY": "PAS.DDG S/D2 CANOPY",
    "Pas.Ddg S/D Ring Blk": "PAS.DDG S/D RING BLK",
    "PAS.DDG S/D2 CANOPY": "PAS.DDG S/D2 CANOPY",
    "PAS.DDG S/D RING BLK": "PAS.DDG S/D RING BLK",
    "Pas.Ddg S/D Canopy ": "PAS.DDG S/D2 CANOPY",
    "Pas.Ddg S/D Ring Blk ": "PAS.DDG S/D RING BLK",
    "Conduit + Inbow Doos": "CONDUIT+INBOW DOOS",
    "Pipa Air Kotor": "PIPA AIR KOTOR",
    "Pipa Air Bersih": "PIPA AIR BERSIH",
    "Sistem Pembuangan": "SISTEM PEMBUANGAN",
    "Plester": "PLESTER",
    "Acian & Benangan": "ACIAN & BENANGAN",
    "Cor Meja Dapur": "COR MEJA DAPUR"
  };

  const tahapData = {};

  // Handle checkbox biasa dengan mapping yang benar
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const spreadsheetTaskName = checkbox.getAttribute('data-task');
      if (spreadsheetTaskName) {
        tahapData[spreadsheetTaskName] = checkbox.checked;
      }
    }
  });

  // Handle Cor Meja Dapur
  const currentCorMejaDapurInputEl = tahap1Section.querySelector(`#tableKitchenInput${currentRole === 'user1' ? 'User1' : currentRole === 'user2' ? 'User2' : currentRole === 'user3' ? 'User3' : ''}`);
  if (currentCorMejaDapurInputEl) {
    const tableValue = currentCorMejaDapurInputEl.value;
    console.log('Cor Meja Dapur value from input:', tableValue);
    if (tableValue === 'include' || tableValue === 'Dengan Cor Meja Dapur') {
      tahapData['COR MEJA DAPUR'] = 'Dengan Cor Meja Dapur';
    } else if (tableValue === 'exclude' || tableValue === 'Tanpa Cor Meja Dapur') {
      tahapData['COR MEJA DAPUR'] = 'Tanpa Cor Meja Dapur';
    } else {
      tahapData['COR MEJA DAPUR'] = tableValue;
    }
  }

  // Handle Sistem Pembuangan
  const currentWasteSystemInputEl = tahap1Section.querySelector(`#wasteSystemInput${currentRole === 'user1' ? 'User1' : currentRole === 'user2' ? 'User2' : currentRole === 'user3' ? 'User3' : ''}`);
  if (currentWasteSystemInputEl) {
    const wasteValue = currentWasteSystemInputEl.value;
    console.log('Sistem Pembuangan value from input:', wasteValue);
    if (wasteValue === 'septictank') {
      tahapData['SISTEM PEMBUANGAN'] = 'Septictank';
    } else if (wasteValue === 'biotank') {
      tahapData['SISTEM PEMBUANGAN'] = 'Biotank';
    } else if (wasteValue === 'ipal') {
      tahapData['SISTEM PEMBUANGAN'] = 'Ipal';
    } else {
      tahapData['SISTEM PEMBUANGAN'] = wasteValue;
    }
  }

  // Debug data yang akan dikirim
  console.log('Data Tahap 1 yang akan disimpan:', tahapData);

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }

  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 1...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap1',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });

    hideGlobalLoading();

    if (result.success) {
      showToast('success', `Berhasil! Tahap 1 untuk Blok ${selectedKavling} telah tersimpan.`);

      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap1) currentKavlingData.data.tahap1 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap1[taskName] = tahapData[taskName];
          }
        });
      }

      if (typeof updateProgress === 'function') updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 1');
    }
  } catch (error) {
    console.error('Error saving tahap 1:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 1';
      saveButton.disabled = false;
    }
  }
};

// ========== SAVETAHAP2 ==========
window.saveTahap2 = async function() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap2Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="2"]`);
  if (!tahap2Section) return;

  const checkboxes = tahap2Section.querySelectorAll('.sub-task');

  // PERBAIKAN: Cari input bathroomTiles berdasarkan role
  let bathroomTilesInput;
  if (currentRole === 'user1') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser1');
  } else if (currentRole === 'user2') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser2');
  } else if (currentRole === 'user3') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser3');
  } else if (currentRole === 'user4') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser4');
  } else if (currentRole === 'user5') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser5');
  } else {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInput');
  }

  const saveButton = tahap2Section.querySelector('.btn-save-section');

  const t2Mapping = {
    "Rangka Atap": "RANGKA ATAP",
    "Genteng": "GENTENG",
    "Plafond": "PLAFOND",
    "Keramik Dinding Toilet & Dapur": "KERAMIK DINDING TOILET & DAPUR",
    "Instalasi Listrik": "INSTALASI LISTRIK",
    "Keramik Lantai": "KERAMIK LANTAI"
  };

  const tahapData = {};

  // Handle checkbox biasa dengan mapping yang benar
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const spreadsheetTaskName = checkbox.getAttribute('data-task');
      if (spreadsheetTaskName) {
        tahapData[spreadsheetTaskName] = checkbox.checked;
      }
    }
  });

  // PERBAIKAN: Handle Keramik Dinding Toilet & Dapur
  if (bathroomTilesInput) {
    const tilesValue = bathroomTilesInput.value;
    console.log('Keramik Dinding value:', tilesValue);

    if (tilesValue === 'include' || tilesValue === 'Dengan Keramik Dinding') {
      tahapData['KERAMIK DINDING TOILET & DAPUR'] = 'Dengan Keramik Dinding';
    } else if (tilesValue === 'exclude' || tilesValue === 'Tanpa Keramik Dinding') {
      tahapData['KERAMIK DINDING TOILET & DAPUR'] = 'Tanpa Keramik Dinding';
    } else {
      tahapData['KERAMIK DINDING TOILET & DAPUR'] = '';
    }
  }

  // Debug data yang akan dikirim
  console.log('Data Tahap 2 yang akan disimpan:', tahapData);

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }

  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 2...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap2',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });

    hideGlobalLoading();

    if (result.success) {
      showToast('success', `Berhasil! Tahap 2 untuk Blok ${selectedKavling} telah tersimpan.`);

      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap2) currentKavlingData.data.tahap2 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap2[taskName] = tahapData[taskName];
          }
        });
      }

      if (typeof updateProgress === 'function') updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 2');
    }
  } catch (error) {
    console.error('Error saving tahap 2:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 2';
      saveButton.disabled = false;
    }
  }
};

// ========== SAVETAHAP3 ==========
window.saveTahap3 = async function() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap3Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="3"]`);
  if (!tahap3Section) return;

  const checkboxes = tahap3Section.querySelectorAll('.sub-task');
  const saveButton = tahap3Section.querySelector('.btn-save-section');

  const t3Mapping = {
    "Kusen Pintu & Jendela": "KUSEN PINTU & JENDELA",
    "Daun Pintu & Jendela": "DAUN PINTU & JENDELA",
    "Cat Dasar + Lapis Awal": "CAT DASAR + LAPIS AWAL",
    "Fitting Lampu": "FITTING LAMPU",
    "Fixture & Saniter": "FIXTURE & SANITER",
    "Cat Finish Interior": "CAT FINISH INTERIOR",
    "Cat Finish Exterior": "CAT FINISH EXTERIOR",
    "Bak Kontrol & Batas Carport": "BAK KONTROL & BATAS CARPORT",
    "Paving Halaman": "PAVING HALAMAN",
    "Meteran Listrik": "METERAN LISTRIK",
    "Meteran Air": "METERAN AIR",
    "General Cleaning": "GENERAL CLEANING"
  };

  const tahapData = {};

  // Handle checkbox biasa dengan mapping yang benar
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const spreadsheetTaskName = checkbox.getAttribute('data-task');
      if (spreadsheetTaskName) {
        tahapData[spreadsheetTaskName] = checkbox.checked;
      }
    }
  });

  // Debug data yang akan dikirim
  console.log('Data Tahap 3 yang akan disimpan:', tahapData);

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }

  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 3...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap3',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });

    hideGlobalLoading();

    if (result.success) {
      showToast('success', `Berhasil! Tahap 3 untuk Blok ${selectedKavling} telah tersimpan.`);

      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap3) currentKavlingData.data.tahap3 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap3[taskName] = tahapData[taskName];
          }
        });
      }

      if (typeof updateProgress === 'function') updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 3');
    }
  } catch (error) {
    console.error('Error saving tahap 3:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 3';
      saveButton.disabled = false;
    }
  }
};

// ========== SAVETAHAP4 ==========
window.saveTahap4 = async function() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap4Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="4"]`);
  if (!tahap4Section) return;

  const commentEl = tahap4Section.querySelector('.tahap-comments');
  const deliveryEl = tahap4Section.querySelector('.key-delivery-input');
  const dateEl = tahap4Section.querySelector('.key-delivery-date');
  const saveButton = tahap4Section.querySelector('.btn-save-section');

  // Cari checkbox completion di tahap 4
  let completionCheckbox = tahap4Section.querySelector('.sub-task[data-task="COMPLETION / Penyelesaian akhir"]');
  if (!completionCheckbox) {
    // Cari dengan cara lain jika data-task tidak ada
    const allCheckboxes = tahap4Section.querySelectorAll('.sub-task[type="checkbox"]');
    for (const checkbox of allCheckboxes) {
      const label = checkbox.closest('label');
      if (label && label.textContent.toLowerCase().includes('completion')) {
        completionCheckbox = checkbox;
        break;
      }
    }
  }

  const tahapData = {};

  // Handle Completion checkbox
  if (completionCheckbox) {
    tahapData['COMPLETION / Penyelesaian akhir'] = completionCheckbox.checked;
    console.log('Completion checked:', completionCheckbox.checked);
  }

  // Handle Keterangan
  if (commentEl) {
    tahapData['KETERANGAN'] = commentEl.value.trim();
    console.log('Keterangan:', tahapData['KETERANGAN']);
  }

  // Handle Penyerahan Kunci
  if (deliveryEl) {
    tahapData['PENYERAHAN KUNCI'] = deliveryEl.value.trim();
    console.log('Penyerahan Kunci:', tahapData['PENYERAHAN KUNCI']);
  }

  // Handle Tanggal Penyerahan Kunci
  if (dateEl && dateEl.value.trim()) {
    const dateValue = dateEl.value.trim();

    // Validasi format dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      tahapData['TANGGAL_PENYERAHAN_KUNCI'] = dateValue;
      console.log('Tanggal valid:', dateValue);
    } else {
      // Jika format tidak valid, kirim string kosong
      tahapData['TANGGAL_PENYERAHAN_KUNCI'] = '';
      console.log('Format tanggal tidak valid, dikirim kosong');
      showToast('warning', 'Format tanggal harus dd/mm/yyyy (contoh: 25/12/2023)');
    }
  } else if (dateEl) {
    // Jika input kosong atau hanya spasi
    tahapData['TANGGAL_PENYERAHAN_KUNCI'] = '';
    console.log('Tanggal kosong, dikirim string kosong');
  }

  // Debug data yang akan dikirim
  console.log('Data Tahap 4 yang akan disimpan:', tahapData);

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }

  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 4...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap4',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });

    hideGlobalLoading();

    if (result.success) {
      showToast('success', `Berhasil! Tahap 4 untuk Blok ${selectedKavling} telah tersimpan.`);

      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap4) currentKavlingData.data.tahap4 = {};

        // Update semua field tahap 4
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap4[taskName] = tahapData[taskName];
          }
        });
      }

      // Update total progress display dengan benar
      if (result.totalProgress) {
        if (typeof updateTotalProgressDisplay === 'function') {
          updateTotalProgressDisplay(result.totalProgress, rolePage);
        }

        // Update juga di overall rekap
        const overallPercent = document.querySelector(`#${rolePage} .total-percent`);
        const overallBar = document.querySelector(`#${rolePage} .total-bar`);

        if (overallPercent) {
          overallPercent.textContent = result.totalProgress;
        }
        if (overallBar) {
          // Parse persentase untuk width
          let percentValue = 0;
          if (typeof result.totalProgress === 'string') {
            const match = result.totalProgress.match(/(\d+)%/);
            if (match) {
              percentValue = parseInt(match[1]);
            }
          }
          overallBar.style.width = percentValue + '%';
        }
      }

      // Refresh data kavling untuk mendapatkan progress terbaru dari server
      setTimeout(async () => {
        if (typeof searchKavling === 'function') await searchKavling(); // Ini akan memuat ulang data dengan progress terbaru
        if (typeof updateProgress === 'function') updateProgress(rolePage); // Update perhitungan progress lokal
      }, 300);

    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 4');
    }

  } catch (error) {
    console.error('Error saving tahap 4:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 4';
      saveButton.disabled = false;
    }
  }
};

// ========== LOADKEYDELIVERYDATA ==========
window.loadKeyDeliveryData = async function() {
  if (!selectedKavling) return;

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKeyDeliveryData',
      kavling: selectedKavling
    });

    if (result.success && result.hasData) {
      if (typeof updateKeyDeliveryDisplay === 'function') updateKeyDeliveryDisplay(result);
    } else if (result.success && !result.hasData) {
      // Data kosong, tampilkan form kosong
      if (typeof resetKeyDeliveryForm === 'function') resetKeyDeliveryForm();
    }
  } catch (error) {
    console.error('Error loading key delivery data:', error);
  }
};

// Fungsi setup event listeners untuk tombol progress
window.setupProgressButtons = function(page) {
  const progressBtns = page.querySelectorAll('.progress-btn');
  progressBtns.forEach(btn => {
    // Clone node to remove existing listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.closest('.progress-choice');
      if (!parent) return;

      const input = parent.querySelector('input[type="hidden"].sub-task');
      if (!input) return;

      // Reset active
      const siblings = parent.querySelectorAll('.progress-btn');
      siblings.forEach(s => s.classList.remove('active'));

      // Toggle value
      const value = this.getAttribute('data-value');
      if (input.value === value) {
        input.value = '';
      } else {
        input.value = value;
        this.classList.add('active');
      }

      console.log(`Progress button clicked: ${this.getAttribute('data-task')} = ${input.value}`);

      // Update UI sekali saja
      const tahapSection = this.closest('.progress-section');
      if (tahapSection) {
        const tahap = tahapSection.getAttribute('data-tahap');
        if (typeof updateTahapProgressUI === 'function') {
          updateTahapProgressUI(tahapSection, tahap);
        }
      }
    });
  });
};

