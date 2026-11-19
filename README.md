# Routine Daily

Aplikasi rutinitas harian untuk membuat jadwal per hari, memantau progres, dan melihat jadwal hari ini melalui widget Android. Aplikasi dibuat dengan Expo, React Native, TypeScript, dan Expo Router.

## Fitur

- Jadwal dikelola secara terpisah untuk setiap hari dalam seminggu.
- Status kegiatan dapat diubah berurutan: **Belum → Selesai → Gagal → Belum**.
- Status jadwal direset menjadi **Belum dikerjakan** ketika tanggal berganti dan data dimuat kembali.
- Jadwal disimpan secara lokal di perangkat menggunakan AsyncStorage.
- Impor jadwal dari JSON dengan validasi hari, judul, dan waktu. Impor **mengganti seluruh jadwal yang tersimpan**.
- Widget layar utama Android menampilkan jadwal dan progres hari ini, serta menyediakan aksi untuk membuka aplikasi dan memperbarui status.
- Notifikasi untuk jadwal dan kegiatan yang sedang berlangsung.
- Tampilan berwarna biru dengan ikon Lucide dan modal kustom yang reusable.
- Tidak ada jadwal bawaan; aplikasi baru dimulai dengan daftar kosong.

## Persyaratan

- Node.js dan npm.
- Akun Expo untuk membuat build melalui EAS.
- Untuk build dan menjalankan aplikasi Android secara lokal: Android Studio, Android SDK, dan emulator atau perangkat Android.
- Untuk build dan menjalankan aplikasi iOS secara lokal: macOS dan Xcode.

Versi utama teknologi di proyek ini:

- Expo SDK 58
- React Native 0.88
- React 19
- TypeScript 6

## Memulai

Pasang dependensi, lalu jalankan development server:

```bash
npm install
npm run start
```

Perintah `npm run start` menjalankan Metro/Expo CLI. Gunakan development build yang sudah terpasang untuk membuka aplikasi dengan modul native proyek ini.

### Menjalankan Android secara lokal

```bash
npm run android
```

Perintah tersebut menjalankan `expo run:android`, yang memerlukan Android SDK yang dapat ditemukan Gradle. Jika muncul pesan `SDK location not found`, buka Android Studio → **Settings/Preferences → Languages & Frameworks → Android SDK** dan pastikan lokasi SDK sudah terpasang serta dikonfigurasi untuk terminal.

Contoh konfigurasi sementara pada macOS:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
npm run android
```

Jika Android SDK berada di lokasi berbeda, sesuaikan nilai `ANDROID_HOME`. Hindari menambahkan file `android/local.properties` yang berisi path komputer pribadi ke Git.

### Menjalankan iOS secara lokal

```bash
npm run ios
```

Perintah ini membutuhkan macOS dengan Xcode dan iOS Simulator yang tersedia.

### Catatan development build

Aplikasi menggunakan modul native, termasuk widget Android dan layanan notifikasi. Karena itu, fitur native tersebut memerlukan development build atau build aplikasi biasa; **Expo Go tidak menyertakan modul native proyek ini**.

## Build Android dengan EAS

Konfigurasi EAS sudah tersedia di [`eas.json`](./eas.json), dan proyek telah memiliki EAS project ID di [`app.json`](./app.json). Build EAS dijalankan di cloud sehingga tidak membutuhkan Android SDK lokal.

Login ke Expo:

```bash
npx eas-cli@latest login
```

Buat APK untuk instalasi langsung di perangkat atau emulator:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Profil `preview` menggunakan distribusi internal dan menghasilkan APK. Setelah build selesai, unduh APK melalui tautan yang ditampilkan EAS atau dari halaman Builds proyek di Expo.

Profil build lain:

```bash
# Development build untuk pengembangan dengan development client
npx eas-cli@latest build --platform android --profile development

# Production build Android; konfigurasi default ditujukan untuk Google Play (AAB)
npx eas-cli@latest build --platform android --profile production
```

Pada build pertama, EAS dapat menawarkan untuk membuat dan mengelola Android signing key. Simpan akses ke akun dan kredensial signing dengan aman karena diperlukan untuk pembaruan aplikasi yang sama.

## Menggunakan aplikasi

### Mengelola jadwal

1. Buka tab **Kelola Jadwal**.
2. Pilih hari yang ingin dikelola.
3. Tambahkan jadwal dengan judul, jam mulai, dan jam selesai dalam format 24 jam `HH:mm`.
4. Gunakan ikon edit untuk mengubah jadwal atau ikon hapus untuk menghapusnya. Penghapusan meminta konfirmasi.
5. Untuk menandai status, buka tab **Jadwal Hari Ini** dan tekan ikon status pada kegiatan.

### Mengimpor jadwal JSON

Buka tab **Pengaturan → Impor jadwal JSON**, tempel array JSON yang valid, lalu pilih **Validasi dan impor**. Impor mengganti seluruh jadwal yang ada. Status setiap jadwal yang diimpor dimulai sebagai `pending`.

Contoh jadwal untuk setiap hari:

```json
[
  {
    "day": "Minggu",
    "startTime": "08:00",
    "endTime": "09:00",
    "title": "Olahraga ringan"
  },
  {
    "day": "Senin",
    "startTime": "06:00",
    "endTime": "07:00",
    "title": "Olahraga pagi"
  },
  {
    "day": "Selasa",
    "startTime": "08:00",
    "endTime": "09:00",
    "title": "Belajar"
  },
  {
    "day": "Rabu",
    "startTime": "09:00",
    "endTime": "10:00",
    "title": "Membaca"
  },
  {
    "day": "Kamis",
    "startTime": "13:00",
    "endTime": "14:00",
    "title": "Mengerjakan proyek"
  },
  {
    "day": "Jum'at",
    "startTime": "16:00",
    "endTime": "17:00",
    "title": "Belanja kebutuhan"
  },
  {
    "day": "Sabtu",
    "startTime": "10:00",
    "endTime": "11:00",
    "title": "Membersihkan rumah"
  }
]
```

Ketentuan format:

- Nilai teratas harus berupa array JSON.
- Setiap objek harus memiliki `day`, `startTime`, `endTime`, dan `title`.
- `day` harus persis salah satu dari `Minggu`, `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jum'at`, atau `Sabtu`.
- Waktu harus memakai format 24 jam `HH:mm`, misalnya `08:30`.
- Judul tidak boleh kosong dan waktu mulai tidak boleh sama dengan waktu selesai.
- `id` dan `status` tidak perlu disertakan; aplikasi membuat ID dan mengatur status awalnya sendiri.
- Array kosong (`[]`) valid dan akan menghapus seluruh jadwal saat ini.

