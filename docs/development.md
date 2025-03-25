---
title: Development
---

# Development

This project uses pnpm to manage dependencies.
All the dependencies are development-time only.

The testing framework is Vitest.

To gain more insight on performance,
it is often useful to run the code in a browser instead of in Node,
as the developer tools in browsers do a better job of visualizing performance traces than command line tools.
Vite is included in devDependencies because of this,
and it is required by Vitest anyway.

## Implementation Details

The [Implementation Details](https://grantjenks.com/docs/sortedcontainers/implementation.html)
page in docs for sortedcontainers for Python explains the data structure better than I can.
The talks listed on its homepage are also worth watching if you prefer videos.
Even though they are in Python, the general principle stays the same for JavaScript.
I will not repeat what has been presented there.

The API design considerations are thoroughly documented in [Design Notes](notes.md).
