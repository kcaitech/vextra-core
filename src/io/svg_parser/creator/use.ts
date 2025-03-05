import { BaseCreator } from "./base"

export class UseCreator extends BaseCreator {
    adjust() {
        const href = this.localAttributes["xlink:href"]
        if (!href) return;
        const id = href.replace("#", "")

        const svgRoot = this.htmlElement?.root
        if (!svgRoot) return;

        const el = svgRoot.querySelector(`#${id}`)
        if (!el) return;

        const creator = (el as any).creator as BaseCreator
        this.localAttributes = {
            ...creator.localAttributes,
            ...this.localAttributes,
        }
        this.attributes = {
            ...creator.attributes,
            ...this.attributes,
            useTargetCreator: creator,
        }
        this.htmlElement!.tagName = creator.htmlElement!.tagName
    }

    createShape() {
        this.attributes.useTargetCreator!.createShape.call(this)
    }
}
