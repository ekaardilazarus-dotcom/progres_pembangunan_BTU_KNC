function checkPass() {
    const pass = document.getElementById('passInput').value;
    if (pass === 'F888') {
        document.getElementById('passwordOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        sessionStorage.setItem('inventaris_auth', 'true');
        loadInventarisData(); // Muat data setelah login
    } else {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) errorMsg.style.display = 'block';
        document.getElementById('passInput').value = '';
    }
}

// Global data store
let allKavlingData = [];
let currentEditPhotos = []; // Store base64 photos for current edit

// Mapping kolom fisik untuk modal edit (disesuaikan dengan urutan tabel/sheet)
const PHYSICAL_COLUMNS = [
    "KONDISI HALAMAN", "PONDASI", "CAT LUAR", "CAT DALAM", "KERAMIK LANTAI",
    "PLAFOND", "RANGKA ATAP", "GENTENG", "TOILET", "DAPUR",
    "KUSEN PINTU", "DAUN PINTU", "KUSEN JENDELA", "DAUN JENDELA",
    "STOP KONTAK", "FITTING LAMPU", "KELISTRIKAN", "Meteran Listrik",
    "Meteran PDAM", "PIPA AIR BERSIH", "KONDISI LAINNYA"
];

async function loadInventarisData() {
    const tbody = document.getElementById('kavlingTableBody');
    const loading = document.getElementById('loadingOverlay');
    if (!tbody) return;

    if (loading) loading.style.display = 'flex';

    try {
        const url = window.PROGRESS_APPS_SCRIPT_URL;
        const result = await window.getDataFromServer(url, {
            action: 'getKavlingData',
            sheetName: 'InventarisUnit'
        });

        // Tangani jika result adalah array langsung atau objek {success, data}
        let dataToRender = [];
        if (Array.isArray(result)) {
            dataToRender = result;
        } else if (result && result.data && Array.isArray(result.data)) {
            dataToRender = result.data;
        } else if (result && !result.success) {
            throw new Error(result.message || 'Gagal mengambil data');
        }

        allKavlingData = dataToRender;
        renderTable(allKavlingData);
    } catch (error) {
        console.error('Error loading data:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="28" style="text-align: center; padding: 50px; color: #f43f5e;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Gagal memuat data: ${error.message}</p>
                    <button onclick="loadInventarisData()" class="btn-silver" style="margin-top: 15px;">Coba Lagi</button>
                </td>
            </tr>
        `;
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderTable(data) {
    const tbody = document.getElementById('kavlingTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="28" style="text-align: center; padding: 50px;">Tidak ada data ditemukan.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((row, index) => {
        // Total Kondisi ada di index 5 di sheet InventarisUnit
        // Kita gunakan parseProgressValue untuk memastikan nilai 0-100
        const totalKondisi = window.parseProgressValue(row[5]);
        
        let kondisiClass = 'tidak-layak';
        if (totalKondisi >= 91) kondisiClass = 'layak';
        else if (totalKondisi >= 75) kondisiClass = 'renov-ringan';
        else if (totalKondisi >= 50) kondisiClass = 'renov-banyak';
        else if (totalKondisi >= 20) kondisiClass = 'rusak';

        // Kita tampilkan kolom 0 sampai 26 (Blok s/d Kondisi Lainnya)
        // Kolom 27 adalah Foto (JSON string) yang tidak ditampilkan di tabel utama
        const displayRow = row.slice(0, 27);

        return `
            <tr data-kondisi="${kondisiClass}" onclick="openEditModal(${index})" style="cursor: pointer;">
                <td>${index + 1}</td>
                ${displayRow.map((cell, i) => {
                    // Jika ini kolom Total Kondisi (index 5), format sebagai %
                    if (i === 5) {
                        const val = window.parseProgressValue(cell);
                        return `<td>${val}%</td>`;
                    }
                    return `<td>${cell || '-'}</td>`;
                }).join('')}
            </tr>
        `;
    }).join('');
}

// Modal Functions
function openAddKavlingModal() {
    document.getElementById('addKavlingModal').style.display = 'flex';
}

function closeAddKavlingModal() {
    document.getElementById('addKavlingModal').style.display = 'none';
    document.getElementById('addKavlingForm').reset();
}

async function submitAddKavling(event) {
    event.preventDefault();
    
    const formData = {
        blok: document.getElementById('inputBlok').value,
        lt: document.getElementById('inputLT').value,
        lb: document.getElementById('inputLB').value,
        type: document.getElementById('inputType').value,
        status: document.getElementById('inputStatus').value,
        action: 'addKavling'
    };

    try {
        const btnSave = event.target.querySelector('.btn-save');
        btnSave.disabled = true;
        btnSave.innerText = 'Menyimpan...';

        const url = window.PROGRESS_APPS_SCRIPT_URL;
        const result = await window.getDataFromServer(url, formData);

        if (result && result.success) {
            alert('Data Kavling berhasil ditambahkan!');
            closeAddKavlingModal();
            loadInventarisData();
        } else {
            throw new Error(result ? result.message : 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Terjadi kesalahan: ' + error.message);
    } finally {
        const btnSave = event.target.querySelector('.btn-save');
        btnSave.disabled = false;
        btnSave.innerText = 'Simpan Data';
    }
}

// EDIT MODAL LOGIC
function openEditModal(index) {
    const row = allKavlingData[index];
    if (!row) return;

    // Reset and Set Data
    document.getElementById('editOldBlok').value = row[0]; // BLOK LAMA (Hidden)
    document.getElementById('editBlok').value = row[0];    // BLOK (Bisa diubah)
    document.getElementById('editBlokTitle').innerText = row[0];
    document.getElementById('editLT').value = row[1];
    document.getElementById('editLB').value = row[2];
    document.getElementById('editType').value = row[3];
    document.getElementById('editStatus').value = row[4];

    // Render Physical Condition Inputs
    const physicalContainer = document.getElementById('physicalConditionInputs');
    physicalContainer.innerHTML = '';
    
    PHYSICAL_COLUMNS.forEach((colName, i) => {
        const val = row[i + 6] || '';
        
        // Parsing "XX%-Keterangan" atau format lama
        let percentVal = 0;
        let textVal = val;

        if (typeof val === 'string' && val.includes('%-')) {
            const parts = val.split('%-');
            percentVal = parseFloat(parts[0]) || 0;
            textVal = parts.slice(1).join('%-');
        } else if (val && !isNaN(parseFloat(val))) {
            percentVal = parseFloat(val);
            textVal = '';
        }

        const div = document.createElement('div');
        div.className = 'physical-input-row';
        
        // Cek jika kolom adalah Meteran Listrik atau Meteran PDAM (Hanya Meteran saja)
        const isMeteran = colName.toLowerCase() === 'meteran listrik' || colName.toLowerCase() === 'meteran pdam';
        
        if (isMeteran) {
            // Mapping value untuk dropdown
            let selectedStatus = "Belum Ada";
            if (textVal.includes("Terpasang")) selectedStatus = "Terpasang";
            else if (textVal.includes("Rusak")) selectedStatus = "Rusak";
            else if (textVal.includes("Belum Ada")) selectedStatus = "Belum Ada";
            else if (percentVal > 0) selectedStatus = "Terpasang"; // Fallback jika hanya ada persen

            div.innerHTML = `
                 <div class="form-group" style="flex: 1;">
                     <label>${colName}</label>
                     <select name="${colName}" onchange="updateAutoCalc()" class="form-control">
                         <option value="Terpasang" ${selectedStatus === 'Terpasang' ? 'selected' : ''}>Terpasang</option>
                         <option value="Belum Ada" ${selectedStatus === 'Belum Ada' ? 'selected' : ''}>Belum Ada</option>
                         <option value="Rusak" ${selectedStatus === 'Rusak' ? 'selected' : ''}>Rusak</option>
                     </select>
                     <input type="hidden" name="${colName}_percent" value="${selectedStatus === 'Terpasang' ? '0.5' : '0'}">
                 </div>
             `;
        } else {
            div.innerHTML = `
                <div class="form-group">
                    <label>${colName}</label>
                    <input type="text" name="${colName}" value="${textVal}" placeholder="Wajib diisi jika < 100%" oninput="updateAutoCalc()">
                </div>
                <div class="form-group">
                    <label>Kondisi %</label>
                    <div class="percent-display-box" onclick="openSlider('${colName}', this)">
                        <span class="val">${percentVal}</span>%
                        <input type="hidden" name="${colName}_percent" value="${percentVal}">
                    </div>
                </div>
            `;
        }
        physicalContainer.appendChild(div);
    });

    // Load Photos
    currentEditPhotos = [];
    // Kolom FOTO FOTO ada di index 27 (AB)
    if (row[27]) {
        try {
            const parsed = JSON.parse(row[27]);
            currentEditPhotos = Array.isArray(parsed) 
              ? parsed.map(p => ({ data: p, processing: false })) 
              : [];
        } catch (e) {
            if (row[27].includes(',')) {
                currentEditPhotos = row[27].split(',').map(p => ({ data: p, processing: false }));
            }
        }
    }
    renderPhotoGallery();
    updateAutoCalc(); // Hitung total awal

    document.getElementById('editKavlingModal').style.display = 'flex';
}

function updateAutoCalc() {
    let total = 0;
    const items = PHYSICAL_COLUMNS.length;
    
    // Hitung jumlah item selain meteran
    const meteranCols = PHYSICAL_COLUMNS.filter(c => c.toLowerCase() === 'meteran listrik' || c.toLowerCase() === 'meteran pdam');
    const otherCols = PHYSICAL_COLUMNS.filter(c => c.toLowerCase() !== 'meteran listrik' && c.toLowerCase() !== 'meteran pdam');
    
    // Sisa bobot setelah dikurangi meteran (1% total untuk 2 meteran)
    const meteranWeight = 0.5;
    const totalMeteranWeight = meteranCols.length * meteranWeight;
    const remainingWeight = 100 - totalMeteranWeight;
    const weightPerItem = remainingWeight / otherCols.length;

    PHYSICAL_COLUMNS.forEach(colName => {
        const percentInput = document.querySelector(`#physicalConditionInputs [name="${colName}_percent"]`);
        const selectBox = document.querySelector(`#physicalConditionInputs select[name="${colName}"]`);
        const isMeteran = colName.toLowerCase() === 'meteran listrik' || colName.toLowerCase() === 'meteran pdam';
        
        if (isMeteran) {
            if (selectBox) {
                const val = selectBox.value === 'Terpasang' ? 0.5 : 0;
                total += val;
                if (percentInput) percentInput.value = val;
            }
        } else {
            if (percentInput) {
                const val = parseFloat(percentInput.value) || 0;
                // Hitung kontribusi ke total: (NilaiInput / 100) * BobotItem
                total += (val / 100) * weightPerItem;
            }
        }
    });

    const finalTotal = Math.min(100, Math.max(0, total)).toFixed(2);
    const display = document.getElementById('editTotalKondisiDisplay');
    const hidden = document.getElementById('editTotalKondisi');
    
    if (display) display.innerText = finalTotal + '%';
    if (hidden) hidden.value = finalTotal + '%';
}

