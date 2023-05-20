// help functions

export function deepclone(obj: object): object {
	if (typeof(obj) == 'object') {
		return JSON.parse(JSON.stringify(obj));
	}
	return obj;
}
