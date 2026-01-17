// progress.js - Progress Calculation and Management

// ========== PROGRESS CALCULATION ==========
function updateProgress(rolePage) {
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  const progressSections = pageElement.querySelectorAll('.progress-section[data-tahap]');
  let totalWeightedProgress = 0;
  let totalPossibleWeight = 0;

  progressSections.forEach(section => {
    const tahap = section.getAttribute('data-tahap');
    const tasks = section.querySelectorAll('.sub-task');
    let completedTasksWeight = 0;
    let totalSectionWeight = 0;

    tasks.forEach(task => {
      const weight = parseFloat(task.getAttribute('data-weight')) || 1;
      totalSectionWeight += weight;

      if (task.type === 'checkbox') {
        if (task.checked) {
          completedTasksWeight += weight;
        }
      } else if (task.type === 'hidden') {
        if (task.value && task.value.trim() !== '') {
          completedTasksWeight += weight;
        }
      }
      else if (task.type === 'text' || task.type === 'textarea' || task.type === 'date') {
        // Untuk field text/textarea/date di tahap 4, hitung jika ada isi
        if (tahap === '4' && task.value && task.value.trim() !== '') {
          completedTasksWeight += weight;
        }
      }
    });

    const sectionPercent = totalSectionWeight > 0 ? (completedTasksWeight / totalSectionWeight) * 100 : 0;
    const subPercentEl = section.querySelector('.sub-percent');
    if (subPercentEl) {
      subPercentEl.textContent = Math.round(sectionPercent) + '%';
    }

    const progressFill = section.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = sectionPercent + '%';
    }

    // Weight yang lebih realistis
    const tahapWeights = { 
      '1': 0.40,  // 40%
      '2': 0.30,  // 30%
      '3': 0.20,  // 20%
      '4': 0.10   // 10%
    };
    
    const weightFactor = tahapWeights[tahap] || 0.25;
    totalWeightedProgress += sectionPercent * weightFactor;
  });
  
  // PERBAIKAN: Update dengan persentase yang benar
  const roundedProgress = Math.round(totalWeightedProgress);
  updateTotalProgressDisplay(Math.round(totalWeightedProgress) + '%', rolePage);
  
  // Juga update langsung di overall rekap
  const overallPercent = pageElement.querySelector('.total-percent');
  const overallBar = pageElement.querySelector('.total-bar');
  
  if (overallPercent) {
    overallPercent.textContent = roundedProgress + '%';
  }
  if (overallBar) {
    overallBar.style.width = roundedProgress + '%';
  }
  
  console.log(`Updated progress for ${rolePage}: ${roundedProgress}%`);
}

function updateTotalProgressDisplay(progress, pageId) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return;

  const totalPercentEl = pageElement.querySelector('.total-percent');
  if (totalPercentEl) {
    totalPercentEl.textContent = progress;
  }

  const totalBarEl = pageElement.querySelector('.total-bar');
  if (totalBarEl) {
    totalBarEl.style.width = progress;
  }
}

function updateManagerProgressDisplay(totalProgress) {
  const progressDisplay = document.getElementById('managerProgressDisplay');
  if (!progressDisplay) {
    console.error('managerProgressDisplay element not found');
    return;
  }
  
  progressDisplay.style.display = 'block';
  
  const overallVal = progressDisplay.querySelector('.val-overall');
  const progressFill = progressDisplay.querySelector('.total-bar');
  
  if (overallVal) {
    let displayProgress = totalProgress || '0%';
    
    // Jika masih berupa angka desimal (0.97), konversi ke persen
    if (typeof totalProgress === 'string' && !totalProgress.includes('%')) {
      const num = parseFloat(totalProgress);
      if (!isNaN(num)) {
        displayProgress = (num <= 1 ? Math.round(num * 100) : Math.round(num)) + '%';
      }
    } else if (typeof totalProgress === 'number') {
      displayProgress = (totalProgress <= 1 ? Math.round(totalProgress * 100) : Math.round(totalProgress)) + '%';
    }
    
    overallVal.textContent = displayProgress;
  }
  
  if (progressFill) {
    let percentValue = 0;
    
    if (typeof totalProgress === 'string') {
      const percentMatch = totalProgress.match(/(\d+)%/);
      if (percentMatch) {
        percentValue = parseInt(percentMatch[1]);
      } else {
        const num = parseFloat(totalProgress);
        if (!isNaN(num)) {
          percentValue = num <= 1 ? Math.round(num * 100) : Math.round(num);
        }
      }
    } else if (typeof totalProgress === 'number') {
      percentValue = totalProgress <= 1 ? Math.round(totalProgress * 100) : Math.round(totalProgress);
    }
    
    progressFill.style.width = percentValue + '%';
    
    progressFill.className = 'total-bar';
    if (percentValue >= 89) progressFill.classList.add('bar-high');
    else if (percentValue >= 60) progressFill.classList.add('bar-medium');
    else if (percentValue >= 10) progressFill.classList.add('bar-low');
    else progressFill.classList.add('bar-very-low');
  }
}

