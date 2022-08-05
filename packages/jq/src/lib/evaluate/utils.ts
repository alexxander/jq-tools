export type Input<T = any> = IterableIterator<T>;
export type Output<T = any> = IterableIterator<T>;
export type EvaluateInput<T = any> = Input<T> | T[];

export enum Type {
  null = 'null',
  boolean = 'boolean',
  number = 'number',
  string = 'string',
  array = 'array',
  object = 'object',
}

export function typeOf(value: any): Type {
  if (Array.isArray(value)) return Type.array;
  if (value === null) return Type.null;
  return typeof value as Type;
}

export function isAtom(value: any) {
  const type = typeOf(value);
  return type !== 'array' && type !== 'object';
}

export function typesEqual(a: any, b: any) {
  return typeOf(a) === typeOf(b);
}

export function typesMatch(a: any, b: any, typeA: Type, typeB: Type = typeA) {
  return typeOf(a) === typeA && typeOf(b) === typeB;
}

export function typesMatchCommutative(
  a: any,
  b: any,
  typeA: Type,
  typeB: Type
) {
  return typesMatch(a, b, typeA, typeB) || typesMatch(a, b, typeB, typeA);
}

export function someOfType(type: Type, ...args: any[]) {
  return args.some((arg) => typeOf(arg) === type);
}

export function* single<T>(val: T): IterableIterator<T> {
  yield val;
}

export function* many<T>(val: T[]): IterableIterator<T> {
  yield* val;
}

export function cloneGenerator<T extends Input>(iterator: T): [T, T] {
  const values = Array.from(iterator);
  return [many(values) as T, many(values) as T];
}

export function isTrue(val: any): boolean {
  return val !== null && val !== false;
}

export function repeatString(str: string, num: number): string | null {
  if (num <= 0) {
    return null;
  }
  let out = '';
  for (let i = 0; i < Math.floor(num); i++) {
    out += str;
  }

  return out;
}

export function* recursiveDescent(val: any): IterableIterator<any> {
  yield val;
  if (typeOf(val) === 'object') {
    for (const child of Object.values(val)) {
      yield* recursiveDescent(child);
    }
  } else if (typeOf(val) === 'array') {
    for (const child of val) {
      yield* recursiveDescent(child);
    }
  }
}

export function toString(val: any): string {
  switch (typeOf(val)) {
    case Type.null:
      return 'null';
    case Type.boolean:
    case Type.number:
      return val.toString();
    case Type.string:
      return val;
    case Type.array:
    case Type.object:
      return JSON.stringify(val);
  }
}
