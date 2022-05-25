import { print } from './print';
import { ProgAst } from '../parser/AST';

function progAst(ast: ProgAst) {
  return ast;
}

describe('print', () => {
  describe('index', () => {
    // TODO Add tests for nested and optional indexes
    it('ident', () => {
      expect(
        print(
          progAst({
            expr: { expr: { type: 'identity' }, index: 'a', type: 'index' },
            type: 'root',
          })
        )
      ).toEqual('.a');
    });
    it('nested', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: {
                expr: {
                  expr: {
                    expr: { type: 'identity' },
                    index: 'a',
                    type: 'index',
                  },
                  index: 'b',
                  type: 'index',
                },
                index: { type: 'num', value: 0 },
                type: 'index',
              },
              index: 'c',
              type: 'index',
            },
            type: 'root',
          })
        )
      ).toEqual('.a.b[0].c');
    });
    it('optional', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: {
                body: { expr: { type: 'identity' }, index: 'a', type: 'index' },
                short: true,
                type: 'try',
              },
              index: 'b',
              type: 'index',
            },
            type: 'root',
          })
        )
      ).toEqual('.a?.b');
    });
    it('str', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: { type: 'identity' },
              index: { interpolated: false, type: 'str', value: '$abc' },
              type: 'index',
            },
            type: 'root',
          })
        )
      ).toEqual('.["$abc"]');
    });
    it('num', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: { type: 'identity' },
              index: { type: 'num', value: 1 },
              type: 'index',
            },
            type: 'root',
          })
        )
      ).toEqual('.[1]');
    });
    it('expression', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: { type: 'identity' },
              index: {
                left: { type: 'num', value: 1 },
                operator: '+',
                right: {
                  left: { type: 'num', value: 3 },
                  operator: '*',
                  right: { name: '$var', type: 'var' },
                  type: 'binary',
                },
                type: 'binary',
              },
              type: 'index',
            },
            type: 'root',
          })
        )
      ).toEqual('.[1 + 3 * $var]');
    });
    describe('slice', () => {
      it('full', () => {
        expect(
          print(
            progAst({
              expr: {
                expr: { type: 'identity' },
                from: {
                  left: { type: 'num', value: 1 },
                  operator: '+',
                  right: {
                    left: { type: 'num', value: 3 },
                    operator: '*',
                    right: { name: '$var', type: 'var' },
                    type: 'binary',
                  },
                  type: 'binary',
                },
                to: { type: 'num', value: 500 },
                type: 'slice',
              },
              type: 'root',
            })
          )
        ).toEqual('.[1 + 3 * $var:500]');
      });
      it('left', () => {
        expect(
          print(
            progAst({
              expr: {
                expr: { type: 'identity' },
                from: { type: 'num', value: 0 },
                type: 'slice',
              },
              type: 'root',
            })
          )
        ).toEqual('.[0:]');
      });
      it('right', () => {
        expect(
          print(
            progAst({
              expr: {
                expr: { type: 'identity' },
                to: { type: 'num', value: 2 },
                type: 'slice',
              },
              type: 'root',
            })
          )
        ).toEqual('.[:2]');
      });
    });
    it('iterator', () => {
      expect(
        print(
          progAst({
            expr: { expr: { type: 'identity' }, type: 'iterator' },
            type: 'root',
          })
        )
      ).toEqual('.[]');
    });
  });
  describe('simple expressions', () => {
    it('identity', () => {
      expect(
        print(progAst({ type: 'root', expr: { type: 'identity' } }))
      ).toEqual('.');
    });
    it('recursiveDescent', () => {
      expect(
        print(progAst({ type: 'root', expr: { type: 'recursiveDescent' } }))
      ).toEqual('..');
    });
    it('num', () => {
      expect(
        print(progAst({ type: 'root', expr: { type: 'num', value: 100 } }))
      ).toEqual('100');
    });
    it('string', () => {
      expect(
        print(
          progAst({
            type: 'root',
            expr: { type: 'str', interpolated: false, value: 'my string' },
          })
        )
      ).toEqual('"my string"');
    });
    it('bool', () => {
      expect(
        print(
          progAst({
            type: 'root',
            expr: { type: 'bool', value: false },
          })
        )
      ).toEqual('false');
    });
    it('null', () => {
      expect(
        print(progAst({ type: 'root', expr: { type: 'null', value: null } }))
      ).toEqual('null');
    });
  });
  describe('def', () => {
    it('simple', () => {
      expect(
        print(
          progAst({
            type: 'root',
            expr: {
              type: 'def',
              name: 'func',
              args: [
                { type: 'filterArg', name: 'a' },
                { type: 'varArg', name: '$b' },
              ],
              body: {
                type: 'binary',
                operator: '|',
                left: { type: 'var', name: '$b' },
                right: { type: 'filter', name: 'a', args: [] },
              },
              next: { type: 'identity' },
            },
          })
        )
      ).toEqual('def func(a; $b): $b | a; .');
    });
    it('inline', () => {
      expect(
        print(
          progAst({
            expr: {
              left: {
                left: { type: 'num', value: 1 },
                operator: '+',
                right: { type: 'num', value: 2 },
                type: 'binary',
              },
              operator: '+',
              right: {
                expr: {
                  args: [],
                  body: { type: 'identity' },
                  name: 'test',
                  next: {
                    args: [{ name: 'a', type: 'filterArg' }],
                    body: { type: 'identity' },
                    name: 'test',
                    next: {
                      left: { type: 'num', value: 1 },
                      operator: '+',
                      right: { type: 'num', value: 4 },
                      type: 'binary',
                    },
                    type: 'def',
                  },
                  type: 'def',
                },
                operator: '-',
                type: 'unary',
              },
              type: 'binary',
            },
            type: 'root',
          })
        )
      ).toEqual('1 + 2 + - def test: .; def test(a): .; 1 + 4');
    });
  });

  describe('operators', () => {
    describe('unary', () => {
      it('minus', () => {
        expect(
          print(
            progAst({
              expr: {
                expr: { type: 'num', value: 1 },
                operator: '-',
                type: 'unary',
              },
              type: 'root',
            })
          )
        ).toEqual('-1');
      });
      it('minus in addition', () => {
        expect(
          print(
            progAst({
              expr: {
                left: { type: 'num', value: 1 },
                operator: '+',
                right: {
                  expr: { type: 'num', value: 8 },
                  operator: '-',
                  type: 'unary',
                },
                type: 'binary',
              },
              type: 'root',
            })
          )
        ).toEqual('1 + -8');
      });
      it('minus foreach', () => {
        expect(
          print(
            progAst({
              expr: {
                left: {
                  expr: {
                    expr: { expr: { type: 'identity' }, type: 'iterator' },
                    init: { type: 'num', value: 0 },
                    type: 'foreach',
                    update: {
                      left: { type: 'identity' },
                      operator: '+',
                      right: { name: '$item', type: 'var' },
                      type: 'binary',
                    },
                    var: '$item',
                  },
                  operator: '-',
                  type: 'unary',
                },
                operator: '|',
                right: {
                  expr: { type: 'identity' },
                  operator: '-',
                  type: 'unary',
                },
                type: 'binary',
              },
              type: 'root',
            })
          )
        ).toEqual('- foreach .[] as $item (0; . + $item) | - .');
      });
    });
    describe('binary', () => {
      it('numbers', () => {
        expect(
          print(
            progAst({
              expr: {
                left: {
                  left: { type: 'num', value: 1 },
                  operator: '+',
                  right: {
                    left: { type: 'num', value: 2 },
                    operator: '*',
                    right: { type: 'num', value: 5 },
                    type: 'binary',
                  },
                  type: 'binary',
                },
                operator: '+',
                right: { type: 'num', value: 3 },
                type: 'binary',
              },
              type: 'root',
            })
          )
        ).toEqual('1 + 2 * 5 + 3');
      });
      it('numbers - precedence', () => {
        expect(
          print(
            progAst({
              expr: {
                left: {
                  left: { type: 'num', value: 1 },
                  operator: '+',
                  right: { type: 'num', value: 2 },
                  type: 'binary',
                },
                operator: '*',
                right: {
                  left: { type: 'num', value: 3 },
                  operator: '+',
                  right: { type: 'num', value: 4 },
                  type: 'binary',
                },
                type: 'binary',
              },
              type: 'root',
            })
          )
        ).toEqual('(1 + 2) * (3 + 4)');
      });
      it('pipe and comma', () => {
        expect(
          print(
            progAst({
              expr: {
                left: {
                  left: { args: [], name: 'a', type: 'filter' },
                  operator: ',',
                  right: { args: [], name: 'b', type: 'filter' },
                  type: 'binary',
                },
                operator: '|',
                right: {
                  left: { args: [], name: 'c', type: 'filter' },
                  operator: ',',
                  right: { args: [], name: 'd', type: 'filter' },
                  type: 'binary',
                },
                type: 'binary',
              },
              type: 'root',
            })
          )
        ).toEqual('a , b | c , d');
      });
      it('pipe and comma with brackets', () => {
        expect(
          print(
            progAst({
              expr: {
                left: {
                  left: { args: [], name: 'a', type: 'filter' },
                  operator: ',',
                  right: {
                    left: { args: [], name: 'b', type: 'filter' },
                    operator: '|',
                    right: { args: [], name: 'c', type: 'filter' },
                    type: 'binary',
                  },
                  type: 'binary',
                },
                operator: ',',
                right: { args: [], name: 'd', type: 'filter' },
                type: 'binary',
              },
              type: 'root',
            })
          )
        ).toEqual('a , (b | c) , d');
      });
    });
    it('bool', () => {
      expect(
        print(
          progAst({
            expr: {
              left: {
                left: {
                  left: { type: 'bool', value: false },
                  operator: 'and',
                  right: { type: 'bool', value: true },
                  type: 'binary',
                },
                operator: 'or',
                right: {
                  left: { type: 'bool', value: true },
                  operator: 'and',
                  right: { type: 'bool', value: false },
                  type: 'binary',
                },
                type: 'binary',
              },
              operator: '|',
              right: { args: [], name: 'not', type: 'filter' },
              type: 'binary',
            },
            type: 'root',
          })
        )
      ).toEqual('false and true or true and false | not');
    });
  });
  describe('array', () => {
    it('array', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: {
                left: {
                  left: { type: 'num', value: 1 },
                  operator: ',',
                  right: { type: 'num', value: 2 },
                  type: 'binary',
                },
                operator: ',',
                right: { type: 'num', value: 3 },
                type: 'binary',
              },
              type: 'array',
            },
            type: 'root',
          })
        )
      ).toEqual('[1, 2, 3]');
    });
    it('empty', () => {
      expect(
        print(
          progAst({
            expr: {
              type: 'array',
            },
            type: 'root',
          })
        )
      ).toEqual('[]');
    });
  });
  describe('object', () => {
    it('object', () => {
      expect(
        print(
          progAst({
            expr: {
              entries: [
                { key: 'a', value: { type: 'num', value: 1 } },
                {
                  key: { interpolated: false, type: 'str', value: '$a' },
                  value: { type: 'num', value: 2 },
                },
                {
                  key: { interpolated: false, type: 'str', value: '@a' },
                  value: { type: 'num', value: 3 },
                },
                {
                  key: { interpolated: false, type: 'str', value: '1' },
                  value: { type: 'num', value: 4 },
                },
                {
                  key: { name: '$var', type: 'var' },
                  value: { type: 'num', value: 5 },
                },
                {
                  key: {
                    interpolated: true,
                    parts: [
                      { name: '$var', type: 'var' },
                      ':',
                      { name: '$var', type: 'var' },
                    ],
                    type: 'str',
                  },
                  value: { type: 'num', value: 6 },
                },
              ],
              type: 'object',
            },
            type: 'root',
          })
        )
      ).toEqual(
        '{ a: 1, "$a": 2, "@a": 3, "1": 4, ($var): 5, "\\($var):\\($var)": 6, }'
      );
    });
    it('object - keywords', () => {
      expect(
        print(
          progAst({
            expr: {
              entries: [
                { key: 'label', value: { type: 'num', value: 1 } },
                { key: 'try', value: { type: 'num', value: 2 } },
                { key: 'catch', value: { type: 'num', value: 3 } },
              ],
              type: 'object',
            },
            type: 'root',
          })
        )
      ).toEqual('{ label: 1, try: 2, catch: 3, }');
    });
    it('trailing comma', () => {
      expect(
        print(
          progAst({
            expr: {
              entries: [
                { key: 'a', value: { type: 'num', value: 1 } },
                { key: 'b', value: { type: 'num', value: 2 } },
              ],
              type: 'object',
            },
            type: 'root',
          })
        )
      ).toEqual('{ a: 1, b: 2, }');
    });
  });

  it('interpolation', () => {
    expect(
      print(
        progAst({
          expr: {
            interpolated: true,
            parts: [{ type: 'identity' }, ':', { type: 'identity' }],
            type: 'str',
          },
          type: 'root',
        })
      )
    ).toEqual(`"\\(.):\\(.)"`);
  });
  describe('format', () => {
    it('as filter', () => {
      expect(
        print(
          progAst({
            expr: {
              left: { interpolated: false, type: 'str', value: 'Hello World!' },
              operator: '|',
              right: { name: '@base64', type: 'format' },
              type: 'binary',
            },
            type: 'root',
          })
        )
      ).toEqual('"Hello World!" | @base64');
    });
    it('interpolation', () => {
      expect(
        print(
          progAst({
            expr: {
              name: '@base64',
              str: {
                interpolated: true,
                parts: [
                  '---',
                  { interpolated: false, type: 'str', value: 'Hello World!' },
                  '---',
                ],
                type: 'str',
              },
              type: 'format',
            },
            type: 'root',
          })
        )
      ).toEqual('@base64 "---\\("Hello World!")---"');
    });
  });
  describe('filter', () => {
    it('without args', () => {
      expect(
        print(
          progAst({
            expr: { args: [], name: 'length', type: 'filter' },
            type: 'root',
          })
        )
      ).toEqual('length');
    });
    it('with one arg', () => {
      expect(
        print(
          progAst({
            expr: {
              args: [
                {
                  left: { type: 'identity' },
                  operator: '+',
                  right: { type: 'num', value: 1 },
                  type: 'binary',
                },
              ],
              name: 'map',
              type: 'filter',
            },
            type: 'root',
          })
        )
      ).toEqual('map(. + 1)');
    });
    it('with multiple args', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: {
                args: [
                  { type: 'num', value: 0 },
                  { type: 'num', value: 10 },
                  { type: 'num', value: 3 },
                ],
                name: 'range',
                type: 'filter',
              },
              type: 'array',
            },
            type: 'root',
          })
        )
      ).toEqual('[range(0;10;3)]');
    });
  });

  describe('control structures', () => {
    describe('if', () => {
      it('if-then', () => {
        expect(
          print(
            progAst({
              expr: {
                cond: { type: 'bool', value: true },
                then: { interpolated: false, type: 'str', value: 'yes' },
                type: 'if',
              },
              type: 'root',
            })
          )
        ).toEqual('if true then "yes" end');
      });
      it('if-then-else', () => {
        expect(
          print(
            progAst({
              expr: {
                cond: { type: 'bool', value: true },
                then: { interpolated: false, type: 'str', value: 'yes' },
                else: { interpolated: false, type: 'str', value: 'no' },
                type: 'if',
              },
              type: 'root',
            })
          )
        ).toEqual('if true then "yes" else "no" end');
      });
      it('if-then-elif-elif-else', () => {
        expect(
          print(
            progAst({
              expr: {
                cond: { type: 'bool', value: true },
                then: { interpolated: false, type: 'str', value: 'yes' },
                elifs: [
                  {
                    cond: { type: 'bool', value: false },
                    then: { interpolated: false, type: 'str', value: 'never1' },
                  },
                  {
                    cond: { type: 'bool', value: false },
                    then: { interpolated: false, type: 'str', value: 'never2' },
                  },
                ],
                else: { interpolated: false, type: 'str', value: 'no' },
                type: 'if',
              },
              type: 'root',
            })
          )
        ).toEqual(
          'if true then "yes" elif false then "never1" elif false then "never2" else "no" end'
        );
      });
    });
    describe('try', () => {
      it('try', () => {
        expect(
          print(
            progAst({
              expr: {
                body: {
                  args: [{ interpolated: false, type: 'str', value: 'ERROR!' }],
                  name: 'error',
                  type: 'filter',
                },
                short: false,
                type: 'try',
              },
              type: 'root',
            })
          )
        ).toEqual('try error("ERROR!")');
      });
      it('try-catch', () => {
        expect(
          print(
            progAst({
              expr: {
                body: {
                  args: [{ interpolated: false, type: 'str', value: 'ERROR!' }],
                  name: 'error',
                  type: 'filter',
                },
                catch: { type: 'identity' },
                short: false,
                type: 'try',
              },
              type: 'root',
            })
          )
        ).toEqual('try error("ERROR!") catch .');
      });
      it('short', () => {
        expect(
          print(
            progAst({
              expr: {
                body: {
                  args: [{ interpolated: false, type: 'str', value: 'ERROR!' }],
                  name: 'error',
                  type: 'filter',
                },
                short: true,
                type: 'try',
              },
              type: 'root',
            })
          )
        ).toEqual('error("ERROR!")?');
      });
    });
    it('label-break', () => {
      expect(
        print(
          progAst({
            expr: {
              left: { type: 'label', value: '$out' },
              operator: '|',
              right: { type: 'break', value: '$out' },
              type: 'binary',
            },
            type: 'root',
          })
        )
      ).toEqual('label $out | break $out');
    });
    it('reduce', () => {
      expect(
        print(
          progAst({
            expr: {
              expr: { expr: { type: 'identity' }, type: 'iterator' },
              init: { type: 'num', value: 0 },
              type: 'reduce',
              update: {
                left: { type: 'identity' },
                operator: '+',
                right: { name: '$item', type: 'var' },
                type: 'binary',
              },
              var: '$item',
            },
            type: 'root',
          })
        )
      ).toEqual('reduce .[] as $item (0; . + $item)');
    });
    describe('foreach', () => {
      it('2 args', () => {
        expect(
          print(
            progAst({
              expr: {
                expr: { expr: { type: 'identity' }, type: 'iterator' },
                init: { type: 'num', value: 0 },
                type: 'foreach',
                update: {
                  left: { type: 'identity' },
                  operator: '+',
                  right: { name: '$item', type: 'var' },
                  type: 'binary',
                },
                var: '$item',
              },
              type: 'root',
            })
          )
        ).toEqual('foreach .[] as $item (0; . + $item)');
      });
      it('3 args', () => {
        expect(
          print(
            progAst({
              expr: {
                expr: { expr: { type: 'identity' }, type: 'iterator' },
                extract: {
                  left: { type: 'identity' },
                  operator: '+',
                  right: { type: 'num', value: 1 },
                  type: 'binary',
                },
                init: { type: 'num', value: 0 },
                type: 'foreach',
                update: {
                  left: { type: 'identity' },
                  operator: '+',
                  right: { name: '$item', type: 'var' },
                  type: 'binary',
                },
                var: '$item',
              },
              type: 'root',
            })
          )
        ).toEqual('foreach .[] as $item (0; . + $item; . + 1)');
      });
    });
  });

  describe('variables', () => {
    it('var', () => {
      expect(
        print(
          progAst({
            expr: { name: '$var', type: 'var' },
            type: 'root',
          })
        )
      ).toEqual('$var');
    });
    it('simple declaration', () => {
      expect(
        print(
          progAst({
            expr: {
              next: { name: '$var', type: 'var' },
              destructuring: { type: 'var', name: '$var' },
              expr: { type: 'identity' },
              type: 'varDeclaration',
            },
            type: 'root',
          })
        )
      ).toEqual('. as $var | $var');
    });
    it('array destructuring', () => {
      expect(
        print(
          progAst({
            expr: {
              next: {
                left: {
                  left: { name: '$a', type: 'var' },
                  operator: '+',
                  right: { name: '$b', type: 'var' },
                  type: 'binary',
                },
                operator: '+',
                right: { name: '$c', type: 'var' },
                type: 'binary',
              },
              destructuring: {
                destructuring: [
                  { name: '$a', type: 'var' },
                  { name: '$b', type: 'var' },
                  { name: '$c', type: 'var' },
                ],
                type: 'arrayDestructuring',
              },
              expr: {
                expr: {
                  left: {
                    left: { type: 'num', value: 1 },
                    operator: ',',
                    right: { type: 'num', value: 2 },
                    type: 'binary',
                  },
                  operator: ',',
                  right: { type: 'num', value: 3 },
                  type: 'binary',
                },
                type: 'array',
              },
              type: 'varDeclaration',
            },
            type: 'root',
          })
        )
      ).toEqual('[1, 2, 3] as [ $a, $b, $c ] | $a + $b + $c');
    });
    describe('object destructuring', () => {
      it('str', () => {
        expect(
          print(
            progAst({
              expr: {
                next: { name: '$a', type: 'var' },
                destructuring: {
                  entries: [
                    {
                      destructuring: { name: '$a', type: 'var' },
                      key: { interpolated: false, type: 'str', value: 'key' },
                    },
                  ],
                  type: 'objectDestructuring',
                },
                expr: { type: 'identity' },
                type: 'varDeclaration',
              },
              type: 'root',
            })
          )
        ).toEqual('. as { "key": $a } | $a');
      });
      it('ident', () => {
        expect(
          print(
            progAst({
              expr: {
                next: { name: '$a', type: 'var' },
                destructuring: {
                  entries: [
                    { destructuring: { name: '$a', type: 'var' }, key: 'key' },
                  ],
                  type: 'objectDestructuring',
                },
                expr: { type: 'identity' },
                type: 'varDeclaration',
              },
              type: 'root',
            })
          )
        ).toEqual('. as { key: $a } | $a');
      });
      it('expression', () => {
        expect(
          print(
            progAst({
              expr: {
                next: { name: '$a', type: 'var' },
                destructuring: {
                  entries: [
                    {
                      destructuring: { name: '$a', type: 'var' },
                      key: {
                        left: {
                          left: { type: 'num', value: 1 },
                          operator: '+',
                          right: { type: 'num', value: 2 },
                          type: 'binary',
                        },
                        operator: '|',
                        right: { args: [], name: 'tostring', type: 'filter' },
                        type: 'binary',
                      },
                    },
                  ],
                  type: 'objectDestructuring',
                },
                expr: { type: 'identity' },
                type: 'varDeclaration',
              },
              type: 'root',
            })
          )
        ).toEqual('. as { (1 + 2 | tostring): $a } | $a');
      });
      it('abbreviated', () => {
        expect(
          print(
            progAst({
              expr: {
                next: { name: '$a', type: 'var' },
                destructuring: {
                  entries: [{ key: { name: '$a', type: 'var' } }],
                  type: 'objectDestructuring',
                },
                expr: { type: 'identity' },
                type: 'varDeclaration',
              },
              type: 'root',
            })
          )
        ).toEqual('. as { $a } | $a');
      });
      it('str interpolation', () => {
        expect(
          print(
            progAst({
              expr: {
                next: { name: '$a', type: 'var' },
                destructuring: {
                  entries: [
                    {
                      destructuring: { name: '$a', type: 'var' },
                      key: {
                        interpolated: true,
                        parts: [{ type: 'num', value: 1 }],
                        type: 'str',
                      },
                    },
                  ],
                  type: 'objectDestructuring',
                },
                expr: { type: 'identity' },
                type: 'varDeclaration',
              },
              type: 'root',
            })
          )
        ).toEqual('. as { "\\(1)": $a } | $a');
      });
    });
    it('nested', () => {
      expect(
        print(
          progAst({
            expr: {
              next: { name: '$a', type: 'var' },
              destructuring: {
                entries: [
                  {
                    destructuring: {
                      entries: [
                        { key: { name: '$a', type: 'var' } },
                        {
                          destructuring: {
                            destructuring: [
                              { name: '$b', type: 'var' },
                              { name: '$c', type: 'var' },
                              {
                                entries: [
                                  { key: { name: '$d', type: 'var' } },
                                  {
                                    destructuring: { name: '$e', type: 'var' },
                                    key: {
                                      interpolated: false,
                                      type: 'str',
                                      value: 'key',
                                    },
                                  },
                                  {
                                    destructuring: {
                                      destructuring: [
                                        { name: '$f', type: 'var' },
                                        { name: '$g', type: 'var' },
                                      ],
                                      type: 'arrayDestructuring',
                                    },
                                    key: {
                                      interpolated: false,
                                      type: 'str',
                                      value: 'arr',
                                    },
                                  },
                                ],
                                type: 'objectDestructuring',
                              },
                            ],
                            type: 'arrayDestructuring',
                          },
                          key: 'arr',
                        },
                      ],
                      type: 'objectDestructuring',
                    },
                    key: 'a',
                  },
                ],
                type: 'objectDestructuring',
              },
              expr: { type: 'identity' },
              type: 'varDeclaration',
            },
            type: 'root',
          })
        )
      ).toEqual(
        '. as { a: { $a, arr: [ $b, $c, { $d, "key": $e, "arr": [ $f, $g ] } ] } } | $a'
      );
    });
  });
});
