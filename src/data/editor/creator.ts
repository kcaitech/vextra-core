import { guid } from "@/basic/guid";
import { Artboard } from "@/data/data/artboard";
import { Page } from "@/data/data/page";
import { ExportOptions, ShapeFrame, GroupShape, ShapeType, BoolOp, Shape } from "@/data/data/shape";
import { BorderOptions, ContextSettings, BlendMode, Style, MarkerType, WindingRule } from "@/data/data/style";

export class Creator {

    newGroupShape(): GroupShape { // todo
        // 1、新建一个GroupShape
        const exportOptions = new ExportOptions();
        const frame = new ShapeFrame(0, 0, 0, 0,); // todo
        const borderOptions = new BorderOptions();
        const contextSettings = new ContextSettings(BlendMode.Mode0, 0);
        const style = new Style(MarkerType.Type0, 0, MarkerType.Type0, WindingRule.Rule0, blur, borderOptions, [], contextSettings, [], [], []);
        const gshape = new GroupShape(undefined, ShapeType.Group, "group", guid(), BoolOp.None, exportOptions, frame, style);
        return gshape;
    }
    newShape(): Shape {
        throw new Error("Method not implemented.");
    }
    newPage(): Page {
        throw new Error("Method not implemented.");
    }
    newArtboard(): Artboard {
        throw new Error("Method not implemented.");
    }
    // newRectShape(): RectShape {
    //     throw new Error("Method not implemented.");
    // }
}