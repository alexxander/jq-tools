import { JqEvaluateError, NotImplementedError } from '../errors';

export function notDefinedError(name: string) {
  return new JqEvaluateError(`'${name}' is not defined`);
}

export function notImplementedError(featureName: string) {
  return new NotImplementedError(`Feature '${featureName}' is not implemented`);
}
