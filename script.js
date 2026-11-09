// =====================================
// DATA SISWA
// =====================================

const siswaAwal = [
  "Abiansyah Fahmi Izhar",
  "Ade Andri Yuanda",
  "Adelia Putri",
  "Adhitya Firmansyah",
  "Afni Nurul Ramadani Saragih",
  "Aidil Azmi",
  "Aji Surya Pratama",
  "Akbar Maulana",
  "Alfandi Saputra",
  "Arif Wibowo",
  "Andre Saputra",
  "Balqis Larasati",
  "Chila Salsabilah",
  "Dhea Ananda Nur Kholillah",
  "Dika Dwi Ranata Silitongah",
  "Elisabeth Fitrianda Simbolon",
  "Enzel Amalia",
  "Fahri Arba’i",
  "Fannisya Chairani",
  "Firziawan Prasetiyo",
  "Fahriz Arkan Syahputra",
  "Gara Gusti Lestari",
  "Illa Natasya",
  "Khairunnisa",
  "Mila Kanaya Putri Sinaga",
  "Muhammad Solliul Anwar",
  "Nayla Putri",
  "Nazla Sabrina Saragih",
  "Novita Sari",
  "Nurul Khonita",
  "Putri Aulia Ramadhani",
  "Reyhan Kurniawan",
  "Richo Rifaldi",
  "Royhan Zahir",
  "Sella Dwi Yanti",
  "Sella Aulia",
  "Siti Adira Nurhasanah",
  "Sry Muliani Damanik",
  "Zaura Qisi Anggun"
];

const KEY_SISWA = "hadiryuk_v3_siswa";
const KEY_ABSENSI = "hadiryuk_v3_absensi";

let siswa = JSON.parse(localStorage.getItem(KEY_SISWA)) || siswaAwal;
let absensi = JSON.parse(localStorage.getItem(KEY_ABSENSI)) || [];

let currentUser = null;
let scanner = null;
let cameraStream = null;

// =====================================
// ELEMENT
// =====================================

const $ = id => document.getElementById(id);

const today = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const currentTime = () => {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

const escapeHTML = value => {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
};

function saveData() {
  localStorage.setItem(KEY_SISWA, JSON.stringify(siswa));
  localStorage.setItem(KEY_ABSENSI, JSON.stringify(absensi));
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function getAbsensiHariIni(nama) {
  return absensi.find(item =>
    item.nama === nama && item.tanggal === today()
  );
}

function getStatus(nama) {
  const data = getAbsensiHariIni(nama);
  return data ? data.status : "Belum";
}

function badge(status) {
  return `<span class="status status-${status}">${status}</span>`;
}

// =====================================
// LOGIN
// =====================================

$("loginRole").addEventListener("change", () => {
  $("username").value = "";
  $("password").value = "";
  $("username").placeholder =
    $("loginRole").value === "admin"
      ? "Masukkan username admin"
      : "Masukkan nama lengkap siswa";
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const role = $("loginRole").value;
  const username = $("username").value.trim();
  const password = $("password").value;

  if (role === "admin") {
    if (username === "admin" && password === "admin123") {
      loginBerhasil({
        nama: "Administrator",
        role: "admin"
      });
    } else {
      showToast("Username atau password admin salah!");
    }
    return;
  }

  const namaSiswa = siswa.find(
    nama => nama.toLowerCase() === username.toLowerCase()
  );

  if (namaSiswa && password === "siswa123") {
    loginBerhasil({
      nama: namaSiswa,
      role: "siswa"
    });
  } else {
    showToast("Nama atau password siswa salah!");
  }
});

function loginBerhasil(user) {
  currentUser = user;

  $("loginPage").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("sidebarName").textContent = user.nama;
  $("sidebarRole").textContent =
    user.role === "admin" ? "Administrator" : "Siswa";

  $("sidebarAvatar").textContent = user.nama.charAt(0).toUpperCase();
  $("topAvatar").textContent = user.nama.charAt(0).toUpperCase();
  $("welcomeName").textContent = user.nama;

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", user.role !== "admin");
  });

  $("todayDate").textContent = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  showPage("dashboard");
  refreshAll();
  showToast("Berhasil masuk. Selamat datang!");
}

