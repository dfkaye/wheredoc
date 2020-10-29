/* draft of API refactoring */
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
  build, parse, outline, scenario, convert, evaluate, map
}

function build({ doc, test }) {
  var { labels, rows } = parse({ doc });

  // outline errors
  // - test not a function
  // - no data rows
  // - duplicate labels
  // - labels don't start wih a-z, $, _
  var corrections = outline({ labels, rows, test });

  if (corrections) {
    return corrections
  }

  // return scenarios
  return rows.map((entries, i) => {
    return scenario({ labels, entries, row: i + 1 })
  })
}

function parse({ doc }) {
  // parse doc as docstring or function containing docstring.
  var lines = Object(doc).toString()
    .trim()
    .replace(/\/\/[^\n]*/g, '') // remove comments...
    .split('\n'); // and split by newline

  var rows = [];

  // process lines
  // trim
  // return or split on |
  lines.forEach(line => {
    var values = line.trim();

    // remove external fence posts (| separators)
    // before: | a | b | c |
    // after:  a | b | c
    if (/^\|(.)*\|$/.test(values)) {
      values = values.substring(1, values.length - 1).trim()
    }

    if (values.length == 0) {
      // Skip empty line.
      return
    }

    var entries = [];

    values.split('|').forEach(value => {
      entries.push(String(value).trim());
    })

    rows.push(entries);
  });

  return {
    labels: rows[0] || [], // creates an empty array if data has no labels
    rows: rows.slice(1) // creates an empty array if data has no rows.
  }
}

function outline({ labels, rows, test }) {
  var corrections;
  var errors = []

  // test is not a function
  if (typeof test != "function") {
    errors.push(`"test" expected to be a function but was "${typeof test}"`)
  }

  // no data rows
  if (!rows.length) {
    errors.push(`No values defined for [${labels.join(', ')}]`)
  }

  // duplicate labels
  if (labels.length > new Set(labels).size) {
    errors.push(`Duplicate labels: [${labels.join(', ')}]`)
  }

  // labels don't start wih A-z, $, _
  labels.forEach(label => {
    if (!/^[A-z\$\_]/.test(label)) {
      errors.push(`Label ${label} expected to start with A-z, $, or _ (X, x, $x, _x)`)
    }
  })

  if (errors.length) {
    var error = errors.join('\n');
    var correction = {
      labels,
      rows,
      error,
      test: function () { throw new Error(error) }
    }

    corrections = [correction]
  }

  return corrections;
}

function scenario({ labels, entries, row }) {
  var errors = []

  // unbalanced labels.length != entries.length
  if (labels.length != entries.length) {
    var message = [
      `Row ${row}`,
      `expected ${labels.length} values`,
      `but found ${entries.length}.`
    ].join(', ');

    errors.push(message);
  }

  if (errors.length) {
    var error = errors.join("\n")

    return {
      values: entries,
      labels,
      error,
      test: function () { throw new Error(error) }
    };
  }

  var values = convert({ entries })

  return {
    params: map({ params, values }),
    test: function () { return test.apply(null, values) }
  };
}

function convert({ entries }) {
  return entries.map(value => {

    if (/test/.test(value)) {
      return evaluate({ value })
    }

    return value
  })
}

function evaluate({ value }) {
  return Function("return (" + value + ");").call()
}

function map({ labels, values }) {
  var params = {}

  labels.forEach((key, i) => {
    params[key] = values[i]
  })

  return params
}
