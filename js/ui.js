// UI Helper Functions and Global UI State Management

// ========== GLOBAL UI HELPERS ==========

window.showStatusModal = function(type, title, message) {
  const modal = document.getElementById('loadingModal');
  const textEl = document.getElementById('loadingText');
  const modalContent = modal.querySelector('.modal-content');

  if (!modalContent) return;

  const isDelete = type === 'delete-success';
  const isSuccess = type === 'success' || isDelete;
  const isError = type === 'error';

  let iconHtml = '';
  if (type === 'loading') {
    iconHtml = '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>';
  } else if (isSuccess) {
    iconHtml = `
      <div class="success-checkmark">
        <div class="check-icon ${isDelete ? 'delete' : ''}">
          <span class="icon-line line-tip"></span>
          <span class="icon-line line-long"></span>
          <div class="icon-circle"></div>
          <div class="icon-fix"></div>
        </div>
      </div>
      <style>
        .success-checkmark { width: 80px; height: 115px; margin: 0 auto; position: relative; }
        .success-checkmark .check-icon { width: 80px; height: 80px; position: relative; border-radius: 50%; box-sizing: content-box; border: 4px solid #10b981; margin-bottom: 20px; }
        .success-checkmark .check-icon.delete { border-color: #ef4444; }
        .success-checkmark .check-icon .icon-line { height: 5px; background-color: #10b981; display: block; border-radius: 2px; position: absolute; z-index: 10; }
        .success-checkmark .check-icon.delete .icon-line { background-color: #ef4444; }
        .success-checkmark .check-icon .icon-line.line-tip { top: 46px; left: 14px; width: 25px; transform: rotate(45deg); animation: icon-line-tip 0.75s; }
        .success-checkmark .check-icon .icon-line.line-long { top: 38px; right: 8px; width: 47px; transform: rotate(-45deg); animation: icon-line-long 0.75s; }
        .success-checkmark .check-icon .icon-circle { top: -4px; left: -4px; z-index: 10; width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(16, 185, 129, 0.5); box-sizing: content-box; position: absolute; }
        .success-checkmark .check-icon.delete .icon-circle { border-color: rgba(239, 68, 68, 0.5); }
        .success-checkmark .check-icon .icon-fix { top: 8px; width: 5px; left: 26px; z-index: 1; height: 85px; position: absolute; transform: rotate(-45deg); }
        @keyframes icon-line-tip {
            0% { width: 0; left: 1px; top: 19px; }
            54% { width: 0; left: 1px; top: 19px; }
            70% { width: 50px; left: -8px; top: 37px; }
            84% { width: 17px; left: 21px; top: 48px; }
            100% { width: 25px; left: 14px; top: 46px; }
        }
        @keyframes icon-line-long {
            0% { width: 0; right: 46px; top: 54px; }
            65% { width: 0; right: 46px; top: 54px; }
            84% { width: 55px; right: 0px; top: 35px; }
            100% { width: 47px; right: 8px; top: 38px; }
        }
      </style>
    `;
  }

  modal.querySelector('.modal-content').innerHTML = `
    ${iconHtml}
    <h2 style="font-size: 1.25rem; margin-top: 10px;">${title}</h2>
    <p style="color: #94a3b8; margin-top: 5px;">${message}</p>
  `;

  modal.style.display = 'flex';

  if (isSuccess) {
    setTimeout(() => {
      hideGlobalLoading();
      // Restore original content for next use
      const modalContentEl = modal.querySelector('.modal-content');
      if (modalContentEl) {
        modalContentEl.innerHTML = `
          <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>
          <h2 style="font-size: 1.25rem;">Mohon Tunggu</h2>
          <p id="loadingText">Sedang mengambil data...</p>
        `;
      }
    }, 2000);
  }
};

window.showGlobalLoading = function(text = 'Mohon Tunggu...') {
  showStatusModal('loading', 'Mohon Tunggu', text);
};

window.hideGlobalLoading = function() {
  const modal = document.getElementById('loadingModal');
  if (modal) modal.style.display = 'none';
};

