import { JqEvaluateError, NotImplementedError } from '../errors';
import { typeOf } from './utils';

export function notDefinedError(name: string) {
  return new JqEvaluateError(`'${name}' is not defined`);
}

export function notImplementedError(featureName: string) {
  return new NotImplementedError(`Feature '${featureName}' is not implemented`);
}

export function cannotIndexError(val: any, index: any) {
  return new JqEvaluateError(
    `Cannot index ${typeOf(val)} with ${typeOf(index)}`
  );
}
