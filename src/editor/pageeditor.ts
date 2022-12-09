import { guid } from "@/basic/guid";
import { BlendMode, BorderOptions, ContextSettings, MarkerType, Style, WindingRule } from "@/data/style";
import { IPageShadow } from "@/data/ishadow";
import { Shape, GroupShape, ShapeType, BoolOp, ExportOptions, ShapeFrame } from "@/data/shape";
import { ICMD, Repository } from "@/data/transact";
import { PageSDisp } from "./sdispatcher";
import { ShapeEditor } from "./shapeeditor";

class SICMD implements ICMD {
    private __shadow: IPageShadow;
    private __parent: GroupShape;
    private __idx: number;
    private __shape: Shape;
    constructor(shadow: IPageShadow, parent: GroupShape, index: number, shape: Shape) {
        this.__shadow = shadow;
        this.__parent = parent;
        this.__idx = index;
        this.__shape = shape;
    }
    exec(): void {
        this.__shadow.insert(this.__parent, this.__idx, this.__shape);
    }
    unexec(): void {
        this.__shadow.delete(this.__shape);
    }
}
class SDCMD implements ICMD {
    private __shadow: IPageShadow;
    private __parent: GroupShape;
    private __idx: number;
    private __shape: Shape;
    constructor(shadow: IPageShadow, shape: Shape) {
        this.__shadow = shadow;
        this.__parent = shape.parent as GroupShape;
        this.__idx = this.__parent.indexOfChild(shape);
        this.__shape = shape;
    }
    exec(): void {
        this.__shadow.delete(this.__shape);
    }
    unexec(): void {
        this.__shadow.insert(this.__parent, this.__idx, this.__shape);
    }
}
class SMCMD implements ICMD {
    private __shadow: IPageShadow;
    private __parent: GroupShape;
    private __idx: number;
    private __shape: Shape;
    private __taridx: number;
    private __target: GroupShape;
    constructor(shadow: IPageShadow, shape: Shape, target: GroupShape, index: number) {
        this.__shadow = shadow;
        this.__parent = shape.parent as GroupShape;
        this.__idx = this.__parent.indexOfChild(shape);
        this.__shape = shape;
        this.__taridx = index;
        this.__target = target;
    }
    exec(): void {
        this.__shadow.move(this.__shape, this.__target, this.__taridx);
    }
    unexec(): void {
        this.__shadow.move(this.__shape, this.__parent, this.__idx);
    }
}

export class PageEditor {
    private __shadows: IPageShadow[];
    private __shadowDisp: PageSDisp;
    private __repo: Repository;
    // private __selection: Selection;
    constructor(repo: Repository, shadows: IPageShadow[]) {
        this.__repo = repo;
        this.__shadows = shadows;
        this.__shadowDisp = new PageSDisp(shadows);
        // this.__selection = selection;
    }
    group(shapes: Shape[]): boolean {
        this.__repo.start("", {});
        // 0、save shapes[0].parent？最外层shape？位置？
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;
        const saveidx = savep.indexOfChild(fshape);
        // 1、新建一个GroupShape
        const exportOptions = new ExportOptions();
        const frame = new ShapeFrame(0, 0, 0, 0,); // todo
        const borderOptions = new BorderOptions();
        const contextSettings = new ContextSettings(BlendMode.Mode0, 0);
        const style = new Style(MarkerType.Type0, 0, MarkerType.Type0, WindingRule.Rule0, blur, borderOptions, [], contextSettings, [], [], []);
        const gshape = new GroupShape(undefined, ShapeType.Group, "group", guid(), BoolOp.None, exportOptions, frame, style);
        // 4、将GroupShape加入到save parent中
        savep.addChildAt(gshape, saveidx);
        this.__shadowDisp.insert(savep, saveidx, gshape);
        this.__repo.push(new SICMD(this.__shadowDisp, savep, saveidx, gshape));
        // 2、将shapes里对象从parent中退出
        // 3、将shapes里对象插入新建的GroupShape
        for (let i = 0, len = shapes.length; i < len; i++) {
            const s = shapes[i];
            const p = s.parent as GroupShape;
            p.removeChild(s);
            gshape.addChild(s);
            this.__shadowDisp.move(s, gshape, i);
            this.__repo.push(new SMCMD(this.__shadowDisp, s, gshape, i));
        }
        this.__repo.commit({});
        return true;
    }
    ungroup(shape: GroupShape): boolean {
        this.__repo.start("", {});
        const savep = shape.parent as GroupShape;
        let saveidx = savep.indexOfChild(shape);
        for (let len = shape.childsCount; len > 0; len--) {
            const s = shape.getChildByIndex(0);
            shape.removeChildAt(s, 0);
            savep.addChildAt(s, saveidx);
            this.__shadowDisp.move(s, savep, saveidx);
            this.__repo.push(new SMCMD(this.__shadowDisp, s, savep, saveidx));
            saveidx++;
        }
        savep.removeChild(shape);
        this.__shadowDisp.delete(shape);
        this.__repo.push(new SDCMD(this.__shadowDisp, shape));
        // todo: update frame
        this.__repo.commit({});
        return true;
    }

    addShadow(shadow: IPageShadow) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IPageShadow) {
        const index = this.__shadows.indexOf(shadow);
        if (index >= 0) {
            this.__shadows.splice(index, 1);
        }
    }
    delete(shape: Shape): boolean {
        this.__shadows.forEach((s) => {
            s.delete(shape);
        })
        throw new Error("Method not implemented.");
    }
    insert(parent: GroupShape, index: number, shape: Shape): boolean {
        this.__shadows.forEach((s) => {
            s.insert(parent, index, shape);
        })
        throw new Error("Method not implemented.");
    }
    create(parent: GroupShape, type: string): Shape {
        throw new Error("Method not implemented.");
    }
    move(shape: Shape, target: GroupShape, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(shape, target, index);
        })
        throw new Error("Method not implemented.");
    }
    editorFor(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__repo, this.__shadowDisp);
    }
}