window.showToast = function(type, message) {
  // Hapus toast sebelumnya
  const existingToast = document.getElementById('globalToast');
  if (existingToast) existingToast.remove();

  const template = document.getElementById('toastTemplate');
  if (!template) return;

  const toast = template.content.cloneNode(true).querySelector('.toast');
  toast.id = 'globalToast';
  toast.classList.add(`toast-${type}`);

  const icon = toast.querySelector('i');
  icon.classList.add(type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');

  const messageSpan = toast.querySelector('.toast-message');
  messageSpan.textContent = message;

  if (template) document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};

window.setupTodayButtons = function() {
    console.log('🔧 Setting up "Hari Ini" buttons...');
  
    const todayBtns = document.querySelectorAll('.btn-today');
    console.log(`Found ${todayBtns.length} buttons`);
  
    todayBtns.forEach((btn, index) => {
      // Hapus event listener lama
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
  
      // Tambah event listener baru dengan lebih robust
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
  
        console.log(`✅ Tombol "Hari Ini" #${index + 1} diklik`);
  
        // Cari input tanggal dengan berbagai cara
        let dateInput = null;
  
        // Cara 1: Previous sibling
        if (this.previousElementSibling) {
          const prev = this.previousElementSibling;
          if (prev.matches('.key-delivery-date, input[type="date"], input[type="text"].date-input')) {
            dateInput = prev;
            console.log('Found input as previous sibling');
          }
        }
  
        // Cara 2: Cari di parent container
        if (!dateInput) {
          const parent = this.closest('div');
          if (parent) {
            const inputs = parent.querySelectorAll('.key-delivery-date, input[type="date"], .date-input');
            if (inputs.length > 0) {
              dateInput = inputs[0];
              console.log('Found input in parent container');
            }
          }
        }
  
        // Cara 3: Cari berdasarkan class
        if (!dateInput) {
          const inputs = document.querySelectorAll('.key-delivery-date, input[type="date"], .date-input');
          if (inputs.length > 0) {
            dateInput = inputs[0];
            console.log('Found first available date input');
          }
        }
  
        if (dateInput) {
          // Format hari ini
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
  
          // Set nilai (dd/mm/yyyy untuk text input, yyyy-MM-dd untuk date input)
          if (dateInput.type === 'date') {
            dateInput.value = `${year}-${month}-${day}`;
          } else {
            dateInput.value = `${day}/${month}/${year}`;
          }
  
          console.log(`📅 Set tanggal: ${dateInput.value}`);
  
          // Feedback visual
          const originalHTML = this.innerHTML;
          const originalBG = this.style.background;
  
          this.innerHTML = '<i class="fas fa-check-circle"></i> Terisi!';
          this.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  
          setTimeout(() => {
            this.innerHTML = originalHTML;
            this.style.background = originalBG;
          }, 1500);
  
          // Trigger events
          dateInput.dispatchEvent(new Event('input', { bubbles: true }));
          dateInput.dispatchEvent(new Event('change', { bubbles: true }));
  
        } else {
          console.warn('❌ Tidak menemukan input tanggal untuk tombol ini');
          
          // Feedback error
          const originalHTML = this.innerHTML;
          this.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error!';
          this.style.background = 'linear-gradient(135deg, #f43f5e, #dc2626)';
          
          setTimeout(() => {
              this.innerHTML = originalHTML;
              this.style.background = originalBG;
          }, 1500);
        }
      });
    });
};

window.showProgressMessage = function(type, message) {
  showToast(type, message);
};

// ========== FORM & INPUT HELPERS ==========

