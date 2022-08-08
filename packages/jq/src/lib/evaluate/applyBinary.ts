import { BinaryOperator } from '../parser/AST';
import {
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
import { isEqual } from 'lodash';
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
    case 'or':
      return isTrue(left) || isTrue(right);
    case 'and':
      return isTrue(left) && isTrue(right);
    case '==':
      return isEqual(left, right);
    case '!=':
      return !isEqual(left, right);
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
              !right.some((rightItem: any) => isEqual(leftItem, rightItem))
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
        throw notImplementedError(`operator:object*object`);
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
    case '?//':
    case '|':
    case ',':
    default:
      throw cannotApplyOperator(op);
  }
}

export function* combineIterators(
  op: BinaryOperator,
  left: Input,
  right: Input
) {
  const leftArr = Array.from(left);
  for (const rightItem of right) {
    for (const leftItem of leftArr) {
      yield applyBinary(op, leftItem, rightItem);
    }
  }
}
