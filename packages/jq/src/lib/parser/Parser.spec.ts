import { parse } from './Parser';
import { ProgAst } from './AST';
import { print } from '../print/print';

describe('parse', () => {
  describe('empty program', () => {
    testPrintAndParse('', { type: 'root' });
  });
  describe('index', () => {
    // TODO Add tests for nested and optional indexes
    describe('ident', () => {
      testPrintAndParse('.a', {
        expr: { expr: { type: 'identity' }, index: 'a', type: 'index' },
        type: 'root',
      });
    });
    describe('nested', () => {
      testPrintAndParse('.a.b[0].c', {
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
      });
    });
    describe('optional', () => {
      testPrintAndParse('.a?.b', {
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
      });
    });
    describe('str', () => {
      testPrintAndParse('.["$abc"]', '."$abc"', {
        expr: {
          expr: { type: 'identity' },
          index: { interpolated: false, type: 'str', value: '$abc' },
          type: 'index',
        },
        type: 'root',
      });
    });
    describe('num', () => {
      testPrintAndParse('.[1]', {
        expr: {
          expr: { type: 'identity' },
          index: { type: 'num', value: 1 },
          type: 'index',
        },
        type: 'root',
      });
    });
    describe('expression', () => {
      testPrintAndParse('.[1 + 3 * $var]', '.[1+3*$var]', {
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
      });
    });
    describe('slice', () => {
      describe('full', () => {
        testPrintAndParse('.[1 + 3 * $var:500]', '.[1+3*$var:500]', {
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
        });
      });
      describe('left', () => {
        testPrintAndParse('.[0:]', {
          expr: {
            expr: { type: 'identity' },
            from: { type: 'num', value: 0 },
            type: 'slice',
          },
          type: 'root',
        });
      });
      describe('right', () => {
        testPrintAndParse('.[:2]', {
          expr: {
            expr: { type: 'identity' },
            to: { type: 'num', value: 2 },
            type: 'slice',
          },
          type: 'root',
        });
      });
    });
    describe('iterator', () => {
      testPrintAndParse('.[]', {
        expr: { expr: { type: 'identity' }, type: 'iterator' },
        type: 'root',
      });
    });
  });
  describe('simple expressions', () => {
    describe('identity', () => {
      testPrintAndParse('.', { type: 'root', expr: { type: 'identity' } });
    });
    describe('recursiveDescent', () => {
      testPrintAndParse('..', {
        type: 'root',
        expr: { type: 'recursiveDescent' },
      });
    });
    describe('num', () => {
      testPrintAndParse('100', {
        type: 'root',
        expr: { type: 'num', value: 100 },
      });
    });
    describe('string', () => {
      testPrintAndParse('"my string"', {
        type: 'root',
        expr: { type: 'str', interpolated: false, value: 'my string' },
      });
    });
    describe('bool', () => {
      testPrintAndParse('false', {
        type: 'root',
        expr: { type: 'bool', value: false },
      });
    });
    describe('null', () => {
      testPrintAndParse('null', {
        type: 'root',
        expr: { type: 'null', value: null },
      });
    });
  });
  describe('def', () => {
    describe('simple', () => {
      testPrintAndParse('def func(a; $b): $b | a; .', {
        type: 'root',
        expr: {
          type: 'def',
          name: 'func/2',
          args: [
            { type: 'filterArg', name: 'a/0' },
            { type: 'varArg', name: '$b' },
          ],
          body: {
            type: 'binary',
            operator: '|',
            left: { type: 'var', name: '$b' },
            right: { type: 'filter', name: 'a/0', args: [] },
          },
          next: { type: 'identity' },
        },
      });
    });
    describe('inline', () => {
      testPrintAndParse(
        '1 + 2 + - (def test: .; def test(a): .; 1 + 4)',
        '1 + 2 + - def test: .; def test(a): .; 1 + 4',
        {
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
                name: 'test/0',
                next: {
                  args: [{ name: 'a/0', type: 'filterArg' }],
                  body: { type: 'identity' },
                  name: 'test/1',
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
        }
      );
    });
    describe('no next', () => {
      testPrintAndParse('def test: .;', {
        expr: {
          args: [],
          body: { type: 'identity' },
          name: 'test/0',
          type: 'def',
        },
        type: 'root',
      });
    });
  });

  it('wrong def delimiter', () => {
    expect(() =>
      parse('def func(a, $b): $b | a; .')
    ).toThrowErrorMatchingSnapshot();
  });

  describe('operators', () => {
    describe('unary', () => {
      describe('minus', () => {
        testPrintAndParse('-1', {
          expr: {
            expr: { type: 'num', value: 1 },
            operator: '-',
            type: 'unary',
          },
          type: 'root',
        });
      });
      describe('minus in addition', () => {
        testPrintAndParse('1 + -8', '1+-8', {
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
        });
      });
      describe('minus foreach', () => {
        testPrintAndParse(
          '- foreach .[] as $item (\n  0;\n  . + $item\n) | - .',
          '- foreach .[] as $item (0; . + $item) | - .',
          {
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
          }
        );
      });
    });
    describe('binary', () => {
      describe('addition', () => {
        testPrintAndParse('1 + 2 + 3 + 4', '1+2+3+4', {
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
        });
      });
      describe('normalization', () => {
        it('parse', () => {
          expectParse('1+(2+(3+4))', {
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
          });
        });
        testPrintAndParse('1 + 2 + 3 + 4', {
          expr: {
            left: { type: 'num', value: 1 },
            operator: '+',
            right: {
              left: { type: 'num', value: 2 },
              operator: '+',
              right: {
                left: { type: 'num', value: 3 },
                operator: '+',
                right: { type: 'num', value: 4 },
                type: 'binary',
              },
              type: 'binary',
            },
            type: 'binary',
          },
          type: 'root',
        });
      });
      describe('addition vs multiplication', () => {
        testPrintAndParse('1 + 2 * 5 + 3', '1+2*5+3', {
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
        });
      });
      describe('addition vs multiplication with brackets', () => {
        testPrintAndParse('(1 + 2) * (5 + 3)', '(1+2)*(5+3)', {
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
        });
      });
      describe('pipe and comma', () => {
        testPrintAndParse('a, b | c, d', 'a , b | c , d', {
          expr: {
            left: {
              left: { args: [], name: 'a/0', type: 'filter' },
              operator: ',',
              right: { args: [], name: 'b/0', type: 'filter' },
              type: 'binary',
            },
            operator: '|',
            right: {
              left: { args: [], name: 'c/0', type: 'filter' },
              operator: ',',
              right: { args: [], name: 'd/0', type: 'filter' },
              type: 'binary',
            },
            type: 'binary',
          },
          type: 'root',
        });
      });
      describe('pipe and comma with brackets', () => {
        testPrintAndParse('a, (b | c), d', 'a , (b | c) , d', {
          expr: {
            left: {
              left: { args: [], name: 'a/0', type: 'filter' },
              operator: ',',
              right: {
                left: { args: [], name: 'b/0', type: 'filter' },
                operator: '|',
                right: { args: [], name: 'c/0', type: 'filter' },
                type: 'binary',
              },
              type: 'binary',
            },
            operator: ',',
            right: { args: [], name: 'd/0', type: 'filter' },
            type: 'binary',
          },
          type: 'root',
        });
      });
      describe('print var', () => {
        it('right', () => {
          expectPrint('. | (. as $var | $var)');
        });
        it('left', () => {
          expectPrint('(. as $var | $var) | .');
        });
      });
      describe('print def', () => {
        it('right', () => {
          expectPrint('. | (def f: .; .)');
        });
        it('left', () => {
          expectPrint('(def f: .; .) | .');
        });
      });
    });
    describe('bool', () => {
      testPrintAndParse('false and true or true and false | not', {
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
          right: { args: [], name: 'not/0', type: 'filter' },
          type: 'binary',
        },
        type: 'root',
      });
    });
  });
  describe('array', () => {
    describe('array', () => {
      testPrintAndParse('[1, 2, 3]', '[1,2,3]', {
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
      });
    });
    describe('empty', () => {
      testPrintAndParse('[]', {
        expr: {
          type: 'array',
        },
        type: 'root',
      });
    });
  });
  describe('object', () => {
    describe('object', () => {
      testPrintAndParse(
        '{\n  a: 1,\n  "$a": 2,\n  "@a": 3,\n  "1": 4,\n  ($var): 5,\n  "\\($var):\\($var)": 6,\n}',
        '{a: 1, "$a": 2, "@a": 3, "1": 4, ($var): 5, "\\($var):\\($var)": 6}',
        {
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
        }
      );
    });
    describe('object - keywords', () => {
      testPrintAndParse(
        '{\n  label: 1,\n  try: 2,\n  catch: 3,\n}',
        '{label: 1, try: 2, catch: 3}',
        {
          expr: {
            entries: [
              { key: 'label', value: { type: 'num', value: 1 } },
              { key: 'try', value: { type: 'num', value: 2 } },
              { key: 'catch', value: { type: 'num', value: 3 } },
            ],
            type: 'object',
          },
          type: 'root',
        }
      );
    });
    describe('trailing comma', () => {
      testPrintAndParse('{\n  a: 1,\n  b: 2,\n}', '{a: 1, b: 2, }', {
        expr: {
          entries: [
            { key: 'a', value: { type: 'num', value: 1 } },
            { key: 'b', value: { type: 'num', value: 2 } },
          ],
          type: 'object',
        },
        type: 'root',
      });
    });
    describe('nested', () => {
      testPrintAndParse(
        '{\n  a: 1,\n  b: 2,\n  c: {\n    a: 1,\n    b: 2,\n  },\n}',
        {
          expr: {
            entries: [
              { key: 'a', value: { type: 'num', value: 1 } },
              { key: 'b', value: { type: 'num', value: 2 } },
              {
                key: 'c',
                value: {
                  entries: [
                    { key: 'a', value: { type: 'num', value: 1 } },
                    { key: 'b', value: { type: 'num', value: 2 } },
                  ],
                  type: 'object',
                },
              },
            ],
            type: 'object',
          },
          type: 'root',
        }
      );
    });
    describe('copy value', () => {
      testPrintAndParse('{\n  a,\n  b,\n  c: 1,\n}', '{a, b, c: 1 }', {
        expr: {
          entries: [
            { key: 'a' },
            { key: 'b' },
            { key: 'c', value: { type: 'num', value: 1 } },
          ],
          type: 'object',
        },
        type: 'root',
      });
    });
  });

  describe('interpolation', () => {
    testPrintAndParse('"\\(.):\\(.)"', {
      expr: {
        interpolated: true,
        parts: [{ type: 'identity' }, ':', { type: 'identity' }],
        type: 'str',
      },
      type: 'root',
    });
  });
  describe('format', () => {
    describe('as filter', () => {
      testPrintAndParse('"Hello World!" | @base64', {
        expr: {
          left: { interpolated: false, type: 'str', value: 'Hello World!' },
          operator: '|',
          right: { name: '@base64', type: 'format' },
          type: 'binary',
        },
        type: 'root',
      });
    });
    describe('str', () => {
      testPrintAndParse('@base64 "abc"', {
        expr: {
          format: { name: '@base64', type: 'format' },
          interpolated: false,
          type: 'str',
          value: 'abc',
        },
        type: 'root',
      });
    });
    describe('str with interpolation', () => {
      testPrintAndParse('@base64 "---\\("Hello World!")---"', {
        expr: {
          format: { name: '@base64', type: 'format' },
          interpolated: true,
          parts: [
            '---',
            { interpolated: false, type: 'str', value: 'Hello World!' },
            '---',
          ],
          type: 'str',
        },
        type: 'root',
      });
    });
  });
  describe('filter', () => {
    describe('without args', () => {
      testPrintAndParse('length', {
        expr: { args: [], name: 'length/0', type: 'filter' },
        type: 'root',
      });
    });
    describe('with one arg', () => {
      testPrintAndParse('map(. + 1)', 'map(.+1)', {
        expr: {
          args: [
            {
              left: { type: 'identity' },
              operator: '+',
              right: { type: 'num', value: 1 },
              type: 'binary',
            },
          ],
          name: 'map/1',
          type: 'filter',
        },
        type: 'root',
      });
    });
    describe('with multiple args', () => {
      testPrintAndParse('[range(0;10;3)]', {
        expr: {
          expr: {
            args: [
              { type: 'num', value: 0 },
              { type: 'num', value: 10 },
              { type: 'num', value: 3 },
            ],
            name: 'range/3',
            type: 'filter',
          },
          type: 'array',
        },
        type: 'root',
      });
    });
  });

  describe('control structures', () => {
    describe('if', () => {
      describe('if-then', () => {
        testPrintAndParse(
          'if true\n  then "yes"\nend',
          'if true then "yes" end',
          {
            expr: {
              cond: { type: 'bool', value: true },
              then: { interpolated: false, type: 'str', value: 'yes' },
              type: 'if',
            },
            type: 'root',
          }
        );
      });
      describe('if-then-else', () => {
        testPrintAndParse(
          'if true\n  then "yes"\n  else "no"\nend',
          'if true then "yes" else "no" end',
          {
            expr: {
              cond: { type: 'bool', value: true },
              then: { interpolated: false, type: 'str', value: 'yes' },
              else: { interpolated: false, type: 'str', value: 'no' },
              type: 'if',
            },
            type: 'root',
          }
        );
      });
      describe('if-then-elif-elif-else', () => {
        testPrintAndParse(
          'if true\n  then "yes"\n  elif false\n    then "never1"\n  elif false\n    then "never2"\n  else "no"\nend',
          'if true then "yes" elif false then "never1" elif false then "never2" else "no" end',
          {
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
          }
        );
      });
    });
    describe('try', () => {
      describe('try', () => {
        testPrintAndParse('try error("ERROR!")', {
          expr: {
            body: {
              args: [{ interpolated: false, type: 'str', value: 'ERROR!' }],
              name: 'error/1',
              type: 'filter',
            },
            short: false,
            type: 'try',
          },
          type: 'root',
        });
      });
      describe('try-catch', () => {
        testPrintAndParse('try error("ERROR!") catch .', {
          expr: {
            body: {
              args: [{ interpolated: false, type: 'str', value: 'ERROR!' }],
              name: 'error/1',
              type: 'filter',
            },
            catch: { type: 'identity' },
            short: false,
            type: 'try',
          },
          type: 'root',
        });
      });
      describe('short', () => {
        testPrintAndParse('error("ERROR!")?', {
          expr: {
            body: {
              args: [{ interpolated: false, type: 'str', value: 'ERROR!' }],
              name: 'error/1',
              type: 'filter',
            },
            short: true,
            type: 'try',
          },
          type: 'root',
        });
      });
    });
    describe('label-break', () => {
      describe('simple', () => {
        testPrintAndParse('label $out | break $out', {
          expr: {
            type: 'label',
            value: '$out',
            next: { type: 'break', value: '$out' },
          },
          type: 'root',
        });
      });
      it('expect next', () => {
        expect(() => parse('label $out')).toThrowErrorMatchingSnapshot();
      });
    });
    describe('reduce', () => {
      testPrintAndParse(
        'reduce .[] as $item (\n  0;\n  . + $item\n)',
        'reduce .[] as $item (0; .+$item)',
        {
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
        }
      );
    });
    describe('foreach', () => {
      describe('2 args', () => {
        testPrintAndParse(
          'foreach .[] as $item (\n  0;\n  . + $item\n)',
          'foreach .[] as $item (0; .+$item)',
          {
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
          }
        );
      });
      describe('3 args', () => {
        testPrintAndParse(
          'foreach .[] as $item (\n  0;\n  . + $item;\n  . + 1\n)',
          'foreach .[] as $item (0; .+$item; .+1)',
          {
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
          }
        );
      });

      it('too few args', () => {
        expect(() =>
          parse('foreach .[] as $item (0)')
        ).toThrowErrorMatchingSnapshot();
      });

      it('too many args', () => {
        expect(() =>
          parse('foreach .[] as $item (0; .+$item; .+1; .)')
        ).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('variables', () => {
    describe('var', () => {
      testPrintAndParse('$var', {
        expr: { name: '$var', type: 'var' },
        type: 'root',
      });
    });
    describe('simple declaration', () => {
      testPrintAndParse('. as $var | $var', {
        expr: {
          next: { name: '$var', type: 'var' },
          destructuring: [{ type: 'var', name: '$var' }],
          expr: { type: 'identity' },
          type: 'varDeclaration',
        },
        type: 'root',
      });
    });
    describe('control structure', () => {
      testPrintAndParse(
        '(if true\n  then true\n  else false\nend) as $var | .',
        {
          expr: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: {
              cond: { type: 'bool', value: true },
              else: { type: 'bool', value: false },
              then: { type: 'bool', value: true },
              type: 'if',
            },
            next: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        }
      );
    });
    it('expect pipe', () => {
      expect(() => parse('. as $var')).toThrowErrorMatchingSnapshot();
    });
    it('atoms only', () => {
      expect(() =>
        parse('if true then true else false end as $var | .')
      ).toThrowErrorMatchingSnapshot();
    });

    describe('scopes', () => {
      describe('override', () => {
        testPrintAndParse('1 as $var | 2 as $var | $var', {
          expr: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: { type: 'num', value: 1 },
            next: {
              destructuring: [{ name: '$var', type: 'var' }],
              expr: { type: 'num', value: 2 },
              next: { name: '$var', type: 'var' },
              type: 'varDeclaration',
            },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
      describe('exit scope', () => {
        testPrintAndParse('1 as $var | (2 as $var | $var) | $var', {
          expr: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: { type: 'num', value: 1 },
            next: {
              left: {
                destructuring: [{ name: '$var', type: 'var' }],
                expr: { type: 'num', value: 2 },
                next: { name: '$var', type: 'var' },
                type: 'varDeclaration',
              },
              operator: '|',
              right: { name: '$var', type: 'var' },
              type: 'binary',
            },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
      describe('pipe in inner scope', () => {
        testPrintAndParse('1 as $var | 2 as $var | $var | $var', {
          expr: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: { type: 'num', value: 1 },
            next: {
              destructuring: [{ name: '$var', type: 'var' }],
              expr: { type: 'num', value: 2 },
              next: {
                left: { name: '$var', type: 'var' },
                operator: '|',
                right: { name: '$var', type: 'var' },
                type: 'binary',
              },
              type: 'varDeclaration',
            },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
    });
    describe('precedence', () => {
      describe('around declaration', () => {
        testPrintAndParse('. * (1 as $var | .)', {
          expr: {
            left: { type: 'identity' },
            operator: '*',
            right: {
              destructuring: [{ name: '$var', type: 'var' }],
              expr: { type: 'num', value: 1 },
              next: { type: 'identity' },
              type: 'varDeclaration',
            },
            type: 'binary',
          },
          type: 'root',
        });
      });
      describe('around value', () => {
        testPrintAndParse('(. * 1) as $var | .', {
          expr: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: {
              left: { type: 'identity' },
              operator: '*',
              right: { type: 'num', value: 1 },
              type: 'binary',
            },
            next: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
      it('times', () => {
        expectParse('.*1 as $var|.', '.*(1 as $var|.)');
      });
      it('pipe', () => {
        expectParse('.|1 as $var|.', '.|(1 as $var|.)');
      });
      it('minus', () => {
        expectParse('-1 as $var|.', '-(1 as $var|.)');
      });
    });
    describe('array destructuring', () => {
      testPrintAndParse(
        '[1, 2, 3] as [ $a, $b, $c ] | $a + $b + $c',
        '[1,2,3] as [$a, $b, $c] | $a+$b+$c',
        {
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
            destructuring: [
              {
                destructuring: [
                  { name: '$a', type: 'var' },
                  { name: '$b', type: 'var' },
                  { name: '$c', type: 'var' },
                ],
                type: 'arrayDestructuring',
              },
            ],
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
        }
      );
    });
    describe('object destructuring', () => {
      describe('str', () => {
        testPrintAndParse('. as { "key": $a } | $a', '. as {"key": $a} | $a', {
          expr: {
            next: { name: '$a', type: 'var' },
            destructuring: [
              {
                entries: [
                  {
                    destructuring: { name: '$a', type: 'var' },
                    key: { interpolated: false, type: 'str', value: 'key' },
                  },
                ],
                type: 'objectDestructuring',
              },
            ],
            expr: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
      describe('ident', () => {
        testPrintAndParse('. as { key: $a } | $a', '. as {key: $a} | $a', {
          expr: {
            next: { name: '$a', type: 'var' },
            destructuring: [
              {
                entries: [
                  { destructuring: { name: '$a', type: 'var' }, key: 'key' },
                ],
                type: 'objectDestructuring',
              },
            ],
            expr: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
      describe('expression', () => {
        testPrintAndParse(
          '. as { (1 + 2 | tostring): $a } | $a',
          '. as {(1+2 | tostring): $a} | $a',
          {
            expr: {
              next: { name: '$a', type: 'var' },
              destructuring: [
                {
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
                        right: { args: [], name: 'tostring/0', type: 'filter' },
                        type: 'binary',
                      },
                    },
                  ],
                  type: 'objectDestructuring',
                },
              ],
              expr: { type: 'identity' },
              type: 'varDeclaration',
            },
            type: 'root',
          }
        );
      });
      describe('abbreviated', () => {
        testPrintAndParse('. as { $a } | $a', '. as {$a} | $a', {
          expr: {
            next: { name: '$a', type: 'var' },
            destructuring: [
              {
                entries: [{ key: { name: '$a', type: 'var' } }],
                type: 'objectDestructuring',
              },
            ],
            expr: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        });
      });
      describe('str interpolation', () => {
        testPrintAndParse(
          '. as { "\\(1)": $a } | $a',
          '. as {"\\(1)": $a} | $a',
          {
            expr: {
              next: { name: '$a', type: 'var' },
              destructuring: [
                {
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
              ],
              expr: { type: 'identity' },
              type: 'varDeclaration',
            },
            type: 'root',
          }
        );
      });
    });
    describe('nested', () => {
      testPrintAndParse(
        '. as { a: { $a, arr: [ $b, $c, { $d, "key": $e, "arr": [ $f, $g ] } ] } } | $a',
        '. as {a: {$a, arr: [$b, $c, {$d, "key": $e, "arr": [$f, $g]}]}} | $a',
        {
          expr: {
            next: { name: '$a', type: 'var' },
            destructuring: [
              {
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
            ],
            expr: { type: 'identity' },
            type: 'varDeclaration',
          },
          type: 'root',
        }
      );
    });
    describe('binary right', () => {
      testPrintAndParse('. | (. as $var | $var)', {
        expr: {
          left: { type: 'identity' },
          operator: '|',
          right: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: { type: 'identity' },
            next: { name: '$var', type: 'var' },
            type: 'varDeclaration',
          },
          type: 'binary',
        },
        type: 'root',
      });
    });
    describe('binary left', () => {
      testPrintAndParse('(. as $var | $var) | .', {
        expr: {
          left: {
            destructuring: [{ name: '$var', type: 'var' }],
            expr: { type: 'identity' },
            next: { name: '$var', type: 'var' },
            type: 'varDeclaration',
          },
          operator: '|',
          right: { type: 'identity' },
          type: 'binary',
        },
        type: 'root',
      });
    });
    describe('destructuring alternative operator', () => {
      testPrintAndParse(
        '. as { $a } ?// [ $a ] ?// $a | $a',
        '. as {$a} ?// [$a] ?// $a | $a',
        {
          expr: {
            destructuring: [
              {
                entries: [{ key: { name: '$a', type: 'var' } }],
                type: 'objectDestructuring',
              },
              {
                destructuring: [{ name: '$a', type: 'var' }],
                type: 'arrayDestructuring',
              },
              { name: '$a', type: 'var' },
            ],
            expr: { type: 'identity' },
            next: { name: '$a', type: 'var' },
            type: 'varDeclaration',
          },
          type: 'root',
        }
      );
    });
  });
});

function progAst(ast: ProgAst) {
  return ast;
}

function expectPrint(code: string, ast?: ProgAst) {
  if (ast) {
    expect(print(progAst(ast))).toEqual(code);
  } else {
    expect(parse(print(parse(code)))).toEqual(parse(code));
  }
}

function expectParse(code: string, ast: ProgAst): void;
function expectParse(code1: string, code2: string): void;
function expectParse(a: string, b: ProgAst | string): void {
  expect(parse(a)).toEqual(typeof b === 'string' ? parse(b) : progAst(b));
}

function testPrintAndParse(formatted: string, code: string, ast: ProgAst): void;
function testPrintAndParse(formatted: string, ast: ProgAst): void;
function testPrintAndParse(
  formatted: string,
  b: string | ProgAst,
  c?: ProgAst
): void {
  let ast: ProgAst;
  if (typeof b === 'string') {
    const unformatted = b;
    if (c === undefined) throw new Error('testPrintAndParse: ast is undefined');
    ast = c;
    describe('parse', () => {
      it('formatted', () => {
        expectParse(formatted, ast);
      });
      it('unformatted', () => {
        expectParse(unformatted, ast);
      });
    });
  } else {
    ast = b;
    it('parse', () => {
      expectParse(formatted, ast);
    });
  }

  it('print', () => {
    expectPrint(formatted, ast);
  });
}
