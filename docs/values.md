# Values and Types

What kind of values are suppported in the docstring table?

## void

```js
  a  |    b
null | undefined
```

will convert to  `{ a: null, b: undefined }`

## Boolean

```js
  a   |    b
false | true
```

will convert to `{ a: false, b: true }`

## Math.CONSTANT

```js
    E     |   PI
  Math.E  | Math.PI
```

will convert to `{ E: 2.718281828459045, PI: 3.141592653589793 }`

## Number

```js
  a | b | c
  1 | 2 | 3
```

will convert to `{ a: 1, b: 2, c: 3 }`

## Number.CONSTANT

```js
        A     |      B 
  Number.NaN  | Number.POSITIVE_INFINITY
```

will convert to `{ A: NaN, B: Infinity }`

## Quoted Strings

```js
  Single  | Double    | Quoted
  'quote' | "quotes"  | "He said, \"Hello.\""
```

will convert to `{ Single: 'quote', Double: "quotes", Quoted: "He said, \"Hello.\"" }`

## JSON Objects and Arrays

You can enter a *valid* JSON object shape or an array in each column. Field names (keys) must be quoted.

```js
      user            |       talents
  { "name": "Debbie" }  | ["Smart", "Gets things done"]
```

will convert to `{ user: { name: "Debbie" }, talents: ["Smart", "Gets things done"] }`

An invalid JSON object containing an unquoted field name (key) will result in a JSON.parse() error message.

```js
      user
  { name: "Debbie" }
```

will result in an error message in the scenario, `"Unexpected token n in JSON at position 2"`.

