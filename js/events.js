// Event Listeners Setup

// Global event listener for sync buttons
document.addEventListener('click', function(e) {
  if (e.target.closest('.sync-btn')) {
    searchKavling(true); // isSync = true
  }
});

// Initialization: setup custom search per role
window.initializeApp = async function() {
  try {
    const pairs = [
      ['searchKavlingUser1Input', 'searchKavlingUser1List', 'searchKavlingUser1'],
      ['searchKavlingUser2Input', 'searchKavlingUser2List', 'searchKavlingUser2'],
      ['searchKavlingUser3Input', 'searchKavlingUser3List', 'searchKavlingUser3'],
      ['searchKavlingUser4Input', 'searchKavlingUser4List', 'searchKavlingUser4'],
      ['searchKavlingManagerInput', 'searchKavlingManagerList', 'searchKavlingManager']
    ];
    pairs.forEach(([inputId, listId, selectId]) => {
      const inputEl = document.getElementById(inputId);
      const listEl = document.getElementById(listId);
      const selectEl = document.getElementById(selectId);
      if (inputEl && listEl && selectEl && typeof window.setupCustomSearch === 'function') {
        window.setupCustomSearch(inputId, listId, selectId);
      }
    });
  } catch (err) {
    console.error('initializeApp error:', err);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Navigation
  if (typeof window.setupNavigation === 'function') {
    window.setupNavigation();
  }

  if (typeof window.initializeApp === 'function') {
    window.initializeApp();
  }
  
  // Initialize Edit Kavling functionality if available
  if (typeof window.setupEditKavling === 'function') {
    window.setupEditKavling();
  }

  // Initialize Add Kavling functionality if available
  if (typeof window.setupAddNewKavling === 'function') {
    window.setupAddNewKavling();
  }
});

// setupUser4EventListeners is handled in admin-utilitas.js
// setupCustomSearch is handled in search.js
