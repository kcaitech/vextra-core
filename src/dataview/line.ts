import { ShapeView } from "./shape";
import { render as renderBorders } from "../render/line_borders"
import { EL, elh } from "./el";
export class LineView extends ShapeView {
    protected isNoSupportDiamondScale(): boolean {
        return true;
    }

    protected renderFills(): EL[] {
        return [];
    }

    protected renderBorders(): EL[] {
        if (this.m_data.style.borders.length > 0) {
            return renderBorders(elh, this.m_data.style, this.getBorders(), this.getPathStr(), this.m_data);
        } else {
            // const props: any = {};
            // props.stroke = '#000000';
            // props['stroke-width'] = 1;
            // props.d = this.getPathStr();
            // props.fill = "none"
            // return [elh('path', props)];
            return [];
        }
    }
}