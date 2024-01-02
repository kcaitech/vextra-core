import { BoolOp, GroupShape, Path, Shape, ShapeFrame, ShapeType, SymbolRefShape, SymbolShape, parsePath } from "../data/classes";
import { ShapeView } from "./shape";
import { matrix2parent } from "./shape";
import { RenderTransform } from "./basic";
import { Matrix } from "../basic/matrix";
import { EL } from "./el";
import { DataView } from "./view";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { IPalPath, gPal } from "../basic/pal";
import { TextShapeView } from "./textshape";

function opPath(bop: BoolOp, path0: IPalPath, path1: IPalPath, isIntersect: boolean): IPalPath {
    switch (bop) {
        case BoolOp.Diff:
            if (isIntersect) path0.difference(path1);
            else path0.addPath(path1);
            break;
        case BoolOp.Intersect:
            if (isIntersect) {
                path0.intersection(path1);
            }
            else {
                return gPal.makePalPath("");
            }
            break;
        case BoolOp.Subtract:
            if (isIntersect) path0.subtract(path1);
            break;
        case BoolOp.Union:
            if (!isIntersect) path0.addPath(path1)
            else path0.union(path1);
            break;
    }
    return path0;
}

function _is_intersect(frame0: ShapeFrame, frame1: ShapeFrame) {
    return !(frame0.x > frame1.x + frame1.width ||
        frame0.x + frame0.width < frame1.x ||
        frame0.y > frame1.y + frame1.height ||
        frame0.y + frame0.height < frame1.y);
}
function is_intersect(arr: ShapeFrame[], frame: ShapeFrame) {
    for (let i = 0; i < arr.length; i++) {
        if (_is_intersect(arr[i], frame)) return true;
    }
    return false;
}

class FrameGrid {
    _cellWidth: number;
    _cellHeight: number;
    _cellRowsCount: number;
    _cellColsCount: number;
    _rows: ShapeFrame[][][] = [];

    constructor(cellWidth: number, cellHeight: number, cellRowsCount: number, cellColsCount: number) {
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._cellRowsCount = cellRowsCount;
        this._cellColsCount = cellColsCount;
    }

    checkIntersectAndPush(frame: ShapeFrame): boolean {
        return this._checkIntersectAndPush(frame, false);
    }

    push(frame: ShapeFrame) {
        this._checkIntersectAndPush(frame, true);
    }

    private _checkIntersectAndPush(frame: ShapeFrame, preset: boolean): boolean {
        const xs = (frame.x);
        const xe = (frame.x + frame.width);
        const ys = (frame.y);
        const ye = (frame.y + frame.height);

        const is = Math.max(0, xs / this._cellWidth);
        const ie = Math.max(1, xe / this._cellWidth);

        for (let i = Math.floor(is); i < ie && i < this._cellColsCount; ++i) {
            const js = Math.max(0, ys / this._cellHeight);
            const je = Math.max(1, ye / this._cellHeight);
            let row = this._rows[i];
            if (!row) {
                row = [];
                this._rows[i] = row;
            }
            for (let j = Math.floor(js); j < je && j < this._cellRowsCount; ++j) {
                let cell = row[j];
                if (!preset && cell) preset = is_intersect(cell, frame);
                if (!cell) {
                    cell = [];
                    row[j] = cell;
                }
                cell.push(frame);
            }
        }
        return preset;
    }
}

