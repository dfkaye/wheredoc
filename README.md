# wheredoc

*3 Oct 2020: in progress*

Started: 2 Oct 2020

Data-driven test clauses using docstring-like data tables in JavaScript, in nodejs or browsers.

squat name for where.js deprecation and refactor 

## Prior art

[where.js](https://github.com/dfkaye/where.js) tests are modeled on spock's where clause and cucumber's scenario table, using these embedded in a three-star comment syntax parsed from inside a function.

```js
it('description', function () {
  where(function(){
    /*** 
      a  |  b  |  c
      1  |  2  |  3
      4  |  3  |  7
      6  |  6  |  12
    ***/
		
		expect(a + b).toBe(c);
		expect(c - a).toBe(b);
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
			expect(a + b).toBe(c);
			expect(c - a).toBe(b);
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
			expect(a + b).toBe(c);
			expect(c - a).toBe(b);
		}
  });
});
```

## Decoupling

[wheredoc](https://github.com/dfkaye/wheredoc) no longer supports the notions of log](https://github.com/dfkaye/where.js#log) or [intercept](https://github.com/dfkaye/where.js#intercept). These were added to where.js for the sake of identifying individual rows within a table where the expectation fails.

As a result, instead of the `where` clause appearing inside of `it` or `test` statements, `where` generates row data and returns an array. You then call `map` or `forEach` on that array, accepting a function param in your iterator, and then calling that function which in turn run your `test` function containing the assertions.

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
  var assert = function (a, b, c) {
	  expect(a + b).toBe(c);
  }

	where({ doc, assert }).each({name, fn} => {
		it(name, fn);
	});

  done();
});
```

### Mocha TDD UI

```
suite('suite', (done) => {
  var assert = function (a, b, c) {
	  expect(a + b).toBe(c);
  };

	where({ doc, assert }).each({name, fn} => {
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

  where({ doc, assert }).each({name, fn} => {
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

  where({ doc, assert }).each({name, fn} => {
    fn();
  });

  test.end();
});
```

## To do

+ finish all the parts testing
+ convert "Number.RESERVED_CONSTANT" to Number.RESERVED_CONSTANT
+ support localized currency, number formats
+ nodejs examples
  - mocha TDD
  - tape
+ browser examples (using live-server)
  - mocha BDD
  - qunit
+ Docs
  + Shorten the README
  + Move longer narrative to dfkaye.com blog.
+ create Docs folder
  + how to run the tests
  + how to import ES6 modules into commonJS.
    - https://nodejs.org/api/esm.html#esm_interoperability_with_commonjs
    - https://exploringjs.com/impatient-js/ch_modules.html#import.meta.url-on-node.js
