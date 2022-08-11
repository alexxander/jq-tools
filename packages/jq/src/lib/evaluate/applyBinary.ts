import { BinaryOperator } from '../parser/AST';
import {
  createItem,
  deepMerge,
  isTrue,
  Item,
  ItemIterator,
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

function applyBinary(op: BinaryOperator, left: Item, right: Item): Item {
  switch (op) {
    case '//':
      return isTrue(left.value) ? left : right;
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
      return createItem(compare(left.value, right.value) === 0);
    case '!=':
      return createItem(compare(left.value, right.value) !== 0);
    case '<':
      return createItem(compare(left.value, right.value) < 0);
    case '>':
      return createItem(compare(left.value, right.value) > 0);
    case '<=':
      return createItem(compare(left.value, right.value) <= 0);
    case '>=':
      return createItem(compare(left.value, right.value) >= 0);
    case '+':
      if (someOfType(Type.null, left.value, right.value)) {
        return typeOf(left.value) === Type.null ? right : left;
      }

      if (!typesEqual(left.value, right.value)) {
        throw cannotApplyOperatorToError(op, left.value, right.value);
      }
      switch (typeOf(left.value)) {
        case Type.string:
        case Type.number:
          return createItem(left.value + right.value);
        case Type.array:
          return createItem([...left.value, ...right.value]);
        case Type.object:
          return createItem({ ...left.value, ...right.value });
        default:
          throw cannotApplyOperatorToError(op, left.value, right.value);
      }
    case '-':
      if (!typesEqual(left.value, right.value)) {
        throw cannotApplyOperatorToError(op, left.value, right.value);
      }
      switch (typeOf(left.value)) {
        case Type.number:
          return createItem(left.value - right.value);
        case Type.array:
          // Set subtraction
          return createItem(
            left.value.filter(
              (leftItem: any) =>
                !right.value.some(
                  (rightItem: any) => compare(leftItem, rightItem) === 0
                )
            )
          );
        default:
          throw cannotApplyOperatorToError(op, left.value, right.value);
      }
    case '*':
      if (typesMatch(left.value, right.value, Type.number)) {
        return createItem(left.value * right.value);
      } else if (
        typesMatchCommutative(left.value, right.value, Type.string, Type.number)
      ) {
        const str =
          typeOf(left.value) === Type.string ? left.value : right.value;
        const num =
          typeOf(left.value) === Type.number ? left.value : right.value;
        return createItem(repeatString(str, num));
      } else if (typesMatch(left.value, right.value, Type.object)) {
        return createItem(deepMerge(left.value, right.value));
      }
      throw cannotApplyOperatorToError(op, left.value, right.value);
    case '/':
      if (typesMatch(left.value, right.value, Type.number)) {
        if (right.value === 0) throw divisionByZeroError();
        return createItem(left.value / right.value);
      } else if (typesMatch(left.value, right.value, Type.string)) {
        return createItem(left.value.split(right.value));
      }
      throw cannotApplyOperatorToError(op, left.value, right.value);
    case '%':
      if (typesMatch(left.value, right.value, Type.number)) {
        if (Math.floor(right.value) === 0) throw divisionByZeroError();
        return createItem(Math.floor(left.value) % Math.floor(right.value));
      }
      throw cannotApplyOperatorToError(op, left.value, right.value);
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
  left: ItemIterator,
  right: ItemIterator
): ItemIterator {
  if (op !== 'and' && op !== 'or') {
    throw new JqEvaluateError(
      `evaluateBooleanOperator: Unexpected operator '${op}'`
    );
  }

  let first = true;
  const memorizedRightItems: Item[] = [];
  for (const leftItem of left) {
    const rightItems = first ? right : memorizedRightItems;
    if (op === 'and' && !isTrue(leftItem.value)) {
      yield createItem(false);
      continue;
    } else if (op === 'or' && isTrue(leftItem.value)) {
      yield createItem(true);
      continue;
    }

    for (const rightItem of rightItems) {
      if (first) memorizedRightItems.push(rightItem);
      yield createItem(isTrue(rightItem.value));
    }
    first = false;
  }
}

export function* combineIterators(
  op: BinaryOperator,
  left: ItemIterator,
  right: ItemIterator
) {
  let first = true;
  const memorizedLeftItems: Item[] = [];
  for (const rightItem of right) {
    const leftItems = first ? left : memorizedLeftItems;
    for (const leftItem of leftItems) {
      if (first) memorizedLeftItems.push(leftItem);
      yield applyBinary(op, leftItem, rightItem);
    }
    first = false;
  }
}
