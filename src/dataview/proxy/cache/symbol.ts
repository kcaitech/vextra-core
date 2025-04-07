import { SymbolView } from "../../symbol";
import { RadiusMask } from "../../../data";
import { ViewCache } from "./view";

export class SymbolViewCache extends ViewCache {
    constructor(protected view: SymbolView) {
        super(view);
    }

    get radius(): number[] {
        let _radius: number[];
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [
                this.view.cornerRadius?.lt ?? 0,
                this.view.cornerRadius?.rt ?? 0,
                this.view.cornerRadius?.rb ?? 0,
                this.view.cornerRadius?.lb ?? 0,
            ]
            this.unwatchRadiusMask();
        }
        return _radius

    }
}
