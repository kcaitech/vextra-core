import { ShapeView } from "./shape";

export class LineView extends ShapeView {
    protected isNoSupportDiamondScale(): boolean {
        return true;
    }
}