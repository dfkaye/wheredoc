/*
 * This suite is run with mocha and uses chai expect.
 * Run this suite from wheredoc root using:
 * 
 *    npm run mocha-node
 * 
 * Suite uses import syntax. Dependencies can be required or imported per the
 * steps outlined next.
 */

/*
 * To import a commonJS module (in this case, chai.js):
 *  - import createRequire from 'module'
 *  - declare require = createRequire(import.meta.url);
 *  - require the module via its filepath, including extension.
 *  - use destructuring assignment after module is loaded.
 */
import { createRequire } from 'module';
let require = createRequire(import.meta.url);
let chai = require("chai");
let { assert, expect } = chai;

/*
 * To import an ES6 module (in this case, where.js):
 *  - use dynamic import() function
 *  - import the module via its filepath, including extension
 *  - use top-level await import(module_filepath)
 *  - use destructuring assignment in one step, not after.
 */
// let { where } = await import('./where.js')

// or just use import { ... }
import { where } from '../where.js';

describe("mocha+chai", () => {
  describe("passing", () => {
    function spec(a, b, c) {
      // chai expect style
      expect(c).to.equal(a + b)

      where: `
        a |  b |  c
        0 |  0 |  0
        1 |  2 |  3
       -1 | -2 | -3
      `;
    }

    where(spec).forEach(({ params, test }) => {
      var { a, b, c } = params;

      /*
       * mocha requires the it() function to run all scenarios;
       * otherwise, it reports nothing for passing assertions,
       * and halts on the first failing assertion.
       */

      it(`with ${a} and ${b}, expect ${c}`, test)
    })
  })

  describe("failing", () => {
    function spec(a, b, c) {
      // chai assert style
      assert.equal(c, a + b)

      where: `
        a |  b |  c
        1 |  0 |  0
        2 |  2 |  3
       -2 | -2 | -3
      `;
    }

    where(spec).forEach(({ params, test }) => {
      var { a, b, c } = params;

      /*
       * mocha requires the it() function to run all scenarios;
       * otherwise, it reports nothing for passing assertions,
       * and halts on the first failing assertion.
       */

      it(`with ${a} and ${b}, expect ${c}`, test)
    })
  })
})
