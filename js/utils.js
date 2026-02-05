// Utility Helper Consolidation

window.formatDateForInput = function(dateValue) {
  if (!dateValue) return '';

  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    const dateStr = dateValue.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    date = new Date(dateStr);
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return String(dateValue);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

window.validateDateInput = function(dateStr) {
  if (!dateStr) return null;
  
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(regex);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    const date = new Date(year, month - 1, day);
    if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
      return dateStr;
    }
  }
  
  return null;
};

window.findCheckboxByTaskName = function(taskName, tahap, pageId) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return null;

  const cleanTaskName = taskName.toUpperCase().trim();
  const progressSection = pageElement.querySelector(`.progress-section[data-tahap="${tahap}"]`);
  if (!progressSection) return null;

  const checkboxes = progressSection.querySelectorAll('.sub-task[type="checkbox"]');

  for (let cb of checkboxes) {
    if (cb.getAttribute('data-task') === cleanTaskName) {
      return cb;
    }
    const label = cb.closest('label');
    if (label) {
      const labelText = label.textContent.toUpperCase().trim();
      const cleanSearch = cleanTaskName.replace(/[^A-Z0-9]/g, '');
      const cleanLabel = labelText.replace(/[^A-Z0-9]/g, '');
      if (cleanLabel.includes(cleanSearch) || cleanSearch.includes(cleanLabel)) {
        return cb;
      }
    }
  }
  return null;
};

window.getSelectIdByRole = function(role) {
  switch (role) {
    case 'user1': return 'searchKavlingUser1';
    case 'user2': return 'searchKavlingUser2';
    case 'user3': return 'searchKavlingUser3';
    case 'user4': return 'searchKavlingUser4';
    case 'manager': return 'searchKavlingManager';
    case 'admin': return 'searchKavlingAdmin';
    default: return 'searchKavlingUser1';
  }
};

window.getDataFromServer = function(url, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Timeout handling
    const timeoutId = setTimeout(() => {
        if (window[callbackName]) {
            delete window[callbackName];
            const scriptId = 'script_' + callbackName;
            const scriptEl = document.getElementById(scriptId);
            if (scriptEl) scriptEl.remove();
            reject(new Error('Request timed out after 30 seconds'));
        }
    }, 30000);

    window[callbackName] = function(data) {
      clearTimeout(timeoutId);
      resolve(data);
      delete window[callbackName];
      const scriptId = 'script_' + callbackName;
      const scriptEl = document.getElementById(scriptId);
      if (scriptEl) scriptEl.remove();
    };
    let requestUrl = url + (url.includes('?') ? '&' : '?');
    const urlParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        if (typeof params[key] === 'object') {
          urlParams.append(key, JSON.stringify(params[key]));
        } else {
          urlParams.append(key, params[key]);
        }
      }
    });
    urlParams.append('callback', callbackName);
    requestUrl += urlParams.toString();
    const script = document.createElement('script');
    script.id = 'script_' + callbackName;
    script.src = requestUrl;
    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load script'));
      delete window[callbackName];
      script.remove();
    };
    document.body.appendChild(script);
  });
};

window.parseProgressValue = function(progressStr) {
  if (!progressStr && progressStr !== 0) return 0;

  if (typeof progressStr === 'number') {
    // Angka dalam bentuk desimal (0-1) atau persentase (0-100)
    if (progressStr <= 1) {
      // Desimal, konversi ke persentase
      return Math.round(progressStr * 10000) / 100;
    } else {
      // Sudah persentase, bulatkan ke 1 digit
      return Math.round(progressStr * 10) / 10;
    }
  }

  if (typeof progressStr === 'string') {
    const match = progressStr.match(/(\d+(\.\d+)?)%?/);
    if (match) {
      let num = parseFloat(match[1]);
      
      // Jika string mengandung %, artinya sudah dalam bentuk persentase
      // Tapi masih dalam format string dengan %
      if (progressStr.includes('%')) {
        // num sudah dalam 0-100
        if (num < 1) {
          // Contoh: "0.06%" → 0.06 → 6
          return Math.round(num * 10000) / 100;
        }
        // Contoh: "99.56%" → 99.6
        return Math.round(num * 10) / 10;
      } else {
        // Tanpa %, bisa desimal atau sudah persentase
        if (num <= 1) {
          // Desimal, konversi ke persentase
          return Math.round(num * 10000) / 100;
        } else {
          // Sudah persentase
          return Math.round(num * 10) / 10;
        }
      }
    }
  }

  return 0;
};

window.parseMutasiDataFromString = function(mutasiString) {
  if (!mutasiString || mutasiString.trim() === '') {
      return [];
  }
  
  const entries = [];
  
  // Split by pipe (|) - dengan trim
  const entryStrings = mutasiString.split('|').map(entry => entry.trim());
  
  // Proses tiap entry
  entryStrings.forEach((entryStr, index) => {
      if (entryStr.trim() === '') return;
      
      // Split entry by comma
      const parts = entryStr.split(',');
      
      if (parts.length >= 3) {
          entries.push({
              dari: parts[0]?.trim() || '',
              ke: parts[1]?.trim() || '',
              tanggal: parts[2]?.trim() || '',
              jenis: '' // akan di-set nanti
          });
      }
  });
  
  return entries;
};

// Fallback for showToast if ui.js fails to load or hasn't loaded yet
if (typeof window.showToast === 'undefined') {
    window.showToast = function(type, message) {
        console.log(`[Toast Fallback] ${type}: ${message}`);
        // Only alert for errors or success, to avoid spam
        if (type === 'error' || type === 'success') {
             // Fallback to alert if UI toast is not available
             // alert(`${type.toUpperCase()}: ${message}`);
        }
    };
}