function render2path(shape: ShapeView): Path {

    const shapeIsGroup = shape instanceof GroupShapeView;
    let fixedRadius: number | undefined;
    if (shapeIsGroup) fixedRadius = shape.m_fixedRadius;
    if (!shapeIsGroup || shape.m_children.length === 0) {
        const path = shape instanceof TextShapeView ? shape.getTextPath() : shape.getPath();
        return path.clone();
    }

    const cc = shape.m_children.length;
    const child0 = shape.m_children[0] as ShapeView;
    const frame0 = child0.frame;
    const path0 = render2path(child0).clone();

    if (child0.isNoTransform()) {
        path0.translate(frame0.x, frame0.y);
    } else {
        path0.transform(child0.matrix2Parent())
    }

    const pframe = shape.frame;
    const gridSize = Math.ceil(Math.sqrt(cc));

    const grid = new FrameGrid(pframe.width / gridSize, pframe.height / gridSize, gridSize, gridSize);

    grid.push(frame0);

    let joinPath: IPalPath = gPal.makePalPath(path0.toString());
    for (let i = 1; i < cc; i++) {
        const child1 = shape.m_children[i] as ShapeView;
        const frame1 = child1.frame;
        const path1 = render2path(child1).clone();
        if (child1.isNoTransform()) {
            path1.translate(frame1.x, frame1.y);
        } else {
            path1.transform(child1.matrix2Parent())
        }
        const pathop = child1.m_data.boolOp ?? BoolOp.None;
        const palpath1 = gPal.makePalPath(path1.toString());

        if (pathop === BoolOp.None) {
            grid.push(frame1);
            joinPath.addPath(palpath1);
        } else {
            const intersect = grid.checkIntersectAndPush(frame1);
            const path = opPath(pathop, joinPath, palpath1, intersect);
            if (path !== joinPath) {
                joinPath.delete();
                joinPath = path;
            }
        }
        palpath1.delete();
    }
    const pathstr = joinPath.toSVGString();
    joinPath.delete();

    let resultpath: Path | undefined;
    // radius
    if (fixedRadius && fixedRadius > 0) {
        const frame = shape.frame;
        const path = new Path(pathstr);
        const segs = path.toCurvePoints(frame.width, frame.height);
        const ps: any[] = [];
        segs.forEach((seg) => {
            ps.push(...parsePath(seg.points, !!seg.isClosed, 0, 0, frame.width, frame.height, fixedRadius));
        })
        resultpath = new Path(ps);
    }
    else {
        resultpath = new Path(pathstr);
    }
    return resultpath;
}


export class GroupShapeView extends ShapeView {

    m_isboolgroup: boolean | undefined;

    get data(): GroupShape {
        return this.m_data as GroupShape;
    }

    getBoolOp() {
        return this.data.getBoolOp();
    }

    constructor(ctx: DViewCtx, props: PropsType, isTopClass: boolean = true) {
        super(ctx, props, false);
        // super调了layout，layout中会初始化子对象
        // const childs = this.getDataChilds();
        // const childsView: DataView[] = childs.map((c) => {
        //     const comsMap = this.m_ctx.comsMap;
        //     const Com = comsMap.get(c.type) || comsMap.get(ShapeType.Rectangle)!;
        //     const props = { data: c, transx: this.m_transx, varsContainer: this.m_varsContainer, isVritual: this.m_isVirtual };
        //     const ins = new Com(this.m_ctx, props) as DataView;
        //     return ins;
        // })
        // if (childsView.length > 0) this.addChilds(childsView);
        this.m_isboolgroup = (props.data as GroupShape).isBoolOpShape;
        this._bubblewatcher = this._bubblewatcher.bind(this);
        this.m_data.bubblewatch(this._bubblewatcher);

        if (isTopClass) this.afterInit();
    }

    protected _bubblewatcher(...args: any[]) {
        if (this.m_isboolgroup) {
            // 不好判断，可能是boolop变更等
            // if (args.includes('points') || args.includes('shape-frame')) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
            this.m_ctx.setDirty(this);
            // }
        }
        this.onChildChange(...args);
    }

    protected onChildChange(...args: any[]) {
        if (args.includes('fills') || args.includes('borders')) {
            this.notify(...args); // 通知界面更新
        }
    }

    onDestory(): void {
        super.onDestory();
        this.m_data.bubbleunwatch(this._bubblewatcher);
    }

    onAddShapeData(shape: Shape): ShapeView {
        const shapeview = this.m_children.find((c) => {
            if (c.m_data.id === shape.id) {
                return true;
            }
        });
        if (shapeview) shapeview;

        const childs = this.getDataChilds();
        const idx = childs.indexOf(shape);

        if (idx < 0) {
            throw new Error('shape not found');
        }

        const props = { data: shape, varsContainer: this.varsContainer, isVirtual: this.m_isVirtual };

        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(shape.type) || comsMap.get(ShapeType.Rectangle)!;
        const dom = new Com(this.m_ctx, props) as DataView;
        this.addChild(dom, idx);

        this.m_ctx.setReLayout(dom);
        return dom as ShapeView;
    }

