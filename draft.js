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
    //  where: " ... \n\ ... "; <-- multiline strings using \n\ to separate lines
    //  where: () => { .... }; <-- an inner function containing a docstring.
    var reWheredoc = /(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/;
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
  // - keys don't start wih a-z, $, _, and/or contain whitespace
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
  var lines = Object(doc).toString().trim()
    // remove line comments.
    .replace(/\/\/[^\n]*/g, '')
    // split into lines.
    .split('\n');

  var rows = [];

  // process lines
  // trim
  // return or split on |
  lines.forEach(text => {
    var line = text.trim();

    // remove external fence posts (| separators)
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
  var corrections = [];
  var errors = []

  // test is not a function
  if (typeof test != "function") {
    errors.push(`"test" expected to be a function but was "${typeof test}"`)
  }

  // no data rows
  if (!rows.length) {
    errors.push(`No data rows defined for [${keys.join(', ')}]`)
  }

  // no keys
  if (!keys.length) {
    errors.push(`No keys defined for [${keys.join(', ')}]`)
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

    errors.push(`Duplicate keys: [${Object.keys(dupes).join(', ')}]`)
  }

  // keys don't start wih A-z, $, _, and/or contains whitespace.
  keys.forEach(label => {
    if (!/^[A-z\$\_]([^\s])*$/.test(label)) {
      errors.push(`Label "${label}" expected to start with A-z, $, or _ (X, x, $x, _x)`)
    }
  })

  if (errors.length) {
    var error = errors.join('\n');
    var test = function () { throw new Error(error) }
    var correction = { keys, rows, error, test }

    corrections.push(correction)
  }

  return corrections;
}

// returns a test-scenario { params, test }
// or an error-scenario { values, keys, error, test }
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
    var values = tokens;

    return { values, keys, error, test };
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
  var expressions = {
    reBoolean: /^(false|true)$/,
    reVoid: /^(null|undefined)$/,
    reNaN: /^NaN$/,
    reInfinity: /^[-]?Infinity$/,
    reMathConstant: /^Math.[A-Z]+/,
    reNumberConstant: /^Number.[A-Z]+/,
    objectOrArrayLiteral: {
      test: function (token) {
        var o = token[0] == "{" && token[token.length - 1] == "}";
        var a = token[0] == "[" && token[token.length - 1] == "]";

        return o || a;
      }
    }
  }

  return tokens.map(token => {
    // Return from the possibly not NaN numeric case first.
    if (/\d+/g.test(token) && !/[\'|\"]/g.test(token)) {
      var string = token.replace(/\,/g, "");
      var number = Number(string)

      // Use number if it's not NaN.
      if (number === number) {
        return number;
      }
    }

    // Otherwise try each expression test until we get a match. If we get one,
    // try to evaluate it. Assign success or failure to the value variable,
    // and halt processing of some() by returning match.

    var value = token;

    Object.keys(expressions).some(expression => {
      var match = expression.test(token)

      if (match) {
        try {
          value = Function("return (" + token + ");").call()
        }
        catch (error) {
          value = error
        }
        finally {
          // This stops some from continuing.
          return match
        }
      }
    })

    // Default case, edifyingly annotated.
    return value;
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

