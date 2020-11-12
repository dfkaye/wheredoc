# wheredoc

Use docstring-like data tables in JavaScript tests, similar to Cucumber's Scenario Outline `Examples:` or Spock `where:` blocks.

Status:
+ Docs are *in progress*.

Progress:
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
- *Nov 5: added examples for [qunit](https://qunitjs.com/) using [quit-tap](https://github.com/twada/qunit-tap).*
- *Nov 6: added examples for mocha browser and qunit browser suites.; re-considering Function() support in the evaluate() method due to strict CSP.*
- *Nov 7: reverted convert() to use JSON.parse() on object/array strings, allowing strict no-eval CSP in QUnit tests; mocha browser tests still requires unsafe-eval due to regenerator-runtime.js dependency. *
- *Nov 8: point mocha.html to mocha 7.0.1, removes runtime.js dependency and eval/Function() error in strict CSP.*
- Nov 11: rename draft as where; move old where and mocha to legacy; add mocha example; move live-server-fix to examples; version 0.0.4; JSDoc added to where.js.

## Run tests

+ main suite: `npm test`
+ node examples:
  - mocha (using chai): `npm run mocha-node`
  - qunit (using qunit-tap): `npm run qunit-node`
  - tape:  `npm run tape`
+ browser examples (using live-server and unpkg.com):
  - mocha (using chai): `npm run mocha`
  - qunit:  `npm run unit`
  
## Prior art

[where.js](https://github.com/dfkaye/where.js) tests are modeled on [Spock's `where:` block](http://spockframework.org/spock/docs/1.0/data_driven_testing.html) and [Cucumber's Scenario Outline `Examples:` block](https://javapointers.com/automation/cucumber/cucumber-scenario-outline-example/), using these embedded in a three-asterisk comment syntax parsed from inside a function.

```js
it('test name...', function () {
  where(function(){
    /*** 
      a  |  b  |  c
      1  |  2  |  3
      4  |  3  |  7
      6  |  6  |  12
    ***/

    expect(a + b).to.equal(c);
    expect(c - a).to.equal(b);
  });
});
```

Aside: for more on blocks in Cucumber, read about the [difference between Cucumber's examples and data blocks](https://medium.com/@priyank.it/cucumber-difference-between-examples-table-data-table-21501f2becbd).

We took that approach because at the time (2014) JavaScript did not support multi-line strings as neatly as a function comment (or so I thought), and the template literal syntax was not yet implemented.

The goal of that [heredoc](https://en.wikipedia.org/wiki/Here_document) style was to make data-driven tests easy to read and write.

The stretch goal was to customize the test reports to match the output of the different testing libraries. As "cool" as it felt to write at the time, in between states of stress and exhaustion, I now think that kind of cleverness costs too much to maintain.

And ease of maintenance is one of the points of test-driven development.

## Simplifying

The maintenance problem arose due to "where" the `where` function is called. Once that is corrected in the new design, then the logic for error messaging, strategies, etc., is largely simplified.

[wheredoc](https://github.com/dfkaye/wheredoc) supports a simpler setup to reduce the cleverness, using a test specifier with a `doc` field pointing to a template literal string instead of a special comment syntax, and a `test` field pointing to a function containing the assertions.

```js
where({
  test: (a,b,c) => {
    expect(a + b).to.equal(c);
    expect(c - a).to.equal(b);
  },
  doc: ` 
    a  |  b  |  c
    1  |  2  |  3
    4  |  3  |  7
    6  |  6  |  12
  `
});
```

The `doc` field can also be formatted as a multi-line string, using backslash notation (`\`) at the end of each line.

```js
where({
  test: (a,b,c) => {
    expect(a + b).to.equal(c);
    expect(c - a).to.equal(b);
  },
  doc: "\
    a  |  b  |  c		\
    1  |  2  |  3		\
    4  |  3  |  7		\
    6  |  6  |  12	\
  "
});
```

## Decoupling

[wheredoc](https://github.com/dfkaye/wheredoc) no longer supports the notions of [log](https://github.com/dfkaye/where.js#log) or [intercept](https://github.com/dfkaye/where.js#intercept). These were added to where.js for the sake of identifying individual rows within a table where the expectation fails and printing (pass) or (fail) next to them in the test results.

Now, instead of the `where` clause appearing inside of `it` or `test` statements, `where` processes the docstring and returns an array of test scenarios. You then call `map` or `forEach` on that array, and call `scenario.test()` - or pass it to `it` if you're using mocha-jasmine style `describe` functions which in turn calls your `scenario.test` function containing the assertions.

That approach de-couples the `where` clause from the mechanics of the test framework. There is no more need of defining a framework-specific [strategy](https://github.com/dfkaye/where.js#strategy).

## Examples

### Mocha BDD UI

```js
describe('mocha + chai', (done) => {
  function spec() {
    expect(c).to.equal(a + b)

    where: `
    a | b | c
    1 | 2 | 3
    "h" | 'b' | "one, 'please'" // should fail
    `;
  }

  where(spec).forEach(scenario => {
    var { a, b, c } = scenario.params

    /*
     * mocha requires the it() function to run all scenarios;
     * otherwise, it reports nothing for passing assertions,
     * and halts on the first failing assertion.
     */

    it(`with ${a} and ${b}, should get ${c}`, scenario.test)
  });

  done();
});
```

### QUnit

Note: On node.js, we use qunit-tap to print the QUnit test results to the console.

```js
let { module: describe, test: it } = QUnit

describe("wheredoc", hooks => {
  it('should run the equals test', function (assert) {
    var done = assert.async();

    function spec(a, b, c) {
      assert.equal(a + b, c, `with ${a} and ${b} expect ${c}.`);

      where: `
      a | b | c
      1 | 2 | 3
      "h" | 'b' | "one, 'please'" // should fail
      `;
    }

    where(spec).forEach((scenario, i) => {

      /*
       * You can call the test function directly in QUnit.
       */

      scenario.test();
    });

    done();
  })
})

// Finally, call QUnit.start().
// https://api.qunitjs.com/config/QUnit.config/
QUnit.start()
```

### tape

```js
tape('suite', function(test) {
  function spec(a, b, c) {

    test.equal(a + b, c, `with ${a} and ${b}, expect ${c}`);

    where: `
    a | b | c
    1 | 2 | 3
    "h" | 'b' | "one, 'please'" // should fail
    `;
  }

  where(spec).forEach(scenario => {

    /*
     * You can call the test function directly in tape.
     */

    scenario.test()
  });

  test.end();
});
```

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
  + how to run the tests
  + how to import ES6 modules into commonJS.
    - https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs
    - https://exploringjs.com/impatient-js/ch_modules.html#import.meta.url-on-node.js

## docstring function variant

- started 21 October 2020
- **done, 2 November 2020**

```js
// docstring function
function spec(a, b, c) {
  expect(a + b).to.equal(c);
  expect(c - a).to.equal(b);

  where: `
  a  |  b  |  c
  1  |  2  |  3
  4  |  3  |  7
  6  |  6  |  12
  `;
}
```

```js
// object specifier with doc and test fields
var spec = {
  test: function(a, b, c) {
    expect(a + b).to.equal(c);
    expect(c - a).to.equal(b);
  },
  doc: `
    a  |  b  |  c
    1  |  2  |  3
    4  |  3  |  7
    6  |  6  |  12
  `
}
```

`where` returns an array of scenarios, one for each data row, including its `params` map and a `test` function that you pass to your testing library's `it` or `test` functions. Here's a destructuring assignment example.

```js
where(spec).forEach(scenario => {
  var { params: p, test } = scenario

  it(`with ${p.a} and ${p.b}, should get ${p.c}`, test)
})
```

If there's a name conflict with `test`, however, you can de-conflict by using an alias when destructuring the scenario, for example,

```js
where(spec).scenarios.forEach({ params: p, test: t } => {
  var { a, b, c } = p;

  test(`with ${a} and ${b}, should get ${c}`, t)
});
```

or reference `scenario.test`.

```js
where(spec).scenarios.forEach(scenario => {
  var { a, b, c } = scenario.params;

  test(`with ${a} and ${b}, should get ${c}`, scenario.test)
});
```