function updateUtilitasProgressDisplay(totalProgress) {
  const percentEl = document.getElementById('utilityOverallPercent');
  const barEl = document.getElementById('utilityOverallBar');
  
  if (!percentEl || !barEl) return;
  
  let displayProgress = totalProgress;
  let percentValue = 0;
  
  if (typeof totalProgress === 'string') {
    if (totalProgress.includes('%')) {
      percentValue = parseInt(totalProgress);
    } else {
      const num = parseFloat(totalProgress);
      if (!isNaN(num)) {
        percentValue = num <= 1 ? Math.round(num * 100) : Math.round(num);
        displayProgress = percentValue + '%';
      }
    }
  } else if (typeof totalProgress === 'number') {
    percentValue = totalProgress <= 1 ? Math.round(totalProgress * 100) : Math.round(totalProgress);
    displayProgress = percentValue + '%';
  }
  
  percentEl.textContent = displayProgress;
  barEl.style.width = percentValue + '%';
  
  // Color classes
  barEl.className = 'total-bar';
  if (percentValue >= 89) barEl.classList.add('bar-high');
  else if (percentValue >= 60) barEl.classList.add('bar-medium');
  else if (percentValue >= 10) barEl.classList.add('bar-low');
  else barEl.classList.add('bar-very-low');
}

// ========== STATE BUTTON FUNCTIONS ==========
function toggleSystemButton(button, systemType) {
  console.log('toggleSystemButton called:', systemType);
  
  const taskItem = button.closest('.task-item');
  if (!taskItem) return;
  
  const buttons = taskItem.querySelectorAll('.system-btn');
  const hiddenInput = taskItem.querySelector('#wasteSystemInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
    console.log('System button deactivated');
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.style.backgroundColor = '#3b82f6';
    button.style.color = 'white';
    button.setAttribute('data-active', 'true');
    
    // Set nilai sesuai systemType
    let displayValue = '';
    switch(systemType) {
      case 'septictank': displayValue = 'Septictank'; break;
      case 'biotank': displayValue = 'Biotank'; break;
      case 'ipal': displayValue = 'Ipal'; break;
      default: displayValue = systemType;
    }
    
    hiddenInput.value = displayValue;
    console.log('System button activated:', displayValue);
  }
  
  const rolePage = window.appGlobals.currentRole + 'Page';
  updateProgress(rolePage);
}

function toggleTilesButton(button, option) {
  console.log('toggleTilesButton called:', option);
  
  const taskItem = button.closest('.task-item');
  if (!taskItem) return;
  
  const buttons = taskItem.querySelectorAll('.tiles-btn');
  const hiddenInput = taskItem.querySelector('#bathroomTilesInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
    console.log('Tiles button deactivated');
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.style.backgroundColor = '#3b82f6';
    button.style.color = 'white';
    button.setAttribute('data-active', 'true');
    
    hiddenInput.value = option === 'include' ? 'Dengan Keramik Dinding' : 'Tanpa Keramik Dinding';
    console.log('Tiles button activated:', hiddenInput.value);
  }
  
  const rolePage = window.appGlobals.currentRole + 'Page';
  updateProgress(rolePage);
}

function toggleTableButton(button, option) {
  console.log('toggleTableButton called:', option);
  
  const taskItem = button.closest('.task-item');
  if (!taskItem) return;
  
  const buttons = taskItem.querySelectorAll('.table-btn');
  const hiddenInput = taskItem.querySelector('#tableKitchenInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
    console.log('Table button deactivated');
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.style.backgroundColor = '#3b82f6';
    button.style.color = 'white';
    button.setAttribute('data-active', 'true');
    
    hiddenInput.value = option === 'include' ? 'Dengan Cor Meja Dapur' : 'Tanpa Cor Meja Dapur';
    console.log('Table button activated:', hiddenInput.value);
  }
  
  const rolePage = window.appGlobals.currentRole + 'Page';
  updateProgress(rolePage);
}

