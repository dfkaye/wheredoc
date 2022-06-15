/*
 * This suite is run with mocha and uses chai expect.
 * Run this suite from wheredoc root using:
 * 
 *    npm run mocha-node
 * 
 * Suite uses import syntax.
 */

import { where } from '../../where.js';
import chai from "chai";

let { assert, expect } = chai;

describe("mocha+chai", () => {
  describe("should pass", () => {
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

  describe("should fail", () => {
    function spec(a, b, c) {
      // chai assert style
      assert.equal(c, a + b)

      where: `
        a |  b |  c
        1 |  0 |  0
        2 |  2 |  3
       -2 | -2 | -3 // should fail
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
