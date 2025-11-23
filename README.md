# Callisto - API Testing Client

A modern, lightweight API testing client built with Tauri, React, and TypeScript.

## Features

- 🎨 **Dynamic Theming** - 8 accent colors with dark theme
- 📝 **Code Editor** - Built-in editor with syntax highlighting and linting (JSON, HTML, XML, JavaScript)
- 🔍 **Search & Replace** - Full-featured search and replace in the editor (Ctrl+F, Ctrl+H)
- 📊 **Query Parameters** - Postman-like query parameter management
- 🎯 **Resizable Panels** - Flexible workspace layout
- ⚡ **Lightweight** - Fast and responsive using CodeMirror 6

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Rust (for Tauri)

### Installation

```bash
# Install dependencies
pnpm install

# Install CodeMirror for the code editor
bash install-codemirror.sh
# or manually:
# pnpm add codemirror @codemirror/state @codemirror/view @codemirror/lang-json @codemirror/lang-html @codemirror/lang-xml @codemirror/lang-javascript @codemirror/lint @codemirror/search @codemirror/theme-one-dark

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Documentation

- [Theming System](./THEMING.md) - Guide to the dynamic theming system
- [Code Editor Setup](./CODEMIRROR_SETUP.md) - CodeMirror integration details

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Desktop**: Tauri 2.0
- **UI Components**: shadcn/ui (Radix UI)
- **Code Editor**: CodeMirror 6
- **Build Tool**: Vite

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
