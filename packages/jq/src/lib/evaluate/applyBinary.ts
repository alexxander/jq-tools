import {
  AssignmentOperator,
  BinaryOperator,
  BooleanBinaryOperator,
  NormalBinaryOperator,
} from '../parser/AST';
import {
  createItem,
  deepClone,
  deepMerge,
  generatePaths,
  generateValues,
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
} from './utils/utils';
import { compare } from './compare';
import { JqEvaluateError } from '../errors';
import { setPath } from './utils/setPath';
import { combineIterators, nestedIterators } from './utils/nestedIterators';
import { getPath } from './utils/getPath';

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

export function applyNormalBinaryOperator(
  op: NormalBinaryOperator,
  left: any,
  right: any
): any {
  switch (op) {
    case '//':
      return isTrue(left) ? left : right;
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
    default:
      throw cannotApplyOperator(op);
  }
}

export function* evaluateSimpleAssignment(
  inputItem: Item,
  left: ItemIterator,
  right: ItemIterator
): ItemIterator {
  for (const [value, pathIterator] of nestedIterators(
    generateValues(right),
    generatePaths(left)
  )) {
    let out = inputItem.value;
    for (const path of pathIterator) {
      out = setPath(out, path, deepClone(value));
    }
    yield createItem(out);
  }
}

export function* evaluateArithmeticUpdateAssignment(
  op: AssignmentOperator,
  inputItem: Item,
  left: ItemIterator,
  right: ItemIterator
): ItemIterator {
  for (const [value, pathIterator] of nestedIterators(
    generateValues(right),
    generatePaths(left)
  )) {
    let out = inputItem.value;
    for (const path of pathIterator) {
      out = setPath(
        out,
        path,
        applyNormalBinaryOperator(
          // Remove the '=' sign from the original arithmetic update-assignment operator
          op.slice(0, -1) as any,
          getPath(out, path),
          value
        )
      );
    }
    yield createItem(out);
  }
}

export function* evaluateBooleanOperator(
  op: BooleanBinaryOperator,
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

export function* evaluateNormalBinaryOperator(
  op: NormalBinaryOperator,
  left: ItemIterator,
  right: ItemIterator
): ItemIterator {
  for (const [rightItem, leftItem] of combineIterators(right, left)) {
    yield createItem(
      applyNormalBinaryOperator(op, leftItem.value, rightItem.value)
    );
  }
}
