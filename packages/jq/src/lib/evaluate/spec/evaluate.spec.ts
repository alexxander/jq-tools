import { evaluate } from '../evaluate';
import {
  comparisonTest,
  helper,
  testCode,
  testCodeError,
  testCodePartial,
  testReduceAndForeach,
} from './specUtils.spec';

describe('evaluate', () => {
  it('empty program', () => {
    expect(helper('', 100)).toEqual([100]);
  });
  describe('index', () => {
    it('ident', () => {
      expect(helper('.a', { a: 255 })).toEqual([255]);
    });
    it('nested', () => {
      expect(helper('.a.b[0].c', { a: { b: [{ c: 100 }] } })).toEqual([100]);
    });
    it('empty input', () => {
      expect(helper('[][].a')).toEqual([]);
    });
    describe('optional', () => {
      it('simple', () => {
        expect(helper('.a?', 100)).toEqual([]);
      });
      it('with child property', () => {
        expect(helper('.a?.b', 100)).toEqual([]);
      });
    });
    it('str', () => {
      expect(helper('."$abc"', { $abc: 100 })).toEqual([100]);
    });
    it('num', () => {
      expect(helper('.[1]', [0, 100])).toEqual([100]);
    });
    it('expression', () => {
      expect(helper('.[1+3*2]', [0, 1, 2, 3, 4, 5, 6, 100])).toEqual([100]);
    });

    describe('cannot index', () => {
      testCodeError('null[null]');
      testCodeError('null[false]');
      testCodeError('null[0]');
      testCodeError('null[""]');
      testCodeError('null[[]]');
      testCodeError('null[{}]');

      testCodeError('false[null]');
      testCodeError('false[false]');
      testCodeError('false[0]');
      testCodeError('false[""]');
      testCodeError('false[[]]');
      testCodeError('false[{}]');

      testCodeError('0[null]');
      testCodeError('0[false]');
      testCodeError('0[0]');
      testCodeError('0[""]');
      testCodeError('0[[]]');
      testCodeError('0[{}]');

      testCodeError('""[null]');
      testCodeError('""[false]');
      testCodeError('""[0]');
      testCodeError('""[""]');
      testCodeError('""[[]]');
      testCodeError('""[{}]');

      testCodeError('[][null]');
      testCodeError('[][false]');
      testCodeError('[][""]');
      testCodeError('[][[]]');
      testCodeError('[][{}]');

      testCodeError('{}[null]');
      testCodeError('{}[false]');
      testCodeError('{}[0]');
      testCodeError('{}[[]]');
      testCodeError('{}[{}]');

      testCodePartial('1,2,"" | [1,2,3,4,5][.]', [2, 3]);
    });
  });
  describe('slice', () => {
    it('full', () => {
      expect(
        helper(
          '.[3:5]',
          [0, 1, 2, 30, 40, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        )
      ).toEqual([[30, 40]]);
    });
    it('left', () => {
      expect(helper('.[1:]', [1, 2, 3])).toEqual([[2, 3]]);
    });
    it('right', () => {
      expect(helper('.[:2]', [0, 1, 2, 3, 4, 5])).toEqual([[0, 1]]);
    });
    it('both omitted', () => {
      // NOTE: The original jq implementation would throw an error here
      expect(helper('.[:]', [0, 1, 2, 3, 4, 5])).toEqual([[0, 1, 2, 3, 4, 5]]);
    });
    it('expressions', () => {
      expect(
        helper(
          '.[1+3*1:5+3+2]',
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        )
      ).toEqual([[4, 5, 6, 7, 8, 9]]);
    });
    it('combinations', () => {
      expect(helper('1,2 | [0,1,2,3,4,5][1,2:3,4]')).toEqual([
        [1, 2],
        [1, 2, 3],
        [2],
        [2, 3],
        [1, 2],
        [1, 2, 3],
        [2],
        [2, 3],
      ]);
    });
    describe('negative', () => {
      it('left', () => {
        expect(helper('[0,1,2,3,4,5][-5:5]')).toEqual([[1, 2, 3, 4]]);
      });
      it('right', () => {
        expect(helper('[0,1,2,3,4,5][:-3]')).toEqual([[0, 1, 2]]);
      });
      it('both', () => {
        expect(helper('[0,1,2,3,4,5][-3:-1]')).toEqual([[3, 4]]);
      });
    });

    describe('cannot slice', () => {
      testCodeError('null[null:]');
      testCodeError('null[false:]');
      testCodeError('null[0:]');
      testCodeError('null["":]');
      testCodeError('null[[]:]');
      testCodeError('null[{}:]');

      testCodeError('false[null:]');
      testCodeError('false[false:]');
      testCodeError('false[0:]');
      testCodeError('false["":]');
      testCodeError('false[[]:]');
      testCodeError('false[{}:]');

      testCodeError('0[null:]');
      testCodeError('0[false:]');
      testCodeError('0[0:]');
      testCodeError('0["":]');
      testCodeError('0[[]:]');
      testCodeError('0[{}:]');

      testCodeError('""[null:]');
      testCodeError('""[false:]');
      testCodeError('""[0:]');
      testCodeError('""["":]');
      testCodeError('""[[]:]');
      testCodeError('""[{}:]');

      testCodeError('[][null:]');
      testCodeError('[][false:]');
      testCodeError('[]["":]');
      testCodeError('[][[]:]');
      testCodeError('[][{}:]');

      testCodeError('[][:null]');
      testCodeError('[][:false]');
      testCodeError('[][:""]');
      testCodeError('[][:[]]');
      testCodeError('[][:{}]');

      testCodeError('{}[null:]');
      testCodeError('{}[false:]');
      testCodeError('{}[0:]');
      testCodeError('{}["":]');
      testCodeError('{}[[]:]');
      testCodeError('{}[{}:]');
    });
  });
  describe('iterator', () => {
    it('simple array', () => {
      expect(helper('.[]', [1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });
    it('nested array', () => {
      expect(helper('[[1,2,3],[4,5,6],[7,8,9]][][]')).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
    });
    it('object', () => {
      expect(helper('{a:1, b:2, c:3, d:4}[]')).toEqual([1, 2, 3, 4]);
    });
    it('empty', () => {
      expect(helper('[][][]')).toEqual([]);
    });
    it('cannot iterate', () => {
      expect(() => helper('.[]', 5)).toThrowErrorMatchingSnapshot();
    });
  });
  it('pipe', () => {
    expect(helper('. as $var | 0,1,2 | $var[.]', [1, 2, 3, 4, 5])).toEqual([
      1, 2, 3,
    ]);
  });
  describe('simple expressions', () => {
    describe('identity', () => {
      it('.', () => {
        expect(helper('.', 100)).toEqual([100]);
      });
      it('1,2,3|.', () => {
        expect(helper('1,2,3|.', 100)).toEqual([1, 2, 3]);
      });
    });
    it('recursive descent', () => {
      expect(helper('..', { a: [0, 1], b: 2, c: [{ d: 1 }] })).toEqual([
        { a: [0, 1], b: 2, c: [{ d: 1 }] },
        [0, 1],
        0,
        1,
        2,
        [{ d: 1 }],
        { d: 1 },
        1,
      ]);
    });
    it('num', () => {
      expect(helper('255', 100)).toEqual([255]);
    });
    it('string', () => {
      expect(helper('"my string"', 100)).toEqual(['my string']);
    });
    it('bool', () => {
      expect(helper('false', 100)).toEqual([false]);
    });
    it('null', () => {
      expect(helper('null', 100)).toEqual([null]);
    });
    describe('multi', () => {
      it('string', () => {
        expect(helper('1,2|"a"', 100)).toEqual(['a', 'a']);
      });
      it('number', () => {
        expect(helper('1,2|5', 100)).toEqual([5, 5]);
      });
      it('bool', () => {
        expect(helper('1,2|true', 100)).toEqual([true, true]);
      });
      it('null', () => {
        expect(helper('1,2|null', 100)).toEqual([null, null]);
      });
    });
  });
  describe('def', () => {
    it('inline', () => {
      expect(
        helper('1 + 2 + - def test: .; def test(a): .; 1 + 4', 100)
      ).toEqual([-2]);
    });
    it('at eof', () => {
      expect(helper('def test: .;', 100)).toEqual([100]);
    });
    it('var argument', () => {
      expect(helper('def func($a): $a|$a; func(.*2)', 2)).toEqual([4]);
    });
    describe('filter argument', () => {
      it('def func(a): a|a;', () => {
        expect(helper('def func(a): a|a; func(.*2)', 2)).toEqual([8]);
      });
      it('def func(a): 10|a;', () => {
        expect(helper('def func(a): 10|a; 5 | func(.*2)')).toEqual([20]);
      });
    });
    it('complex', () => {
      expect(
        helper('def func(a; $b): (.|a)*(3|a)*(.|$b)*(7|$b); func(.*2; .*5)', 5)
      ).toEqual([37500]);
    });
    describe('multi', () => {
      it('input', () => {
        expect(helper('def test($a): $a+1; 1,2,3 | test(.)')).toEqual([
          2, 3, 4,
        ]);
      });
      it('filter body', () => {
        expect(helper('def test: 1,2,3; test')).toEqual([1, 2, 3]);
      });
      it('var argument', () => {
        expect(helper('def test($a): $a+1; test(1,2,3)')).toEqual([2, 3, 4]);
      });
      it('2 var arguments', () => {
        expect(
          helper('def test($a; $b): "\\($a):\\($b)"; test(1,2; 1,2)')
        ).toEqual(['1:1', '1:2', '2:1', '2:2']);
      });
      describe('mixed argument types', () => {
        it('vvf', () => {
          expect(
            helper(
              'def test($a; $b; c): "\\($a):\\($b):\\(c)"; test(1,2; 1,2; 1,2)'
            )
          ).toEqual([
            '1:1:1',
            '1:1:2',
            '1:2:1',
            '1:2:2',
            '2:1:1',
            '2:1:2',
            '2:2:1',
            '2:2:2',
          ]);
        });
        it('vfv', () => {
          expect(
            helper(
              'def test($a; b; $c): "\\($a):\\(b):\\($c)"; test(1,2; 1,2; 1,2)'
            )
          ).toEqual([
            '1:1:1',
            '1:2:1',
            '1:1:2',
            '1:2:2',
            '2:1:1',
            '2:2:1',
            '2:1:2',
            '2:2:2',
          ]);
        });
        it('fvv', () => {
          expect(
            helper(
              'def test(a; $b; $c): "\\(a):\\($b):\\($c)"; test(1,2; 1,2; 1,2)'
            )
          ).toEqual([
            '1:1:1',
            '2:1:1',
            '1:1:2',
            '2:1:2',
            '1:2:1',
            '2:2:1',
            '1:2:2',
            '2:2:2',
          ]);
        });
        it('fvfv', () => {
          expect(
            helper(
              'def test(a; $b; c; $d): "\\(a):\\($b):\\(c):\\($d)"; test(1,2; 1,2; 1,2; 1,2)'
            )
          ).toEqual([
            '1:1:1:1',
            '2:1:1:1',
            '1:1:2:1',
            '2:1:2:1',
            '1:1:1:2',
            '2:1:1:2',
            '1:1:2:2',
            '2:1:2:2',
            '1:2:1:1',
            '2:2:1:1',
            '1:2:2:1',
            '2:2:2:1',
            '1:2:1:2',
            '2:2:1:2',
            '1:2:2:2',
            '2:2:2:2',
          ]);
        });
        it('fvfv + multi in filter body', () => {
          expect(
            helper(
              'def test(a; $b; c; $d): "a", "b" | "\\(a):\\($b):\\(c):\\($d)::\\(.)"; test(1,2; 1,2; 1,2; 1,2)'
            )
          ).toEqual([
            '1:1:1:1::a',
            '2:1:1:1::a',
            '1:1:2:1::a',
            '2:1:2:1::a',
            '1:1:1:1::b',
            '2:1:1:1::b',
            '1:1:2:1::b',
            '2:1:2:1::b',
            '1:1:1:2::a',
            '2:1:1:2::a',
            '1:1:2:2::a',
            '2:1:2:2::a',
            '1:1:1:2::b',
            '2:1:1:2::b',
            '1:1:2:2::b',
            '2:1:2:2::b',
            '1:2:1:1::a',
            '2:2:1:1::a',
            '1:2:2:1::a',
            '2:2:2:1::a',
            '1:2:1:1::b',
            '2:2:1:1::b',
            '1:2:2:1::b',
            '2:2:2:1::b',
            '1:2:1:2::a',
            '2:2:1:2::a',
            '1:2:2:2::a',
            '2:2:2:2::a',
            '1:2:1:2::b',
            '2:2:1:2::b',
            '1:2:2:2::b',
            '2:2:2:2::b',
          ]);
        });
      });
    });
  });
  describe('operators', () => {
    describe('unary', () => {
      it('-1', () => {
        expect(helper('-1', 100)).toEqual([-1]);
      });
      it('-.', () => {
        expect(helper('-.', 100)).toEqual([-100]);
      });
      it('--1', () => {
        expect(helper('--1', 100)).toEqual([1]);
      });
      it('---1', () => {
        expect(helper('---1', 100)).toEqual([-1]);
      });
      it('minus in addition', () => {
        expect(helper('1+-8', 100)).toEqual([-7]);
      });
      it('minus foreach', () => {
        expect(
          helper('- foreach .[] as $item (0; . + $item) | - .', [1, 2, 3, 4])
        ).toEqual([1, 3, 6, 10]);
      });
      it('empty argument', () => {
        expect(helper('-([][])')).toEqual([]);
      });
    });
    describe('binary', () => {
      describe('addition', () => {
        describe('null', () => {
          it('1+null', () => {
            expect(helper('1+null', 100)).toEqual([1]);
          });
          it('null+null', () => {
            expect(helper('null+null', 100)).toEqual([null]);
          });
          it('"a"+null', () => {
            expect(helper('"a"+null', 100)).toEqual(['a']);
          });
          it('null+.', () => {
            expect(helper('null+.', 100)).toEqual([100]);
          });
          it('null+100', () => {
            expect(helper('null+100', 100)).toEqual([100]);
          });
          it('null+[1]', () => {
            expect(helper('null+[1]', 100)).toEqual([[1]]);
          });
          it('{a:1}+null', () => {
            expect(helper('{a:1}+null', 100)).toEqual([{ a: 1 }]);
          });
          it('[1]+null', () => {
            expect(helper('[1]+null', 100)).toEqual([[1]]);
          });
        });
        it('number', () => {
          expect(helper('1+2', 100)).toEqual([3]);
        });
        it('string', () => {
          expect(helper('"a"+"b"', 100)).toEqual(['ab']);
        });
        it('array', () => {
          expect(helper('[1,2,3]+[4,5,6]', 100)).toEqual([[1, 2, 3, 4, 5, 6]]);
        });
        it('object', () => {
          expect(helper('{a: 1, b: 2}+{b: 3, c: 4}', 100)).toEqual([
            { a: 1, b: 3, c: 4 },
          ]);
        });
        it('object', () => {
          expect(helper('{a: 1, b: {a:1}}+{b: {b:2}, c: 4}', 100)).toEqual([
            { a: 1, b: { b: 2 }, c: 4 },
          ]);
        });
        it('combinations - number', () => {
          expect(helper('(2,3,5)+(2,3,5)', 100)).toEqual([
            4, 5, 7, 5, 6, 8, 7, 8, 10,
          ]);
        });
        it('combinations - string', () => {
          expect(helper('("1","2","3")+("1","2","3")', 100)).toEqual([
            '11',
            '21',
            '31',
            '12',
            '22',
            '32',
            '13',
            '23',
            '33',
          ]);
        });
        it('pipe', () => {
          expect(helper('1,2,3|1+1', 100)).toEqual([2, 2, 2]);
        });
        describe('incompatible types', () => {
          it('1+"a"', () => {
            expect(() => helper('1+"a"', 100)).toThrowErrorMatchingSnapshot();
          });
          it('"a"+[]', () => {
            expect(() => helper('"a"+[]', 100)).toThrowErrorMatchingSnapshot();
          });
        });
      });
      describe('subtraction', () => {
        it('number', () => {
          expect(helper('1-2', 100)).toEqual([-1]);
          expect(helper('100-85', 100)).toEqual([15]);
        });
        it('array', () => {
          expect(
            helper(
              '["a", 2, [1], [1], {a:5}, {b:10}, [2]] - ["a", [1], {b:10}]',
              100
            )
          ).toEqual([[2, { a: 5 }, [2]]]);
        });
        describe('incompatible types', () => {
          it('null-"a"', () => {
            expect(() =>
              helper('null-"a"', 100)
            ).toThrowErrorMatchingSnapshot();
          });
          it('"1"-1', () => {
            expect(() => helper('"1"-1', 100)).toThrowErrorMatchingSnapshot();
          });
        });
      });
      describe('comma', () => {
        it('simple', () => {
          expect(helper('1,2,.,4,5,.,7,8,9,10', 100)).toEqual([
            1, 2, 100, 4, 5, 100, 7, 8, 9, 10,
          ]);
        });
        it('multi', () => {
          expect(helper('1,2,3|.,2,3', 100)).toEqual([
            1, 2, 3, 2, 2, 3, 3, 2, 3,
          ]);
        });
      });
      describe('multiplication', () => {
        it('number * number', () => {
          expect(helper('2*5', 100)).toEqual([10]);
        });
        describe('number * string', () => {
          it('int * string', () => {
            expect(helper('5 * "abc"', 100)).toEqual(['abcabcabcabcabc']);
          });
          it('string * int', () => {
            expect(helper('"xy" * 3', 100)).toEqual(['xyxyxy']);
          });
          it('string * float', () => {
            expect(helper('"a" * 3.99999', 100)).toEqual(['aaa']);
          });
          it('string * 0', () => {
            expect(helper('"xy" * 0', 100)).toEqual([null]);
          });
          it('string * -1', () => {
            expect(helper('"xy" * -1', 100)).toEqual([null]);
          });
          it('string * -100', () => {
            expect(helper('"xy" * -100', 100)).toEqual([null]);
          });
        });
        it('combinations', () => {
          expect(helper('(2,3,5)*(2,3,5)', 100)).toEqual([
            4, 6, 10, 6, 9, 15, 10, 15, 25,
          ]);
        });
        describe('incompatible types', () => {
          it('"a" * "b"', () => {
            expect(() =>
              helper('"a" * "b"', 100)
            ).toThrowErrorMatchingSnapshot();
          });
          it('[] * "b"', () => {
            expect(() =>
              helper('[] * "b"', 100)
            ).toThrowErrorMatchingSnapshot();
          });
          it('5 * [1,2,3]', () => {
            expect(() =>
              helper('5 * [1,2,3]', 100)
            ).toThrowErrorMatchingSnapshot();
          });
        });
      });
      describe('division', () => {
        it('4 / 2', () => {
          expect(helper('4 / 2', 100)).toEqual([2]);
        });
        it('5 / 2', () => {
          expect(helper('5 / 2', 100)).toEqual([2.5]);
        });
        it('5 / 0', () => {
          expect(() => helper('5 / 0', 100)).toThrowErrorMatchingSnapshot();
        });
        it('string / string', () => {
          expect(helper('"abc::def::ghi::jkl::mno::pqr" / "::"', 100)).toEqual([
            ['abc', 'def', 'ghi', 'jkl', 'mno', 'pqr'],
          ]);
        });
        describe('incompatible types', () => {
          it('"abc" / 5', () => {
            expect(() =>
              helper('"abc" / 5', 100)
            ).toThrowErrorMatchingSnapshot();
          });
          it('[] / 3', () => {
            expect(() => helper('[] / 3', 100)).toThrowErrorMatchingSnapshot();
          });
          it('5 / [1,2,3]', () => {
            expect(() =>
              helper('5 / [1,2,3]', 100)
            ).toThrowErrorMatchingSnapshot();
          });
        });
      });
      describe('modulo', () => {
        it('4 % 2', () => {
          expect(helper('4 % 2', 100)).toEqual([0]);
        });
        it('5 % 2', () => {
          expect(helper('5 % 2', 100)).toEqual([1]);
        });
        it('5 % 0', () => {
          expect(() => helper('5 % 0', 100)).toThrowErrorMatchingSnapshot();
        });
        describe('float', () => {
          it('5.2 % 2', () => {
            expect(helper('5.2 % 2', 100)).toEqual([1]);
          });
          it('5 % 2.5', () => {
            expect(helper('5 % 2.5', 100)).toEqual([1]);
          });
          it('5 % 0.2', () => {
            expect(() => helper('5 % 0.2', 100)).toThrowErrorMatchingSnapshot();
          });
        });
        describe('incompatible types', () => {
          it('"abc" % 5', () => {
            expect(() =>
              helper('"abc" % 5', 100)
            ).toThrowErrorMatchingSnapshot();
          });
          it('[] % 3', () => {
            expect(() => helper('[] % 3', 100)).toThrowErrorMatchingSnapshot();
          });
          it('5 % [1,2,3]', () => {
            expect(() =>
              helper('5 % [1,2,3]', 100)
            ).toThrowErrorMatchingSnapshot();
          });
        });
      });
      describe('comparison', () => {
        describe('==', () => {
          it('5==5', () => {
            expect(helper('5==5')).toEqual([true]);
          });
          it('"a"=="a"', () => {
            expect(helper('"a"=="a"')).toEqual([true]);
          });
          it('{}=={}', () => {
            expect(helper('{}=={}')).toEqual([true]);
          });
          it('{a: ["a", 1]}=={a: ["a", 1]}', () => {
            expect(helper('{a: ["a", 1]}=={a: ["a", 1]}')).toEqual([true]);
          });
          it('5==8', () => {
            expect(helper('5==8')).toEqual([false]);
          });
          it('"abc"=="def"', () => {
            expect(helper('"abc"=="def"')).toEqual([false]);
          });
          it('"1" == 1', () => {
            expect(helper('"1" == 1')).toEqual([false]);
          });
          it('[2]==[1]', () => {
            expect(helper('[2]==[1]')).toEqual([false]);
          });
        });
        describe('!=', () => {
          it('5!=5', () => {
            expect(helper('5!=5')).toEqual([false]);
          });
          it('"a"!="a"', () => {
            expect(helper('"a"!="a"')).toEqual([false]);
          });
          it('{}!={}', () => {
            expect(helper('{}!={}')).toEqual([false]);
          });
          it('{a: ["a", 1]}!={a: ["a", 1]}', () => {
            expect(helper('{a: ["a", 1]}!={a: ["a", 1]}')).toEqual([false]);
          });
          it('5!=8', () => {
            expect(helper('5!=8')).toEqual([true]);
          });
          it('"abc"!="def"', () => {
            expect(helper('"abc"!="def"')).toEqual([true]);
          });
          it('"1" != 1', () => {
            expect(helper('"1" != 1')).toEqual([true]);
          });
          it('[2]!=[1]', () => {
            expect(helper('[2]!=[1]')).toEqual([true]);
          });
        });
        describe('all comparison operators', () => {
          describe('null', () => {
            comparisonTest('null', 'null', 0);
          });
          describe('boolean', () => {
            comparisonTest('true', 'true', 0);
            comparisonTest('true', 'false', 1);
            comparisonTest('false', 'true', -1);
          });
          describe('number', () => {
            comparisonTest('5', '5', 0);
            comparisonTest('8', '5', 1);
            comparisonTest('-10', '3', -1);
          });
          describe('string', () => {
            comparisonTest('""', '""', 0);
            comparisonTest('""', '"a"', -1);
            comparisonTest('"a"', '""', 1);
            comparisonTest('"a"', '"a"', 0);
            comparisonTest('"b"', '"a"', 1);
            comparisonTest('"a"', '"b"', -1);
            comparisonTest('"bbb"', '"bbb"', 0);
            comparisonTest('"bbc"', '"bbb"', 1);
            comparisonTest('"bbb"', '"bbc"', -1);
            comparisonTest('"bb"', '"abxxx"', 1);
            comparisonTest('"abxxx"', '"bb"', -1);
            comparisonTest('"abcdef"', '"abcdefx"', -1);
            comparisonTest('"abcdefx"', '"abcdef"', 1);
          });
          describe('array', () => {
            comparisonTest('[2]', '[2]', 0);
            comparisonTest('[2]', '[1]', 1);
            comparisonTest('[1]', '[2]', -1);
            comparisonTest('[]', '[]', 0);
            comparisonTest('[]', '["a"]', -1);
            comparisonTest('["a"]', '[]', 1);
            comparisonTest('["a"]', '["a"]', 0);
            comparisonTest('["b"]', '["a"]', 1);
            comparisonTest('["a"]', '["b"]', -1);
            comparisonTest('["b","b","b"]', '["b","b","b"]', 0);
            comparisonTest('["b","b","c"]', '["b","b","b"]', 1);
            comparisonTest('["b","b","b"]', '["b","b","c"]', -1);
            comparisonTest('["b","b"]', '["a","b","x","x","x"]', 1);
            comparisonTest('["a","b","x","x","x"]', '["b","b"]', -1);
            comparisonTest(
              '["a","b","c","d","e","f"]',
              '["a","b","c","d","e","f","x"]',
              -1
            );
            comparisonTest(
              '["a","b","c","d","e","f","x"]',
              '["a","b","c","d","e","f"]',
              1
            );
            describe('nested', () => {
              comparisonTest('[[[1]]]', '[[[1]]]', 0);
              comparisonTest('[[[2]]]', '[[[1]]]', 1);
              comparisonTest('[[[1]]]', '[[[2]]]', -1);
            });
          });
          describe('object', () => {
            comparisonTest('{}', '{}', 0);
            describe('single key', () => {
              comparisonTest('{"a": 1}', '{"a": 1}', 0);
              comparisonTest('{"b": 1}', '{"a": 1}', 1);
              comparisonTest('{"a": 1}', '{"b": 1}', -1);
              comparisonTest('{"aa": 1}', '{"aa": 1}', 0);
              comparisonTest('{"ab": 1}', '{"aa": 1}', 1);
              comparisonTest('{"aa": 1}', '{"ab": 1}', -1);
              comparisonTest('{"aa": 1}', '{"aaa": 1}', -1);
              comparisonTest('{"aaa": 1}', '{"aa": 1}', 1);
            });
            describe('two keys', () => {
              comparisonTest('{"a": 1, "b": 1}', '{"a": 1, "b": 1}', 0);
              comparisonTest('{"a": 1, "c": 1}', '{"a": 1, "b": 1}', 1);
              comparisonTest('{"a": 1, "b": 1}', '{"a": 1, "c": 1}', -1);
              comparisonTest('{"b": 1, "a": 1}', '{"b": 1, "a": 1}', 0);
              comparisonTest('{"c": 1, "a": 1}', '{"b": 1, "a": 1}', 1);
              comparisonTest('{"b": 1, "a": 1}', '{"c": 1, "a": 1}', -1);
            });
            describe('different key counts', () => {
              comparisonTest('{"a": 1}', '{"a": 1, "b": 1}', -1);
              comparisonTest('{"a": 1, "b": 1}', '{"a": 1}', 1);
              comparisonTest('{"x": 1}', '{"a": 1, "b": 1}', 1);
              comparisonTest('{"a": 1, "b": 1}', '{"x": 1}', -1);
            });
            describe('same keys', () => {
              comparisonTest('{"a": 1, "b": 1}', '{"a": 1, "b": 1}', 0);
              comparisonTest('{"a": 2, "b": 1}', '{"a": 1, "b": 1}', 1);
              comparisonTest('{"a": 1, "b": 1}', '{"a": 2, "b": 1}', -1);
              comparisonTest('{"a": 1, "b": 2}', '{"a": 1, "b": 1}', 1);
              comparisonTest('{"a": 1, "b": 1}', '{"a": 1, "b": 2}', -1);
            });
          });
          describe('mixed', () => {
            comparisonTest('null', 'false', -1);
            comparisonTest('false', 'null', 1);
            comparisonTest('null', 'true', -1);
            comparisonTest('true', 'null', 1);
            comparisonTest('false', '1', -1);
            comparisonTest('1', 'false', 1);
            comparisonTest('true', '1', -1);
            comparisonTest('1', 'true', 1);
            comparisonTest('1', '"1"', -1);
            comparisonTest('"1"', '1', 1);
            comparisonTest('""', '[]', -1);
            comparisonTest('[]', '""', 1);
            comparisonTest('[]', '{}', -1);
            comparisonTest('{}', '[]', 1);
            comparisonTest('null', '{}', -1);
            comparisonTest('{}', 'null', 1);
            comparisonTest('{a: ["a", 1]}', '{a: ["a", 1]}', 0);
          });
        });
      });
      describe('boolean', () => {
        describe('and', () => {
          it('true and true', () => {
            expect(helper('true and true')).toEqual([true]);
          });
          it('false and true', () => {
            expect(helper('false and true')).toEqual([false]);
          });
          it('true and false', () => {
            expect(helper('true and false')).toEqual([false]);
          });
          it('false and false', () => {
            expect(helper('false and false')).toEqual([false]);
          });
        });
        describe('or', () => {
          it('true or true', () => {
            expect(helper('true or true')).toEqual([true]);
          });
          it('false or true', () => {
            expect(helper('false or true')).toEqual([true]);
          });
          it('true or false', () => {
            expect(helper('true or false')).toEqual([true]);
          });
          it('false or false', () => {
            expect(helper('false or false')).toEqual([false]);
          });
        });
      });
      describe('alternative', () => {
        testCode('false // true', [true]);
        testCode('false // false', [false]);
        testCode('null // 5', [5]);
        testCode('null // "abc"', ['abc']);
        testCode('"a" // true', ['a']);
        testCode('"" // false', ['']);
        testCode('0 // 5', [0]);
        testCode('-1 // "abc"', [-1]);
        describe('chain', () => {
          testCode('false // false // false // true', [true]);
          testCode('false // 0 // false // true', [0]);
          testCode('0 // false // false // true', [0]);
          testCode('0 // 1 // 2 // 3', [0]);
        });
      });
      describe('precedence', () => {
        it('simple', () => {
          expect(helper('1+2+3+4', 100)).toEqual([10]);
        });
        it('addition vs multiplication', () => {
          expect(helper('1+2*5+3', 100)).toEqual([14]);
        });
        it('addition vs multiplication with brackets', () => {
          expect(helper('(1+2)*(5+3)', 100)).toEqual([24]);
        });
        it('pipe and comma', () => {
          expect(helper('2 , . | 3 , .', 100)).toEqual([3, 2, 3, 100]);
        });
        it('pipe and comma with brackets', () => {
          expect(helper('2 , (. | 3) , .', 100)).toEqual([2, 3, 100]);
        });
        it('bool', () => {
          expect(helper('false and true or true')).toEqual([true]);
          expect(helper('false and (true or true)')).toEqual([false]);
          expect(helper('true or true and false')).toEqual([true]);
          expect(helper('(true or true) and false')).toEqual([false]);
        });
      });
      it('empty argument', () => {
        expect(helper('([][]) + 5')).toEqual([]);
      });
    });
  });
  describe('array', () => {
    it('array', () => {
      expect(helper('[1,2,3]', 100)).toEqual([[1, 2, 3]]);
    });
    it('multi', () => {
      expect(helper('1,2,3|[.,2,3]', 100)).toEqual([
        [1, 2, 3],
        [2, 2, 3],
        [3, 2, 3],
      ]);
    });
    it('empty', () => {
      expect(helper('[]', 100)).toEqual([[]]);
    });
  });
  describe('object', () => {
    it('empty', () => {
      expect(helper('{}')).toEqual([{}]);
    });
    it('simple', () => {
      expect(helper('{a: 1, b: 2 }')).toEqual([{ a: 1, b: 2 }]);
    });
    it('copy values', () => {
      expect(helper('{a, b, c: 100, d: 200 }', { a: 1, b: 2, c: 3 })).toEqual([
        { a: 1, b: 2, c: 100, d: 200 },
      ]);
    });
    it('combinations', () => {
      expect(
        helper('1,2 | {x: ., ("a1","a2"):("1","2"),("b1","b2"):("1","2")}', 100)
      ).toEqual([
        { x: 1, a1: '1', b1: '1' },
        { x: 1, a1: '1', b1: '2' },
        { x: 1, a1: '1', b2: '1' },
        { x: 1, a1: '1', b2: '2' },
        { x: 1, a1: '2', b1: '1' },
        { x: 1, a1: '2', b1: '2' },
        { x: 1, a1: '2', b2: '1' },
        { x: 1, a1: '2', b2: '2' },
        { x: 1, a2: '1', b1: '1' },
        { x: 1, a2: '1', b1: '2' },
        { x: 1, a2: '1', b2: '1' },
        { x: 1, a2: '1', b2: '2' },
        { x: 1, a2: '2', b1: '1' },
        { x: 1, a2: '2', b1: '2' },
        { x: 1, a2: '2', b2: '1' },
        { x: 1, a2: '2', b2: '2' },

        { x: 2, a1: '1', b1: '1' },
        { x: 2, a1: '1', b1: '2' },
        { x: 2, a1: '1', b2: '1' },
        { x: 2, a1: '1', b2: '2' },
        { x: 2, a1: '2', b1: '1' },
        { x: 2, a1: '2', b1: '2' },
        { x: 2, a1: '2', b2: '1' },
        { x: 2, a1: '2', b2: '2' },
        { x: 2, a2: '1', b1: '1' },
        { x: 2, a2: '1', b1: '2' },
        { x: 2, a2: '1', b2: '1' },
        { x: 2, a2: '1', b2: '2' },
        { x: 2, a2: '2', b1: '1' },
        { x: 2, a2: '2', b1: '2' },
        { x: 2, a2: '2', b2: '1' },
        { x: 2, a2: '2', b2: '2' },
      ]);
    });
    it('nested combinations', () => {
      expect(
        helper('{("a1","a2"):{("1","2"):("1","2")},("b1","b2"):("1","2")}', 100)
      ).toEqual([
        { a1: { '1': '1' }, b1: '1' },
        { a1: { '1': '1' }, b1: '2' },
        { a1: { '1': '1' }, b2: '1' },
        { a1: { '1': '1' }, b2: '2' },
        { a1: { '1': '2' }, b1: '1' },
        { a1: { '1': '2' }, b1: '2' },
        { a1: { '1': '2' }, b2: '1' },
        { a1: { '1': '2' }, b2: '2' },
        { a1: { '2': '1' }, b1: '1' },
        { a1: { '2': '1' }, b1: '2' },
        { a1: { '2': '1' }, b2: '1' },
        { a1: { '2': '1' }, b2: '2' },
        { a1: { '2': '2' }, b1: '1' },
        { a1: { '2': '2' }, b1: '2' },
        { a1: { '2': '2' }, b2: '1' },
        { a1: { '2': '2' }, b2: '2' },
        { a2: { '1': '1' }, b1: '1' },
        { a2: { '1': '1' }, b1: '2' },
        { a2: { '1': '1' }, b2: '1' },
        { a2: { '1': '1' }, b2: '2' },
        { a2: { '1': '2' }, b1: '1' },
        { a2: { '1': '2' }, b1: '2' },
        { a2: { '1': '2' }, b2: '1' },
        { a2: { '1': '2' }, b2: '2' },
        { a2: { '2': '1' }, b1: '1' },
        { a2: { '2': '1' }, b1: '2' },
        { a2: { '2': '1' }, b2: '1' },
        { a2: { '2': '1' }, b2: '2' },
        { a2: { '2': '2' }, b1: '1' },
        { a2: { '2': '2' }, b1: '2' },
        { a2: { '2': '2' }, b2: '1' },
        { a2: { '2': '2' }, b2: '2' },
      ]);
    });
    it('complex', () => {
      expect(
        helper(
          '"val" as $var | {a: 1, "$a": 2, "@a": 3, "1": 4, ($var): 5, "\\($var):\\($var)": 6}',
          100
        )
      ).toEqual([{ a: 1, $a: 2, '@a': 3, '1': 4, val: 5, 'val:val': 6 }]);
    });
    it('keywords', () => {
      expect(helper('{label: 1, try: 2, catch: 3}', 100)).toEqual([
        { label: 1, try: 2, catch: 3 },
      ]);
    });
    it('trailing comma', () => {
      expect(helper('{a: 1, b: 2, }', 100)).toEqual([{ a: 1, b: 2 }]);
    });
  });
  describe('interpolation', () => {
    it('simple', () => {
      expect(helper('"\\(.):\\(.)"', 100)).toEqual(['100:100']);
    });
    it('null', () => {
      expect(helper('"\\(null)"')).toEqual(['null']);
    });
    it('boolean', () => {
      expect(helper('"\\(false)"')).toEqual(['false']);
    });
    it('array', () => {
      expect(helper('"\\([1, 2, 3])"')).toEqual(['[1,2,3]']);
    });
    it('object', () => {
      // NOTE: This slightly differs from the original jq implementation (as this library relies on the js object
      // implementation, in which positive integer keys do not have to be stored in insertion order)
      expect(helper('"\\({a:"a","1":1})"')).toEqual(['{"1":1,"a":"a"}']);
    });
    it('combinations', () => {
      expect(helper('1,2 | "\\(.):\\(1,2):\\(1,2):\\(1,2)"', 100)).toEqual([
        '1:1:1:1',
        '1:2:1:1',
        '1:1:2:1',
        '1:2:2:1',
        '1:1:1:2',
        '1:2:1:2',
        '1:1:2:2',
        '1:2:2:2',
        '2:1:1:1',
        '2:2:1:1',
        '2:1:2:1',
        '2:2:2:1',
        '2:1:1:2',
        '2:2:1:2',
        '2:1:2:2',
        '2:2:2:2',
      ]);
    });
  });
  describe('format', () => {
    describe('@base64', () => {
      describe('as filter', () => {
        it('null, false, true, 100', () => {
          expect(helper('null, false, true, 100 | @base64')).toEqual([
            'bnVsbA==',
            'ZmFsc2U=',
            'dHJ1ZQ==',
            'MTAw',
          ]);
        });
        it('str', () => {
          expect(helper('"Hello World!" | @base64')).toEqual([
            'SGVsbG8gV29ybGQh',
          ]);
        });
        it('array', () => {
          expect(helper('[1,2,3] | @base64')).toEqual(['WzEsMiwzXQ==']);
        });
        it('object', () => {
          expect(helper('{a: 1, b: 2, c: {a:3, b:4}} | @base64')).toEqual([
            'eyJhIjoxLCJiIjoyLCJjIjp7ImEiOjMsImIiOjR9fQ==',
          ]);
        });
      });
      it('interpolation', () => {
        expect(helper('@base64 "---\\("Hello World!")---"')).toEqual([
          '---SGVsbG8gV29ybGQh---',
        ]);
      });
    });
    describe('@base64d', () => {
      describe('as filter', () => {
        it('null, false, true, 100', () => {
          expect(
            helper('"bnVsbA==", "ZmFsc2U=", "dHJ1ZQ==", "MTAw" | @base64d')
          ).toEqual(['null', 'false', 'true', '100']);
        });
        it('str', () => {
          expect(helper('"SGVsbG8gV29ybGQh" | @base64d')).toEqual([
            'Hello World!',
          ]);
        });
        it('array', () => {
          expect(helper('"WzEsMiwzXQ==" | @base64d')).toEqual(['[1,2,3]']);
        });
        it('object', () => {
          expect(
            helper('"eyJhIjoxLCJiIjoyLCJjIjp7ImEiOjMsImIiOjR9fQ=="| @base64d')
          ).toEqual(['{"a":1,"b":2,"c":{"a":3,"b":4}}']);
        });
      });
      it('interpolation', () => {
        expect(helper('@base64d "---\\("SGVsbG8gV29ybGQh")---"')).toEqual([
          '---Hello World!---',
        ]);
      });
    });
    describe('undefined format', () => {
      it('error', () => {
        expect(() => helper('1 | @abc')).toThrowErrorMatchingSnapshot();
      });
      it('not applied', () => {
        expect(() => helper('@abc ""')).not.toThrow();
      });
    });
  });
  describe('filter', () => {
    it('without args', () => {
      expect(helper('length', 'abc')).toEqual([3]);
    });
    it('with one arg', () => {
      expect(helper('map(.+1)', [1, 2, 3])).toEqual([[2, 3, 4]]);
    });
    it('with multiple args', () => {
      expect(helper('[range(0;10;3)]', 100)).toEqual([[0, 3, 6, 9]]);
    });
  });
  describe('control structures', () => {
    describe('if', () => {
      it('if-then', () => {
        expect(helper('if true then "yes" end', 100)).toEqual(['yes']);
        expect(helper('if false then "yes" end', 100)).toEqual([]);
      });
      it('if-then-else', () => {
        expect(helper('if true then "yes" else "no" end', 100)).toEqual([
          'yes',
        ]);
        expect(helper('if false then "yes" else "no" end', 100)).toEqual([
          'no',
        ]);
      });
      describe('truthiness', () => {
        it('null', () => {
          expect(helper('if null then "yes" else "no" end')).toEqual(['no']);
        });
        it('false', () => {
          expect(helper('if false then "yes" else "no" end')).toEqual(['no']);
        });
        it('0', () => {
          expect(helper('if 0 then "yes" else "no" end')).toEqual(['yes']);
        });
        it('5', () => {
          expect(helper('if 5 then "yes" else "no" end')).toEqual(['yes']);
        });
        it('-150', () => {
          expect(helper('if -150 then "yes" else "no" end')).toEqual(['yes']);
        });
        it('""', () => {
          expect(helper('if "" then "yes" else "no" end')).toEqual(['yes']);
        });
        it('"hello"', () => {
          expect(helper('if "hello" then "yes" else "no" end')).toEqual([
            'yes',
          ]);
        });
        it('{}', () => {
          expect(helper('if {} then "yes" else "no" end')).toEqual(['yes']);
        });
      });
      it('if-then-elif-elif-else', () => {
        expect(
          helper(
            '.[] | if . == 1 then "a" elif . == 2 then "b" elif . == 3 then "c" else "d" end',
            [1, 2, 3, 4, 5]
          )
        ).toEqual(['a', 'b', 'c', 'd', 'd']);
      });
      it('multi', () => {
        expect(
          helper('if [1,2,3,4,5][] > 2 then "yes",1,true else "no",0,false end')
        ).toEqual([
          'no',
          0,
          false,
          'no',
          0,
          false,
          'yes',
          1,
          true,
          'yes',
          1,
          true,
          'yes',
          1,
          true,
        ]);
      });
      it('multi-elif', () => {
        expect(
          helper(
            'if true,true,false then 1 elif false, false, true then 2 elif true, false, true, false then 3 else 4 end'
          )
        ).toEqual([1, 1, 3, 4, 3, 4, 3, 4, 3, 4, 2]);
      });
    });

    describe('try', () => {
      it('try', () => {
        expect(helper('try error("ERROR!")', 100)).toEqual([]);
      });
      it('try-catch', () => {
        expect(helper('try error("ERROR!") catch .', 100)).toEqual(['ERROR!']);
      });
      it('short', () => {
        expect(helper('error("ERROR!")?', 100)).toEqual([]);
      });
    });
    describe('label-break', () => {
      it('foreach', () => {
        expect(
          helper(
            'label $out | foreach .[] as $item (0; if $item == 4 then break $out else $item end)',
            [1, 2, 3, 4, 5]
          )
        ).toEqual([1, 2, 3]);
      });
      it('try is not interfering', () => {
        expect(
          helper(
            'label $out | try foreach .[] as $item (0; if $item == 4 then break $out else $item end) catch .',
            [1, 2, 3, 4, 5]
          )
        ).toEqual([1, 2, 3]);
      });
      describe('undefined label', () => {
        it('no label defined', () => {
          expect(() => helper('break $out')).toThrowErrorMatchingSnapshot();
        });
        it('different label defined', () => {
          expect(() =>
            helper('label $a | break $b')
          ).toThrowErrorMatchingSnapshot();
        });
      });
    });
    describe('foreach & reduce', () => {
      testReduceAndForeach(
        'sum',
        (cmd) => `[10, 3, 7, 8, 5, 67] | ${cmd} .[] as $item (0; .+$item)`,
        [100],
        [10, 13, 20, 28, 33, 100]
      );
      testReduceAndForeach(
        'initial value',
        (cmd) => `[10, 3, 7, 8, 5, 67] | ${cmd} .[] as $item (25*4; .+$item)`,
        [200],
        [110, 113, 120, 128, 133, 200]
      );
      testReduceAndForeach(
        'identity as initial value',
        (cmd) => `[[1,2],[3,4],[5,6]] | ${cmd} .[] as $item (.; . + $item)`,
        [[[1, 2], [3, 4], [5, 6], 1, 2, 3, 4, 5, 6]],
        [
          [[1, 2], [3, 4], [5, 6], 1, 2],
          [[1, 2], [3, 4], [5, 6], 1, 2, 3, 4],
          [[1, 2], [3, 4], [5, 6], 1, 2, 3, 4, 5, 6],
        ]
      );
      testReduceAndForeach(
        'use last update value',
        (cmd) =>
          `[10, 3, 7, 8, 5, 67] | ${cmd} .[] as $item (0; .+$item, . + $item*2)`,
        [200],
        [10, 20, 23, 26, 33, 40, 48, 56, 61, 66, 133, 200]
      );
      testReduceAndForeach(
        'empty input',
        (cmd) => `[] | ${cmd} .[] as $item (10,20; .+$item)`,
        [10, 20],
        []
      );

      describe('no update value', () => {
        testReduceAndForeach(
          'all',
          (cmd) => `${cmd} [1,2,3][] as $item (100; [][])`,
          [null],
          []
        );
        testReduceAndForeach(
          'first',
          (cmd) =>
            `${cmd} [1,2,3][] as $item (100; if $item == 1 then [][] else "\\(.):\\($item)" end)`,
          ['null:2:3'],
          ['null:2', 'null:2:3']
        );

        testReduceAndForeach(
          'middle',
          (cmd) =>
            `${cmd} [1,2,3][] as $item (100; if $item == 2 then [][] else "\\(.):\\($item)" end)`,
          ['null:3'],
          ['100:1', 'null:3']
        );

        testReduceAndForeach(
          'last',
          (cmd) =>
            `${cmd} [1,2,3][] as $item (100; if $item == 3 then [][] else "\\(.):\\($item)" end)`,
          [null],
          ['100:1', '100:1:2']
        );
      });
      testReduceAndForeach(
        'identity as update',
        (cmd) => `${cmd} [1,2,3][] as $item (100; .)`,
        [100],
        [100, 100, 100]
      );
      describe('multi', () => {
        testReduceAndForeach(
          'input',
          (cmd) => `[1,2,3,4],[1,2,3,4,10] | ${cmd} .[] as $item (5;. + $item)`,
          [15, 25],
          [6, 8, 11, 15, 6, 8, 11, 15, 25]
        );
        // NOTE: This behaviour is different from the original jq implementation, which throws an error when the second
        // initial value is encountered
        testReduceAndForeach(
          'initial',
          (cmd) => `[1,2,3,4] | ${cmd} .[] as $item (100, 200; . + $item)`,
          [110, 210],
          [101, 103, 106, 110, 201, 203, 206, 210]
        );
        // NOTE: This behaviour is different from the original jq implementation, which throws an error when the second
        // initial value is encountered
        testReduceAndForeach(
          'both',
          (cmd) =>
            `[1,2,3,4],[1,2,3,4,10] | ${cmd} .[] as $item (100, 200; . + $item)`,
          [110, 210, 120, 220],
          [
            101, 103, 106, 110, 201, 203, 206, 210, 101, 103, 106, 110, 120,
            201, 203, 206, 210, 220,
          ]
        );
      });
      describe('foreach extract', () => {
        it('identity', () => {
          expect(helper('foreach [1,2,3][] as $item (0;.+$item; .)')).toEqual([
            1, 3, 6,
          ]);
        });
        it('*2', () => {
          expect(helper('foreach [1,2,3][] as $item (0;.+$item; .*2)')).toEqual(
            [2, 6, 12]
          );
        });
        it('+$item', () => {
          expect(
            helper('foreach [1,2,3][] as $item (0;.+$item; .+$item)')
          ).toEqual([2, 5, 9]);
        });
        describe('multi', () => {
          it('extract', () => {
            expect(
              helper(
                'foreach ["a","b","c"][] as $item ("";.+$item; .+"X",.+"Y",.+"Z")'
              )
            ).toEqual([
              'aX',
              'aY',
              'aZ',
              'abX',
              'abY',
              'abZ',
              'abcX',
              'abcY',
              'abcZ',
            ]);
          });
          it('update & extract', () => {
            expect(
              helper(
                'foreach ["a","b","c"][] as $item ("";.+$item+"A", .+$item+"B"; .+"X",.+"Y")'
              )
            ).toEqual([
              'aAX',
              'aAY',
              'aBX',
              'aBY',
              'aBbAX',
              'aBbAY',
              'aBbBX',
              'aBbBY',
              'aBbBcAX',
              'aBbBcAY',
              'aBbBcBX',
              'aBbBcBY',
            ]);
          });
        });
      });
    });
  });
  describe('variables', () => {
    it('simple declaration', () => {
      expect(helper('. as $var | $var', 100)).toEqual([100]);
    });
    it('multi', () => {
      expect(helper('.[] | . as $var | $var', [10, 20, 30, 40, 50])).toEqual([
        10, 20, 30, 40, 50,
      ]);
      expect(helper('(.[] | .) as $var | $var', [10, 20, 30, 40, 50])).toEqual([
        10, 20, 30, 40, 50,
      ]);
      expect(helper('.[] | (. as $var | $var)', [10, 20, 30, 40, 50])).toEqual([
        10, 20, 30, 40, 50,
      ]);
    });
    describe('scopes', () => {
      it('override', () => {
        expect(helper('1 as $var | 2 as $var | $var')).toEqual([2]);
      });
      it('exit scope', () => {
        expect(helper('1 as $var | (2 as $var | $var) | $var')).toEqual([1]);
      });
      it('pipe in inner scope', () => {
        expect(helper('1 as $var | 2 as $var | $var | $var')).toEqual([2]);
      });
    });
    describe('precedence', () => {
      it('times', () => {
        expect(helper('.*1 as $var|.', 5)).toEqual([25]);
        expect(helper('.*1 as $var|$var', 5)).toEqual([5]);
      });
      it('pipe', () => {
        expect(helper('.|1 as $var|.', 100)).toEqual([100]);
        expect(helper('.|1 as $var|$var', 100)).toEqual([1]);
      });
      it('minus', () => {
        expect(helper('-1 as $var|.', 100)).toEqual([-100]);
        expect(helper('-1 as $var|$var', 100)).toEqual([-1]);
      });
    });
    describe('destructuring', () => {
      it('array destructuring', () => {
        expect(
          helper('[1,2,3,4,5,6,7,8,9,10] as [$a, $b, $c] | $a+$b+$c', 100)
        ).toEqual([6]);
      });
      describe('object destructuring', () => {
        it('str', () => {
          expect(helper('. as {"key": $a} | $a', { key: 100 })).toEqual([100]);
        });
        it('ident', () => {
          expect(helper('. as {key: $a} | $a', { key: 100 })).toEqual([100]);
        });
        it('expression', () => {
          expect(
            helper('. as {(1+2 | tostring): $a} | $a', { '3': 100 })
          ).toEqual([100]);
        });
        it('abbreviated', () => {
          expect(helper('. as {$a} | $a', { a: 100 })).toEqual([100]);
        });
        it('str interpolation', () => {
          expect(helper('. as {"\\(1)": $a} | $a', { '1': 100 })).toEqual([
            100,
          ]);
        });
        it('multi', () => {
          expect(
            helper(
              '1,2|{a: 1, b: 2, c: 1, d: 2} as {("a", "b"): $a, ("c", "d"): $b} | "\\(.):\\($a):\\($b)"'
            )
          ).toEqual([
            '1:1:1',
            '1:1:2',
            '1:2:1',
            '1:2:2',
            '2:1:1',
            '2:1:2',
            '2:2:1',
            '2:2:2',
          ]);
        });
        it('multi - nested', () => {
          expect(
            helper(
              '{a: {a: 1, b: 2}, b: {a:3, b:4}, c: 1, d: 2} as {("a", "b"): {("a", "b"): $a}, ("c", "d"): $b} | "\\($a):\\($b)"'
            )
          ).toEqual(['1:1', '1:2', '2:1', '2:2', '3:1', '3:2', '4:1', '4:2']);
        });
        it('variable expression in key', () => {
          expect(
            helper('"a" as $key | {a: "X"} as {($key): $var} | $var')
          ).toEqual(['X']);
        });
        describe('identity', () => {
          it('simple', () => {
            expect(helper('{a: "b", b: "X"} as {(.a): $var} | $var')).toEqual([
              'X',
            ]);
          });
          it('nested', () => {
            expect(
              helper(
                '{a: "b", b: {c: "d", d: "X"}} as {(.a): {(.c): $var}} | $var'
              )
            ).toEqual(['X']);
          });
        });
      });
      it('nested', () => {
        expect(
          helper(
            '. as {a: {$a, arr: [$b, $c, {$d, "key": $e, "arr": [$f, $g]}]}} | $a, $b, $c, $d, $e, $f, $g',
            { a: { a: 1, arr: [2, 3, { d: 4, key: 5, arr: [6, 7] }] } }
          )
        ).toEqual([1, 2, 3, 4, 5, 6, 7]);
      });
      describe('name conflicts', () => {
        describe('object properties', () => {
          it('{$a, b: $a}', () => {
            expect(helper('. as {$a, b: $a} | $a', { a: 1, b: 2 })).toEqual([
              1,
            ]);
          });
          it('{b: $a, $a}', () => {
            expect(helper('. as {b: $a, $a} | $a', { a: 1, b: 2 })).toEqual([
              2,
            ]);
          });
          it('{$a, b: {$a}}', () => {
            expect(
              helper('. as {$a, b: {$a}} | $a', { a: 1, b: { a: 2 } })
            ).toEqual([1]);
          });
          it('{b: {$a}, $a}', () => {
            expect(
              helper('. as {b: {$a}, $a} | $a', { a: 1, b: { a: 2 } })
            ).toEqual([2]);
          });
          it('{$a, b: {a: $a}}', () => {
            expect(
              helper('. as {$a, b: {a: $a}} | $a', { a: 1, b: { a: 2 } })
            ).toEqual([1]);
          });
          it('{b: {a: $a}, $a}', () => {
            expect(
              helper('. as {b: {a: $a}, $a} | $a', { a: 1, b: { a: 2 } })
            ).toEqual([2]);
          });
          it('{$a, b: {$a, b: {$a}}}', () => {
            expect(
              helper('. as {$a, b: {$a, b: {$a}}} | $a', {
                a: 1,
                b: { a: 2, b: { a: 3 } },
              })
            ).toEqual([1]);
          });
          it('{$a, b: {b: {$a}, $a}}', () => {
            expect(
              helper('. as {$a, b: {b: {$a}, $a}} | $a', {
                a: 1,
                b: { a: 2, b: { a: 3 } },
              })
            ).toEqual([1]);
          });
          it('{b: {b: {$a}, $a}, $a}', () => {
            expect(
              helper('. as {b: {b: {$a}, $a}, $a} | $a', {
                a: 1,
                b: { a: 2, b: { a: 3 } },
              })
            ).toEqual([3]);
          });
        });
        describe('array values', () => {
          it('[$a, $a]', () => {
            expect(helper('. as [$a, $a] | $a', [1, 2])).toEqual([2]);
          });
          it('[[$a,$a], [[$a, $a], $a], $a]', () => {
            expect(
              helper('. as [[$a,$a], [[$a, $a], $a], $a] | $a', [
                [1, 2],
                [[3, 4], 5],
                6,
              ])
            ).toEqual([6]);
          });
          it('[[$a,$a], [[$a, $a]]]', () => {
            expect(
              helper('. as [[$a,$a], [[$a, $a]]] | $a', [[1, 2], [[3, 4]]])
            ).toEqual([4]);
          });
        });
        describe('mixed', () => {
          it('[{$a}, {$a}]', () => {
            expect(
              helper('. as [{$a}, {$a}] | $a', [{ a: 1 }, { a: 2 }])
            ).toEqual([2]);
          });
          it('{$a, b: [{$a}, {$a}]}', () => {
            expect(
              helper('. as {$a, b: [{$a}, {$a}]} | $a', {
                a: 1,
                b: [{ a: 2 }, { a: 3 }],
              })
            ).toEqual([1]);
          });
          it('{b: [{$a}, {$a}], $a}', () => {
            expect(
              helper('. as {b: [{$a}, {$a}], $a} | $a', {
                a: 1,
                b: [{ a: 2 }, { a: 3 }],
              })
            ).toEqual([3]);
          });
        });
      });
      describe('destructuring alternative operator', () => {
        it('array', () => {
          expect(
            helper(
              '[0, [1],[[2]],[[[3]]]][] as [[[$a]]] ?// [[$a]] ?// [$a] ?// $a | $a'
            )
          ).toEqual([0, 1, 2, 3]);
        });
        it('object', () => {
          expect(helper('[{a: 1}, 2][] as {$a} ?// $a | $a')).toEqual([1, 2]);
        });
        it('mixed', () => {
          expect(
            helper('[{a: 1}, 2, [3]][] as [$a] ?// {$a} ?// $a | $a')
          ).toEqual([1, 2, 3]);
        });
        it('error', () => {
          expect(() =>
            helper('1 as [$a] ?// {$a} | $a')
          ).toThrowErrorMatchingSnapshot();
        });
        it('null in unused variables', () => {
          expect(helper('1 as [$a] ?// $x | "\\($a):\\($x)"')).toEqual([
            'null:1',
          ]);
        });
        describe('multi', () => {
          it('multi a', () => {
            expect(
              helper(
                '{a: [1], b: 2, c: 1, d: 2} as {("a", "b"): [$a], ("c", "d"): $b} ?// $x | $x // "\\($a):\\($b)"'
              )
            ).toEqual(['1:1', '1:2', { a: [1], b: 2, c: 1, d: 2 }]);
          });
          it('multi b', () => {
            expect(
              helper(
                '{a: 1, b: [2], c: 1, d: 2} as {("a", "b"): [$a], ("c", "d"): $b} ?// $x | $x // "\\($a):\\($b)"'
              )
            ).toEqual([{ a: 1, b: [2], c: 1, d: 2 }]);
          });
          it('multi c', () => {
            expect(
              helper(
                '{a: 1, b: 2, c: [1], d: 2} as {("a", "b"): $a, ("c", "d"): [$b]} ?// $x | $x // "\\($a):\\($b)"'
              )
            ).toEqual(['1:1', { a: 1, b: 2, c: [1], d: 2 }]);
          });
          it('multi d', () => {
            expect(
              helper(
                '{a: 1, b: 2, c: 1, d: [2]} as {("a", "b"): $a, ("c", "d"): [$b]} ?// $x | $x // "\\($a):\\($b)"'
              )
            ).toEqual([{ a: 1, b: 2, c: 1, d: [2] }]);
          });
        });
      });
    });
  });
});
