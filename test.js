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
// let { where } = await import('./where.js')

// or just use import { ... }
import { where } from './draft.js';

describe("wheredoc", () => {

  describe("where(fn)", () => {
    var spec = (a, b, c) => {
      expect(c).to.equal(a + b)

      where: `
       a |  b |  c
       0 |  0 |  0
       1 |  2 |  3
      -1 | -2 | -3
      `;
    }

    var scenarios = where(spec)

    scenarios.forEach(scenario => {
      var { params: p, test } = scenario;

      it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
    })
  })

  describe("factory", () => {
    var spec = {
      test: (a, b, c) => {
        expect(c).to.equal(a + b)
      },
      doc: `
      a | b | c
      0 | 0 | 0
      1 | 2 | 3
      -1 | -2 | -3
      `
    }

    var scenarios = where.doc.factory(spec)

    scenarios.forEach(scenario => {
      var { params: p, test } = scenario;

      it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
    })
  })

  describe("errors", () => {
    var spec = {
      test: (a, b, c) => {
        expect(c).to.equal(a + b)
      },
      doc: `
      a | b | c
     // 0 | 0 | 1
     // 1 | -2 | 3
     // 1 | -2 | -3
      `
    }

    var scenarios = where.doc.factory(spec)

    scenarios.forEach(scenario => {
      var { params: p, test } = scenario;

      expect(test).to.throw();

      // it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
    })
  })
})