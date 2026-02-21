async function checkPass() {
    const passInput = document.getElementById('passInput');
    if (!passInput) return;
    const pass = passInput.value;
    const path = (window.location.pathname || '').toLowerCase();
    const isLaporan = path.includes('laporan_kondisi');
    const isInventaris = path.includes('inventaris');

    let isValid = false;
    if (isInventaris) {
        // Inventaris: wajib 8888, selalu minta saat reload
        isValid = pass === '8888';
    } else if (isLaporan) {
        // Cek Laporan Kondisi: wajib F888
        isValid = pass === 'F888';
    } else {
        // Halaman lain (fallback): izinkan kedua kode
        isValid = (pass === '8888' || pass === 'F888');
    }

    if (isValid) {
        const overlay = document.getElementById('passwordOverlay');
        const mainApp = document.getElementById('mainApp');
        if (overlay) overlay.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';

        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) errorMsg.style.display = 'none';
        passInput.value = '';

        if (isInventaris) {
            await loadMasterKavlingList();
            await loadInventarisData();
        } else if (isLaporan) {
            await loadInventarisData();
        }
    } else {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) errorMsg.style.display = 'block';
        passInput.value = '';
    }
}

async function loadMasterKavlingList() {
    const overlay = document.getElementById('masterLoadingOverlay');
    if (overlay) overlay.style.display = 'flex';
    try {
        const url = window.PROGRESS_APPS_SCRIPT_URL;
        const result = await window.getDataFromServer(url, {
            action: 'getKavlingList'
        });

        if (result && result.success && Array.isArray(result.kavlings)) {
            masterKavlingList = result.kavlings;
        } else {
            console.warn('Gagal memuat database kavling master untuk Tambah Kavling');
        }
    } catch (error) {
        console.error('Error load master kavling list:', error);
    } finally {
        if (overlay) overlay.style.display = 'none';
    }
}

// Global data store
let allKavlingData = [];
let currentEditPhotos = []; // Store base64 photos for current edit
let masterKavlingList = []; // Database kavling utama (sama seperti Pelaksana)
let lastAutoFilledKavling = '';

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

function getKondisiClass(totalKondisi) {
    let kondisiClass = 'tidak-layak';
    if (totalKondisi >= 91) kondisiClass = 'layak';
    else if (totalKondisi >= 75) kondisiClass = 'renov-ringan';
    else if (totalKondisi >= 50) kondisiClass = 'renov-banyak';
    else if (totalKondisi >= 20) kondisiClass = 'rusak';
    return kondisiClass;
}

function getStatusLabelFromClass(kelas) {
    if (kelas === 'layak') return 'Kondisi Layak Huni (91%-100%)';
    if (kelas === 'renov-ringan') return 'Kondisi Butuh Renovasi Ringan (75%-90%)';
    if (kelas === 'renov-banyak') return 'Kondisi Butuh Renovasi Banyak (50%-80%)';
    if (kelas === 'rusak') return 'Kondisi Rusak Parah (20%-49%)';
    return 'Kondisi Tidak Layak Huni (0%-19%)';
}

