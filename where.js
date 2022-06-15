/**
 * @author  David Kaye (dfkaye)
 * @name  where.js
 * @license MIT
 */

/**
 * @function where accepts either a function containing a docstring and
 * expectations, or an object containing a doc string field and a test function
 * field, and returns an array of scenarios containing a test function that
 * when called executes the incoming test or throws a pre-defined error.
 * 
 * @param {function | { doc: string, test: function }} spec
 * @returns {Array} scenarios 
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

/**
 * @namespace doc contains the internal API methods.
 */
where.doc = {
  factory, parse, analyze, scenario, convert, map
}

/**
 * @method factory accepts an object with doc string and test function fields,
 * and returns an array of scenarios, or an array of corrections if any parsing
 * errors are detected.
 * 
 * @param {{doc: string, test: function}} spec 
 * @returns {Array} scenarios or corrections
 */
function factory({ doc, test }) {
  var { keys, rows } = parse({ doc });

  var corrections = analyze({ keys, rows, test });

  if (corrections.length) {
    return corrections
  }

  return rows.map((tokens, index) => {
    return scenario({ keys, tokens, index, test })
  })
}

/**
 * @method parse accepts a doc string field and returns an object with arrays
 * of keys (field names) and rows (of data). This will parse doc either as a
 * docstring or a function containing a docstring.
 * 
 * @param {{doc: string}} spec
 * @returns {Array} 
 */
function parse({ doc }) {
  // Ensure that doc is a string.
  if (doc !== Object(doc).toString()) {
    doc = ""
  }

  var rows = [];

  var lines = doc.trim()
    // remove line comments.
    .replace(/\/\/[^\n]*/g, '')
    // split into lines.
    .split("\n");

  // process lines:
  // return on empty or split on | and push to rows accumulator.
  lines.forEach(text => {
    var line = text.trim()
      // Support `\` terminated lines in old fashioned multiline strings.
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

/**
 * @method analyze tests incoming keys, rows, and test params for correctness.
 * Any errors detected are returned in a array containing a single "scenario"
 * or correction with a test function that throws the outline corrections to be
 * made.
 * 
 * @param {{ keys: Array, rows: Array, test: function }}
 * @returns {Array} corrections
 */
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
/**
 * @method scenario accepts an array of keys, an array of tokens (values in a
 * given row of data), the index of the data row in the spec outline, and the
 * test function, and generates either a test-scenario, or an error-scenario.
 * A test-scenario contains a map of params (keys mapped to row values) and a
 * test function that calls the incoming test function param. An error-scenario
 * contains an error string and a test function that throw the error, plus the
 * incoming keys and tokens params.
 * 
 * @param {{ keys: Array, tokens: Array, index: number, test: function }}
 * @returns {Object} scenario
 */
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

/**
 * @method convert accepts an array of tokens and attempts to convert them from
 * strings to real values. These include:
 * 
 *  false, true
 *  null, undefined
 *  NaN, Infinity
 *  Number and Math constants
 *  possibly numeric values such as .1, +1, -1, 1e1
 *  JSON object and array literals.
 * 
 * Quoted strings are returned unchanged.
 * Functions are not supported. 
 * 
 * @param {{tokens: Array}} 
 * @returns {Array} values 
 */
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

    if (/^(\{(.)*\})|(\[(.)*\])$/.test(token)) {
      // Test for JSON object or array literal
      var value;

      try {
        value = JSON.parse(token)
      }
      catch (error) {
        value = error
      }
      finally {
        return value
      }
    }

    // Default case, edifyingly annotated.
    return token;
  })
}

/**
 * @method map accepts arrays of keys and values and returns a an object that
 * maps each key-value entry, e.g., { a: 1, b: 2 }.
 * 
 * @param {{keys: Array, values: Array}} pairs
 * @returns {Object} entries
 */
function map({ keys, values }) {
  var entries = {}

  keys.forEach((label, i) => {
    entries[label] = values[i]
  })

  return entries
}

