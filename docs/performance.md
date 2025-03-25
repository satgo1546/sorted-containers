---
title: Performance Comparison
---

# Performance Comparison

A library boasting about its performance would be incomplete without a benchmark.
It is unwise to judge a library solely by microbenchmarking, however.
Microbenchmark results are easily inaccurate, inapplicable, or even manipulated,
so take the following data with a grain of salt.

It is advised that you conduct tests in your own realistic use cases if performance is of concern.
And if have done so, whether you have chosen this library or not in the end,
it would be kind of you to share your results on GitHub.

The source files for all benchmarks on this page end with extension `.bench.ts`.
The results are presented in the same format as the [JS web framework benchmark](https://krausest.github.io/js-framework-benchmark/).
Measurements are made from the median of 10 repetitions.

Because all of the libraries are implemented in pure-JavaScript, their performance depends directly on the JavaScript engine.
Test data are only gathered for V8 because that is what powers Node.js, but keep in mind that on other engines they will perform differently.

## Which libraries?

Queries on npm have resulted in the following list of competing implementations.

- `Array` (array, set; control group):
  A naïve implementation backed by an ordinary Array.
  Searching is done by bisecting; insertion and deletion is done with `Array.prototype.splice`.
  It checks for duplicates at insertion time to emulate a set.
- `Set` and `Map` (set, map; control group):
  A naïve implementation backed by ordinary Set and Map.
  Keys are sorted on demand.
  Note that Set and Map does not support custom comparators and is thus limited to primitive keys.
- **[avl](https://www.npmjs.com/package/avl)** (array, set):
  An AVL tree.
  It offers an option to disallow duplicate elements.
- **[splaytree](https://www.npmjs.com/package/splaytree)** (array, set):
  A splay tree written by the same author as **avl** with an API similar to **avl**.
  It has a method to insert a value only if it is not in the tree.
- **[jstreemap](https://kirusi.github.io/jstreemap/)** `TreeMultiSet`, `TreeSet` and `TreeMap` (array, set, map):
  A red-black tree that provides an API in C++ STL style.
- **[sorted-btree](https://www.npmjs.com/package/sorted-btree)** (set, map):
  A feature-rich copy-on-write B-tree implementation.
  It clamps maximum child count between 4 and 256, with a default value of 32.
  Although the interface requires an associated value for each key,
  it is optimized for the case where the value is always undefined.
  It does not support duplicate keys, however, so it is classified as a set instead of an array.
- **[functional-red-black-tree](https://www.npmjs.com/package/functional-red-black-tree)** (array, map):
  A persistent red-black tree.
  The name refers to immutability; the API is still object-oriented.
  While it is unfair to compare performance between mutable and persistent data structures,
  this package is popular and feature-rich, and nevertheless is included for completeness.
  Keep in mind that persistent structures are generally slower to update in JavaScript.
  But as we see below, it is actually faster than others in a number of cases.
- **[js-sdsl](https://js-sdsl.org/)** `OrderedSet` and `OrderedMap` (set, map):
- **collections** [`SortedSet`](https://www.collectionsjs.com/sorted-set) and [`SortedMap`](https://www.collectionsjs.com/sorted-map) (set, map):
  A venerable collection library in the ES5 age.
  The SortedSet and SortedMap are backed by an splay tree implementation.
- **[bintrees](https://www.npmjs.com/package/bintrees)** `RBTree` (set):
  A minimalistic red-black tree.

Several alternative implementations were omitted for reasons documented below:

- **[mnemonist](https://yomguithereal.github.io/mnemonist/)**:
  Mnemonist is a curated collection of data structures for the JavaScript language.
  It provides MultiMap and MultiSet, but they are not ordered.
- **[sorted-array-functions](https://www.npmjs.com/package/sorted-array-functions)** and other Array-based libraries:
  It is impossible to achieve good performance for insertion and deletion with a single Array.
  They are more like the `bisect` module from Python.
- **[sonic-forest](https://streamich.github.io/sonic-forest/)**:
  Seems to be still under development. I can’t find usage documentation.

While **sorted-containers** allows random access on all three types of containers,
many of the alternatives are implemented with various kinds of balanced binary search trees,
and have not considered random access (indexing) abilities.
They are omitted from the corresponding benchmarks.

Even those that provide methods to look up values by index do it awfully slowly,
as slow as traversing the whole tree to get to a single node.
**functional-red-black-tree** is a notable one that has fast random access.

**sorted-containers** uses a nested Array data structure similar to a B-tree limited to two levels.
**sorted-btree** is the only library based on B-tree in the list.
It is also the only one that delivers performance on par with **sorted-containers**.

A B-tree-like data structure have a load factor parameter that can have a significant impact on performance.
The default values are used in the benchmarks, but there may be trade-offs for different workloads.
They should be fine tuned based on the exact usage in case needed.
Thus stock benchmarks for different load factors are not provided.

## Results

The benchmarks are run on GitHub-hosted Actions runner `ubuntu-latest` as of ???.