function closeEditModal() {
    document.getElementById('editKavlingModal').style.display = 'none';
}

function renderPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    gallery.innerHTML = '';
    
    currentEditPhotos.forEach((photo, index) => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        if (typeof photo === 'string') {
            div.innerHTML = `
                <img src="${photo.startsWith('data:') ? photo : 'data:image/jpeg;base64,' + photo}" alt="Foto ${index + 1}">
                <button type="button" class="remove-photo" onclick="removePhoto(${index})">&times;</button>
            `;
        } else if (photo && photo.processing) {
            div.innerHTML = `
                <div class="photo-loading" style="width:120px;height:90px;display:flex;align-items:center;justify-content:center;border:1px dashed #64748b;border-radius:8px;background:#0b1220;">
                    <i class="fas fa-spinner fa-spin" style="color:#94a3b8;font-size:20px;"></i>
                </div>
            `;
        } else {
            const src = (photo && photo.data) ? (photo.data.startsWith('data:') ? photo.data : 'data:image/jpeg;base64,' + photo.data) : '';
            div.innerHTML = `
                <img src="${src}" alt="Foto ${index + 1}">
                <button type="button" class="remove-photo" onclick="removePhoto(${index})">&times;</button>
            `;
        }
        gallery.appendChild(div);
    });
    
    document.getElementById('photoCountInfo').innerText = `${currentEditPhotos.length}/6 Foto`;
}