window.clearInputsForNewLoad = function() {
  console.log('Clearing all inputs and progress displays...');

  // 1. Reset Checkboxes and Labels
  const checkboxes = document.querySelectorAll('.sub-task[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = false;
    const label = cb.closest('.task-item');
    if (label) label.classList.remove('task-completed');
  });

  // 2. Reset Text, Hidden, and Date Inputs
  const textInputs = document.querySelectorAll('.sub-task-text, .tahap-comments, .key-delivery-input, .key-delivery-date, input[type="hidden"].sub-task, .search-input-custom');
  textInputs.forEach(input => {
    // Don't clear the active search input that was just used
    if (!input.id.includes('Input') || input.value === '') {
       // if it's not an input field or it's already empty, we can skip or clear others
    }
    if (!input.classList.contains('search-input-custom')) {
      input.value = '';
    }
  });

  // 3. Reset Dual-State Buttons
  const stateButtons = document.querySelectorAll('.state-btn');
  stateButtons.forEach(btn => {
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
  });

  // 4. Reset ALL Progress Bars and Percentage Texts
  const progressFills = document.querySelectorAll('.progress-fill');
  progressFills.forEach(fill => {
    fill.style.width = '0%';
  });

  const percentTexts = document.querySelectorAll('.total-percent, .sub-percent, .sub-percent-tahap');
  percentTexts.forEach(text => {
    text.textContent = '0%';
  });

  // 5. Reset Info Display values
  const valDisplays = document.querySelectorAll('.info-value');
  valDisplays.forEach(display => {
    if (!display.classList.contains('val-name')) {
      display.textContent = '-';
    }
  });

  // 6. Reset Supervisor HO Section
  if (typeof window.resetSupervisorHOSection === 'function') {
    window.resetSupervisorHOSection();
  }
  
  // 7. Reset Supervisor Mutation History Container
  const mutasiContainerSupervisor = document.getElementById('mutasiHistoryContainerSupervisor');
  if (mutasiContainerSupervisor) {
    mutasiContainerSupervisor.innerHTML = '';
    mutasiContainerSupervisor.style.display = 'none';
  }
  
  // 8. Reset Supervisor Mutation Visibility Flag
  window.supervisorMutationVisible = false;
  window.isLoadingSupervisorMutation = false;
};

window.updateTabsState = function() {
  const pelaksanaTabs = document.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
  const pelaksanaContent = document.querySelector('.pelaksana-tab-content');

  // SELALU AKTIFKAN TABS (Hapus fungsi freeze)
  pelaksanaTabs.forEach(btn => {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
  });

  if (pelaksanaContent) {
    pelaksanaContent.style.opacity = '1';
    pelaksanaContent.style.pointerEvents = 'auto';
  }

  // Ensure listeners are attached
  if (typeof window.setupPelaksanaTabs === 'function') {
    window.setupPelaksanaTabs();
  }

  // Selalu pastikan input aktif
  enableAllInputs();
};

window.setupPelaksanaTabs = function() {
  const tabButtons = document.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
  
  tabButtons.forEach(btn => {
    // Check if listener already attached to avoid duplicates
    if (btn.hasAttribute('data-listener-attached')) return;
    
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const tabId = this.getAttribute('data-tab');
      const pageContainer = this.closest('.page-content');
      
      if (!pageContainer) return;
      
      // Deactivate all tabs in this container
      const containerTabs = pageContainer.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
      containerTabs.forEach(b => b.classList.remove('active'));
      
      // Activate clicked tab
      this.classList.add('active');
      
      // Hide all content in this container
      const containerContents = pageContainer.querySelectorAll('.pelaksana-tab-content .tab-content-item');
      containerContents.forEach(c => c.classList.remove('active'));
      
      // Show target content
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      } else {
        console.warn(`Tab content not found for id: tab-${tabId}`);
      }
      
      // Update border color based on tab (optional, matches css)
      const cleanTabName = tabId.split('-').pop(); // tahap1, tahap2, etc.
      pageContainer.setAttribute('data-active-tab', cleanTabName);
    });
    
    btn.setAttribute('data-listener-attached', 'true');
  });
  console.log(`✅ Setup pelaksana tabs for ${tabButtons.length} buttons`);
};

window.setupManagerTabs = function() {
  const tabButtons = document.querySelectorAll('#managerPage .admin-tabs .admin-tab-btn');
  
  tabButtons.forEach(btn => {
    if (btn.hasAttribute('data-listener-attached')) return;
    
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const tabId = this.getAttribute('data-tab');
      const pageContainer = document.getElementById('managerPage');
      
      // Deactivate all tabs
      const containerTabs = pageContainer.querySelectorAll('.admin-tabs .admin-tab-btn');
      containerTabs.forEach(b => b.classList.remove('active'));
      
      // Activate clicked tab
      this.classList.add('active');
      
      // Hide all content
      const containerContents = pageContainer.querySelectorAll('.tab-content .tab-content-item');
      containerContents.forEach(c => c.classList.remove('active'));
      
      // Show target content
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
    
    btn.setAttribute('data-listener-attached', 'true');
  });
  console.log(`✅ Setup manager tabs for ${tabButtons.length} buttons`);
};

