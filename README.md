# Routine Daily

Routine Daily adalah aplikasi Android untuk menyusun rutinitas harian, menandai progres kegiatan, dan melihat jadwal hari ini melalui widget.

## Fitur

- Mengelola jadwal secara terpisah untuk setiap hari.
- Menambahkan, mengedit, dan menghapus jadwal.
- Mengubah status kegiatan dengan urutan **Belum → Selesai → Gagal → Belum**.
- Melihat jumlah kegiatan yang selesai, gagal, atau belum dikerjakan pada hari ini.
- Mengimpor jadwal dari JSON. Impor mengganti seluruh jadwal yang tersimpan.
- Menampilkan jadwal serta progres hari ini pada widget Android. Ketuk jadwal untuk membuka aplikasi atau tombol status pada widget untuk mengubah statusnya.
- Menerima notifikasi pengingat dan notifikasi kegiatan yang sedang berlangsung.
- Menyimpan jadwal secara lokal di perangkat. Tidak ada jadwal contoh bawaan.

## Menjalankan di Android

### Emulator atau perangkat dengan development build

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Buka Android Studio dan jalankan emulator dari **Device Manager**, atau hubungkan perangkat Android dengan USB debugging aktif.
3. Dari root proyek, jalankan:

   ```bash
   npm run android
   ```

Perintah tersebut membangun dan memasang aplikasi debug, lalu menjalankannya di emulator atau perangkat yang tersedia.

### Membuat APK dengan EAS

Untuk membuat APK yang dapat diunduh dan dipasang di perangkat Android atau emulator:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Setelah build selesai, unduh APK dari tautan yang ditampilkan EAS. Build EAS dilakukan di cloud.

## Menggunakan aplikasi

### Mengelola jadwal

1. Buka tab **Kelola Jadwal**.
2. Pilih hari.
3. Tambahkan kegiatan dengan judul, jam mulai, dan jam selesai.
4. Gunakan ikon pensil untuk mengedit atau ikon tempat sampah untuk menghapus. Penghapusan meminta konfirmasi.
5. Buka tab **Jadwal Hari Ini** untuk melihat kegiatan pada hari ini dan mengubah statusnya dengan ikon status.

Waktu menggunakan format 24 jam `HH:mm`, misalnya `08:30`.

### Mengimpor jadwal JSON

Buka **Pengaturan → Impor jadwal JSON**, masukkan array JSON, lalu pilih **Validasi dan impor**. Setiap jadwal yang diimpor memiliki status awal **Belum**.

Contoh jadwal untuk semua hari:

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

Format impor:

- Data utama harus berupa array JSON.
- Setiap objek harus memiliki `day`, `startTime`, `endTime`, dan `title`.
- `day` harus persis `Minggu`, `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jum'at`, atau `Sabtu`.
- Jam harus berformat 24 jam `HH:mm`; judul tidak boleh kosong, dan jam mulai tidak boleh sama dengan jam selesai.
- `id` dan `status` tidak perlu disertakan.
- Array kosong (`[]`) valid dan akan mengosongkan jadwal.

## Status dan penyimpanan

- Jadwal dan statusnya tersimpan secara lokal di perangkat menggunakan AsyncStorage.
- Setiap entri jadwal berlaku untuk satu hari.
- Ketika tanggal berganti, status jadwal direset menjadi **Belum** saat data dimuat kembali.
- Impor JSON mengganti semua jadwal yang ada; gunakan **Pengaturan → Hapus semua jadwal** untuk menghapus seluruh jadwal secara manual.

## Arsitektur

Aplikasi menggunakan layered architecture:

| Lapisan | Tanggung jawab | Lokasi |
|---|---|---|
| Presentation | Layar navigasi dan komponen antarmuka | `app/`, `src/components/` |
| Service | Operasi jadwal, notifikasi, dan pembaruan widget | `src/services/`, `src/widget/` |
| Domain | Tipe data dan aturan bisnis jadwal | `src/domain/`, `src/types/` |
| Data | Penyimpanan jadwal lokal | `src/data/` |

Alur data jadwal:

```text
Layar / Widget → Service → Domain / Repository → AsyncStorage
```

## Teknologi

- Expo SDK 58
- React Native 0.88 dan TypeScript
- Expo Router
- AsyncStorage
- Lucide React Native
- Notifee dan Expo Notifications
- `react-native-android-widget`
- Expo Application Services (EAS)