function renderTable(data) {
    const tbody = document.getElementById('kavlingTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="28" style="text-align: center; padding: 50px;">Tidak ada data ditemukan.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((row, index) => {
        // Total Kondisi sekarang ada di index 26 (kolom AA) di sheet InventarisUnit
        // Kita gunakan parseProgressValue untuk memastikan nilai 0-100
        const totalKondisi = window.parseProgressValue(row[26]);
        const kondisiClass = getKondisiClass(totalKondisi);

        // Susun ulang urutan kolom untuk tampilan tabel
        // Urutan sesuai judul tabel:
        // BLOK, LT, LB, Type, Status, Total Kondisi, lalu semua kolom fisik
        const baseColumns = [
            row[0] || '', // BLOK
            row[1] || '', // LT
            row[2] || '', // LB
            row[3] || '', // Type
            row[4] || ''  // Status
        ];
        const totalKondisiCell = row[26] || ''; // Total Kondisi (AA)
        const physicalColumns = PHYSICAL_COLUMNS.map((_, idx) => row[idx + 5] || '');
        const displayRow = [
            ...baseColumns,
            totalKondisiCell,
            ...physicalColumns
        ];

        return `
            <tr data-kondisi="${kondisiClass}" data-row-index="${index}">
                <td class="pan-cell">${index + 1}</td>
                ${displayRow.map((cell, i) => {
                    const isClickable = i >= 0 && i <= 5; // BLOK s/d Total Kondisi
                    const cellClasses = isClickable ? 'clickable-cell' : 'pan-cell';
                    if (i === 4) {
                        const statusText = cell || '-';
                        const statusClass = kondisiClass === 'layak' ? 'status-layak'
                            : kondisiClass === 'renov-ringan' ? 'status-renov-ringan'
                            : kondisiClass === 'renov-banyak' ? 'status-renov-banyak'
                            : kondisiClass === 'rusak' ? 'status-rusak'
                            : 'status-tidak-layak';
                        return `<td class="${cellClasses} ${statusClass}" ${isClickable ? `onclick="openEditModal(${index})"` : ''}>${statusText}</td>`;
                    }
                    if (i === 5) {
                        const val = window.parseProgressValue(totalKondisiCell);
                        let totalClass = '';
                        if (val < 50) totalClass = 'total-kondisi-low';
                        else if (val <= 70) totalClass = 'total-kondisi-medium';
                        else if (val <= 90) totalClass = 'total-kondisi-high';
                        else totalClass = 'total-kondisi-very-high';
                        return `<td class="${cellClasses} ${totalClass}" ${isClickable ? `onclick="openEditModal(${index})"` : ''}>${val}%</td>`;
                    }
                    
                    let displayCell = cell || '-';
                    if (i > 5 && cell) {
                        const str = String(cell).trim();
                        // Format "angka" atau "angka%-teks"
                        const percentDescMatch = str.match(/^(\d+(\.\d+)?)%-?(.*)$/);
                        if (percentDescMatch) {
                            const rawNum = percentDescMatch[1];
                            const desc = percentDescMatch[3].trim();
                            const numVal = window.parseProgressValue(rawNum);
                            displayCell = desc ? `${numVal}% - ${desc}` : `${numVal}%`;
                        } else if (/^\d+(\.\d+)?$/.test(str)) {
                            // Angka murni (misalnya 0.6 atau 60)
                            const numVal = window.parseProgressValue(str);
                            displayCell = `${numVal}%`;
                        } else {
                            displayCell = str;
                        }
                    }

                    return `<td class="${cellClasses}" ${isClickable ? `onclick="openEditModal(${index})"` : ''}>${displayCell}</td>`;
                }).join('')}
            </tr>
        `;
    }).join('');

    applyStickyColumns();
}

let currentSortState = {
    key: null,
    direction: 'asc'
};

