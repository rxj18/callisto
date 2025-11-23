# 🏗️ Callisto Build Guide

Complete guide for building and distributing Callisto across multiple platforms.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Build](#quick-build)
3. [Platform-Specific Builds](#platform-specific-builds)
4. [Build Output](#build-output)
5. [Distribution](#distribution)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Integration](#cicd-integration)

---

## 🔧 Prerequisites

### Required Tools

#### All Platforms:
- **Node.js** (v18 or later)
- **pnpm** (v8 or later)
  ```bash
  npm install -g pnpm
  ```
- **Rust** (latest stable)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

#### Platform-Specific:

**macOS:**
- Xcode Command Line Tools
  ```bash
  xcode-select --install
  ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel
sudo dnf group install "C Development Tools and Libraries"
```

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)
- Install from: https://visualstudio.microsoft.com/downloads/

---

## ⚡ Quick Build

### Build for Current Platform

```bash
# Clone and setup (if not done)
git clone https://github.com/yourusername/callisto.git
cd callisto
pnpm install

# Build
pnpm run build:all
```

This will:
1. Build the frontend (React + Vite)
2. Build the Tauri backend (Rust)
3. Create platform-specific installers
4. Organize builds in `./builds/` directory

### Build Output Location

```
builds/
├── macos/
│   └── v0.1.0/
│       ├── Callisto.app
│       ├── Callisto_0.1.0_aarch64.dmg
│       ├── Callisto_0.1.0_x64.dmg
│       └── BUILD_INFO.txt
├── linux/
│   └── v0.1.0/
│       ├── callisto_0.1.0_amd64.deb
│       ├── callisto_0.1.0_amd64.AppImage
│       ├── callisto-0.1.0-1.x86_64.rpm
│       └── BUILD_INFO.txt
├── windows/
│   └── v0.1.0/
│       ├── Callisto_0.1.0_x64.msi
│       ├── Callisto_0.1.0_x64-setup.exe
│       └── BUILD_INFO.txt
└── latest/
    └── (copies of latest builds)
```

---

## 🖥️ Platform-Specific Builds

### macOS

#### Build on macOS:
```bash
# Make script executable (first time only)
chmod +x build-all.sh

# Build
./build-all.sh
```

#### Output Formats:
- **DMG** (`.dmg`) - Disk Image for easy installation
- **APP** (`.app`) - Application bundle

#### Architecture Support:
- Intel (x86_64)
- Apple Silicon (aarch64)
- Universal Binary (both architectures)

#### Code Signing (for distribution):
```bash
# Sign the app
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" \
  builds/macos/v0.1.0/Callisto.app

# Notarize (requires Apple Developer account)
xcrun notarytool submit builds/macos/v0.1.0/Callisto_0.1.0_x64.dmg \
  --apple-id "your@email.com" \
  --team-id "YOUR_TEAM_ID" \
  --password "app-specific-password"
```

---

### Linux

#### Build on Linux:
```bash
# Make script executable (first time only)
chmod +x build-all.sh

# Build
./build-all.sh
```

#### Output Formats:
- **DEB** (`.deb`) - Debian/Ubuntu packages
- **RPM** (`.rpm`) - Fedora/RHEL packages
- **AppImage** (`.AppImage`) - Universal Linux binary

#### Installation:

**DEB:**
```bash
sudo dpkg -i builds/linux/v0.1.0/callisto_0.1.0_amd64.deb
sudo apt-get install -f  # Fix dependencies if needed
```

**RPM:**
```bash
sudo rpm -i builds/linux/v0.1.0/callisto-0.1.0-1.x86_64.rpm
```

**AppImage:**
```bash
chmod +x builds/linux/v0.1.0/callisto_0.1.0_amd64.AppImage
./builds/linux/v0.1.0/callisto_0.1.0_amd64.AppImage
```

---

### Windows

#### Build on Windows:
```cmd
REM Run in Command Prompt or PowerShell
build-all.bat
```

Or using pnpm:
```bash
pnpm run build:windows
```

#### Output Formats:
- **MSI** (`.msi`) - Windows Installer Package
- **NSIS** (`.exe`) - Setup executable

#### Installation:
- Double-click the MSI or EXE file
- Follow the installation wizard

#### Code Signing (for distribution):
```bash
# Sign the installer (requires code signing certificate)
signtool sign /f "certificate.pfx" /p "password" /t http://timestamp.digicert.com \
  builds/windows/v0.1.0/Callisto_0.1.0_x64-setup.exe
```

---

## 📦 Build Output

### Directory Structure

```
builds/
├── macos/v0.1.0/         # macOS builds for version 0.1.0
├── linux/v0.1.0/         # Linux builds for version 0.1.0
├── windows/v0.1.0/       # Windows builds for version 0.1.0
└── latest/               # Latest builds (convenience)
```

### Build Artifacts

Each platform directory contains:
- **Installers** - Platform-specific installation packages
- **BUILD_INFO.txt** - Build metadata (version, date, commit hash)

### File Sizes (Approximate)

| Platform | Format | Size (Compressed) |
|----------|--------|-------------------|
| macOS    | DMG    | ~5-8 MB           |
| Linux    | DEB    | ~5-7 MB           |
| Linux    | AppImage | ~8-12 MB       |
| Windows  | MSI    | ~5-7 MB           |
| Windows  | EXE    | ~5-7 MB           |

---

## 📤 Distribution

### GitHub Releases (Recommended)

1. **Create a new release:**
   ```bash
   # Tag the version
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Upload builds:**
   - Go to GitHub → Releases → Draft a new release
   - Upload files from `builds/` directory
   - Add release notes

3. **Auto-update support:**
   - Tauri supports auto-updates via GitHub Releases
   - Configure in `src-tauri/tauri.conf.json`

### Direct Distribution

1. **Zip the builds:**
   ```bash
   cd builds
   zip -r callisto-v0.1.0-macos.zip macos/v0.1.0/
   zip -r callisto-v0.1.0-linux.zip linux/v0.1.0/
   zip -r callisto-v0.1.0-windows.zip windows/v0.1.0/
   ```

2. **Host on your server:**
   - Upload to your website
   - Share download links

3. **Checksums for verification:**
   ```bash
   # Generate SHA256 checksums
   cd builds
   shasum -a 256 macos/v0.1.0/* > checksums.txt
   shasum -a 256 linux/v0.1.0/* >> checksums.txt
   shasum -a 256 windows/v0.1.0/* >> checksums.txt
   ```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Build fails on macOS**

**Error:** `xcrun: error: unable to find utility "metal"`

**Solution:**
```bash
xcode-select --install
sudo xcode-select --switch /Library/Developer/CommandLineTools
```

#### 2. **Linux: Missing dependencies**

**Error:** `Package webkit2gtk-4.1 was not found`

**Solution:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel
```

#### 3. **Windows: MSVC not found**

**Error:** `error: linker link.exe not found`

**Solution:**
- Install Visual Studio Build Tools
- Or install Visual Studio Community (select "Desktop development with C++")

#### 4. **Out of disk space**

The `src-tauri/target` directory can grow large. Clean it:
```bash
pnpm run build:clean
# Or manually:
rm -rf src-tauri/target
```

#### 5. **Build is slow**

**Speed up builds:**
```bash
# Use release mode optimizations
export CARGO_PROFILE_RELEASE_LTO=false

# Parallel compilation (adjust based on CPU cores)
export CARGO_BUILD_JOBS=4
```

---

## 🤖 CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev \
            build-essential curl wget file libssl-dev \
            libayatana-appindicator3-dev librsvg2-dev

      - name: Install frontend dependencies
        run: pnpm install

      - name: Build
        run: pnpm tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}
          path: |
            src-tauri/target/release/bundle/dmg/*.dmg
            src-tauri/target/release/bundle/deb/*.deb
            src-tauri/target/release/bundle/appimage/*.AppImage
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/bundle/nsis/*.exe

      - name: Create Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📝 Build Checklist

Before distributing:

- [ ] Update version in `package.json` and `src-tauri/tauri.conf.json`
- [ ] Test build on target platform
- [ ] Run the app and verify all features work
- [ ] Check file sizes are reasonable
- [ ] Generate checksums for verification
- [ ] Code sign (macOS and Windows)
- [ ] Create release notes
- [ ] Upload to distribution platform
- [ ] Test installation on clean machine
- [ ] Update documentation with download links

---

## 🔐 Security Best Practices

1. **Code Signing:**
   - Always sign your releases
   - Users will see warnings without signing

2. **Checksums:**
   - Provide SHA256 checksums
   - Users can verify file integrity

3. **Updates:**
   - Enable auto-updates in Tauri config
   - Use HTTPS for update server

4. **Dependencies:**
   - Regularly update dependencies
   - Run `pnpm audit` before releases

---

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/building/)
- [Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos/)
- [Auto-Update Setup](https://tauri.app/v1/guides/distribution/updater/)
- [GitHub Actions for Tauri](https://github.com/tauri-apps/tauri-action)

---

## 🆘 Need Help?

- **Issues:** Open an issue on GitHub
- **Discussions:** Join the discussions
- **Tauri Discord:** https://discord.gg/tauri

---

**Happy Building! 🚀**

