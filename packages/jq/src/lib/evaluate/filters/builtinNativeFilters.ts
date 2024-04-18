import {
  assertNumber,
  assertString,
  createItem,
  delPaths,
  has,
  indices,
  isPaths,
  isTrue,
  keys,
  range,
  sort,
  toString,
  transformRegExpMatch,
  Type,
  typeOf,
} from '../utils/utils';
import { NativeFilter, wrapBareNativeFilters } from './lib/nativeFilter';
import { notImplementedError } from '../evaluateErrors';
import { compare } from '../compare';
import { JqArgumentError } from '@jq-tools/jq';

export const builtinNativeFilters: Record<string, NativeFilter> = {
  *'path/1'(input, value) {
    yield createItem(value.path);
  },
  ...wrapBareNativeFilters({
    *'_group_by_impl/1'(input: any[], ref: any[][]) {
      const items = input
        .map((value, i) => ({ value, ref: ref[i] }))
        .sort((a, b) => compare(a.ref, b.ref));

      let i = -1;
      const groupRefs: any[][] = [];
      const out: any[][] = [];
      for (const item of items) {
        if (i === -1 || compare(groupRefs[i], item.ref)) {
          groupRefs.push(item.ref);
          out.push([]);
          i++;
        }
        out[i].push(item.value);
      }

      yield out;
    },
    *'_match_impl/3'(
      input: string,
      regex: string,
      flags: string | null,
      returnOnlyBoolean: boolean
    ) {
      const str = assertString(input);
      const r = new RegExp(regex, (flags ?? '') + 'd');

      if (flags && flags.includes('g')) {
        const m = Array.from(str.matchAll(r));
        if (returnOnlyBoolean) {
          yield m.length !== 0;
        } else {
          yield m.map(transformRegExpMatch);
        }
      } else {
        const m = str.match(r);
        if (returnOnlyBoolean) {
          yield !!m;
        } else if (m) {
          yield [transformRegExpMatch(m)];
        }
      }
    },
    *'_max_by_impl/1'() {
      throw notImplementedError('_max_by_impl/1');
    },
    *'_min_by_impl/1'() {
      throw notImplementedError('_min_by_impl/1');
    },
    *'_sort_by_impl/1'(input: any[], ref: any[][]) {
      yield input
        .map((item, i) => ({ item, ref: ref[i] }))
        .sort(compare)
        .map(({ item }) => item);
    },
    *'_strindices/1'(input: string, needle: string) {
      yield indices(input, needle);
    },

    *'acos/0'() {
      throw notImplementedError('acos/0');
    },
    *'acosh/0'() {
      throw notImplementedError('acosh/0');
    },
    *'asin/0'() {
      throw notImplementedError('asin/0');
    },
    *'asinh/0'() {
      throw notImplementedError('asinh/0');
    },
    *'atan/0'() {
      throw notImplementedError('atan/0');
    },
    *'atan2/2'() {
      throw notImplementedError('atan2/2');
    },
    *'atanh/0'() {
      throw notImplementedError('atanh/0');
    },
    *'builtins/0'() {
      throw notImplementedError('builtins/0');
    },
    *'cbrt/0'() {
      throw notImplementedError('cbrt/0');
    },
    *'ceil/0'() {
      throw notImplementedError('ceil/0');
    },
    *'contains/1'() {
      throw notImplementedError('contains/1');
    },
    *'copysign/2'() {
      throw notImplementedError('copysign/2');
    },
    *'cos/0'() {
      throw notImplementedError('cos/0');
    },
    *'cosh/0'() {
      throw notImplementedError('cosh/0');
    },
    *'debug/0'() {
      throw notImplementedError('debug/0');
    },
    *'delpaths/1'(input: unknown, paths: unknown) {
      if (!isPaths(paths)) {
        throw new JqArgumentError('Expected an array of paths');
      }
      yield delPaths(input as any, paths);
    },
    *'drem/2'() {
      throw notImplementedError('drem/2');
    },
    *'empty/0'() {},
    *'endswith/1'(input: string, str: string) {
      assertString(input);
      assertString(str);

      yield input.endsWith(str);
    },
    *'env/0'() {
      throw notImplementedError('env/0');
    },
    *'erf/0'() {
      throw notImplementedError('erf/0');
    },
    *'erfc/0'() {
      throw notImplementedError('erfc/0');
    },
    *'error/0'() {
      throw notImplementedError('error/0');
    },
    *'exp/0'() {
      throw notImplementedError('exp/0');
    },
    *'exp10/0'() {
      throw notImplementedError('exp10/0');
    },
    *'exp2/0'() {
      throw notImplementedError('exp2/0');
    },
    *'explode/0'() {
      throw notImplementedError('explode/0');
    },
    *'expm1/0'() {
      throw notImplementedError('expm1/0');
    },
    *'fabs/0'() {
      throw notImplementedError('fabs/0');
    },
    *'fdim/2'() {
      throw notImplementedError('fdim/2');
    },
    *'floor/0'() {
      throw notImplementedError('floor/0');
    },
    *'fma/3'() {
      throw notImplementedError('fma/3');
    },
    *'fmax/2'() {
      throw notImplementedError('fmax/2');
    },
    *'fmin/2'() {
      throw notImplementedError('fmin/2');
    },
    *'fmod/2'() {
      throw notImplementedError('fmod/2');
    },
    *'format/1'() {
      throw notImplementedError('format/1');
    },
    *'frexp/0'() {
      throw notImplementedError('frexp/0');
    },
    *'fromjson/0'() {
      throw notImplementedError('fromjson/0');
    },
    *'gamma/0'() {
      throw notImplementedError('gamma/0');
    },
    *'get_jq_origin/0'() {
      throw notImplementedError('get_jq_origin/0');
    },
    *'get_prog_origin/0'() {
      throw notImplementedError('get_prog_origin/0');
    },
    *'get_search_list/0'() {
      throw notImplementedError('get_search_list/0');
    },
    *'getpath/1'() {
      throw notImplementedError('getpath/1');
    },
    *'gmtime/0'() {
      throw notImplementedError('gmtime/0');
    },
    *'halt/0'() {
      throw notImplementedError('halt/0');
    },
    *'halt_error/1'() {
      throw notImplementedError('halt_error/1');
    },
    *'has/1'(input: any, key: any) {
      yield has(input, key);
    },
    *'hypot/2'() {
      throw notImplementedError('hypot/2');
    },
    *'implode/0'() {
      throw notImplementedError('implode/0');
    },
    *'infinite/0'() {
      throw notImplementedError('infinite/0');
    },
    *'input/0'() {
      throw notImplementedError('input/0');
    },
    *'input_filename/0'() {
      throw notImplementedError('input_filename/0');
    },
    *'input_line_number/0'() {
      throw notImplementedError('input_line_number/0');
    },
    *'isinfinite/0'() {
      throw notImplementedError('isinfinite/0');
    },
    *'isnan/0'() {
      throw notImplementedError('isnan/0');
    },
    *'isnormal/0'() {
      throw notImplementedError('isnormal/0');
    },
    *'j0/0'() {
      throw notImplementedError('j0/0');
    },
    *'j1/0'() {
      throw notImplementedError('j1/0');
    },
    *'jn/2'() {
      throw notImplementedError('jn/2');
    },
    *'keys/0'(input: unknown) {
      yield sort(keys(input as any));
    },
    *'keys_unsorted/0'(input: unknown) {
      yield keys(input as any);
    },
    *'ldexp/2'() {
      throw notImplementedError('ldexp/2');
    },
    *'length/0'(input: any) {
      const type = typeOf(input);
      switch (typeOf(input)) {
        case Type.null:
          yield 0;
          break;
        case Type.string:
        case Type.array:
          yield input.length;
          break;
        case Type.object:
          yield Object.keys(input).length;
          break;
        case Type.boolean:
        case Type.number:
        default:
          throw Error(`${type} has no length`);
      }
    },
    *'lgamma/0'() {
      throw notImplementedError('lgamma/0');
    },
    *'lgamma_r/0'() {
      throw notImplementedError('lgamma_r/0');
    },
    *'localtime/0'() {
      throw notImplementedError('localtime/0');
    },
    *'log/0'() {
      throw notImplementedError('log/0');
    },
    *'log10/0'() {
      throw notImplementedError('log10/0');
    },
    *'log1p/0'() {
      throw notImplementedError('log1p/0');
    },
    *'log2/0'() {
      throw notImplementedError('log2/0');
    },
    *'logb/0'() {
      throw notImplementedError('logb/0');
    },
    *'ltrimstr/1'() {
      throw notImplementedError('ltrimstr/1');
    },
    *'max/0'() {
      throw notImplementedError('max/0');
    },
    *'min/0'() {
      throw notImplementedError('min/0');
    },
    *'mktime/0'() {
      throw notImplementedError('mktime/0');
    },
    *'modf/0'() {
      throw notImplementedError('modf/0');
    },
    *'modulemeta/0'() {
      throw notImplementedError('modulemeta/0');
    },
    *'nan/0'() {
      throw notImplementedError('nan/0');
    },
    *'nearbyint/0'() {
      throw notImplementedError('nearbyint/0');
    },
    *'nextafter/2'() {
      throw notImplementedError('nextafter/2');
    },
    *'nexttoward/2'() {
      throw notImplementedError('nexttoward/2');
    },
    *'not/0'(input: unknown) {
      yield !isTrue(input);
    },
    *'now/0'() {
      throw notImplementedError('now/0');
    },
    *'pow/2'() {
      throw notImplementedError('pow/2');
    },
    *'pow10/0'() {
      throw notImplementedError('pow10/0');
    },
    *'range/2'(input: unknown, from: number, upto: number) {
      yield* range(from, upto);
    },
    *'remainder/2'() {
      throw notImplementedError('remainder/2');
    },
    *'rint/0'() {
      throw notImplementedError('rint/0');
    },
    *'round/0'(input: unknown) {
      yield Math.round(assertNumber(input));
    },
    *'rtrimstr/1'() {
      throw notImplementedError('rtrimstr/1');
    },
    *'scalars_or_empty/0'() {
      throw notImplementedError('scalars_or_empty/0');
    },
    *'scalb/2'() {
      throw notImplementedError('scalb/2');
    },
    *'scalbln/2'() {
      throw notImplementedError('scalbln/2');
    },
    *'setpath/2'() {
      throw notImplementedError('setpath/2');
    },
    *'significand/0'() {
      throw notImplementedError('significand/0');
    },
    *'sin/0'() {
      throw notImplementedError('sin/0');
    },
    *'sinh/0'() {
      throw notImplementedError('sinh/0');
    },
    *'sort/0'(input: any[]) {
      yield input.sort(compare);
    },
    *'split/1'(input, split) {
      yield assertString(input).split(assertString(split));
    },
    *'sqrt/0'() {
      throw notImplementedError('sqrt/0');
    },
    *'startswith/1'(input: string, str: string) {
      assertString(input);
      assertString(str);

      yield input.startsWith(str);
    },
    *'stderr/0'() {
      throw notImplementedError('stderr/0');
    },
    *'strflocaltime/1'() {
      throw notImplementedError('strflocaltime/1');
    },
    *'strftime/1'() {
      throw notImplementedError('strftime/1');
    },
    *'strptime/1'() {
      throw notImplementedError('strptime/1');
    },
    *'tan/0'() {
      throw notImplementedError('tan/0');
    },
    *'tanh/0'() {
      throw notImplementedError('tanh/0');
    },
    *'tgamma/0'() {
      throw notImplementedError('tgamma/0');
    },
    *'tojson/0'() {
      throw notImplementedError('tojson/0');
    },
    *'tonumber/0'(input: unknown) {
      const type = typeOf(input);
      switch (typeOf(input)) {
        case Type.string: {
          const parsedNumber = Number(input);
          if(isNaN(parsedNumber)) {
            throw Error(`${type} (${toString(input)}) cannot be parsed as number`);
          }
          if(!isFinite(parsedNumber)) {
            yield parsedNumber > 0 ? Number.MAX_VALUE : -1 * Number.MAX_VALUE;
            break;
          }
          yield parsedNumber;
        break;
        }
        case Type.number:
          yield input;
          break;
        case Type.object:
        case Type.array:
        case Type.null:
        case Type.boolean:
        default:
          throw Error(`${type} (${toString(input)}) cannot be parsed as number`);
      }
    },
    *'tostring/0'(input: unknown) {
      yield toString(input);
    },
    *'trunc/0'() {
      throw notImplementedError('trunc/0');
    },
    *'type/0'(input: any) {
      yield typeOf(input);
    },
    *'utf8bytelength/0'() {
      throw notImplementedError('utf8bytelength/0');
    },
    *'y0/0'() {
      throw notImplementedError('y0/0');
    },
    *'y1/0'() {
      throw notImplementedError('y1/0');
    },
    *'yn/2'() {
      throw notImplementedError('yn/2');
    },
  }),
};
