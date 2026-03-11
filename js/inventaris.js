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

const INVENTARIS_CACHE_KEY = 'inventaris_kavling_data_v1';
const INVENTARIS_CACHE_TTL_MS = 5 * 60 * 1000;

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
let filteredKavlingData = []; // Data yang sudah di-filter (pencarian/filter kondisi)
let currentEditPhotos = [];
let masterKavlingList = [];
let lastAutoFilledKavling = '';
let lastFolderEmbedSrc = '';
let currentEditIndex = -1;

// Pagination state
let currentPage = 1;
const rowsPerPage = 50;

// Debounce timer for search
let searchDebounceTimer;

// Mapping kolom fisik untuk modal edit (disesuaikan dengan urutan tabel/sheet)
const PHYSICAL_COLUMNS = [
    "KONDISI HALAMAN", "PONDASI", "CAT LUAR", "CAT DALAM", "KERAMIK LANTAI",
    "PLAFOND", "RANGKA ATAP", "GENTENG", "TOILET", "DAPUR",
    "KUSEN PINTU", "DAUN PINTU", "KUSEN JENDELA", "DAUN JENDELA",
    "STOP KONTAK", "FITTING LAMPU", "KELISTRIKAN", "Meteran Listrik",
    "Meteran PDAM", "PIPA AIR BERSIH", "KONDISI LAINNYA"
];

