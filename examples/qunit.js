/*
 * This suite runs with qunit and qunit-tap on NodeJS.
 * Run this suite from wheredoc root using:
 * 
 *    npm run qunit-node
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
let QUnit = require("qunit");

// We need to tap QUnit for the test results when running on node.js.
let QUnitTap = require("qunit-tap");

// Then aggregate the array of output entries.
var tap = QUnitTap(QUnit, function (...output) {
  console.log.apply(0, output)
});

tap.config.showExpectationOnFailure = 1;
tap.config.showTestNameOnFailure = 0;
tap.config.showModuleNameOnFailure = 0;
tap.config.showSourceOnFailure = 0; // this turns off the noisy stack trace

/*
 * To import an ES6 module (in this case, where.js):
 *  - use dynamic import() function
 *  - import the module via its filepath, including extension
 *  - use top-level await import(module_filepath)
 *  - use destructuring assignment in one step, not after.
 */
// let { where } = await import('../where.js')

// or just use import { ... }
import { where } from '../where.js';

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
      scenario.test();
    });

    done();
  })
})

// Finally, call QUnit.start().
// https://api.qunitjs.com/config/QUnit.config/
QUnit.start()
