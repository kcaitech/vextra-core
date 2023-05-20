// Convention: Names starting with _ aren't public. You are on your own if you
// use them. They are excluded from *.d.ts files by anyway (by internal tag).
// Didnt' use private because they are needed in tests (white box testing).

import { Node } from './node'
export { Node }


/** Type for the less-than criterium after which the entries will be sorted:
 * a function to return true if entry `a` is less than entry `b`.
 * @typeparam K key type, entries are sorted by key
 */
export type LessOp<K> = (a: K, b: K) => boolean


/** A red-black tree written in TypeScript. The entries are stored sorted after
 * the criterium `lessOp` passed tp the constructor or by default by the
 * comparison operator `<` (less). Insertion, deletion and iteration have
 * O(log n) time complexity where n is the number of entries in the tree.
 * @typeparam K key type, entries are sorted by key
 * @typeparam V value type
 */
export class Tree<K = string, V = any> implements Map<K, V> {

    /** @internal */ __root: Node<K, V> = Node.nilNode
    /** @internal */ _size: number = 0
    /** @internal */ readonly _less: Less<K, Node<K, V>>
    /** @internal */ get _root() { return this.__root }
    /** @internal */ set _root(value: Node<K, V>) { this.__root = value }

    /** Create a new red-black tree optionally with entries from `source` and
     * the sorting criterium `lessOp`.
     * @param source an array of entries or an iterable of entries or an object
     * @param lessOp sorting criterum: a function taking two arguments and
     *   returning true if the first is less than the second argument, should
     *   run in O(1) time to ensure the red-black tree efficiency
     */
    constructor(
        source?: IterableIterator<[K, V]>,
        lessOp: LessOp<K> = (a, b) => a < b,
    ) {
        this._less = (a, b) => lessOp(a, b.key)
        if (source)
            for (const entry of source)
                this._insertNode(new Node(entry[0], entry[1]))
    }

    /** @returns `"[Tree size:<size>]"` with `<size>` as in [[Tree.size]] */
    toString(): string {
        return `[${this[Symbol.toStringTag]} size:${this.size}]`
    }

    /** Iterator over nodes, sorted by key, O(log n) each step
     * @param start iteration start with this node (inclusive)
     * @param end iteration end before this node (exclusive) or [[Node.nilNode]]
     *   to iterate to the end
     */
    nodes(start?: Node<K, V>, end?: Node<K, V>): IterableIterator<Node<K, V>> {
        return this._iterator<Node<K, V>>(node => node, start, end)
    }

    /** Get a node with the key, O(log n)
     * @param key the key
     */
    getNode(key: K): Node<K, V> {
        return this._findNode(key)
    }

    /** The node with the minimum key, O(log n) */
    get minNode(): Node<K, V> {
        return this._firstNode()
    }

    /** The node with the maximum key, O(log n) */
    get maxNode(): Node<K, V> {
        return this._lastNode()
    }

    /** Clear the tree and make it unusable */
    kill() {
        this._root = deadNode()
        this._size = NaN
        Object.freeze(this)
    }

    // --- Start implementing Map ---

    /** @returns the number of entries in the tree, O(1) */
    get size() {
        return this._size
    }

    /** Used by [[Tree.toString]] */
    [Symbol.toStringTag]: string = 'Tree'

    /** @returns true if an entry with key is found, O(log n) */
    has(key: K): boolean {
        return this._findNode(key).ok
    }

    /** Get an entry with the key, O(log n) */
    get(key: K): V | undefined {
        const node = this._findNode(key)

        return node.ok ? node.value : undefined
    }

    /** Set an entry, O(log n) */
    set(key: K, value: V): this {
        const node = this._findNode(key)
        node.ok ? node.value = value : this._insertNode(new Node(key, value))
        return this
    }

    /** Delete an entry with the key from the tree, O(log n)
     * @returns true if there was a key
     */
    delete(key: K): boolean {
        const node = this._findNode(key)
        const result = this._deleteNode(node)
        if (node.ok)
            node.parent = node.left = node.right = Node.nilNode
        return result
    }

    /** Clear the tree, same as `Map.clear()`, O(1) */
    clear(): void {
        this._root = Node.nilNode
        this._size = 0
    }

    /** Invoke `f` over all entries sorted by key, same as `Map.forEach()`
     * @param f Function taking value, key and container as parameters which
     *   will be called for all entries of the tree in their order
     * @param self `this` inside f
     */
    forEach(f: (value: V, key: K, map: Map<K, V>) => void, self?: any): void {
        for (const entry of this.entries())
            f.call(self, entry[1], entry[0], this)
    }