async function loadInventarisData(forceRefresh = false) {
    const tbody = document.getElementById('kavlingTableBody');
    const loading = document.getElementById('loadingOverlay');
    if (!tbody) return;

    const now = Date.now();
    let usedCache = false;

    if (!forceRefresh) {
        try {
            const cached = JSON.parse(localStorage.getItem(INVENTARIS_CACHE_KEY) || 'null');
            if (cached && Array.isArray(cached.data) && typeof cached.timestamp === 'number') {
                if (now - cached.timestamp < INVENTARIS_CACHE_TTL_MS) {
                    allKavlingData = cached.data;
                    applySearchAndFilter();
                    usedCache = true;
                }
            }
        } catch (_) {}
    }

    if (!usedCache && loading) loading.style.display = 'flex';

    const fetchAndRender = async () => {
        try {
            const url = window.PROGRESS_APPS_SCRIPT_URL;
            const result = await window.getDataFromServer(url, {
                action: 'getKavlingData',
                sheetName: 'InventarisUnit'
            });

            let dataToRender = [];
            let rawData = [];
            if (Array.isArray(result)) {
                rawData = result;
            } else if (result && result.data && Array.isArray(result.data)) {
                rawData = result.data;
            } else if (result && !result.success) {
                throw new Error(result.message || 'Gagal mengambil data');
            }

            // Bersihkan data: berhenti jika kolom BLOK (index 0) kosong
            for (let row of rawData) {
                const blok = String(row[0] || '').trim();
                if (!blok) break; // Berhenti total jika ketemu baris kosong di kolom A
                dataToRender.push(row);
            }

            allKavlingData = dataToRender;
            applySearchAndFilter();

            try {
                localStorage.setItem(INVENTARIS_CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: allKavlingData
                }));
            } catch (_) {}
        } catch (error) {
            console.error('Error loading data:', error);
            if (!usedCache) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="31" style="text-align: center; padding: 50px; color: #f43f5e;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                            <p>Gagal memuat data: ${error.message}</p>
                            <button onclick="loadInventarisData()" class="btn-silver" style="margin-top: 15px;">Coba Lagi</button>
                        </td>
                    </tr>
                `;
            }
        } finally {
            if (!usedCache && loading) loading.style.display = 'none';
        }
    };

    if (usedCache) {
        fetchAndRender();
    } else {
        await fetchAndRender();
    }
}

function refreshInventarisData() {
    try { localStorage.removeItem(INVENTARIS_CACHE_KEY); } catch (_) {}
    loadInventarisData(true);
}

function getKondisiClass(totalKondisi) {
    if (totalKondisi >= 90) return 'layak';
    if (totalKondisi >= 76) return 'renov-ringan';
    if (totalKondisi >= 50) return 'renov-banyak';
    if (totalKondisi >= 19) return 'rusak';
    if (totalKondisi >= 2) return 'tidak-layak';
    return 'tanah';
}

function getStatusLabelFromClass(kelas) {
    if (kelas === 'layak') return 'Kondisi Baik (90%-100%)';
    if (kelas === 'renov-ringan') return 'Kondisi Butuh Renovasi Ringan (76%-89%)';
    if (kelas === 'renov-banyak') return 'Kondisi Butuh Renovasi Berat (50%-75%)';
    if (kelas === 'rusak') return 'Kondisi Rusak Parah (19%-49%)';
    if (kelas === 'tidak-layak') return 'Kondisi dalam pembangunan / perlu bangun ulang (2%-18%)';
    return 'Kondisi Tanah-Siap Bangun (0%-1%)';
}

function renderTable(data) {
    const tbody = document.getElementById('kavlingTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="32" style="text-align: center; padding: 50px;">Tidak ada data ditemukan.</td></tr>';
        updatePaginationUI(0);
        return;
    }

    // Pagination logic
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    // Ensure currentPage is within bounds
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
    const paginatedData = data.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map((row, i) => {
        const originalIndex = allKavlingData.indexOf(row);
        const totalKondisi = window.parseProgressValue(row[27]);
        const kondisiClass = getKondisiClass(totalKondisi);

        const baseColumns = [
            row[0] || '', // BLOK
            row[1] || '', // LT
            row[2] || '', // LB
            row[3] || '', // Type
            row[5] || ''  // Status (kolom F di sheet, index 5)
        ];
        const totalKondisiCell = row[27] || '';
        const pelaksanaCell = row[31] || '';
        const imbCell = row[4] || ''; // Nomor IMB/PBG/SLF (kolom E)
        const skemaCell = row[28] || ''; // Skema Penjualan (kolom AC)
        const sertifikatCell = row[29] || ''; // Nomor Sertifikat (kolom AD)
        const physicalColumns = PHYSICAL_COLUMNS.map((_, idx) => row[idx + 6] || '');
        const displayRow = [
            ...baseColumns,
            totalKondisiCell,
            pelaksanaCell,
            ...physicalColumns,
            skemaCell,
            sertifikatCell,
            imbCell
        ];

        // Hitung nomor urut (No) berdasarkan halaman
        const rowNumber = startIndex + i + 1;

        return `
            <tr data-kondisi="${kondisiClass}" data-row-index="${originalIndex}">
                <td class="pan-cell">${rowNumber}</td>
                ${displayRow.map((cell, cellIdx) => {
                    const isClickable = cellIdx >= 0 && cellIdx <= 5;
                    const cellClasses = isClickable ? 'clickable-cell' : 'pan-cell';
                    if (cellIdx === 4) {
                        const statusText = cell || '-';
                        const statusClass = kondisiClass === 'layak' ? 'status-layak'
                            : kondisiClass === 'renov-ringan' ? 'status-renov-ringan'
                            : kondisiClass === 'renov-banyak' ? 'status-renov-banyak'
                            : kondisiClass === 'rusak' ? 'status-rusak'
                            : kondisiClass === 'tidak-layak' ? 'status-tidak-layak'
                            : 'status-tanah';
                        return `<td class="${cellClasses} ${statusClass}" ${isClickable ? `onclick="openEditModal(${originalIndex})"` : ''}>${statusText}</td>`;
                    }
                    if (cellIdx === 5) {
                        const val = window.parseProgressValue(totalKondisiCell);
                        return `<td class="${cellClasses}" ${isClickable ? `onclick="openEditModal(${originalIndex})"` : ''}>${val}%</td>`;
                    }
                    
                    let displayCell = cell || '-';
                    if (cellIdx > 5 && cell) {
                        const str = String(cell).trim();
                        const percentDescMatch = str.match(/^(\d+(\.\d+)?)%-?(.*)$/);
                        if (percentDescMatch) {
                            const rawNum = percentDescMatch[1];
                            const desc = percentDescMatch[3].trim();
                            const numVal = window.parseProgressValue(rawNum);
                            displayCell = desc ? `${numVal}% - ${desc}` : `${numVal}%`;
                        } else if (/^\d+(\.\d+)?$/.test(str)) {
                            const numVal = window.parseProgressValue(str);
                            displayCell = `${numVal}%`;
                        } else {
                            displayCell = str;
                        }
                    }

                    return `<td class="${cellClasses}" ${isClickable ? `onclick="openEditModal(${originalIndex})"` : ''}>${displayCell}</td>`;
                }).join('')}
            </tr>
        `;
    }).join('');

    updatePaginationUI(totalItems);
}

function updatePaginationUI(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const info = document.getElementById('paginationInfo');

    if (info) {
        if (totalItems === 0) {
            info.innerText = 'Tidak ada data';
        } else {
            const start = (currentPage - 1) * rowsPerPage + 1;
            const end = Math.min(currentPage * rowsPerPage, totalItems);
            info.innerText = `Menampilkan ${start}-${end} dari ${totalItems} kavling (Hal ${currentPage}/${totalPages})`;
        }
    }

    if (prevBtn) prevBtn.disabled = (currentPage <= 1);
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
}

function nextPage() {
    const totalPages = Math.ceil(filteredKavlingData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable(filteredKavlingData);
        scrollToTopTable();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable(filteredKavlingData);
        scrollToTopTable();
    }
}

function scrollToTopTable() {
    const container = document.querySelector('.main-content-table');
    if (container) container.scrollTop = 0;
}

function downloadLaporanKondisiToExcel() {
    const data = filteredKavlingData;
    if (data.length === 0) return;

    const table = document.getElementById('kavlingTable');
    if (!table || !table.tHead) return;
    const headerCells = Array.from(table.tHead.rows[0].cells);
    const headers = headerCells.map(th => (th.textContent || '').trim().replace(/\s+/g, ' ')).concat(['QR']);

    const dateStr = new Date().toISOString().split('T')[0];
    let filterSuffix = 'Semua';
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    if (activeFilterBtn) {
        const filterVal = (activeFilterBtn.getAttribute('data-filter') || 'all').toLowerCase();
        if (filterVal === 'layak') filterSuffix = 'Kondisi_Baik_90-100';
        else if (filterVal === 'renov-ringan') filterSuffix = 'Renovasi_Ringan_76-89';
        else if (filterVal === 'renov-banyak') filterSuffix = 'Renovasi_Berat_50-75';
        else if (filterVal === 'rusak') filterSuffix = 'Rusak_Parah_19-49';
        else if (filterVal === 'tidak-layak') filterSuffix = 'Rusak_Bangun_Ulang_2-18';
        else if (filterVal === 'tanah') filterSuffix = 'Tanah_Siap_Bangun_0-1';
        else filterSuffix = 'Semua';
    }

    if (window.ExcelJS) {
        const wb = new window.ExcelJS.Workbook();
        const ws = wb.addWorksheet('Laporan');
        ws.columns = headers.map(h => ({ header: h, width: 18 }));
        const toColLetter = (n) => {
            let s = '';
            while (n > 0) {
                let m = (n - 1) % 26;
                s = String.fromCharCode(65 + m) + s;
                n = Math.floor((n - 1) / 26);
            }
            return s;
        };
        data.forEach((row, idx) => {
            const totalKondisi = window.parseProgressValue(row[27]);
            const kondisiClass = getKondisiClass(totalKondisi);
            const statusLabel = getStatusLabelFromClass(kondisiClass);
            const physicalValues = PHYSICAL_COLUMNS.map((_, i) => {
                const val = row[i + 6] || '';
                if (!val) return '-';
                const str = String(val).trim();
                const match = str.match(/^(\d+(\.\d+)?)%-?(.*)$/);
                if (match) {
                    const num = window.parseProgressValue(match[1]);
                    const desc = match[3].trim();
                    return desc ? `${num}% - ${desc}` : `${num}%`;
                }
                if (/^\d+(\.\d+)?$/.test(str)) return window.parseProgressValue(str) + '%';
                return str;
            });
            const rowCells = [
                idx + 1,
                row[0] || '-',
                row[1] || '-',
                row[2] || '-',
                row[3] || '-',
                statusLabel,
                totalKondisi + '%',
                row[31] ? (window.parseProgressValue(row[31]) + '%') : '-',
                ...physicalValues,
                row[28] || '-',
                row[29] || '-',
                row[4] || '-',
                ''
            ];
            const r = ws.addRow(rowCells);
            r.height = 80;
            let qrLink = '';
            const fotoRaw = row[30] || '';
            if (fotoRaw) {
                try {
                    const arr = JSON.parse(fotoRaw);
                    if (Array.isArray(arr)) {
                        const found = arr.find(v => typeof v === 'string' && v.indexOf('http') === 0);
                        if (found) qrLink = found;
                    }
                } catch (_) {
                    const m = String(fotoRaw).match(/https?:\/\/\S+/);
                    if (m) qrLink = m[0];
                }
            }
            if (qrLink) {
                const dataUrl = generateQrDataUrl(qrLink, 180);
                const imgId = wb.addImage({ base64: dataUrl, extension: 'png' });
                const qrCol = headers.length;
                const colLetter = toColLetter(qrCol);
                const rowNumber = r.number;
                ws.addImage(imgId, `${colLetter}${rowNumber}:${colLetter}${rowNumber}`);
                const cell = ws.getCell(`${colLetter}${rowNumber}`);
                cell.value = { text: 'Link', hyperlink: qrLink };
                cell.font = { color: { argb: 'FF1D4ED8' }, underline: true };
            }
        });
        wb.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Kondisi_Kavling_${filterSuffix}_${dateStr}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        return;
    }

    let html = '<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;font-family:Arial;font-size:11px}th{background:#e5e7eb;text-align:left}img{display:block}</style></head><body><table><thead><tr>';
    headers.forEach(h => { html += '<th>' + String(h) + '</th>'; });
    html += '</tr></thead><tbody>';

    data.forEach((row, idx) => {
        const totalKondisi = window.parseProgressValue(row[27]);
        const kondisiClass = getKondisiClass(totalKondisi);
        const statusLabel = getStatusLabelFromClass(kondisiClass);

        const physicalValues = PHYSICAL_COLUMNS.map((_, i) => {
            const val = row[i + 6] || '';
            if (!val) return '-';
            const str = String(val).trim();
            const match = str.match(/^(\d+(\.\d+)?)%-?(.*)$/);
            if (match) {
                const num = window.parseProgressValue(match[1]);
                const desc = match[3].trim();
                return desc ? `${num}% - ${desc}` : `${num}%`;
            }
            if (/^\d+(\.\d+)?$/.test(str)) return window.parseProgressValue(str) + '%';
            return str;
        });

        let qrLink = '';
        const fotoRaw = row[30] || '';
        if (fotoRaw) {
            try {
                const arr = JSON.parse(fotoRaw);
                if (Array.isArray(arr)) {
                    const found = arr.find(v => typeof v === 'string' && v.indexOf('http') === 0);
                    if (found) qrLink = found;
                }
            } catch (_) {
                const m = String(fotoRaw).match(/https?:\/\/\S+/);
                if (m) qrLink = m[0];
            }
        }
        const qrHtml = qrLink ? generateQrTableHtml(qrLink, 120, 33) : '';

        const rowCells = [
            idx + 1,
            row[0] || '-',
            row[1] || '-',
            row[2] || '-',
            row[3] || '-',
            statusLabel,
            totalKondisi + '%',
            row[31] ? (window.parseProgressValue(row[31]) + '%') : '-',
            ...physicalValues,
            row[28] || '-',
            row[29] || '-',
            row[4] || '-'
        ];

        html += '<tr>';
        rowCells.forEach(cell => { html += '<td>' + String(cell).replace(/\s+/g, ' ') + '</td>'; });
        if (qrHtml) {
            html += '<td>' + qrHtml + '<div>' + qrLink + '</div></td>';
        } else {
            html += '<td>-</td>';
        }
        html += '</tr>';
    });

    html += '</tbody></table></body></html>';
    const encodedUri = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kondisi_Kavling_${filterSuffix}_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                'Kondisi Baik (90%-100%)': 5,
                'Kondisi Butuh Renovasi Ringan (76%-89%)': 4,
                'Kondisi Butuh Renovasi Berat (50%-75%)': 3,
                'Kondisi Rusak Parah (19%-49%)': 2,
                'Kondisi dalam pembangunan / perlu bangun ulang (2%-18%)': 1,
                'Kondisi Tanah-Siap Bangun (0%-1%)': 0
            };
            const aLabel = getStatusLabelFromClass(getKondisiClass(window.parseProgressValue(a[27])));
            const bLabel = getStatusLabelFromClass(getKondisiClass(window.parseProgressValue(b[27])));
            const aVal = statusOrder[aLabel] ?? -1;
            const bVal = statusOrder[bLabel] ?? -1;
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        if (key === 'total') {
            const aVal = window.parseProgressValue(a[27]);
            const bVal = window.parseProgressValue(b[27]);
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        if (key === 'imb') {
            const aVal = (a[4] || '').toString().toLowerCase();
            const bVal = (b[4] || '').toString().toLowerCase();
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        if (key === 'skema') {
            const aVal = (a[28] || '').toString().toLowerCase();
            const bVal = (b[28] || '').toString().toLowerCase();
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        if (key === 'sertifikat') {
            const aVal = (a[29] || '').toString().toLowerCase();
            const bVal = (b[29] || '').toString().toLowerCase();
            if (aVal === bVal) return 0;
            return aVal > bVal ? dir : -dir;
        }
        return 0;
    });
    allKavlingData = sorted;
    applySearchAndFilter();
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
    currentEditIndex = index;
    const row = allKavlingData[index];
    if (!row) return;

    // Reset and Set Data
    document.getElementById('editOldBlok').value = row[0]; // BLOK LAMA (Hidden)
    document.getElementById('editBlok').value = row[0];    // BLOK (Bisa diubah)
    document.getElementById('editBlokTitle').innerText = row[0];
    document.getElementById('editLT').value = row[1];
    document.getElementById('editLB').value = row[2];
    document.getElementById('editType').value = row[3];

    const bentukSelect = document.getElementById('editStatusBentuk');
    if (bentukSelect) {
        const existingStatus = row[5] || '';
        if (existingStatus.includes('Tanah Kavling')) {
            bentukSelect.value = 'Tanah Kavling';
        } else if (existingStatus.includes('Rumah Kavling')) {
            bentukSelect.value = 'Rumah Kavling';
        } else {
            bentukSelect.value = 'Rumah Kavling';
        }
    }

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
        div.setAttribute('data-col-name', colName);
        
        if (isMeteran) {
            let selectedStatus = "Belum Ada";
            const textLower = (textVal || '').toLowerCase();
            if (textLower.includes("berfungsi")) selectedStatus = "Terpasang dan Berfungsi";
            else if (textLower.includes("rusak")) selectedStatus = "Terpasang dan Rusak";
            else if (textLower.includes("belum")) selectedStatus = "Belum Ada";
            else if (percentVal >= 95) selectedStatus = "Terpasang dan Berfungsi";
            else if (percentVal > 0 && percentVal <= 15) selectedStatus = "Terpasang dan Rusak";

            let meteranPercent = 0;
            if (selectedStatus === 'Terpasang dan Berfungsi') {
                meteranPercent = percentVal || 100;
            } else if (selectedStatus === 'Terpasang dan Rusak') {
                meteranPercent = percentVal || 10;
            } else if (selectedStatus === 'Belum Ada') {
                meteranPercent = 0;
            } else {
                meteranPercent = percentVal || 90;
            }

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
    const fotoRaw = row[30] || '';
    const fotoInput = document.getElementById('editFotoLink');
    if (fotoInput) {
        let displayValue = fotoRaw || '';
        if (fotoRaw) {
            try {
                const parsedForInput = JSON.parse(fotoRaw);
                if (Array.isArray(parsedForInput)) {
                    displayValue = parsedForInput.join(', ');
                }
            } catch (e) {
                displayValue = fotoRaw;
            }
        }
        fotoInput.value = displayValue;
    }
    handleFotoInputChange();
    renderPhotoGallery();
    updateAutoCalc(); // Hitung total awal

    if (typeof updatePhysicalSectionVisibility === 'function') {
        updatePhysicalSectionVisibility();
    }

    document.getElementById('editKavlingModal').style.display = 'flex';
}

function updatePhysicalSectionVisibility() {
    const bentukSelect = document.getElementById('editStatusBentuk');
    const physicalSection = document.getElementById('physicalSection');
    const isTanah = bentukSelect && bentukSelect.value === 'Tanah Kavling';

    if (physicalSection) {
        const rows = physicalSection.querySelectorAll('#physicalConditionInputs .physical-input-row');
        rows.forEach(row => {
            const colName = (row.getAttribute('data-col-name') || '').toUpperCase();
            const percentGroup = row.querySelector('.physical-percent');
            const descGroup = row.querySelector('.physical-desc');

            if (isTanah) {
                if (colName === 'KONDISI LAINNYA') {
                    row.style.display = '';
                    row.style.gridTemplateColumns = '1fr';
                    if (percentGroup) percentGroup.style.display = 'none';
                    if (descGroup) descGroup.style.gridColumn = '1 / -1';
                } else {
                    row.style.display = 'none';
                }
            } else {
                row.style.display = '';
                row.style.gridTemplateColumns = '';
                if (percentGroup) percentGroup.style.display = '';
                if (descGroup) descGroup.style.gridColumn = '';
            }
        });
    }

    const totalDisplay = document.getElementById('editTotalKondisiDisplay');
    const totalHidden = document.getElementById('editTotalKondisi');
    const statusLabel = document.getElementById('editStatusDisplay');

    if (isTanah) {
        if (totalDisplay) {
            totalDisplay.innerText = '0%';
            totalDisplay.classList.remove('total-kondisi-low', 'total-kondisi-medium', 'total-kondisi-high', 'total-kondisi-very-high');
        }
        if (totalHidden) totalHidden.value = '0%';
        if (statusLabel) {
            const statusClass = getKondisiClass(0);
            const labelText = getStatusLabelFromClass(statusClass);
            statusLabel.innerText = labelText;
            statusLabel.className = 'status-display-label status-tanah';
        }
    } else {
        if (typeof updateAutoCalc === 'function') {
            updateAutoCalc();
        }
    }
}

function updateAutoCalc() {
    let total = 0;
    const weightMap = {
        "KONDISI HALAMAN": 25 / 10,
        "CAT LUAR": 25 / 10,
        "CAT DALAM": 25 / 10,
        "STOP KONTAK": 25 / 10,
        "FITTING LAMPU": 25 / 10,
        "KELISTRIKAN": 25 / 10,
        "Meteran Listrik": 25 / 10,
        "Meteran PDAM": 25 / 10,
        "PIPA AIR BERSIH": 25 / 10,
        "KONDISI LAINNYA": 25 / 10,
        "PONDASI": 15 / 4,
        "KERAMIK LANTAI": 15 / 4,
        "TOILET": 15 / 4,
        "DAPUR": 15 / 4,
        "PLAFOND": 60 / 7,
        "RANGKA ATAP": 60 / 7,
        "GENTENG": 60 / 7,
        "KUSEN PINTU": 60 / 7,
        "DAUN PINTU": 60 / 7,
        "KUSEN JENDELA": 60 / 7,
        "DAUN JENDELA": 60 / 7
    };

    PHYSICAL_COLUMNS.forEach(colName => {
        const percentInput = document.querySelector(`#physicalConditionInputs [name="${colName}_percent"]`);
        const selectBox = document.querySelector(`#physicalConditionInputs select[name="${colName}"]`);
        const isMeteran = colName.toLowerCase() === 'meteran listrik' || colName.toLowerCase() === 'meteran pdam';
        const weight = weightMap[colName] || 0;

        if (isMeteran) {
            if (selectBox && percentInput) {
                const status = selectBox.value;
                let percent = 0;
                if (status === 'Terpasang dan Berfungsi') percent = 100;
                else if (status === 'Terpasang dan Rusak') percent = 10;
                else if (status === 'Belum Ada') percent = 0;
                else percent = 90;
                percentInput.value = percent;
                total += (percent / 100) * weight;
            }
        } else {
            if (percentInput) {
                const val = parseFloat(percentInput.value) || 0;
                total += (val / 100) * weight;
            }
        }
    });

    const clamped = Math.min(100, Math.max(0, total));
    const finalTotal = Math.round(clamped);
    const display = document.getElementById('editTotalKondisiDisplay');
    const hidden = document.getElementById('editTotalKondisi');
    
    if (display) {
        display.innerText = finalTotal + '%';
        display.classList.remove('total-kondisi-low', 'total-kondisi-medium', 'total-kondisi-high', 'total-kondisi-very-high');
    }
    if (hidden) hidden.value = finalTotal + '%';

    const statusLabel = document.getElementById('editStatusDisplay');
    if (statusLabel) {
        const statusClass = getKondisiClass(finalTotal);
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

function showDownloadMultiKavlingPopup() {
    var overlay = document.createElement('div');
    overlay.id = 'multiKavlingOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    var names = (allKavlingData || []).map(function(r){return String(r[0]||'').trim();}).filter(function(s){return s;});
    var html = ''
      + '<div style="background:#1e293b;border-radius:12px;padding:16px;max-width:520px;width:92%;color:#f1f5f9;box-shadow:0 20px 40px rgba(0,0,0,0.5);">'
      + '<h3 style="margin:0 0 10px 0;font-size:1rem;">Pilih Kavling untuk PDF (pisahkan dengan koma)</h3>'
      + '<div style="margin-bottom:8px;">'
      + '<input id="multiKavlingInput" type="text" placeholder="Contoh: UJ100_123, BTU_45" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;">'
      + '</div>'
      + '<div id="multiKavlingList" style="max-height:160px;overflow:auto;border:1px solid #334155;border-radius:8px;background:#0b1220;padding:6px;display:none;"></div>'
      + '<div style="display:flex;gap:8px;margin-top:12px;">'
      + '<button id="btnDownloadMulti" style="flex:1;background:#10b981;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer;">Download</button>'
      + '<button id="btnCancelMulti" style="flex:1;background:#475569;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer;">Batal</button>'
      + '</div>'
      + '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    var input = document.getElementById('multiKavlingInput');
    var list = document.getElementById('multiKavlingList');
    input.addEventListener('input', function(e){
        var term = String(e.target.value||'').split(',').pop().trim().toLowerCase();
        var filtered = names.filter(function(n){return n.toLowerCase().includes(term);}).slice(0,50);
        if (!term || filtered.length===0){list.style.display='none';list.innerHTML='';return;}
        list.innerHTML = filtered.map(function(n){
            return '<div class="opt" data-name="'+n+'" style="padding:6px;border-bottom:1px solid #1f2937;cursor:pointer;">'+n+'</div>';
        }).join('');
        list.style.display='block';
    });
    list.addEventListener('click', function(e){
        var el = e.target.closest('.opt');
        if (!el) return;
        var name = el.dataset.name;
        var cur = String(input.value||'');
        var parts = cur.split(',').map(function(s){return s.trim();}).filter(function(s){return s;});
        if (parts.length > 0) {
            parts[parts.length - 1] = name;
        } else {
            parts = [name];
        }
        var seen = {};
        var unique = parts.filter(function(s){
            if (seen[s]) return false;
            seen[s] = true;
            return true;
        });
        var next = unique.join(', ');
        if (next.length > 0) next += ', ';
        input.value = next;
        list.style.display='none';
        list.innerHTML='';
        input.focus();
    });
    document.getElementById('btnCancelMulti').onclick = function(){
        var ov = document.getElementById('multiKavlingOverlay');
        if (ov) ov.remove();
    };
    document.getElementById('btnDownloadMulti').onclick = function(){
        var cur = String(input.value||'');
        var parts = cur.split(',').map(function(s){return s.trim();}).filter(function(s){return s;});
        var names = (allKavlingData || []).map(function(r){return String(r[0]||'').trim();}).filter(function(s){return s;});
        var canon = {};
        names.forEach(function(n){ canon[n.toLowerCase()] = n; });
        var final = [];
        parts.forEach(function(s){
            var key = s.toLowerCase();
            if (canon[key]) final.push(canon[key]);
        });
        var seen = {};
        var unique = final.filter(function(s){
            if (seen[s]) return false;
            seen[s] = true;
            return true;
        });
        downloadMultiKavlingPdf(unique);
        var ov = document.getElementById('multiKavlingOverlay');
        if (ov) ov.remove();
    };
}

function downloadMultiKavlingPdf(kavlingNames) {
    if (!Array.isArray(kavlingNames) || kavlingNames.length===0) return;
    var byName = {};
    (allKavlingData||[]).forEach(function(row){var name=String(row[0]||'').trim();if(name)byName[name]=row;});
    var pages = kavlingNames.map(function(name){return byName[name];}).filter(function(r){return Array.isArray(r);});
    if (pages.length===0) return;
    var win = window.open('', '_blank');
    if (!win) return;
    var doc = win.document;
    var today = new Date();
    var dateStr = today.toLocaleDateString('id-ID');
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Multi Kavling</title>');
    doc.write('<style>');
    doc.write('body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111827;background:#ffffff;margin:0;padding:24px;}');
    doc.write('h1{font-size:14pt;margin:0 0 3px 0;text-align:center;text-transform:uppercase;letter-spacing:1px;}');
    doc.write('h2{font-size:11pt;margin:6px 0 4px 0;border-bottom:1px solid #e5e7eb;padding-bottom:3px;}');
    doc.write('.sub-title{text-align:center;font-size:9pt;color:#6b7280;margin-bottom:6px;}');
    doc.write('table{width:100%;border-collapse:collapse;margin-bottom:6px;}');
    doc.write('th,td{border:1px solid #d1d5db;padding:4px 6px;vertical-align:top;}');
    doc.write('th{background:#f3f4f6;font-weight:600;text-align:left;}');
    doc.write('.table-two-col th{width:30%;}');
    doc.write('.photo-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}');
    doc.write('.photo-grid-item{flex:0 0 44%;border:1px solid #d1d5db;border-radius:4px;overflow:hidden;text-align:center;padding:4px;box-sizing:border-box;}');
    doc.write('.photo-grid-item img{max-width:100%;height:auto;display:block;margin:0 auto 4px auto;}');
    doc.write('.photo-caption{font-size:8pt;color:#4b5563;word-break:break-all;}');
    doc.write('.top-grid{display:flex;gap:6px;align-items:flex-start;}');
    doc.write('.left-pane{flex:1 1 auto;}');
    doc.write('.right-pane{flex:0 0 220px;}');
    doc.write('.qr-large{border:1px solid #d1d5db;border-radius:4px;overflow:hidden;text-align:center;padding:4px;box-sizing:border-box;margin-bottom:6px;}');
    doc.write('.qr-large img{width:100%;height:auto;max-height:140px;object-fit:contain;display:block;margin:0 auto 3px auto;}');
    doc.write('@page{size:A4;margin:10mm 15mm 10mm 15mm;}');
    doc.write('.page{break-after:page;padding:24px;}');
    doc.write('</style></head><body>');
    pages.forEach(function(row, idx){
        var blokName = row[0]||'';
        var ltVal = row[1]||'';
        var lbVal = row[2]||'';
        var typeVal = row[3]||'';
        var totalNum = window.parseProgressValue(row[27]);
        var statusLabel = getStatusLabelFromClass(getKondisiClass(totalNum));
        var totalText = (totalNum||0)+'%';
        var bentukVal = 'Rumah Kavling';
        var fotoRaw = row[30]||'';
        var folderLink = '';
        var fileLinks = [];
        if (fotoRaw) {
            try {
                var arr = JSON.parse(fotoRaw);
                if (Array.isArray(arr)) {
                    arr.forEach(function(p){
                        var s=String(p||'');if(!s) return;
                        if (s.indexOf('https://drive.google.com/drive/')===0) folderLink=s;
                        else if (s.indexOf('http')===0 && s.indexOf('drive.google.com')!==-1) fileLinks.push(s);
                    });
                }
            } catch(e) {
                var parts = String(fotoRaw||'').split(/[\n,;]+/).map(function(p){return p.trim();}).filter(function(p){return p.length>0;});
                parts.forEach(function(s){
                    if (s.indexOf('https://drive.google.com/drive/')===0) folderLink=s;
                    else if (s.indexOf('http')===0 && s.indexOf('drive.google.com')!==-1) fileLinks.push(s);
                });
            }
        }
        doc.write('<div class="page">');
        doc.write('<h1>Laporan Kondisi Kavling</h1>');
        doc.write('<div class="sub-title">Tanggal cetak: '+dateStr+'</div>');
        doc.write('<div class="top-grid">');
        doc.write('<div class="left-pane">');
        doc.write('<h2>1. Data Utama</h2>');
        doc.write('<table class="table-two-col"><tbody>');
        doc.write('<tr><th>Nama Kavling / Blok</th><td>'+blokName+'</td></tr>');
        doc.write('<tr><th>LT (Luas Tanah)</th><td>'+(ltVal||'-')+'</td></tr>');
        doc.write('<tr><th>LB (Luas Bangunan)</th><td>'+(lbVal||'-')+'</td></tr>');
        doc.write('<tr><th>Type</th><td>'+(typeVal||'-')+'</td></tr>');
        doc.write('<tr><th>Status Bentuk Kavling</th><td>'+(bentukVal||'-')+'</td></tr>');
        doc.write('<tr><th>Total Kondisi</th><td>'+totalText+(statusLabel?(' ('+statusLabel+')'):'')+'</td></tr>');
        doc.write('</tbody></table>');
        doc.write('</div>');
        doc.write('<div class="right-pane">');
        doc.write('<h2>Foto Kondisi Kavling</h2>');
        if (!folderLink && fileLinks.length===0){
            doc.write('<div class="small-text">Belum ada link Google Drive yang tercantum untuk foto kondisi kavling.</div>');
        } else {
            var largeLink = folderLink || (fileLinks.length>0?fileLinks[0]:'');
            if (largeLink) {
            var largeQr = generateQrDataUrl(largeLink, 140);
                if (largeQr) {
                    doc.write('<div class="qr-large">');
                    doc.write('<img src="'+largeQr+'" alt="QR Besar">');
                    doc.write('<div class="photo-caption">'+(folderLink?'Folder Foto Google Drive':'Foto 1')+'</div>');
                    doc.write('</div>');
                }
                if (!folderLink && fileLinks.length>0) fileLinks.shift();
            }
            doc.write('<div class="photo-grid">');
            fileLinks.slice(0,3).forEach(function(link, j){
                var qrSmall = generateQrDataUrl(link, 130);
                if (!qrSmall) return;
                var n = folderLink ? (j+1) : (j+2);
                doc.write('<div class="photo-grid-item">');
                doc.write('<img src="'+qrSmall+'" alt="QR Foto '+n+'">');
                doc.write('<div class="photo-caption">Foto '+n+'</div>');
                doc.write('</div>');
            });
            doc.write('</div>');
        }
        doc.write('</div>');
        doc.write('</div>');
        doc.write('<h2>2. Kondisi Fisik</h2>');
        doc.write('<table><thead><tr><th>Komponen</th><th>Perkiraan Kondisi</th><th>Keterangan</th></tr></thead><tbody>');
        PHYSICAL_COLUMNS.forEach(function(colName, index){
            var raw = String(row[index+6]||'').trim();
            var percentText = '-';
            var descText = '-';
            var m = raw.match(/^(\d+(\.\d+)?)%-?(.*)$/);
            if (m) {
                percentText = m[1]+'%';
                descText = m[3]?String(m[3]).trim():'-';
            } else if (raw) {
                var p = parseFloat(raw);
                if (!isNaN(p)) percentText = window.parseProgressValue(p)+'%';
                else descText = raw;
            }
            doc.write('<tr>');
            doc.write('<td>'+colName+'</td>');
            doc.write('<td>'+percentText+'</td>');
            doc.write('<td>'+descText+'</td>');
            doc.write('</tr>');
        });
        doc.write('</tbody></table>');
        doc.write('</div>');
    });
    doc.write('<script>window.addEventListener(\"load\",function(){setTimeout(function(){try{window.print();}catch(e){}},300);window.onafterprint=function(){try{window.close();}catch(e){}}});</script>');
    doc.write('</body></html>');
    doc.close();
    try{win.focus();}catch(e){}
}
function downloadVisibleKavlingsPdf() {
    const pages = filteredKavlingData || [];
    if (!Array.isArray(pages) || pages.length === 0) return;
    var win = window.open('', '_blank');
    if (!win) return;
    var doc = win.document;
    var today = new Date();
    var dateStr = today.toLocaleDateString('id-ID');
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Multi Kavling</title>');
    doc.write('<style>');
    doc.write('body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111827;background:#ffffff;margin:0;padding:24px;}');
    doc.write('h1{font-size:14pt;margin:0 0 3px 0;text-align:center;text-transform:uppercase;letter-spacing:1px;}');
    doc.write('h2{font-size:11pt;margin:6px 0 4px 0;border-bottom:1px solid #e5e7eb;padding-bottom:3px;}');
    doc.write('.sub-title{text-align:center;font-size:9pt;color:#6b7280;margin-bottom:6px;}');
    doc.write('table{width:100%;border-collapse:collapse;margin-bottom:6px;}');
    doc.write('th,td{border:1px solid #d1d5db;padding:4px 6px;vertical-align:top;}');
    doc.write('th{background:#f3f4f6;font-weight:600;text-align:left;}');
    doc.write('.table-two-col th{width:30%;}');
    doc.write('.photo-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}');
    doc.write('.photo-grid-item{flex:0 0 44%;border:1px solid #d1d5db;border-radius:4px;overflow:hidden;text-align:center;padding:4px;box-sizing:border-box;}');
    doc.write('.photo-grid-item img{max-width:100%;height:auto;display:block;margin:0 auto 4px auto;}');
    doc.write('.photo-caption{font-size:8pt;color:#4b5563;word-break:break-all;}');
    doc.write('.top-grid{display:flex;gap:6px;align-items:flex-start;}');
    doc.write('.left-pane{flex:1 1 auto;}');
    doc.write('.right-pane{flex:0 0 220px;}');
    doc.write('.qr-large{border:1px solid #d1d5db;border-radius:4px;overflow:hidden;text-align:center;padding:4px;box-sizing:border-box;margin-bottom:6px;}');
    doc.write('.qr-large img{width:100%;height:auto;max-height:140px;object-fit:contain;display:block;margin:0 auto 3px auto;}');
    doc.write('@page{size:A4;margin:10mm 15mm 10mm 15mm;}');
    doc.write('.page{break-after:page;padding:24px;}');
    doc.write('</style></head><body>');
    pages.forEach(function(row){
        var blokName = row[0]||'';
        var ltVal = row[1]||'';
        var lbVal = row[2]||'';
        var typeVal = row[3]||'';
        var totalNum = window.parseProgressValue(row[27]);
        var statusLabel = getStatusLabelFromClass(getKondisiClass(totalNum));
        var totalText = (totalNum||0)+'%';
        var bentukVal = 'Rumah Kavling';
        var fotoRaw = row[30]||'';
        var folderLink = '';
        var fileLinks = [];
        if (fotoRaw) {
            try {
                var arr = JSON.parse(fotoRaw);
                if (Array.isArray(arr)) {
                    arr.forEach(function(p){
                        var s=String(p||'');if(!s) return;
                        if (s.indexOf('https://drive.google.com/drive/')===0) folderLink=s;
                        else if (s.indexOf('http')===0 && s.indexOf('drive.google.com')!==-1) fileLinks.push(s);
                    });
                }
            } catch(e) {
                var parts = String(fotoRaw||'').split(/[\n,;]+/).map(function(p){return p.trim();}).filter(function(p){return p.length>0;});
                parts.forEach(function(s){
                    if (s.indexOf('https://drive.google.com/drive/')===0) folderLink=s;
                    else if (s.indexOf('http')===0 && s.indexOf('drive.google.com')!==-1) fileLinks.push(s);
                });
            }
        }
        doc.write('<div class="page">');
        doc.write('<h1>Laporan Kondisi Kavling</h1>');
        doc.write('<div class="sub-title">Tanggal cetak: '+dateStr+'</div>');
        doc.write('<div class="top-grid">');
        doc.write('<div class="left-pane">');
        doc.write('<h2>1. Data Utama</h2>');
        doc.write('<table class="table-two-col"><tbody>');
        doc.write('<tr><th>Nama Kavling / Blok</th><td>'+blokName+'</td></tr>');
        doc.write('<tr><th>LT (Luas Tanah)</th><td>'+(ltVal||'-')+'</td></tr>');
        doc.write('<tr><th>LB (Luas Bangunan)</th><td>'+(lbVal||'-')+'</td></tr>');
        doc.write('<tr><th>Type</th><td>'+(typeVal||'-')+'</td></tr>');
        doc.write('<tr><th>Status Bentuk Kavling</th><td>'+(bentukVal||'-')+'</td></tr>');
        doc.write('<tr><th>Total Kondisi</th><td>'+totalText+(statusLabel?(' ('+statusLabel+')'):'')+'</td></tr>');
        doc.write('</tbody></table>');
        doc.write('</div>');
        doc.write('<div class="right-pane">');
        doc.write('<h2>Foto Kondisi Kavling</h2>');
        if (!folderLink && fileLinks.length===0){
            doc.write('<div class="small-text">Belum ada link Google Drive yang tercantum untuk foto kondisi kavling.</div>');
        } else {
            doc.write('<div class="small-text">Data Foto & Video Lokasi</div>');
            var largeLink = folderLink || (fileLinks.length>0?fileLinks[0]:'');
            if (largeLink) {
                var largeQr = generateQrDataUrl(largeLink, 140);
                if (largeQr) {
                    doc.write('<div class="qr-large">');
                    doc.write('<img src="'+largeQr+'" alt="QR Besar">');
                    doc.write('<div class="photo-caption">'+(folderLink?'Folder Foto Google Drive':'Foto 1')+'</div>');
                    doc.write('</div>');
                }
                if (!folderLink && fileLinks.length>0) fileLinks.shift();
            }
            doc.write('<div class="photo-grid">');
            fileLinks.slice(0,3).forEach(function(link, j){
                var qrSmall = generateQrDataUrl(link, 130);
                if (!qrSmall) return;
                var n = folderLink ? (j+1) : (j+2);
                doc.write('<div class="photo-grid-item">');
                doc.write('<img src="'+qrSmall+'" alt="QR Foto '+n+'">');
                doc.write('<div class="photo-caption">Foto '+n+'</div>');
                doc.write('</div>');
            });
            doc.write('</div>');
        }
        doc.write('</div>');
        doc.write('</div>');
        doc.write('<h2>2. Kondisi Fisik</h2>');
        doc.write('<table><thead><tr><th>Komponen</th><th>Perkiraan Kondisi</th><th>Keterangan</th></tr></thead><tbody>');
        PHYSICAL_COLUMNS.forEach(function(colName, index){
            var raw = String(row[index+6]||'').trim();
            var percentText = '-';
            var descText = '-';
            var m = raw.match(/^(\d+(\.\d+)?)%-?(.*)$/);
            if (m) {
                percentText = m[1]+'%';
                descText = m[3]?String(m[3]).trim():'-';
            } else if (raw) {
                var p = parseFloat(raw);
                if (!isNaN(p)) percentText = window.parseProgressValue(p)+'%';
                else descText = raw;
            }
            doc.write('<tr>');
            doc.write('<td>'+colName+'</td>');
            doc.write('<td>'+percentText+'</td>');
            doc.write('<td>'+descText+'</td>');
            doc.write('</tr>');
        });
        doc.write('</tbody></table>');
        doc.write('</div>');
    });
    doc.write('</body></html>');
    doc.close();
    try{win.focus();}catch(e){}
}
function renderPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    if (!currentEditPhotos || currentEditPhotos.length === 0) return;

    currentEditPhotos.forEach((src, index) => {
        if (!src) return;
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `
            <img src="${src}" alt="Foto ${index + 1}" onclick="openFullscreenImage('${src.replace(/"/g, '&quot;')}')">
        `;
        gallery.appendChild(div);
    });
}

