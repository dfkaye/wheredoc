

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

  describe('parse', () => {

    it('filled', () => {

      var doc = `
        a | b | c
        // commented row
        1 | 2 | 3 // passing row
        4 | 5 | 6 // failing row
        "h" | 'b'  // unbalanced, missing value
      `;

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
    console.log(build)
    // var f = function (a, b, c) {
    //   expect(a + b).to.equal(c)
    // }

    // var fn = function () {
    //   console.log('applying...')
    //   return f.apply(null, [1, 2, 3])
    // }

    // it('works', fn);
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

  describe('apply', () => {

    var f = function (a, b, c) {
      expect(a + b).to.equal(c)
    }

    var fn = function () {
      console.log('applying...')
      return f.apply(null, [1, 2, 3])
    }

    it('works', fn);
  })
});
