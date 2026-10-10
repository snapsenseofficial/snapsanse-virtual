# 🔌 Live Crew — panduan setup

Pasukan SnapSense membuat kerja sebenar menggunakan **Claude Code** di komputer anda:

| Ahli | Folder kerja (`crew/workspaces/`) | Tugas |
|---|---|---|
| Lili | `tiktok-analytics` | Statistik TikTok harian + laporan |
| Sofea | `tiktok-content` | 5 idea video, hook, caption, hashtag + cadang slot penggambaran |
| Irfan | `marketing-report` | Laporan engagement mingguan |
| Hafiz | `bookings` | Tempahan baru dari katalog → cadang event kalendar + draf balasan |
| Haziq | `calendar-planner` | Ringkasan jadual 7 hari + senarai semak |

Agent **hanya membaca** data dan **mencadangkan** perubahan. Setiap event kalendar, muat naik Drive atau balasan pelanggan muncul dalam panel **Live crew** di office. Ia hanya berlaku selepas anda klik **Approve**. Agent tidak boleh post ke TikTok atau menghantar mesej.

## 1. Google (Calendar, Drive, Sheet tempahan)

1. Buka <https://console.cloud.google.com/> dan cipta projek, contohnya "SnapSense Office".
2. **APIs & Services → Library**: aktifkan **Google Calendar API**, **Google Drive API** dan **Google Sheets API**.
3. **OAuth consent screen**: pilih *External*, isi nama app, kemudian tambah emel anda di bawah **Test users**.
4. **Credentials → Create credentials → OAuth client ID**: pilih jenis **Desktop app**. Salin *Client ID* dan *Client secret*.
5. **Sheet tempahan**: buka Google Sheet yang menerima jawapan Google Form katalog anda. ID ialah bahagian panjang dalam URL (`/spreadsheets/d/<ID>/edit`). Nama tab biasanya `Form Responses 1`.
6. **Folder laporan**: cipta folder di Drive, contohnya "SnapSense Laporan". ID ialah bahagian akhir URL folder.

## 2. TikTok (API rasmi)

1. Daftar di <https://developers.tiktok.com/>, kemudian **Manage apps → Connect an app**.
2. Tambah produk **Login Kit**. Aktifkan scope `user.info.basic`, `user.info.stats` dan `video.list` (Display API).
3. Tambah **Redirect URI**: `http://127.0.0.1:4317/oauth/tiktok`.
   - Jika TikTok tidak menerima alamat `127.0.0.1`, gunakan alamat https yang TikTok terima dan letak nilai yang sama dalam `tiktok.redirectUri`.
   - Alamat itu mesti menghantar pengguna kembali ke `http://127.0.0.1:4317/oauth/tiktok` dengan parameter yang sama.
4. Salin *Client key* dan *Client secret*.
5. Semasa app dalam mod *sandbox*, tambah akaun TikTok anda sebagai *target user*.

> API ini memberi profil (followers, likes) dan statistik setiap video (views, likes, comments, shares). Data terperinci TikTok Studio seperti masa tonton purata dan sumber trafik **tidak** disediakan oleh API awam TikTok.

## 3. Konfigurasi

```bash
cp crew/config.example.json crew/config.json   # isi nilai dari langkah 1 & 2
npm start                                      # buka http://127.0.0.1:4317
```

Dalam panel **Live crew**, klik **Sambung** untuk Google dan TikTok, kemudian log masuk. Token disimpan dalam `crew/secrets/`, hanya di komputer anda, dan sudah dikecualikan daripada git.

Semak sambungan:

```bash
node crew/tools/snapsense.js status
```

## 4. Jalankan pasukan

Setiap tugasan ialah satu sesi Claude Code dalam folder kerjanya. Arahan penuh untuk setiap watak ada dalam `CLAUDE.md` di folder itu. Contoh:

```bash
cd crew/workspaces/bookings
claude "Semak tempahan baru dari katalog."
```

Arahan untuk setiap tugasan juga tersenarai dalam office di bawah **Tugasan pasukan**. Semasa agent bekerja, wataknya (contohnya Hafiz) muncul secara live dalam office. Bila dia mencadangkan sesuatu, dia melambai dengan bubble **APPROVE?**.

