import { Style } from "../../data/style";

export function addContactShape(style: Style, contactShapeId: string) {
  if (style.contacts) {
    style.contacts.push(contactShapeId);
    return true;
  }
}