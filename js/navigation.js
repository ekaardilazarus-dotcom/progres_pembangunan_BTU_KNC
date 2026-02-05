
window.setupNavigation = function() {
    const roleBtns = document.querySelectorAll('.role-btn');
    const landingPage = document.getElementById('landingPage');
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const submitPasswordBtn = document.getElementById('submitPassword');
    const closeModalBtn = passwordModal ? passwordModal.querySelector('.close-btn') : null;
    const errorMessage = document.getElementById('errorMessage');
    let pendingRole = null;

    // Handle URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('role');
    const urlProject = urlParams.get('project');

    if (urlProject) {
        window.currentProject = urlProject;
        console.log('Current Project:', urlProject);
        // Update document title or UI if needed
        document.title = `${urlProject} - ${document.title}`;
    }

    if (urlRole) {
        console.log('Role from URL:', urlRole);
        handleRoleSelection(urlRole);
    }

    function handleRoleSelection(role) {
        console.log('Handling role selection:', role);
        // Roles that require password (User 1, 2, 3 enabled as per request)
        if (['admin', 'manager', 'user4', 'user1', 'user2', 'user3'].includes(role)) {
            pendingRole = role;
            console.log('Pending role set to:', pendingRole);
            if (passwordModal) {
                passwordModal.style.display = 'flex';
                passwordInput.value = '';
                passwordInput.focus();
                if (errorMessage) errorMessage.textContent = '';
            } else {
                console.error('Password modal not found!');
            }
        } else {
            showPage(role);
            // Trigger data load for users
            if (role.startsWith('user')) {
                 setTimeout(async () => {
                    try {
                        if (typeof window.loadKavlingListWithLoading === 'function') {
                            await window.loadKavlingListWithLoading();
                        } else if (typeof window.loadKavlingList === 'function') {
                            await window.loadKavlingList();
                        }
                    } catch (err) {
                        console.error('Error loading initial data:', err);
                    }
                }, 100);
            }
        }
    }

    roleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const role = this.getAttribute('data-role');
            console.log('Role clicked:', role);
            handleRoleSelection(role);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == passwordModal) {
            passwordModal.style.display = 'none';
            pendingRole = null;
            // Redirect to index.html if login is cancelled
            window.location.href = 'index.html';
        }
    });

    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', handlePasswordSubmit);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handlePasswordSubmit();
        });
    }

    async function handlePasswordSubmit() {
        const password = passwordInput.value.trim();
        const errorMessage = document.getElementById('errorMessage');
        const submitBtn = document.getElementById('submitPassword');

        console.log('Login attempt for role:', pendingRole);

        if (!pendingRole) {
             // Try to recover from URL if pendingRole is lost
             const params = new URLSearchParams(window.location.search);
             const urlRole = params.get('role');
             if (urlRole) {
                 pendingRole = urlRole;
                 console.log('Recovered pendingRole from URL:', pendingRole);
             } else {
                 if (errorMessage) errorMessage.textContent = 'Error: Role tidak dikenali. Silakan refresh halaman.';
                 return;
             }
        }

        if (!password) {
            if (errorMessage) errorMessage.textContent = 'Password harus diisi!';
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';
        }

        try {
            console.log('Sending login request to server...');
            // Use server-side verification
            const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
                action: 'login',
                role: pendingRole,
                password: password
            });

            console.log('Login result:', result);

            if (result.success) {
                // Save session
                sessionStorage.setItem('loggedRole', pendingRole);
                sessionStorage.setItem('loggedDisplayName', result.displayName);
                sessionStorage.setItem('loginTime', new Date().toISOString());

                // Update UI
                updateDashboardTitle(pendingRole, result.displayName);

                if (passwordModal) passwordModal.style.display = 'none';
                
                if (typeof window.showToast === 'function') {
                    window.showToast('success', `Login berhasil sebagai ${result.displayName}`);
                } else {
                    console.log(`Login berhasil sebagai ${result.displayName}`);
                }
                
                try {
                    showPage(pendingRole);
                } catch (showPageError) {
                    console.error('Error in showPage:', showPageError);
                    alert('Terjadi kesalahan saat menampilkan halaman: ' + showPageError.message);
                }

                // Load initial data for user roles
                if (pendingRole.startsWith('user')) {
                     setTimeout(async () => {
                        try {
                            if (typeof window.loadKavlingListWithLoading === 'function') {
                                await window.loadKavlingListWithLoading();
                            } else if (typeof window.loadKavlingList === 'function') {
                                await window.loadKavlingList();
                            }
                        } catch (err) {
                            console.error('Error loading initial data:', err);
                            // Do not show error to user immediately to avoid confusion if it's just a background load
                        }
                    }, 100);
                }
            } else {
                if (errorMessage) errorMessage.textContent = result.message || 'Password salah!';
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Login error:', error);
            if (errorMessage) errorMessage.textContent = 'Gagal menghubungi server: ' + error.message;
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Masuk';
            }
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (passwordModal) passwordModal.style.display = 'none';
            pendingRole = null;
            // Redirect to index.html if login is cancelled
            window.location.href = 'index.html';
        });
    }

    // Logout buttons - using delegation for robustness
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.logout-btn');
        if (btn) {
            console.log('Logout clicked');
            e.preventDefault();
            sessionStorage.clear();
            // Redirect to main menu
            window.location.href = 'index.html';
        }
    });
};

