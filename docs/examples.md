# Examples

Some specifications using [mocha](https://mochajs.org/#bdd) and [chai](https://www.chaijs.com/api/bdd/), [qunit](https://qunitjs.com/), and [tape](https://github.com/substack/tape).

## Mocha BDD with Chai

```js
let { expect } = chai

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

### Node.js

You can view the mocha-node example at [/examples/mocha.js](/examples/mocha.js), and run the mocha node suite with `npm run mocha-node`.

### Browser

You can view the mocha browser example at [/examples/mocha.html](/examples/mocha.html), and run the mocha browser suite with `npm run mocha`.

Note: Bug found in Mocha 8.1.x which fails in strict Content-Security-Policy that does not allow `script-src 'unsafe-eval'` in browsers. See [Facebook Still Breaking Things](https://dfkaye.com/posts/2020/11/07/facebook-still-breaking-things/).

## QUnit

Note: On Node.js, you must call `QUnit.start()` *after* defining all modules.

```js
let { module, test } = QUnit

module("wheredoc", hooks => {
  test('should run the equals test', function (assert) {
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

### Node.js

On Node.js, we use [qunit-tap](https://github.com/twada/qunit-tap) to print the QUnit test results to the console. You can view the QUnit node example at [/examples/unit.js](/examples/qunit.js), and run the QUnit node suite with `npm run qunit-node`. 

### Browser

You can view the QUnit browser example at [/examples/qunit.html](/examples/qunit.html), and run the QUnit browser suite with `npm run qunit`.

## Tape

Tape is pretty easy, you just need to require it and call `test.end()` after running the scenarios.

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

### Node.js

On the Node.js example, we use [tape-describe](https://github.com/mattriley/tape-describe) to rename `tape` and `test`, and so forth. You can view the tape example at [/examples/tape.js](/examples/tape.js), and run the tape node suite with `npm run tape`.
