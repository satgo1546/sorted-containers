---
title: Introduction
---

# Introduction to sorted-containers

## Iteration

**⚠ Warning**:
None of the iterators allow you to insert or delete elements while iterating.
They produce undefined behavior if you do so.
(Miss ConcurrentModifyException?)
Native data structures like Map and Set allow concurrent modifications,
but they take great pains to do so for such relatively rare use cases.