    /** Indicate that Tree is iterable but same as [[Tree.entries]] */
    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries()
    }

    /** Iterator over entries, sorted by key, O(log n) each step */
    entries(start?: Node<K, V>, end?: Node<K, V>): IterableIterator<[K, V]> {
        return this._iterator<[K, V]>(node => node.entry(), start, end)
    }

    /** Iterator over keys, sorted, O(log n) each step */
    keys(start?: Node<K, V>, end?: Node<K, V>): IterableIterator<K> {
        return this._iterator<K>(node => node.key, start, end)
    }

    /** Iterator over values, sorted by key, O(log n) each step */
    values(start?: Node<K, V>, end?: Node<K, V>): IterableIterator<V> {
        return this._iterator<V>(node => node.value, start, end)
    }

  // TODO perhaps: https://github.com/tc39/proposal-collection-methods

  // --- End implementing Map ---

  // --------------------------------------------------------------------------
  // From here: not part of the public API, no documentation comments any more

  // get    function to map from node to iterator value R
  // start  start node for iterating over a tree subset (inclusive)
  // end    end node for iterating over a tree subset (exclusive)
  /** @internal */ _iterator<R>(
        get: (node: Node<K, V>) => R,
        start?: Node<K, V>,
        end?: Node<K, V>,
    ): IterableIterator<R> {
        return new Iter<K, V, R, Node<K, V>, Tree<K, V>>(this, get, start, end)
    }

  /** @internal */ _firstNode(node: Node<K, V> = this._root): Node<K, V> {
        while (node.left.ok) node = node.left
        return node
    }

  /** @internal */ _lastNode(node: Node<K, V> = this._root): Node<K, V> {
        while (node.right.ok) node = node.right
        return node
    }

  /** @internal */ _nextNode(node: Node<K, V>): Node<K, V> {
        if (node.nil) return node
        if (node.right.ok) return this._firstNode(node.right)
        let parent = node.parent
        while (parent.ok && node === parent.right) {
            node = parent
            parent = parent.parent
        }
        return parent
    }

  /** @internal */_findNode(
        key: K,
        node: Node<K, V> = this._root,
    ): Node<K, V> {
        while (node.ok && key !== node.key)
            node = this._less(key, node) ? node.left : node.right
        return node
    }

  /** @internal */_insertNode(node: Node<K, V>): this {
        if (node.nil) return this

        node.parent = node.left = node.right = Node.nilNode
        this._size++
        if (this._root.nil) {
            this._root = node
            return this
        }

        let parent, n
        parent = n = this._root
        while (n.ok) {
            parent = n
            n = this._less(node.key, n) ? n.left : n.right
        }
        node.parent = parent

        // Empirical insight from fuzzying: parent is never nil. I tried to create
        // a situation where parent is nil (add two nodes), but couldn't make
        // parent nil. However should it happen anyway (will throw TypeError), an
        // if branch could be added: if (parent.nil) this._root = node ... else
        if (this._less(node.key, parent)) parent.left = node
        else parent.right = node
        node.red = true

        // Reinstate the red-black tree invariants after the insert
        while (node.parent.red) {
            parent = node.parent
            const grandp = parent.parent
            if (parent === grandp.left) {
                if (grandp.right.red) {
                    parent.black = grandp.right.black = grandp.red = true
                    node = grandp
                    continue
                }
                if (node === parent.right) {
                    this.leftRotate(parent)
                        ;[parent, node] = [node, parent]
                }
                parent.black = grandp.red = true
                this.rightRotate(grandp)
                continue
            }
            if (grandp.left.red) {
                parent.black = grandp.left.black = grandp.red = true
                node = grandp
                continue
            }
            if (node === parent.left) {
                this.rightRotate(parent)
                    ;[parent, node] = [node, parent]
            }
            parent.black = grandp.red = true
            this.leftRotate(grandp)
        }
        this._root.black = true
        return this
    }

  // Always make sure that node is member of the tree! The tree can break,
  // the left child's key might turn larger or other bad things. Also, after
  // delete the node is not part of the tree anymore and links are invalid.
  // The best bet is to set parent, left and child to nil after the delete.
  /** @internal */_deleteNode(node: Node<K, V>): boolean {
        if (node.nil) return false

        this._size--

        let child: Node<K, V>, parent: Node<K, V>, red: boolean
        if (node.left.ok && node.right.ok) {
            const next = this._firstNode(node.right)
            if (node === this._root) this._root = next
            else node === node.parent.left
                ? node.parent.left = next
                : node.parent.right = next
            child = next.right, parent = next.parent, red = next.red
            if (node === parent) parent = next
            else {
                if (child.ok) child.parent = parent
                parent.left = child
                next.right = node.right
                node.right.parent = next
            }
            next.parent = node.parent
            next.black = node.black
            node.left.parent = next
            if (red) return true
        }
        else {
            node.left.ok ? child = node.left : child = node.right
            parent = node.parent, red = node.red
            if (child.ok) child.parent = parent
            if (node === this._root) this._root = child
            else parent.left === node ? parent.left = child : parent.right = child
            if (red) return true
        }

        // Reinstate the red-black tree invariants after the delete
        node = child
        while (node !== this._root && node.black) {
            if (node === parent.left) {
                let brother = parent.right
                if (brother.red) {
                    brother.black = parent.red = true
                    this.leftRotate(parent)
                    brother = parent.right
                }
                if (brother.left.black && brother.right.black) {
                    brother.red = true
                    node = parent
                    parent = node.parent
                    continue
                }
                if (brother.right.black) {
                    brother.left.black = brother.red = true
                    this.rightRotate(brother)
                    brother = parent.right
                }
                brother.black = parent.black
                parent.black = brother.right.black = true
                this.leftRotate(parent)
                node = this._root
                break
            }
            else {
                let brother = parent.left
                if (brother.red) {
                    brother.black = parent.red = true
                    this.rightRotate(parent)
                    brother = parent.left
                }
                if (brother.left.black && brother.right.black) {
                    brother.red = true
                    node = parent
                    parent = node.parent
                    continue
                }
                if (brother.left.black) {
                    brother.right.black = brother.red = true
                    this.leftRotate(brother)
                    brother = parent.left
                }
                brother.black = parent.black
                parent.black = brother.left.black = true
                this.rightRotate(parent)
                node = this._root
                break
            }
        }
        if (node.ok) node.black = true
        return true
    }

  /** @internal */ leftRotate(node: Node<K, V>): void {
        const child = node.right
        node.right = child.left
        if (child.left.ok) child.left.parent = node
        child.parent = node.parent
        if (node === this._root) this._root = child
        else if (node === node.parent.left) node.parent.left = child
        else node.parent.right = child
        node.parent = child
        child.left = node
    }

  /** @internal */ rightRotate(node: Node<K, V>): void {
        const child = node.left
        node.left = child.right
        if (child.right.ok) child.right.parent = node
        child.parent = node.parent
        if (node === this._root) this._root = child
        else if (node === node.parent.left) node.parent.left = child
        else node.parent.right = child
        node.parent = child
        child.right = node
    }
}