## Arsitektur

Proyek menggunakan layered architecture agar aturan bisnis, penyimpanan, dan antarmuka tidak tercampur:

1. **Presentation** — layar Expo Router dan komponen UI di `app/` dan `src/components/`.
2. **Service/Application** — orkestrasi operasi jadwal, notifikasi, dan widget di `src/services/` serta `src/widget/`.
3. **Domain** — tipe data dan aturan bisnis jadwal di `src/domain/` dan `src/types/`.
4. **Data** — akses dan persistensi lokal menggunakan AsyncStorage di `src/data/`.

Alur umum data jadwal:

```text
Screen / Widget → Service → Domain rules / Repository → AsyncStorage
```

### Struktur proyek

```text
app/
  _layout.tsx                 # Root navigator dan inisialisasi layanan
  (tabs)/
    _layout.tsx               # Navigasi tab
    index.tsx                 # Dashboard jadwal hari ini
    routine.tsx               # Kelola jadwal per hari
    settings.tsx              # Impor dan pengaturan
src/
  components/
    AppModal.tsx              # Modal kustom reusable
  data/
    routineRepository.ts      # Persistensi, reset harian, dan migrasi data
  domain/
    routine.ts                # Validasi JSON, waktu, status, dan statistik
  services/
    routineData.ts            # Use case dan akses data jadwal
    notification.ts           # Izin dan pengingat jadwal
    currentTaskNotification.ts # Notifikasi kegiatan yang sedang berlangsung
  types/
    routine.ts                # Tipe jadwal, hari, dan status
  widget/
    TodayWidget.tsx           # UI widget jadwal hari ini
    updateWidget.tsx          # Pemicu pembaruan widget
    widgetTaskHandler.tsx     # Penanganan aksi widget
plugins/
  withNotifeeForegroundService.js
```

## Penyimpanan dan perilaku data

- Jadwal disimpan secara lokal di perangkat, bukan di server.
- Data kosong tidak diisi dengan contoh atau jadwal bawaan.
- Setiap jadwal memiliki satu hari; jadwal yang sama pada beberapa hari harus dibuat sebagai beberapa entri.
- Saat tanggal berubah, status disetel kembali ke `pending` ketika data jadwal dimuat pada tanggal baru.
- Format penyimpanan lama dimigrasikan saat aplikasi membaca data untuk pertama kali setelah pembaruan. Jadwal legacy dengan kelompok `Senin-Kamis` dipecah menjadi entri untuk masing-masing hari, dan statusnya direset.
- Penghapusan semua jadwal tersedia di tab **Pengaturan** dan meminta konfirmasi.

## Pemeriksaan kode

```bash
npm run lint
npx tsc --noEmit
```

## Pemecahan masalah

### Gradle menampilkan `SDK location not found`

Pastikan Android SDK terpasang di Android Studio dan `ANDROID_HOME` menunjuk ke direktori SDK yang benar. Setelah memperbarui konfigurasi environment, tutup dan buka kembali terminal sebelum menjalankan `npm run android`.

### Fitur widget tidak tersedia di Expo Go

Widget memerlukan native module dan tidak dapat dijalankan di Expo Go. Pasang build Android yang dibuat dengan EAS atau jalankan development build.

### Jadwal hasil impor tidak terlihat di dashboard

Dashboard menampilkan jadwal untuk hari ini saja. Buka **Kelola Jadwal**, lalu pilih hari yang tercantum pada pesan sukses impor untuk memeriksa jadwal lainnya.

### Notifikasi tidak muncul

Pastikan izin notifikasi diberikan di Android atau iOS. Android juga dapat menerapkan pembatasan baterai atau alarm terjadwal; perilaku aktual dapat berbeda menurut versi sistem operasi dan perangkat.

## Teknologi utama

- [Expo](https://expo.dev/) dan [React Native](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [TypeScript](https://www.typescriptlang.org/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Lucide](https://lucide.dev/)
- [react-native-android-widget](https://github.com/sAleksovski/react-native-android-widget)
- [Notifee](https://notifee.app/)
- [Expo Application Services (EAS)](https://docs.expo.dev/build/introduction/)
