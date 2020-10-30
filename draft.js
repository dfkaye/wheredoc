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
  where.doc.build
    where.doc.parse
    where.doc.correct
    where.doc.scenario
      where.doc.convert
        where.doc.evaluate
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

  return build({ doc, test });
}

where.doc = {
  build, parse, correct, scenario, convert, evaluate, map
}

// scenarios
function build({ doc, test }) {
  var { labels, rows } = parse({ doc });

  // corrections
  // - test not a function
  // - no data rows
  // - no labels
  // - duplicate labels
  // - labels don't start wih a-z, $, _, and/or contain whitespace
  var corrections = correct({ labels, rows, test });

  if (corrections.length) {
    return corrections
  }

  // return scenarios
  return rows.map((tokens, i) => {
    return scenario({ labels, tokens, row: i + 1 })
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
    // Assign an empty array if data has no labels.
    labels: rows[0] || [],
    // Create an empty array if data has no rows.
    rows: rows.slice(1)
  }
}

// return list of outline corrections to be made
function correct({ labels, rows, test }) {
  var corrections = [];
  var errors = []

  // test is not a function
  if (typeof test != "function") {
    errors.push(`"test" expected to be a function but was "${typeof test}"`)
  }

  // no data rows
  if (!rows.length) {
    errors.push(`No data rows defined for [${labels.join(', ')}]`)
  }

  // no labels
  if (!labels.length) {
    errors.push(`No labels defined for [${labels.join(', ')}]`)
  }

  // duplicate labels
  if (labels.length > new Set(labels).size) {
    var visited = {};
    var dupes = {};

    labels.forEach(key => {
      if (key in visited && !(key in dupes)) {
        dupes[key] = key
      }
      visited[key] = key
    })

    errors.push(`Duplicate labels: [${Object.keys(dupes).join(', ')}]`)
  }

  // labels don't start wih A-z, $, _, and/or contains whitespace.
  labels.forEach(label => {
    if (!/^[A-z\$\_]([^\s])*$/.test(label)) {
      errors.push(`Label "${label}" expected to start with A-z, $, or _ (X, x, $x, _x)`)
    }
  })

  if (errors.length) {
    var error = errors.join('\n');
    var test = function () { throw new Error(error) }
    var correction = { labels, rows, error, test }

    corrections.push(correction)
  }

  return corrections;
}

// returns a test-scenario { params, test } or an error-scenario { values, labels, error, test }
function scenario({ labels, tokens, row }) {
  var errors = []

  // unbalanced labels.length != tokens.length
  if (labels.length != tokens.length) {
    var message = [
      `Row ${row}`,
      `expected ${labels.length} tokens`,
      `but found ${tokens.length}.`
    ].join(', ');

    errors.push(message);
  }

  if (errors.length) {
    var error = errors.join("\n")
    var test = function () { throw new Error(error) }
    var values = tokens;

    return { values, labels, error, test };
  }

  var values = convert({ tokens })

  return {
    params: map({ params, values }),
    test: function () { return test.apply(null, values) }
  };
}

// return real values:
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
          value = evaluate({ token })
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

// return real value, convert tokens helper
function evaluate({ token }) {
  return Function("return (" + token + ");").call()
}

// return enum { a: 1, b: 2 }
function map({ labels, values }) {
  var params = {}

  labels.forEach((key, i) => {
    params[key] = values[i]
  })

  return params
}
