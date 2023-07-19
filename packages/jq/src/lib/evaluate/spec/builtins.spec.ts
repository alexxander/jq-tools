import {
  expectCode,
  expectCodeError,
  testCode,
  testCodeError,
} from './specUtils.spec';

describe('builtins', () => {
  describe('native', () => {
    // describe('acos/0', () => {
    //   it('acos/0', () => {
    //     throw notImplementedError('acos/0');
    //   });
    // });
    // describe('acosh/0', () => {
    //   it('acosh/0', () => {
    //     throw notImplementedError('acosh/0');
    //   });
    // });
    // describe('asin/0', () => {
    //   it('asin/0', () => {
    //     throw notImplementedError('asin/0');
    //   });
    // });
    // describe('asinh/0', () => {
    //   it('asinh/0', () => {
    //     throw notImplementedError('asinh/0');
    //   });
    // });
    // describe('atan/0', () => {
    //   it('atan/0', () => {
    //     throw notImplementedError('atan/0');
    //   });
    // });
    // describe('atan2/2', () => {
    //   it('atan2/2', () => {
    //     throw notImplementedError('atan2/2');
    //   });
    // });
    // describe('atanh/0', () => {
    //   it('atanh/0', () => {
    //     throw notImplementedError('atanh/0');
    //   });
    // });
    // describe('builtins/0', () => {
    //   it('builtins/0', () => {
    //     throw notImplementedError('builtins/0');
    //   });
    // });
    // describe('cbrt/0', () => {
    //   it('cbrt/0', () => {
    //     throw notImplementedError('cbrt/0');
    //   });
    // });
    // describe('ceil/0', () => {
    //   it('ceil/0', () => {
    //     throw notImplementedError('ceil/0');
    //   });
    // });
    // describe('contains/1', () => {
    //   it('contains/1', () => {
    //     throw notImplementedError('contains/1');
    //   });
    // });
    // describe('copysign/2', () => {
    //   it('copysign/2', () => {
    //     throw notImplementedError('copysign/2');
    //   });
    // });
    // describe('cos/0', () => {
    //   it('cos/0', () => {
    //     throw notImplementedError('cos/0');
    //   });
    // });
    // describe('cosh/0', () => {
    //   it('cosh/0', () => {
    //     throw notImplementedError('cosh/0');
    //   });
    // });
    // describe('debug/0', () => {
    //   it('debug/0', () => {
    //     throw notImplementedError('debug/0');
    //   });
    // });
    describe('delpaths/1', () => {
      it('simple', () => {
        expectCode('{a:1, b:2, c:3} | delpaths([["a"]])', [{ b: 2, c: 3 }]);
      });
      it('two paths', () => {
        expectCode('{a:1, b:2, c:3} | delpaths([["a"], ["b"]])', [{ c: 3 }]);
      });
      it('array', () => {
        expectCode('[0,1,2,3,4,5] | delpaths([[3], [4]])', [[0, 1, 2, 5]]);
      });
      describe('slice', () => {
        it('simple', () => {
          expectCode('[0,1,2,3,4,5] | delpaths([[{start:1, end: 4}]])', [
            [0, 4, 5],
          ]);
        });
        describe('nested slice', () => {
          it('smaller', () => {
            expectCode(
              '[0,1,2,3,4,5,6,7,8,9,10] | delpaths([[{start:1,end:7}, {start:1,end:3}]])',
              [[0, 1, 4, 5, 6, 7, 8, 9, 10]]
            );
          });
          it('larger', () => {
            expectCode(
              '[0,1,2,3,4,5,6,7,8,9,10] | delpaths([[{start:1,end:7}, {start:1,end:10}]])',
              [[0, 1, 7, 8, 9, 10]]
            );
          });
        });
        it('nested indexes', () => {
          expectCode(
            '[0,1,2,3,4,5] | delpaths([[{start:1, end: 4}, 0], [{start:1, end: 4}, 2]])',
            [[0, 2, 4, 5]]
          );
        });
      });
      it('deep', () => {
        expectCode(
          '{a:{b:{c:[5, {d:1, e:2}]}}, f:3, g:4} | delpaths([["a","b","c", 1,"d"]])',
          [{ a: { b: { c: [5, { e: 2 }] } }, f: 3, g: 4 }]
        );
      });
      it('nested', () => {
        expectCode('{x:{y:"keep",z:"remove"}} | .x | delpaths([["z"]])', [
          { y: 'keep' },
        ]);
      });
      it('nonexistent path', () => {
        expectCode('{a:1, b:2, c:3} | delpaths([["x", "y", "z"], ["xx"]])', [
          { a: 1, b: 2, c: 3 },
        ]);
      });
      it('invalid arg', () => {
        expectCodeError('{a:1} | delpaths({})');
        expectCodeError('{a:1} | delpaths([{}])');
        expectCodeError('{a:1} | delpaths([[{}]])');
        expectCodeError('{a:1} | delpaths([[1], {}])');
      });
      describe('cannot index', () => {
        testCodeError('1 | delpaths([[""]])');
        testCodeError('1 | delpaths([[0]])');
        testCodeError('[] | delpaths([[""]])');
        testCodeError('{} | delpaths([[0]])');
        testCodeError('{a:1} | delpaths([["a", 0]])');
      });
    });
    // describe('drem/2', () => {
    //   it('drem/2', () => {
    //     throw notImplementedError('drem/2');
    //   });
    // });
    describe('empty/0', () => {
      it('empty input', () => {
        expectCode('[][] | empty', []);
      });
      it('non-empty input', () => {
        expectCode('1,2,3,4,5 | empty', []);
      });
    });
    describe('endswith/1', () => {
      it('simple', () => {
        expectCode('"defgabc", "abxxx", "" | endswith("abc")', [
          true,
          false,
          false,
        ]);
      });
      describe('error', () => {
        it('input', () => {
          expectCodeError('null | endswith("abc")');
          expectCodeError('false | endswith("abc")');
          expectCodeError('0 | endswith("abc")');
          expectCodeError('[] | endswith("abc")');
          expectCodeError('{} | endswith("abc")');
        });
        it('arg', () => {
          expectCodeError('"abc" | endswith(null)');
          expectCodeError('"abc" | endswith(false)');
          expectCodeError('"abc" | endswith(0)');
          expectCodeError('"abc" | endswith([])');
          expectCodeError('"abc" | endswith({})');
        });
      });
    });
    // describe('env/0', () => {
    //   it('env/0', () => {
    //     throw notImplementedError('env/0');
    //   });
    // });
    // describe('erf/0', () => {
    //   it('erf/0', () => {
    //     throw notImplementedError('erf/0');
    //   });
    // });
    // describe('erfc/0', () => {
    //   it('erfc/0', () => {
    //     throw notImplementedError('erfc/0');
    //   });
    // });
    // describe('error/0', () => {
    //   it('error/0', () => {
    //     throw notImplementedError('error/0');
    //   });
    // });
    // describe('exp/0', () => {
    //   it('exp/0', () => {
    //     throw notImplementedError('exp/0');
    //   });
    // });
    // describe('exp10/0', () => {
    //   it('exp10/0', () => {
    //     throw notImplementedError('exp10/0');
    //   });
    // });
    // describe('exp2/0', () => {
    //   it('exp2/0', () => {
    //     throw notImplementedError('exp2/0');
    //   });
    // });
    // describe('explode/0', () => {
    //   it('explode/0', () => {
    //     throw notImplementedError('explode/0');
    //   });
    // });
    // describe('expm1/0', () => {
    //   it('expm1/0', () => {
    //     throw notImplementedError('expm1/0');
    //   });
    // });
    // describe('fabs/0', () => {
    //   it('fabs/0', () => {
    //     throw notImplementedError('fabs/0');
    //   });
    // });
    // describe('fdim/2', () => {
    //   it('fdim/2', () => {
    //     throw notImplementedError('fdim/2');
    //   });
    // });
    // describe('floor/0', () => {
    //   it('floor/0', () => {
    //     throw notImplementedError('floor/0');
    //   });
    // });
    // describe('fma/3', () => {
    //   it('fma/3', () => {
    //     throw notImplementedError('fma/3');
    //   });
    // });
    // describe('fmax/2', () => {
    //   it('fmax/2', () => {
    //     throw notImplementedError('fmax/2');
    //   });
    // });
    // describe('fmin/2', () => {
    //   it('fmin/2', () => {
    //     throw notImplementedError('fmin/2');
    //   });
    // });
    // describe('fmod/2', () => {
    //   it('fmod/2', () => {
    //     throw notImplementedError('fmod/2');
    //   });
    // });
    // describe('format/1', () => {
    //   it('format/1', () => {
    //     throw notImplementedError('format/1');
    //   });
    // });
    // describe('frexp/0', () => {
    //   it('frexp/0', () => {
    //     throw notImplementedError('frexp/0');
    //   });
    // });
    // describe('fromjson/0', () => {
    //   it('fromjson/0', () => {
    //     throw notImplementedError('fromjson/0');
    //   });
    // });
    // describe('gamma/0', () => {
    //   it('gamma/0', () => {
    //     throw notImplementedError('gamma/0');
    //   });
    // });
    // describe('get_jq_origin/0', () => {
    //   it('get_jq_origin/0', () => {
    //     throw notImplementedError('get_jq_origin/0');
    //   });
    // });
    // describe('get_prog_origin/0', () => {
    //   it('get_prog_origin/0', () => {
    //     throw notImplementedError('get_prog_origin/0');
    //   });
    // });
    // describe('get_search_list/0', () => {
    //   it('get_search_list/0', () => {
    //     throw notImplementedError('get_search_list/0');
    //   });
    // });
    // describe('getpath/1', () => {
    //   it('getpath/1', () => {
    //     throw notImplementedError('getpath/1');
    //   });
    // });
    // describe('gmtime/0', () => {
    //   it('gmtime/0', () => {
    //     throw notImplementedError('gmtime/0');
    //   });
    // });
    // describe('halt/0', () => {
    //   it('halt/0', () => {
    //     throw notImplementedError('halt/0');
    //   });
    // });
    // describe('halt_error/1', () => {
    //   it('halt_error/1', () => {
    //     throw notImplementedError('halt_error/1');
    //   });
    // });
    describe('has/1', () => {
      describe('array', () => {
        testCode('[0,1,2,3,4] | has(3)', [true]);
        testCode('[0,1,2] | has(3)', [false]);
        testCode('[0,1,2] | has(-1,0,1,2,3,4,5)', [
          false,
          true,
          true,
          true,
          false,
          false,
          false,
        ]);
      });
      describe('object', () => {
        testCode('{a:1, b:2, c:3} | has("a")', [true]);
        testCode('{a:1, b:2, c:3} | has("x")', [false]);
        testCode('{a:1, b:2, c:3} | has("A", "a", "b", "c", "x", "y", "z")', [
          false,
          true,
          true,
          true,
          false,
          false,
          false,
        ]);
      });
      describe('error', () => {
        testCodeError('0 | has(0)');
        testCodeError('"" | has(0)');
        testCodeError('[] | has("")');
        testCodeError('{} | has(0)');
        testCodeError('[] | has([])');
      });
    });
    // describe('hypot/2', () => {
    //   it('hypot/2', () => {
    //     throw notImplementedError('hypot/2');
    //   });
    // });
    // describe('implode/0', () => {
    //   it('implode/0', () => {
    //     throw notImplementedError('implode/0');
    //   });
    // });
    // describe('infinite/0', () => {
    //   it('infinite/0', () => {
    //     throw notImplementedError('infinite/0');
    //   });
    // });
    // describe('input/0', () => {
    //   it('input/0', () => {
    //     throw notImplementedError('input/0');
    //   });
    // });
    // describe('input_filename/0', () => {
    //   it('input_filename/0', () => {
    //     throw notImplementedError('input_filename/0');
    //   });
    // });
    // describe('input_line_number/0', () => {
    //   it('input_line_number/0', () => {
    //     throw notImplementedError('input_line_number/0');
    //   });
    // });
    // describe('isinfinite/0', () => {
    //   it('isinfinite/0', () => {
    //     throw notImplementedError('isinfinite/0');
    //   });
    // });
    // describe('isnan/0', () => {
    //   it('isnan/0', () => {
    //     throw notImplementedError('isnan/0');
    //   });
    // });
    // describe('isnormal/0', () => {
    //   it('isnormal/0', () => {
    //     throw notImplementedError('isnormal/0');
    //   });
    // });
    // describe('j0/0', () => {
    //   it('j0/0', () => {
    //     throw notImplementedError('j0/0');
    //   });
    // });
    // describe('j1/0', () => {
    //   it('j1/0', () => {
    //     throw notImplementedError('j1/0');
    //   });
    // });
    // describe('jn/2', () => {
    //   it('jn/2', () => {
    //     throw notImplementedError('jn/2');
    //   });
    // });
    describe('keys/0', () => {
      describe('array', () => {
        it('[]', () => {
          expectCode('[] | keys', [[]]);
        });
        it('[10,"",{},11,12,5,8]', () => {
          expectCode('[10,"",{},11,12,5,8] | keys', [[0, 1, 2, 3, 4, 5, 6]]);
        });
      });
      describe('object', () => {
        it('{}', () => {
          expectCode('{} | keys', [[]]);
        });
        it('{"-1":1,"0":1,"1":1,abc:1, ab:1, aa:1, d:1, c:1, b:1, a:1} | keys', () => {
          expectCode(
            '{"-1":1,"0":1,"1":1,abc:1, ab:1, aa:1, d:1, c:1, b:1, a:1} | keys',
            [['-1', '0', '1', 'a', 'aa', 'ab', 'abc', 'b', 'c', 'd']]
          );
        });
      });
      describe('error', () => {
        testCodeError('null | keys');
        testCodeError('false | keys');
        testCodeError('0 | keys');
        testCodeError('"" | keys');
      });
    });
    describe('keys_unsorted/0', () => {
      describe('array', () => {
        it('[]', () => {
          expectCode('[] | keys_unsorted', [[]]);
        });
        it('[10,"",{},11,12,5,8]', () => {
          expectCode('[10,"",{},11,12,5,8] | keys_unsorted', [
            [0, 1, 2, 3, 4, 5, 6],
          ]);
        });
      });
      describe('object', () => {
        it('{}', () => {
          expectCode('{} | keys_unsorted', [[]]);
        });
        it('{"-1":1,"0":1,"1":1,abc:1, ab:1, aa:1, d:1, c:1, b:1, a:1} | keys_unsorted', () => {
          // NOTE: This slightly differs from the original jq implementation (as this library relies on the js object
          // implementation, in which positive integer keys do not have to be stored in insertion order)
          expectCode(
            '{"-1":1,"0":1,"1":1,abc:1, ab:1, aa:1, d:1, c:1, b:1, a:1} | keys_unsorted',
            [['0', '1', '-1', 'abc', 'ab', 'aa', 'd', 'c', 'b', 'a']]
          );
        });
      });
      describe('error', () => {
        testCodeError('null | keys_unsorted');
        testCodeError('false | keys_unsorted');
        testCodeError('0 | keys_unsorted');
        testCodeError('"" | keys_unsorted');
      });
    });
    // describe('ldexp/2', () => {
    //   it('ldexp/2', () => {
    //     throw notImplementedError('ldexp/2');
    //   });
    // });
    describe('length/0', () => {
      it('null', () => {
        expectCode('null | length', [0]);
      });
      it('boolean', () => {
        expectCodeError('true | length');
      });
      it('number', () => {
        expectCodeError('5 | length');
      });
      it('string', () => {
        expectCode('"abc" | length', [3]);
      });
      it('array', () => {
        expectCode('[1,2,3,4,5] | length', [5]);
      });
      it('object', () => {
        expectCode('{"a": 1, "b": 2} | length', [2]);
      });
      it('multi', () => {
        expectCode(
          '"abcdef", [1,2,3], {"a": 1, "b": 2, "c": 3}, "", [], {} | length',
          [6, 3, 3, 0, 0, 0]
        );
      });
    });
    // describe('lgamma/0', () => {
    //   it('lgamma/0', () => {
    //     throw notImplementedError('lgamma/0');
    //   });
    // });
    // describe('lgamma_r/0', () => {
    //   it('lgamma_r/0', () => {
    //     throw notImplementedError('lgamma_r/0');
    //   });
    // });
    // describe('localtime/0', () => {
    //   it('localtime/0', () => {
    //     throw notImplementedError('localtime/0');
    //   });
    // });
    // describe('log/0', () => {
    //   it('log/0', () => {
    //     throw notImplementedError('log/0');
    //   });
    // });
    // describe('log10/0', () => {
    //   it('log10/0', () => {
    //     throw notImplementedError('log10/0');
    //   });
    // });
    // describe('log1p/0', () => {
    //   it('log1p/0', () => {
    //     throw notImplementedError('log1p/0');
    //   });
    // });
    // describe('log2/0', () => {
    //   it('log2/0', () => {
    //     throw notImplementedError('log2/0');
    //   });
    // });
    // describe('logb/0', () => {
    //   it('logb/0', () => {
    //     throw notImplementedError('logb/0');
    //   });
    // });
    // describe('ltrimstr/1', () => {
    //   it('ltrimstr/1', () => {
    //     throw notImplementedError('ltrimstr/1');
    //   });
    // });
    // describe('max/0', () => {
    //   it('max/0', () => {
    //     throw notImplementedError('max/0');
    //   });
    // });
    // describe('min/0', () => {
    //   it('min/0', () => {
    //     throw notImplementedError('min/0');
    //   });
    // });
    // describe('mktime/0', () => {
    //   it('mktime/0', () => {
    //     throw notImplementedError('mktime/0');
    //   });
    // });
    // describe('modf/0', () => {
    //   it('modf/0', () => {
    //     throw notImplementedError('modf/0');
    //   });
    // });
    // describe('modulemeta/0', () => {
    //   it('modulemeta/0', () => {
    //     throw notImplementedError('modulemeta/0');
    //   });
    // });
    // describe('nan/0', () => {
    //   it('nan/0', () => {
    //     throw notImplementedError('nan/0');
    //   });
    // });
    // describe('nearbyint/0', () => {
    //   it('nearbyint/0', () => {
    //     throw notImplementedError('nearbyint/0');
    //   });
    // });
    // describe('nextafter/2', () => {
    //   it('nextafter/2', () => {
    //     throw notImplementedError('nextafter/2');
    //   });
    // });
    // describe('nexttoward/2', () => {
    //   it('nexttoward/2', () => {
    //     throw notImplementedError('nexttoward/2');
    //   });
    // });
    describe('not/0', () => {
      it('true, false', () => {
        expectCode('true, false | not', [false, true]);
      });
      it('null', () => {
        expectCode('null | not', [true]);
      });
      it('1, "", [], {}', () => {
        expectCode('1, "", [], {} | not', [false, false, false, false]);
      });
    });
    // describe('now/0', () => {
    //   it('now/0', () => {
    //     throw notImplementedError('now/0');
    //   });
    // });
    describe('path/1', () => {
      it('simple', () => {
        expectCode('{} | path(.x.y.z)', [['x', 'y', 'z']]);
      });
      it('pipe', () => {
        expectCode('{} | path(.x | .y | .z)', [['x', 'y', 'z']]);
      });
      it('array', () => {
        expectCode('[] | path(.[1].x)', [[1, 'x']]);
      });
      describe('nested', () => {
        it('index', () => {
          expectCode('{} | .x | path(.y)', [['y']]);
        });
        it('slice', () => {
          expectCode('[] | .[1:] | path(.[1])', [[1]]);
        });
        it('iterator', () => {
          expectCode('[{},{}] | .[] | path(.y)', [['y'], ['y']]);
        });
      });
      it('.a', () => {
        expectCode('null | path(.a)', [['a']]);
      });
      it('.a[0,1]', () => {
        expectCode('null | path(.a[0,1])', [
          ['a', 0],
          ['a', 1],
        ]);
      });
      it('.a.b, .b', () => {
        expectCode('null | path(.a.b, .b)', [['a', 'b'], ['b']]);
      });
      it('.[]', () => {
        expectCode('[1,2,3,4,5] | path(.[])', [[0], [1], [2], [3], [4]]);
      });
      it('.[] | select(.>3)', () => {
        expectCode('[1,2,3,4,5] | path(.[] | select(.>3))', [[3], [4]]);
      });
      it('.[1:3] | select(.>3) | .[2]', () => {
        expectCode('[1,2,3,4,5] | path(.[1:3] | select(.>3) | .[2])', [
          [{ start: 1, end: 3 }, 2],
        ]);
      });
      it('.[2:3][-2].a', () => {
        expectCode('[1,2,3,4,5] | path(.[2:3][-2].a)', [
          [{ start: 2, end: 3 }, -2, 'a'],
        ]);
      });
      it('1 | path(.)', () => {
        expectCode('1 | path(.)', [[]]);
      });
      it('with filter', () => {
        expectCode('def f($a): .a.b[$a].c; null | path(f(5))', [
          ['a', 'b', 5, 'c'],
        ]);
      });
      describe('wierd cases', () => {
        // If the input and the path expression are equal to the same number or boolean,
        //   or if they are both equal to null, the path is equal to []
        testCode('1 | path(1)', [[]]);
        testCode('2 | path(2)', [[]]);
        testCodeError('2 | path(1)');

        testCode('true | path(true)', [[]]);
        testCodeError('true | path(false)');

        testCode('null | path(null)', [[]]);
        testCodeError('null | path(true)');
        testCodeError('null | path(0)');
        testCodeError('0 | path(null)');
        testCodeError('false | path(null)');
      });
      describe('error', () => {
        testCodeError('[1] | path(0)');
        testCodeError('[1] | path("")');

        testCodeError('[1] | path(.a.b)');
        testCodeError('[1] | path(.[0].b)');
        testCodeError('[1] as $var | path($var)');
        testCodeError('[1] as $var | path($var[0])');

        testCodeError('{a:1} | path(0)');
        testCodeError('{a:1} | path("")');

        testCodeError('{a:1} | path(.a.b)');
        testCodeError('{a:1} as $var | path($var)');
        testCodeError('{a:1} as $var | path($var.a)');
      });
    });
    // describe('pow/2', () => {
    //   it('pow/2', () => {
    //     throw notImplementedError('pow/2');
    //   });
    // });
    // describe('pow10/0', () => {
    //   it('pow10/0', () => {
    //     throw notImplementedError('pow10/0');
    //   });
    // });
    describe('range/2', () => {
      it('range(0;6)', () => {
        expectCode('range(0;6)', [0, 1, 2, 3, 4, 5]);
      });
      it('range(0;-1)', () => {
        expectCode('range(0;-1)', []);
      });
      it('range(100;6)', () => {
        expectCode('range(100;6)', []);
      });
      describe('error', () => {
        it('range("";6)', () => {
          // TODO This does not fail in the original jq implementation (therefore this test fails). Consider fixing it.
          expectCodeError('range("";6)');
        });
        it('range(0;"")', () => {
          expectCodeError('range(0;"")');
        });
      });
    });
    // describe('remainder/2', () => {
    //   it('remainder/2', () => {
    //     throw notImplementedError('remainder/2');
    //   });
    // });
    // describe('rint/0', () => {
    //   it('rint/0', () => {
    //     throw notImplementedError('rint/0');
    //   });
    // });
    describe('round/0', () => {
      it('0', () => {
        expectCode('0 | round', [0]);
      });
      it('0.1', () => {
        expectCode('0.1 | round', [0]);
      });
      it('0.5', () => {
        expectCode('0.5 | round', [1]);
      });
      it('0.7', () => {
        expectCode('0.7 | round', [1]);
      });
      it('123.456', () => {
        expectCode('123.456 | round', [123]);
      });
    });
    // describe('rtrimstr/1', () => {
    //   it('rtrimstr/1', () => {
    //     throw notImplementedError('rtrimstr/1');
    //   });
    // });
    // describe('scalars_or_empty/0', () => {
    //   it('scalars_or_empty/0', () => {
    //     throw notImplementedError('scalars_or_empty/0');
    //   });
    // });
    // describe('scalb/2', () => {
    //   it('scalb/2', () => {
    //     throw notImplementedError('scalb/2');
    //   });
    // });
    // describe('scalbln/2', () => {
    //   it('scalbln/2', () => {
    //     throw notImplementedError('scalbln/2');
    //   });
    // });
    // describe('setpath/2', () => {
    //   it('setpath/2', () => {
    //     throw notImplementedError('setpath/2');
    //   });
    // });
    // describe('significand/0', () => {
    //   it('significand/0', () => {
    //     throw notImplementedError('significand/0');
    //   });
    // });
    // describe('sin/0', () => {
    //   it('sin/0', () => {
    //     throw notImplementedError('sin/0');
    //   });
    // });
    // describe('sinh/0', () => {
    //   it('sinh/0', () => {
    //     throw notImplementedError('sinh/0');
    //   });
    // });
    describe('sort/0', () => {
      it('sort/0', () => {
        expectCode(
          '[{a: null}, 5, {}, [null], [], "", "abc", "ab", null, 1,1,1,2,3,4,5,4, true, [], true, false, null] | sort',
          [
            [
              null,
              null,
              false,
              true,
              true,
              1,
              1,
              1,
              2,
              3,
              4,
              4,
              5,
              5,
              '',
              'ab',
              'abc',
              [],
              [],
              [null],
              {},
              { a: null },
            ],
          ]
        );
      });
    });
    describe('split/1', () => {
      it('simple', () => {
        expectCode('"abc::def::ghi::jkl::mno::pqr" | split("::")', [
          ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqr'],
        ]);
      });
    });
    // describe('sqrt/0', () => {
    //   it('sqrt/0', () => {
    //     throw notImplementedError('sqrt/0');
    //   });
    // });
    describe('startswith/1', () => {
      it('simple', () => {
        expectCode('"abcdefg", "abxxx", "" | startswith("abc")', [
          true,
          false,
          false,
        ]);
      });
      describe('error', () => {
        it('input', () => {
          expectCodeError('null | startswith("abc")');
          expectCodeError('false | startswith("abc")');
          expectCodeError('0 | startswith("abc")');
          expectCodeError('[] | startswith("abc")');
          expectCodeError('{} | startswith("abc")');
        });
        it('arg', () => {
          expectCodeError('"abc" | startswith(null)');
          expectCodeError('"abc" | startswith(false)');
          expectCodeError('"abc" | startswith(0)');
          expectCodeError('"abc" | startswith([])');
          expectCodeError('"abc" | startswith({})');
        });
      });
    });
    // describe('stderr/0', () => {
    //   it('stderr/0', () => {
    //     throw notImplementedError('stderr/0');
    //   });
    // });
    // describe('strflocaltime/1', () => {
    //   it('strflocaltime/1', () => {
    //     throw notImplementedError('strflocaltime/1');
    //   });
    // });
    // describe('strftime/1', () => {
    //   it('strftime/1', () => {
    //     throw notImplementedError('strftime/1');
    //   });
    // });
    // describe('strptime/1', () => {
    //   it('strptime/1', () => {
    //     throw notImplementedError('strptime/1');
    //   });
    // });
    // describe('tan/0', () => {
    //   it('tan/0', () => {
    //     throw notImplementedError('tan/0');
    //   });
    // });
    // describe('tanh/0', () => {
    //   it('tanh/0', () => {
    //     throw notImplementedError('tanh/0');
    //   });
    // });
    // describe('tgamma/0', () => {
    //   it('tgamma/0', () => {
    //     throw notImplementedError('tgamma/0');
    //   });
    // });
    // describe('tojson/0', () => {
    //   it('tojson/0', () => {
    //     throw notImplementedError('tojson/0');
    //   });
    // });
    // describe('tonumber/0', () => {
    //   it('tonumber/0', () => {
    //     throw notImplementedError('tonumber/0');
    //   });
    // });
    describe('tostring/0', () => {
      it('null', () => {
        expectCode('null | tostring', ['null']);
      });
      it('boolean', () => {
        expectCode('false | tostring', ['false']);
      });
      it('string', () => {
        expectCode('"Hello world!" | tostring', ['Hello world!']);
      });
      it('array', () => {
        expectCode('[1, 2, 3] | tostring', ['[1,2,3]']);
      });
      it('object', () => {
        // NOTE: This slightly differs from the original jq implementation (as this library relies on the js object
        // implementation, in which positive integer keys do not have to be stored in insertion order)
        expectCode('{a:"a","1":1} | tostring', ['{"1":1,"a":"a"}']);
      });
    });
    // describe('trunc/0', () => {
    //   it('trunc/0', () => {
    //     throw notImplementedError('trunc/0');
    //   });
    // });
    describe('type/0', () => {
      it('type/0', () => {
        expectCode('null, true, 0, "", [], {} | type', [
          'null',
          'boolean',
          'number',
          'string',
          'array',
          'object',
        ]);
      });
    });
    // describe('utf8bytelength/0', () => {
    //   it('utf8bytelength/0', () => {
    //     throw notImplementedError('utf8bytelength/0');
    //   });
    // });
    // describe('y0/0', () => {
    //   it('y0/0', () => {
    //     throw notImplementedError('y0/0');
    //   });
    // });
    // describe('y1/0', () => {
    //   it('y1/0', () => {
    //     throw notImplementedError('y1/0');
    //   });
    // });
    // describe('yn/2', () => {
    //   it('yn/2', () => {
    //     throw notImplementedError('yn/2');
    //   });
    // });
  });
  describe('jq', () => {
    // describe('IN/1', () => {
    //   it('IN/1', () => {
    //     throw notImplementedError('IN/1');
    //   });
    // });
    // describe('IN/2', () => {
    //   it('IN/2', () => {
    //     throw notImplementedError('IN/2');
    //   });
    // });
    // describe('INDEX/1', () => {
    //   it('INDEX/1', () => {
    //     throw notImplementedError('INDEX/1');
    //   });
    // });
    // describe('INDEX/2', () => {
    //   it('INDEX/2', () => {
    //     throw notImplementedError('INDEX/2');
    //   });
    // });
    // describe('JOIN/2', () => {
    //   it('JOIN/2', () => {
    //     throw notImplementedError('JOIN/2');
    //   });
    // });
    // describe('JOIN/3', () => {
    //   it('JOIN/3', () => {
    //     throw notImplementedError('JOIN/3');
    //   });
    // });
    // describe('JOIN/4', () => {
    //   it('JOIN/4', () => {
    //     throw notImplementedError('JOIN/4');
    //   });
    // });
    describe('add/0', () => {
      it('number', () => {
        expectCode('[1,2,3,4,5,6,7,8,9,10] | add', [55]);
      });
      it('string', () => {
        expectCode('["abc", "def", "ghi", "jkl"] | add', ['abcdefghijkl']);
      });
      it('array', () => {
        expectCode('[[1,2,3],[4,5,6],[7,8,9]] | add', [
          [1, 2, 3, 4, 5, 6, 7, 8, 9],
        ]);
      });
      it('object', () => {
        expectCode('[{a:1,b:2,c:3},{b:4,c:5,d:6},{c:7,e:8}] | add', [
          { a: 1, b: 4, c: 7, d: 6, e: 8 },
        ]);
      });
      it('empty input', () => {
        expectCode('[] | add', [null]);
      });
      describe('incompatible types', () => {
        it('1+"a"', () => {
          expectCodeError('[1,"a"] | add');
        });
        it('"a"+[]', () => {
          expectCodeError('["a",[]] | add');
        });
      });
    });
    describe('all/0', () => {
      it('empty', () => {
        expectCode('[] | all', [true]);
      });
      it('numbers', () => {
        expectCode('[0,1,2,3] | all', [true]);
      });
      it('none', () => {
        expectCode('[false, false, false] | all', [false]);
      });
      it('some', () => {
        expectCode('[true, false, true, false] | all', [false]);
      });
      it('all', () => {
        expectCode('[true, true, true, true] | all', [true]);
      });
      it('error', () => {
        expectCodeError('0 | all');
      });
    });
    describe('all/1', () => {
      it('empty', () => {
        expectCode('[] | all(.>3)', [true]);
      });
      it('none', () => {
        expectCode('[0,1,2,3] | all(.>3)', [false]);
      });
      it('some', () => {
        expectCode('[1,2,3,4,5,6] | all(.>3)', [false]);
      });
      it('all', () => {
        expectCode('[4,5,6] | all(.>3)', [true]);
      });
      it('error', () => {
        expectCodeError('0 | all(.>3)');
      });
    });
    describe('all/2', () => {
      it('empty', () => {
        expectCode('all(empty; .>3)', [true]);
      });
      it('none', () => {
        expectCode('all(0,1,2,3; .>3)', [false]);
      });
      it('some', () => {
        expectCode('all(1,2,3,4,5,6; .>3)', [false]);
      });
      it('all', () => {
        expectCode('all(4,5,6; .>3)', [true]);
      });
    });
    describe('any/0', () => {
      it('empty', () => {
        expectCode('[] | any', [false]);
      });
      it('numbers', () => {
        expectCode('[0,1,2,3] | any', [true]);
      });
      it('none', () => {
        expectCode('[false, false, false] | any', [false]);
      });
      it('some', () => {
        expectCode('[true, false, true, false] | any', [true]);
      });
      it('all', () => {
        expectCode('[true, true, true, true] | any', [true]);
      });
      it('error', () => {
        expectCodeError('0 | any');
      });
    });
    describe('any/1', () => {
      it('empty', () => {
        expectCode('[] | any(.>3)', [false]);
      });
      it('none', () => {
        expectCode('[0,1,2,3] | any(.>3)', [false]);
      });
      it('some', () => {
        expectCode('[1,2,3,4,5,6] | any(.>3)', [true]);
      });
      it('all', () => {
        expectCode('[4,5,6] | any(.>3)', [true]);
      });
      it('error', () => {
        expectCodeError('0 | any(.>3)');
      });
    });
    describe('any/2', () => {
      it('empty', () => {
        expectCode('any(empty; .>3)', [false]);
      });
      it('none', () => {
        expectCode('any(0,1,2,3; .>3)', [false]);
      });
      it('some', () => {
        expectCode('any(1,2,3,4,5,6; .>3)', [true]);
      });
      it('all', () => {
        expectCode('any(4,5,6; .>3)', [true]);
      });
    });
    // describe('arrays/0', () => {
    //   it('arrays/0', () => {
    //     throw notImplementedError('arrays/0');
    //   });
    // });
    // describe('ascii_downcase/0', () => {
    //   it('ascii_downcase/0', () => {
    //     throw notImplementedError('ascii_downcase/0');
    //   });
    // });
    // describe('ascii_upcase/0', () => {
    //   it('ascii_upcase/0', () => {
    //     throw notImplementedError('ascii_upcase/0');
    //   });
    // });
    // describe('booleans/0', () => {
    //   it('booleans/0', () => {
    //     throw notImplementedError('booleans/0');
    //   });
    // });
    // describe('bsearch/1', () => {
    //   it('bsearch/1', () => {
    //     throw notImplementedError('bsearch/1');
    //   });
    // });
    // describe('capture/1', () => {
    //   it('capture/1', () => {
    //     throw notImplementedError('capture/1');
    //   });
    // });
    // describe('capture/2', () => {
    //   it('capture/2', () => {
    //     throw notImplementedError('capture/2');
    //   });
    // });
    // describe('combinations/0', () => {
    //   it('combinations/0', () => {
    //     throw notImplementedError('combinations/0');
    //   });
    // });
    // describe('combinations/1', () => {
    //   it('combinations/1', () => {
    //     throw notImplementedError('combinations/1');
    //   });
    // });
    describe('del/1', () => {
      it('object', () => {
        expectCode('{a:1,b:2,c:3} | del(.a)', [{ b: 2, c: 3 }]);
      });
      it('array', () => {
        expectCode('[0,1,2,3,4,5,6,7] | del(.[2,5,3,7])', [[0, 1, 4, 6]]);
      });
      it('nested', () => {
        expectCode('{x:{y:"keep",z:"remove"}} | .x | del(.z)', [{ y: 'keep' }]);
      });
    });
    // describe('error/1', () => {
    //   it('error/1', () => {
    //     throw notImplementedError('error/1');
    //   });
    // });
    // describe('finites/0', () => {
    //   it('finites/0', () => {
    //     throw notImplementedError('finites/0');
    //   });
    // });
    describe('first/0', () => {
      it('empty array', () => {
        expectCode('[] | first', [null]);
      });
      it('simple', () => {
        expectCode('[1,2,3,4] | first', [1]);
      });
      it('error', () => {
        expectCodeError('"" | first');
        expectCodeError('{} | first');
      });
    });
    describe('first/1', () => {
      it('simple', () => {
        expectCode('first(1,2,3,4)', [1]);
      });
      it('empty', () => {
        // TODO This behaves the same as in the original jq implementation, but the behaviour
        //  differs from the behaviour of the last(expr) and nth(n;expr) filters.
        //  Consider adjusting this.
        expectCode('first(empty)', []);
      });
      it('unthrown error', () => {
        expectCode('first(1,2,3,4, error("ERROR"))', [1]);
      });
    });
    // describe('flatten/0', () => {
    //   it('flatten/0', () => {
    //     throw notImplementedError('flatten/0');
    //   });
    // });
    // describe('flatten/1', () => {
    //   it('flatten/1', () => {
    //     throw notImplementedError('flatten/1');
    //   });
    // });
    describe('from_entries/0', () => {
      it('simple', () => {
        expectCode(
          '[{ key: "a", value: 1 }, { key: "b", value: 2}] | from_entries',
          [{ a: 1, b: 2 }]
        );
      });
      it('empty', () => {
        expectCode('[] | from_entries', [{}]);
      });
      it('entry key alternatives', () => {
        expectCode(
          '[{ key: "a", value: 1 }, { Key: "b", Value: 2}, { name: "c", value: 3}, { Name: "d", Value: 4}] | from_entries',
          [{ a: 1, b: 2, c: 3, d: 4 }]
        );
      });
      it('override', () => {
        expectCode(
          '[{ key: "a", value: 1 }, { Key: "b", Value: 2}, { name: "a", value: 3}, { Name: "b", Value: 4}] | from_entries',
          [{ a: 3, b: 4 }]
        );
      });
      it('multi', () => {
        expectCode('[ {key: (1,2 | tostring), value: (1,2)}] | from_entries', [
          { '1': 2, '2': 2 },
        ]);
      });
      it('error', () => {
        expectCodeError('5 | from_entries');
      });
    });
    // describe('fromdate/0', () => {
    //   it('fromdate/0', () => {
    //     throw notImplementedError('fromdate/0');
    //   });
    // });
    // describe('fromdateiso8601/0', () => {
    //   it('fromdateiso8601/0', () => {
    //     throw notImplementedError('fromdateiso8601/0');
    //   });
    // });
    // describe('fromstream/1', () => {
    //   it('fromstream/1', () => {
    //     throw notImplementedError('fromstream/1');
    //   });
    // });
    describe('group_by/1', () => {
      it('simple', () => {
        expectCode('[0,1,2,3,4,5] | group_by(. > 3)', [
          [
            [0, 1, 2, 3],
            [4, 5],
          ],
        ]);
      });
      it('empty', () => {
        expectCode('[] | group_by(. > 3)', [[]]);
      });
      it('unsorted values', () => {
        expectCode('[15,12,1,0,13,2,1,0,18,14,3,4] | group_by(. > 10)', [
          [
            [1, 0, 2, 1, 0, 3, 4],
            [15, 12, 13, 18, 14],
          ],
        ]);
      });
      describe('groups order', () => {
        it('simple', () => {
          expectCode(
            '[{a: null}, 5, {}, [null], [], "", "abc", "ab", null, 1,1,1,2,3,4,5,4, true, [], true, false, null] | group_by(.)',
            [
              [
                [null, null],
                [false],
                [true, true],
                [1, 1, 1],
                [2],
                [3],
                [4, 4],
                [5, 5],
                [''],
                ['ab'],
                ['abc'],
                [[], []],
                [[null]],
                [{}],
                [{ a: null }],
              ],
            ]
          );
        });
        it('two keys', () => {
          expectCode(
            '[{a:2,b:2,c:7},{a:2,b:2,c:8}, {a:2,b:1,c:5},{a:2,b:1,c:6}, {a:1,b:2,c:3},{a:1,b:2,c:4}, {a:1,b:1,c:1},{a:1,b:1,c:2}] | group_by(.a,.b)',
            [
              [
                [
                  { a: 1, b: 1, c: 1 },
                  { a: 1, b: 1, c: 2 },
                ],
                [
                  { a: 1, b: 2, c: 3 },
                  { a: 1, b: 2, c: 4 },
                ],
                [
                  { a: 2, b: 1, c: 5 },
                  { a: 2, b: 1, c: 6 },
                ],
                [
                  { a: 2, b: 2, c: 7 },
                  { a: 2, b: 2, c: 8 },
                ],
              ],
            ]
          );
        });
      });
      describe('multi', () => {
        it('input', () => {
          expectCode(
            '[0,1,2,3,4,5], [5,4,3,2,1], [2,3,4,5] | group_by(. > 3)',
            [
              [
                [0, 1, 2, 3],
                [4, 5],
              ],
              [
                [3, 2, 1],
                [5, 4],
              ],
              [
                [2, 3],
                [4, 5],
              ],
            ]
          );
        });
      });
      describe('argument', () => {
        it('ranges', () => {
          expectCode(
            '[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25] | group_by(10 < ., . < 20)',
            [
              [
                [6, 7, 8, 9, 10],
                [20, 21, 22, 23, 24, 25],
                [11, 12, 13, 14, 15, 16, 17, 18, 19],
              ],
            ]
          );
        });
        it('two keys', () => {
          expectCode(
            '[{a:1,b:1,c:1},{a:1,b:1,c:2}, {a:1,b:2,c:3},{a:1,b:2,c:4}, {a:2,b:1,c:5},{a:2,b:1,c:6}, {a:2,b:2,c:7},{a:2,b:2,c:8}] | group_by(.a,.b)',
            [
              [
                [
                  { a: 1, b: 1, c: 1 },
                  { a: 1, b: 1, c: 2 },
                ],
                [
                  { a: 1, b: 2, c: 3 },
                  { a: 1, b: 2, c: 4 },
                ],
                [
                  { a: 2, b: 1, c: 5 },
                  { a: 2, b: 1, c: 6 },
                ],
                [
                  { a: 2, b: 2, c: 7 },
                  { a: 2, b: 2, c: 8 },
                ],
              ],
            ]
          );
        });
      });
    });
    // describe('gsub/2', () => {
    //   it('gsub/2', () => {
    //     throw notImplementedError('gsub/2');
    //   });
    // });
    // describe('gsub/3', () => {
    //   it('gsub/3', () => {
    //     throw notImplementedError('gsub/3');
    //   });
    // });
    // describe('halt_error/0', () => {
    //   it('halt_error/0', () => {
    //     throw notImplementedError('halt_error/0');
    //   });
    // });
    // describe('in/1', () => {
    //   it('in/1', () => {
    //     throw notImplementedError('in/1');
    //   });
    // });
    describe('index/1', () => {
      it('string', () => {
        expectCode('"abcabcabc" | index("abc")', [0]);
      });
      it('array', () => {
        expectCode('[1,2,3,1,2,3,1,2,3] | index([1,2,3])', [0]);
      });
    });
    describe('indices/1', () => {
      describe('array', () => {
        it('find item', () => {
          expectCode(
            '[0,1,2,3,4,0,5,6,0,7,8,9,10,0,0,1,2,0,3,4,0,1,2,0,1] | indices(0)',
            [[0, 5, 8, 13, 14, 17, 20, 23]]
          );
        });
        it('find array', () => {
          expectCode(
            '[0,1,2,3,4,0,5,6,0,7,8,9,10,0,0,1,2,0,3,4,0,1,2,0,1] | indices([0,1])',
            [[0, 14, 20, 23]]
          );
        });
      });
      describe('string', () => {
        it('"abc" in "abcdefabcdefabcdef"', () => {
          expectCode('"abcdefabcdefabcdef" | indices("abc")', [[0, 6, 12]]);
        });
        it('"" in "abc"', () => {
          expectCode('"abc" | indices("")', [[]]);
        });
        it('"aaa" in "aaaaaa"', () => {
          // NOTE: The original jq implementation would return [0,3]
          expectCode('"aaaaaa" | indices("aaa")', [[0, 1, 2, 3]]);
        });
      });
      it('object', () => {
        // TODO: Consider changing this behaviour (it behaves the same in the original jq implementation,
        //   however, it seems wrong)
        expectCode('{a:5}|indices("a")', [5]);
      });
    });
    // describe('inputs/0', () => {
    //   it('inputs/0', () => {
    //     throw notImplementedError('inputs/0');
    //   });
    // });
    // describe('inside/1', () => {
    //   it('inside/1', () => {
    //     throw notImplementedError('inside/1');
    //   });
    // });
    describe('isempty/1', () => {
      it('empty', () => {
        expectCode('isempty(empty)', [true]);
      });
      it('[][]', () => {
        expectCode('isempty([][])', [true]);
      });
      it('1', () => {
        expectCode('isempty(1)', [false]);
      });
      it('1,2,3', () => {
        expectCode('isempty(1,2,3)', [false]);
      });
      it('true, null', () => {
        expectCode('isempty(true, null)', [false]);
      });
      it('null', () => {
        expectCode('isempty(null)', [false]);
      });
      it('false', () => {
        expectCode('isempty(false)', [false]);
      });
    });
    // describe('isfinite/0', () => {
    //   it('isfinite/0', () => {
    //     throw notImplementedError('isfinite/0');
    //   });
    // });
    // describe('iterables/0', () => {
    //   it('iterables/0', () => {
    //     throw notImplementedError('iterables/0');
    //   });
    // });
    describe('join/1', () => {
      it('strings', () => {
        expectCode('["a", "b,c", "d,e", "e,f", "g"] | join(", ")', [
          'a, b,c, d,e, e,f, g',
        ]);
      });
      it('mixed', () => {
        expectCode(
          '[null, true, false, 0, 1, "", 0.5, "a", "b", "c"] | join(" :: ")',
          [' :: true :: false :: 0 :: 1 ::  :: 0.5 :: a :: b :: c']
        );
      });
      it('cannot join', () => {
        expectCodeError('[{}, ""] | join(",")');
        expectCodeError('[[], ""] | join(",")');
      });
    });
    describe('last/0', () => {
      it('empty array', () => {
        expectCode('[] | last', [null]);
      });
      it('simple', () => {
        expectCode('[1,2,3,4] | last', [4]);
      });
      it('error', () => {
        expectCodeError('"" | last');
        expectCodeError('{} | last');
      });
    });
    describe('last/1', () => {
      it('simple', () => {
        expectCode('last(1,2,3,4)', [4]);
      });
      it('empty', () => {
        expectCode('last(empty)', [null]);
      });
    });
    // describe('leaf_paths/0', () => {
    //   it('leaf_paths/0', () => {
    //     throw notImplementedError('leaf_paths/0');
    //   });
    // });
    describe('limit/2', () => {
      it('limit/2', () => {
        expectCode('limit(5;1)', [1]);
        expectCode('limit(0;1)', []);
        expectCode('limit(3;1,2,3,4,5)', [1, 2, 3]);
      });
      it('invalid item count', () => {
        expectCodeError('limit(""; 1,2,3)');
      });
    });
    describe('map/1', () => {
      it('identity', () => {
        expectCode('[0,1,2,3,4,5] | map(.)', [[0, 1, 2, 3, 4, 5]]);
      });
      it('.*10', () => {
        expectCode('[0,1,2,3,4,5] | map(.*10)', [[0, 10, 20, 30, 40, 50]]);
      });
      it('[. > 3]', () => {
        expectCode('[0,1,2,3,4,5] | map([. > 3])', [
          [[false], [false], [false], [false], [true], [true]],
        ]);
      });
      it('def f: [. > 3]', () => {
        expectCode('def f: [. > 3]; [0,1,2,3,4,5] | map(f)', [
          [[false], [false], [false], [false], [true], [true]],
        ]);
      });
      describe('multi', () => {
        it('input', () => {
          expectCode('[0,1,2,3,4,5], [6,7,8,9,10] | map(.+1)', [
            [1, 2, 3, 4, 5, 6],
            [7, 8, 9, 10, 11],
          ]);
        });
        it('argument', () => {
          expectCode('[0,1,2,3,4,5] | map(.+1,.+2)', [
            [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
          ]);
        });
      });
    });
    // describe('map_values/1', () => {
    //   it('map_values/1', () => {
    //     throw notImplementedError('map_values/1');
    //   });
    // });
    describe('match/1', () => {
      describe('found', () => {
        it('string', () => {
          expectCode('"XXX-XXX" | match("XXX")', [
            { offset: 0, length: 3, string: 'XXX', captures: [] },
          ]);
        });
        it('array', () => {
          expectCode('"XXX-XXX" | match(["x+", "ig"])', [
            { offset: 0, length: 3, string: 'XXX', captures: [] },
            { offset: 4, length: 3, string: 'XXX', captures: [] },
          ]);
        });
        it('simple regex 1', () => {
          expectCode('"XXX-XXX" | match("X+")', [
            { offset: 0, length: 3, string: 'XXX', captures: [] },
          ]);
        });
        it('simple regex 2', () => {
          expectCode('"abc<<<123>>>def" | match("<<<[0-9]*>>>")', [
            { offset: 3, length: 9, string: '<<<123>>>', captures: [] },
          ]);
        });
        describe('captures', () => {
          it('simple', () => {
            expectCode('"abc<<<123>>>def" | match("<<<([0-9]*)>>>")', [
              {
                offset: 3,
                length: 9,
                string: '<<<123>>>',
                captures: [{ offset: 6, length: 3, string: '123', name: null }],
              },
            ]);
          });
          it('named', () => {
            expectCode('"abc<<<123>>>def" | match("<<<(?<x>.*)>>>")', [
              {
                offset: 3,
                length: 9,
                string: '<<<123>>>',
                captures: [{ offset: 6, length: 3, string: '123', name: 'x' }],
              },
            ]);
          });
        });
      });
      describe('not found', () => {
        it('string', () => {
          expectCode('"XXX-XXX" | match("XY")', []);
        });
        it('simple regex', () => {
          expectCode('"XXX-XXX" | match("(?:XY)+")', []);
        });
      });
      describe('error', () => {
        it('invalid regex', () => {
          expectCodeError('"abc" | match("[")');
        });
        describe('invalid input', () => {
          it('null', () => {
            expectCodeError('null | match("abc")');
          });
          it('boolean', () => {
            expectCodeError('false | match("abc")');
          });
          it('number', () => {
            expectCodeError('0 | match("abc")');
          });
          it('array', () => {
            expectCodeError('[] | match("abc")');
          });
          it('object', () => {
            expectCodeError('{} | match("abc")');
          });
        });
      });
    });
    describe('match/2', () => {
      describe('found', () => {
        it('simple', () => {
          expectCode('"XXX-XXX" | match("X+"; "g")', [
            { offset: 0, length: 3, string: 'XXX', captures: [] },
            { offset: 4, length: 3, string: 'XXX', captures: [] },
          ]);
        });
        describe('captures', () => {
          it('simple', () => {
            expectCode(
              '"abc<<<123>>>def<<<456>>>ghi" | match("<<<([0-9]*)>>>"; "g")',
              [
                {
                  offset: 3,
                  length: 9,
                  string: '<<<123>>>',
                  captures: [
                    { offset: 6, length: 3, string: '123', name: null },
                  ],
                },
                {
                  offset: 15,
                  length: 9,
                  string: '<<<456>>>',
                  captures: [
                    { offset: 18, length: 3, string: '456', name: null },
                  ],
                },
              ]
            );
          });
          it('named', () => {
            expectCode(
              '"abc<<<123>>>def<<<456>>>ghi" | match("<<<(?<x>[0-9]*)>>>"; "g")',
              [
                {
                  offset: 3,
                  length: 9,
                  string: '<<<123>>>',
                  captures: [
                    { offset: 6, length: 3, string: '123', name: 'x' },
                  ],
                },
                {
                  offset: 15,
                  length: 9,
                  string: '<<<456>>>',
                  captures: [
                    { offset: 18, length: 3, string: '456', name: 'x' },
                  ],
                },
              ]
            );
          });
        });
      });
      describe('not found', () => {
        it('string', () => {
          expectCode('"XXX-XXX" | match("XY"; "g")', []);
        });
        it('simple regex', () => {
          expectCode('"XXX-XXX" | match("(?:XY)+"; "g")', []);
        });
      });
    });
    // describe('max_by/1', () => {
    //   it('max_by/1', () => {
    //     throw notImplementedError('max_by/1');
    //   });
    // });
    // describe('min_by/1', () => {
    //   it('min_by/1', () => {
    //     throw notImplementedError('min_by/1');
    //   });
    // });
    // describe('normals/0', () => {
    //   it('normals/0', () => {
    //     throw notImplementedError('normals/0');
    //   });
    // });
    describe('nth/1', () => {
      it('empty array', () => {
        expectCode('[] | nth(1)', [null]);
      });
      it('simple', () => {
        expectCode('[1,2,3,4] | nth(1,2)', [2, 3]);
      });
      it('error', () => {
        expectCodeError('"" | nth(1)');
        expectCodeError('{} | nth(1)');
      });
    });
    describe('nth/2', () => {
      it('simple', () => {
        expectCode('nth(1,2; 1,2,3,4)', [2, 3]);
      });
      it('empty', () => {
        expectCode('nth(1; empty)', [null]);
      });
    });
    // describe('nulls/0', () => {
    //   it('nulls/0', () => {
    //     throw notImplementedError('nulls/0');
    //   });
    // });
    // describe('numbers/0', () => {
    //   it('numbers/0', () => {
    //     throw notImplementedError('numbers/0');
    //   });
    // });
    // describe('objects/0', () => {
    //   it('objects/0', () => {
    //     throw notImplementedError('objects/0');
    //   });
    // });
    // describe('paths/0', () => {
    //   it('paths/0', () => {
    //     throw notImplementedError('paths/0');
    //   });
    // });
    // describe('paths/1', () => {
    //   it('paths/1', () => {
    //     throw notImplementedError('paths/1');
    //   });
    // });
    describe('range/1', () => {
      it('range(6)', () => {
        expectCode('range(6)', [0, 1, 2, 3, 4, 5]);
      });
      it('range(0)', () => {
        expectCode('range(0)', []);
      });
      it('range(-1)', () => {
        expectCode('range(-1)', []);
      });
      describe('error', () => {
        it('range("")', () => {
          expectCodeError('range("")');
        });
      });
    });
    describe('range/3', () => {
      it('range(0;6;2)', () => {
        expectCode('range(0;6;2)', [0, 2, 4]);
      });
      it('range(0;-1;2)', () => {
        expectCode('range(0;-1;2)', []);
      });
      it('range(100;6;2)', () => {
        expectCode('range(100;6;2)', []);
      });
      describe('error', () => {
        it('range("";6;2)', () => {
          // TODO This does not fail in the original jq implementation (therefore this test fails). Consider fixing it.
          expectCodeError('range("";6;2)');
        });
        it('range(0;"";2)', () => {
          // TODO This does not fail in the original jq implementation, it actually generates numbers up to infinity
          //  which results in a "Maximum call stack size exceeded" error here. Consider fixing it.
          expectCodeError('range(0;"";2)');
        });
      });
    });
    // describe('recurse/0', () => {
    //   it('recurse/0', () => {
    //     throw notImplementedError('recurse/0');
    //   });
    // });
    // describe('recurse/1', () => {
    //   it('recurse/1', () => {
    //     throw notImplementedError('recurse/1');
    //   });
    // });
    // describe('recurse/2', () => {
    //   it('recurse/2', () => {
    //     throw notImplementedError('recurse/2');
    //   });
    // });
    // describe('recurse_down/0', () => {
    //   it('recurse_down/0', () => {
    //     throw notImplementedError('recurse_down/0');
    //   });
    // });
    // describe('repeat/1', () => {
    //   it('repeat/1', () => {
    //     throw notImplementedError('repeat/1');
    //   });
    // });
    // describe('reverse/0', () => {
    //   it('reverse/0', () => {
    //     throw notImplementedError('reverse/0');
    //   });
    // });
    describe('rindex/1', () => {
      it('string', () => {
        expectCode('"abcabcabc" | rindex("abc")', [6]);
      });
      it('array', () => {
        expectCode('[1,2,3,1,2,3,1,2,3] | rindex([1,2,3])', [6]);
      });
    });
    // describe('scalars/0', () => {
    //   it('scalars/0', () => {
    //     throw notImplementedError('scalars/0');
    //   });
    // });
    // describe('scan/1', () => {
    //   it('scan/1', () => {
    //     throw notImplementedError('scan/1');
    //   });
    // });
    describe('select/1', () => {
      it('select', () => {
        expectCode('0,1,2,3,4,5 | select(. > 3)', [4, 5]);
      });
    });
    describe('sort_by/1', () => {
      it('identity', () => {
        expectCode(
          '[{a: null}, 5, {}, [null], [], "", "abc", "ab", null, 1,1,1,2,3,4,5,4, true, [], true, false, null] | sort_by(.)',
          [
            [
              null,
              null,
              false,
              true,
              true,
              1,
              1,
              1,
              2,
              3,
              4,
              4,
              5,
              5,
              '',
              'ab',
              'abc',
              [],
              [],
              [null],
              {},
              { a: null },
            ],
          ]
        );
      });
      it('two keys', () => {
        expectCode(
          '[{a:2,b:2,c:7}, {a:2,b:2,c:8}, {a:2,b:1,c:5}, {a:2,b:1,c:6}, {a:1,b:2,c:3}, {a:1,b:2,c:4}, {a:1,b:1,c:1}, {a:1,b:1,c:2}] | sort_by(.a,.b)',
          [
            [
              { a: 1, b: 1, c: 1 },
              { a: 1, b: 1, c: 2 },
              { a: 1, b: 2, c: 3 },
              { a: 1, b: 2, c: 4 },
              { a: 2, b: 1, c: 5 },
              { a: 2, b: 1, c: 6 },
              { a: 2, b: 2, c: 7 },
              { a: 2, b: 2, c: 8 },
            ],
          ]
        );
      });
    });
    // describe('split/2', () => {
    //   it('split/2', () => {
    //     throw notImplementedError('split/2');
    //   });
    // });
    // describe('splits/1', () => {
    //   it('splits/1', () => {
    //     throw notImplementedError('splits/1');
    //   });
    // });
    // describe('splits/2', () => {
    //   it('splits/2', () => {
    //     throw notImplementedError('splits/2');
    //   });
    // });
    // describe('strings/0', () => {
    //   it('strings/0', () => {
    //     throw notImplementedError('strings/0');
    //   });
    // });
    describe('sub/2', () => {
      it('simple', () => {
        expectCode('"XXXdef" | sub("XXX"; "abc")', ['abcdef']);
      });
      it('two occurences', () => {
        expectCode('"XXXdefXXX" | sub("XXX"; "abc")', ['abcdefXXX']);
      });
      it('simple regex', () => {
        expectCode('"XXXdef" | sub("X+"; "abc")', ['abcdef']);
      });
      it('no change', () => {
        expectCode('"abcdef" | sub("X+"; "xxx")', ['abcdef']);
      });
    });
    describe('sub/3', () => {
      it('two occurences', () => {
        expectCode('"XXXdefXXX" | sub("XXX"; "abc"; "g")', ['abcdefabc']);
      });
    });
    describe('test/1', () => {
      describe('found', () => {
        it('string', () => {
          expectCode('"XXX-XXX" | test("XXX")', [true]);
        });
        it('array', () => {
          expectCode('"XXX-XXX" | test(["x+", "i"])', [true]);
        });
        it('simple regex 1', () => {
          expectCode('"XXX-XXX" | test("X+")', [true]);
        });
        it('simple regex 2', () => {
          expectCode('"abc<<<123>>>def" | test("<<<[0-9]*>>>")', [true]);
        });
        describe('captures', () => {
          it('simple', () => {
            expectCode('"abc<<<123>>>def" | test("<<<([0-9]*)>>>")', [true]);
            expectCode(
              '"abc<<<123>>>def<<<456>>>ghi" | test("<<<([0-9]*)>>>")',
              [true]
            );
          });
          it('named', () => {
            expectCode('"abc<<<123>>>def" | test("<<<(?<x>.*)>>>")', [true]);
            expectCode(
              '"abc<<<123>>>def<<<456>>>ghi" | test("<<<(?<x>[0-9]*)>>>")',
              [true]
            );
          });
        });
      });
      describe('not found', () => {
        it('string', () => {
          expectCode('"XXX-XXX" | test("XY")', [false]);
        });
        it('simple regex', () => {
          expectCode('"XXX-XXX" | test("(?:XY)+")', [false]);
        });
      });
    });
    describe('test/2', () => {
      it('found', () => {
        expectCode('"abcdef" | test("ABC"; "i")', [true]);
      });
      it('not found', () => {
        expectCode('"abcdef" | test("ABC"; "")', [false]);
      });
    });
    describe('to_entries/0', () => {
      it('simple', () => {
        expectCode('{a:1, b:2} | to_entries', [
          [
            { key: 'a', value: 1 },
            { key: 'b', value: 2 },
          ],
        ]);
      });
      it('empty', () => {
        expectCode('{} | to_entries', [[]]);
      });
      it('error', () => {
        expectCodeError('5 | to_entries');
      });
    });
    // describe('todate/0', () => {
    //   it('todate/0', () => {
    //     throw notImplementedError('todate/0');
    //   });
    // });
    // describe('todateiso8601/0', () => {
    //   it('todateiso8601/0', () => {
    //     throw notImplementedError('todateiso8601/0');
    //   });
    // });
    // describe('tostream/0', () => {
    //   it('tostream/0', () => {
    //     throw notImplementedError('tostream/0');
    //   });
    // });
    // describe('transpose/0', () => {
    //   it('transpose/0', () => {
    //     throw notImplementedError('transpose/0');
    //   });
    // });
    // describe('truncate_stream/1', () => {
    //   it('truncate_stream/1', () => {
    //     throw notImplementedError('truncate_stream/1');
    //   });
    // });
    describe('unique/0', () => {
      it('unique/0', () => {
        expectCode(
          '[{a: null}, 5, {}, [null], [], "", "abc", "ab", null, 1,1,1,2,3,4,5,4, true, [], true, false, null] | unique',
          [
            [
              null,
              false,
              true,
              1,
              2,
              3,
              4,
              5,
              '',
              'ab',
              'abc',
              [],
              [null],
              {},
              { a: null },
            ],
          ]
        );
      });
    });
    describe('unique_by/1', () => {
      it('simple', () => {
        expectCode('[0,1,2,3,4,5] | unique_by(. > 3)', [[0, 4]]);
      });
      it('empty', () => {
        expectCode('[] | unique_by(. > 3)', [[]]);
      });
      it('unsorted values', () => {
        expectCode('[15,12,1,0,13,2,1,0,18,14,3,4] | unique_by(. > 10)', [
          [1, 15],
        ]);
      });
      describe('order', () => {
        it('simple', () => {
          expectCode(
            '[{a: null}, 5, {}, [null], [], "", "abc", "ab", null, 1,1,1,2,3,4,5,4, true, [], true, false, null] | unique_by(.)',
            [
              [
                null,
                false,
                true,
                1,
                2,
                3,
                4,
                5,
                '',
                'ab',
                'abc',
                [],
                [null],
                {},
                { a: null },
              ],
            ]
          );
        });
        it('two keys', () => {
          expectCode(
            '[{a:2,b:2,c:7},{a:2,b:2,c:8}, {a:2,b:1,c:5},{a:2,b:1,c:6}, {a:1,b:2,c:3},{a:1,b:2,c:4}, {a:1,b:1,c:1},{a:1,b:1,c:2}] | unique_by(.a,.b)',
            [
              [
                { a: 1, b: 1, c: 1 },
                { a: 1, b: 2, c: 3 },
                { a: 2, b: 1, c: 5 },
                { a: 2, b: 2, c: 7 },
              ],
            ]
          );
        });
      });
      describe('multi', () => {
        it('input', () => {
          expectCode(
            '[0,1,2,3,4,5], [5,4,3,2,1], [2,3,4,5] | unique_by(. > 3)',
            [
              [0, 4],
              [3, 5],
              [2, 4],
            ]
          );
        });
      });
      describe('argument', () => {
        it('ranges', () => {
          expectCode(
            '[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25] | unique_by(10 < ., . < 20)',
            [[6, 20, 11]]
          );
        });
        it('two keys', () => {
          expectCode(
            '[{a:1,b:1,c:1},{a:1,b:1,c:2}, {a:1,b:2,c:3},{a:1,b:2,c:4}, {a:2,b:1,c:5},{a:2,b:1,c:6}, {a:2,b:2,c:7},{a:2,b:2,c:8}] | unique_by(.a,.b)',
            [
              [
                { a: 1, b: 1, c: 1 },
                { a: 1, b: 2, c: 3 },
                { a: 2, b: 1, c: 5 },
                { a: 2, b: 2, c: 7 },
              ],
            ]
          );
        });
      });
    });
    // describe('until/2', () => {
    //   it('until/2', () => {
    //     throw notImplementedError('until/2');
    //   });
    // });
    // describe('values/0', () => {
    //   it('values/0', () => {
    //     throw notImplementedError('values/0');
    //   });
    // });
    // describe('walk/1', () => {
    //   it('walk/1', () => {
    //     throw notImplementedError('walk/1');
    //   });
    // });
    // describe('while/2', () => {
    //   it('while/2', () => {
    //     throw notImplementedError('while/2');
    //   });
    // });
    describe('with_entries/1', () => {
      it('identity', () => {
        expectCode('{a:1, b:2} | with_entries(.)', [{ a: 1, b: 2 }]);
      });
      it('transformation', () => {
        expectCode(
          '{a:1, b:2} | with_entries({key: (.key + "X"), value: (.value*2)})',
          [{ aX: 2, bX: 4 }]
        );
      });
      it('error', () => {
        expectCodeError('0 | with_entries(.)');
      });
    });
  });
});
