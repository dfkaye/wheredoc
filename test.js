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
  describe("where()", () => {
    describe("returns array of scenarios with params and test properties", () => {
      describe("given a spec function with where: table", () => {
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

        describe("where: block table contains external table borders (| separators)", () => {
          var spec = (a, b, c) => {
            expect(c).to.equal(a + b)

            where: `
            |  a |  b |  c |
            |  0 |  0 |  0 |
            |  1 |  2 |  3 |
            | -1 | -2 | -3 |
            `;
          }

          var scenarios = where(spec)

          scenarios.forEach(scenario => {
            var { params: p, test } = scenario;

            it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
          })
        })
      })

      describe("given a spec object with doc and test properties", () => {
        var spec = {
          test: (a, b, c) => {
            expect(c).to.equal(a + b)
          },
          doc: `
          a |  b |  c
          0 |  0 |  0
          1 |  2 |  3
         -1 | -2 | -3
        `
        }

        var scenarios = where(spec)

        scenarios.forEach(scenario => {
          var { params: p, test } = scenario;

          it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
        })

        describe("doc table contains external table borders (| separators)", () => {
          var spec = (a, b, c) => {
            expect(c).to.equal(a + b)

            where: `
            |  a |  b |  c |
            |  0 |  0 |  0 |
            |  1 |  2 |  3 |
            | -1 | -2 | -3 |
            `;
          }

          var scenarios = where(spec)

          scenarios.forEach(scenario => {
            var { params: p, test } = scenario;

            it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
          })
        })
      })

      describe("given a spec function with doc and test properties", () => {
        it("processes the spec function, ignores doc and test properties", () => {
          var status = "unset"

          var spec = function (a, b, c) {
            expect(c).to.equal(a + b)

            status = "set by spec"

            where: `
              a | b | c
              1 | 2 | 3
            `
          }

          spec.test = function (a, b, c) {
            // should ignore test function
            status = "set by test function"
          };

          spec.doc = `
            // should ignore doc table
            a | b | c
            4 | 5 | 6
          `;

          var scenarios = where(spec)

          var { params, test } = scenarios[0]

          expect(params).to.deep.equal({ a: 1, b: 2, c: 3 })

          test()

          expect(status).to.equal("set by spec")
        })
      })
    })

    describe("where: block formats", () => {
      // backticks
      // comments
      // multiline string
      // nested function with block in comments

      //  where: ` ... `;
      //  where: /* ... */; <-- requires trailing semi-colon if no other statements follow>
      //  where: " ... \n\ ... ";
      //  where: () => {/* .... */};
      it("accepts template literal", () => {
        var spec = function () {
          where: `
          a | b | c
          2 | 5 | 7
          `
        }

        var scenarios = where(spec)
        var { params, test } = scenarios[0];

        expect(params).to.deep.equal({ a: 2, b: 5, c: 7 })
        expect(test).to.be.a("function")
      })

      it("accepts multiline comment", () => {
        var spec = function () {
          where: /*
          a | b | c
          6 | 9 | 15
          */
          ; // Note: trailing semi-colon required if no further in spec.
        }

        var scenarios = where(spec)
        var { params, test } = scenarios[0];

        expect(params).to.deep.equal({ a: 6, b: 9, c: 15 })
        expect(test).to.be.a("function")
      })

      it("accepts multiline string", () => {
        var spec = function () {
          where: "     \
            a | b | c  \
            3 | 8 | 11 \
          ";

          expect(c).to.equal(a + b)
        }

        var scenarios = where(spec)
        var { params, test } = scenarios[0];

        expect(params).to.deep.equal({ a: 3, b: 8, c: 11 })
        expect(test).to.be.a("function")
      })

      it("accepts a nested function with block in comments", () => {
        var spec = function () {
          where: () => {/*
              a | b | c
              12 | -18 | -6
            */ // Note: comment must start on first line of function.
          }

          expect(c).to.equal(a + b)
        }

        var scenarios = where(spec)
        var { params, test } = scenarios[0];

        expect(params).to.deep.equal({ a: 12, b: -18, c: -6 })
        expect(test).to.be.a("function")
      })
    })

    // handled by factory->analyze
    describe("on outline problems", () => {
      it("returns error on doc missing", () => {
        var scenarios = where({
          test: () => { }
        })

        var { keys, rows, error, test } = scenarios[0]

        expect(keys).to.deep.equal([])
        expect(rows).to.deep.equal([])
        expect(error).to.equal("No data rows defined for keys, [].")
        expect(test).to.throw(error)
      });

      it("returns error on test missing", () => {
        var scenarios = where({
          doc: `
          
          `
        })

        var { keys, rows, error, test } = scenarios[0]

        expect(keys).to.deep.equal([])
        expect(rows).to.deep.equal([])
        expect(error).to.equal("Expected test to be a Function but was Undefined.")
        expect(test).to.throw(error)
      });

      it("returns error on empty spec function (no where table)", () => {
        var status = "initial";
        var scenarios = where(function () {
          status = "overwritten"
        });

        var { keys, rows, error, test } = scenarios[0]

        expect(keys).to.deep.equal([])
        expect(rows).to.deep.equal([])
        expect(error).to.equal("No data rows defined for keys, [].")
        expect(test).to.throw(error)
        expect(status).to.equal("initial")
      });
    })
  })

  describe("where.doc API", () => {
    describe("where.doc.factory", () => {
      describe("returns array of scenarios from valid specs", () => {
        var spec = {
          test: (a, b, c) => {
            expect(c).to.equal(a + b)
          },
          doc: `
            a |  b |  c
            0 |  0 |  0
            1 |  2 |  3
           -1 | -2 | -3
          `
        }

        var scenarios = where.doc.factory(spec)

        scenarios.forEach(scenario => {
          var { params: p, test } = scenario;

          it(`with ${p.a} and ${p.b}, expect ${p.c}`, test)
        })
      })

      describe("returns array of corrections on invalid specs", () => {
        it("on outline errors", () => {
          var spec = {
            test: "should be a function",
            doc: `
                a | b | c
                0 | 0 | 0
                1 | 2 | 3
              `
          };

          var corrections = where.doc.factory(spec)

          expect(corrections.length).to.equal(1)

          var { error } = corrections[0]

          expect(error).to.equal("Expected test to be a Function but was String.")
        })

        it("on row data errors", () => {
          var spec = {
            test: () => { },
            doc: `
              a | b | c
              0 | 0
              1
              'a' | 'b' | 'c' // expect | a b 
            `
          };

          var scenarios = where.doc.factory(spec)

          expect(scenarios.length).to.equal(3)
          expect(scenarios[0].error).to.equal("Row 1, expected 3 tokens, but found 2.")
          expect(scenarios[1].error).to.equal("Row 2, expected 3 tokens, but found 1.")

          // last row is valid so params are returned instead of error
          expect(scenarios[2].error).to.be.undefined
          expect(scenarios[2].params).to.deep.equal({ a: "'a'", b: "'b'", c: "'c'" });
        })
      })
    })

    describe("where.doc.parse", () => {
      it("returns keys and rows from spec doc", () => {
        var doc = `
        a | b | c
        2 | 3 | 5
        `;

        var { keys, rows } = where.doc.parse({ doc })

        expect(keys.length).to.equal(3)
        expect(rows.length).to.equal(1)

        var tokens = rows[0]

        expect(tokens).to.deep.equal(["2", "3", "5"])
      })

      it("removes external table borders (| separators)", () => {
        var doc = `
        | a | b | c |
        | 2 | 3 | 5 |
        `;

        var { keys, rows } = where.doc.parse({ doc })

        expect(keys.length).to.equal(3)
        expect(rows.length).to.equal(1)

        var tokens = rows[0]

        expect(tokens).to.deep.equal(["2", "3", "5"])
      })

      it("removes line comments, ", () => {
        var doc = `
        a | b | c

        1 | 2 | 3
     // 4 | 5 | 6 (shouldn't see this line)
        7 | 8 | 9

        `;

        var { keys, rows } = where.doc.parse({ doc })

        expect(keys).to.deep.equal(["a", "b", "c"])
        expect(rows).to.deep.equal([
          ["1", "2", "3"],
          ["7", "8", "9"]
        ])
      })

      it("returns arrays of keys and tokens as they are encountered, ", () => {
        var doc = `
        a |   | c

        1 |   | 3
        4 | 5 | 
          | 8 | 9

        `;

        var { keys, rows } = where.doc.parse({ doc })

        expect(keys).to.deep.equal(["a", "", "c"])
        expect(rows).to.deep.equal([
          ["1", "", "3"],
          ["4", "5", ""],
          ["", "8", "9"]
        ])
      })

      it("returns empty rows array if spec doc has no rows.", () => {
        var doc = `
        should | see | these
        `;

        var { keys, rows } = where.doc.parse({ doc })

        expect(keys).to.deep.equal(["should", "see", "these"])
        expect(rows).to.deep.equal([])
      })

      it("returns empty keys and rows arrays if spec doc has neither keys nor rows.", () => {
        var doc = `
      
        `;

        var { keys, rows } = where.doc.parse({ doc })

        expect(keys).to.deep.equal([])
        expect(rows).to.deep.equal([])
      })
    })

    describe("where.doc.analyze", () => {
      describe("on spec outline errors", () => {
        var ok = {
          keys: ["a", "b", "c"],
          rows: [
            [0, 1, 1],
            [2, 3, 5],
            [123, 456, 579]
          ],
          test: function () { }
        }

        it("returns an array of corrections to be made", () => {
          var keys = [] // no keys
          var rows = "" // no rows
          var test = "" // test not a function

          var corrections = where.doc.analyze({ keys, rows, test })

          expect(corrections.length).to.equal(3)
        })

        it("corrections include keys, rows, error, and test fields", () => {
          var keys = [] // no keys
          var rows = "" // no rows
          var test = "" // test not a function

          var corrections = where.doc.analyze({ keys, rows, test })

          corrections.forEach(correction => {
            expect(correction.keys).to.deep.equal(keys)
            expect(correction.rows).to.deep.equal(rows)
            expect(correction.error).to.be.a("string")
            expect(correction.test).to.be.a("function")
          })
        })

        it("correction.test throws the correction.error message", () => {
          var keys = [] // no keys
          var rows = "" // no rows
          var test = "" // test not a function

          var corrections = where.doc.analyze({ keys, rows, test })

          corrections.forEach(correction => {
            var { error, test } = correction;

            expect(test).to.throw(error)
          })
        })

        it("reports invalid test function", () => {
          // - test not a function

          var { keys, rows } = ok;
          var test = null;

          var corrections = where.doc.analyze({ keys, rows, test })
          expect(corrections.length).to.equal(1)

          var expected = "Expected test to be a Function but was Null."
          var actual = corrections[0].error
          expect(actual).to.equal(expected)
        })

        it("reports empty data rows", () => {
          // - no data rows

          var { keys, test } = ok;
          var rows = "";

          var corrections = where.doc.analyze({ keys, rows, test })
          expect(corrections.length).to.equal(1)

          var expected = "No data rows defined for keys, [a, b, c]."
          var actual = corrections[0].error
          expect(actual).to.equal(expected)
        })

        it("reports no keys defined", () => {
          // - no keys

          var { test } = ok;
          var keys = []
          var rows = [
            ["won't", "process", "this", "row"]
          ];

          var corrections = where.doc.analyze({ keys, rows, test })
          expect(corrections.length).to.equal(1)

          var expected = "No keys defined."
          var actual = corrections[0].error
          expect(actual).to.equal(expected)
        })

        it("reports duplicate keys found", () => {
          // - duplicate keys

          var { test } = ok;
          var keys = ["a", "a", "b", "b", "ok"]
          var rows = [
            ["won't", "process", "this", "row", "either"]
          ];

          var corrections = where.doc.analyze({ keys, rows, test })
          expect(corrections.length).to.equal(1)

          var expected = "Duplicate keys: [a, b]."
          var actual = corrections[0].error
          expect(actual).to.equal(expected)
        })

        it("reports invalid key names", () => {
          // - keys don't start with A-z, $, _, and/or contain whitespace

          var { test } = ok;
          var keys = ["9", "#", "%", "\"quoted\"", /*empty string*/ "", "a b", "ok", "$ok", "_ok"]
          var rows = [
            ["will", "not", "process", "this", "row", "either"]
          ];

          var corrections = where.doc.analyze({ keys, rows, test })
          expect(corrections.length).to.equal(6)

          corrections.forEach((correction, index) => {
            var { error } = correction;
            var message = `Invalid key, ${keys[index]}, expected to start with A-z, $, or _ (Key, key, $key, _Key).`

            expect(error).to.equal(message)
          })
        })
      })

      describe("on valid spec outline", () => {
        it("returns empty corrections array", () => {
          var keys = ["a1", "b1", "c1"]
          var rows = [
            [0, 1, 1],
            [2, 3, 5],
            [123, 456, 579]
          ]
          var test = () => { }

          var corrections = where.doc.analyze({ keys, rows, test })

          expect(corrections.length).to.equal(0)
        })

        it("allows undefined, null, NaN as keys", () => {
          var keys = ["undefined", "null", "NaN"]
          var rows = [
            [1, 2, 3, 4]
          ]
          var test = () => { }

          var corrections = where.doc.analyze({ keys, rows, test })

          expect(corrections.length).to.equal(0)
        })
      })
    })

    describe("where.doc.scenario", () => {
      describe("on scenario errors", () => {
        // unbalanced keys.length != tokens.length
        var keys = ["a", "b", "c"]
        var tokens = [0, 1]
        var index = 0;
        var test = function (a, b, c) {
          throw new Error("should not see this in the console.")
        }
        var row = { keys, tokens, index, test }

        var { keys, tokens, error, test } = where.doc.scenario(row);

        it("returns a scenario with original keys and tokens", () => {
          expect(keys).to.deep.equal(keys)
          expect(tokens).to.deep.equal(tokens)
        })

        it("includes scenario.error message", () => {
          expect(error).to.equal("Row 1, expected 3 tokens, but found 2.")
        })

        it("includes scenario.test() method that throws the scenario.error message", () => {
          expect(test).to.throw(error);
        })
      })

      describe("on valid scenarios", () => {
        // executable scenario
        var keys = ["a", "b", "c"]
        var tokens = ["1.5", "2.5", "4.00000"]
        var index = 42;
        var test = function (a, b, c) {
          expect(c).to.equal(a + b)

          // return a value to verify test() call executes.
          return "Success"
        }
        var row = { keys, tokens, index, test }

        var scenario = where.doc.scenario(row);

        it("return scenario with params and test fields", () => {
          var { params, test } = scenario;

          expect(params).to.be.an("object")
          expect(test).to.be.a("function")
        })

        it("returns scenario with params map", () => {
          var { params: p } = scenario;

          expect(p.a).to.equal(1.5)
          expect(p.b).to.equal(2.5)
          expect(p.c).to.equal(4)
        })

        it("returns scenario with test() method", () => {
          var { test: t } = scenario;
          var actual = t();

          expect(actual).to.equal("Success")
        })
      })
    })

    describe('where.doc.convert', () => {
      it("string tokens are unchanged", () => {
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

      it("string zeroes convert to real zero", () => {
        var tokens = ["0", "-0"];
        var actual = where.doc.convert({ tokens });

        expect(actual[0]).to.equal(0);
        expect(actual[1]).to.equal(-0);
      });

      it('string booleans convert to real boolean', () => {
        var tokens = ["true", "false"];
        var actual = where.doc.convert({ tokens });

        expect(actual[0]).to.equal(true);
        expect(actual[1]).to.equal(false);
      })

      it('string voids convert to real voids', () => {
        var tokens = ["null", "undefined"];
        var actual = where.doc.convert({ tokens });

        expect(actual[0]).to.equal(null);
        expect(actual[1]).to.equal(undefined);
      })

      it('string numerics convert to real numbers', () => {
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

      it("string Number constants convert to Number.RESERVED_CONSTANT", () => {
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

      it("string Math constants convert to Math.CONSTANT", () => {
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

      it('string Arrays convert to real Arrays', () => {
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

      describe('string Objects convert to real Objects', () => {
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

    describe("where.doc.map", () => {
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
})