window.setupAdminTabs = function() {
  const tabButtons = document.querySelectorAll('#adminPage .admin-tabs .admin-tab-btn');
  
  tabButtons.forEach(btn => {
    if (btn.hasAttribute('data-listener-attached')) return;
    
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const tabId = this.getAttribute('data-tab');
      const pageContainer = document.getElementById('adminPage');
      
      // Deactivate all tabs
      const containerTabs = pageContainer.querySelectorAll('.admin-tabs .admin-tab-btn');
      containerTabs.forEach(b => b.classList.remove('active'));
      
      // Activate clicked tab
      this.classList.add('active');
      
      // Hide all content
      const containerContents = pageContainer.querySelectorAll('.tab-content .tab-content-item');
      containerContents.forEach(c => c.classList.remove('active'));
      
      // Show target content
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      } else {
        console.warn(`Tab content not found for id: tab-${tabId}`);
      }
    });
    
    btn.setAttribute('data-listener-attached', 'true');
  });
  console.log(`✅ Setup admin tabs for ${tabButtons.length} buttons`);
};

window.displayUsersForAdmin = function(users) {
  const container = document.getElementById('usersListContainer');
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 40px; color: #94a3b8;">
        <i class="fas fa-users-slash" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <p>Tidak ada data pengguna ditemukan</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="users-table-container" style="overflow-x: auto;">
      <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(30, 41, 59, 0.5); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: rgba(15, 23, 42, 0.8); text-align: left;">
            <th style="padding: 12px 16px; color: #94a3b8; font-weight: 500;">Username</th>
            <th style="padding: 12px 16px; color: #94a3b8; font-weight: 500;">Role</th>
            <th style="padding: 12px 16px; color: #94a3b8; font-weight: 500;">Nama Tampilan</th>
            <th style="padding: 12px 16px; color: #94a3b8; font-weight: 500;">Status</th>
            <th style="padding: 12px 16px; color: #94a3b8; font-weight: 500;">Aksi</th>
          </tr>
        </thead>
        <tbody>
  `;

  users.forEach(user => {
    const roleBadgeColor = getRoleBadgeColor(user.role);
    html += `
      <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1); hover: {background: rgba(255,255,255,0.05)}">
        <td style="padding: 12px 16px; color: #f8fafc;">${user.username}</td>
        <td style="padding: 12px 16px;">
          <span style="background: ${roleBadgeColor.bg}; color: ${roleBadgeColor.text}; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
            ${user.role}
          </span>
        </td>
        <td style="padding: 12px 16px; color: #cbd5e1;">${user.displayName || '-'}</td>
        <td style="padding: 12px 16px;">
          <span style="color: #10b981;">● Aktif</span>
        </td>
        <td style="padding: 12px 16px;">
          <button class="btn-action btn-edit-user" onclick="editUser('${user.username}')" style="background: none; border: none; color: #38bdf8; cursor: pointer; margin-right: 8px;">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete-user" onclick="deleteUser('${user.username}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
};

