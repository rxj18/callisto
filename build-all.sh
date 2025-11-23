#!/bin/bash
# Callisto Multi-Platform Build Script
# Builds the application for the current platform and organizes outputs

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION=$(node -p "require('./package.json').version")
BUILD_DIR="./builds"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Print header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Callisto Multi-Platform Build Script              ║${NC}"
echo -e "${BLUE}║                     Version: $VERSION                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

echo -e "${GREEN}✓${NC} Detected OS: ${YELLOW}$OS${NC}"
echo ""

# Create build directory structure
echo -e "${BLUE}📁 Creating build directory structure...${NC}"
mkdir -p "$BUILD_DIR/$OS/v$VERSION"
mkdir -p "$BUILD_DIR/latest"
echo -e "${GREEN}✓${NC} Build directories created"
echo ""

# Clean previous builds for this platform
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf src-tauri/target/release/bundle
echo -e "${GREEN}✓${NC} Cleaned"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
    echo ""
fi

# Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
pnpm run build
echo -e "${GREEN}✓${NC} Frontend built"
echo ""

# Build Tauri app
echo -e "${BLUE}🚀 Building Tauri app for $OS...${NC}"
echo -e "${YELLOW}   This may take several minutes...${NC}"
pnpm tauri build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Tauri build completed"
    echo ""
else
    echo -e "${RED}✗${NC} Build failed!"
    exit 1
fi

# Copy builds to organized directory
echo -e "${BLUE}📦 Organizing build artifacts...${NC}"

case "$OS" in
    "macos")
        # macOS builds
        if [ -d "src-tauri/target/release/bundle/dmg" ]; then
            cp src-tauri/target/release/bundle/dmg/*.dmg "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            cp src-tauri/target/release/bundle/dmg/*.dmg "$BUILD_DIR/latest/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied DMG files"
        fi
        if [ -d "src-tauri/target/release/bundle/macos" ]; then
            cp -r src-tauri/target/release/bundle/macos/*.app "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied .app bundle"
        fi
        ;;
    
    "linux")
        # Linux builds
        if [ -d "src-tauri/target/release/bundle/deb" ]; then
            cp src-tauri/target/release/bundle/deb/*.deb "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            cp src-tauri/target/release/bundle/deb/*.deb "$BUILD_DIR/latest/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied DEB packages"
        fi
        if [ -d "src-tauri/target/release/bundle/appimage" ]; then
            cp src-tauri/target/release/bundle/appimage/*.AppImage "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            cp src-tauri/target/release/bundle/appimage/*.AppImage "$BUILD_DIR/latest/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied AppImage"
        fi
        if [ -d "src-tauri/target/release/bundle/rpm" ]; then
            cp src-tauri/target/release/bundle/rpm/*.rpm "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            cp src-tauri/target/release/bundle/rpm/*.rpm "$BUILD_DIR/latest/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied RPM packages"
        fi
        ;;
    
    "windows")
        # Windows builds
        if [ -d "src-tauri/target/release/bundle/msi" ]; then
            cp src-tauri/target/release/bundle/msi/*.msi "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            cp src-tauri/target/release/bundle/msi/*.msi "$BUILD_DIR/latest/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied MSI installers"
        fi
        if [ -d "src-tauri/target/release/bundle/nsis" ]; then
            cp src-tauri/target/release/bundle/nsis/*.exe "$BUILD_DIR/$OS/v$VERSION/" 2>/dev/null || true
            cp src-tauri/target/release/bundle/nsis/*.exe "$BUILD_DIR/latest/" 2>/dev/null || true
            echo -e "${GREEN}✓${NC} Copied NSIS installers"
        fi
        ;;
esac

echo ""

# Create build info file
cat > "$BUILD_DIR/$OS/v$VERSION/BUILD_INFO.txt" << EOF
Callisto v$VERSION
Built on: $(date)
Platform: $OS
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
EOF

echo -e "${GREEN}✓${NC} Created build info file"
echo ""

# Calculate sizes
echo -e "${BLUE}📊 Build Summary:${NC}"
echo -e "${YELLOW}─────────────────────────────────────────────────────────────${NC}"
echo -e "Version:     ${GREEN}v$VERSION${NC}"
echo -e "Platform:    ${GREEN}$OS${NC}"
echo -e "Output Dir:  ${GREEN}$BUILD_DIR/$OS/v$VERSION${NC}"
echo ""
echo -e "Artifacts:"
ls -lh "$BUILD_DIR/$OS/v$VERSION" | tail -n +2 | awk '{printf "  • %-40s %8s\n", $9, $5}'
echo -e "${YELLOW}─────────────────────────────────────────────────────────────${NC}"
echo ""

# Success message
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✓ BUILD SUCCESSFUL!                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Build artifacts stored in: ${BLUE}$BUILD_DIR/$OS/v$VERSION${NC}"
echo -e "Latest builds also copied to: ${BLUE}$BUILD_DIR/latest${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Test the build: Open the installer from the builds directory"
echo -e "  2. Distribute: Share files from ${BLUE}$BUILD_DIR/$OS/v$VERSION${NC}"
echo -e "  3. Release: Tag this version with ${GREEN}git tag v$VERSION${NC}"
echo ""

