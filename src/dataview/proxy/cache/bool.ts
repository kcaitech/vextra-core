import { Path } from "@kcdesign/path";
import { BoolShapeView, render2path } from "../../boolshape";
import { ViewCache } from "./view";

export class BoolShapeViewCache extends ViewCache {
    private m_path: Path | undefined;

    constructor(protected view: BoolShapeView) {
        super(view);
    }

    get path() {
        if (this.m_path) return this.m_path;
        this.m_path = render2path(this.view);
        this.m_path.freeze();
        return this.m_path;
    }
}