// Helper to update dashboard title
window.updateDashboardTitle = function(role, name) {
    const titleIds = {
        'user1': 'user1Title',
        'user2': 'user2Title',
        'user3': 'user3Title',
        'user4': 'user4Title',
        'manager': 'managerTitle',
        'admin': 'adminTitle'
    };

    const el = document.getElementById(titleIds[role]);
    if (el) {
        const prefix = role === 'manager' ? 'Dashboard' : (role === 'admin' ? 'Panel' : 'Dashboard');
        el.textContent = `${prefix} ${name}`;
    }
};

window.showPage = function(role) {
    console.log('Showing page for role:', role);
    
    // Hide landing page
    const landingPage = document.getElementById('landingPage');
    if (landingPage) landingPage.style.display = 'none';

    // Hide all page contents
    document.querySelectorAll('.page-content').forEach(p => {
        p.style.display = 'none';
        p.setAttribute('aria-hidden', 'true');
    });

    // Show target page
    const pageId = role + 'Page';
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        page.setAttribute('aria-hidden', 'false');
        
        // Set current role globally
        if (typeof window.currentRole !== 'undefined') {
            window.currentRole = role;
        }
        
        // Initialize role specific components
        if (role === 'user4') {
            if (typeof window.setupUser4Page === 'function') {
                window.setupUser4Page();
            } else if (typeof window.setupUser4Tabs === 'function') {
                window.setupUser4Tabs();
            }
        } else if (role === 'manager') {
            // Setup manager tabs
            if (typeof window.setupManagerTabs === 'function') {
                window.setupManagerTabs();
            }
            // Ensure data load if needed
             setTimeout(async () => {
                if (typeof window.loadKavlingListWithLoading === 'function') {
                    await window.loadKavlingListWithLoading();
                } else if (typeof window.loadKavlingList === 'function') {
                    await window.loadKavlingList();
                }
            }, 100);
        } else if (role === 'admin') {
            // Setup admin tabs
            if (typeof window.setupAdminTabs === 'function') {
                window.setupAdminTabs();
            }
            // Trigger data load for admin
             setTimeout(async () => {
                if (typeof window.loadUsersForAdmin === 'function') {
                    await window.loadUsersForAdmin();
                } else {
                    console.error('loadUsersForAdmin function is not defined');
                }
            }, 100);
        } else if (['user1', 'user2', 'user3'].includes(role)) {
            // Setup tabs for pelaksana
            if (typeof window.updateTabsState === 'function') {
                window.updateTabsState();
            }
            
            // Activate first tab if none active or if it's the first load
            const tabs = page.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
            if (tabs.length > 0) {
                const activeTab = page.querySelector('.pelaksana-tabs .admin-tab-btn.active');
                if (!activeTab) {
                    tabs[0].click();
                } else {
                    // Ensure content is visible even if tab is active
                    const tabId = activeTab.getAttribute('data-tab');
                    const content = document.getElementById(`tab-${tabId}`);
                    if (content) content.classList.add('active');
                }
            }
        }
        
        // Trigger initialization if needed
        // if (typeof window.initializeApp === 'function') window.initializeApp();
    } else {
        console.error('Page not found:', pageId);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
});
