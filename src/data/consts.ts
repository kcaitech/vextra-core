export const ResizingConstraints = {
    Unset: 0b111111,
    Right: 0b000001,
    Width: 0b000010,
    Left: 0b000100,
    Bottom: 0b001000,
    Height: 0b010000,
    Top: 0b100000,
}

export const BorderPos = {
    Left: 1 << 0,
    Top: 1 << 1,
    Right: 1 << 2,
    Bottom: 1 << 3,
}