$("logoutBtn").addEventListener("click", async () => {
  await stopScanner();
  stopCamera();

  currentUser = null;
  $("app").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("password").value = "";
  $("username").value = "";
});

// =====================================
// NAVIGASI HALAMAN
// =====================================

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.goto);
  });
});

function showPage(page) {
  if (!currentUser) return;

  if (
    currentUser.role !== "admin" &&
    ["data", "qr", "laporan"].includes(page)
  ) {
    showToast("Halaman ini hanya untuk admin.");
    return;
  }

  document.querySelectorAll(".page").forEach(item => {
    item.classList.remove("active-page");
  });

  document.querySelectorAll(".nav-link").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  $(`${page}Page`).classList.add("active-page");

  const titles = {
    dashboard: "Dashboard",
    data: "Data Siswa",
    absensi: "Absensi Siswa",
    qr: "QR Code",
    riwayat: "Riwayat Absensi",
    laporan: "Laporan Absensi"
  };

  $("pageTitle").textContent = titles[page] || "HadirYuk";

  if (page === "dashboard") renderDashboard();
  if (page === "data") renderStudents();
  if (page === "riwayat") renderHistory();
  if (page === "laporan") renderReport();
}

// =====================================
// DASHBOARD
// =====================================

function renderDashboard() {
  const jumlah = siswa.length;
  const dataHariIni = absensi.filter(item => item.tanggal === today());

  const hadir = dataHariIni.filter(item => item.status === "Hadir").length;
  const izin = dataHariIni.filter(item =>
    ["Izin", "Sakit"].includes(item.status)
  ).length;

  const alpa = dataHariIni.filter(item => item.status === "Alpa").length;
  const belum = Math.max(0, jumlah - dataHariIni.length);

  $("totalSiswa").textContent = jumlah;
  $("totalHadir").textContent = hadir;
  $("totalIzin").textContent = izin;
  $("totalBelum").textContent = belum;

  const persen = jumlah ? Math.round((hadir / jumlah) * 100) : 0;

  $("persentaseHadir").textContent = persen + "%";
  $("progressBar").style.width = persen + "%";

  const terbaru = [...dataHariIni].reverse().slice(0, 7);

  $("dashboardTable").innerHTML = terbaru.length
    ? terbaru.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.nama)}</td>
        <td>${escapeHTML(item.jam)}</td>
        <td>${badge(item.status)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="empty">Belum ada absensi hari ini.</td></tr>`;
}

// =====================================
// DATA SISWA
// =====================================

function renderStudents(keyword = "") {
  const daftar = siswa.filter(nama =>
    nama.toLowerCase().includes(keyword.toLowerCase())
  );

  $("studentCount").textContent = `${siswa.length} siswa`;

  $("studentTable").innerHTML = daftar.length
    ? daftar.map((nama, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(nama)}</td>
        <td>${badge(getStatus(nama))}</td>
        <td>
          <button class="action-btn delete-btn"
            onclick="deleteStudent('${encodeURIComponent(nama)}')">
            Hapus
          </button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">Siswa tidak ditemukan.</td></tr>`;

  updateStudentSelect();
}

$("searchStudent").addEventListener("input", event => {
  renderStudents(event.target.value);
});

function updateStudentSelect() {
  $("manualStudent").innerHTML =
    `<option value="">Pilih siswa</option>` +
    siswa.map(nama =>
      `<option value="${escapeHTML(nama)}">${escapeHTML(nama)}</option>`
    ).join("");
}

$("addStudentBtn").addEventListener("click", () => {
  $("studentModal").classList.remove("hidden");
  $("newStudentName").focus();
});

function closeModal() {
  $("studentModal").classList.add("hidden");
  $("studentForm").reset();
}

$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("studentForm").addEventListener("submit", event => {
  event.preventDefault();

  const nama = $("newStudentName").value.trim();

  if (!nama) return;

  if (siswa.some(item => item.toLowerCase() === nama.toLowerCase())) {
    showToast("Nama siswa sudah terdaftar.");
    return;
  }

  siswa.push(nama);
  saveData();
  closeModal();
  refreshAll();
  showToast("Siswa berhasil ditambahkan.");
});

