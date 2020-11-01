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

  describe("where.doc.factory", () => {
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

  describe("where.doc.analyze", () => {
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

  describe('where.doc.convert() tokens to values', () => {
    it("strings are unchanged", () => {
      var tokens = [
        "5%",
        "5!",
        "$5",
        "6 * 6",
        "He said, \"Hello.\""
      ]
      var actual = where.doc.convert({ tokens });

      expect(actual).to.deep.equal(tokens);
    })

    it("string to zero", () => {
      var tokens = ["0", "-0"];
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.equal(0);
      expect(actual[1]).to.equal(-0);
    });

    it('string to boolean', () => {
      var tokens = ["true", "false"];
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.equal(true);
      expect(actual[1]).to.equal(false);
    })

    it('string to void', () => {
      var tokens = ["null", "undefined"];
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.equal(null);
      expect(actual[1]).to.equal(undefined);
    })

    it('string to number', () => {
      var tokens = [
        "1234.5678",
        "12,345.6789",
        "-0",
        "-1.23456789e6",
        "NaN",
        "Infinity",
        "-Infinity",
        ".1"
      ];
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.equal(1234.5678);
      expect(actual[1]).to.equal(12345.6789);
      expect(actual[2]).to.equal(0);
      expect(actual[3]).to.equal(-1234567.89);
      expect(actual[4]).to.be.NaN;
      expect(actual[5]).to.equal(Infinity);
      expect(actual[6]).to.equal(-Infinity);
      expect(actual[7]).to.equal(0.1);
    })

    it("string to Number.RESERVED_CONSTANT", () => {
      var tokens = [
        "Number.EPSILON",
        "Number.MAX_SAFE_INTEGER",
        "Number.MAX_VALUE",
        "Number.MIN_SAFE_INTEGER",
        "Number.MIN_VALUE",
        "Number.NEGATIVE_INFINITY",
        "Number.NaN",
        "Number.POSITIVE_INFINITY"
      ];
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.equal(Number.EPSILON);
      expect(actual[1]).to.equal(Number.MAX_SAFE_INTEGER);
      expect(actual[2]).to.equal(Number.MAX_VALUE);
      expect(actual[3]).to.equal(Number.MIN_SAFE_INTEGER);
      expect(actual[4]).to.equal(Number.MIN_VALUE);
      expect(actual[5]).to.equal(Number.NEGATIVE_INFINITY);
      expect(actual[6]).to.be.NaN;
      expect(actual[7]).to.equal(Number.POSITIVE_INFINITY);
    })

    it("string to Math.CONSTANT", () => {
      var tokens = [
        "Math.E",
        "Math.LN2",
        "Math.LN10",
        "Math.LOG2E",
        "Math.LOG10E",
        "Math.PI",
        "Math.SQRT1_2",
        "Math.SQRT2"
      ];
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.equal(Math.E);
      expect(actual[1]).to.equal(Math.LN2);
      expect(actual[2]).to.equal(Math.LN10);
      expect(actual[3]).to.equal(Math.LOG2E);
      expect(actual[4]).to.equal(Math.LOG10E);
      expect(actual[5]).to.equal(Math.PI);
      expect(actual[6]).to.equal(Math.SQRT1_2);
      expect(actual[7]).to.equal(Math.SQRT2);
    })

    it('string to array', () => {
      var tokens = [
        `[ "one", true, 3 ]`,
        `[[ "matrix" ], [ "matrix" ]]`,
        `[{ name: "first" }, { name: "second" }]`
      ]
      var actual = where.doc.convert({ tokens });

      expect(actual[0]).to.deep.equal(["one", true, 3]);
      expect(actual[1]).to.deep.equal([["matrix"], ["matrix"]]);
      expect(actual[2]).to.deep.equal([{ name: "first" }, { name: "second" }]);
    })

    describe('string to object', () => {
      it("array, matrix, list", () => {
        var tokens = [
          `{ array: [ "one", true, 3 ] }`,
          `{ matrix: [[ "matrix" ], [ "matrix" ]] }`,
          `{ list: [{ name: "first" }, { name: "second" }] }`
        ]
        var actual = where.doc.convert({ tokens });

        expect(actual[0]).to.deep.equal({ array: ["one", true, 3] });
        expect(actual[1]).to.deep.equal({ matrix: [["matrix"], ["matrix"]] });
        expect(actual[2]).to.deep.equal({ list: [{ name: "first" }, { name: "second" }] });
      })

      it("catches evaluation errors", () => {
        var tokens = [
          `{ bonk }`, // not defined
          `{ valueOf: () => { throw new Error("Shazam") } }`, // throws
          `{ { }`, // unexpected token
          `[ [ ]`  // unexpected token
        ];

        var actual = where.doc.convert({ tokens });
        expect(actual[0]).to.be.an("error")
        expect(actual[0].message).to.include("bonk is not defined");

        var fn = () => "" + actual[1]
        expect(fn).to.throw("Shazam");

        expect(actual[2]).to.be.an("error")
        expect(actual[2].message).to.include("Unexpected token");

        expect(actual[3]).to.be.an("error")
        expect(actual[3].message).to.include("Unexpected token");
      })
    })
  })

  describe("where.doc.map() keys to values ", () => {
    it("returns map of key-value entries", () => {
      var actual = where.doc.map({
        keys: ['q', 'v', 'r'],
        values: ['Q', 'V', 'R']
      })

      expect(actual).to.deep.equal({
        q: 'Q',
        v: 'V',
        r: 'R'
      })
    })

    it("allows undefined, null, NaN, and empty string as keys", () => {
      var actual = where.doc.map({
        keys: [undefined, null, NaN, ''],
        values: ['UNDEFINED', 'NULL', 'NAN', 'EMPTY']
      })

      expect(actual).to.deep.equal({
        undefined: 'UNDEFINED',
        null: 'NULL',
        NaN: 'NAN',
        '': 'EMPTY'
      })
    })
  })
})