function sortInventarisBy(key) {
    if (!allKavlingData || allKavlingData.length === 0) return;
    if (currentSortState.key === key) {
        currentSortState.direction = currentSortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortState.key = key;
        currentSortState.direction = 'asc';
    }
    const dir = currentSortState.direction === 'asc' ? 1 : -1;
    const sorted = [...allKavlingData].sort((a, b) => {
        if (key === 'blok') {
            const aParts = parseKavlingPartsForInventaris(a[0] || '');
            const bParts = parseKavlingPartsForInventaris(b[0] || '');
            if (aParts.block !== bParts.block) {
                return aParts.block.localeCompare(bParts.block) * dir;
            }
            return (aParts.number - bParts.number) * dir;
        }
        if (key === 'status') {
            const statusOrder = {
                'Kondisi Layak Huni (91%-100%)': 4,
                'Kondisi Butuh Renovasi Ringan (75%-90%)': 3,
                'Kondisi Butuh Renovasi Banyak (50%-80%)': 2,
                'Kondisi Rusak Parah (20%-49%)': 1,
                'Kondisi Tidak Layak Huni (0%-19%)': 0
            };
            const aLabel = getStatusLabelFromClass(getKondisiClass(window.parseProgressValue(a[26])));
            const bLabel = getStatusLabelFromClass(getKondisiClass(window.parseProgressValue(b[26])));
            const aVal = statusOrder[aLabel] ?? -1;
            const bVal = statusOrder[bLabel] ?? -1;
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        if (key === 'total') {
            const aVal = window.parseProgressValue(a[26]);
            const bVal = window.parseProgressValue(b[26]);
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        return 0;
    });
    renderTable(sorted);
}

function applyStickyColumns() {
    const table = document.getElementById('kavlingTable');
    if (!table || !table.tHead || !table.tBodies.length) return;

    const headerRow = table.tHead.rows[0];
    const bodyRows = table.tBodies[0].rows;
    const stickyCols = [0, 1, 2, 3, 4, 5, 6]; // No, BLOK, LT, LB, Type, Status, Total Kondisi
    const leftOffsets = {};

    stickyCols.forEach(colIndex => {
        const cell = headerRow.children[colIndex];
        if (!cell) return;
        const left = cell.offsetLeft;
        leftOffsets[colIndex] = left;
        cell.style.position = 'sticky';
        cell.style.left = left + 'px';
        cell.style.zIndex = 3;
        cell.style.background = '#0f172a';
    });

    Array.from(bodyRows).forEach(row => {
        stickyCols.forEach(colIndex => {
            const cell = row.children[colIndex];
            if (!cell) return;
            const left = leftOffsets[colIndex];
            cell.style.position = 'sticky';
            cell.style.left = left + 'px';
            cell.style.background = '#020617';
            cell.style.zIndex = 1;
        });
    });
}

// Modal Functions
async function openAddKavlingModal() {
    document.getElementById('addKavlingModal').style.display = 'flex';
    setupAddKavlingSearch();
    if (!masterKavlingList || masterKavlingList.length === 0) {
        await loadMasterKavlingList();
    }
    lastAutoFilledKavling = '';
    updateAddKavlingButtonLabel();
}

function setupAddKavlingSearch() {
    const input = document.getElementById('inputBlok');
    const list = document.getElementById('inputBlokList');
    const ltInput = document.getElementById('inputLT');
    const lbInput = document.getElementById('inputLB');
    if (!input || !list || !ltInput || !lbInput) return;
    if (input.dataset.searchBound) return;
    input.dataset.searchBound = 'true';

    input.addEventListener('input', (e) => {
        const val = e.target.value || '';
        if (!val.trim()) {
            list.style.display = 'none';
            list.innerHTML = '';
            lastAutoFilledKavling = '';
            updateAddKavlingButtonLabel();
            return;
        }
        renderAddKavlingList(val);
        updateAddKavlingButtonLabel();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            list.style.display = 'none';
            handleAutoFillKavling();
        }
    });

    ltInput.addEventListener('input', () => {
        updateAddKavlingButtonLabel();
    });

    lbInput.addEventListener('input', () => {
        updateAddKavlingButtonLabel();
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target)) {
            list.style.display = 'none';
        }
    });
}

function parseKavlingPartsForInventaris(str) {
    const trimmed = String(str || '').trim();
    if (/^\d+$/.test(trimmed)) {
        return { block: '', number: parseInt(trimmed, 10) };
    }
    const complexMatch = trimmed.match(/^([A-Za-z]+\d*)[_ ]*(\d+)$/);
    if (complexMatch) {
        return { block: complexMatch[1].toUpperCase(), number: parseInt(complexMatch[2], 10) };
    }
    const simpleMatch = trimmed.match(/([A-Za-z]+)[_ ]*(\d+)/);
    if (simpleMatch) {
        return { block: simpleMatch[1].toUpperCase(), number: parseInt(simpleMatch[2], 10) };
    }
    return { block: trimmed.toUpperCase(), number: 0 };
}

