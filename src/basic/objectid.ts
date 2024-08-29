
let gObjectId = 0;
// guid "684FF842426D409B89503DB15A3042AE"
const __id__ = "__object_id__"

export function objectId(obj: any): number {
    return obj[__id__] ?? (obj[__id__] = gObjectId++);
}
