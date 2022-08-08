import { BinaryOperator } from '../parser/AST';
import {
  deepMerge,
  Input,
  isTrue,
  repeatString,
  someOfType,
  Type,
  typeOf,
  typesEqual,
  typesMatch,
  typesMatchCommutative,
} from './utils';
import { compare } from './compare';
import { JqEvaluateError } from '../errors';
import { notImplementedError } from './evaluateErrors';

function cannotApplyOperatorToError(op: BinaryOperator, left: any, right: any) {
  return new JqEvaluateError(
    `Operator ${op} cannot be applied to ${typeOf(left)} and ${typeOf(right)}`
  );
}

function cannotApplyOperator(op: BinaryOperator) {
  return new JqEvaluateError(`applyBinary: Cannot apply operator '${op}'`);
}

function divisionByZeroError() {
  return new JqEvaluateError('Division by zero');
}

function applyBinary(op: BinaryOperator, left: any, right: any): any {
  switch (op) {
    case '//':
      return isTrue(left) ? left : right;
    case '=':
      throw notImplementedError('operator:' + op);
    case '|=':
      throw notImplementedError('operator:' + op);
    case '+=':
      throw notImplementedError('operator:' + op);
    case '-=':
      throw notImplementedError('operator:' + op);
    case '*=':
      throw notImplementedError('operator:' + op);
    case '/=':
      throw notImplementedError('operator:' + op);
    case '%=':
      throw notImplementedError('operator:' + op);
    case '//=':
      throw notImplementedError('operator:' + op);
    case '==':
      return compare(left, right) === 0;
    case '!=':
      return compare(left, right) !== 0;
    case '<':
      return compare(left, right) < 0;
    case '>':
      return compare(left, right) > 0;
    case '<=':
      return compare(left, right) <= 0;
    case '>=':
      return compare(left, right) >= 0;
    case '+':
      if (someOfType(Type.null, left, right)) {
        return typeOf(left) === Type.null ? right : left;
        break;
      }

      if (!typesEqual(left, right)) {
        throw cannotApplyOperatorToError(op, left, right);
      }
      switch (typeOf(left)) {
        case Type.string:
        case Type.number:
          return left + right;
        case Type.array:
          return [...left, ...right];
        case Type.object:
          return { ...left, ...right };
        default:
          throw cannotApplyOperatorToError(op, left, right);
      }
    case '-':
      if (!typesEqual(left, right)) {
        throw cannotApplyOperatorToError(op, left, right);
      }
      switch (typeOf(left)) {
        case Type.number:
          return left - right;
        case Type.array:
          // Set subtraction
          return left.filter(
            (leftItem: any) =>
              !right.some(
                (rightItem: any) => compare(leftItem, rightItem) === 0
              )
          );
        default:
          throw cannotApplyOperatorToError(op, left, right);
      }
    case '*':
      if (typesMatch(left, right, Type.number)) {
        return left * right;
      } else if (typesMatchCommutative(left, right, Type.string, Type.number)) {
        const str = typeOf(left) === Type.string ? left : right;
        const num = typeOf(left) === Type.number ? left : right;
        return repeatString(str, num);
      } else if (typesMatch(left, right, Type.object)) {
        return deepMerge(left, right);
      }
      throw cannotApplyOperatorToError(op, left, right);
    case '/':
      if (typesMatch(left, right, Type.number)) {
        if (right === 0) throw divisionByZeroError();
        return left / right;
      } else if (typesMatch(left, right, Type.string)) {
        return left.split(right);
      }
      throw cannotApplyOperatorToError(op, left, right);
    case '%':
      if (typesMatch(left, right, Type.number)) {
        if (Math.floor(right) === 0) throw divisionByZeroError();
        return Math.floor(left) % Math.floor(right);
      }
      throw cannotApplyOperatorToError(op, left, right);
    case 'or':
    case 'and':
    case '?//':
    case '|':
    case ',':
    default:
      throw cannotApplyOperator(op);
  }
}

export function* evaluateBooleanOperator(
  op: 'and' | 'or',
  left: Input,
  right: Input
) {
  if (op !== 'and' && op !== 'or') {
    throw new JqEvaluateError(
      `evaluateBooleanOperator: Unexpected operator '${op}'`
    );
  }

  let first = true;
  const memorizedRightItems: any[] = [];
  for (const leftItem of left) {
    const rightItems = first ? right : memorizedRightItems;
    if (op === 'and' && !isTrue(leftItem)) {
      yield false;
      continue;
    } else if (op === 'or' && isTrue(leftItem)) {
      yield true;
      continue;
    }

    for (const rightItem of rightItems) {
      if (first) memorizedRightItems.push(rightItem);
      yield isTrue(rightItem);
    }
    first = false;
  }
}

export function* combineIterators(
  op: BinaryOperator,
  left: Input,
  right: Input
) {
  let first = true;
  const memorizedLeftItems: any[] = [];
  for (const rightItem of right) {
    const leftItems = first ? left : memorizedLeftItems;
    for (const leftItem of leftItems) {
      if (first) memorizedLeftItems.push(leftItem);
      yield applyBinary(op, leftItem, rightItem);
    }
    first = false;
  }
}