function renderAddKavlingList(searchTerm) {
    const list = document.getElementById('inputBlokList');
    const input = document.getElementById('inputBlok');
    if (!list || !input) return;

    const term = (searchTerm || '').toLowerCase().trim();
    let items = masterKavlingList || [];

    if (term) {
        const termParts = parseKavlingPartsForInventaris(term);
        const termBlock = termParts.block;
        items = items.filter(k => {
            const lower = k.toLowerCase();
            const parts = parseKavlingPartsForInventaris(k);
            if (termBlock) {
                if (parts.block.startsWith(termBlock)) return true;
            }
            return lower.includes(term);
        });
        items.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aStarts = aLower.startsWith(term);
            const bStarts = bLower.startsWith(term);
            const aParts = parseKavlingPartsForInventaris(a);
            const bParts = parseKavlingPartsForInventaris(b);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            if (aParts.block !== bParts.block) {
                return aParts.block.localeCompare(bParts.block);
            }
            return aParts.number - bParts.number;
        });
    } else {
        items = [...items].sort((a, b) => {
            const aParts = parseKavlingPartsForInventaris(a);
            const bParts = parseKavlingPartsForInventaris(b);
            if (aParts.block !== bParts.block) {
                return aParts.block.localeCompare(bParts.block);
            }
            return aParts.number - bParts.number;
        });
    }

    list.innerHTML = '';

    if (items.length === 0) {
        const noResult = document.createElement('div');
        noResult.className = 'custom-dropdown-item no-results';
        noResult.textContent = 'Tidak ada kavling ditemukan';
        list.appendChild(noResult);
        list.style.display = 'block';
        return;
    }

    const maxItems = 5;
    items.slice(0, maxItems).forEach(item => {
        const div = document.createElement('div');
        div.className = 'custom-dropdown-item';
        div.textContent = item;
        div.addEventListener('click', () => {
            input.value = item;
            list.style.display = 'none';
            handleAutoFillKavling();
        });
        list.appendChild(div);
    });

    if (items.length > maxItems) {
        const more = document.createElement('div');
        more.className = 'custom-dropdown-item no-results';
        more.textContent = `...dan ${items.length - maxItems} lainnya (ketik untuk mencari)`;
        list.appendChild(more);
    }

    list.style.display = 'block';
}

async function handleAutoFillKavling() {
    const textInput = document.getElementById('inputBlok');
    if (!textInput) return;
    const value = textInput.value.trim();
    if (!value || value.length < 1) return;

    const detailOverlay = document.getElementById('kavlingDetailLoadingOverlay');
    if (detailOverlay) detailOverlay.style.display = 'flex';

    const url = window.PROGRESS_APPS_SCRIPT_URL;
    try {
        const result = await window.getDataFromServer(url, {
            action: 'getKavlingData',
            kavling: value
        });

        if (result && result.success) {
            const ltField = document.getElementById('inputLT');
            const lbField = document.getElementById('inputLB');
            const typeField = document.getElementById('inputType');

            if (ltField) {
                ltField.value = result.lt || '';
            }
            if (lbField) {
                lbField.value = result.lb || '';
            }
            if (typeField) {
                typeField.value = result.type || '';
            }

            if (result.blok && (!textInput.value || textInput.value === value)) {
                textInput.value = result.blok;
            }

            lastAutoFilledKavling = result.kavling || result.blok || value;
            updateAddKavlingButtonLabel();
        }
    } catch (error) {
        console.error('Auto fill kavling failed:', error);
    } finally {
        if (detailOverlay) detailOverlay.style.display = 'none';
    }
}

function closeAddKavlingModal() {
    document.getElementById('addKavlingModal').style.display = 'none';
    document.getElementById('addKavlingForm').reset();
    lastAutoFilledKavling = '';
    updateAddKavlingButtonLabel();
}

function updateAddKavlingButtonLabel() {
    const btn = document.getElementById('btnSaveAddKavling');
    if (!btn) return;
    const blokVal = (document.getElementById('inputBlok')?.value || '').trim();
    const ltVal = (document.getElementById('inputLT')?.value || '').trim();
    const lbVal = (document.getElementById('inputLB')?.value || '').trim();

    if (ltVal && lbVal && lastAutoFilledKavling && blokVal && blokVal === lastAutoFilledKavling) {
        btn.innerText = `Simpan Data Kavling (${blokVal})`;
    } else {
        btn.innerText = 'Simpan Data Kavling';
    }
}

