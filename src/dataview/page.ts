import { GroupShapeView } from "./groupshape";

export class PageView extends GroupShapeView {

    protected renderProps() {
        let width = Math.ceil(Math.max(100, this.m_data.frame.width));
        let height = Math.ceil(Math.max(100, this.m_data.frame.height));
        if (width % 2) width++;
        if (height % 2) height++;

        const prop: any = {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "visible"
        }
        prop.viewBox = `0 0 ${width} ${height}`;
        // todo
        // prop.style = { transform: matrixWithFrame.toString() };
        // prop['data-area'] = rootId.value;
        prop.width = width;
        prop.height = height;
        return prop;
    }
}