
export class BitGrid {
    private grid: Int8Array[] = [];
    constructor(width: number, height: number) {
        for (let i = 0; i < height; i++) {
            this.grid.push(new Int8Array(Math.ceil(width / 8)))
        }
    }
    setBit(x: number, y: number) {
        const arr = this.grid[y];
        const i = Math.floor(x / 8);
        const offset = x % 8;
        const val = arr[i];
        arr[i] = val | (1 << offset);
    }
    isSet(x: number, y: number) {
        const arr = this.grid[y];
        const i = Math.floor(x / 8);
        const offset = x % 8;
        const val = arr[i];
        return !!(val & (1 << offset));
    }
}