function getRoleBadgeColor(role) {
  switch(role) {
    case 'admin': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
    case 'manager': return { bg: 'rgba(56, 189, 248, 0.2)', text: '#7dd3fc' };
    case 'user4': return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fcd34d' };
    default: return { bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' };
  }
}


window.disableAllInputs = function() {
  // Fungsi ini dikosongkan untuk menghapus fitur freeze/disable
  console.log("Freeze disabled: All inputs remain active");
  return;
};

window.enableAllInputs = function() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) {
    // console.error(`❌ Page ${pageId} not found for enableAllInputs`);
    return;
  }

  console.log(`🔧 Enabling all inputs for ${pageId}`);

  // 1. Enable semua checkbox
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb, index) => {
    cb.disabled = false;
    cb.readOnly = false;
    cb.style.opacity = '1';
    cb.style.cursor = 'pointer';
    cb.style.pointerEvents = 'auto';

    // Tambah event listener langsung jika belum ada
    if (!cb.hasAttribute('data-listener-added')) {
      cb.addEventListener('change', function() {
        console.log(`Checkbox ${index} changed directly`);
        const label = this.closest('label');
        if (label) {
          if (this.checked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
        if (typeof window.updateProgress === 'function') {
          window.updateProgress(pageId);
        }
      });
      cb.setAttribute('data-listener-added', 'true');
    }
  });

  // 2. Enable tombol state
  const stateButtons = page.querySelectorAll('.state-btn, .system-btn, .tiles-btn, .table-btn');
  stateButtons.forEach((btn, index) => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';

    if (!btn.hasAttribute('data-listener-added')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`State button ${index} clicked directly`);

        if (this.classList.contains('system-btn')) {
          if (typeof toggleSystemButton === 'function') toggleSystemButton(this, this.getAttribute('data-state'));
        } else if (this.classList.contains('tiles-btn')) {
          if (typeof toggleTilesButton === 'function') toggleTilesButton(this, this.getAttribute('data-state'));
        } else if (this.classList.contains('table-btn')) {
          if (typeof toggleTableButton === 'function') toggleTableButton(this, this.getAttribute('data-state'));
        }
      });
      btn.setAttribute('data-listener-added', 'true');
    }
  });

  // 3. Enable input text/date/textarea
  const textInputs = page.querySelectorAll('input[type="text"], input[type="date"], textarea');
  textInputs.forEach(input => {
    input.disabled = false;
    input.readOnly = false;
    input.style.opacity = '1';
    input.style.cursor = 'text';
    input.style.pointerEvents = 'auto';

    // Tambahkan listener untuk input agar update progress saat mengetik/memilih tanggal
    if (!input.hasAttribute('data-listener-added')) {
      const updateFn = () => {
        console.log(`Input ${input.id || input.getAttribute('data-task')} changed`);
        if (typeof window.updateProgress === 'function') {
          window.updateProgress(pageId);
        }
      };
      input.addEventListener('input', updateFn);
      input.addEventListener('change', updateFn);
      input.setAttribute('data-listener-added', 'true');
    }
  });

  // 4. Enable Slider Inputs (New)
  const sliderInputs = page.querySelectorAll('input.progress-slider');
  sliderInputs.forEach(slider => {
      slider.disabled = false;
      slider.readOnly = false;
      slider.style.opacity = '1';
      slider.style.cursor = 'pointer';
      slider.style.pointerEvents = 'auto';

      if (!slider.hasAttribute('data-listener-added')) {
           slider.addEventListener('input', function() {
               const val = this.value;
               const sliderId = this.id;
               const container = this.closest('.slider-container');
               
               // Update text box
               // Try ID pattern first (Slider -> Percent)
               let percentBox = document.getElementById(sliderId.replace('Slider', 'Percent'));
               // Fallback to class search
                if (!percentBox && container) {
                    percentBox = container.querySelector('.slider-percent-box');
                }
                if (percentBox) percentBox.textContent = val + '%';
               
               // Update track
               // Try ID pattern first (Slider -> Track)
               let track = document.getElementById(sliderId.replace('Slider', 'Track'));
               // Fallback to class search
               if (!track && container) {
                   track = container.querySelector('.slider-track-fill');
               }
               if (track) track.style.width = val + '%';

               // Update hidden input if exists
                  const taskName = this.getAttribute('data-task');
                  // Try to find hidden input by ID convention or sibling
                  // Convention seems to be specific IDs in updateSliderFromDB, but here we might need a generic way
                  // For now, relies on updateProgress to pick up the slider value directly
                  
                  // Update checkbox-100 if exists
                  const check100 = document.querySelector(`input.check-100[data-slider="${this.id}"]`);
                  if (check100) {
                      check100.checked = (parseInt(val) === 100);
                  }
                  
                  if (typeof window.updateProgress === 'function') {
                      window.updateProgress(pageId);
                  }
              });


          slider.setAttribute('data-listener-added', 'true');
      }
  });

  // 5. Enable Check-100 Checkboxes (New)
  const check100s = page.querySelectorAll('input.check-100');
  check100s.forEach(cb => {
      cb.disabled = false;
      cb.style.opacity = '1';
      cb.style.cursor = 'pointer';
      
      if (!cb.hasAttribute('data-listener-added')) {
          cb.addEventListener('change', function() {
              const sliderId = this.getAttribute('data-slider');
              const slider = document.getElementById(sliderId);
              if (slider) {
                  slider.value = this.checked ? 100 : 0;
                  // Trigger input event to update UI
                  slider.dispatchEvent(new Event('input'));
              }
          });
          cb.setAttribute('data-listener-added', 'true');
      }
  });

  // 6. Enable tombol save
  const saveButtons = page.querySelectorAll('.btn-save-section');
  saveButtons.forEach(btn => {
    if (btn.id === 'btnSaveUtility') return; // Skip specialized admin buttons
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
  });

  console.log(`✅ Enabled: ${checkboxes.length} checkboxes, ${stateButtons.length} state buttons, ${saveButtons.length} save buttons`);

  // Debug output
  if (typeof debugInputStatus === 'function') {
    debugInputStatus();
  }
};

