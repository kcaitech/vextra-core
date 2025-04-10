import { ShapeView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";

export class PageSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const version = super.render();
        if (version) {
            this.view.eltag = "svg";
        }
        return version;
    }

    asyncRender() {
        return this.render();
    }
}