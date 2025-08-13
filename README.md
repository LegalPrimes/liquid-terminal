# 🫧 Liquid Terminal

![Liquid Terminal Preview](preview.gif)

> Because your terminal deserves to be as beautiful as Apple's latest liquid glass design language

## ✨ What is this?

Remember when Apple dropped that gorgeous liquid glass effect and we all collectively lost our minds? Well, your terminal was feeling left out. Not anymore.

Liquid Terminal brings that sweet, sweet gaussian blur, those crispy glass edges, and that "I can't believe it's not Apple" aesthetic right to your command line. It's like someone dipped your terminal in that fancy new Vision Pro sauce.

## 🎨 Features

- **Actual Liquid Glass™** - Not just transparent, but that proper Apple-style frosted glass with depth
- **Tabbed Interface** - Because one terminal is never enough
- **Process Tracking** - Window title shows what's actually running (mind = blown)
- **Smooth as Butter** - Elastic animations that would make Jony Ive shed a tear
- **Dark Mode Ready** - It's 2025, of course it works in dark mode

## 🚀 Installation

### Download the Latest Release

Head over to the [Releases](https://github.com/pontus-devoteam/liquid-terminal/releases) page and grab the latest `.dmg` for macOS.

#### ⚠️ macOS Security Notice

The app is unsigned (because Apple charges $99/year for the privilege). Here's how to open it:

**Option 1 - Right-click method (Recommended):**
1. Right-click (or Control-click) on Liquid Terminal.app
2. Select "Open" from the context menu
3. Click "Open" in the dialog that appears

**Option 2 - System Preferences:**
1. Try to open the app normally (it will be blocked)
2. Go to System Preferences → Privacy & Security
3. Click "Open Anyway" next to the message about Liquid Terminal

**Option 3 - Terminal (if nothing else works):**
```bash
xattr -c "/Applications/Liquid Terminal.app"
```

### Build from Source

```bash
# Clone this beauty
git clone https://github.com/pontus-devoteam/liquid-terminal.git
cd liquid-terminal

# Install dependencies
npm install

# Rebuild native modules for Electron
./node_modules/.bin/electron-rebuild

# Run in dev mode
npm run dev

# Or build for production
npm run build
npm start
```

## ⌨️ Keyboard Shortcuts

- `Cmd + T` - New tab (because muscle memory)
- `Cmd + W` - Close tab (careful with this one)
- `Cmd + Q` - Quit (the nuclear option)

## 🛠 Development

```bash
# Run in development mode with hot reload
npm run dev

# Type check
npm run typecheck

# Build the app
npm run build
```

## 📦 Building for Release

The app automatically builds on every push to main. Check the Actions tab for your fresh builds.

To build locally:

```bash
# Install electron-builder
npm install --save-dev electron-builder

# Build for macOS
npm run dist
```

## 🤔 Why Though?

Look, we could all use boring terminals with solid backgrounds like it's 2010. OR we could live in the future where our terminals look like they're crafted from crystallized unicorn tears. I know which timeline I want to live in.

## 🙏 Credits

- Inspired by Apple's liquid glass design language
- Built with [Electron](https://www.electronjs.org/)
- Terminal powered by [xterm.js](https://xtermjs.org/)
- PTY magic courtesy of [node-pty](https://github.com/microsoft/node-pty)

## 📝 License

MIT - Go wild, make it prettier, share the love.

---

*Made with 🫧 and an unhealthy obsession with Apple's design team*