function updateInlineQrPreview(link) {
    const box = document.getElementById('fotoQrBox');
    const placeholder = document.getElementById('fotoQrPlaceholder');
    const img = document.getElementById('fotoQrImage');
    if (!box || !placeholder || !img) return;
    if (!link || !window.QRious) {
        box.classList.remove('has-link');
        box.dataset.link = '';
        img.style.display = 'none';
        img.src = '';
        placeholder.style.display = 'block';
        return;
    }
    const dataUrl = generateQrDataUrl(link, 140);
    if (!dataUrl) {
        box.classList.remove('has-link');
        box.dataset.link = '';
        img.style.display = 'none';
        img.src = '';
        placeholder.style.display = 'block';
        return;
    }
    placeholder.style.display = 'none';
    img.src = dataUrl;
    img.style.display = 'block';
    box.classList.add('has-link');
    box.dataset.link = link;
}

function openFotoQrLink() {
    const box = document.getElementById('fotoQrBox');
    if (!box) return;
    const link = box.dataset.link;
    if (!link) return;
    try {
        window.open(link, '_blank', 'noopener');
    } catch (e) {
    }
}

function handleFotoInputChange() {
    const input = document.getElementById('editFotoLink');
    const container = document.getElementById('folderPhotoInlineContainer');
    const loading = document.getElementById('folderPhotoLoading');
    const frameWrapper = document.getElementById('folderPhotoFrameWrapper');
    const frame = document.getElementById('folderPhotoFrame');
    if (!input || !container || !loading || !frameWrapper || !frame) return;
    const raw = input.value.trim();
    currentEditPhotos = [];
    if (!raw) {
        container.style.display = 'none';
        loading.style.display = 'none';
        frameWrapper.style.display = 'none';
        frame.src = '';
        lastFolderEmbedSrc = '';
        updateInlineQrPreview('');
        return;
    }
    const parts = raw.split(/[\n,;]+/).map(p => p.trim()).filter(Boolean);

    const folderParts = parts.filter(p => p.startsWith('https://drive.google.com/drive/'));
    let folderLink = '';
    if (folderParts.length > 0) {
        const firstUrl = folderParts[0];
        folderLink = firstUrl;
        const folderId = getDriveFolderIdFromUrl(firstUrl);
        if (folderId) {
            const embedUrl = 'https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(folderId) + '#grid';
            container.style.display = 'block';
            if (embedUrl === lastFolderEmbedSrc && frame.src === embedUrl) {
                loading.style.display = 'none';
                frameWrapper.style.display = 'block';
            } else {
                lastFolderEmbedSrc = embedUrl;
                loading.style.display = 'flex';
                frameWrapper.style.display = 'block';
                frame.onload = function () {
                    loading.style.display = 'none';
                    frameWrapper.style.display = 'block';
                };
                frame.src = embedUrl;
            }
        } else {
            container.style.display = 'none';
            loading.style.display = 'none';
            frameWrapper.style.display = 'none';
            frame.src = '';
            lastFolderEmbedSrc = '';
        }
    } else {
        container.style.display = 'none';
        loading.style.display = 'none';
        frameWrapper.style.display = 'none';
        frame.src = '';
        lastFolderEmbedSrc = '';
    }

    const fileLinks = parts.filter(p => p.startsWith('https://drive.google.com/file/') || p.includes('id='));
    const fileSrcs = [];
    fileLinks.forEach(link => {
        const fileId = getDriveFileIdFromUrl(link);
        if (fileId) {
            const imgUrl = 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(fileId);
            fileSrcs.push(imgUrl);
        }
    });
    currentEditPhotos = fileSrcs;
    renderPhotoGallery();

    let qrTarget = '';
    if (folderLink) {
        qrTarget = folderLink;
    } else if (fileLinks.length > 0) {
        qrTarget = fileLinks[0];
    }
    updateInlineQrPreview(qrTarget);
}

function getDriveFolderIdFromUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        const path = u.pathname || '';
        const matchFolders = path.match(/\/folders\/([^/]+)/);
        if (matchFolders && matchFolders[1]) {
            return matchFolders[1];
        }
        const idParam = u.searchParams.get('id');
        if (idParam) return idParam;
        return null;
    } catch (e) {
        return null;
    }
}

function getDriveFileIdFromUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        const path = u.pathname || '';
        const matchFile = path.match(/\/file\/d\/([^/]+)/);
        if (matchFile && matchFile[1]) {
            return matchFile[1];
        }
        const idParam = u.searchParams.get('id');
        if (idParam) return idParam;
        return null;
    } catch (e) {
        return null;
    }
}

function generateQrDataUrl(text, size) {
    if (!window.QRious || !text) return '';
    var canvas = document.createElement('canvas');
    var qr = new QRious({
        element: canvas,
        value: text,
        size: size || 180,
        level: 'L'
    });
    return canvas.toDataURL('image/png');
}

function generateQrTableHtml(text, size, cells) {
    if (!window.QRious || !text) return '';
    var canvas = document.createElement('canvas');
    var qr = new QRious({
        element: canvas,
        value: text,
        size: size || 120,
        level: 'L'
    });
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var n = cells || 33;
    var step = Math.floor(Math.min(w, h) / n);
    var html = '<table style="border-collapse:collapse"><tbody>';
    for (var y = 0; y < n; y++) {
        html += '<tr>';
        for (var x = 0; x < n; x++) {
            var sx = x * step + Math.floor(step / 2);
            var sy = y * step + Math.floor(step / 2);
            var d = ctx.getImageData(sx, sy, 1, 1).data;
            var v = (d[0] + d[1] + d[2]) / 3 < 128 ? '#000' : '#fff';
            html += '<td style="width:3px;height:3px;background:' + v + '"></td>';
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

function downloadKavlingPdf() {
    const blokInput = document.getElementById('editBlok');
    const oldBlokInput = document.getElementById('editOldBlok');
    const ltInput = document.getElementById('editLT');
    const lbInput = document.getElementById('editLB');
    const typeInput = document.getElementById('editType');
    const bentukSelect = document.getElementById('editStatusBentuk');
    const totalDisplay = document.getElementById('editTotalKondisiDisplay');
    const statusDisplay = document.getElementById('editStatusDisplay');
    const physicalContainer = document.getElementById('physicalConditionInputs');
    if (!blokInput && !oldBlokInput) return;
    if (!physicalContainer) return;
    const blokName = (blokInput && blokInput.value) || (oldBlokInput && oldBlokInput.value) || 'Kavling';
    const ltVal = ltInput ? ltInput.value : '';
    const lbVal = lbInput ? lbInput.value : '';
    const typeVal = typeInput ? typeInput.value : '';
    const bentukVal = bentukSelect ? bentukSelect.value : '';
    const totalText = totalDisplay ? totalDisplay.innerText : '';
    const statusText = statusDisplay ? statusDisplay.innerText : '';
    const physicalRows = [];
    PHYSICAL_COLUMNS.forEach(function (colName) {
        const rowEl = physicalContainer.querySelector('.physical-input-row[data-col-name="' + colName + '"]');
        if (!rowEl) return;
        let percentVal = '';
        let descVal = '';
        const percentInput = rowEl.querySelector('input[name="' + colName + '_percent"]');
        if (percentInput) percentVal = percentInput.value || '';
        const selectBox = rowEl.querySelector('select[name="' + colName + '"]');
        const textInput = rowEl.querySelector('input[name="' + colName + '"]');
        if (selectBox) {
            descVal = selectBox.value || '';
        } else if (textInput) {
            descVal = textInput.value || '';
        }
        physicalRows.push({
            label: colName,
            percent: percentVal,
            desc: descVal
        });
    });
    const fotoInput = document.getElementById('editFotoLink');
    const rawFoto = fotoInput ? fotoInput.value.trim() : '';
    let folderLink = '';
    const fileLinks = [];
    if (rawFoto) {
        const parts = rawFoto.split(/[\n,;]+/).map(function (p) { return p.trim(); }).filter(function (p) { return p.length > 0; });
        const folderParts = parts.filter(function (p) {
            return p.indexOf('https://drive.google.com/drive/') === 0;
        });
        if (folderParts.length > 0) {
            folderLink = folderParts[0];
        }
        parts.forEach(function (p) {
            if (folderLink && p === folderLink) return;
            if (p.indexOf('http') === 0 && p.indexOf('drive.google.com') !== -1) {
                fileLinks.push(p);
            }
        });
    }
    const win = window.open('', '_blank');
    if (!win) return;
    const doc = win.document;
    const title = 'Laporan Kondisi Kavling ' + blokName;
    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID');
    try {
        const pathName = 'laporan_kondisi_kavling_' + encodeURIComponent(blokName);
        if (win.history && win.history.replaceState) {
            win.history.replaceState({}, title, pathName);
        }
    } catch (e) {
    }
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>');
    doc.write('<style>');
    doc.write('body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111827;background:#ffffff;margin:0;padding:24px;}');
    doc.write('h1{font-size:14pt;margin:0 0 3px 0;text-align:center;text-transform:uppercase;letter-spacing:1px;}');
    doc.write('h2{font-size:11pt;margin:6px 0 4px 0;border-bottom:1px solid #e5e7eb;padding-bottom:3px;}');
    doc.write('h3{font-size:11pt;margin:12px 0 6px 0;}');
    doc.write('.sub-title{text-align:center;font-size:9pt;color:#6b7280;margin-bottom:4px;}');
    doc.write('table{width:100%;border-collapse:collapse;margin-bottom:4px;}');
    doc.write('th,td{border:1px solid #d1d5db;padding:4px 6px;vertical-align:top;}');
    doc.write('th{background:#f3f4f6;font-weight:600;text-align:left;}');
    doc.write('.table-two-col th{width:30%;}');
    doc.write('.small-text{font-size:9pt;color:#6b7280;}');
    doc.write('.photo-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}');
    doc.write('.photo-grid-item{flex:0 0 44%;border:1px solid #d1d5db;border-radius:4px;overflow:hidden;text-align:center;padding:4px;box-sizing:border-box;}');
    doc.write('.photo-grid-item img{max-width:100%;height:auto;display:block;margin:0 auto 4px auto;}');
    doc.write('.photo-caption{font-size:8pt;color:#4b5563;word-break:break-all;}');
    doc.write('.top-grid{display:flex;gap:6px;align-items:flex-start;}');
    doc.write('.left-pane{flex:1 1 auto;}');
    doc.write('.right-pane{flex:0 0 220px;}');
    doc.write('.qr-large{border:1px solid #d1d5db;border-radius:4px;overflow:hidden;text-align:center;padding:4px;box-sizing:border-box;margin-bottom:6px;}');
    doc.write('.qr-large img{width:100%;height:auto;max-height:140px;object-fit:contain;display:block;margin:0 auto 3px auto;}');
    doc.write('@page{size:A4;margin:20mm 15mm 20mm 15mm;}');
    doc.write('@media print{button{display:none;}}');
    doc.write('</style>');
    doc.write('</head><body>');
    doc.write('<h1>Laporan Kondisi Kavling</h1>');
    doc.write('<div class="sub-title">Tanggal cetak: ' + dateStr + '</div>');
    doc.write('<div class="top-grid">');
    doc.write('<div class="left-pane">');
    doc.write('<h2>1. Data Utama</h2>');
    doc.write('<table class="table-two-col"><tbody>');
    doc.write('<tr><th>Nama Kavling / Blok</th><td>' + blokName + '</td></tr>');
    doc.write('<tr><th>LT (Luas Tanah)</th><td>' + (ltVal || '-') + '</td></tr>');
    doc.write('<tr><th>LB (Luas Bangunan)</th><td>' + (lbVal || '-') + '</td></tr>');
    doc.write('<tr><th>Type</th><td>' + (typeVal || '-') + '</td></tr>');
    doc.write('<tr><th>Status Bentuk Kavling</th><td>' + (bentukVal || '-') + '</td></tr>');
    doc.write('<tr><th>Total Kondisi</th><td>' + (totalText || '-') + (statusText ? ' (' + statusText + ')' : '') + '</td></tr>');
    doc.write('</tbody></table>');
    doc.write('</div>');
    doc.write('<div class="right-pane">');
    doc.write('<h2>Foto Kondisi Kavling</h2>');
    if (!folderLink && fileLinks.length === 0) {
        doc.write('<div class="small-text">Belum ada link Google Drive yang tercantum untuk foto kondisi kavling.</div>');
    } else {
        var largeLink = folderLink || (fileLinks.length > 0 ? fileLinks[0] : '');
        if (largeLink) {
            var largeQrSize = 140;
            var largeQr = generateQrDataUrl(largeLink, largeQrSize);
            if (largeQr) {
                doc.write('<div class="qr-large">');
                doc.write('<img src="' + largeQr + '" alt="QR Besar">');
                doc.write('<div class="photo-caption">' + (folderLink ? 'Folder Foto Google Drive' : 'Foto 1') + '</div>');
                doc.write('</div>');
            }
            if (!folderLink && fileLinks.length > 0) {
                fileLinks.shift();
            }
        }
        doc.write('<div class="photo-grid">');
        var maxFileQr = 3;
        fileLinks.slice(0, maxFileQr).forEach(function (link, idx) {
            var qrUrl = generateQrDataUrl(link, 130);
            if (!qrUrl) return;
            var n = idx + 1;
            if (!folderLink) n = idx + 2;
            doc.write('<div class="photo-grid-item">');
            doc.write('<img src="' + qrUrl + '" alt="QR Foto ' + n + '">');
            doc.write('<div class="photo-caption">Foto ' + n + '</div>');
            doc.write('</div>');
        });
        doc.write('</div>');
        if (fileLinks.length > 0) {
            doc.write('<div class="small-text">Daftar link file foto:</div>');
            doc.write('<div class="small-text">');
            fileLinks.slice(0, 6).forEach(function (link, idx) {
                doc.write('Foto ' + (idx + 1) + ': ' + link + '<br>');
            });
            if (fileLinks.length > 6) {
                doc.write('Dan ' + (fileLinks.length - 6) + ' link lainnya...');
            }
            doc.write('</div>');
        }
    }
    doc.write('</div>');
    doc.write('</div>');
    doc.write('<h2>2. Kondisi Fisik</h2>');
    doc.write('<table><thead><tr><th>Komponen</th><th>Perkiraan Kondisi</th><th>Keterangan</th></tr></thead><tbody>');
    physicalRows.forEach(function (row) {
        const percentText = row.percent ? row.percent + '%' : '-';
        const descText = row.desc || '-';
        doc.write('<tr>');
        doc.write('<td>' + row.label + '</td>');
        doc.write('<td>' + percentText + '</td>');
        doc.write('<td>' + descText + '</td>');
        doc.write('</tr>');
    });
    doc.write('</tbody></table>');
    doc.write('<div style="position:fixed;bottom:8mm;right:15mm;font-size:8pt;color:#9ca3af;">Kode Kavling: ' + blokName + '</div>');
    doc.write('<script>(function(){setTimeout(function(){var lp=document.querySelector(\".left-pane .table-two-col\");var rp=document.querySelector(\".right-pane\");var img=document.querySelector(\".qr-large img\");if(lp&&rp&&img){var h=lp.offsetHeight;var vw=window.innerWidth||document.documentElement.clientWidth||rp.clientWidth;var maxSide=Math.min(h, Math.floor(vw*0.35));var side=Math.max(120, maxSide);rp.style.flex=\"0 0 \"+side+\"px\";img.style.width=side+\"px\";img.style.height=side+\"px\";img.style.maxWidth=side+\"px\";img.style.maxHeight=side+\"px\";}},50);}());</script>');
    doc.write('</body></html>');
    doc.close();
    try {
        win.focus();
    } catch (e) {
    }
}

function openFullscreenImage(src) {
    const modal = document.getElementById('fullscreenImageModal');
    const img = document.getElementById('fullscreenImage');
    if (!modal || !img) return;
    img.src = src;
    modal.style.display = 'flex';
}

function closeFullscreenImage() {
    const modal = document.getElementById('fullscreenImageModal');
    const img = document.getElementById('fullscreenImage');
    if (modal) modal.style.display = 'none';
    if (img) img.src = '';
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
    const bentukSelect = document.getElementById('editStatusBentuk');
    const bentukVal = bentukSelect ? bentukSelect.value : 'Rumah Kavling';

    if (bentukSelect && !bentukVal) {
        alert('Status Bentuk Kavling wajib diisi.');
        return;
    }
    const updateData = {
        oldBlok: oldBlok,
        blok: newBlok,
        "LT": document.getElementById('editLT').value,
        "LB": document.getElementById('editLB').value,
        "Type": document.getElementById('editType').value
    };

    // Collect physical conditions
    let emptyFields = [];
    if (bentukVal === 'Tanah Kavling') {
        PHYSICAL_COLUMNS.forEach(colName => {
            if (colName === 'KONDISI LAINNYA') {
                const textInput = document.querySelector(`#physicalConditionInputs input[name="${colName}"]`);
                const textVal = textInput ? textInput.value.trim() : '';
                updateData[colName] = textVal || '-';
            } else {
                updateData[colName] = '-';
            }
        });
    } else {
        PHYSICAL_COLUMNS.forEach(colName => {
            const textInput = document.querySelector(`#physicalConditionInputs input[name="${colName}"]`);
            const percentInput = document.querySelector(`#physicalConditionInputs input[name="${colName}_percent"]`);
            const selectBox = document.querySelector(`#physicalConditionInputs select[name="${colName}"]`);
            
            if (textInput && percentInput) {
                const textVal = textInput.value.trim();
                const percentVal = window.parseProgressValue(percentInput.value);
                
                if (percentVal < 100 && !textVal) {
                    emptyFields.push(colName);
                    textInput.style.borderColor = '#ef4444';
                } else {
                    textInput.style.borderColor = '';
                }

                if (textVal) {
                    updateData[colName] = `${percentVal}%-${textVal}`;
                } else {
                    updateData[colName] = `${percentVal}%`;
                }
            } else if (selectBox && percentInput) {
                const textVal = selectBox.value;
                const percentVal = percentInput.value || 0;
                updateData[colName] = `${percentVal}%-${textVal}`;
            }
        });
    }

    let totalKondisiValue;
    let totalNumeric;
    if (bentukVal === 'Tanah Kavling') {
        totalKondisiValue = '0%';
        totalNumeric = 0;
    } else {
        totalKondisiValue = document.getElementById('editTotalKondisi').value;
        totalNumeric = window.parseProgressValue(totalKondisiValue);
    }
    updateData["Total Kondisi"] = totalKondisiValue;
    const kondisiClass = getKondisiClass(totalNumeric);
    const statusLabel = getStatusLabelFromClass(kondisiClass);
    const bentukLabel = bentukVal || 'Rumah Kavling';
    updateData["Status"] = `${bentukLabel} - ${statusLabel}`;

    const fotoInput = document.getElementById('editFotoLink');
    if (fotoInput) {
        const fotoValue = fotoInput.value.trim();
        updateData["FOTO FOTO"] = fotoValue;
    }

    try {
        const url = window.PROGRESS_APPS_SCRIPT_URL;
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
            const blokName = newBlok || oldBlok || '';
            alert(`Data "${blokName}" sudah disimpan`);
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

            applySearchAndFilter();
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
        // Debouncing logic
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            applySearchAndFilter();
        }, 300); // 300ms delay
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const passInput = document.getElementById('passInput');
    const path = (window.location.pathname || '').toLowerCase();
    const isLaporan = path.includes('laporan_kondisi');
    const isInventaris = path.includes('inventaris');

    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') checkPass();
        });
    } else {
        if (isInventaris) {
            (async () => {
                await loadMasterKavlingList();
                await loadInventarisData();
            })();
        } else if (isLaporan) {
            loadInventarisData();
        }
    }

    setupFilters();
    setupSearch();
    setupStokToggle();
    setupTablePanScroll();
    ensureFilterBaseLabels();
    updateFilterCounts();
});

