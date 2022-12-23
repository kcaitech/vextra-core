import { ExportOptions, ShapeFrame } from "@/data/shape";
import { Color } from "@/data/style";

export function exportFrame(frame: ShapeFrame) {
    return '{'
        + '"x":' + frame.x
        + ',"y":' + frame.y
        + ',"w":' + frame.width
        + ',"h":' + frame.height
    + '}'
}

export function exportExportOptions(exOpt: ExportOptions) {
    return '{'
    + '}'
}

export function exportColor(color: Color) {
    return '{'
        + '"a":' + color.alpha
        + ',"r":' + color.red
        + ',"g":' + color.green
        + ',"b":' + color.blue
    + '}'
}