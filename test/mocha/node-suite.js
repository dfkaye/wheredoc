/*
 * To import a commonJS module:
 *  - import createRequire from 'module'
 *  - set require = createRequire(import.meta.url);
 *  - require the module via its filepath, including extension.
 *  - destructuring assignment after module is loaded.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chai = require("../../node_modules/chai/chai.js");
const { assert, expect } = chai;

/*
 * To import an ES6 module:
 *  - use dynamic import() function
 *  - import the module via its filepath, including extension
 *  - use top-level await import(module_filepath)
 *  - use destructuring assignment in one step, not after.
 */
// const { where, parse } = await import('../../index.js')

import { where, parse, build, convert } from '../../where.js';
describe('wheredoc', () => {

  describe('where', () => {
    describe('base cases with params', () => {
      var doc = `
        a  |  b  |  c
        1  |  2  |  3
        4  |  5  |  9
       10  | 11  | 21
      `;

      var test = function (a, b, c) {
        expect(c).to.equal(a + b);
      }

      where({ doc, test }).scenarios.forEach(scenario => {
        var p = scenario.params

        it(`with ${p.a} and ${p.b}, should get ${p.c}`, scenario.apply)
      })
    })

    describe('handles arrays', () => {
      var doc = `
          a   |   b   |      c
        ['a'] | ['b'] | [ 'a', 'b' ]
      `;

      var test = function (a, b, c) {
        var actual = a.concat(b);

        expect(c).to.deep.equal(actual);
      }

      where({ doc, test }).scenarios.forEach(scenario => {
        var p = scenario.params

        it(`with ${p.a} and ${p.b}, should get ${p.c}`, scenario.apply)
      })
    })

    describe('handles objects', () => {
      var doc = `
            a     |     b     |       c
        { 0: 1 }  | { 1: 1 }  | { 0: 1, 1: 1 }
      `;

      var test = function (a, b, c) {
        var actual = Object.assign({}, a, b)

        expect(c).to.deep.equal(actual);
      }

      where({ doc, test }).scenarios.forEach(scenario => {
        var p = scenario.params;

        it(`with ${p.a} and ${p.b}, should get ${p.c}`, scenario.apply)
      })
    })
  });

  describe('parse', () => {

    /*
     * returns params and rows
     * template literal
     * multiline string
     * empty string
     * removes empty rows
     * removes commented rows
     */

    it('handles template literals', () => {
      var doc = `
        a | b | c
        // commented row
        1 | 2 | 3 // passing row
        4 | 5 | 6 // failing row
        "h" | 'b'  // unbalanced, missing value
      `;

      var data = parse({ doc });

      expect(data.params.length).to.equal(3);
      expect(data.rows.length).to.equal(3);
    });

    it("handles multiline strings", () => {
      var doc = "\
        a  |  b  |  c		\n\
        // commented    \n\
        1  |  2  |  3		\n\
        4  |  3  |  7		\n\
        6  |  6  |  12	\n\
      "

      var data = parse({ doc });

      expect(data.params.length).to.equal(3);
      expect(data.rows.length).to.equal(3);
    });

    it('handles empty string', () => {
      var doc = "";
      var data = parse({ doc });

      expect(data.params.length).to.equal(0);
      expect(data.rows.length).to.equal(0);
    });

    it('removes empty rows', () => {
      var doc = `
        a | b | c
        1 | 2 | 3

        4 | 5 | 9
      `;

      var data = parse({ doc });

      expect(data.params.length).to.equal(3);
      expect(data.rows.length).to.equal(2);
    });

    it('removes commented rows', () => {
      var doc = `
        a | b | c
        1 | 2 | 3
        // commented row
        4 | 5 | 9
      `;

      var data = parse({ doc });

      expect(data.params.length).to.equal(3);
      expect(data.rows.length).to.equal(2);
    });
  });

  describe('build', () => {

    var test = function (a, b, c) {
      /*
      console.table([
        ['a', 'b', 'c'].join(" | "),
        [a, b, c].join(" | ")
      ]);
      */

      expect(a + b).to.equal(c)
    }

    it('processes valid scenarios', () => {
      var data = {
        params: ["a", "b", "c"],
        rows: [
          ["1", "2", "3"],
          ["4", "5", "9"]
        ]
      };

      var { scenarios, errors } = build({ data, test });

      expect(scenarios.length).to.equal(2);
      expect(errors.length).to.equal(0);

      scenarios.forEach(scenario => {
        scenario.apply();
      })
    });

    it("errors when test is not a function", () => {
      var data = {
        params: ["a", "b", "c"],
        rows: [
          ["1", "2", "3"],
          ["4", "5", "9"]
        ]
      };

      var test = {
        // should be a function.
      };

      var { scenarios, errors } = build({ data, test });

      expect(scenarios.length).to.equal(1)

      scenarios.forEach((scenario, index) => {
        expect(scenario.error).to.equal(errors[index]);

        expect(scenario.apply).to.throw();
      })
    });

    it('errors when rows are unbalanced', () => {
      var data = {
        params: ["a", "b", "c"],
        rows: [
          ["'h'", '"b"'], // first error
          []              // second error
        ]
      };

      var { scenarios, errors } = build({ data, test });

      expect(scenarios.length).to.equal(2)
      expect(errors.length).to.equal(2)

      errors.forEach((error, index) => {
        var msg = `expected ${data.params.length} values but found ${data.rows[index].length}`;

        expect(error).to.include(msg)
      })

      scenarios.forEach((scenario, index) => {
        expect(scenario.error).to.equal(errors[index]);

        expect(scenario.apply).to.throw();
      })
    })

    it('errors when params are duplicated', () => {
      var data = {
        params: ["a", "a", "c"],
        rows: [
          ["1", "2", "3"]
        ]
      };

      var { scenarios, errors } = build({ data, test });

      expect(errors.length).to.equal(1);

      scenarios.forEach(scenario => {
        expect(scenario.error).to.equal(errors[0]);

        expect(scenario.apply).to.throw();
      })
    })

    it('errors when data is empty', () => {
      var data = {
        params: ["a", "b", "c"],
        rows: []
      };

      var { scenarios, errors } = build({ data, test });

      expect(errors.length).to.equal(1);

      scenarios.forEach(scenario => {
        expect(scenario.error).to.equal(errors[0]);

        expect(scenario.apply).to.throw();
      })
    })
  })

  describe('convert', () => {
    it('string to boolean', () => {
      var values = ["true", "false"];
      var actual = convert({ values });

      expect(actual[0]).to.equal(true);
      expect(actual[1]).to.equal(false);
    })

    it('string to void', () => {
      var values = ["null", "undefined"];
      var actual = convert({ values });

      expect(actual[0]).to.equal(null);
      expect(actual[1]).to.equal(undefined);
    })

    it('string to number', () => {
      var values = [
        "1234.5678",
        "12,345.6789",
        "-0",
        "-1.23456789e6",
        "NaN",
        "Infinity",
        "-Infinity"
      ];
      var actual = convert({ values });

      expect(actual[0]).to.equal(1234.5678);
      expect(actual[1]).to.equal(12345.6789);
      expect(actual[2]).to.equal(0);
      expect(actual[3]).to.equal(-1234567.89);
      expect(actual[4]).to.be.NaN;
      expect(actual[5]).to.equal(Infinity);
      expect(actual[6]).to.equal(-Infinity);
    })

    it("string to Number.RESERVED_CONSTANT", () => {
      var values = [
        "Number.EPSILON",
        "Number.MAX_SAFE_INTEGER",
        "Number.MAX_VALUE",
        "Number.MIN_SAFE_INTEGER",
        "Number.MIN_VALUE",
        "Number.NEGATIVE_INFINITY",
        "Number.NaN",
        "Number.POSITIVE_INFINITY"
      ];
      var actual = convert({ values });

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
      var values = [
        "Math.E",
        "Math.LN2",
        "Math.LN10",
        "Math.LOG2E",
        "Math.LOG10E",
        "Math.PI",
        "Math.SQRT1_2",
        "Math.SQRT2"
      ];
      var actual = convert({ values });

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
      var values = [
        `[ "one", true, 3 ]`,
        `[[ "matrix" ], [ "matrix" ]]`,
        `[{ name: "first" }, { name: "second" }]`
      ]
      var actual = convert({ values });

      expect(actual[0]).to.deep.equal(["one", true, 3]);
      expect(actual[1]).to.deep.equal([["matrix"], ["matrix"]]);
      expect(actual[2]).to.deep.equal([{ name: "first" }, { name: "second" }]);
    })

    describe('string to object', () => {
      it("array, matrix, list", () => {
        var values = [
          `{ array: [ "one", true, 3 ] }`,
          `{ matrix: [[ "matrix" ], [ "matrix" ]] }`,
          `{ list: [{ name: "first" }, { name: "second" }] }`
        ]
        var actual = convert({ values });

        expect(actual[0]).to.deep.equal({ array: ["one", true, 3] });
        expect(actual[1]).to.deep.equal({ matrix: [["matrix"], ["matrix"]] });
        expect(actual[2]).to.deep.equal({ list: [{ name: "first" }, { name: "second" }] });
      })

      it("catches errors", () => {
        var values = [
          `{ bonk }`,
          `{ valueOf: () => { throw new Error("Shazam") } }`
        ];

        var actual = convert({ values });
        expect(actual[0]).to.be.an("error")
        expect(actual[0].message).to.include("bonk is not defined");

        var fn = () => "" + actual[1]
        expect(fn).to.throw("Shazam");
      })
    })
  })
})