function removePhoto(index) {
    currentEditPhotos.splice(index, 1);
    renderPhotoGallery();
}

async function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = 6 - currentEditPhotos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (currentEditPhotos.length >= 6) {
        alert('Maksimal 6 foto diperbolehkan.');
        return;
    }

    for (const file of filesToProcess) {
        try {
            const placeholderIndex = currentEditPhotos.push({ data: null, processing: true }) - 1;
            renderPhotoGallery();
            const compressedBase64 = await compressImage(file, 0.3); // Compress 30% dari kualitas aslinya
            currentEditPhotos[placeholderIndex] = { data: compressedBase64, processing: false };
            renderPhotoGallery();
        } catch (error) {
            console.error('Error processing photo:', error);
        }
    }
    
    renderPhotoGallery();
    event.target.value = ''; // Reset input
}

function compressImage(file, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Maintain aspect ratio
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;
                if (width > height) {
                    if (width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress quality 0.3 (30%)
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
        };
        reader.onerror = error => reject(error);
    });
}

async function saveEditKavling() {
    const oldBlok = document.getElementById('editOldBlok').value;
    const newBlok = document.getElementById('editBlok').value;
    const updateData = {
        oldBlok: oldBlok,
        blok: newBlok,
        "LT": document.getElementById('editLT').value,
        "LB": document.getElementById('editLB').value,
        "Type": document.getElementById('editType').value,
        "Status": document.getElementById('editStatus').value,
    };

    // Collect physical conditions
    let emptyFields = [];
    PHYSICAL_COLUMNS.forEach(colName => {
        const textInput = document.querySelector(`#physicalConditionInputs input[name="${colName}"]`);
        const percentInput = document.querySelector(`#physicalConditionInputs input[name="${colName}_percent"]`);
        const selectBox = document.querySelector(`#physicalConditionInputs select[name="${colName}"]`);
        
        if (textInput && percentInput) {
            const textVal = textInput.value.trim();
            const percentVal = parseFloat(percentInput.value) || 0;
            
            // Tandai jika kosong tapi < 100% (hanya untuk info, bukan blokir)
            if (percentVal < 100 && !textVal) {
                emptyFields.push(colName);
                textInput.style.borderColor = '#ef4444'; // Beri border merah
            } else {
                textInput.style.borderColor = ''; // Reset border
            }

            // Format: "XX%-Keterangan"
            if (textVal) {
                updateData[colName] = `${percentVal}%-${textVal}`;
            } else {
                updateData[colName] = `${percentVal}%`;
            }
        } else if (selectBox && percentInput) {
            // Khusus Meteran (Dropdown)
            const textVal = selectBox.value;
            const percentVal = percentInput.value || 0;
            updateData[colName] = `${percentVal}%-${textVal}`;
        }
    });

    // Save Total Kondisi
    updateData["Total Kondisi"] = document.getElementById('editTotalKondisi').value;

    // Upload Foto menggunakan JSONP ber-chunk untuk menghindari limit URL
    const url = window.PROGRESS_APPS_SCRIPT_URL;
    if (currentEditPhotos && currentEditPhotos.length > 0) {
        const normalizedPhotos = currentEditPhotos.map(p => (typeof p === 'string') ? p : (p && p.data ? p.data : null)).filter(Boolean);
        const photoJson = JSON.stringify(normalizedPhotos);
        const session = 'P' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const chunkSize = 800; // ukuran kecil untuk keamanan URL JSONP
        const total = Math.ceil(photoJson.length / chunkSize);
        for (let i = 0; i < total; i++) {
            const chunk = photoJson.slice(i * chunkSize, (i + 1) * chunkSize);
            try {
                const btnSave = document.querySelector('.modal-edit .btn-save');
                if (btnSave) btnSave.innerText = `Mengupload data foto ${i + 1}/${total}...`;
                await window.getDataFromServer(url, {
                    action: 'saveInventarisPhotoChunk',
                    blok: newBlok,
                    oldBlok: oldBlok,
                    session: session,
                    index: i,
                    total: total,
                    chunk: chunk
                });
            } catch (e) {
                console.error('Gagal upload foto chunk', i + 1, 'dari', total, e);
            }
        }
    }

    try {
        const btnSave = document.querySelector('.modal-edit .btn-save');
        btnSave.disabled = true;
        btnSave.innerText = 'Menyimpan...';

        console.log('Updating data from:', oldBlok, 'to:', newBlok);
        
        // Kirim data langsung sebagai parameter (utils.js akan meng-handle stringify jika perlu)
        const result = await window.getDataFromServer(url, {
            action: 'updateInventarisUnit',
            data: JSON.stringify(updateData) 
        });

        if (result && result.success) {
            let msg = 'Data berhasil diperbarui!';
            if (emptyFields.length > 0) {
                msg += '\n\nCatatan: Beberapa isian < 100% masih kosong (ditandai merah).';
            }
            alert(msg);
            closeEditModal();
            loadInventarisData();
        } else {
            throw new Error(result ? result.message : 'Gagal memperbarui data');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Terjadi kesalahan saat menyimpan: ' + error.message);
    } finally {
        const btnSave = document.querySelector('.modal-edit .btn-save');
        btnSave.disabled = false;
        btnSave.innerText = 'Simpan Perubahan';
    }
}

// Slider Functions
let currentSliderTarget = null;

function openSlider(title, element) {
    currentSliderTarget = element;
    const currentVal = element.querySelector('input').value || 0;
    
    document.getElementById('sliderTitle').innerText = title;
    document.getElementById('sliderValue').innerText = currentVal + '%';
    document.getElementById('verticalSlider').value = currentVal;
    document.getElementById('sliderOverlay').style.display = 'flex';
    
    // Update value while sliding with magnetic effect
    const slider = document.getElementById('verticalSlider');
    slider.oninput = function() {
        let val = parseInt(this.value);
        const magnets = [0, 25, 50, 75, 100];
        const threshold = 3; // Rentang magnet (jika dekat 3 angka, akan nempel)

        for (let m of magnets) {
            if (Math.abs(val - m) <= threshold) {
                val = m;
                this.value = m;
                break;
            }
        }
        
        document.getElementById('sliderValue').innerText = val + '%';
    };
}

function closeSlider() {
    if (currentSliderTarget) {
        const newVal = document.getElementById('verticalSlider').value;
        currentSliderTarget.querySelector('.val').innerText = newVal;
        currentSliderTarget.querySelector('input').value = newVal;
        
        updateAutoCalc();
    }
    document.getElementById('sliderOverlay').style.display = 'none';
}

// Filter Logic
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');
            const tableRows = document.querySelectorAll('#kavlingTable tbody tr');

            tableRows.forEach(row => {
                if (filterValue === 'all') {
                    row.style.display = '';
                } else {
                    const rowKondisi = row.getAttribute('data-kondisi');
                    row.style.display = (rowKondisi === filterValue) ? '' : 'none';
                }
            });
        });
    });
}

// Search Logic
function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const tableRows = document.querySelectorAll('#kavlingTable tbody tr');

        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Check session on load
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('inventaris_auth') === 'true') {
        const passwordOverlay = document.getElementById('passwordOverlay');
        const mainApp = document.getElementById('mainApp');
        if (passwordOverlay) passwordOverlay.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        loadInventarisData();
    }

    const passInput = document.getElementById('passInput');
    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') checkPass();
        });
    }

    setupFilters();
    setupSearch();
});

function logout() {
    sessionStorage.removeItem('inventaris_auth');
    window.location.href = 'index.html';
}