// ========== PROGRESS DATA LOADING ==========
function loadProgressData(progressData) {
  if (!progressData) return;
  
  const rolePage = window.appGlobals.currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  // Load data untuk field pilihan khusus
  if (progressData.tahap1) {
    // Handle Sistem Pembuangan
    const sistemPembuanganValue = progressData.tahap1['SISTEM PEMBUANGAN'];
    if (sistemPembuanganValue) {
      const taskItem = pageElement.querySelector('.waste-system');
      if (taskItem) {
        const buttons = taskItem.querySelectorAll('.system-btn');
        const hiddenInput = taskItem.querySelector('#wasteSystemInput');
        
        // Reset active state first
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('data-active', 'false');
        });
        
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === sistemPembuanganValue.toLowerCase()) {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        
        if (hiddenInput) {
          hiddenInput.value = sistemPembuanganValue;
        }
      }
    }
    
    // Handle Cor Meja Dapur
    const corMejaDapurValue = progressData.tahap1['COR MEJA DAPUR'];
    if (corMejaDapurValue) {
      const taskItem = pageElement.querySelector('.table-kitchen');
      if (taskItem) {
        const buttons = taskItem.querySelectorAll('.table-btn');
        const hiddenInput = taskItem.querySelector('#tableKitchenInput');
        
        // Reset active state first
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('data-active', 'false');
        });
        
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && corMejaDapurValue === 'Dengan Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && corMejaDapurValue === 'Tanpa Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        
        if (hiddenInput) {
          hiddenInput.value = corMejaDapurValue;
        }
      }
    }
    
    // Load checkbox biasa untuk tahap 1
    const checkboxTasks1 = ['LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 
                           'PAS.DDG S/D RING BLK', 'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 
                           'PIPA AIR BERSIH', 'PLESTER', 'ACIAN & BENANGAN'];
    
    checkboxTasks1.forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }
  
  if (progressData.tahap2) {
    // Handle Keramik Dinding Toilet & Dapur
    const keramikDindingValue = progressData.tahap2['KERAMIK DINDING TOILET & DAPUR'];
    if (keramikDindingValue) {
      const taskItem = pageElement.querySelector('.bathroom-tiles');
      if (taskItem) {
        const buttons = taskItem.querySelectorAll('.tiles-btn');
        const hiddenInput = taskItem.querySelector('#bathroomTilesInput');
        
        // Reset active state first
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('data-active', 'false');
        });
        
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && keramikDindingValue === 'Dengan Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && keramikDindingValue === 'Tanpa Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        
        if (hiddenInput) {
          hiddenInput.value = keramikDindingValue;
        }
      }
    }
    
    // Load checkbox biasa untuk tahap 2
    const checkboxTasks2 = ['RANGKA ATAP', 'GENTENG', 'PLAFOND', 'INSTALASI LISTRIK', 'KERAMIK LANTAI'];
    
    checkboxTasks2.forEach(taskName => {
      const isChecked = progressData.tahap2[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 2, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }
  
  if (progressData.tahap3) {
    Object.keys(progressData.tahap3).forEach(taskName => {
      const isChecked = progressData.tahap3[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 3, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }

  if (progressData.tahap4) {
    // Load Keterangan
    if (progressData.tahap4['KETERANGAN']) {
      const commentEl = pageElement.querySelector('.tahap-comments');
      if (commentEl) {
        commentEl.value = progressData.tahap4['KETERANGAN'];
      }
    }
    
    // Load Penyerahan Kunci
    if (progressData.tahap4['PENYERAHAN KUNCI']) {
      const deliveryEl = pageElement.querySelector('.key-delivery-input');
      if (deliveryEl) {
        deliveryEl.value = progressData.tahap4['PENYERAHAN KUNCI'];
      }
    }

    // Load Tanggal Penyerahan Kunci
    if (progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI']) {
      const dateEl = pageElement.querySelector('.key-delivery-date');
      if (dateEl) {
        const rawDate = progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI'];
        let formattedDate = '';
        
        if (rawDate instanceof Date || (typeof rawDate === 'string' && rawDate.includes('-'))) {
          formattedDate = formatDateForInput(rawDate);
        } else if (rawDate) {
          formattedDate = formatDateForInput(new Date(rawDate));
        }
        
        dateEl.value = formattedDate;
      }
    }

    // Load Completion
    if (progressData.tahap4['COMPLETION / Penyelesaian akhir']) {
      const completionCheckbox = findCheckboxByTaskName('COMPLETION / Penyelesaian akhir', 4, rolePage);
      if (completionCheckbox) {
        completionCheckbox.checked = true;
        const label = completionCheckbox.closest('label');
        if (label) {
          label.classList.add('task-completed');
        }
      }
    }
    
    // Update total progress
    if (progressData.tahap4['TOTAL']) {
      updateTotalProgressDisplay(progressData.tahap4['TOTAL'] || '0%', rolePage);
    }
  }
  
  console.log(`🔄 Starting UI setup for ${rolePage}...`);
  
  setTimeout(() => {
    console.log(`✅ Data loaded for ${rolePage}, setting up UI...`);
    
    // Setup checkbox listeners
    setupCheckboxListeners(rolePage);
    
    // Setup state buttons
    setupStateButtons(rolePage);
    
    // Update progress calculation
    updateProgress(rolePage);
    
    console.log(`✅ UI setup complete for ${rolePage}!`);
  }, 300);
}

// ========== HELPER FUNCTIONS ==========
function findCheckboxByTaskName(taskName, tahap, pageId) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return null;
  
  const cleanTaskName = taskName.toUpperCase().trim();
  const checkboxes = pageElement.querySelectorAll(`[data-tahap="${tahap}"] .sub-task[type="checkbox"]`);
  
  for (let cb of checkboxes) {
    if (cb.getAttribute('data-task') === cleanTaskName) {
      return cb;
    }
  }
  
  // Fallback: search by text content if data-task doesn't match
  const cleanSearch = cleanTaskName.replace(/[^A-Z0-9]/g, '');
  for (let cb of checkboxes) {
    const label = cb.closest('label');
    if (label) {
      const labelText = label.textContent.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (labelText.includes(cleanSearch) || cleanSearch.includes(labelText)) {
        return cb;
      }
    }
  }
  return null;
}

function formatDateForInput(dateValue) {
  try {
    if (!dateValue) return '';
    
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      } else {
        const parts = dateValue.split(/[\/\-]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          date = new Date(year, month, day);
        } else {
          return '';
        }
      }
    } else {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

function setupCheckboxListeners(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;
  
  console.log(`Setting up checkbox listeners for ${pageId}`);
  
  const checkboxes = page.querySelectorAll('.progress-section input[type="checkbox"].sub-task');
  
  checkboxes.forEach(checkbox => {
    const newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    
    newCheckbox.addEventListener('change', function() {
      const label = this.closest('label');
      if (label) {
        if (this.checked) {
          label.classList.add('task-completed');
        } else {
          label.classList.remove('task-completed');
        }
      }
      
      updateProgress(pageId);
    });
    
    newCheckbox.disabled = false;
    newCheckbox.style.pointerEvents = 'auto';
    newCheckbox.style.opacity = '1';
    newCheckbox.style.cursor = 'pointer';
  });
  
  console.log(`✅ Setup ${checkboxes.length} checkbox listeners for ${pageId}`);
}

function setupStateButtons(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;
  
  console.log(`Setting up state buttons for ${pageId}`);
  
  // 1. Sistem Pembuangan
  const systemBtns = page.querySelectorAll('.system-btn');
  systemBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleSystemButton(this, this.getAttribute('data-state'));
    };
  });
  
  // 2. Keramik Dinding
  const tilesBtns = page.querySelectorAll('.tiles-btn');
  tilesBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleTilesButton(this, this.getAttribute('data-state'));
    };
  });
  
  // 3. Cor Meja Dapur
  const tableBtns = page.querySelectorAll('.table-btn');
  tableBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleTableButton(this, this.getAttribute('data-state'));
    };
  });
}

// Export functions
window.progress = {
  updateProgress,
  updateTotalProgressDisplay,
  updateManagerProgressDisplay,
  updateUtilitasProgressDisplay,
  toggleSystemButton,
  toggleTilesButton,
  toggleTableButton,
  loadProgressData,
  setupCheckboxListeners,
  setupStateButtons
};
