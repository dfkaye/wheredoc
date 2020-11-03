# wheredoc

Status:
+ Docs incomplete.
+ Test cases incomplete.
+ Squatting name to replace and deprecate where.js. 

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

Use docstring-like data tables in JavaScript tests, similar to Cucumber `scenario outline` examples or Spock `where` blocks.

## Run tests

`npm test`

## Prior art

[where.js](https://github.com/dfkaye/where.js) tests are modeled on [Spock's `where:` block](http://spockframework.org/spock/docs/1.0/data_driven_testing.html) and [Cucumber's scenario outline `Examples:` block](https://javapointers.com/automation/cucumber/cucumber-scenario-outline-example/), using these embedded in a three-asterisk comment syntax parsed from inside a function.

```js
it('description', function () {
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

We took that approach because at the time (2014) JavaScript did not support multi-line strings as neatly as a function comment, and the template literal syntax was not yet implemented.

The goal of that [heredoc](https://en.wikipedia.org/wiki/Here_document) style was to make data-driven tests easy to read and write.

As "cool" as it felt to write at the time, in between states of stress and exhaustion, I now think that kind of cleverness costs too much to maintain.

And ease of maintenance is one of the points of test-driven development.

(Update 28 Oct 2020: Incorrect. The maintenance problem arose due to "where" the where function is called. Once that is corrected in the new design, then the logic for error messaging, strategies, etc., is drastically simplified.)

## Simplifying

*Need to update this: it is now false*

[wheredoc](https://github.com/dfkaye/wheredoc) supports a simpler setup to reduce the cleverness, using a test specifier with a `doc` field pointing to a template literal string instead of a special comment syntax, and a `test` field pointing to a function containing the assertions.

`where: \`...\`;`

```js
it('description', function () {
  where({
    doc: ` 
      a  |  b  |  c
      1  |  2  |  3
      4  |  3  |  7
      6  |  6  |  12
    `,

		test: (a,b,c) => {
			expect(a + b).to.equal(c);
			expect(c - a).to.equal(b);
		}
  });
});
```

The `doc` field can also be formatted as a multi-line string, using backslash notation, but in that case, each line must end with a newline character, followed by the backslash (`\n\`).

```js
it('description', function () {
  where({
    doc: "\
      a  |  b  |  c		\n\
      1  |  2  |  3		\n\
      4  |  3  |  7		\n\
      6  |  6  |  12	\n\
    ",

		test: (a,b,c) => {
			expect(a + b).to.equal(c);
			expect(c - a).to.equal(b);
		}
  });
});
```

## Decoupling

[wheredoc](https://github.com/dfkaye/wheredoc) no longer supports the notions of log](https://github.com/dfkaye/where.js#log) or [intercept](https://github.com/dfkaye/where.js#intercept). These were added to where.js for the sake of identifying individual rows within a table where the expectation fails and printing (pass) or (fail) next to them in the test results.

Now, instead of the `where` clause appearing inside of `it` or `test` statements, `where` generates row data and returns an array. You then call `map` or `forEach` on that array, accepting a function param in your iterator, and then calling that function which in turn runs your `test` function containing the assertions.

That approach de-couples the `where` clause from the mechanics of the test framework. There is no more need of defining a framework-specific [strategy](https://github.com/dfkaye/where.js#strategy).

## Examples

### Mocha BDD UI

```
describe('bdd', (done) => {
  function spec() {
    expect(c).to.equal(a + b)

    where: `
    a | b | c
    1 | 2 | 3
    "h" | 'b' | "one, 'please'" // should fail
    `;
  }

  where(spec).forEach(scenario => {
    var { params: p, test } = scenario

    it(`with ${p.a} and ${p.b}, should get ${p.c}`, test)
  });

  done();
});
```

### Mocha TDD UI

```
suite('tdd', (done) => {
  function spec() {
    expect(c).to.equal(a + b)

    where: `
    a | b | c
    1 | 2 | 3
    "h" | 'b' | "one, 'please'" // should fail
    `;
  }

  where(spec).forEach(scenario => {
    var { params: p, test: t } = scenario

    test(`with ${p.a} and ${p.b}, should get ${p.c}`, t)
  });

  done();
});
```

### QUnit

```
Qunit.module('suite');

Qunit.test('where', (test) => {
  var done = test.async();

  function spec(a, b, c) {
    test.equal(a + b, c);

    where: `
    a | b | c
    1 | 2 | 3
    "h" | 'b' | "one, 'please'" // should fail
    `;
  }

  where(spec).forEach(scenario => {
    var { params: p, test: t } = scenario

    test(`with ${p.a} and ${p.b}, should get ${p.c}`, t)
  });

  done();
});
```

### tape

```
tape('suite', function(test) {
  function spec(a, b, c) {
    test.equal(a + b, c);

    where: `
    a | b | c
    1 | 2 | 3
    "h" | 'b' | "one, 'please'" // should fail
    `;
  }

  where(spec).forEach(scenario => {
    var { params: p, test: t } = scenario

    test(`with ${p.a} and ${p.b}, should get ${p.c}`, t)
  });

  test.end();
});
```

## To do

+ done better error messaging
+ done more `parse()` assertions (comments, commented rows)
+ done convert "Number.RESERVED_CONSTANT" to Number.RESERVED_CONSTANT
+ done convert Objects and Arrays -- uses `Function("return (" + value +");").call()`
  - merge a and b to get c:
  - { name: 'test' } | { value: 'added' } | { name: 'test', value: 'added' }
  - concat a and b to get c:
  - ['a'] | ['b'] | [ 'a', 'b' ]
+ done scenario.params as an enum, e.g., { a: 1, b: 2, c: 3 }
+ done: try the docstring function that contains a where: label (see below)
+ **done** test suite for refactored wheredoc

+ create nodejs usage examples
  - mocha TDD
  - qunit - https://qunitjs.com/intro/#in-node
  - tape
+ create browser usage examples (using live-server)
  - mocha BDD
  - qunit
+ verifying DOM structure, element presence, attributes
+ support localized currency, number formats
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat

+ (not covered: jest, jasmine, ava, riteway, cypress)

+ Docs
  + Shorten the README
  + Move longer narrative to dfkaye.com blog.
+ create Docs folder
  + how to run the tests
  + how to import ES6 modules into commonJS.
    - https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs
    - https://exploringjs.com/impatient-js/ch_modules.html#import.meta.url-on-node.js

## docstring function variant - in progress 21 october 2020

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

`where` returns an array of scenarios, one for each data row, including its `params` map and a `test` function that you pass to your testing library's `it` or `test` functions. Here's a destructuring assignment example:

```js
where(spec).forEach(scenario => {
  var { params: p, test } = scenario

  it(`with ${p.a} and ${p.b}, should get ${p.c}`, test)
})
```

If there's a name conflict with `test`, however, you can de-conflict by using an alias when destructuring the scenario, for example:

```js
where({ doc }).scenarios.forEach(scenario => {
  var { params: p, test: t } = scenario

  test(`with ${p.a} and ${p.b}, should get ${p.c}`, t)
});
```
