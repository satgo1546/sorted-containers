---
title: Design Notes
---

# Design Notes

This page describes the design of the library itself.
You do not need to read this page to use sorted-containers.
It assumes familiarity with Python sortedcontainers.

## The language

Various changes have been made to the Python API in order to be idiomatic and follow JavaScript traditions.
This section is mostly for reference.

## Easy changes

- The library name is changed.

  Python|JavaScript
  -|-
  `sortedcontainers`|`sorted-containers`

- Class names are changed.

  Python|JavaScript
  -|-
  `SortedList`|`SortedArray`
  `SortedDict`|`SortedMap`

- Method and property names are changed.

  Python|JavaScript
  -|-
  `__add__`|`concat`
  `__contains__`|`includes` (SortedArray) or `has` (SortedMap and SortedSet)
  `__delitem__`|`deleteAt` and `deleteSlice`
  `__ge__`|`isSupersetOf`
  `__getitem__`|`at` (SortedArray) or `get` (SortedMap)
  `__iter__`|`[Symbol.iterator]`
  `__le__`|`isSubsetOf`
  `__len__`|`length` (SortedArray) or `size` (SortedMap and SortedSet)
  `__reversed__`|`reversed`
  `_check`|`checkSortedArray`, `checkSortedMap`, and `checkSortedSet`
  `bisect_left`|`bisectLeft`
  `bisect` and `bisect_right`|`bisectRight`
  `copy`|`clone`
  `discard`|`delete`
  `index`|`indexOf`
  `items`|`entries`
  `peekitem`|`at`
  `pop`|`shift`, `pop`, and `deleteAt`
  `popitem`|`popEntry`
  `setdefault`|`upsert` \*
  `symmetric_difference`|`symmetricDifference`

  \* As of this writing (Mar 2025), the committee is still bikeshedding on the name of [`getOrInsert`](https://tc39.es/proposal-upsert/) (formerly `emplace` and `upsert`).

- Methods and operators that raises `IndexError`, `KeyError`, and `ValueError` in Python silently fails in JavaScript.

	- `at`, `get`, `pop` and `popEntry` returns `undefined` if the index is out of range or the key is not found.
  - `remove` is removed. Use `delete` instead.
  - `deleteAt` does nothing if the index is out of range.
  - `indexOf` returns `-1` if the element is not found.

## Nuances

- Methods that raises `NotImplementedError` in Python are removed.
  They were there to implement `collection.abc` protocols,
  but such things don’t exist in JavaScript.

- It is possible to `copy.deepcopy` a sorted container in Python.
  In JavaScript, `structuredClone` does not honor the prototype chain,
  so unfortunately it does not work.

- Slicing with a custom step size is not possible in JavaScript.
  They are not better than indexing the items one by one in Python anyway.

- The ability to reset the load factor is removed in JavaScript.
  The load factor must be specified at construction time.

## The comparator

The comparison and key mechanisms in JavaScript are very different from Python.

### In Python

There are two ways to specify the order a list should sort its elements in Python:

- By providing `__lt__` (`<` operator) and `__eq__` (`==` operator) methods on the elements.
- By providing a key function when calling `sort` on a list or constructing a SortedList.

`__lt__` and `__eq__` methods are often not an option because the objects in question have no intrinsic order.
Should `Point(x=2, y=4) < Point(x=4, y=-2)` evaluate to `True` or `False`?
It is not clear what the expression means,
so it is better not to define `__lt__` on the `Point` class.

To specify sorting criteria case by case, key functions are useful. In the case of `Point`s,

- `SortedList(key=lambda p: p.x)` sorts the points by x, treating points on the same vertical line as equal to each other.
- `SortedList(key=lambda p: -p.x)` sorts the points by x, but in descending order.
- `SortedList(key=lambda p: p.x ** 2 + p.y ** 2)` sorts the points by Euclidean distance to the origin.
- `SortedList(key=lambda p: (p.x, p.y))` sorts the points by x first, breaking ties by y. This is possible because tuples compare to each other in lexicographic order.

Even if a key function is provided, some methods (including `index` and `count`) still operates with the equality defined by `__eq__`.

```python
>>> SortedList([27, 7, 17, 7], key=lambda x: x % 10).count(7)
2
```

SortedSet wraps a built-in set.
SortedDict inherits from the built-in dict.
They, too, in the presence of a key function,
deduplicates using the equality defined by `__eq__`,
as that is what the built-ins do.

```python
>>> SortedSet([27, 7, 17, 7], key=lambda x: x % 10)
SortedSet([17, 27, 7], key=<function <lambda> at …>)
```

Notice how multiple elements with the same derived key `7` coexist.

The default equality operator defined on the root object is based on object identity.

```python
class Point:  # inherits from object
    def __init__(self, x, y):
        self.x = x
        self.y = y

a = Point(x=2, y=4)
b = Point(x=2, y=4)
print(a == b)  # False
print(len(set([a, a, a, b, b, b])))  # 2
```

In JavaScript, this is the only form of equality supported by Set and Map,
where as in Python, a class is free to override `__eq__` to implement equality by value.

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    def __hash__(self):
        return hash((self.x, self.y))

a = Point(x=2, y=4)
b = Point(x=2, y=4)
print(a == b)  # True
print(len(set([a, a, a, b, b, b])))  # 1
```

The `sort` method on lists used to accept a comparator function in Python 2, just like in JavaScript.
A comparator function can be wrapped into a key function, as the `cmp_to_key` function in `functools` does.

```python
def cmp_to_key(mycmp):
    class K:
        def __init__(self, obj):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
    return K
```

At the end of the day, it is still `__lt__` and `__eq__` that handles the comparison.
In Python 3, support for comparator functions have been completely removed.

As you see, key functions in Python are powerful.
They are powerful because they enable succinct comparison delegation to parts of a compound object with the help of the built-in nicely sorted tuple type,
while at the same time users always have an option to override `__lt__` and `__eq__` in case control is needed.

## In JavaScript

In contrast, JavaScript is really flawed in this respect.
Since operators cannot be overloaded in JavaScript, a comparator function must be provided to sort an array.
It is a well-known pitfall that `Array.prototype.sort` does not work out of the box on numeric arrays,
because the default comparator converts its arguments to strings before comparing.

```js
[11, 4, 5, 14].sort() // [11, 14, 4, 5]
[11, 4, 5, 14].sort((a, b) => a - b) // [4, 5, 11, 14]
```

Comparison operators on anything other than numbers and strings produce garbage.
Thus, usefulness of key functions diminishes substantially.

```js
[11, 4] < [5, -14] // true, because '11,4' < '5,-14'
```

In that light, SortedKeyList is removed altogether in sorted-containers.

SortedArray accepts a comparator function because it is essentially the only viable option.
The default comparator compares without coercing to strings first,
as that is what users reasonably expect.

For lack of a standard way to compare things,
every new language feature has to make ad-hoc choices about what is considered equal and what gets sorted first.

The SameValueZero algorithm is invented specifically for Map and Set in JavaScript,
as none of the previous equality relations are intuitive enough for Map keys.
It is based on object identity.

It seems that Map as a proposal was described as
“similar in style to weak maps but without the funny garbage collection semantics or non-enumerability”
[in the ES Wiki](https://web.archive.org/web/20170105121945/http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets),
which to some degree explains why Map is not too useful on its own.

As a result, packages like [map2](https://www.npmjs.com/package/map2) resort to nesting maps to achieve something similar to tuple keys in Python.
Another approach is to convert custom equality into object identity,
like what [keyalesce](https://www.npmjs.com/package/keyalesce) does
— which, of course, is implemented with nested maps.
It is super tricky to avoid memory leaks this way,
especially in library code where usage patterns are not foreseen.

Due to Map and Set’s incompetence,
SortedMap and SortedSet have diverged in implementation from their Python counterpart.
They do not use the native Map and Set *at all*.
They implement all the lookup mechanisms with bisection in user land.
Somehow it is not slow.

## In TypeScript

While TypeScript has to inherit everything JavaScript has, including the flaws,
there is something TypeScript is better at than Python — well, types.

When sortedcontainers first came out, type hints were not even a thing.
It has not been able to get properly hinted over the years
because it was not (to be fair, it could not have been) written in a typing-oriented style.
(See [the longstanding issue](https://github.com/grantjenks/python-sortedcontainers/issues/68) for details.)
The biggest obstacle is that SortedSet and SortedDict adapts its behavior
according to whether a key function is passed in or not.
In [sortedcontainers-stubs](https://github.com/h4l/sortedcontainers-stubs),
it is solved by stub-only types SortedKeySet and SortedKeyDict.

It is easier in TypeScript.
As elements cannot be directly compared anyway, a SortedArray in JavaScript is in fact a SortedKeyList in Python.
Since a comparator function checks only the key part of the operands,
a partial object containing only the relevant part can be passed into lookup methods,
instead of a full object of the element type.

```ts
const a = new SortedArray(
  [
    { id: 1, value: 'one' },
    { id: 2, value: 'two' },
    { id: 3, value: 'three' },
  ],
  { comparator: (a, b) => a.id - b.id },
);
a.bisectLeft({ id: 2 }) // 1
// = a.bisect_key_left(2) in Python
```

Meanwhile, due to the structural nature of TypeScript,
it does not complain if a full object is passed in.

```ts
const o = { id: 2, value: 'duo' }
a.bisectLeft(o) // 1
// = a.bisect_left(o) in Python
```

While the cause is somewhat unfortunate,
it is nice to see two methods collapse into one naturally.
This design allows sorted containers to adapt to a key-value model
without enforcing and taking control over it,
like other BST implementations out there do.

To support such usage, sorted containers are generic over an element type `T`
and an optional key type `C` that is a partial element.

```ts
declare class SortedArray<T extends C, C = T>
```

Et voilà!
The TypeScript compiler is quite happy with this type despite its absurd look.
It is able to infer the other type parameter given either of them.

## The interface

### SortedList

In Python, most of the time, you can use SortedList where a normal list is accepted.
In JavaScript, there is no way to overload the indexing operator other than with a `Proxy`.
A `Proxy` incurs needless performance overhead, however.
Therefore, a SortedArray in JavaScript is not compatible with an ordinary Array.

### SortedMap

Unlike SortedArray, SortedMap can be used in place of Map.
It has the same API, but the semantics are different, mostly regarding the equality of keys,
as is discussed in the previous section.

#### Identity of duplicate keys

A subtle point about custom equality relations is what happens when keys that differ in identity are used to build and access dictionary items or map entries.

```python
class Point:
    def __init__(self, name, x, y):
        self.name = name
        self.x = x
        self.y = y
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    def __hash__(self):
        return hash((self.x, self.y))
    def __repr__(self):
        return self.name

a = Point('a', x=2, y=4)
b = Point('b', x=2, y=4)
d = {a: 'first', b: 'second'}
print(d)  # {a: 'second'}
d[b] = 'third'
print(d)  # {a: 'third'}
del d[b]
d[b] = 'third'
print(d)  # {b: 'third'}
```

Note that with duplicate keys (according to `__eq__`), the *first* key and the *last* value are kept.
Unless a key is deleted and added again later, the dictionary keeps the reference to the initial key object.
This behavior is also seen in Ruby.
SortedMap implements this behavior.

#### Undefined behavior with changing equality

If its hash changes while an object is being used as a key,
the program produces undefined behavior.
Continuing the last example:

```python
b.x = 3
print(list(d)[0] is b)  # True
d[b]  # KeyError
```

The Python standard library does not provide hash functions for mutable objects,
so that they cannot be used as dictionary keys.
User-defined classes, however, are vulnerable if they incorrectly provide hash functions.

Such a problem is more prevalent in Ruby since it has no canonical immutable tuple type,
and mutable Arrays are used as tuples and are hashable instead.

JavaScript Map’s oversimplified equality model has avoided undefined behavior with misbehaving hash functions.

SortedMap is in line with other hash table implementations.
It is undefined behavior if equality changes while a key is in a SortedMap.

#### Concurrent modifications

The native Map has some more nuances:
you can add and delete keys while iterating over the Map.
Map and Set go to great lengths to ensure the behavior of such an edge case to be well specified.

```js
const a = ['a', 'b', 'c'];
for (const i of a.keys()) a.splice(i, 1);
a // ['b']

const m = new Map([[1, 'a'], [2, 'b'], [3, 'c']]);
for (const [k, v] of m) m.delete(k);
m // Map {}
```

I’m not sure why it is like that.
This is a feature rarely seen in other languages.
C++ makes it an undefined behavior, Python and Java throw an exception, and in Rust it does not compile.

I have to be pragmatic here.
sorted-containers makes concurrent modifications an undefined behavior.

### SortedSet

Set can be seen as a stripped down version of Map where keys are also values.
This explains the weirdness of `entries` and `forEach`.

```js
const m = new Map;
m.set(1);
m.set(2);
m.set(3);
[...m.entries()]
// [[1, undefined], [2, undefined], [3, undefined]]

const s = new Set;
s.add(1);
s.add(2);
s.add(3);
[...s.entries()]
// [[[1], [1]], [[2], [2]], [[3], [3]]]
```

Set uses the same iteration order as Map, that is, the order of insertion.
In Python, the built-in set does not record insertion order.
SortedSet in Python does not preserve the order of elements with equal keys, either.
As with SortedMap, SortedSet in JavaScript keeps only one instance of equal elements,
so the order is solely determined by the comparator function.

However Set tries to mimic Map, it poses more problems than Map nevertheless.

In July 2024, a bunch of Set methods, including `union`, `symmetricDifference`, and `isSubsetOf`, landed.
Whereas other languages accept general iterators as arguments to these methods,
JavaScript requires the arguments to (in TypeScript lingo) satisfy `interface ReadonlySetLike`.

```ts
interface ReadonlySetLike<T> {
  keys(): Iterator<T>
  has(value: T): boolean
  readonly size: number
}
```

This is for two reasons described in [the original proposal](https://github.com/tc39/proposal-set-methods/blob/main/details.md), both of which are questionable:

- **Efficiency is impacted if the sizes of both operands are not known upfront.**

  The most efficient implementation of intersection needs to know the sizes to choose the set to iterate over,
  but iterators in general do not expose their length,

  In addition to requiring a stricter interface,
  the efficiency comes at the price of a less predictable result.
  The order of elements in the intersection follows whichever operand is smaller,
  regardless of the order of operands.
  Is it worthwhile to sacrifice the deterministic order observed in other Set methods
  to get the complexity of intersection down from O(n) to O(min(m, n))?

  Apart from systems languages like Rust,
  consistency is favored over efficiency.
  set in Python, Set in Ruby and HashSet in C# showcases predictable order of operations,
  instead of branching based on the relative size of a set at runtime.

  If set methods behaves more predictably,
  when a programmer knows which set will usually be larger,
  they can compensate with their domain knowledge.
  They can also swap the operands themself if that is deemed necessary.

- **A Map should be treated as a set of keys as an argument to set operation methods.**

  In Python, the default iterator of a dict yields keys without values.
  It is indeed more convenient to be able to treat dictionaries as a set of keys,
  but it is just a convenience.
  It is equally valid, not too verbose, and arguably more readable
  to pass a dict’s `.keys()` explicitly.

  Other languages do not care about this.
  Hash in Ruby, Dictionary in C#, map, unordered_map in C++ and HashMap in Rust
  all yields both keys and values with the default iterator,
  yet set types in those languages do not special case maps.
  The union of a map and a set simply cannot be computed,
  or is a union of the not overlapping set values and key-value pairs.

  If set methods accept arbitrary iterators,
  you can always pass `map.keys()` if that is needed.

It seems that when Set methods were designed,
the two points above were seen as more important than the more likely use case of adding to or removing from a Set an Array of values.
It is ridiculous that Map had been more seriously considered than Array,
and Array was explicitly ruled out [in the proposal](https://github.com/tc39/proposal-set-methods/blob/main/details.md#always-getting-size-keys-and-has):

> Also, just using `.keys` would mean that
> passing an array to `.union` would give the union with the *indices* of the array,
> which was held to be confusing.
> Requiring `.size` to be defined means that arrays are rejected instead of that more confusing behavior.

Now we’re stuck with the broken method signatures and broken error messages.

```js
new Set(['a']).union(['b'])
// TypeError: The .size property is NaN
```

As for SortedSet, a produced set must inherit its parameters from one of the operands consistently since comparator functions are not universal.
It is then only natural for SortedSet methods to take an iterable argument and keep the parameters of `this`.
Because of this, SortedSet cannot be compatible with the native Set.

## The iterator

Iterators and itertools are the pearl of Python.
They are used everywhere.
Few functions accept lists but not iterables.
Iterator functions and expressions are built into the language core.
itertools is implemented in C,
so that it is possible to create efficient iterators from user code by composing existing ones.

Iterators are also available in JavaScript,
but they are much less rich in feature and less widely adopted.

Many of the older collection libraries in the JavaScript ecosystem lack support for iterators,
because the concept of an iterator is only introduced in ES6.
Before that, Array had `forEach`, and libraries followed suit.
There is one problem though: you cannot break a forEach loop without throwing an exception.
Libraries had to provide ad-hoc ways to break out of the loop.

Iterators solve this problem,
but they are otherwise so badly designed that they come with a performance hit by default:
they need to return two pieces of information, `value` and `done`,
packaged into an iterator result object on each invocation of `next`,
which implies memory allocation on each iteration.
In contrast, `forEach` just calls a closure many times,
without the need to allocate anything on the heap.
Therefore, `forEach` is usually faster than iterator-based loops.
sorted-containers cheats by reusing the same result object on each iteration,
witnessing a 2x speed-up in extreme cases.

It is hard to compose iterators in JavaScript.
For a long time, the only ergonomic way to compose iterators
(without resorting to writing `next` functions and result objects by hand)
is to write a generator function.
Generator functions are heavy and slow, however.

As of Oct 2024, class Iterator has been added to the standard
to provide facilities like those in Python builtins and itertools.
It is quite a breaking change and poses library authors with a compatibility challenge.
If class Iterator is present, iterators must inherit it to make helper methods available;
but otherwise, class Iterator does not even exist.
Rather than detecting the presence of class Iterator,
sorted-containers steals the prototype of the built-in Array iterator,
which has been around for ages and automatically gains new abilities with the introduction of Iterator constructor.

## Conclusion

In Python, container libraries often adopt APIs similar to built-in collection classes,
because they are familiar, specified, sane, and not too hard to implement fully.
As a result, collections are not only interchangable with built-in objects,
but often with each other as well.

In JavaScript, the story is entirely different.
The lack of language features destroys ergonomics.
The interfaces and even names are inconsistent.
Many of the methods are not well designed.
Furthermore, the interfaces are not designed for other implementations at all.
Often, it is impossible to be compatible with built-in objects;
other times, it is doubtful that full compatibility is worth the trouble.
