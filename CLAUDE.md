# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server on http://localhost:5173
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Architecture

This is an interactive 3D web application that showcases multiple immersive worlds using the integration of three key technologies.

### Core Technology Stack
- **Spark** (@sparkjsdev/spark v0.1.2): Gaussian Splat rendering for photorealistic environments
- **Rapier Physics** (@dimforge/rapier3d-compat v0.12.0): WebAssembly-based physics simulation
- **Three.js** (v0.174.0): 3D graphics engine for traditional mesh rendering and scene management
- **Vite** (v4.5.0): Build tool and development server

### Application Structure

The project consists of multiple world experiences, each contained in its own JavaScript file (~485 lines each):

**Available Worlds:**
- **Cooper Station** (`cooper-station.js/html`) - Massive rotating space station from Interstellar
- **Rome** (`rome.js/html`) - Ancient city of Rome exploration
- **Ancient World** (`ancient.js/html`) - Historical ancient civilization environments
- **Mountain World** (`mountain.js/html`) - Natural mountain landscapes and valleys
- **Underground** (`dis1.js/html`) - Subterranean exploration experience

**Main Entry Point:**
- **index.html** - Landing page with world selection interface featuring responsive design and smooth transitions

### Core System Architecture

Each world application implements:

1. **Physics World Setup**: Rapier physics initialization with:
   - Configurable gravity systems
   - Collision detection with environment geometry
   - Player capsule collider with radius and height scaling

2. **Dual Rendering Pipeline**:
   - Gaussian splat rendering (.spz files) for photorealistic environments using Spark
   - Traditional Three.js mesh rendering for collision geometry and debug visualization
   - Seamless switching between modes via debug toggle

3. **First-Person Control System**:
   - PointerLockControls for mouse look
   - WASD movement with physics-based collision
   - R/F for vertical movement, Space for jumping
   - M key for debug mode toggle

4. **Asset Management**:
   - Asynchronous loading of Gaussian splat files (.spz)
   - Environment-specific scaling and positioning
   - Error handling and loading states

### Key Integration Points

- **Physics-Visual Synchronization**: Real-time sync between Rapier physics bodies and Three.js visual representations
- **Collision Detection**: Environment collision using player capsule colliders
- **Debug Visualization**: Toggle between photorealistic splats and wireframe collision geometry
- **Responsive Controls**: Pointer lock integration with smooth camera movement

### Configuration System

Each world uses a CONFIG object that centralizes:
- Physics constants (gravity, restitution, movement speeds)
- Asset file paths and scaling factors (.spz files)
- Player collision parameters (radius, height, eye height)
- World-specific scaling factors

### Build Configuration

**Vite Configuration (vite.config.js):**
- Cross-origin isolation headers (required for SharedArrayBuffer/Rapier WASM)
- Manual chunk splitting for performance optimization
- Rapier exclusion from dependency pre-bundling
- ESNext target for modern JavaScript features

**Netlify Configuration (netlify.toml):**
- WASM MIME type configuration
- Cross-origin headers for all routes
- SPA fallback routing to index.html
- Node.js 18 build environment

### File Structure
```
├── index.html              # Main world selection interface
├── cooper-station.html     # Cooper Station world entry
├── rome.html              # Rome world entry
├── ancient.html           # Ancient world entry
├── mountain.html          # Mountain world entry
├── dis1.html              # Underground world entry (maps to "underground")
├── src/
│   ├── cooper-station.js  # Cooper Station implementation
│   ├── rome.js           # Rome world implementation
│   ├── ancient.js        # Ancient world implementation
│   ├── mountain.js       # Mountain world implementation
│   └── dis1.js           # Underground world implementation
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite build configuration
└── netlify.toml         # Netlify deployment configuration
```

### Deployment Notes

- Configured for Netlify deployment with proper WASM MIME types
- Cross-origin isolation headers required for WebAssembly threads
- Large Gaussian splat asset files (.spz) require proper CDN delivery
- Each world is a separate entry point accessible via direct HTML files