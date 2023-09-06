import { ContactRole } from "../../data/baseclasses";
import { BasicArray } from "../../data/basic";
import { Style } from "../../data/style";

export function addContactShape(style: Style, contact_role: ContactRole) {
  if (style.contacts) {
    style.contacts.push(contact_role);
  } else {
    const c = new BasicArray<ContactRole>(contact_role);
    style.contacts = c;
  }
  return true;
}
export function removeContactRoleAt(style: Style, index: number) {
  if (style.contacts) return style.contacts.splice(index, 1)[0];
}