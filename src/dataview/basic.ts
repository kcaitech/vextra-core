import { Border, BorderPosition, Path, SymbolRefShape, SymbolShape } from "../data";
import { ShapeView } from "./shape";
import { gPal, IPalPath } from "../basic/pal";

export { findVar, findOverride, findOverrideAndVar } from "../data/utils"

export function stringh(tag: string, attrs?: any, childs?: Array<string> | string): string;
export function stringh(tag: string, childs?: Array<string> | string): string;
export function stringh(...args: any[]): string {
    const tag = args[0];
    let attrs = args[1];
    let childs = args[2];
    if (args.length === 3) {
        //
    } else if (args.length === 2) {
        if (Array.isArray(args[1])) {
            attrs = undefined;
            childs = args[1];
        }
    } else {
        throw new Error("args err!");
    }

    if (typeof tag !== 'string') {
        throw new Error("not support:" + tag);
    } else if (tag.length === 0) {
        throw new Error("tag is empty");
    }

    let ret = '<' + tag;
    if (attrs) for (let a in attrs) {
        const attr = attrs[a];
        if (a === 'style') {
            let style = ""
            for (let b in attr) {
                if (attr[b] !== undefined) style += b + ':' + attr[b] + ';';
            }
            ret += ' ' + a + '="' + style + '"';
        } else {
            if (attr !== undefined) ret += ' ' + a + '="' + attr + '"';
        }
    }
    ret += '>';
    if (!childs) {
        // 
    } else if (Array.isArray(childs)) for (let i = 0, len = childs.length; i < len; i++) {
        ret += childs[i];
    }
    else if (typeof childs === 'string') {
        ret += childs;
    } else {
        throw new Error("unknow childs:" + childs);
    }
    ret += '</' + tag + '>';
    return ret;
}

export function genid(shapeId: string,
                      varsContainer: (SymbolRefShape | SymbolShape)[]) {
    if (varsContainer.length > 0) {
        let id = "";
        for (let i = 0, len = varsContainer.length; i < len; ++i) {
            const container = varsContainer[i];
            if (container instanceof SymbolRefShape) {
                if (id.length > 0) id += '/';
                id += container.id;
            }
        }
        if (id.length > 0) {
            return id + '/' + shapeId;
        }
    }
    return shapeId;
}

export function getShapeViewId(shapeId: string,
                               varsContainer?: (SymbolRefShape | SymbolShape)[]) {
    if (varsContainer) return genid(shapeId, varsContainer);
    return shapeId;
}

export function borders2path(shape: ShapeView, borders: Border[]): Path {
    // 还要判断边框的位置
    let insidewidth = 0;
    let outsidewidth = 0;

    borders.forEach((b) => {
        if (!b.isEnabled) return;
        const sideSetting = b.sideSetting;
        // todo
        const thickness = (sideSetting.thicknessBottom + sideSetting.thicknessLeft + sideSetting.thicknessTop + sideSetting.thicknessRight) / 4;
        if (b.position === BorderPosition.Center) {
            insidewidth = Math.max(insidewidth, thickness / 2);
            outsidewidth = Math.max(outsidewidth, thickness / 2);
        } else if (b.position === BorderPosition.Inner) {
            insidewidth = Math.max(insidewidth, thickness);
        } else if (b.position === BorderPosition.Outer) {
            outsidewidth = Math.max(outsidewidth, thickness);
        }
    })

    if (insidewidth === 0 && outsidewidth === 0) return new Path();

    if (insidewidth === outsidewidth) {
        const path = shape.getPath();
        const p0 = gPal.makePalPath(path.toString());
        const newpath = p0.stroke({ width: (insidewidth + outsidewidth) });
        p0.delete();
        return new Path(newpath);
    }
    if (insidewidth === 0) {
        const path = shape.getPathStr();
        const p0 = gPal.makePalPath(path);
        const p1 = gPal.makePalPath(path);
        p0.stroke({ width: outsidewidth * 2 });
        p0.subtract(p1);
        const newpath = p0.toSVGString();
        p0.delete();
        p1.delete();
        return new Path(newpath);
    } else if (outsidewidth === 0) {
        const path = shape.getPathStr();
        const p0 = gPal.makePalPath(path);
        const p1 = gPal.makePalPath(path);
        // p0.dash(10, 10, 1);
        p0.stroke({ width: insidewidth * 2 });
        p0.intersection(p1);
        const newpath = p0.toSVGString();
        p0.delete();
        p1.delete();
        return new Path(newpath);
    } else {
        const path = shape.getPathStr();
        const p0 = gPal.makePalPath(path);
        const p1 = gPal.makePalPath(path);
        const p2 = gPal.makePalPath(path);

        p0.stroke({ width: insidewidth * 2 });
        p1.stroke({ width: outsidewidth * 2 });

        if (insidewidth > outsidewidth) {
            p0.intersection(p2);
        } else {
            p1.subtract(p2);
        }
        p0.union(p1);
        const newpath = p0.toSVGString();
        p0.delete();
        p1.delete();
        p2.delete();
        return new Path(newpath);
    }
}

export function border2path(shape: ShapeView, border: Border) {
    const dashPath = (p: IPalPath) => p.dash(10, 10, 1);

    const position = border.position;
    const setting = border.sideSetting;
    const isDash = border.borderStyle.gap;

    const isEven = (setting.thicknessTop + setting.thicknessRight + setting.thicknessBottom + setting.thicknessLeft) / 4 === setting.thicknessLeft;

    let __path_str = '';

    if (isEven) {
        const thickness = setting.thicknessTop;
        const path = shape.getPathStr();
        if (position === BorderPosition.Outer) {
            // const join = border.cornerType;
            const p0 = gPal.makePalPath(path);
            const p1 = gPal.makePalPath(path);
            if (isDash) dashPath(p0);
            p0.stroke({ width: thickness * 2 });
            p0.subtract(p1);
            __path_str = p0.toSVGString();
            p0.delete();
            p1.delete();
        } else if (position === BorderPosition.Center) {
            const p0 = gPal.makePalPath(path);
            if (isDash) dashPath(p0);
            p0.stroke({ width: thickness });
            __path_str = p0.toSVGString();
            p0.delete();
        } else {
            const path = shape.getPathStr();
            const p0 = gPal.makePalPath(path);
            const p1 = gPal.makePalPath(path);
            if (isDash) dashPath(p0);
            p0.stroke({ width: thickness * 2 });
            p0.intersection(p1);
            __path_str = p0.toSVGString();
            p0.delete();
            p1.delete();
        }
    } else {

    }

    return new Path(__path_str);
}