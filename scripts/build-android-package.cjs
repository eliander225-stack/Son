const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'public', 'android-package');
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

fs.mkdirSync(path.join(targetDir, 'app', 'src', 'main', 'java', 'com', 'liamp3', 'player'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'app', 'src', 'main', 'res', 'values'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi'), { recursive: true });

// 1. root build.gradle
fs.writeFileSync(path.join(targetDir, 'build.gradle'), `// Top-level build file for LiaMp3 Android
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`);

// 2. settings.gradle
fs.writeFileSync(path.join(targetDir, 'settings.gradle'), `rootProject.name = 'LiaMp3'
include ':app'
`);

// 3. app/build.gradle
fs.writeFileSync(path.join(targetDir, 'app', 'build.gradle'), `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.liamp3.player'
    compileSdk 34

    defaultConfig {
        applicationId 'com.liamp3.player'
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName '1.0.0'

        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.webkit:webkit:1.10.0'
}
`);

// 4. AndroidManifest.xml
fs.writeFileSync(path.join(targetDir, 'app', 'src', 'main', 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.LiaMp3"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:theme="@style/Theme.LiaMp3.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`);

// 5. MainActivity.java
fs.writeFileSync(path.join(targetDir, 'app', 'src', 'main', 'java', 'com', 'liamp3', 'player', 'MainActivity.java'), `package com.liamp3.player;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final String APP_URL = "https://ais-pre-d7xlwdq4inmaycfa7ensdu-894043883837.us-east1.run.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on while playing audio/videos
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Immersive Fullscreen
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl(APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`);

// 6. res/values/strings.xml & themes.xml
fs.writeFileSync(path.join(targetDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml'), `<resources>
    <string name="app_name">LiaMp3</string>
</resources>
`);

fs.writeFileSync(path.join(targetDir, 'app', 'src', 'main', 'res', 'values', 'themes.xml'), `<resources>
    <style name="Theme.LiaMp3" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="android:statusBarColor">#0a0a12</item>
        <item name="android:navigationBarColor">#0a0a12</item>
    </style>
    <style name="Theme.LiaMp3.Fullscreen" parent="Theme.LiaMp3">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
`);

// Copy icon into mipmap
const iconSrc = path.join(__dirname, '..', 'public', 'pwa-512x512.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(targetDir, 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', 'ic_launcher.png'));
}

// 7. README.md
fs.writeFileSync(path.join(targetDir, 'README.md'), `# LiaMp3 - Paquete de Proyecto Android APK

Este proyecto contiene el código fuente nativo de Android configurado para LiaMp3.

### Para compilar el APK:
1. Abre esta carpeta en **Android Studio**.
2. Ve al menú superior: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. El archivo APK resultante se generará en \`app/build/outputs/apk/debug/app-debug.apk\`.

### O desde la consola de comandos con Gradle:
\`\`\`bash
./gradlew assembleDebug
\`\`\`
`);

console.log('Android package project created successfully in:', targetDir);