function logout() {
    window.location.href = 'index.html';
}

function getActiveFilterValue() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return 'all';
    return activeBtn.getAttribute('data-filter') || 'all';
}

function applySearchAndFilter() {
    const input = document.querySelector('.search-input');
    const termRaw = input ? input.value : '';
    const term = String(termRaw || '').trim().toUpperCase();
    const filterVal = getActiveFilterValue();
    const stokToggle = document.getElementById('stokOnlyToggle');
    const stokOnly = !!(stokToggle && stokToggle.checked);
    
    // Filter data array, bukan DOM
    filteredKavlingData = allKavlingData.filter(row => {
        // Blok (index 0)
        const blokText = String(row[0] || '').trim().toUpperCase();
        const prefixMatch = term ? blokText.startsWith(term) : true;
        
        // Kondisi (index 27)
        const totalKondisi = window.parseProgressValue(row[27]);
        const kondisi = getKondisiClass(totalKondisi);
        const filterMatch = filterVal === 'all' ? true : kondisi === filterVal;
        const skemaText = String(row[28] || '').trim().toUpperCase();
        const stokMatch = stokOnly ? skemaText.includes('STOK') : true;
        
        return prefixMatch && filterMatch && stokMatch;
    });

    // Reset ke halaman 1 saat filter berubah
    currentPage = 1;
    renderTable(filteredKavlingData);
    updateFilterCounts();
}

