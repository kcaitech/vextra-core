import { GroupShape } from "./shape";
import { Color } from "./style";
import { AtomGroup } from "./transact";

@AtomGroup
export class Artboard extends GroupShape {
    private m_hasBackgroundColor: boolean = false;
    private m_includeBackgroundColorInExport: boolean = false;
    private m_backgroundColor: Color = new Color(0, 0, 0, 1);

    get backgroundColor(): Color {
        return this.m_backgroundColor;
    }
    set backgroundColor(color: Color) {
        this.m_backgroundColor = color;
    }

    get hasBackgroundColor(): boolean {
        return this.m_hasBackgroundColor;
    }
    set hasBackgroundColor(has: boolean) {
        this.m_hasBackgroundColor = has;
    }

    get includeBackgroundColorInExport(): boolean {
        return this.m_includeBackgroundColorInExport;
    }
    set includeBackgroundColorInExport(inc: boolean) {
        this.m_includeBackgroundColorInExport = inc;
    }
}