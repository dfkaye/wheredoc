

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

describe('where', () => {

  var doc = `
    a | b | c
    2 | 4 | 6
  `
  var test = function (a, b, c) {
    expect(c).to.equal(a + b);
  }

  var { scenarios, errors } = where({ doc, test })

  scenarios.forEach(scenario => {
    it('should work', scenario.apply)
  })

  describe('parse', () => {

    /*
     * returns params and rows
     * template literal
     * multiline string
     * empty string
     * removes empty rows
     * removes commented rows
     */

    it('template literal', () => {

      var doc = `
        a | b | c
        // commented row
        1 | 2 | 3 // passing row
        4 | 5 | 6 // failing row
        "h" | 'b'  // unbalanced, missing value
      `;

      console.log(parse({ doc }))

    });

    it("multiline string", () => {
      var doc = "\
        a  |  b  |  c		\n\
        1  |  2  |  3		\n\
        4  |  3  |  7		\n\
        6  |  6  |  12	\n\
      "

      console.log(parse({ doc }))
    });

    it('empty', () => {
      var doc = `
        // commented row
      `;

      console.log(parse({ doc }))
    });
  });

  describe('build', () => {

    var test = function (a, b, c) {
      expect(a + b).to.equal(c)
    }

    it('should run scenarios', () => {
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

    it('should find unbalanced rows', () => {
      var data = {
        params: ["a", "b", "c"],
        rows: [
          ["'h'", '"b"'],
          []
        ]
      };

      var { scenarios, errors } = build({ data, test });

      expect(scenarios.length).to.equal(2)
      expect(errors.length).to.equal(2)

      scenarios.forEach((scenario, index) => {
        expect(scenario.error).to.equal(errors[index]);

        expect(scenario.apply).to.throw();
      })
    })

    it('should find duplicate params', () => {
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

    it('should notify on empty data', () => {
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
        "-1.23456789e6"
      ];
      var actual = convert({ values });

      expect(actual[0]).to.equal(1234.5678);
      expect(actual[1]).to.equal(12345.6789);
      expect(actual[2]).to.equal(0);
      expect(actual[3]).to.equal(-1234567.89);
    })
  })
});
