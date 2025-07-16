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
 * 导入函数的代码注入配置
 * 
 * 该模块定义了在生成导入函数时需要注入的自定义代码片段。
 * 这些注入的代码主要用于：
 * 1. 设置对象管理器引用
 * 2. 注册符号和样式到相应的管理器
 * 3. 处理特殊的初始化逻辑
 */

/**
 * 代码注入定义
 * 每个节点类型可以在导入函数的不同阶段注入自定义代码
 */
export const inject: InjectDefinitions = {};

// =============================================================================
// 媒体资源相关注入
// =============================================================================

/**
 * Fill 类型需要设置图片管理器
 */
inject['Fill'] = {
    after: `if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);`
};

/**
 * TableShape 类型需要设置图片管理器
 */
inject['TableShape'] = {
    after: `if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);`
};

// =============================================================================
// 符号引用相关注入
// =============================================================================

/**
 * SymbolRefShape 类型需要设置符号管理器和图片管理器
 */
inject['SymbolRefShape'] = {
    after: `if (ctx?.document) {
        ret.setSymbolMgr(ctx.document.symbolsMgr);
        ret.setImageMgr(ctx.document.mediasMgr);
    }`
};

/**
 * SymbolShape 类型需要向符号管理器注册自身
 */
inject['SymbolShape'] = {
    after: `if (ctx?.document) {
        // const registed = ctx.document.symbolregist.get(ret.id);
        // if (!registed || registed === 'freesymbols' || registed === ctx.curPage) {
        ctx.document.symbolsMgr.add(ret.id, ret);
        // }
    }`
};

// =============================================================================
// 样式相关注入
// =============================================================================

/**
 * 样式遮罩相关类型需要向样式管理器注册
 */
const STYLE_MASK_TYPES = [
    'FillMask',
    'ShadowMask',
    'BlurMask',
    'BorderMask',
    'RadiusMask',
    'TextMask'
] as const;

// 为所有样式遮罩类型设置相同的注入逻辑
STYLE_MASK_TYPES.forEach(maskType => {
    inject[maskType] = {
        after: `if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);`
    };
});

// =============================================================================
// 文本和样式管理器相关注入
// =============================================================================

/**
 * Style 类型需要设置样式管理器
 */
inject['Style'] = {
    after: `if (ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);`
};

/**
 * Text 类型需要设置样式管理器
 */
inject['Text'] = {
    after: `if (ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);`
};
