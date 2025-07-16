# Vextra Core

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

一个强大的设计工具核心库，提供完整的设计文档数据处理、渲染和编辑功能。

## 项目简介

Vextra Core (@kcdesign/data) 是由 [KCai Technology](https://kcaitech.com) 开发的高性能设计工具核心库，为现代设计工具提供底层数据结构和处理能力。该库支持多种设计格式的导入导出，包含完整的图形渲染等功能。

## 主要特性

### 🎨 多格式支持
- **Figma** - 完整的 Figma 文档导入导出
- **Sketch** - 支持 Sketch 文档解析和转换
- **SVG** - 矢量图形导入导出
- **图像格式** - PNG、JPG等多种导出格式

### 🧩 丰富的图形类型
- 矢量图形：路径、多边形、椭圆、星形
- 文本处理：富文本、字体样式、布局
- 符号系统：组件、实例、变量
- 布局组件：自动布局、约束系统

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
npm install @kcaitech/vextra-core
```

## 示例代码

### 导入设计文件

```typescript
import { IO } from '@kcaitech/vextra-core';
// 导入 Figma 文件
const document = await IO.importFigma(figmaData);
```

更多见[examples目录](examples/)

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
└── schema/         # 数据结构定义
```

## 许可证

本项目使用 [AGPL-3.0 许可证](https://www.gnu.org/licenses/agpl-3.0.html)。

## 联系我们

- 官网：[https://kcaitech.com](https://kcaitech.com)