// type guard (used by assign())
function isIterable(obj: any): obj is Iterable<unknown> {
    return obj && typeof obj[Symbol.iterator] === 'function'
}


// Different from LessOp: second argument is Node, not key!
type Less<K, N> = (key: K, node: N) => boolean

// Interface to expose a few properties of Tree to the iterator
interface IterTree<K, N> {
    _less: Less<K, N>
    _nextNode(node: N): N
    _firstNode(): N
}

// Iterator implementation
// K  key type
// V  value type
// R  iterator result value type, e.g. [K, V] for entries()
// N  tree node type, typically N extends Node<K, V>
// T  tree type, typically T extends IterTree<N>
class Iter<K, V, R, N extends Node<K, V>, T extends IterTree<K, N>>
    implements IterableIterator<R>
{
  /** @internal */ _started: boolean = false
  /** @internal */ _node: N
  /** @internal */ _end: N
  /** @internal */ _tree: T
  /** @internal */ _result: (node: N) => R

    constructor(
        tree: T,
        result: (node: N) => R,
        start: N = Node.nilNode as N,
        end: N = Node.nilNode as N,
    ) {
        this._tree = tree
        this._result = result
        this._node = start
        if (start.ok && end.ok && !tree._less(start.key, end)) end = start
        this._end = end
    }

    [Symbol.iterator](): IterableIterator<R> { return this }

    next(): IteratorResult<R> {
        if (this._node.nil) this._node = this._tree._firstNode()
        if (this._started) this._node = this._tree._nextNode(this._node)
        this._started = true

        const done = this._node.nil || this._node === this._end
        const value = done ? undefined : this._result(this._node)
        return { done, value } as IteratorResult<R>
        //                     ^^^^^^^^^^^^^^^^^^^^
        // See https://github.com/Microsoft/TypeScript/issues/11375
    }
}


// Create an object structurally compatible to Node but throwing on any access
const throwDead = () => { throw new TypeError('Tree is dead') }
function deadNode(): Node<any, any> {
    const propNames = '_key _value parent left right black red ok nil'
    const properties: PropertyDescriptorMap = {}
    for (const propName of propNames.split(' '))
        properties[propName] = { get: throwDead, set: throwDead }
    return <Node<any, any> >Object.defineProperties({}, properties)
}

