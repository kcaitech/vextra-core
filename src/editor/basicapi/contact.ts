import { ContactRole } from "../../data/baseclasses";
import { BasicArray } from "../../data/basic";
import { Style } from "../../data/style";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

export function addContactShape(style: Style, contact_role: ContactRole) {
    if (!style.contacts) style.contacts = new BasicArray<ContactRole>();
    return crdtArrayInsert(style.contacts, style.contacts.length, contact_role);
}
export function removeContactRoleAt(style: Style, index: number) {
    if (style.contacts) return crdtArrayRemove(style.contacts, index);
}