// PERBAIKI fungsi loadRevisionPhotosForPelaksana:
window.loadRevisionPhotosForPelaksana = async function(kavling, role) {
  const galleryId = `revisionPhotoGallery${role.charAt(0).toUpperCase() + role.slice(1)}`;
  const gallery = document.getElementById(galleryId);
  if (!gallery) {
    console.error(`Gallery element ${galleryId} not found for role ${role}`);
    return;
  }

  // PERBAIKAN: Pattern matching yang lebih fleksibel
  let searchId = '';

  // Extract search ID dari nama kavling
  // Support berbagai format: M1_10, A2_25, BLOK M1, KAVLING A2, M1-10, dll
  const cleanKavling = kavling.replace(/\s+/g, '_').toUpperCase();

  // Cari pola angka dan huruf
  const pattern1 = /([A-Z]\d+)[_-]?(\d+)/i; // M1_10, A2-25, B3_100
  const pattern2 = /([A-Z]\d+)/i; // M1, A2, B3
  const pattern3 = /BLOK[_-]?([A-Z]\d+)/i; // BLOK M1, BLOK_A2
  const pattern4 = /KAVLING[_-]?([A-Z]\d+)/i; // KAVLING M1

  let match;
  if ((match = cleanKavling.match(pattern1))) {
    // Format: M1_10
    searchId = match[1] + '_' + match[2];
  } else if ((match = cleanKavling.match(pattern3))) {
    // Format: BLOK M1
    searchId = match[1];
  } else if ((match = cleanKavling.match(pattern4))) {
    // Format: KAVLING M1
    searchId = match[1];
  } else if ((match = cleanKavling.match(pattern2))) {
    // Format: M1
    searchId = match[1];
  } else {
    // Fallback: 5 karakter pertama
    searchId = kavling.substring(0, 5).toUpperCase();
  }

  console.log(`Loading revision photos for pelaksana: 
    Kavling: ${kavling}, 
    Clean: ${cleanKavling},
    Search ID: ${searchId}, 
    Role: ${role}`);

  // Tampilkan loading state
  gallery.innerHTML = `
    <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px;">
      <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #334155; border-top: 4px solid #38bdf8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <div>Memuat foto revisi untuk ${kavling}...</div>
      <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">
        Search ID: "${searchId}"
      </div>
    </div>
  `;

  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotosBySearchId',
      searchId: searchId,
      kavling: kavling,
      role: role
    });

    gallery.innerHTML = '';

    if (response.success && response.photos && response.photos.length > 0) {
      // Tampilkan semua foto
      response.photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'border-radius: 12px; overflow: hidden; border: 2px solid #334155; position: relative; aspect-ratio: 1; background: #0f172a; transition: transform 0.2s;';

        item.innerHTML = `
          <img src="${photo.url}" 
               style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
               onclick="window.open('${photo.viewUrl || photo.url}', '_blank')"
               loading="lazy"
               onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%231e293b\"/><text x=\"200\" y=\"150\" font-family=\"Arial\" font-size=\"16\" fill=\"%2394a3b8\" text-anchor=\"middle\" dy=\".3em\">Gambar tidak dapat dimuat</text></svg>';"
               alt="Foto revisi ${photo.name}">

          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; font-size: 0.75rem; padding: 5px; text-align: center; backdrop-filter: blur(4px);">
            ${photo.name}
          </div>

          <div style="position: absolute; top: 5px; right: 5px; background: rgba(59, 130, 246, 0.9); color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; font-weight: bold;">
            ${index + 1}
          </div>

          <div style="position: absolute; bottom: 30px; right: 5px; background: rgba(0,0,0,0.6); color: #cbd5e1; font-size: 0.6rem; padding: 2px 5px; border-radius: 4px;">
            ${photo.size || 'N/A'}
          </div>
        `;

        // Hover effect
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'scale(1.02)';
          item.style.borderColor = '#38bdf8';
        });

        item.addEventListener('mouseleave', () => {
          item.style.transform = 'scale(1)';
          item.style.borderColor = '#334155';
        });

        gallery.appendChild(item);
      });

      // Tambahkan info
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'grid-column: span 2; text-align: center; color: #38bdf8; padding: 10px; font-size: 0.9rem;';
      infoDiv.innerHTML = `<i class="fas fa-images"></i> Ditemukan ${response.count} foto untuk "${kavling}"`;
      gallery.appendChild(infoDiv);

    } else {
      // Tidak ada foto
      gallery.innerHTML = `
        <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px; border: 2px dashed #334155; border-radius: 12px;">
          <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #64748b;"></i>
          <div style="margin-bottom: 10px; font-size: 0.9rem;">Tidak ada foto revisi untuk "${kavling}"</div>
          <div style="font-size: 0.8rem; color: #64748b;">
            <div>Search ID yang digunakan: "${searchId}"</div>
            <div style="margin-top: 5px;">Foto akan muncul setelah supervisor upload foto untuk kavling ini</div>
          </div>
        </div>`;
    }
  } catch (error) {
    console.error('Error loading photos for pelaksana:', error);
    gallery.innerHTML = `
      <div style="grid-column: span 2; text-align: center; color: #f43f5e; padding: 20px; border: 2px dashed #dc2626; border-radius: 12px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        <div style="margin-bottom: 10px;">Gagal memuat foto</div>
        <div style="font-size: 0.8rem; color: #fca5a5;">Error: ${error.message || 'Tidak dapat terhubung ke server'}</div>
      </div>`;
  }
};

