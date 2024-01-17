import { ContactRole } from "../../data/baseclasses";
import { BasicArray } from "../../data/basic";
import { Style } from "../../data/style";
import { crdtArrayInsert, crdtArrayRemove } from "./basic";

export function addContactShape(uid: string, style: Style, contact_role: ContactRole) {
    if (!style.contacts) style.contacts = new BasicArray<ContactRole>();
    return crdtArrayInsert(uid, style.contacts, style.contacts.length, contact_role);
}
export function removeContactRoleAt(uid: string, style: Style, index: number) {
    if (style.contacts) return crdtArrayRemove(uid, style.contacts, index);
}