function deleteStudent(encodedName) {
  const nama = decodeURIComponent(encodedName);

  if (!confirm(`Hapus data ${nama}?`)) return;

  siswa = siswa.filter(item => item !== nama);
  saveData();
  refreshAll();
  showToast("Data siswa berhasil dihapus.");
}

// =====================================
// SIMPAN ABSENSI
// =====================================

function simpanAbsensi(nama, status) {
  if (!siswa.includes(nama)) {
    showToast("Nama siswa tidak terdaftar.");
    return false;
  }

  const existingIndex = absensi.findIndex(item =>
    item.nama === nama && item.tanggal === today()
  );

  const data = {
    nama,
    status,
    tanggal: today(),
    jam: currentTime()
  };

  if (existingIndex >= 0) {
    absensi[existingIndex] = data;
  } else {
    absensi.push(data);
  }

  saveData();
  refreshAll();

  return true;
}

// =====================================
// ABSENSI MANUAL
// =====================================

$("manualForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentUser?.role !== "admin") return;

  const nama = $("manualStudent").value;
  const status = $("manualStatus").value;

  if (!nama) {
    showToast("Pilih nama siswa terlebih dahulu.");
    return;
  }

  simpanAbsensi(nama, status);
  $("manualForm").reset();
  showToast("Absensi berhasil disimpan.");
});

// =====================================
// ABSENSI SISWA SENDIRI
// =====================================

function absensiSiswaSendiri() {
  if (!currentUser || currentUser.role !== "siswa") {
    showToast("Login sebagai siswa untuk melakukan absensi.");
    return;
  }

  const berhasil = simpanAbsensi(currentUser.nama, "Hadir");

  if (berhasil) showToast("Absensi berhasil dicatat.");
}

// =====================================
// QR GENERATOR
// =====================================

$("generateQR").addEventListener("click", () => {
  if (currentUser?.role !== "admin") return;

  $("qrcode").innerHTML = "";

  const isiQR = `HADIRYUK|XI RPL 1|${today()}`;

  new QRCode($("qrcode"), {
    text: isiQR,
    width: 180,
    height: 180,
    colorDark: "#29263a",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  $("qrDate").textContent = `QR Code tanggal ${today()}`;
  showToast("QR Code berhasil dibuat.");
});

$("downloadQR").addEventListener("click", () => {
  const canvas = $("qrcode").querySelector("canvas");
  const image = $("qrcode").querySelector("img");

  const source = canvas
    ? canvas.toDataURL("image/png")
    : image?.src;

  if (!source) {
    showToast("Buat QR Code terlebih dahulu.");
    return;
  }

  const link = document.createElement("a");
  link.href = source;
  link.download = `QR-HadirYuk-${today()}.png`;
  link.click();
});

// =====================================
// QR SCANNER
// =====================================

$("startScanner").addEventListener("click", startScanner);
$("stopScanner").addEventListener("click", stopScanner);

async function startScanner() {
  if (!window.Html5Qrcode) {
    showToast("Library QR tidak berhasil dimuat.");
    return;
  }

  try {
    $("reader").innerHTML = "";

    scanner = new Html5Qrcode("reader");

    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 }
      },
      async decodedText => {
        await stopScanner();
        prosesQR(decodedText);
      },
      () => {}
    );

    $("startScanner").classList.add("hidden");
    $("stopScanner").classList.remove("hidden");

  } catch (error) {
    console.error(error);
    showToast("Kamera tidak dapat dibuka. Periksa izin kamera.");
  }
}

async function stopScanner() {
  if (scanner) {
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch (error) {
      console.log(error);
    }

    scanner = null;
  }

  $("reader").innerHTML = "";
  $("startScanner").classList.remove("hidden");
  $("stopScanner").classList.add("hidden");
}

function prosesQR(text) {
  const bagian = text.split("|");

  if (
    bagian.length !== 3 ||
    bagian[0] !== "HADIRYUK" ||
    bagian[1] !== "XI RPL 1" ||
    bagian[2] !== today()
  ) {
    showToast("QR Code tidak valid atau sudah kedaluwarsa.");
    return;
  }

  if (currentUser.role === "siswa") {
    simpanAbsensi(currentUser.nama, "Hadir");
    showToast("Absensi berhasil melalui QR Code.");
  } else {
    showToast("QR valid. Silakan login sebagai siswa untuk mencatat kehadiran.");
  }
}

