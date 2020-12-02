# Status

Tracking the thought process, interruptions, things to do, etc.

## Progress

- *started: 2 Oct 2020*
- *3 Oct 2020: in progress*
- *2 week break for irrigation, faucet, buddleia, downspout drainage, fence post*
- *16 Oct 2020: getting back to it - round trip done; more todos coming*
- *19 Oct 2020: resuming wheredoc group tests, empty doc, empty params, better error messages*
- *dirt redistribution (berms)*
- *19-20 Oct: docstring variant started*
- *wheredoc redesign by hand on binder paper*
- *26-28 Oct 2020:
  - tests still incomplete; design works but is hard to follow (same with tests);
  - docstring draft supports both where(spec) or where({ doc, test });
  - better regex for row extractions
  - doctring in spec function demarcated by a `where:` label, following by multiline string `...`;
  - support testing the transformation sequence by exporting `where.doc.<method>` namespace;
  - refactoring the new design in draft.js;
  - supports external table borders ( | a | b | c | OR a | b | c);
- *29-30 Oct 2020: draft about ready for re-testing; changed outline to correct, added corrections;*
- *Nov 1: started putting draft,js under new test.js*
- *Nov 2: test.js has draft.js covered.*
- *Nov 4: string token tests, working examples for [tape](https://github.com/substack/tape) and [tape-describe](https://github.com/mattriley/tape-describe)*
- *Nov 5: added examples for [qunit](https://qunitjs.com/) using [qunit-tap](https://github.com/twada/qunit-tap).*
- *Nov 6: added examples for mocha browser and qunit browser suites.; re-considering Function() support in the evaluate() method due to strict CSP.*
- *Nov 7: reverted convert() to use JSON.parse() on object/array strings, allowing strict no-eval CSP in QUnit tests; mocha browser tests still requires unsafe-eval due to regenerator-runtime.js dependency. *
- *Nov 8: point mocha.html to mocha 7.0.1, removes runtime.js dependency and eval/Function() error in strict CSP.*
- Nov 11: rename draft as where; move old where and mocha to legacy; add mocha example; move live-server-fix to examples; version 0.0.4; JSDoc added to where.js.
- Nov 16-17: Add docs folder, document different concerns, bump version 0.0.5.
- Dec 2: Fix mocha browser example CSP errors: move all imports to a single script and fetch that using a script element.

## To Do

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
  - **yes ->** OR require valid JSON and run JSON.parse(json).
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
    + **done** Shorten the README
    + Move longer narrative to dfkaye.com blog.
  + **done** create Docs folder
    + **done** Value conversions in docstrings
    + **done** how to run the tests
    + **done** how to import ES6 modules into commonJS.
      - https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs
      - https://exploringjs.com/impatient-js/ch_modules.html#import.meta.url-on-node.js
