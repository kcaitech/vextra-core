import { Fill, ShapeSize } from "../../data";

export interface IFillRender {
    painter: CanvasRenderingContext2D | Function;
    pathStr: string;
    path2D: Path2D;
    fills: Fill[];
    frame: ShapeSize;
}