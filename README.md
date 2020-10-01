# wheredoc

squat name for where.js deprecation and refactor 

## Prior art

where.js tests are modeled on spock's where clause and cucumber's scenario table
using these embedded in a three-star comment syntax parsed from inside a function.

```js
it('description', function () {
  where(function(){
    /*** 
      a  |  b  |  c
      1  |  2  |  3
      4  |  3  |  7
      6  |  6  |  12
    ***/
		
		expect(a + b).toBe(c);
		expect(c - a).toBe(b);
  });
});
```

We took that approach because at the time (2014) JavaScript did not support 
multi-line strings as neatly as a function comment, and the template literal
syntax was not yet implemented.

The goal of that heredoc style was to make data-driven tests easy to read and
write. As "cool" as it felt to write at the time, in between states of stress
and exhaustion, I now think that kind of cleverness costs too much to maintain.

And ease of maintenance is one of the points of test-driven development.

## Goals

wheredoc uses a simpler setup to reduce the cleverness, using a test config with
a data field pointing to a template literal string instead of a special comment
syntax, and a test field pointing to a function containing the assertions.

```js
it('description', function () {
  where({
    data: ` 
      a  |  b  |  c
      1  |  2  |  3
      4  |  3  |  7
      6  |  6  |  12
    `,

		expect: (a,b,c) => {
			expect(a + b).toBe(c);
			expect(c - a).toBe(b);
		}
  });
});
```

The data field can also be formatted as a multi-line string, using backslash
notation, but in that case, each line must end with a newline character,
followed by the backslash (`\n\`).

```js
it('description', function () {
  where({
    data: "\
      a  |  b  |  c		\n\
      1  |  2  |  3		\n\
      4  |  3  |  7		\n\
      6  |  6  |  12	\n\
    ",

		expect: (a,b,c) => {
			expect(a + b).toBe(c);
			expect(c - a).toBe(b);
		}
  });
});
```

wheredoc optionally supports both concepts of `intercept` and `log` from the
`context specifier` param in where.js.

```js
it('description', function () {
  var results = where({
    data: "...",

		expect: () => {},
		
		intercept: true, /* returns a result structure */  
		
		log: true /* always log result of each test run to the console, not just on fails. */
  });
});
```
