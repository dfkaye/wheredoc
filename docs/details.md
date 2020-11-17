# Details

- Prior Art
  - Goals
  - Problems
  - Simplifying
- Tour of spec formats
  - Docstring table
  - Docstring function
  - Object specifier
  - Docstring types
- Scenarios
  - Error scenarios (corrections)
- The Whole API is exposed
  - Opinion: Hiding everything is an anti-pattern

## Prior Art

The previous incarnation of this project is [where.js](https://github.com/dfkaye/where.js) created in 2014.

The intial inspiration comes from a post by [JP Castro](https://twitter.com/jphsf) from 2012, [DRYing Up Your JavaScript Jasmine Tests With the Data Provider Pattern](http://blog.jphpsf.com/2012/08/30/drying-up-your-javascript-jasmine-tests).

Here's JP's example with a custom `using()` function that wraps each Jasmine `it()` test.

```js
describe("username validation", function() {
  using("valid values", ["abc", "longusername", "john_doe"], function(value){
    it("should return true for valid usernames", function() {
      expect(validateUserName(value)).toBeTruthy();
    })
  })

  using("invalid values", ["ab", "name_too_long", "no spaces", "inv*alid"], function(value){
    it("should return false for invalid usernames", function() {
      expect(validateUserName(value)).toBeFalsy();
    })
  })
})
```

See also [data-driven](https://github.com/fluentsoftware/data-driven), an extension for mocha.js from [Fluent Software](https://github.com/fluentsoftware) which uses an approach similar to JP's `using()` function.

### Goals

With where.js, wanted to remove the need for the lengthy array argument, and took my next inspiration from [Spock's `where:` block](http://spockframework.org/spock/docs/1.0/data_driven_testing.html) and [Cucumber's Scenario Outline `Examples:` block](https://javapointers.com/automation/cucumber/cucumber-scenario-outline-example/), declaring the data table inside a three-asterisk comment syntax parsed from inside a function.

```js
describe("scenario", function () {
  it('test', function () {
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
});
```

The three-asterisk comment style comes from [mstring](https://github.com/rjrodger/mstring), a module for multi-line strings in Node.js by [Richard Rodger](https://twitter.com/rjrodger) in 2012.

### Problems

The goal of that [heredoc](https://en.wikipedia.org/wiki/Here_document) style was to make data-driven tests easy to read and write.

However, notice that `where()` is called inside of `it()`. In order to indicate which test variable were passing or failing, I had to customize the test reports to match the output of the different testing libraries using different `strategies` based on which testing library we used. This involved capturing a context, adding `log` and `intercept` fields, and so on, in order to work (almost) seamlessly with other testing libraries.

As "cool" as it felt to write at the time, it couples where to the testing library, making maintenance and extension more difficult.

And ease of maintenance is one of the points of test-driven development.

### Simplifying 

[wheredoc](https://github.com/dfkaye/wheredoc) no longer supports the notions of [log](https://github.com/dfkaye/where.js#log) or [intercept](https://github.com/dfkaye/where.js#intercept) which were added to where.js for the sake of identifying individual rows within a table where the expectation fails and printing (pass) or (fail) next to them in the test results.

Now, instead of the `where` clause appearing inside of `it` or `test` statements, `where` processes the docstring and returns an array of test scenarios. You then call `map` or `forEach` on that array, and call `scenario.test()` - or pass it to `it`, if you're using mocha-jasmine style `describe` functions, which in turn calls your `scenario.test()` function containing the assertions.

This approach **de-couples** the `where` clause from the mechanics of the test framework. There is no more need of defining a framework-specific [strategy](https://github.com/dfkaye/where.js#strategy).

## Tour of spec formats

*A tour of wheredoc spec formats, their flexibility, and other innovations.*

The wheredoc rewrite did not start out with the goal of supporting the same or more flexibility of the where.js library. It morphed suddenly once I had simplified the regular expression for extracting the psv (pipe separated values, i.e., `a | b`). After that, I tried the `Function.toString()` parsing test on string content following a [label statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label), and it worked.

### Docstring table

A docstring is a multiline string whose values are separated by the pipe characcter, `|`.

You can describe them in Spock style, without external table borders (| pipes).

```js
where: `
 a | b | c
 1 | 2 | 3
`
```

You can include the external table borders in Cucumber style, but these are optional.

```js
where: `
| a | b | c |
| 1 | 2 | 3 |
`
```

### Docstring function 

There are various ways you can define a `spec`.

`spec` can be a function that contains expectations or test assertions, and a `where:` label statement followed by a docstring.

```js
function spec(a, b, c) {
  expect(c).to.equal(a + b)

  where: `
    a |  b |  c
    1 |  2 |  3
  `;
}
```

The `where:` label statement replaces the triple-asterisk comment `/*** ... ***/` used in where.js.

Like JP's example, the specifier function accepts the names of the columns as variable mappings.

### Object specifier

A spec can be an object that contains two fields: `test`, an expectation function containing test assertions, and `doc`, a docstring. 

```js
var spec = {
  doc: `
    a |  b |  c
    1 |  2 |  3
  `,
  test: function(a, b, c) {
    expect(c).to.equal(a + b)
  }
}
```

Note that `doc` does *not* contain the `where:` label within in it.

As in JP's example, the `test` function accepts the names of the columns as variable mappings.

## Docstring types

The simplified regular expression that parses the docstring allows us to use many different "types" of string formats.

A docstring can be a template literal.

```js
where: `
  a |  b |  c
  1 |  2 |  3
`
```

A docstring can be a multiline string, using backslash linebreaks.

```js
where: "\
  a |  b |  c \
  1 |  2 |  3 \
"
```

A docstring can be a function with a comment. Note that the comment must start on the first line of function.

```js
where: function () {/*
    a |  b |  c 
    1 |  2 |  3 
  */
}
```

A docstring can be a labeled *comment* inside the spec function. Note that the comment should be terminated with a semi-colon, if it is not followed by any statements or expressions.

```js
function spec(a, b, c ) {
  // expectation...
  
  where: /*
    a |  b |  c \
    1 |  2 |  3 \
  */
  ;
}
```

## Scenarios

The `where(spec)` call returns an array of scenarios (or errors - more on that later). A scenario contains a `params` map of key-value pairs, and a `test` function that you either call directly or pass to the testing library's test invoker.

For example, in cases of the `describe`/`it` pattern used by [Mocha](https://mochajs.org/#bdd), `it` should be provided in the iteration callback over the scenarios collection, receiving a name and the test function.

```js
function spec(a, b, c) {
  expect(c).to.equal(a + b)

  where: `
    a |  b |  c
    1 |  2 |  3
  `;
}

where(spec).forEach(({ params, test }) => {
  var { a, b, c } = params
  
  it(`with ${a} and ${b}, expect ${c}.`, test)
})
```

In cases where the testing library uses a flattened pattern, such as [QUnit](https://qunitjs.com/), and [Tape](https://github.com/substack/tape), you can define the test name or message in the spec or test function itself, and call the scenario test directly in the iteration callback.

```js
function spec(a, b, c) {
  assert.equal(c, a + b, `with ${a} and ${b}, expect ${c}.`)

  where: `
    a |  b |  c
    1 |  2 |  3
  `;
}

where(spec).forEach(scenario => {
  scenario.test()
})
```

### Error Scenarios (corrections)

*Scenarios that throw errors or "corrections."*

Not all scenarios return params. These are error scenarios indicating some formatting or outline issue present in the spec. Every error scenario - or `correction` - contains a message about the correction to be made and a test function that will throw an error containing the message.

A docstring that contains no data rows, for example, will generate an error scenario containing an array of keys, an array of rows (empty, of course), plus the error message and the test function.

A docstring that contains data rows with a row that is missing a `|` operator will generate an error scenario for that row, containing the keys array, a tokens array containing the values found in that row, plus the error message and the test function.

## The whole API is exposed

The API lives under `where.doc`. You don't need to call any of it, just `where(fn)`, or `where({ doc, test })`. The API methods follow this flow:

+ where.doc.factory
  - where.doc.parse
  - where.doc.analyze
  - where.doc.scenario
    - where.doc.convert
    - where.doc.map

Once I had the initial design under test, I realized I did not like (or in some respects, understand) the naming of different responsibilities in the scenario parsing/generating sequence. Rather than hiding it all, I re-wrote the whole sequence by hand *with pen and paper* over a weekend (spare time, not the whole time). And once that read well enough, I re-implemented the design with a new TDD suite.

### Opinion

> Hiding everything is an anti-pattern.

We hear so frequently the question, "How can I test a private function?" The long answer, "If it doesn't have to be private, make it public," is more helpful than the short answer, "Don't."* If it's in JavaScript, you can try one of my suggestions on [testing private functions](https://gist.github.com/dfkaye/57fd3be707db9e23371c685a4129b5cb).

By exposing the internals in a namespace, I was able to 1) *not worry*, and 2) isolate different sequences of the process, which really helped with re-naming and making certain functions smaller. That's a win.
