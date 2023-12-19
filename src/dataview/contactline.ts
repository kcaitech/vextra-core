import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { render as renderBorders } from "../render/contact_borders"

export class ContactLineView extends ShapeView {

    protected renderFills(): EL[] {
        return [];
    }

    protected renderBorders(): EL[] {
        if (this.m_data.style.borders.length > 0) {
            return renderBorders(elh, this.m_data.style, this.getPathStr(), this.m_data);
        } else {
            const props: any = {};
            props.stroke = '#808080';
            props['stroke-width'] = 2;
            props.d = this.getPathStr();
            props.fill = "none"
            return [elh('path', props)];
        }
    }
}