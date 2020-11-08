/*
  draft of API refactoring

  import { where } from "wheredoc";

  describe("...", () => {
    where((a, b, c) => {
      where: `
      a  |  b  |  c
      1  |  2  |  3
      4  |  5  |  9
      'a' | 'b' | 'ab'
      `;

      expect(c).to.equal(a + b)
    }).forEach(scenario => {
      var { params: p, test } = scenario

      it(`with ${p.a} and ${p.b}, should get ${p.c}`, test)
    })
  })

  // API underneath
  where.doc.factory
    where.doc.parse
    where.doc.analyze
    where.doc.scenario
      where.doc.convert
      where.doc.map
*/

export function where(spec) {
  var { doc, test } = Object(spec);

  if (typeof spec == 'function') {
    // About /(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/
    // That RegExp examines each row of the data table, extracting characters,
    // spaces, pipes (|) and newline. Starting with a `where:` label inside the
    // doc test function, it supports multiple formats for docstrings:
    //  where: ` ... `; <-- backticks for template literals
    //  where: /* ... */; <-- block comments
    //  where: " ... \ ... "; <-- multiline strings using \ to separate lines
    //  where: () => { .... }; <-- an inner function containing a docstring.
    var reWheredoc = /(?:where\:[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/;
    var match = spec.toString().match(reWheredoc);

    // When match fails to match, it returns null. We check that match exists
    // and that its second entry which excludes the non-captured group also
    // exists; if it does, then match[1] is assigned; otherwise fall back to the
    // empty string.
    doc = match && match[1] || "";
    test = spec;
  }

  return factory({ doc, test });
}

where.doc = {
  factory, parse, analyze, scenario, convert, map
}

// scenarios
function factory({ doc, test }) {
  var { keys, rows } = parse({ doc });

  // 1. analyze spec parts for corrections to be made.
  // Return them if any are found.
  // - test not a function
  // - no data rows
  // - no keys
  // - duplicate keys
  // - keys don't start with a-z, $, _, and/or contain whitespace
  var corrections = analyze({ keys, rows, test });

  if (corrections.length) {
    return corrections
  }

  // return scenarios
  return rows.map((tokens, index) => {
    return scenario({ keys, tokens, index, test })
  })
}

// parse doc as docstring or function containing docstring.
function parse({ doc }) {
  // Ensure that doc is a string.
  if (doc !== Object(doc).toString()) {
    doc = ""
  }

  var lines = doc.trim()
    // remove line comments.
    .replace(/\/\/[^\n]*/g, '')
    // split into lines.
    .split("\n");

  var rows = [];

  // process lines
  // trim
  // return or split on |
  lines.forEach(text => {
    var line = text.trim()
      // Supports \ terminated lines in old fashioned multiline strings.
      .replace(/\\$/, "");

    // Remove external table borders (| separators).
    // before: | a | b | c |
    // after:  a | b | c
    if (/^\|(.)*\|$/.test(line)) {
      line = line.substring(1, line.length - 1).trim()
    }

    if (line.length == 0) {
      // Skip empty line.
      return
    }

    var tokens = [];

    line.split('|').forEach(token => {
      tokens.push(String(token).trim());
    })

    rows.push(tokens);
  });

  return {
    // Assign an empty array if data has no keys.
    keys: rows[0] || [],
    // Create an empty array if data has no rows.
    rows: rows.slice(1)
  }
}

// return list of outline corrections to be made
function analyze({ keys, rows, test }) {
  var errors = []

  // test is not a function
  if (typeof test != "function") {
    var type = {}.toString.call(test).slice(8, -1)
    errors.push(`Expected test to be a Function but was ${type}.`)
  }

  // no data rows
  if (!rows.length) {
    errors.push(`No data rows defined for keys, [${keys.join(', ')}].`)
  }

  // no keys
  if (!keys.length) {
    errors.push(`No keys defined.`)
  }

  // duplicate keys
  if (keys.length > new Set(keys).size) {
    var visited = {};
    var dupes = {};

    keys.forEach(key => {
      if (key in visited && !(key in dupes)) {
        dupes[key] = key
      }
      visited[key] = key
    })

    errors.push(`Duplicate keys: [${Object.keys(dupes).join(', ')}].`)
  }

  // keys don't start wih A-z, $, _, and/or contains whitespace.
  keys.forEach(label => {
    if (!/^[A-z\$\_]([A-z\$\_\d])*$/i.test(label)) {
      errors.push(`Invalid key, ${label}, expected to start with A-z, $, or _ (Key, key, $key, _Key).`)
    }
  })

  return errors.map(error => {
    var test = function () { throw new Error(error) }

    return { keys, rows, error, test }
  })
}

// returns a test-scenario { params, test }
// or an error-scenario { keys, tokens, error, test }
function scenario({ keys, tokens, index, test }) {
  var errors = []

  // unbalanced keys.length != tokens.length
  if (keys.length != tokens.length) {
    var message = [
      `Row ${index + 1}`,
      `expected ${keys.length} tokens`,
      `but found ${tokens.length}.`
    ].join(', ');

    errors.push(message);
  }

  if (errors.length) {
    var error = errors.join("\n")
    var test = function () { throw new Error(error) }

    return { keys, tokens, error, test };
  }

  var values = convert({ tokens })

  return {
    params: map({ keys, values }),
    test: function () { return test.apply(null, values) }
  };
}

// return convert tokens to real values:
// false, true, null, undefined, numbers, NaN, Math and Number constants,
// object and array literals.
// functions not supported
// quoted strings returned as is.
function convert({ tokens }) {
  return tokens.map(token => {
    if (/^(false|true)$/.test(token)) {
      // Gist: https://gist.github.com/dfkaye/ce346446dee243173cd199e51b0c51ac
      return (true).toString() === token;
    }

    if (/^(null|undefined)$/.test(token)) {
      return token === "null"
        ? null
        : undefined;
    }

    if (/^NaN$/.test(token)) {
      return NaN;
    }

    if (/^[-]?Infinity$/.test(token)) {
      return (
        token < 0
          ? -Infinity
          : Infinity
      );
    }

    if (/^Number.[A-Z]+/.test(token)) {
      // Number.NEGATIVE_INFINITY
      var field = token.split(".")[1];

      return Number[field];
    }

    if (/^Math.[A-Z]+/.test(token)) {
      // Math.PI
      var field = token.split(".")[1];

      return Math[field];
    }

    if (/\d+/g.test(token) && !/[\'|\"]/g.test(token)) {
      // Possibly a number but not NaN if it contains a digit: .1, +1, -1, 1e1
      var string = token.replace(/\,/g, "");
      var number = Number(string)

      // Use number if it's not NaN.
      if (number === number) {
        return number;
      }
    }

    // Test for JSON object or array literal
    var first = token[0];
    var last = token[token.length - 1];

    if (first == "{" && last == "}" || first == "[" && last == "]") {
      try {
        var object = JSON.parse(token)

        return object
      }
      catch (error) {
        return error
      }
    }

    // Default case, edifyingly annotated.
    return token;
  })
}

// returns map of key-value entries { a: 1, b: 2 }
function map({ keys, values }) {
  var entries = {}

  keys.forEach((label, i) => {
    entries[label] = values[i]
  })

  return entries
}

