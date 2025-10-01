# Android Deployment Checklist

## Required Before Google Play Store Submission:

### 1. App Icons & Assets
- Add app icons (48x48 to 512x512 px)
- Add splash screen images
- Add feature graphic (1024x500 px)

### 2. App Signing
```bash
# Generate keystore
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Build signed APK/AAB
cd android
./gradlew bundleRelease  # For AAB (recommended)
# OR
./gradlew assembleRelease  # For APK
```

### 3. Update App Info
- Update version in `capacitor.config.ts`
- Set proper app name and description
- Add privacy policy URL

### 4. Google Play Console Setup
- Create developer account ($25 one-time fee)
- Upload AAB/APK
- Add app description, screenshots
- Set pricing and distribution
- Complete content rating questionnaire

### 5. Testing
- Test on multiple devices/screen sizes
- Test offline functionality
- Test subscription flows (if applicable)

## Current App Status: ✅ READY
- ✅ Fully offline capable
- ✅ Multilingual support (20+ languages)
- ✅ Responsive design for mobile & tablet
- ✅ Capacitor configured for Android
- ✅ Menu subscription limits implemented