function setupStokToggle() {
    const toggle = document.getElementById('stokOnlyToggle');
    if (!toggle) return;
    if (toggle.dataset.bound) return;
    toggle.dataset.bound = 'true';
    toggle.addEventListener('change', function(){
        if (toggle.checked) {
            sortInventarisBy('skema');
        } else {
            applySearchAndFilter();
        }
    });
}

function ensureFilterBaseLabels() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        if (!btn.getAttribute('data-base-label')) {
            const base = (btn.textContent || '').trim();
            btn.setAttribute('data-base-label', base);
        }
    });
}

function updateFilterCounts() {
    const path = (window.location.pathname || '').toLowerCase();
    const isLaporan = path.includes('laporan_kondisi');
    const btns = document.querySelectorAll('.filter-btn');
    if (!isLaporan || btns.length === 0) return;
    
    const input = document.querySelector('.search-input');
    const termRaw = input ? input.value : '';
    const term = String(termRaw || '').trim().toUpperCase();
    
    const countMap = {
        all: 0,
        layak: 0,
        'renov-ringan': 0,
        'renov-banyak': 0,
        rusak: 0,
        'tidak-layak': 0,
        tanah: 0
    };

    allKavlingData.forEach(row => {
        const blokText = String(row[0] || '').trim().toUpperCase();
        const prefixMatch = term ? blokText.startsWith(term) : true;
        if (!prefixMatch) return;

        const totalKondisi = window.parseProgressValue(row[27]);
        const kondisi = getKondisiClass(totalKondisi);
        
        countMap.all += 1;
        if (countMap.hasOwnProperty(kondisi)) {
            countMap[kondisi] += 1;
        }
    });

    btns.forEach(btn => {
        const base = btn.getAttribute('data-base-label') || (btn.textContent || '').trim();
        const key = btn.getAttribute('data-filter') || 'all';
        const val = countMap.hasOwnProperty(key) ? countMap[key] : countMap.all;
        btn.innerHTML = `${base} (${val})`;
    });
}

