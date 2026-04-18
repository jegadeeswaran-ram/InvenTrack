# Kulfi ICE — InvenTrack Setup Guide

## Quick Start

### 1. Backend

```bash
cd backend
npm install
# Edit .env — set your PostgreSQL DATABASE_URL and JWT_SECRET
npx prisma db push
node prisma/seed.js
npm run dev
```

Default credentials after seed:
- Admin: `admin` / `admin123`
- Sales: `sales1` / `sales123`

---

### 2. Web Admin Panel

```bash
cd web
npm install
# Edit .env — VITE_API_URL=http://localhost:4000/api
npm run dev
```

Open http://localhost:5173

---

### 3. Flutter Mobile App

```bash
cd mobile
flutter pub get
flutter run          # for emulator/device
```

**Build Android APK:**
```bash
flutter build apk --release
# APK at: mobile/build/app/outputs/flutter-apk/app-release.apk
```

Before building for production, update `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'https://your-api.railway.app/api';
```

---

## Deployment

### Backend → Railway.app
1. Push `backend/` folder to GitHub
2. New project → Deploy from GitHub
3. Add PostgreSQL plugin → copy `DATABASE_URL`
4. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT=4000`, `NODE_ENV=production`, `WEB_ORIGIN=https://your-app.vercel.app`
5. Start command: `node src/index.js`
6. Run: `railway run npx prisma db push && railway run node prisma/seed.js`

### Web → Vercel
1. Push `web/` folder to GitHub
2. Import on vercel.com
3. Set: `VITE_API_URL=https://your-api.railway.app/api`

### Mobile APK
1. Update `baseUrl` in `lib/services/api_service.dart`
2. `flutter build apk --release`
3. Share APK via WhatsApp / Drive

---

## Monthly Cost
| Service | Cost |
|---------|------|
| Railway (API + DB) | ~₹400/month |
| Vercel (Web) | Free |
| Flutter APK | Free |
| **Total** | **~₹400/month** |
