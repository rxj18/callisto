# ⚡ Quick Build Reference

## 🚀 Build Commands

### Current Platform
```bash
# Build for your current OS
pnpm run build:all

# Or use the script directly
./build-all.sh         # macOS/Linux
build-all.bat          # Windows
```

### Output Location
```
builds/
├── macos/v0.1.0/     # macOS builds
├── linux/v0.1.0/     # Linux builds
├── windows/v0.1.0/   # Windows builds
└── latest/           # Latest builds
```

---

## 📦 Platform-Specific Builds

| Platform | Command | Output Formats |
|----------|---------|----------------|
| **macOS** | `./build-all.sh` | `.dmg`, `.app` |
| **Linux** | `./build-all.sh` | `.deb`, `.rpm`, `.AppImage` |
| **Windows** | `build-all.bat` | `.msi`, `.exe` |

---

## 🎯 Common Tasks

### Clean Builds
```bash
pnpm run build:clean
```

### Build Only Tauri (skip frontend)
```bash
pnpm tauri build
```

### Development Build
```bash
pnpm dev
```

### Check Build Size
```bash
ls -lh builds/macos/v0.1.0/     # macOS
ls -lh builds/linux/v0.1.0/     # Linux
dir builds\windows\v0.1.0\      # Windows
```

---

## 📋 Pre-Build Checklist

- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Test app with `pnpm dev`
- [ ] Commit all changes
- [ ] Run build script

---

## 🐛 Quick Fixes

### Build Fails
```bash
# Clean and rebuild
pnpm run build:clean
pnpm install
pnpm run build:all
```

### Permission Denied (Linux/macOS)
```bash
chmod +x build-all.sh
```

### Out of Disk Space
```bash
# Clean Rust build cache
rm -rf src-tauri/target
```

---

## 📤 Distribution

### Create Release Package
```bash
cd builds
tar -czf callisto-v0.1.0-macos.tar.gz macos/v0.1.0/
tar -czf callisto-v0.1.0-linux.tar.gz linux/v0.1.0/
zip -r callisto-v0.1.0-windows.zip windows/v0.1.0/
```

### Generate Checksums
```bash
cd builds
shasum -a 256 */v0.1.0/* > checksums.txt
```

---

## 🔗 Full Documentation

For detailed instructions, see [BUILD_GUIDE.md](./BUILD_GUIDE.md)

---

## ⏱️ Expected Build Times

| Platform | Clean Build | Incremental |
|----------|-------------|-------------|
| macOS (M1/M2) | 3-5 min | 30-60 sec |
| macOS (Intel) | 5-8 min | 1-2 min |
| Linux | 5-8 min | 1-2 min |
| Windows | 8-12 min | 2-3 min |

*Times vary based on system specs*

---

**🎉 Happy Building!**

