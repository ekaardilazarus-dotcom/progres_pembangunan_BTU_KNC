// GLOBAL EVENT DELEGATION FOR SLIDERS AND CHECKBOXES
// =============================================================================
// Ensures functionality works immediately regardless of initialization timing
// or dynamic content loading.
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Global Event Delegation initialized for Sliders/Checkboxes');

    // 1. Delegated Slider Input Event
    document.addEventListener('input', function(e) {
        // Check if target is a progress slider
        if (e.target && e.target.matches && e.target.matches('input.progress-slider')) {
            const slider = e.target;
            let val = parseInt(slider.value);
            
            // Magnet / Soft Snapping logic
            // User can slide freely, but if close to marker (threshold 3%), snap to it.
            if (slider.dataset.snap === 'true') {
                const snapPoints = [0, 30, 50, 70, 100];
                const threshold = 3; 
                
                // Find if any point is within threshold
                const closest = snapPoints.find(point => Math.abs(val - point) <= threshold);
                
                if (closest !== undefined) {
                    val = closest;
                    // Note: We don't force slider.value = val here to keep dragging smooth,
                    // unless we want the "magnet feel" on the thumb itself.
                    // Let's force it slightly to give the magnet feedback.
                    if (parseInt(slider.value) !== val) {
                       slider.value = val;
                    }
                }
            }

            const sliderId = slider.id;
            const container = slider.closest('.slider-container');
            
            // A. Update Percent Box
            // Try ID convention first: sliderId "XSliderY" -> "XPercentY"
            let percentBox = document.getElementById(sliderId.replace('Slider', 'Percent'));
            // Fallback to container search
            if (!percentBox && container) percentBox = container.querySelector('.slider-percent-box');
            
            if (percentBox) {
                percentBox.textContent = val + '%';
            }
            
            // B. Update Track Fill & Color
            // Try ID convention first: sliderId "XSliderY" -> "XTrackY"
            let track = document.getElementById(sliderId.replace('Slider', 'Track'));
            // Fallback to container search
            if (!track && container) track = container.querySelector('.slider-track-fill');
            
            if (track) {
                track.style.width = val + '%';
                
                // Dynamic Color Update based on percentage
                track.classList.remove('bar-gradient-green', 'bar-gradient-blue', 'bar-gradient-purple');
                if (val === 100) {
                    track.classList.add('bar-gradient-purple');
                } else if (val >= 50) {
                    track.classList.add('bar-gradient-blue');
                } else {
                    track.classList.add('bar-gradient-green');
                }
            }
            
            // C. Update Checkbox-100 State
            // Find checkbox that controls this slider
            const check100 = document.querySelector(`input.check-100[data-slider="${sliderId}"]`);
            if (check100) {
                check100.checked = (parseInt(val) === 100);
            }
            
            // D. Trigger Global Progress Update
            if (typeof window.updateProgress === 'function' && typeof currentRole !== 'undefined') {
                window.updateProgress(currentRole + 'Page');
            }
        }
    });

    // 2. Delegated Checkbox-100 Change Event
    document.addEventListener('change', function(e) {
        // Check if target is a 100% checkbox
        if (e.target && e.target.matches && e.target.matches('input.check-100')) {
            const checkbox = e.target;
            const sliderId = checkbox.getAttribute('data-slider');
            
            if (sliderId) {
                const slider = document.getElementById(sliderId);
                if (slider) {
                    // Set slider value
                    slider.value = checkbox.checked ? 100 : 0;
                    
                    // Trigger input event on slider so the listener above updates UI
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    });

    // 3. Delegated System Button Click (Sistem Pembuangan)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.system-btn');
        if (btn) {
            e.preventDefault();
            const state = btn.getAttribute('data-state');
            if (typeof window.toggleSystemButton === 'function') {
                window.toggleSystemButton(btn, state);
            }
        }
    });

    // 4. Delegated Table Button Click (Cor Meja Dapur)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.table-btn');
        if (btn) {
            e.preventDefault();
            const state = btn.getAttribute('data-state');
            if (typeof window.toggleTableButton === 'function') {
                window.toggleTableButton(btn, state);
            }
        }
    });

    // 5. Delegated Tiles Button Click (Keramik Dinding)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.tiles-btn');
        if (btn) {
            e.preventDefault();
            const state = btn.getAttribute('data-state');
            if (typeof window.toggleTilesButton === 'function') {
                window.toggleTilesButton(btn, state);
            }
        }
    });
});

// =============================================================================
// STATE BUTTON TOGGLE FUNCTIONS
// =============================================================================

/**
 * Show Global Loading Modal
 * @param {string} message - Loading message
 */
window.showGlobalLoading = function(message) {
    const modal = document.getElementById('loadingModal');
    const textEl = document.getElementById('loadingText');
    
    if (textEl && message) {
        textEl.textContent = message;
    }
    
    if (modal) {
        modal.style.display = 'flex';
    }
};

/**
 * Hide Global Loading Modal
 */
