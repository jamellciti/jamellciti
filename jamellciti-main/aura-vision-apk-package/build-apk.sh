#!/bin/bash
echo "🚀 Aura Vision APK Builder"
echo "=========================="

# Check if we're in the right directory
if [ ! -d "android" ]; then
    echo "❌ Error: android/ directory not found"
    echo "Please run this script from the aura-vision-apk-package directory"
    exit 1
fi

# Set Java environment
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export ANDROID_SDK_ROOT=$HOME/Android/Sdk

echo "☕ Java Home: $JAVA_HOME"
echo "📱 Android SDK: $ANDROID_SDK_ROOT"

cd android

# Make gradlew executable
chmod +x gradlew

echo "🔨 Building debug APK..."
./gradlew assembleDebug

if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📱 Location: android/app/build/outputs/apk/debug/app-debug.apk"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
else
    echo "❌ APK build failed. Check the logs above."
fi
