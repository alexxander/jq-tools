import { parse } from './Parser';
import { ProgAst } from './AST';

function progAst(ast: ProgAst) {
  return ast;
}

describe('parse', () => {
  describe('index', () => {
    // TODO Add tests for nested and optional indexes
    it('ident', () => {
      expect(parse('.a')).toEqual(
        progAst({
          expr: { expr: { type: 'identity' }, index: 'a', type: 'index' },
          type: 'root',
        })
      );
    });
    it('nested', () => {
      expect(parse('.a.b[0].c')).toEqual(
        progAst({
          expr: {
            expr: {
              expr: {
                expr: { expr: { type: 'identity' }, index: 'a', type: 'index' },
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
      );
    });
    it('optional', () => {
      expect(parse('.a?.b')).toEqual(
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
      );
    });
    it('str', () => {
      expect(parse('."$abc"')).toEqual(
        progAst({
          expr: {
            expr: { type: 'identity' },
            index: { interpolated: false, type: 'str', value: '$abc' },
            type: 'index',
          },
          type: 'root',
        })
      );
    });
    it('num', () => {
      expect(parse('.[1]')).toEqual(
        progAst({
          expr: {
            expr: { type: 'identity' },
            index: { type: 'num', value: 1 },
            type: 'index',
          },
          type: 'root',
        })
      );
    });
    it('expression', () => {
      expect(parse('.[1+3*$var]')).toEqual(
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
      );
    });
    describe('slice', () => {
      it('full', () => {
        expect(parse('.[1+3*$var:500]')).toEqual(
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
        );
      });
      it('left', () => {
        expect(parse('.[0:]')).toEqual(
          progAst({
            expr: {
              expr: { type: 'identity' },
              from: { type: 'num', value: 0 },
              type: 'slice',
            },
            type: 'root',
          })
        );
      });
      it('right', () => {
        expect(parse('.[:2]')).toEqual(
          progAst({
            expr: {
              expr: { type: 'identity' },
              to: { type: 'num', value: 2 },
              type: 'slice',
            },
            type: 'root',
          })
        );
      });
    });
    it('iterator', () => {
      expect(parse('.[]')).toEqual(
        progAst({
          expr: { expr: { type: 'identity' }, type: 'iterator' },
          type: 'root',
        })
      );
    });
  });
  describe('simple expressions', () => {
    it('identity', () => {
      expect(parse('.')).toEqual(
        progAst({ type: 'root', expr: { type: 'identity' } })
      );
    });
    it('recursiveDescent', () => {
      expect(parse('..')).toEqual(
        progAst({ type: 'root', expr: { type: 'recursiveDescent' } })
      );
    });
    it('num', () => {
      expect(parse('100')).toEqual(
        progAst({ type: 'root', expr: { type: 'num', value: 100 } })
      );
    });
    it('string', () => {
      expect(parse('"my string"')).toEqual(
        progAst({
          type: 'root',
          expr: { type: 'str', interpolated: false, value: 'my string' },
        })
      );
    });
    it('bool', () => {
      expect(parse('false')).toEqual(
        progAst({
          type: 'root',
          expr: { type: 'bool', value: false },
        })
      );
    });
    it('null', () => {
      expect(parse('null')).toEqual(
        progAst({ type: 'root', expr: { type: 'null', value: null } })
      );
    });
  });
  describe('def', () => {
    it('simple', () => {
      expect(parse('def func(a; $b): $b | a; .')).toEqual(
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
      );
    });
    it('inline', () => {
      expect(parse('1 + 2 + - def test: .; def test(a): .; 1 + 4')).toEqual(
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
      );
    });
  });

  it('wrong def delimiter', () => {
    expect(() =>
      parse('def func(a, $b): $b | a; .')
    ).toThrowErrorMatchingSnapshot('wrong def delimiter');
  });

  describe('operators', () => {
    describe('unary', () => {
      it('minus', () => {
        expect(parse('-1')).toEqual(
          progAst({
            expr: {
              expr: { type: 'num', value: 1 },
              operator: '-',
              type: 'unary',
            },
            type: 'root',
          })
        );
      });
      it('minus in addition', () => {
        expect(parse('1+-8')).toEqual(
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
        );
      });
      it('minus foreach', () => {
        expect(parse('- foreach .[] as $item (0; . + $item) | - .')).toEqual(
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
        );
      });
    });
    describe('binary', () => {
      it('addition', () => {
        expect(parse('1+2+3+4')).toEqual(
          progAst({
            expr: {
              left: {
                left: {
                  left: { type: 'num', value: 1 },
                  operator: '+',
                  right: { type: 'num', value: 2 },
                  type: 'binary',
                },
                operator: '+',
                right: { type: 'num', value: 3 },
                type: 'binary',
              },
              operator: '+',
              right: { type: 'num', value: 4 },
              type: 'binary',
            },
            type: 'root',
          })
        );
      });
      it('normalization', () => {
        expect(parse('1+(2+(3+4))')).toEqual(
          progAst({
            expr: {
              left: {
                left: {
                  left: { type: 'num', value: 1 },
                  operator: '+',
                  right: { type: 'num', value: 2 },
                  type: 'binary',
                },
                operator: '+',
                right: { type: 'num', value: 3 },
                type: 'binary',
              },
              operator: '+',
              right: { type: 'num', value: 4 },
              type: 'binary',
            },
            type: 'root',
          })
        );
      });
      it('addition vs multiplication', () => {
        expect(parse('1+2*5+3')).toEqual(
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
        );
      });
      it('addition vs multiplication with brackets', () => {
        expect(parse('(1+2)*(5+3)')).toEqual(
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
                left: { type: 'num', value: 5 },
                operator: '+',
                right: { type: 'num', value: 3 },
                type: 'binary',
              },
              type: 'binary',
            },
            type: 'root',
          })
        );
      });
      it('pipe and comma', () => {
        expect(parse('a , b | c , d')).toEqual(
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
        );
      });
      it('pipe and comma with brackets', () => {
        expect(parse('a , (b | c) , d')).toEqual(
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
        );
      });
    });
    it('bool', () => {
      expect(parse('false and true or true and false | not')).toEqual(
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
      );
    });
  });
  describe('array', () => {
    it('array', () => {
      expect(parse('[1,2,3]')).toEqual(
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
      );
    });
    it('empty', () => {
      expect(parse('[]')).toEqual(
        progAst({
          expr: {
            type: 'array',
          },
          type: 'root',
        })
      );
    });
  });
  describe('object', () => {
    it('object', () => {
      expect(
        parse(
          '{a: 1, "$a": 2, "@a": 3, "1": 4, ($var): 5, "\\($var):\\($var)": 6}'
        )
      ).toEqual(
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
      );
    });
    it('object - keywords', () => {
      expect(parse('{label: 1, try: 2, catch: 3}')).toEqual(
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
      );
    });
    it('trailing comma', () => {
      expect(parse('{a: 1, b: 2, }')).toEqual(
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
      );
    });
  });

  it('interpolation', () => {
    expect(parse(`"\\(.):\\(.)"`)).toEqual({
      expr: {
        interpolated: true,
        parts: [{ type: 'identity' }, ':', { type: 'identity' }],
        type: 'str',
      },
      type: 'root',
    });
  });
  describe('format', () => {
    it('as filter', () => {
      expect(parse('"Hello World!" | @base64')).toEqual(
        progAst({
          expr: {
            left: { interpolated: false, type: 'str', value: 'Hello World!' },
            operator: '|',
            right: { name: '@base64', type: 'format' },
            type: 'binary',
          },
          type: 'root',
        })
      );
    });
    it('interpolation', () => {
      expect(parse('@base64 "---\\("Hello World!")---"')).toEqual(
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
      );
    });
  });
  describe('filter', () => {
    it('without args', () => {
      expect(parse('length')).toEqual(
        progAst({
          expr: { args: [], name: 'length', type: 'filter' },
          type: 'root',
        })
      );
    });
    it('with one arg', () => {
      expect(parse('map(.+1)')).toEqual(
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
      );
    });
    it('with multiple args', () => {
      expect(parse('[range(0;10;3)]')).toEqual(
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
      );
    });
  });

  describe('control structures', () => {
    describe('if', () => {
      it('if-then', () => {
        expect(parse('if true then "yes" end')).toEqual(
          progAst({
            expr: {
              cond: { type: 'bool', value: true },
              then: { interpolated: false, type: 'str', value: 'yes' },
              type: 'if',
            },
            type: 'root',
          })
        );
      });
      it('if-then-else', () => {
        expect(parse('if true then "yes" else "no" end')).toEqual(
          progAst({
            expr: {
              cond: { type: 'bool', value: true },
              then: { interpolated: false, type: 'str', value: 'yes' },
              else: { interpolated: false, type: 'str', value: 'no' },
              type: 'if',
            },
            type: 'root',
          })
        );
      });
      it('if-then-elif-elif-else', () => {
        expect(
          parse(
            'if true then "yes" elif false then "never1" elif false then "never2" else "no" end'
          )
        ).toEqual(
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
        );
      });
    });
    describe('try', () => {
      it('try', () => {
        expect(parse('try error("ERROR!")')).toEqual(
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
        );
      });
      it('try-catch', () => {
        expect(parse('try error("ERROR!") catch .')).toEqual(
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
        );
      });
      it('short', () => {
        expect(parse('error("ERROR!")?')).toEqual(
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
        );
      });
    });
    it('label-break', () => {
      expect(parse('label $out | break $out')).toEqual(
        progAst({
          expr: {
            left: { type: 'label', value: '$out' },
            operator: '|',
            right: { type: 'break', value: '$out' },
            type: 'binary',
          },
          type: 'root',
        })
      );
    });
    it('reduce', () => {
      expect(parse('reduce .[] as $item (0; .+$item)')).toEqual(
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
      );
    });
    describe('foreach', () => {
      it('2 args', () => {
        expect(parse('foreach .[] as $item (0; .+$item)')).toEqual(
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
        );
      });
      it('3 args', () => {
        expect(parse('foreach .[] as $item (0; .+$item; .+1)')).toEqual(
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
        );
      });

      it('too few args', () => {
        expect(() =>
          parse('foreach .[] as $item (0)')
        ).toThrowErrorMatchingSnapshot('foreach too few args');
      });

      it('too many args', () => {
        expect(() =>
          parse('foreach .[] as $item (0; .+$item; .+1; .)')
        ).toThrowErrorMatchingSnapshot('foreach too many args');
      });
    });
  });

  describe('variables', () => {
    it('var', () => {
      expect(parse('$var')).toEqual(
        progAst({
          expr: { name: '$var', type: 'var' },
          type: 'root',
        })
      );
    });
    it('simple declaration', () => {
      expect(parse('. as $var | $var')).toEqual(
        progAst({
          expr: {
            next: { name: '$var', type: 'var' },
            destructuring: { type: 'var', name: '$var' },
            expr: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        })
      );
    });
    it('array destructuring', () => {
      expect(parse('[1,2,3] as [$a, $b, $c] | $a+$b+$c')).toEqual(
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
      );
    });
    describe('object destructuring', () => {
      it('str', () => {
        expect(parse('. as {"key": $a} | $a')).toEqual(
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
        );
      });
      it('ident', () => {
        expect(parse('. as {key: $a} | $a')).toEqual(
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
        );
      });
      it('expression', () => {
        expect(parse('. as {(1+2 | tostring): $a} | $a')).toEqual(
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
        );
      });
      it('abbreviated', () => {
        expect(parse('. as {$a} | $a')).toEqual(
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
        );
      });
      it('str interpolation', () => {
        expect(parse('. as {"\\(1)": $a} | $a')).toEqual(
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
        );
      });
    });
    it('nested', () => {
      expect(
        parse(
          '. as {a: {$a, arr: [$b, $c, {$d, "key": $e, "arr": [$f, $g]}]}} | $a'
        )
      ).toEqual(
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
      );
    });
    it('binary right', () => {
      expect(parse('. | (. as $var | $var)')).toEqual(
        progAst({
          expr: {
            left: { type: 'identity' },
            operator: '|',
            right: {
              destructuring: { name: '$var', type: 'var' },
              expr: { type: 'identity' },
              next: { name: '$var', type: 'var' },
              type: 'varDeclaration',
            },
            type: 'binary',
          },
          type: 'root',
        })
      );
    });
    it('binary left', () => {
      expect(parse('(. as $var | $var) | .')).toEqual(
        progAst({
          expr: {
            left: {
              destructuring: { name: '$var', type: 'var' },
              expr: { type: 'identity' },
              next: { name: '$var', type: 'var' },
              type: 'varDeclaration',
            },
            operator: '|',
            right: { type: 'identity' },
            type: 'binary',
          },
          type: 'root',
        })
      );
    });
  });
});
