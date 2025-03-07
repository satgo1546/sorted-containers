---
title: Design Notes
---

# Design Notes

This page assumes familiarity with Python sortedcontainers.

Various changes have been made to the Python API in order to be idiomatic and follow JavaScript traditions.

## Easy changes

- Class names are changed.

  Python|JavaScript
  -|-
  `SortedList`|`SortedArray`
  `SortedDict`|`SortedMap`

- Method names are changed.

  Python|JavaScript
  -|-
  `__add__`|`concat`
  `__contains__`|`includes` (SortedArray) or `has` (SortedMap and SortedSet)
  `__delitem__`|`deleteAt` and `deleteSlice`
  `__getitem__`|`at` (SortedArray) or `get` (SortedMap)
  `__reversed__`|`reversed`
  `bisect_left`|`bisectLeft`
  `bisect` and `bisect_right`|`bisectRight`
  `copy`|`clone`
  `discard`|`delete`
  `index`|`indexOf`

- Methods and operators that raises `ValueError` and `IndexError` in Python silently fails in JavaScript.

	- `at` and `pop` returns `undefined` if the index is out of range.
  - `remove` is removed. Use `delete` instead.
  - `deleteAt` does nothing if the index is out of range.
  - `indexOf` returns `-1` if the element is not found.

## Nuances

- Methods that raises `NotImplementedError` in Python are removed.
  They were there to implement `collection.abc` protocols,
  but such things don’t exist in JavaScript.

- In Python, you can use SortedList where a normal list is accepted most of the time.
  In JavaScript, there is no way to overload the indexing operator other than with a `Proxy`.
  A `Proxy` incurs needless performance overhead, however.
  Therefore, a SortedArray in JavaScript is not compatible with an ordinary Array.

  - On the other hand, SortedMap and SortedSet can be used in place of Map and Set.

- It is possible to `copy.deepcopy` a sorted container in Python.
  In JavaScript, `structuredClone` does not honor the prototype chain,
  so unfortunately it does not work.

- Slicing with a custom step size is not possible in JavaScript.
  They are not better than indexing the items one by one in Python anyway.

- The ability to reset the load factor is removed in JavaScript.
  You must specify it as an option to the constructor.

## The comparator

The comparison and key mechanisms are very different from Python,
as JavaScript has neither operator overloading nor tuple types.

JavaScript is really flawed in this respect.
It is a well-known pitfall that `Array.prototype.sort` does not work out of the box on numeric arrays.
Every new language feature has to make ad-hoc choices about what is considered equal and what comes first.

### Hashing

In Python, one can use immutable tuples as keys, and provide custom `__eq__` and `__hash__` implementations for data classes.

In JavaScript, there is none.
The SameValueZero algorithm is invented specifically for ES6 `Map` and `Set`,
as none of the previous equality relations are intuitive enough for `Map` keys.

But it still does not cover the common use case of composite keys, such as an `{x, y}` object representing a point on a plane.
Packages like [map2](https://www.npmjs.com/package/map2) and [keyalesce](https://www.npmjs.com/package/keyalesce) resort to nesting maps to achieve something similar to tuple keys in Python.
It is very tricky to avoid memory leaks this way.

### Key functions

Key functions have superseded comparator functions in Python.
Key functions can override the order with something other than `__lt__` implies.
Key functions can return a tuple to sort by multiple fields.

In JavaScript, custom key functions can only return one number or one string,
making it much less useful.
There is no reliable way to combine two fields into one key object that can be compared with comparison operators.
In that light, SortedKeyList is removed altogether.

