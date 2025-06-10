/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Style } from "./style";
import * as classes from "./baseclasses"
export {
    CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint,
    ShapeFrame, Ellipse, PathSegment, OverrideType,
} from "./baseclasses"
import { ShapeType, ShapeFrame, OverrideType } from "./baseclasses"
import {Shape, SymbolShape, CornerRadius, Transform, ShapeSize} from "./shape";
import { Variable } from "./variable";
import { SymbolMgr } from "./symbolmgr";
import { PathType, RadiusType } from "./consts";
import { exportSymbolRefShape } from "./baseexport";
import { Path } from "@kcaitech/path";

function genRefId(refId: string, type: OverrideType) {
    if (type === OverrideType.Variable || type === OverrideType.TableCell) return refId;
    return refId.length > 0 ? refId + '/' + type : type;
}

export class SymbolRefShape extends Shape implements classes.SymbolRefShape {
    __symMgr?: SymbolMgr
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }
    hasSize(): boolean {
        return true;
    }
    typeId = 'symbol-ref-shape'
    private __refId: string // set 方法会进事务
    // @ts-ignore
    size: ShapeSize
    overrides?: BasicMap<string, string> // 同varbinds，只是作用域为引用的symbol对象
    variables: BasicMap<string, Variable>
    isCustomSize?: boolean
    cornerRadius?: CornerRadius
    innerEnvScale?: number
    // frameMaskDisabled?: boolean
    uniformScale?: number
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        refId: string,
        variables: BasicMap<string, Variable>,
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style
        )
        this.size = size
        this.__refId = refId
        this.variables = variables;
    }

    toJSON() { // 直接json导出没有导出refId
        return exportSymbolRefShape(this);
    }

    getOpTarget(path: string[]): any {
        if (path[0] === 'overrides' && !this.overrides) this.overrides = new BasicMap<string, string>();
        return super.getOpTarget(path);
    }

    removeVirbindsEx(key: string) {
        if (!this.overrides) return false;
        return this.overrides.delete(key);
    }

    // 由proxy实现
    get symData(): SymbolShape | undefined {
        return undefined;
    }

    onSymbolReady() {
        this.notify('symbol-ready');
    }

    get refId() {
        return this.__refId;
    }
    set refId(id: string) {
        const mgr = this.__symMgr;
        if (id !== this.__refId) {
            if (mgr) mgr.removeRef(this.__refId, this);
            this.__refId = id;
            if (mgr) mgr.addRef(id, this);
        }
    }

    __isAdded: boolean = false;
    onAdded(): void {
        this.__isAdded = true;
        const mgr = this.__symMgr;
        if (mgr) {
            mgr.addRef(this.refId, this);
        }
    }
    onRemoved(): void {
        this.__isAdded = false;
        const mgr = this.__symMgr;
        if (mgr) {
            mgr.removeRef(this.refId, this);
        }
    }

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    getImageMgr() {
        return this.__imageMgr;
    }

    setSymbolMgr(mgr: SymbolMgr) {
        this.__symMgr = mgr;
        if (mgr && this.__isAdded) {
            mgr.addRef(this.refId, this);
        }
    }
    getSymbolMgr() {
        return this.__symMgr;
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const w = frame.width;
        const h = frame.height;
        const path = [
            ["M", 0, 0],
            ["l", w, 0],
            ["l", 0, h],
            ["l", -w, 0],
            ["z"]
        ]
        return Path.fromSVGString(path.join(''));
    }

    getOverrid(refId: string, type: OverrideType): { refId: string, v: Variable } | undefined {
        refId = genRefId(refId, type); // id+type->var
        const over = this.overrides && this.overrides.get(refId);
        if (over) {
            const v = this.variables && this.variables.get(over);
            if (v) return { refId, v }
        }
    }
    getOverrid2(refId: string, type: OverrideType) {
        refId = genRefId(refId, type); // id+type->var
        return this.overrides && this.overrides.get(refId);
    }

    getVar(varId: string) {
        return this.variables && this.variables.get(varId);
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }

    get radiusType() {
        return RadiusType.Rect;
    }

    // get isImageFill() {
    //     return false;
    // }
}