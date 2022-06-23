// _parent, _left, _right are really OptNode<K, V>, however there was a
// problem with type guards, so I forced Node<K, V> instead.

export interface INode<K, V> {

    /** The key of the entry which the Node represents */
    key: K;

    /** The value of the entry which the Node represents, can be mutated */
    value: V;

    /** True if node is nil */
    get nil(): boolean;

    /** True if node is not nil */
    get ok(): boolean;

    /** The entry which the Node represents */
    entry(): [K, V];

    /** Compact display of the node */
    toString(maxLength: number): string;

    black: boolean;
    red: boolean;

    left: INode<K, V>;
    parent: INode<K, V>;
    right: INode<K, V>;
}

/** Node has two tasks: first they are used to maintain the red-black tree's
 * internal order. For that properties starting with _ (underscore) are used,
 * these are internal and not officially documented, for example `_black` and
 * `_red` for the node's color. The second task is as a pointer into the tree,
 * for example to define iteration start and end, but also to mutate the value
 * in-place. Keys shouldn't be modified (there is no public writable property
 * anyway).
 */
export class Node<K, V> implements INode<K, V> {

    /** The one and only nil Node */
    static readonly nilNode: Node<any, any> = _nilNode()
    
    /** @internal */ readonly __key: K
    /** @internal */ __value: V
    /** @internal */ __parent: Node<K, V> = Node.nilNode as Node<K, V>
    /** @internal */ __left: Node<K, V> = Node.nilNode as Node<K, V>
    /** @internal */ __right: Node<K, V> = Node.nilNode as Node<K, V>
    /** @internal */ __black: boolean = true
    
    /** @internal */ get black() { return this.__black }
    /** @internal */ set black(value: boolean) { this.__black = value }
    /** @internal */ get red() { return !this.__black }
    /** @internal */ set red(value: boolean) { this.__black = !value }
    /** @internal */ get left() { return this.__left }
    /** @internal */ set left(value: Node<K, V>) { this.__left = value }
    /** @internal */ get parent() { return this.__parent }
    /** @internal */ set parent(value: Node<K, V>) { this.__parent = value }
    /** @internal */ get right() { return this.__right }
    /** @internal */ set right(value: Node<K, V>) { this.__right = value }
    
    /** Construct a new standalone Node with key and value */
    constructor(key: K, value: V) {
        this.__key = key
        this.__value = value
    }

    /** The key of the entry which the Node represents */
    get key(): K { return this.__key }

    /** The value of the entry which the Node represents, can be mutated */
    get value(): V { return this.__value }
    set value(value: V) { this.__value = value }

    /** True if node is nil */
    get nil(): boolean { return this === Node.nilNode }

    /** True if node is not nil */
    get ok(): boolean { return this !== Node.nilNode }

    /** The entry which the Node represents */
    entry(): [K, V] { return [this.key, this.value] }

    /** Compact display of the node */
    toString(maxLength: number = 20): string {
        const key = ('' + this.key).substring(0, maxLength)
        const value = ('' + this.value).substring(0, maxLength)
        return `[${key}:${value}]`
    }

  // Compact display of the node with more details, <> for red and () for black
  /** @internal */ _details(maxLength: number = 20) {
        const cut = (s: any) => ('' + s).substring(0, maxLength)
        const o = this.black ? '(' : '<'
        const c = this.black ? ')' : '>'
        const key = cut(this.key)
        const value = cut(this.value)
        const left = this.left.nil ? '·' : this.left.key
        const right = this.right.nil ? '·' : this.right.key
        return `${o}${cut(left)} ${key}:${value} ${cut(right)}${c}`
    }
}

// Nust be called only once because we should have only one nil Node!
function _nilNode(): Node<any, any> {
    return Object.freeze(
        new class extends Node<unknown, unknown> {
            toString() { return '·' }
            _details() { return '(·)' }
            get black() { return true }
            set black(_: boolean) { } // ignoring, see [[Nil]]
            get red() { return false }
            set red(_: boolean) { }

            constructor() {
                super(Symbol('nilNode.key'), Symbol('nilNode.value'))
                this.parent = this.left = this.right = this
            }
        },
    )
}


// Below didn't work out because of a problem with type guards. The idea was
// to typify that Node.nilNode is special, for example that the less operation
// in the tree doesn't work with nil. However for this to work I need to make
// Node.ok and Node.nil reliable type guards. I keep this in the code so I
// don't forget this failed attempt.
//
// /** The nil node (see the Null Object Pattern), used for leaf nodes or for
//  * the parent of the root node. Nil nodes are always black and can't be
//  * mutated. Changing the color doesn't cause an error but also has no
//  * effect. This simplifies the rebalancing algorithms.
//  */
// export type Nil = ReadonlyNil & { _black: boolean, _red: boolean }
//
// type UntypedNode = Node<unknown, unknown>
// type Diff<T, U> = T extends U ? never : T
// type ReadonlyNilKeys = Diff<keyof UntypedNode, '_black' | '_red'>
// type ReadonlyNil = Readonly<Pick<UntypedNode, ReadonlyNilKeys>>
//
// /** Optional Node: either Node<K, V> or Nil. */
// export type OptNode<K, V> = Node<K, V> | Nil
