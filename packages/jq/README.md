# @jq-tools/jq

This library intends to implement a fully functional jq interpreter that could be used in the browser or in Node.js.
As of now, only the parser is available, but I hope to add a formatter and an interpreter soon.

For more info about the jq language see its official [homepage](https://stedolan.github.io/jq/).

## Installation

```bash
yarn add -E @jq-tools/jq
```

## Usage

### Interpreter

NOTE: This feature is not implemented yet.

#### Input

```js
import { jq } from '@jq-tools/jq';

const transform = jq`.[] | . * 2`;
Array.from(transform([1, 2, 3]));
```

#### Output

```json
[2, 4, 6]
```

### Formatter

#### Input

```js
import { format } from '@jq-tools/jq';

format(`[.[] | {
"firstName" : .firstName ,
lastName: .surname
}]
`);
```

#### Output

```jq
[.[] | {
  "firstName": .firstName,
  lastName: .surname,
}]
```

### Code Generator

#### Input

```js
import { print } from '@jq-tools/jq';

print({
  expr: { expr: { type: 'identity' }, type: 'iterator' },
  type: 'root',
});
```

#### Output

```jq
.[]
```

### Parser

The parser should be able to handle any jq syntax except for the modules.

For more information about the AST refer to its [TypeScript types](https://github.com/alexxander/jq-tools/blob/main/packages/jq/src/lib/parser/AST.ts).

#### Input

```js
import { parse } from '@jq-tools/jq';

parse('.[].a | {"a": 5 + ., "--\\(. * 2)--": . + 4}');
```

#### Output

```json
{
  "type": "root",
  "expr": {
    "type": "binary",
    "left": {
      "type": "index",
      "expr": {
        "type": "iterator",
        "expr": {
          "type": "identity"
        }
      },
      "index": "a"
    },
    "operator": "|",
    "right": {
      "type": "object",
      "entries": [
        {
          "key": {
            "type": "str",
            "value": "a",
            "interpolated": false
          },
          "value": {
            "type": "binary",
            "left": {
              "type": "num",
              "value": 5
            },
            "operator": "+",
            "right": {
              "type": "identity"
            }
          }
        },
        {
          "key": {
            "interpolated": true,
            "parts": [
              "--",
              {
                "type": "binary",
                "left": {
                  "type": "identity"
                },
                "operator": "*",
                "right": {
                  "type": "num",
                  "value": 2
                }
              },
              "--"
            ],
            "type": "str"
          },
          "value": {
            "type": "binary",
            "left": {
              "type": "identity"
            },
            "operator": "+",
            "right": {
              "type": "num",
              "value": 4
            }
          }
        }
      ]
    }
  }
}
```

## Credits

[How to implement a programming language in JavaScript](https://lisperator.net/pltut/)
