# Development Setup

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Chrome (or Chromium-based browser)

## Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.

## Running in Development Mode
1. Run `npm run dev`.
2. This will start the Vite server and build the extension in watch mode.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable "Developer mode" (toggle in top right).
5. Click "Load unpacked".
6. Select the `dist` directory in the project root.
7. The extension should appear. It supports HMR (Hot Module Replacement), so changes to code should reflect immediately (or upon reopening the popup).

## Building for Production
1. Run `npm run build`.
2. The output will be in the `dist` folder, ready to be zipped and published or loaded manually.

## Directory Structure
- `src/`: Source code (React components, logic).
- `src/assets/`: Static assets.
- `docs/`: Documentation (Features, ADRs, etc.).
- `legacy_source/`: Original repository for reference.

## Project Structure (MCAF)
We follow the MCAF guidelines.
- **AGENTS.md**: Rules for AI agents.
- **docs/Features/**: Feature specifications.
- **docs/ADR/**: Architectural Decision Records.
