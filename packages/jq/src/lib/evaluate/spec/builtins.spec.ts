import { expectCode, expectCodeError } from './specUtils.spec';

describe('builtins', () => {
  describe('native', () => {
    describe('length', () => {
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
  });
});