function showDownloadChoiceModal() {
    const modal = document.getElementById('downloadChoiceModal');
    if (modal) modal.style.display = 'flex';
}

function closeDownloadChoiceModal() {
    const modal = document.getElementById('downloadChoiceModal');
    if (modal) modal.style.display = 'none';
}

function downloadSuratPengecekanPDF() {
    closeDownloadChoiceModal();
    downloadSuratPengecekan();
}

async function downloadSuratPengecekanExcel() {
    const data = filteredKavlingData;
    if (data.length === 0) {
        alert("Tidak ada data untuk didownload");
        return;
    }
    
    closeDownloadChoiceModal();

    if (!window.ExcelJS) {
        alert("Library ExcelJS tidak ditemukan.");
        return;
    }

    try {
        const wb = new window.ExcelJS.Workbook();
        const ws = wb.addWorksheet('Surat Pengecekan');
        
        // Define Headers
        const headers = ['No', 'Nama Blok', 'LT', 'LB', 'Type', '% Pelaksana'];
        PHYSICAL_COLUMNS.forEach(col => headers.push(col));
        
        ws.columns = headers.map((h, i) => ({ 
            header: h, 
            key: h, 
            width: i < 6 ? 15 : 8 
        }));

        // Styling Header
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };

        // Add Data Rows
        data.forEach((row, idx) => {
            const rowData = {
                'No': idx + 1,
                'Nama Blok': row[0] || '',
                'LT': row[1] || '',
                'LB': row[2] || '',
                'Type': row[3] || '',
                '% Pelaksana': row[31] ? (window.parseProgressValue(row[31]) + '%') : '-'
            };
            
            // Physical columns are empty for "Surat Pengecekan" (manual check)
            PHYSICAL_COLUMNS.forEach(col => {
                rowData[col] = ''; 
            });
            
            ws.addRow(rowData);
        });

        // Add borders to all cells
        ws.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Write to buffer and download
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `Surat_Pengecekan_Kavling_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error generating Excel:', error);
        alert('Gagal membuat file Excel: ' + error.message);
    }
}

function downloadSuratPengecekan() {
    const data = filteredKavlingData;
    if (data.length === 0) return;
    const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const win = window.open('', '_blank');
    if (!win) return;
    const doc = win.document;
    const items = PHYSICAL_COLUMNS;
    doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Surat Pengecekan Kavling</title>');
    doc.write('<style>');
    doc.write('body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;padding:16px;}');
    doc.write('h1{font-size:14pt;margin:0 0 6px 0;color:#111827;}');
    doc.write('.sub{font-size:8pt;color:#6b7280;margin-bottom:12px;}');
    doc.write('.table{width:100%;border-collapse:collapse;font-size:7pt;}');
    doc.write('.table th,.table td{border:1px solid #e5e7eb;padding:3px 4px;vertical-align:middle;text-align:left;}');
    doc.write('.table th{background:#f3f4f6;font-weight:600;color:#111827;}');
    doc.write('.narrow{width:22px;text-align:center;}');
    doc.write('.blok{min-width:90px;}');
    doc.write('.ltlb{width:44px;text-align:center;}');
    doc.write('.type{width:60px;text-align:center;}');
    doc.write('.pelaksana{width:60px;text-align:center;}');
    doc.write('.item{width:24px;text-align:center;font-size:6.5pt;}');
    doc.write('.square{display:inline-block;width:10px;height:10px;border:1px solid #9ca3af;border-radius:2px;}');
    doc.write('@page{size:A4 landscape;margin:10mm;}');
    doc.write('@media print{button{display:none;}}');
    doc.write('</style></head><body>');
    doc.write('<h1>Surat Pengecekan Kavling</h1>');
    doc.write('<div class="sub">Tanggal: ' + dateStr + '</div>');
    doc.write('<table class="table"><thead><tr>');
    doc.write('<th class="narrow">No</th>');
    doc.write('<th class="blok">Nama Blok</th>');
    doc.write('<th class="ltlb">LT</th>');
    doc.write('<th class="ltlb">LB</th>');
    doc.write('<th class="type">Type</th>');
    doc.write('<th class="pelaksana">% Pelaksana</th>');
    items.forEach(function(lbl){ doc.write('<th class="item">' + lbl + '</th>'); });
    doc.write('</tr></thead><tbody>');
    
    data.forEach((row, idx) => {
        const blok = row[0] || '';
        const lt = row[1] || '';
        const lb = row[2] || '';
        const type = row[3] || '';
        const pelaksana = row[31] ? (window.parseProgressValue(row[31]) + '%') : '-';
        
        doc.write('<tr>');
        doc.write('<td class="narrow">' + (idx + 1) + '</td>');
        doc.write('<td class="blok">' + blok + '</td>');
        doc.write('<td class="ltlb">' + lt + '</td>');
        doc.write('<td class="ltlb">' + lb + '</td>');
        doc.write('<td class="type">' + type + '</td>');
        doc.write('<td class="pelaksana">' + pelaksana + '</td>');
        items.forEach(function(){ doc.write('<td class="item"><span class="square"></span></td>'); });
        doc.write('</tr>');
    });
    doc.write('</tbody></table>');
    doc.write('</body></html>');
    doc.close();
    try { win.focus(); } catch(e) {}
}
