import { SymbolRefShape } from "../../data/symbolref";
import { Shape, ShapeType, SymbolShape } from "../../data/shape";
import { is_symbol_but_not_union } from "./other";
import { is_circular_ref2 } from "./ref_check";
import { Document } from "../../data/document";

/**
 * @description 检查是否满足迁移条件
 * @param target 计划迁移到的目标
 * @param wonder 迁移对象
 * @returns 0 满足迁移条件
 *          1 不满足：只有组件可以迁移到union里
 *          2 target、wonder都为组件且target不为union
 *          3 无法通过循环引用检查
 *          999 其他
 */
export function unable_to_migrate(document: Document, target: Shape, wonder: Shape): number {
  if (target.type === ShapeType.Symbol) {
    if (wonder.type === ShapeType.SymbolRef) {
      const wonder_from = document.symbolsMgr.getSync((wonder as SymbolRefShape).refId);
      if (!wonder_from) return 999;
      if (is_circular_ref2(wonder_from, target.id)) return 3;
    }
    if ((target as SymbolShape).isUnionSymbolShape && !is_symbol_but_not_union(wonder)) return 1;
    if (wonder.type === ShapeType.Symbol) return 2;
  }
  return 0;
}