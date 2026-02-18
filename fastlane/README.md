# Fastlane Setup

This document explains how to set up and use Fastlane for automated builds and deployments.

## Prerequisites

- Ruby 2.6+ (macOS comes with Ruby)
- Xcode (for iOS builds)
- Android SDK (for Android builds)
- Bundler: `gem install bundler`

## Installation

```bash
# From project root
bundle install
```

## Configuration

### 1. Environment Variables

Copy the template and fill in your values:

```bash
cp fastlane/.env.default fastlane/.env
```

### 2. iOS Code Signing (Match)

Match uses a private git repository to store certificates and profiles.

**First-time setup (run once per team):**

```bash
# Create certificates for App Store/TestFlight
bundle exec fastlane match appstore

# Create certificates for development
bundle exec fastlane match development
```

**On a new machine:**

```bash
# Download existing certificates (readonly mode)
bundle exec fastlane match appstore --readonly
```

### 3. Android Signing

1. Create a release keystore:

   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add to `android/gradle.properties`:

   ```properties
   RELEASE_STORE_FILE=release.keystore
   RELEASE_STORE_PASSWORD=your-store-password
   RELEASE_KEY_ALIAS=release
   RELEASE_KEY_PASSWORD=your-key-password
   ```

3. Create Google Play Service Account:
   - Go to Play Console → Setup → API access → Service accounts
   - Create service account with "Release manager" permissions
   - Download JSON key and save as `fastlane/google-play-key.json`

## Available Lanes

### iOS

| Command                                  | Description                    |
| ---------------------------------------- | ------------------------------ |
| `bundle exec fastlane ios build_dev`     | Build development IPA          |
| `bundle exec fastlane ios beta`          | Build and upload to TestFlight |
| `bundle exec fastlane ios release`       | Build and upload to App Store  |
| `bundle exec fastlane ios build_release` | Build release IPA (no upload)  |
| `bundle exec fastlane ios sync_certs`    | Sync certificates via Match    |

### Android

| Command                                              | Description                                 |
| ---------------------------------------------------- | ------------------------------------------- |
| `bundle exec fastlane android build_dev`             | Build debug APK                             |
| `bundle exec fastlane android build_apk`             | Build release APK                           |
| `bundle exec fastlane android build_aab`             | Build release AAB                           |
| `bundle exec fastlane android beta`                  | Build and upload to Play Store (internal)   |
| `bundle exec fastlane android release`               | Build and upload to Play Store (production) |
| `bundle exec fastlane android promote_to_production` | Promote internal to production              |

### Cross-platform

| Command                                        | Description                      |
| ---------------------------------------------- | -------------------------------- |
| `bundle exec fastlane test`                    | Run Jest tests                   |
| `bundle exec fastlane lint`                    | Run linting and type check       |
| `bundle exec fastlane install_deps`            | Install npm + CocoaPods          |
| `bundle exec fastlane bump_version type:patch` | Bump version (patch/minor/major) |

## CI/CD Integration

### GitHub Actions Example

```yaml
jobs:
  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.2"
          bundler-cache: true

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: |
          npm ci
          bundle exec fastlane install_pods

      - name: Deploy to TestFlight
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          TEAM_ID: ${{ secrets.TEAM_ID }}
          ITC_TEAM_ID: ${{ secrets.ITC_TEAM_ID }}
          MATCH_GIT_URL: ${{ secrets.MATCH_GIT_URL }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.APP_SPECIFIC_PASSWORD }}
        run: bundle exec fastlane ios beta
```

### Environment Variables for CI

Add these secrets to your CI:

**iOS:**

- `APPLE_ID` - Apple ID email
- `TEAM_ID` - Apple Developer Team ID
- `ITC_TEAM_ID` - App Store Connect Team ID
- `MATCH_GIT_URL` - Private git repo URL for certificates
- `MATCH_PASSWORD` - Encryption password for Match
- `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` - App-specific password (for 2FA)

**Android:**

- `GOOGLE_PLAY_JSON_KEY` - Base64 encoded service account JSON
- `ANDROID_KEYSTORE` - Base64 encoded release keystore
- `RELEASE_STORE_PASSWORD` - Keystore password
- `RELEASE_KEY_PASSWORD` - Key password

## Troubleshooting

### "Could not find a valid provisioning profile"

Run Match to sync certificates:

```bash
bundle exec fastlane match appstore
```

### "Build failed due to signing issues"

1. Open Xcode
2. Go to Signing & Capabilities
3. Ensure "Automatically manage signing" is OFF
4. Select the correct provisioning profile

### "Google Play API error"

1. Verify the service account has correct permissions
2. Check the JSON key file path is correct
3. Ensure the app is already set up in Play Console

## Directory Structure

```
fastlane/
├── Appfile          # App identifiers and credentials
├── Fastfile         # Lane definitions
├── Matchfile        # Match (code signing) config
├── Pluginfile       # Fastlane plugins
├── .env.default     # Environment template
├── .env             # Your local environment (gitignored)
└── README.md        # This file
```
