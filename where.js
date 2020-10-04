/**
 * @author david f. kaye 
 * @name where.js
 * @license MIT
 */

export { where, parse, build, convert }

function where({ doc, test }) {
  var data = parse({ doc });
  //var array = build({ data });

  return data;
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

    var currentRow = []

    values.split('|').forEach(value => {
      currentRow.push(String(value).trim());
    })

    data.push(currentRow)
  });

  return {
    params: data[0],
    rows: data.slice(1)
  }
}

function build({ data }) {
  var errors = [];
  var { params, rows } = data;

  // at least one row
  if (!rows.length) {
    errors.push('No data values defined.')
  }

  // unique params
  if (params.length > new Set(params).size) {
    errors.push(`Duplicate param names in [${params.join(' ')}].`)
  }

  // row-level
  rows.forEach(values => {
    // - value count equals params length
    //    (should find unbalanced row)
    if (values.length != params.length) {
      errors.push(`Expected ${params.length} values but found ${row.length}.`);
    }

    // - convert values
    //    ("null" to null, "undefined" to undefined, "true" ot true, "false" to false)
    //    (convert numeric string to Number)
    //    (handle Number.RESERVED_CONSTANTS)
    //    (handle Object, Array)
    values = convert({ values });

    // create row value test invoker
    //    function () { return test.apply(row data) }
    // [{ params, values, fn }]

  })

  return data;
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
      var number = value.replace(/\,/g, "");
      var test = Number(number)

      if (test === test) {
        return test;
      }
    }

    return value;
  })
}
