# Aura Vision Android APK - Build Instructions

## 📱 App Information
- **App Name**: Aura Vision - Smart City Operations
- **Package ID**: com.auravision.app  
- **Version**: 1.0.0
- **Target Android**: API 33 (Android 13)
- **Min Android**: API 21 (Android 5.0)

## 🚀 Features Included
✅ Smart City IoT Traffic Monitoring Dashboard
✅ Real-time Event Detection & Clustering
✅ Live Interactive Map (MapLibre GL)
✅ KPI Dashboard with Enforcement Metrics
✅ Work Order Management System
✅ Citation Tracking & Video Review
✅ JWT Authentication System
✅ WebSocket Real-time Updates
✅ Mobile-Optimized Responsive UI
✅ PWA Support with Offline Capability
✅ 9 Event Types (including 4 new enforcement types)

## 🛠️ Build Options

### Option 1: Android Studio (Recommended)
1. Install Android Studio
2. Open the `android/` folder as an Android project
3. Sync project with Gradle files
4. Build > Generate Signed Bundle/APK > APK
5. Choose debug or release build

### Option 2: Command Line
```bash
cd android/
./gradlew assembleDebug    # For debug APK
./gradlew assembleRelease  # For release APK
```

### Option 3: Online APK Builders
- Use services like ApkOnline, BuildApk.online
- Upload the android/ folder as source
- Configure build settings
- Download generated APK

## 📁 Package Contents
- `android/` - Complete Android Studio project
- `build/` - React app production build
- `capacitor.config.ts` - Capacitor configuration
- `package.json` - Node dependencies info

## 🔧 Prerequisites
- Java JDK 11 or higher
- Android SDK (API 33)
- Gradle 7.4+
- Node.js (for modifications)

## 📋 App Credentials (for demo)
- **Email**: admin@aura.vision
- **Password**: demo123

## 🌐 Backend URL
The app is configured to connect to:
`https://64fd6267-0033-41b0-9cf5-16f4e283c680.preview.emergentagent.com`

## 🎯 Expected APK Size
- Debug APK: ~15-25 MB
- Release APK: ~8-15 MB

## ✅ Build Verification
After building, the APK should:
1. Install on Android 5.0+ devices
2. Display Aura Vision splash screen  
3. Show mobile-optimized login page
4. Connect to backend services
5. Display all dashboard features