    getDataChilds(): Shape[] {
        return (this.m_data as GroupShape).childs;
    }

    m_need_updatechilds: boolean = false;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('childs')) {
            // this.updateChildren();
            this.m_need_updatechilds = true;
        }
        else if ((this.m_isboolgroup) !== (this.m_data as GroupShape).isBoolOpShape) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
            this.m_isboolgroup = (this.m_data as GroupShape).isBoolOpShape;
        }

        // todo boolgroup
    }

    protected _layout(shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        super._layout(shape, transform, varsContainer);
        if (this.m_need_updatechilds) {
            this.notify("childs"); // notify childs change
            this.m_need_updatechilds = false;
        }
    }

    // fills
    protected renderFills(): EL[] {
        if ((this.m_data as GroupShape).isBoolOpShape) {
            return super.renderFills();
        }
        return []; // group无fill
    }

    // borders
    protected renderBorders(): EL[] {
        if ((this.m_data as GroupShape).isBoolOpShape) {
            return super.renderBorders();
        }
        return []; // group无border
    }

    getPath() {
        if (!(this.m_data as GroupShape).isBoolOpShape) {
            return super.getPath();
        }
        if (this.m_path) return this.m_path;
        this.m_path = render2path(this);
        return this.m_path;
    }

    // childs
    protected renderContents(): EL[] {
        if ((this.m_data as GroupShape).isBoolOpShape) {
            return [];
        }
        const childs = this.m_children;
        childs.forEach((c) => c.render())
        return childs;
    }

    protected layoutChild(child: Shape, idx: number, transx: RenderTransform | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>) {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer, isVirtual: this.m_isVirtual };
        if (!cdom) {
            const comsMap = this.m_ctx.comsMap;
            const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
            cdom = new Com(this.m_ctx, props) as DataView;
            this.addChild(cdom, idx);
            return;
        }
        this.moveChild(cdom, idx);
        cdom.layout(props);
    }

    updateLayoutArgs(frame: ShapeFrame, hflip: boolean | undefined, vflip: boolean | undefined, rotate: number | undefined, radius?: number | undefined): void {
        super.updateLayoutArgs(frame, hflip, vflip, rotate, radius);
        // todo
        // if (this.m_need_updatechilds) {
        //     // this.updateChildren();
        //     this.m_need_updatechilds = false;
        // }
    }

    protected layoutOnNormal(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            // update childs
            this.layoutChild(cc, i, undefined, varsContainer, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

    layoutOnRectShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeFrame, scaleX: number, scaleY: number): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            const transform = {
                dx: 0,
                dy: 0,
                scaleX,
                scaleY,
                parentFrame: this.frame,
                vflip: false,
                hflip: false,
                rotate: 0
            }
            // update childs
            this.layoutChild(cc, i, transform, varsContainer!, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

    layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        for (let i = 0, len = childs.length; i < len; i++) { //摆正： 将旋转、翻转放入到子对象
            const cc = childs[i]
            const m1 = cc.matrix2Parent();
            m1.multiAtLeft(m);
            const target = m1.computeCoord(0, 0);
            const c_rotate = rotate + (cc.rotation || 0);
            const c_hflip = hflip ? !cc.isFlippedHorizontal : !!cc.isFlippedHorizontal;
            const c_vflip = vflip ? !cc.isFlippedVertical : !!cc.isFlippedVertical;
            const c_frame = cc.frame;
            // cc matrix2Parent
            const m2 = matrix2parent(c_frame.x, c_frame.y, c_frame.width, c_frame.height, c_rotate, c_hflip, c_vflip);
            m2.trans(bbox.x, bbox.y); // todo 使用parentFrame.x y会与rect对不齐，待研究
            const cur = m2.computeCoord(0, 0);
            const dx = target.x - cur.x;
            const dy = target.y - cur.y;
            const transform = {
                dx,
                dy,
                scaleX,
                scaleY,
                parentFrame: this.frame,
                vflip,
                hflip,
                rotate
            }
            // update childs
            this.layoutChild(cc, i, transform, varsContainer!, resue);
        }
        // 删除多余的
        this.removeChilds(childs.length, Number.MAX_VALUE).forEach((c => c.destory()));
    }

}