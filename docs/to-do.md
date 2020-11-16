## To do

+ **done** better error messaging
+ **done** more `parse()` assertions (comments, commented rows)
+ **done** convert "Number.RESERVED_CONSTANT" to Number.RESERVED_CONSTANT
+ **done** convert Objects and Arrays -- uses `Function("return (" + value +");").call()`
  - merge a and b to get c:
  - { name: 'test' } | { value: 'added' } | { name: 'test', value: 'added' }
  - concat a and b to get c:
  - ['a'] | ['b'] | [ 'a', 'b' ]
+ **done** scenario.params as an enum, e.g., { a: 1, b: 2, c: 3 }
+ **done** try the docstring function that contains a where: label (see below)
+ **done** test suite for refactored wheredoc
+ **done** RECONSIDER support for Objects and Arrays, *because* of `eval/Function` in strict CSP environments
  - *no* may need json normalize to make writing easier,
  - **yes** OR require valid JSON and run JSON.parse(json).
+ create nodejs usage examples
  - **done** mocha + chai
  - **done** qunit + qunit-tap - https://qunitjs.com/intro/#in-node
  - **done** tape
+ create browser usage examples (using [live-server](https://github.com/tapio/live-server))
  - **done** mocha + chai
  - **done** qunit 
  + **done** DOM interactions, element queries, attributes

+ Docs ***in progress***
  + **done** JSDoc in where.js
    + Shorten the README
    + Move longer narrative to dfkaye.com blog.
  + **done** create Docs folder
    + **done** how to run the tests
    + **done** how to import ES6 modules into commonJS.
      - https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs
      - https://exploringjs.com/impatient-js/ch_modules.html#import.meta.url-on-node.js

