/**
 * @author david f. kaye 
 * @name where.js
 * @license MIT
 */

export { where, parse, build, convert }

function where({ doc, test }) {
  var data = parse({ doc });

  return build({ data, test });
}

function parse({ doc }) {
  var rows = String(doc).trim()
    .replace(/\/\/[^\n]*/g, '') // remove comments...
    .split('\n'); // and split by newline

  var data = [];

  rows.forEach(row => {
    var values = row.trim();

    if (values.length == 0) {
      // Skip empty row.
      return
    }

    var currentRow = [];

    values.split('|').forEach(value => {
      currentRow.push(String(value).trim());
    })

    data.push(currentRow);
  });

  return {
    params: data[0],
    rows: data.slice(1)
  }
}

function build({ data, test }) {
  var { params, rows } = data;
  var scenarios = [];
  var errors = [];

  // at least one row
  if (!rows.length) {
    errors.push(`No values defined for "${params.join(' ')}"`)
  }

  // unique params
  if (params.length > new Set(params).size) {
    errors.push(`Duplicate param names: "${params.join(' ')}".`)
  }

  if (errors.length) {
    var error = errors.join('\n');
    var apply = function () { throw new Error(error) }

    return {
      scenarios: [{ params, values: rows, apply, error }],
      errors
    }
  }

  // row-level
  rows.forEach((values, row) => {
    // - value count equals params length
    //    (should find unbalanced row)
    if (values.length != params.length) {
      var error = `Row ${row + 1}: Expected ${params.length} values but found ${values.length}.
      params: ${params.join(', ')}
      values: ${values.join(', ')}
      `;

      var apply = function () {
        throw new Error(error)
      }

      scenarios.push({ params, values, apply, error });
      errors.push(error);

      return;
    }

    // - convert values
    //   done ("null" to null, "undefined" to undefined, "true" ot true, "false" to false)
    //   done  (convert numeric string to Number)

    //   To Do  (handle Number.RESERVED_CONSTANTS)
    //   To Do (handle Object, Array)

    values = convert({ values });

    // - create row value test invoker
    var apply = function () { return test.apply(null, values) }

    scenarios.push({ params, values, apply });
  })

  return { scenarios, errors };
}

function convert({ values }) {
  return values.map(value => {
    if (/^(false|true)$/.test(value)) {
      // Gist: https://gist.github.com/dfkaye/ce346446dee243173cd199e51b0c51ac
      return (true).toString() === value;
    }

    if (/^(null|undefined)$/.test(value)) {
      return value === "null" ? null : undefined;
    }

    if (/\d+/g.test(value) && !/[\'|\"]/g.test(value)) {
      var string = value.replace(/\,/g, "");
      var number = Number(string)

      if (number === number) {
        return number;
      }
    }

    return value;
  })
}