// =====================================
// KAMERA DOKUMENTASI
// =====================================

$("startCamera").addEventListener("click", startCamera);
$("takePhoto").addEventListener("click", takePhoto);

async function startCamera() {
    const video = document.getElementById("cameraPreview");

    if (!window.isSecureContext) {
        showToast("Kamera hanya bisa dibuka melalui HTTPS.");
        return;
    }

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
        showToast("Browser tidak mendukung akses kamera.");
        return;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "user" }
            },
            audio: false
        });

        video.srcObject = cameraStream;
        await video.play();

        document.getElementById("startCamera").textContent =
            "Kamera Aktif";

    } catch (error) {
        console.error("Kesalahan kamera:", error);

        if (error.name === "NotAllowedError") {
            showToast("Izin kamera ditolak. Izinkan kamera di browser.");
        } else if (error.name === "NotFoundError") {
            showToast("Kamera tidak ditemukan.");
        } else {
            showToast("Kamera gagal dibuka. Coba muat ulang halaman.");
        }
    }
}

function takePhoto() {
  if (!cameraStream) return;

  const video = $("cameraPreview");
  const canvas = $("photoCanvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  $("cameraMessage").textContent =
    "Foto berhasil diambil sebagai dokumentasi.";

  if (currentUser.role === "siswa") {
    absensiSiswaSendiri();
  } else {
    showToast("Foto dokumentasi berhasil diambil.");
  }

  stopCamera();
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  $("cameraPreview").srcObject = null;
  $("startCamera").classList.remove("hidden");
  $("takePhoto").classList.add("hidden");
}

// =====================================
// RIWAYAT ABSENSI
// =====================================

$("historyDate").value = today();

$("historyDate").addEventListener("change", renderHistory);
$("searchHistory").addEventListener("input", renderHistory);

function renderHistory() {
  const tanggal = $("historyDate").value || today();
  const keyword = $("searchHistory").value.toLowerCase();

  let data = absensi.filter(item =>
    item.tanggal === tanggal &&
    item.nama.toLowerCase().includes(keyword)
  );

  if (currentUser?.role === "siswa") {
    data = data.filter(item => item.nama === currentUser.nama);
  }

  data = [...data].reverse();

  $("historyTable").innerHTML = data.length
    ? data.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.tanggal)}</td>
        <td>${escapeHTML(item.nama)}</td>
        <td>${escapeHTML(item.jam)}</td>
        <td>${badge(item.status)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Belum ada riwayat absensi.</td></tr>`;
}

// =====================================
// LAPORAN
// =====================================

$("reportDate").value = today();

$("reportDate").addEventListener("change", renderReport);
$("refreshReport").addEventListener("click", renderReport);

function renderReport() {
  if (currentUser?.role !== "admin") return;

  const tanggal = $("reportDate").value || today();

  const data = absensi.filter(item => item.tanggal === tanggal);

  const hadir = data.filter(item => item.status === "Hadir").length;
  const izin = data.filter(item => item.status === "Izin").length;
  const lain = data.filter(item =>
    ["Sakit", "Alpa"].includes(item.status)
  ).length;

  $("reportHadir").textContent = hadir;
  $("reportIzin").textContent = izin;
  $("reportLain").textContent = lain;

  $("reportTable").innerHTML = data.length
    ? data.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.nama)}</td>
        <td>${escapeHTML(item.jam)}</td>
        <td>${badge(item.status)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">Belum ada data pada tanggal ini.</td></tr>`;
}

$("printReport").addEventListener("click", () => {
  renderReport();
  window.print();
});

// =====================================
// REFRESH
// =====================================

function refreshAll() {
  saveData();
  renderDashboard();
  renderStudents();
  renderHistory();
  renderReport();
  updateStudentSelect();
}

// =====================================
// INISIALISASI
// =====================================

saveData();
$("todayDate").textContent = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric"
});