async function submitAddKavling(event) {
    event.preventDefault();
    const blokVal = document.getElementById('inputBlok').value.trim();
    if (!blokVal || blokVal.length < 4) {
        alert('Alamat kavling minimal 4 karakter.');
        return;
    }
    let ltVal = document.getElementById('inputLT').value;
    let lbVal = document.getElementById('inputLB').value;
    let typeVal = document.getElementById('inputType').value;
    if (!ltVal) ltVal = '-';
    if (!lbVal) lbVal = '-';
    if (!typeVal) typeVal = '-';

    const formData = {
        blok: blokVal,
        lt: ltVal,
        lb: lbVal,
        type: typeVal,
        status: '',
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

    // Render Physical Condition Inputs
    const physicalContainer = document.getElementById('physicalConditionInputs');
    physicalContainer.innerHTML = '';
    
    PHYSICAL_COLUMNS.forEach((colName, i) => {
        // Kolom fisik sekarang mulai dari index 5 (kolom F) sampai 25
        const val = row[i + 5] || '';
        
        // Parsing "XX%-Keterangan" atau format lama
        let percentVal = 0;
        let textVal = val;

        if (typeof val === 'string' && val.includes('%-')) {
            const parts = val.split('%-');
            const rawPercent = parts[0];
            percentVal = window.parseProgressValue(rawPercent);
            textVal = parts.slice(1).join('%-');
        } else if (val && !isNaN(parseFloat(val))) {
            // Nilai numerik lama (misalnya 0.6 atau 60) → konversi ke 0-100
            percentVal = window.parseProgressValue(val);
            textVal = '';
        }

        // Cek jika kolom adalah Meteran Listrik atau Meteran PDAM (Hanya Meteran saja)
        const isMeteran = colName.toLowerCase() === 'meteran listrik' || colName.toLowerCase() === 'meteran pdam';
        
        const div = document.createElement('div');
        div.className = isMeteran ? 'physical-input-row physical-meter' : 'physical-input-row';
        
        if (isMeteran) {
            let selectedStatus = "Belum Ada";
            const textLower = (textVal || '').toLowerCase();
            if (textLower.includes("berfungsi")) selectedStatus = "Terpasang dan Berfungsi";
            else if (textLower.includes("rusak")) selectedStatus = "Terpasang dan Rusak";
            else if (textLower.includes("belum")) selectedStatus = "Belum Ada";
            else if (percentVal >= 95) selectedStatus = "Terpasang dan Berfungsi";
            else if (percentVal > 0 && percentVal <= 15) selectedStatus = "Terpasang dan Rusak";

            let defaultPercent = 90;
            if (selectedStatus === 'Terpasang dan Berfungsi') defaultPercent = 100;
            else if (selectedStatus === 'Terpasang dan Rusak') defaultPercent = 10;
            const meteranPercent = percentVal || defaultPercent;

            div.innerHTML = `
                <div class="form-group physical-meter-group">
                    <label>${colName}</label>
                    <select name="${colName}" onchange="updateAutoCalc()" class="form-control">
                        <option value="Terpasang dan Berfungsi" ${selectedStatus === 'Terpasang dan Berfungsi' ? 'selected' : ''}>Terpasang dan Berfungsi</option>
                        <option value="Belum Ada" ${selectedStatus === 'Belum Ada' ? 'selected' : ''}>Belum Ada</option>
                        <option value="Terpasang dan Rusak" ${selectedStatus === 'Terpasang dan Rusak' ? 'selected' : ''}>Terpasang dan Rusak</option>
                    </select>
                    <input type="hidden" name="${colName}_percent" value="${meteranPercent}">
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="form-group physical-percent">
                    <label>Persentase Perkiraan</label>
                    <div class="percent-display-box" onclick="openSlider('${colName}', this)">
                        <span class="val">${percentVal}</span>%
                        <input type="hidden" name="${colName}_percent" value="${percentVal}">
                    </div>
                </div>
                <div class="form-group physical-desc">
                    <label>${colName}</label>
                    <input type="text" name="${colName}" value="${textVal}" placeholder="keterangan kondisi saat ini" oninput="updateAutoCalc()">
                </div>
            `;
        }
        physicalContainer.appendChild(div);
    });

    currentEditPhotos = [];
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
            if (selectBox && percentInput) {
                const status = selectBox.value;
                let percent = 0;
                if (status === 'Terpasang dan Berfungsi') percent = 100;
                else if (status === 'Terpasang dan Rusak') percent = 10;
                else percent = 90;
                percentInput.value = percent;
                total += (percent / 100) * meteranWeight;
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
    
    if (display) {
        display.innerText = finalTotal + '%';
        display.classList.remove('total-kondisi-low', 'total-kondisi-medium', 'total-kondisi-high', 'total-kondisi-very-high');
        const numeric = parseFloat(finalTotal);
        if (numeric < 50) {
            display.classList.add('total-kondisi-low');
        } else if (numeric <= 70) {
            display.classList.add('total-kondisi-medium');
        } else if (numeric <= 90) {
            display.classList.add('total-kondisi-high');
        } else {
            display.classList.add('total-kondisi-very-high');
        }
    }
    if (hidden) hidden.value = finalTotal + '%';

    const statusLabel = document.getElementById('editStatusDisplay');
    if (statusLabel) {
        const statusClass = getKondisiClass(parseFloat(finalTotal));
        const labelText = getStatusLabelFromClass(statusClass);
        statusLabel.innerText = labelText;
        statusLabel.className = 'status-display-label';
        if (statusClass === 'layak') {
            statusLabel.classList.add('status-layak');
        } else if (statusClass === 'renov-ringan') {
            statusLabel.classList.add('status-renov-ringan');
        } else if (statusClass === 'renov-banyak') {
            statusLabel.classList.add('status-renov-banyak');
        } else if (statusClass === 'rusak') {
            statusLabel.classList.add('status-rusak');
        } else {
            statusLabel.classList.add('status-tidak-layak');
        }
    }
}

function closeEditModal() {
    document.getElementById('editKavlingModal').style.display = 'none';
}

function renderPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    
    currentEditPhotos.forEach((photo, index) => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        if (typeof photo === 'string') {
            const isUrl = photo.startsWith('http://') || photo.startsWith('https://');
            const src = isUrl ? photo : (photo.startsWith('data:') ? photo : 'data:image/jpeg;base64,' + photo);
            div.innerHTML = `
                <img src="${src}" alt="Foto ${index + 1}">
                <button type="button" class="remove-photo" onclick="removePhoto(${index})">&times;</button>
            `;
        } else {
            const isProcessing = photo && photo.processing;
            const isUploading = photo && photo.uploading;
            if (isProcessing || isUploading) {
                let label = 'Mengupload foto...';
                if (isProcessing) {
                    const prog = typeof photo.progress === 'number' ? photo.progress : 0;
                    label = `Mengompres ${prog}%`;
                }
                div.innerHTML = `
                    <div class="photo-progress" style="position:absolute;top:4px;left:4px;right:4px;z-index:10;padding:2px 4px;background:rgba(15,23,42,0.9);border-radius:4px;font-size:0.7rem;color:#e5e7eb;text-align:center;">
                        ${label}
                    </div>
                    <div class="photo-loading" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px dashed #64748b;border-radius:8px;background:#0b1220;">
                        <i class="fas fa-spinner fa-spin" style="color:#94a3b8;font-size:20px;"></i>
                    </div>
                `;
            } else {
                const val = photo && photo.data ? photo.data : '';
                const isUrl2 = val && (val.startsWith('http://') || val.startsWith('https://'));
                const src = val ? (isUrl2 ? val : (val.startsWith('data:') ? val : 'data:image/jpeg;base64,' + val)) : '';
                div.innerHTML = `
                    <img src="${src}" alt="Foto ${index + 1}">
                    <button type="button" class="remove-photo" onclick="removePhoto(${index})">&times;</button>
                `;
            }
        }
        gallery.appendChild(div);
    });
    
    const info = document.getElementById('photoCountInfo');
    if (info) info.innerText = `${currentEditPhotos.length}/6 Foto`;
}

