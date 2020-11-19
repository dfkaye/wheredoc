# Node.js interop between ES2015 modules and CommonJS

Because `wheredoc` is an ESM (ES2105 module), specified with `type: "module"` in [package.json](/package.json), other modules cannot use the CommonJS `require` syntax to import it.

Found the answers to this problem in the following articles.

- https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs
- https://exploringjs.com/impatient-js/ch_modules.html#import.meta.url-on-node.js

## Import CommonJS

To import a CommonJS module (in this case, chai.js):
- import createRequire from 'module'
- declare require = createRequire(import.meta.url);
- require the module via its package name or its filepath if it is not a package.
- use destructuring assignment after module is loaded.

```js
import { createRequire } from 'module';
let require = createRequire(import.meta.url);

let chai = require("chai");
let { assert, expect } = chai;
```

## Import ESM

To import ESM (in this case, where.js):
- import the moducle via its filepath, including its extension
- use dynamic `import()` function with top-level `await`, **or** use the `import` statement
- use destructuring assignment in one step, not after.

```js
// dynamic import with top-level await
let { where } = await import('../where.js')

// import statement
import { where } from '../where.js';
```
