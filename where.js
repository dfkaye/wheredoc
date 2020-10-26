/**
 * @author david f. kaye 
 * @name where.js
 * @license MIT
 */

export { spec, where, parse, build, convert }

function spec(test) {
  // About /(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/
  // That RegExp extracts each row of the data table after the where label (non capture),
  // containing at least one | and newline, and supports multiple formats, starting
  // with a `where:` label inside the doc test function:

  //  where: ` ... `;
  //  where: /* ... */; <-- requires trailing semi-colon if no other statements follow>
  //  where: " ... \n\ ... ";
  //  where: () => { .... };
  var reWheredoc = /(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/;

  var match = Object(test).toString().match(reWheredoc);

  // When match fails to match, it returns null. We check that match exists
  // and that its second entry which excludes the non-captured group also
  // exists; if it does, then match[1] is assigned; otherwise fall back to the
  // empty string.
  var doc = match && match[1] || "";

  return where({ doc, test })
}

function where({ doc, test }) {
  var data = parse({ doc });

  return build({ data, test });
}

function parse({ doc }) {
  // parse doc as docstring or function containing docstring.
  // remove comments
  // match:   var match = fs.match(/(?:where[^\n]*[\n])(([^\|]*\|)+[^\n]*[\n])/);
  // match && match[1] || ""
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

    if (values.length == 0) {
      // Skip empty line.
      return
    }

    var row = [];

    values.split('|').forEach(value => {
      row.push(String(value).trim());
    })

    rows.push(row);
  });

  return {
    params: rows[0] || [], // fallback empty array
    rows: rows.slice(1) // creates an empty array if data has no rows.
  }
}

function build({ data, test }) {
  var { params, rows } = data;
  var scenarios = [];
  var errors = [];

  // test is a function
  if (typeof test != "function") {
    errors.push(`"test" expected to be a function but was "${typeof test}"`)
  }

  // at least one row
  if (!rows.length) {
    errors.push(`No values defined for [${params.join(', ')}]`)
  }

  // unique params
  if (params.length > new Set(params).size) {
    errors.push(`Duplicate param names: [${params.join(', ')}]`)
  }

  // Return early if any errors, with one scenario that throws all messages.
  if (errors.length) {
    var error = errors.join('\n');
    var apply = function () { throw new Error(error) }

    return {
      scenarios: [{
        params,
        values: rows,
        apply,
        error
      }],
      errors
    }
  }

  // row-level
  rows.forEach((values, row) => {
    // - value count equals params length
    //    (should find unbalanced row)
    if (values.length != params.length) {
      var error = [
        `Row ${row + 1}, expected ${params.length} values but found ${values.length}.`,
        `params: [${params.join(', ')}]`,
        `values: [${values.join(', ')}]`
      ].join('\n');

      var apply = function () {
        throw new Error(error)
      }

      scenarios.push({ params, values, apply, error });
      errors.push(error);

      return;
    }

    // Create scenario { params, apply } for each row.

    // - convert values
    //   done ("null" to null, "undefined" to undefined, "true" ot true, "false" to false)
    //   done  (convert numeric string to Number)
    //   done  (handle Math.RESERVED_CONSTANTS)
    //   done  (handle Number.RESERVED_CONSTANTS)
    //   done (handle Object, Array)
    //   done (change the way params are returned for each row)

    values = convert({ values });

    // - create row value test invoker
    var apply = function () {
      return test.apply(null, values)
    }

    // create params enum
    var enumerable = {};

    params.forEach((p, i) => {
      enumerable[p] = values[i];
    });

    scenarios.push({ params: enumerable, apply });
  })

  return { scenarios, errors };
}

function convert({ values }) {
  return values.map(value => {
    if (/^(false|true)$/.test(value)) {
      // Gist: https://gist.github.com/dfkaye/ce346446dee243173cd199e51b0c51ac
      // return (true).toString() === value;

      return evaluate(value)
    }

    if (/^(null|undefined)$/.test(value)) {
      // return value === "null" ? null : undefined;

      return evaluate(value)
    }

    if (/\d+/g.test(value) && !/[\'|\"]/g.test(value)) {
      var string = value.replace(/\,/g, "");
      var number = Number(string)

      // Number is not NaN.
      if (number === number) {
        return number;
      }
    }

    if (/^NaN$/.test(value)) {
      return NaN;
    }

    if (/^[-]?Infinity$/.test(value)) {
      /*
      return (
        value < 0
          ? -Infinity
          : Infinity
      );
      */
      return evaluate(value)
    }

    if (/^Number.[A-Z]+/.test(value)) {
      // Number.NEGATIVE_INFINITY
      // var field = value.split(".")[1];
      // return Number[field];

      return evaluate(value)
    }

    if (/^Math.[A-Z]+/.test(value)) {
      // Math.PI
      //var field = value.split(".")[1];
      // return Math[field];

      return evaluate(value)
    }

    if (/^([\[](.)+[\]])|([\{](.)+[\}])$/.test(value)) {
      // Array or Object literal
      try {
        var object = evaluate(value)

        return object
      }
      catch (error) {
        return error
      }
    }

    // Default case, edifyingly annotated.
    return value;
  })
}

function evaluate(value) {
  return Function("return (" + value + ");").apply(0)
}