function removePhoto(index) {
    currentEditPhotos.splice(index, 1);
    renderPhotoGallery();
}


function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
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
        "Type": document.getElementById('editType').value
    };

    // Collect physical conditions
    let emptyFields = [];
    PHYSICAL_COLUMNS.forEach(colName => {
        const textInput = document.querySelector(`#physicalConditionInputs input[name="${colName}"]`);
        const percentInput = document.querySelector(`#physicalConditionInputs input[name="${colName}_percent"]`);
        const selectBox = document.querySelector(`#physicalConditionInputs select[name="${colName}"]`);
        
        if (textInput && percentInput) {
            const textVal = textInput.value.trim();
            const percentVal = window.parseProgressValue(percentInput.value);
            
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

    const totalKondisiValue = document.getElementById('editTotalKondisi').value;
    updateData["Total Kondisi"] = totalKondisiValue;
    const totalNumeric = window.parseProgressValue(totalKondisiValue);
    const kondisiClass = getKondisiClass(totalNumeric);
    updateData["Status"] = getStatusLabelFromClass(kondisiClass);

    // Upload Foto menggunakan JSONP ber-chunk untuk menghindari limit URL
    const url = window.PROGRESS_APPS_SCRIPT_URL;
    if (currentEditPhotos && currentEditPhotos.length > 0) {
        const normalizedPhotos = currentEditPhotos
            .map(p => {
                const val = typeof p === 'string' ? p : (p && p.data ? p.data : null);
                if (!val) return null;
                const isUrl = val.startsWith('http://') || val.startsWith('https://');
                if (isUrl) {
                    return { t: 'u', v: val };
                }
                let base = val;
                const idx = base.indexOf('base64,');
                if (idx !== -1) {
                    base = base.substring(idx + 7);
                }
                if (!base) return null;
                return { t: 'b', v: base };
            })
            .filter(Boolean);
        const photoJson = JSON.stringify(normalizedPhotos);
        const session = 'P' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const chunkSize = 1200; // sedikit lebih besar agar jumlah request berkurang
        const total = Math.ceil(photoJson.length / chunkSize);

        currentEditPhotos = currentEditPhotos.map(p => {
            if (typeof p === 'string') {
                return { data: p, uploading: true };
            }
            return Object.assign({}, p, { uploading: true });
        });
        renderPhotoGallery();

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

        currentEditPhotos = currentEditPhotos.map(p => {
            if (typeof p === 'string') return p;
            const copy = Object.assign({}, p);
            delete copy.uploading;
            return copy;
        });
        renderPhotoGallery();
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

async function deleteKavlingInventaris() {
    const blok = document.getElementById('editOldBlok').value || document.getElementById('editBlok').value;
    if (!blok) {
        alert('Nama kavling tidak ditemukan.');
        return;
    }

    const konfirmasi = confirm(`Iya akan hapus "${blok}" ini?`);
    if (!konfirmasi) return;

    try {
        const url = window.PROGRESS_APPS_SCRIPT_URL;
        const result = await window.getDataFromServer(url, {
            action: 'deleteInventarisUnit',
            kavling: blok
        });

        if (result && result.success) {
            alert(`Kavling "${blok}" berhasil dihapus.`);
            closeEditModal();
            loadInventarisData();
        } else {
            throw new Error(result ? result.message : 'Gagal menghapus kavling');
        }
    } catch (error) {
        console.error('Error deleting kavling:', error);
        alert('Terjadi kesalahan saat menghapus: ' + error.message);
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

function setupTablePanScroll() {
    const container = document.querySelector('.main-content-table');
    if (!container) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    container.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        if (e.target.closest('.clickable-cell')) return;

        isDown = true;
        container.classList.add('is-panning');
        startX = e.pageX;
        startY = e.pageY;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
    });

    container.addEventListener('mousemove', function(e) {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX;
        const y = e.pageY;
        const walkX = x - startX;
        const walkY = y - startY;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });

    ['mouseleave'].forEach(evt => {
        container.addEventListener(evt, function() {
            isDown = false;
            container.classList.remove('is-panning');
        });
    });

    window.addEventListener('mouseup', function() {
        isDown = false;
        container.classList.remove('is-panning');
    });

    container.addEventListener('dblclick', function() {
        container.scrollLeft = 0;
        container.scrollTop = 0;
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

document.addEventListener('DOMContentLoaded', function() {
    const passInput = document.getElementById('passInput');
    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') checkPass();
        });
    }

    setupFilters();
    setupSearch();
    setupTablePanScroll();
});

function logout() {
    window.location.href = 'index.html';
}
