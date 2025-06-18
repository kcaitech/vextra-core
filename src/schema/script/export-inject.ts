/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { InjectDefinitions } from "./basic";

/**
 * 导出函数的代码注入配置
 * 
 * 该模块定义了在生成导出函数时需要注入的自定义代码片段。
 * 这些注入的代码主要用于：
 * 1. 收集导出过程中遇到的资源引用
 * 2. 处理样式遮罩的依赖关系
 * 3. 管理符号和媒体资源的引用
 */

/**
 * 代码注入定义
 * 每个节点类型可以在导出函数的不同阶段注入自定义代码
 */
export const inject: InjectDefinitions = {};

// =============================================================================
// 形状相关注入
// =============================================================================

/**
 * Shape 基类需要收集半径遮罩样式
 */
inject['Shape'] = {
    after: `if (ctx?.styles && ret.radiusMask) ctx.styles.add(ret.radiusMask);
`
};

// =============================================================================
// 符号相关注入
// =============================================================================

/**
 * SymbolShape 需要收集符号引用
 */
inject['SymbolShape'] = {
    after: `if (ctx?.symbols) ctx.symbols.add(ret.id);
`
};

/**
 * SymbolRefShape 需要收集引用的符号ID
 */
inject['SymbolRefShape'] = {
    after: `if (ctx?.refsymbols) ctx.refsymbols.add(ret.refId);
`
};

// =============================================================================
// 媒体资源相关注入
// =============================================================================

/**
 * ImageShape 需要收集图片资源引用
 */
inject['ImageShape'] = {
    after: `if (ctx?.medias) ctx.medias.add(ret.imageRef);
`
};

/**
 * Fill 需要收集图片资源引用（当填充类型为图片时）
 */
inject['Fill'] = {
    after: `if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`
};

/**
 * TableCell 需要收集图片资源引用
 */
inject['TableCell'] = {
    after: `if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`
};

// =============================================================================
// 样式相关注入
// =============================================================================

/**
 * Style 需要收集各种样式遮罩引用
 */
inject['Style'] = {
    after: `if (ctx?.styles) {
        if (ret.fillsMask) ctx.styles.add(ret.fillsMask);
        if (ret.bordersMask) ctx.styles.add(ret.bordersMask);
        if (ret.shadowsMask) ctx.styles.add(ret.shadowsMask);
        if (ret.blursMask) ctx.styles.add(ret.blursMask);
    }
`
};

/**
 * Border 需要收集填充遮罩引用
 */
inject['Border'] = {
    after: `if (ctx?.styles && ret.fillsMask) ctx.styles.add(ret.fillsMask);
`
};

// =============================================================================
// 文本相关注入
// =============================================================================

/**
 * Span 需要收集文本遮罩引用
 */
inject['Span'] = {
    after: `if (ctx?.styles && ret.textMask) ctx.styles.add(ret.textMask);
`
};

/**
 * ParaAttr 需要收集文本遮罩引用
 */
inject['ParaAttr'] = {
    after: `if (ctx?.styles && ret.textMask) ctx.styles.add(ret.textMask);`
};