Fail hasil kerja disimpan dalam `crew/output/` (laporan, idea content, ringkasan tempahan).

## 5. Jalankan ikut jadual (pilihan, anda yang kawal)

Komputer anda boleh menjalankan tugasan secara automatik melalui penjadualnya sendiri. Mod `-p` berjalan tanpa interaksi. Had kebenarannya ketat: agent hanya boleh membaca dan menulis fail dalam folder kerjanya serta menggunakan toolbox. Arahan lain akan ditolak secara automatik.

Jadual cadangan (sama seperti `crew/jobs.json`):

| Masa | Watak | Folder | Arahan |
|---|---|---|---|
| 08:00 setiap hari | Haziq | `calendar-planner` | `Sediakan ringkasan jadual 7 hari akan datang.` |
| 09:00 setiap hari | Lili | `tiktok-analytics` | `Jalankan tugasan harian statistik TikTok.` |
| 10:00 Isnin & Khamis | Sofea | `tiktok-content` | `Sediakan 5 idea video baru dan cadangkan slot.` |
| 08:30 Isnin | Irfan | `marketing-report` | `Sediakan laporan prestasi TikTok minggu lepas.` |
| Setiap 30 minit, 9pg–9mlm | Hafiz | `bookings` | `Semak tempahan baru dari katalog.` |

### macOS / Linux (cron)

Jalankan `crontab -e`, kemudian tukar `/LALUAN/snapsanse-virtual` kepada lokasi folder anda:

```cron
CRON_TZ=Asia/Kuala_Lumpur
PATH=/usr/local/bin:/usr/bin:/bin
SNAP=/LALUAN/snapsanse-virtual/crew
ALLOW="Read,Write,Edit,Glob,Grep,Bash(node ../../tools/snapsense.js:*)"

0 8 * * *      cd $SNAP/workspaces/calendar-planner && claude -p "Sediakan ringkasan jadual 7 hari akan datang." --permission-mode dontAsk --allowedTools "$ALLOW" >> $SNAP/output/cron.log 2>&1
0 9 * * *      cd $SNAP/workspaces/tiktok-analytics && claude -p "Jalankan tugasan harian statistik TikTok." --permission-mode dontAsk --allowedTools "$ALLOW" >> $SNAP/output/cron.log 2>&1
0 10 * * 1,4   cd $SNAP/workspaces/tiktok-content && claude -p "Sediakan 5 idea video baru dan cadangkan slot." --permission-mode dontAsk --allowedTools "$ALLOW" >> $SNAP/output/cron.log 2>&1
30 8 * * 1     cd $SNAP/workspaces/marketing-report && claude -p "Sediakan laporan prestasi TikTok minggu lepas." --permission-mode dontAsk --allowedTools "$ALLOW" >> $SNAP/output/cron.log 2>&1
*/30 9-20 * * * cd $SNAP/workspaces/bookings && claude -p "Semak tempahan baru dari katalog." --permission-mode dontAsk --allowedTools "$ALLOW" >> $SNAP/output/cron.log 2>&1
```

Nota:
- Gunakan `which claude` untuk mendapat laluan penuh `claude` jika cron tidak menjumpainya.
- Komputer mesti hidup dan anda mesti sudah log masuk ke Claude Code (`claude` sekali secara manual).
- Pastikan `npm start` sedang berjalan supaya anda boleh melihat pasukan dalam office dan meluluskan cadangan.

### Windows (Task Scheduler)

Buka *Command Prompt* dan jalankan satu baris untuk setiap tugasan. Contoh untuk Lili jam 9 pagi:

```bat
schtasks /create /tn "SnapSense Lili" /sc daily /st 09:00 /tr "cmd /c cd /d C:\LALUAN\snapsanse-virtual\crew\workspaces\tiktok-analytics && claude -p \"Jalankan tugasan harian statistik TikTok.\" --permission-mode dontAsk --allowedTools \"Read,Write,Edit,Glob,Grep,Bash(node ../../tools/snapsense.js:*)\""
```

Untuk menghentikan sesuatu tugasan, padam baris itu daripada `crontab -e`, atau gunakan `schtasks /delete /tn "SnapSense Lili"`.
