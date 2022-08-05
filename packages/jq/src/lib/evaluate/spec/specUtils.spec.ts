import { evaluate } from '../evaluate';
import { parse } from '@jq-tools/jq';

export function helper(code: string, input?: any): any[] {
  return Array.from(evaluate(parse(code), [input]));
}

export function comparisonTest(left: string, right: string, compare: number) {
  const operators = ['>', '>=', '<', '<=', '==', '!='];
  const GT = [true, true, false, false, false, true];
  const LT = [false, false, true, true, false, true];
  const EQ = [false, true, false, true, true, false];
  const values = compare > 0 ? GT : compare < 0 ? LT : EQ;

  describe(`${left} ?? ${right}`, () => {
    for (let i = 0; i < operators.length; i++) {
      const operator = operators[i];
      const expectedValue = values[i];
      it(operator, () => {
        expect(helper(`${left} ${operator} ${right}`)).toEqual([expectedValue]);
      });
    }
  });
}

export function expectCode(code: string, input: any, result: any[]): any;
export function expectCode(code: string, result: any[]): any;
export function expectCode(code: string, b: any, c?: any[]) {
  let input: any, result: any[];
  if (c) {
    input = b;
    result = c;
  } else {
    result = b;
  }

  expect(helper(code, input)).toEqual(result);
}

export function testCode(code: string, input: any, result: any[]): any;
export function testCode(code: string, result: any[]): any;
export function testCode(code: string, b: any, c?: any[]) {
  it(code, () => {
    expectCode(code, b, c as any);
  });
}

export function expectCodeError(code: string) {
  expect(() => helper(code)).toThrowErrorMatchingSnapshot();
}

export function testCodeError(code: string) {
  it(code, () => {
    expectCodeError(code);
  });
}

export function testCodePartial(code: string, partialResults: any[]) {
  it(code, () => {
    const generator = evaluate(parse(code), [null]);
    for (const result of partialResults) {
      expect(generator.next().value).toEqual(result);
    }
    expect(() => generator.next()).toThrowErrorMatchingSnapshot();
  });
}

export function testReduceAndForeach(
  label: string,
  code: (cmd: 'reduce' | 'foreach') => string,
  reduceResult: any[],
  foreachResult: any[]
) {
  describe(label, () => {
    it('reduce', () => {
      expect(helper(code('reduce'))).toEqual(reduceResult);
    });
    it('foreach', () => {
      expect(helper(code('foreach'))).toEqual(foreachResult);
    });
  });
}
