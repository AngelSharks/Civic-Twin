# Civic Twin | Offline & Remote Deployment Guide

This guide provides instructions for deploying the **Civic Twin** platform in offline environments or on remote servers using standard package managers.

## 1. System Dependencies

Ensure the following are installed on your server:
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** or **pnpm**

## 2. Installation

### Quick Remote Installation
If the server has internet access initially, run:
```bash
npm install
npm run build
```

### Offline Installation
For true offline environments:
1. Run `npm install` on a machine with internet access.
2. Archive the entire project directory including `node_modules`.
3. Transfer the archive to the offline server and extract it.

## 3. Core Dependencies

The following packages are bundled and managed locally to ensure zero reliance on external CDNs:

| Package | Purpose |
| :--- | :--- |
| `react` / `react-dom` | Core UI Framework |
| `leaflet` | Mapping & GIS Engine |
| `leaflet.heat` | Heatmap Visualization |
| `lucide-react` | Professional Icon Suite |
| `motion` | Fluid Animations & Transitions |
| `@google/genai` | Gemini AI Integration |
| `tailwindcss` | Utility-first Styling |

## 4. Configuration

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

## 5. Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm run preview
```

---
*Provisioned via Civic Twin Architecture*
