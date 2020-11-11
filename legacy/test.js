/**
 * Legacy test suite for driving initial design.
 * 
 *    Do not use this brain.
 * 
 */


/*
 * This suite is run with mocha and uses chai expect.
 * Run this suite from wheredoc root using:
 * 
 *    npm run mocha
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
const require = createRequire(import.meta.url);
const chai = require("chai");
const { assert, expect } = chai;

/*
 * To import an ES6 module:
 *  - use dynamic import() function
 *  - import the module via its filepath, including extension
 *  - use top-level await import(module_filepath)
 *  - use destructuring assignment in one step, not after.
 */
var { spec, where, parse, build, convert } = await import('./where.js')

// or just use import { ... }
// import { where, parse, build, convert } from '../../where.js';

describe('wheredoc', () => {

  describe('spec', () => {
    var test = function (a, b, c) {
      expect:
      expect(c).to.equal(a + b);

      where: `
      |  a  |  b  |  c |
      |  1  |  2  |  3 |
      |  4  |  5  |  9 |
      | 10  | 11  | 21 |
      `;
    }

    spec(test).scenarios.forEach(scenario => {
      var { params: p } = scenario

      it(`with ${p.a} and ${p.b}, should get ${p.c}`, scenario.apply)
    })
  });

  describe('where', () => {
    describe('scenario params and apply', () => {
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
        var { params: p } = scenario

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
        var { params: p } = scenario

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
        var { params: p } = scenario;

        it(`with ${p.a} and ${p.b}, should get ${p.c}`, scenario.apply)
      })
    })
  });

  describe('parse', () => {

    /*
     * returns params and rows arrays
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

    /*
     * returns scenarios and errors arrays
     * errors when test is not a function
     * each problem scenario contains params and values arrays, apply function which throws, and error message
     * each clean scenario contains params enum and apply function
     * empty string
     * removes empty rows
     * removes commented rows
     */

    it('creates scenarios from valid spec', () => {
      var data = {
        params: ["a", "b", "c"],
        rows: [
          ["1", "2", "3"],
          ["4", "-5", "-1"]
        ]
      };

      var test = function (a, b, c) {
        expect(a + b).to.equal(c)
      }

      var { scenarios, errors } = build({ data, test });

      expect(scenarios.length).to.equal(2);
      expect(errors.length).to.equal(0);

      scenarios.forEach(scenario => {
        scenario.apply();

        expect(scenario.apply).not.to.throw();
      })
    });

    describe("scenario.apply() throws", () => {
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
        expect(errors.length).to.equal(1);
        expect(scenarios[0].error).to.equal(errors[0]);
        expect(scenarios[0].apply).to.throw();

        // scenarios.forEach((scenario, index) => {
        //   expect(scenario.error).to.equal(errors[index]);
        //   
        //   expect(scenario.apply).to.throw();
        // })
      });

      it('errors when rows are unbalanced', () => {
        var data = {
          params: ["a", "b", "c"],
          rows: [
            ["'h'", '"b"'], // first error
            []              // second error
          ]
        };

        var test = function (a, b, c) {
          expect(a + b).to.equal(c)
        }

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
          params: ["a", "a", "b", "b", "c"],
          rows: [
            ["1", "2", "3"]
          ]
        };

        var test = function (a, b, c) {
          expect(a + b).to.equal(c)
        }

        var { scenarios, errors } = build({ data, test });

        expect(errors.length).to.equal(1);
        expect(scenarios[0].error).to.equal(errors[0]);
        expect(scenarios[0].apply).to.throw();

        // scenarios.forEach(scenario => {
        //   expect(scenario.error).to.equal(errors[0]);

        //   expect(scenario.apply).to.throw();
        // })
      })

      it('errors when data is empty', () => {
        var data = {
          params: ["a", "b", "c"],
          rows: []
        };

        var test = function (a, b, c) {
          expect(a + b).to.equal(c)
        }

        var { scenarios, errors } = build({ data, test });

        expect(errors.length).to.equal(1);
        expect(scenarios[0].error).to.equal(errors[0]);
        expect(scenarios[0].apply).to.throw();

        // scenarios.forEach(scenario => {
        //   expect(scenario.error).to.equal(errors[0]);

        //   expect(scenario.apply).to.throw();
        // })
      })

      it('errors when a param label does not start with A-z, $, or _', () => {
        var data = {
          params: ["9", "#", "%", "$ok", "_ok"],
          rows: [
            ["1", "2", "3", "4"]
          ]
        };

        var test = function (a, b, c) {
          expect(a + b).to.equal(c)
        }

        var { scenarios, errors } = build({ data, test });

        expect(errors.length).to.equal(3)
        expect(scenarios[0].apply).to.throw();
      })

      it('errors on an empty or whitespace param names', () => {
        var data = {
          params: ["", " "],
          rows: [
            ["1", "2", "3", "4"]
          ]
        };

        var test = function (a, b, c) {
          expect(a + b).to.equal(c)
        }

        var { scenarios, errors } = build({ data, test });

        expect(errors.length).to.equal(2)
        expect(scenarios[0].apply).to.throw();
      })
    })
  })

  describe('convert', () => {
    it("string to zero", () => {
      var values = ["0", "-0"];
      var actual = convert({ values });

      expect(actual[0]).to.equal(0);
      expect(actual[1]).to.equal(-0);
    });

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
        "-Infinity",
        ".1"
      ];
      var actual = convert({ values });

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
          `{ bonk }`, // not defined
          `{ valueOf: () => { throw new Error("Shazam") } }`, // throws
          `{ { }`, // unexpected token
          `[ [ ]`  // unexpected token
        ];

        var actual = convert({ values });
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
})

