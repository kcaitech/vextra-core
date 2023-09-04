import { BasicArray } from "../../data/basic";
import { Style } from "../../data/style";

export function addContactShape(style: Style, contactShapeId: string) {
  if (style.contacts) {
    style.contacts.push(contactShapeId);
  } else {
    const c = new BasicArray<string>();
    c.push(contactShapeId);
    style.contacts = c;
  }
  return true;
}