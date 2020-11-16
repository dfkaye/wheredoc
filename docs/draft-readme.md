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

## License

[MIT 2020](/LICENSE)
