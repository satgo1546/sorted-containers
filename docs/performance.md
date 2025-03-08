---
title: Performance Comparison
---

# Performance Comparison

SortedArray:

- **Array**:
  A naïve implementation backed by an ordinary Array.
  Searching is done by bisecting; insertion and deletion is done by `Array.prototype.splice`.
- **[avl](https://www.npmjs.com/package/avl)**:
- **[splaytree](https://www.npmjs.com/package/splaytree)**:
  With an API similar to `avl`.
- **[jstreemap](https://kirusi.github.io/jstreemap/) TreeMultiSet**:
- **[functional-red-black-tree](https://www.npmjs.com/package/functional-red-black-tree)**:
  While it is unfair to compare performance between mutable and persistent data structures, this package is popular and feature-rich, and nevertheless is included for completeness. Keep in mind that persistent structures are generally slower to update in JavaScript.

SortedSet:

- **Array**:
  Like the Array implementation of sorted array, but checks for duplicates at insertion time.
- **Set**:
  A naïve implementation backed by an ordinary Set.
  Keys are sorted on demand.
  Note that Set does not support custom comparators and is thus limited to primitive keys.
- **[bintrees](https://www.npmjs.com/package/bintrees) RBTree**:
- **[jstreemap](https://kirusi.github.io/jstreemap/) TreeSet**:
- **[js-sdsl](https://js-sdsl.org/) OrderedSet**:
- **[collections SortedSet](https://www.collectionsjs.com/sorted-set)**:

SortedMap:

- **[sorted-btree](https://www.npmjs.com/package/sorted-btree) BTree**:
- **[jstreemap](https://kirusi.github.io/jstreemap/) TreeMap**:
- **[js-sdsl](https://js-sdsl.org/) OrderedMap**:
- **[collections SortedMap](https://www.collectionsjs.com/sorted-map)**:

Several alternative implementations were omitted for reasons documented below:

- **[mnemonist](https://yomguithereal.github.io/mnemonist/)**:
  Mnemonist is a curated collection of data structures for the JavaScript language. It provides MultiMap and MultiSet, but they are not ordered.
- **[sorted-array-functions](https://www.npmjs.com/package/sorted-array-functions)** and other Array-based libraries:
  It is impossible to achieve good performance for insertion and deletion with a single Array. They are more like the `bisect` module from Python.
- **[sonic-forest](https://streamich.github.io/sonic-forest/)**:
  Seems to be still under development. I can’t find usage documentation.
