#!/bin/bash
echo "🚀 AURA VISION - INSTANT APK BUILDER"
echo "===================================="

# Set environment (adjust paths as needed)
export JAVA_HOME=$(dirname $(dirname $(which java)))
export ANDROID_SDK_ROOT=$HOME/Android/Sdk

echo "☕ Java: $JAVA_HOME"
echo "📱 Android SDK: $ANDROID_SDK_ROOT"

cd android

# Clean and build
echo "🧹 Cleaning project..."
./gradlew clean

echo "🔨 Building APK..."
./gradlew assembleDebug

# Check result
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ SUCCESS! APK created:"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
    echo "📲 Install this APK on your Android device!"
else
    echo "❌ Build failed. Try using Android Studio instead."
fi
