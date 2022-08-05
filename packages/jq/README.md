# @jq-tools/jq

This library intends to implement a fully functional jq interpreter that could be used in the browser or in Node.js.

For more info about the jq language see its official [homepage](https://stedolan.github.io/jq/).

## Installation

```bash
yarn add -E @jq-tools/jq
```

## Usage

### Interpreter

From code, you can either use the `jq` template tag or the `evaluate` method. It is also possible to use the interpreter
from the command line.

#### Supported features

The interpreter should currently support many of jq's features. However, not everything is supported yet. The following
features still lack an implementation:

- Modules
- Assignment operators `=`, `|=`, `+=`, `-=`, `*=`, `/=`, `%=`, `//=`.
- Multiplication of objects (e.g. `{a: 1} * {b: 2}`)
- Most of the builtins (except for `length`)
- Most of the formats (except for `@base64` and `@base64d`)

#### `jq` template tag (`jq<In=any, Out=unknown>`)

Parses the jq code from the template string and returns a function of shape
`(input: In[] | IterableIterator<In>) => IterableIterator<Out>`. This function can be used to apply the defined jq
filter to some input data.

```ts
import { jq } from '@jq-tools/jq';

const transform = jq<number, number>`.[] | . * 2`;
Array.from(transform([1, 2, 3]));
```

##### Output

```json
[2, 4, 6]
```

#### `evaluate(ast: ProgAst, input: any[] | IterableIterator<any>): IterableIterator<any>`

Evaluates the given jq AST against the provided input.

```ts
import { evaluate, parse } from '@jq-tools/jq';

Array.from(evaluate(parse(`.[] | . * 2`), [1, 2, 3]));
```

##### Output

```json
[2, 4, 6]
```

#### CLI

You can use the jq interpreter from the command line:

```bash
echo '5' | yarn jq '.+5' # Outputs: 10
```

### Formatter

#### `format(code: string): string`

Formats the provided jq code

```ts
import { format } from '@jq-tools/jq';

format(`[.[] | {
"firstName" : .firstName ,
lastName: .surname
}]
`);
```

##### Output

```jq
[.[] | {
  "firstName": .firstName,
  lastName: .surname,
}]
```

### Code Generator

#### `print(ast: ProgAst): string`

Generates code from the provided jq AST.

```ts
import { print } from '@jq-tools/jq';

print({
  expr: { expr: { type: 'identity' }, type: 'iterator' },
  type: 'root',
});
```

##### Output

```jq
.[]
```

### Parser

The parser should be able to handle any jq syntax except for the modules.

For more information about the AST refer to
its [TypeScript types](https://github.com/alexxander/jq-tools/blob/main/packages/jq/src/lib/parser/AST.ts).

#### `parse(code: string): ProgAst`

Parses the provided jq code and returns its AST.

```ts
import { parse } from '@jq-tools/jq';

parse('.[].a | {"a": 5 + ., "--\\(. * 2)--": . + 4}');
```

##### Output

```json
{
  "expr": {
    "left": {
      "expr": {
        "expr": {
          "type": "identity"
        },
        "type": "iterator"
      },
      "index": "a",
      "type": "index"
    },
    "operator": "|",
    "right": {
      "entries": [
        {
          "key": {
            "interpolated": false,
            "type": "str",
            "value": "a"
          },
          "value": {
            "left": {
              "type": "num",
              "value": 5
            },
            "operator": "+",
            "right": {
              "type": "identity"
            },
            "type": "binary"
          }
        },
        {
          "key": {
            "interpolated": true,
            "parts": [
              "--",
              {
                "left": {
                  "type": "identity"
                },
                "operator": "*",
                "right": {
                  "type": "num",
                  "value": 2
                },
                "type": "binary"
              },
              "--"
            ],
            "type": "str"
          },
          "value": {
            "left": {
              "type": "identity"
            },
            "operator": "+",
            "right": {
              "type": "num",
              "value": 4
            },
            "type": "binary"
          }
        }
      ],
      "type": "object"
    },
    "type": "binary"
  },
  "type": "root"
}
```

## Credits

[How to implement a programming language in JavaScript](https://lisperator.net/pltut/)
