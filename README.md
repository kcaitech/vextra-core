# Vextra Core

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A powerful design tool core library that provides complete design document data processing, rendering, and editing capabilities.

## Project Overview

Vextra Core (@kcdesign/data) is a high-performance design tool core library developed by [KCai Technology](https://kcaitech.com), providing underlying data structures and processing capabilities for modern design tools. The library supports import and export of various design formats, including complete graphic rendering, style management, editing operations, and more.

## Key Features

### 🎨 Multi-format Support
- **Figma** - Complete Figma document import and export
- **Sketch** - Support for Sketch document parsing and conversion
- **SVG** - Vector graphics import and export
- **Image Formats** - PNG, JPG and other export formats

### 🧩 Rich Graphics Types
- Vector graphics: paths, polygons, ellipses, stars
- Text processing: rich text, font styles, layout
- Symbol system: components, instances, variables
- Layout components: auto layout, constraint systems

### 🎯 Complete Style System
- Fills: solid colors, gradients, image fills
- Strokes: various stroke styles, dashed lines, cap styles
- Effects: shadows, blur, filter effects
- Transforms: rotation, scaling, skew transforms

### 🚀 High-Performance Architecture
- Developed with TypeScript, providing complete type support
- Modular design, supports on-demand imports
- Efficient data structures and algorithms
- Supports both browser and Node.js environments

## Installation

```bash
npm install @kcdesign/data
```

## Quick Start

### Import Design Files

```typescript
import { IO } from '@kcdesign/data';
// Import Figma file
const document = await IO.importFigma(figmaData);
```

For more examples, see [examples directory](examples/)

## Development Guide

### Requirements

- Node.js >= 18
- TypeScript >= 5.0

### Development Mode

```bash
# Install dependencies
npm install

# Development mode (with source debugging)
npm run dev

# Build production version
npm run build

# Run tests
npm run test

# Code linting
npm run eslint
```

### Schema Code Generation

The project uses JSON Schema to define data structures. When modifying data structures:

1. Modify JSON Schema files in the `src/schema/` directory
2. Run `npm run schema` to generate new TypeScript type definitions

## Project Structure

```
src/
├── basic/          # Basic utilities and data structures
├── data/           # Core data models
├── creator/        # Object creation module
├── io/             # Import/export module
├── render/         # Rendering engine
├── dataview/       # Data view layer
├── operator/       # Operator system
├── editor/         # Editor functionality
├── repo/           # Repository management
└── schema/         # Data structure definitions
```

## Module Dependencies

```
editor     → data + dataview + operator + io + creator
operator   → data + dataview + io + creator
dataview   → data + render + io + creator
render     → data
io         → data + creator
creator    → data
data       → basic
```

## License

This project is licensed under the [AGPL-3.0 License](https://www.gnu.org/licenses/agpl-3.0.html).

## Contact Us

- Website: [https://kcaitech.com](https://kcaitech.com)
- Email: support@kcaitech.com

