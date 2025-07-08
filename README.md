# Vextra Core

[![npm version](https://badge.fury.io/js/%40kcdesign%2Fdata.svg)](https://badge.fury.io/js/%40kcdesign%2Fdata)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

一个强大的设计工具核心库，提供完整的设计文档数据处理、渲染和编辑功能。

## 项目简介

Vextra Core (@kcdesign/data) 是由 KCai Technology 开发的高性能设计工具核心库，为现代设计工具提供底层数据结构和处理能力。该库支持多种设计格式的导入导出，包含完整的图形渲染、样式管理、编辑操作等功能。

## 主要特性

### 🎨 多格式支持
- **Figma** - 完整的 Figma 文档导入导出
- **Sketch** - 支持 Sketch 文档解析和转换
- **SVG** - 矢量图形导入导出
- **图像格式** - PNG、JPG、PDF 等多种导出格式

### 🧩 丰富的图形类型
- 矢量图形：路径、多边形、椭圆、星形
- 文本处理：富文本、字体样式、布局
- 符号系统：组件、实例、变量
- 布局组件：表格、自动布局、约束系统

### 🎯 完整的样式系统
- 填充：纯色、渐变、图像填充
- 描边：多种描边样式、虚线、端点样式
- 效果：阴影、模糊、滤镜效果
- 变换：旋转、缩放、倾斜变换

### 🚀 高性能架构
- TypeScript 开发，提供完整类型支持
- 模块化设计，支持按需导入
- 高效的数据结构和算法
- 支持浏览器和 Node.js 环境

## 安装

```bash
npm install @kcdesign/data
```

## 快速开始

### 基本使用

```typescript
import { Document, Page, RectShape } from '@kcdesign/data';

// 创建文档
const document = new Document();

// 创建页面
const page = new Page();
document.addPage(page);

// 创建矩形
const rect = new RectShape();
rect.frame.size.width = 100;
rect.frame.size.height = 100;
page.addShape(rect);
```

### 导入设计文件

```typescript
import { importFigma } from '@kcdesign/data/io';

// 导入 Figma 文件
const document = await importFigma(figmaData);
```

### 渲染到画布

```typescript
import { CanvasRenderer } from '@kcdesign/data/render';

// 创建渲染器
const renderer = new CanvasRenderer(canvas);

// 渲染页面
renderer.render(page);
```

## 开发指南

### 环境要求

- Node.js >= 18
- TypeScript >= 5.0

### 开发模式

```bash
# 安装依赖
npm install

# 开发模式（带源码调试）
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test

# 代码检查
npm run eslint
```

### Schema 代码生成

项目使用 JSON Schema 定义数据结构，修改数据结构时：

1. 修改 `src/schema/` 目录中的 JSON Schema 文件
2. 运行 `npm run schema` 生成新的 TypeScript 类型定义

## 项目结构

```
src/
├── basic/          # 基础工具和数据结构
├── data/           # 核心数据模型
├── creator/        # 对象创建模块
├── io/             # 导入导出模块
├── render/         # 渲染引擎
├── dataview/       # 数据视图层
├── operator/       # 操作符系统
├── editor/         # 编辑器功能
├── tools/          # 工具集
├── repo/           # 仓库管理
└── schema/         # 数据结构定义
```

## 模块依赖关系

```
editor     → data + dataview + operator + io + creator
operator   → data + dataview + io + creator
dataview   → data + render + io + creator
render     → data
io         → data + creator
creator    → data
data       → basic
```

## API 文档

### 核心类

#### Document
文档根对象，管理页面、样式、符号等。

```typescript
class Document {
  pages: Page[];
  styles: Style[];
  symbols: Symbol[];
  
  addPage(page: Page): void;
  removePage(page: Page): void;
  // ...
}
```

#### Page
页面对象，包含图形层次结构。

```typescript
class Page {
  shapes: Shape[];
  guides: Guide[];
  
  addShape(shape: Shape): void;
  removeShape(shape: Shape): void;
  // ...
}
```

#### Shape
所有图形对象的基类。

```typescript
abstract class Shape {
  id: string;
  name: string;
  frame: ShapeFrame;
  style: Style;
  
  abstract render(ctx: RenderContext): void;
  // ...
}
```

### 支持的图形类型

- `RectShape` - 矩形
- `OvalShape` - 椭圆
- `PathShape` - 路径
- `TextShape` - 文本
- `GroupShape` - 组合
- `SymbolShape` - 符号
- `SymbolRefShape` - 符号引用

### 渲染系统

```typescript
import { CanvasRenderer, SVGRenderer } from '@kcdesign/data/render';

// Canvas 渲染
const canvasRenderer = new CanvasRenderer(canvas);
canvasRenderer.render(page);

// SVG 渲染
const svgRenderer = new SVGRenderer();
const svgElement = svgRenderer.render(page);
```

## 许可证

本项目使用 [AGPL-3.0 许可证](https://www.gnu.org/licenses/agpl-3.0.html)。

## 联系我们

- 官网：[https://kcaitech.com](https://kcaitech.com)
- 邮箱：support@kcaitech.com

