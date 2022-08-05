export function notDefinedError(name: string) {
  return new Error(`'${name}' is not defined`);
}

export function notImplementedError(featureName: string) {
  return new Error(`Feature '${featureName}' is not implemented`);
}
