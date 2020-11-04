/*
 * This suite is run with tape.
 * Run this suite from wheredoc root using:
 * 
 *    npm run tape
 * 
 * Suite uses import syntax. Dependencies can be required or imported per the
 * steps outlined next.
 */

/*
* To import a commonJS module:
*  - import createRequire from 'module'
*  - set require = createRequire(import.meta.url);
*  - require the module via its filepath, including extension.
*  - destructuring assignment after module is loaded.
*/
import { createRequire } from 'module';
let require = createRequire(import.meta.url);
let tape = require("tape");

// use tape-describe
let describe = require("tape-describe")

/*
 * To import an ES6 module (in this case, where.js):
 *  - use dynamic import() function
 *  - import the module via its filepath, including extension
 *  - use top-level await import(module_filepath)
 *  - use destructuring assignment in one step, not after.
 */
// let { where } = await import('./where.js')

// or just use import { ... }
import { where } from '../draft.js';

tape('tape passing example', function (test) {
  function spec(a, b, c) {

    // tape's test runs here, accepts testName param.
    test.equal(a + b, c, `with ${a} and ${b}, expect ${c}`);

    where: `
    a | b | c
    1 | 2 | 3
    6 | 9 | 15
    A | B | AB // string concatenation
    "A ", | "B " | "A ","B " // quoted string concatenation
    `;
  }

  var scenarios = where(spec);

  // You can use # of scenarios to call plan()
  test.plan(scenarios.length);

  scenarios.forEach(scenario => {
    var { a, b, c } = scenario.params

    // You can use params in a tape comment.
    test.comment(`with ${a} and ${b}, expect ${c}`)

    scenario.test();
  });

  // Or you can call end() when done.
  test.end();
});

tape('tape error example', function (test) {
  function spec(a, b, c) {

    // tape's test runs here, and accepts a testName param.
    // Without that param, tape will print its own error, e.g.,
    // Error: should be strictly equal
    test.equal(a + b, c, `with ${a} and ${b}, expect ${c}`);

    /*
    tape will report fails from this test by throwing an error to generate a
    stack trace that looks like this:

    not ok 5 with 3 and 2, expect 1
      ---
        operator: equal
        expected: 1
        actual:   5
        stack: |-
          Error: with 3 and 2, expect 1
      */
    ;

    where: `
    a | b | c
    3 | 2 | 1   // should fail
    X | Y | Z  // string concatenation 
    `;
  }

  var scenarios = where(spec);

  // We double this number because we use an additional .throws() tests in each
  // scenario. 
  test.plan(scenarios.length * 2);

  scenarios.forEach(scenario => {
    var { a, b, c } = scenario.params

    var testName = `should throw when ${a} + ${b} isn't ${c}`;

    // tape catches thrown Test and reports as ok, e.g.,
    // ok 8 throws when X + Y isn't Z
    test.throws(scenario.test(), testName)
  });

  // Or you can call end() when done.
  test.end();
});

// using tape-describe
describe('using tape-describe', it => {
  it('should work', test => {
    function spec(a, b, c) {
      test.equal(a + b, c, `with ${a} and ${b}, expect ${c}`);

      where: `
      a | b | c
      3 | 5.5 | 8.5 
      `;
    }

    where(spec).forEach(scenario => {
      scenario.test()
    })

    test.end();
  });

  it('should fail', test => {
    function spec(a, b, c) {
      test.equal(a + b, c, `with ${a} and ${b}, expect ${c}`);

      where: `
      a | b | c
      B | A | ABC 
      `;
    }

    where(spec).forEach(scenario => {
      scenario.test()
    })

    test.end();
  });
});
