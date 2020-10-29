/*
 * This suite is run with mocha and uses chai expect.
 * Run this suite from wheredoc root using:
 * 
 *    npm test
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
let { spec, where, parse, build, convert } = await import('../where.js')

// or just use import { ... }
// import { where, parse, build, convert } from '../../where.js';

describe("wheredoc", () => {
  describe("scenarios", () => {
    var { scenarios, errors } = spec((a, b, c) => {
      expect(c).to.equal(a + b);

      where: `
      a | b | c
      0 | 0 | 0
      1 | 2 | 3
      -1 | -2 | -3
      `;
    })

    scenarios.forEach(scenario => {
      var { params: p, apply } = scenario;

      it(`with ${p.a} and ${p.b}, expect ${p.c}`, apply)
    })
  })

  describe("errors", () => {
    var { scenarios, errors } = spec((a, b, c) => {
      expect(c).to.equal(a + b);

      where: `
      a | b | c
     // 0 | 0 | 1
     // 1 | -2 | 3
     // 1 | -2 | -3
      `;
    })

    scenarios.forEach(scenario => {
      var { params: p, apply } = scenario;

      expect(apply).to.throw();

      // it(`with ${p.a} and ${p.b}, expect ${p.c}`, apply)
    })
  })
})