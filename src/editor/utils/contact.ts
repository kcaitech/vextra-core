import { Api } from "../../editor/command/recordapi";
import { ContactShape } from "../../data/contact";
import { Page } from "../../data/page";
import { ContactForm } from "../../data/style";

export function modify_from(api: Api, page: Page, shape: ContactShape, from?: ContactForm) {
    api.shapeModifyContactFrom(page, shape, from);

    if (!from) {
        return;
    }

    modify_contact_layer();
}

function modify_contact_layer() {

}