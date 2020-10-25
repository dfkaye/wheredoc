# wheredoc

*3 Oct 2020: in progress*

*16 Oct 2020: getting back to it - round trip done; more todos coming*
*19 Oct 2020: resuming wheredoc group tests, empty doc, empty params, better error messages*

Started: 2 Oct 2020

Use docstring-like data tables in JavaScript tests, similar to Cucumber `scenario outline` examples or Spock `where` blocks.

Status:
+ Docs incomplete.
+ Test cases incomplete.
+ Squatting name to replace and deprecate where.js. 

## Run tests

`npm run mocha`

## Prior art

[where.js](https://github.com/dfkaye/where.js) tests are modeled on Spock's `where` clause and Cucumber's scenario outline, using these embedded in a three-asterisk comment syntax parsed from inside a function.

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

The goal of that [heredoc](https://en.wikipedia.org/wiki/Here_document) style was to make data-driven tests easy to read and write. As "cool" as it felt to write at the time, in between states of stress and exhaustion, I now think that kind of cleverness costs too much to maintain.

And ease of maintenance is one of the points of test-driven development.

## Simplifying

[wheredoc](https://github.com/dfkaye/wheredoc) uses a simpler setup to reduce the cleverness, using a test specifier with a `doc` field pointing to a template literal string instead of a special comment syntax, and a `test` field pointing to a function containing the assertions.

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

[wheredoc](https://github.com/dfkaye/wheredoc) no longer supports the notions of log](https://github.com/dfkaye/where.js#log) or [intercept](https://github.com/dfkaye/where.js#intercept). These were added to where.js for the sake of identifying individual rows within a table where the expectation fails.

As a result, instead of the `where` clause appearing inside of `it` or `test` statements, `where` generates row data and returns an array. You then call `map` or `forEach` on that array, accepting a function param in your iterator, and then calling that function which in turn runs your `test` function containing the assertions.

That now de-couples the `where` clause from the mechanics of the test framework. There is no more need of defining a framework-specific [strategy](https://github.com/dfkaye/where.js#strategy).

## Examples

```
var doc = `
a | b | c
1 | 2 | 3
4 | 5 | 9.0
"h" | 'b' | "one, 'please'" // should fail
`;
```

### Mocha BDD UI

```
describe('suite', (done) => {
  var test = function (a, b, c) {
	  expect(a + b).to.equal(c);
  }

	where({ doc, test }).each({name, fn} => {
		it(name, fn);
	});

  done();
});
```

### Mocha TDD UI

```
suite('suite', (done) => {
  var assert = function (a, b, c) {
	  expect(a + b).to.equal(c);
  };

	where({ doc, test: assert }).each({name, fn} => {
		test(name, () => {
      fn();
    });
	});

  done();
});
```

### QUnit

```
Qunit.module('suite');

Qunit.test('where', (test) => {
  var done = test.async();

  var assert = function (a, b, c) {
	  test.equal(a + b, c);
  };

  where({ doc, test: assert }).each({name, fn} => {
    fn();
  });

  done();
});
```

### tape

```
tape('suite', function(test) {
  var assert = function(a, b, c) {
    test.equal(a + b, c);
  };

  where({ doc, test: assert }).each({name, fn} => {
    fn();
  });

  test.end();
});
```

## To do

+ done better error messaging
+ done more `parse()` assertions (comments, commented rows)
+ done convert "Number.RESERVED_CONSTANT" to Number.RESERVED_CONSTANT
+ done convert Objects and Arrays -- uses `Function("return (" + value +");")(0)`
  - merge a and b to get c:
  - { name: 'test' } | { value: 'added' } | { name: 'test', value: 'added' }
  - concat a and b to get c:
  - ['a'] | ['b'] | [ 'a', 'b' ]
+ done scenario.params as an enum, e.g., { a: 1, b: 2, c: 3 }

+ support localized currency, number formats
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat

+ verifying DOM structure, element presence, attributes

+ in progress ~ base test suite for wheredoc itself

+ try the docstring function that contains a where: label (see below)

+ create nodejs usage examples
  - mocha TDD
  - qunit - https://qunitjs.com/intro/#in-node
  - tape
+ create browser usage examples (using live-server)
  - mocha BDD
  - qunit

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
// doc is a docstring or a function containing a docstring. If it's a function,
// and test is not defined as a function, doc will be used as the test function.
function where({ doc, test }) {
  // Object(doc): if doc is nothing, get a base object; else it returns doc unmodified.
  var fs = Object(doc).toString();
  var match = fs.match(/(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/);
  // When match fails to match, it returns null. We check that match exists
  // and that its second entry which excludes the non-captured group also
  // exists; if it does, then match[1] is assigned; otherwise fall back to the
  // empty string.
  var ds = match && match[1] || "";

// About /(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/
// That RegExp extracts each row of the data table after the where label (non capture),
// containing at least one | and newline, and supports multiple formats, starting
// with a `where:` label inside the doc test function:

//  where: ` ... `;
//  where: /* ... */; <-- requires trailing semi-colon if no other statements follow>
//  where: " ... \n\ ... ";
//  where: () => { .... };

  console.log(ds);
  
  var fn = typeof test == 'function'
    ? test
    : typeof doc == 'function
      ? doc
      : function() { throw new Error(`No test function defined for doc, ${ doc }`) };

    fn(/* params */);
}

// docstring function
function doc(a, b, c) {
  where: `
  a  |  b  |  c
  1  |  2  |  3
  4  |  3  |  7
  6  |  6  |  12
  `;

  expect(a + b).to.equal(c);
  expect(c - a).to.equal(b);
}

// where returns an array of scenarios, one for each data row, including its
// name (param list) and a test function that you pass to your testing library's
// it or test. Here's a destructuring assignment example:
where({ doc }).scenarios.forEach({ name, test } => {
  it(name, test);
});

// If there's a name conflict with `test`, however, you can de-conflict by using
// the non-destructured scenario (or item or other name), for example:
where({ doc }).scenarios.forEach(scenario => {
  test(scenario.name, scenario.test);
});
```