// Fungsi load revision photos untuk manager
window.loadRevisionPhotos = async function(kavling) {
  const gallery = document.getElementById('revisionPhotoGallery');
  if (!gallery) return;
  
  // Clear gallery dengan loading state
  gallery.innerHTML = `
    <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px;">
      <div class="spinner" style="width: 30px; height: 30px; border: 3px solid #334155; border-top: 3px solid #38bdf8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
      Memuat foto revisi...
    </div>
  `;
  
  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotos',
      kavling: kavling
    });
    
    gallery.innerHTML = '';
    
    if (response.success && response.photos && response.photos.length > 0) {
      // Sort by date (newest first)
      const sortedPhotos = response.photos.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      sortedPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'border-radius: 8px; overflow: hidden; border: 1px solid #334155; position: relative; aspect-ratio: 1; transition: transform 0.2s;';
        item.classList.add('photo-item');
        
        item.innerHTML = `
          <img src="${photo.url}" 
               style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
               onclick="window.open('${photo.viewUrl || photo.url}', '_blank')"
               loading="lazy"
               onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%231e293b\"/><text x=\"200\" y=\"150\" font-family=\"Arial\" font-size=\"16\" fill=\"%2394a3b8\" text-anchor=\"middle\" dy=\".3em\">Gambar tidak dapat dimuat</text></svg>';"
               alt="Foto revisi ${photo.name}">
          
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 3px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${photo.name}
          </div>
          
          <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; font-size: 0.6rem; padding: 1px 4px; border-radius: 8px;">
            ${index + 1}
          </div>
        `;
        
        // Hover effect
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'scale(1.03)';
          item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'scale(1)';
          item.style.boxShadow = 'none';
        });
        
        gallery.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Error loading photos:', error);
    gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #f43f5e; padding: 10px;">Gagal memuat foto</div>';
  }
};