window.hideGlobalLoading = function() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

/**
 * Show Status Modal
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} title - Modal Title
 * @param {string} message - Modal Message
 */
window.showStatusModal = function(type, title, message) {
    const modal = document.getElementById('statusModal');
    if (!modal) {
        // Fallback if modal element is missing
        if (typeof showToast === 'function') {
            showToast(type, `${title}: ${message}`);
        } else {
            alert(`${title}\n${message}`);
        }
        return;
    }

    const iconEl = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const msgEl = document.getElementById('statusMessage');

    // Reset classes
    iconEl.className = '';

    if (type === 'success') {
        iconEl.className = 'fas fa-check-circle';
        iconEl.style.color = '#10b981'; // Emerald 500
    } else if (type === 'error') {
        iconEl.className = 'fas fa-times-circle';
        iconEl.style.color = '#f43f5e'; // Rose 500
    } else if (type === 'warning') {
        iconEl.className = 'fas fa-exclamation-triangle';
        iconEl.style.color = '#f59e0b'; // Amber 500
    } else {
        iconEl.className = 'fas fa-info-circle';
        iconEl.style.color = '#38bdf8'; // Sky 400
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    modal.style.display = 'flex';
    
    // Auto focus on close button if possible, or just trap focus
    const closeBtn = modal.querySelector('button');
    if (closeBtn) closeBtn.focus();
};

window.toggleSystemButton = function(btn, state) {
    // Toggle active state for System buttons (Biotank/Ipal/Septictank)
    const container = btn.closest('.dual-state-buttons');
    if (!container) return;

    // Deactivate siblings
    container.querySelectorAll('.system-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('data-active', 'false');
    });

    // Activate clicked
    btn.classList.add('active');
    btn.setAttribute('data-active', 'true');

    // Update hidden input
    const taskItem = btn.closest('.task-item-standalone');
    if (taskItem) {
        const input = taskItem.querySelector('input[type="hidden"]');
        if (input) {
            input.value = state;
            console.log(`Updated System: ${state}`);
            
            // Trigger progress update
            if (typeof window.updateProgress === 'function' && typeof currentRole !== 'undefined') {
                window.updateProgress(currentRole + 'Page');
            }
        }
    }
};

window.toggleTableButton = function(btn, state) {
    // Toggle active state for Table Kitchen buttons (With/Without)
    const container = btn.closest('.dual-state-buttons');
    if (!container) return;

    container.querySelectorAll('.table-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('data-active', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('data-active', 'true');

    const taskItem = btn.closest('.task-item-standalone');
    if (taskItem) {
        const input = taskItem.querySelector('input[type="hidden"]');
        if (input) {
            input.value = state;
            console.log(`Updated Table: ${state}`);
            
            if (typeof window.updateProgress === 'function' && typeof currentRole !== 'undefined') {
                window.updateProgress(currentRole + 'Page');
            }
        }
    }
};

window.toggleTilesButton = function(btn, state) {
    // Toggle active state for Tiles buttons (With/Without)
    const container = btn.closest('.dual-state-buttons');
    if (!container) return;

    container.querySelectorAll('.tiles-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('data-active', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('data-active', 'true');

    const taskItem = btn.closest('.task-item-standalone');
    if (taskItem) {
        const input = taskItem.querySelector('input[type="hidden"]');
        if (input) {
            input.value = state;
            console.log(`Updated Tiles: ${state}`);
            
            if (typeof window.updateProgress === 'function' && typeof currentRole !== 'undefined') {
                window.updateProgress(currentRole + 'Page');
            }
        }
    }
};

/**
 * Initialize Pelaksana Tabs (User 1, 2, 3)
 * Handles switching between Tahap 1, 2, 3, 4, and Kondisi Unit
 */
window.updateTabsState = function() {
    console.log('Initializing Pelaksana Tabs...');
    // Select all pelaksana tab buttons
    const tabButtons = document.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
    
    tabButtons.forEach(btn => {
        // Prevent double binding
        if (btn.dataset.listenerAttached) return;
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 1. Handle Active Class on Buttons
            // Find the container of this button
            const container = this.closest('.pelaksana-tabs');
            if (container) {
                // Remove active from siblings
                container.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
            }
            
            // 2. Handle Tab Content Visibility
            const tabId = this.getAttribute('data-tab'); // e.g., 'user1-tahap2'
            const targetContent = document.getElementById(`tab-${tabId}`);
            
            if (targetContent) {
                // Find the content container
                const contentContainer = targetContent.closest('.pelaksana-tab-content');
                if (contentContainer) {
                    // Hide all items in this container
                    contentContainer.querySelectorAll('.tab-content-item').forEach(c => c.classList.remove('active'));
                }
                // Show target
                targetContent.classList.add('active');
                
                console.log(`Switched to tab: ${tabId}`);
            } else {
                console.error(`Tab content not found for id: tab-${tabId}`);
            }
        });
        
        btn.dataset.listenerAttached = 'true';
    });
};
