
import { ViewCache } from "./view";
import { TextShapeView } from "../../textshape";
import { Path } from "@kcdesign/path";
import { renderText2Path } from "../../../render/SVG/effects/text";

export class TextViewCache extends ViewCache {
    constructor(protected view: TextShapeView) {
        super(view);
    }
    private m_textpath?: Path;
    get textPath() {
        if (!this.m_textpath) {
            this.m_textpath = renderText2Path(this.view.getLayout(), 0, 0)
        }
        return this.m_textpath;
    }
}