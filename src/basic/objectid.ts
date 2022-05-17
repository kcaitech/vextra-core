
let gObjectId = 0;
// guid "684FF842426D409B89503DB15A3042AE"

export function objectId(obj: any): number {
    return obj.__id_684FF842426D409B89503DB15A3042AE || (obj.__id_684FF842426D409B89503DB15A3042AE = gObjectId++);
}
