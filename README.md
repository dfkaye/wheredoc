# wheredoc

Use docstring-like data tables in JavaScript tests, similar to Cucumber's Scenario Outline `Examples:` or Spock `where:` blocks.

```js
describe("Using Mocha and Chai.expect", (done) => {
  function spec(a, b, c) {
    expect(c).to.equal(a + b)

    where: `
      a  |  b  |  c
      1  |  2  |  3
      4  | -5  | -1
    `;
  }

  where(spec).forEach({ params, test } => {
    var { a, b, c } = params

    it(`${c} should equal ${a} + ${b}.`, test)
  })

  done()
})
```

## Scenarios

The `where(spec)` call returns an array of scenarios (or errors - more on that elsewhere). A scenario contains a `params` map of key-value pairs, and a `test` function.

In cases where the testing library uses a flattened pattern, such as [QUnit](https://qunitjs.com/), and [Tape](https://github.com/substack/tape), you can define the test name or message in the spec or test function itself, and call the scenario test directly in the iteration callback.

In cases where the testing library uses the describe-it pattern, such as [Mocha](https://mochajs.org/#bdd) and [Jasmine](https://jasmine.github.io/), you can define the test name in each scenario iteration function, then pass both the name and the test function, e.g., as `it(name, test)`.

Read more about this in the library [examples](/docs/examples.md) document.

## Requirements

ES2015 module support (i.e., JavaScript `import` statements):

+ Node.js: version 14, see details at https://nodejs.org/api/esm.html
+ Browsers: All but Internet Explorer, see table at https://caniuse.com/mdn-javascript_statements_import 

## Install

+ from npm: `npm install wheredoc`
+ from github: `git clone https://github.com/dfkaye/wheredoc.git`

## Main test suite

Created on Node.js, version 14.13.0, using Mocha 8.1.3 and Chai 4.2.0.

Run with `npm test`

## Example suites on Node.js

- mocha (using chai): `npm run mocha-node`
- qunit (using qunit-tap): `npm run qunit-node`
- tape (using tape-describe):  `npm run tape`

## Browser example suites

The browser suites run with [live-server](https://github.com/tapio/live-server) and download the testing libraries from https://unpkg.com. You should install live-server globally, `npm install -g live-server`, before running these examples.

- mocha (using chai): `npm run mocha`
- qunit:  `npm run unit`

## Further Documentation

+ [Details about prior art, redesign, defining specs, handling scenarios](/docs/details.md)
+ [Examples with different testing libraries](/docs/examples.md)
+ [Node.js interop between ES2015 modules and CommonJS](/docs/esm-cjs.md).
+ [Data table value types](/docs/values.md)
+ [Status, progress, to-do list](/docs/to-do.md)

## License

[MIT 2020](/LICENSE)
