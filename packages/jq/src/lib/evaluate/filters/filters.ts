import { notImplementedError } from '../errors';
import { Type, typeOf } from '../utils';
import { NativeFilter } from './nativeFilter';

export const filters: Record<string, NativeFilter> = {
  'input_line_number/0'() {
    throw notImplementedError('input_line_number/0');
  },
  'input_filename/0'() {
    throw notImplementedError('input_filename/0');
  },
  'now/0'() {
    throw notImplementedError('now/0');
  },
  'localtime/0'() {
    throw notImplementedError('localtime/0');
  },
  'gmtime/0'() {
    throw notImplementedError('gmtime/0');
  },
  'mktime/0'() {
    throw notImplementedError('mktime/0');
  },
  'strflocaltime/1'() {
    throw notImplementedError('strflocaltime/1');
  },
  'strftime/1'() {
    throw notImplementedError('strftime/1');
  },
  'strptime/1'() {
    throw notImplementedError('strptime/1');
  },
  'stderr/0'() {
    throw notImplementedError('stderr/0');
  },
  'debug/0'() {
    throw notImplementedError('debug/0');
  },
  'modulemeta/0'() {
    throw notImplementedError('modulemeta/0');
  },
  'get_jq_origin/0'() {
    throw notImplementedError('get_jq_origin/0');
  },
  'get_prog_origin/0'() {
    throw notImplementedError('get_prog_origin/0');
  },
  'get_search_list/0'() {
    throw notImplementedError('get_search_list/0');
  },
  'halt_error/1'() {
    throw notImplementedError('halt_error/1');
  },
  'halt/0'() {
    throw notImplementedError('halt/0');
  },
  'env/0'() {
    throw notImplementedError('env/0');
  },
  'format/1'() {
    throw notImplementedError('format/1');
  },
  'max/0'() {
    throw notImplementedError('max/0');
  },
  'min/0'() {
    throw notImplementedError('min/0');
  },
  'sort/0'() {
    throw notImplementedError('sort/0');
  },
  'nan/0'() {
    throw notImplementedError('nan/0');
  },
  'infinite/0'() {
    throw notImplementedError('infinite/0');
  },
  'isnormal/0'() {
    throw notImplementedError('isnormal/0');
  },
  'isnan/0'() {
    throw notImplementedError('isnan/0');
  },
  'isinfinite/0'() {
    throw notImplementedError('isinfinite/0');
  },
  'type/0'() {
    throw notImplementedError('type/0');
  },
  'utf8bytelength/0'() {
    throw notImplementedError('utf8bytelength/0');
  },
  'length/0'(input: any) {
    const type = typeOf(input);
    switch (typeOf(input)) {
      case Type.null:
        return 0;
      case Type.string:
      case Type.array:
        return input.length;
      case Type.object:
        return Object.keys(input).length;
      case Type.boolean:
      case Type.number:
      default:
        throw Error(`${type} has no length`);
    }
  },
  'contains/1'() {
    throw notImplementedError('contains/1');
  },
  'has/1'() {
    throw notImplementedError('has/1');
  },
  'delpaths/1'() {
    throw notImplementedError('delpaths/1');
  },
  'getpath/1'() {
    throw notImplementedError('getpath/1');
  },
  'setpath/2'() {
    throw notImplementedError('setpath/2');
  },
  'implode/0'() {
    throw notImplementedError('implode/0');
  },
  'explode/0'() {
    throw notImplementedError('explode/0');
  },
  'split/1'() {
    throw notImplementedError('split/1');
  },
  'rtrimstr/1'() {
    throw notImplementedError('rtrimstr/1');
  },
  'ltrimstr/1'() {
    throw notImplementedError('ltrimstr/1');
  },
  'endswith/1'() {
    throw notImplementedError('endswith/1');
  },
  'startswith/1'() {
    throw notImplementedError('startswith/1');
  },
  'keys_unsorted/0'() {
    throw notImplementedError('keys_unsorted/0');
  },
  'keys/0'() {
    throw notImplementedError('keys/0');
  },
  'tostring/0'() {
    throw notImplementedError('tostring/0');
  },
  'tonumber/0'() {
    throw notImplementedError('tonumber/0');
  },
  'fromjson/0'() {
    throw notImplementedError('fromjson/0');
  },
  'tojson/0'() {
    throw notImplementedError('tojson/0');
  },
  'lgamma_r/0'() {
    throw notImplementedError('lgamma_r/0');
  },
  'modf/0'() {
    throw notImplementedError('modf/0');
  },
  'frexp/0'() {
    throw notImplementedError('frexp/0');
  },
  'ldexp/2'() {
    throw notImplementedError('ldexp/2');
  },
  'trunc/0'() {
    throw notImplementedError('trunc/0');
  },
  'significand/0'() {
    throw notImplementedError('significand/0');
  },
  'scalbln/2'() {
    throw notImplementedError('scalbln/2');
  },
  'scalb/2'() {
    throw notImplementedError('scalb/2');
  },
  'round/0'() {
    throw notImplementedError('round/0');
  },
  'rint/0'() {
    throw notImplementedError('rint/0');
  },
  'nexttoward/2'() {
    throw notImplementedError('nexttoward/2');
  },
  'nextafter/2'() {
    throw notImplementedError('nextafter/2');
  },
  'nearbyint/0'() {
    throw notImplementedError('nearbyint/0');
  },
  'logb/0'() {
    throw notImplementedError('logb/0');
  },
  'log1p/0'() {
    throw notImplementedError('log1p/0');
  },
  'lgamma/0'() {
    throw notImplementedError('lgamma/0');
  },
  'gamma/0'() {
    throw notImplementedError('gamma/0');
  },
  'fmod/2'() {
    throw notImplementedError('fmod/2');
  },
  'fmin/2'() {
    throw notImplementedError('fmin/2');
  },
  'fmax/2'() {
    throw notImplementedError('fmax/2');
  },
  'fma/3'() {
    throw notImplementedError('fma/3');
  },
  'fdim/2'() {
    throw notImplementedError('fdim/2');
  },
  'fabs/0'() {
    throw notImplementedError('fabs/0');
  },
  'expm1/0'() {
    throw notImplementedError('expm1/0');
  },
  'exp10/0'() {
    throw notImplementedError('exp10/0');
  },
  'erfc/0'() {
    throw notImplementedError('erfc/0');
  },
  'erf/0'() {
    throw notImplementedError('erf/0');
  },
  'drem/2'() {
    throw notImplementedError('drem/2');
  },
  'copysign/2'() {
    throw notImplementedError('copysign/2');
  },
  'ceil/0'() {
    throw notImplementedError('ceil/0');
  },
  'yn/2'() {
    throw notImplementedError('yn/2');
  },
  'jn/2'() {
    throw notImplementedError('jn/2');
  },
  'y1/0'() {
    throw notImplementedError('y1/0');
  },
  'y0/0'() {
    throw notImplementedError('y0/0');
  },
  'tgamma/0'() {
    throw notImplementedError('tgamma/0');
  },
  'tanh/0'() {
    throw notImplementedError('tanh/0');
  },
  'tan/0'() {
    throw notImplementedError('tan/0');
  },
  'sqrt/0'() {
    throw notImplementedError('sqrt/0');
  },
  'sinh/0'() {
    throw notImplementedError('sinh/0');
  },
  'sin/0'() {
    throw notImplementedError('sin/0');
  },
  'remainder/2'() {
    throw notImplementedError('remainder/2');
  },
  'pow/2'() {
    throw notImplementedError('pow/2');
  },
  'log2/0'() {
    throw notImplementedError('log2/0');
  },
  'log10/0'() {
    throw notImplementedError('log10/0');
  },
  'log/0'() {
    throw notImplementedError('log/0');
  },
  'j1/0'() {
    throw notImplementedError('j1/0');
  },
  'j0/0'() {
    throw notImplementedError('j0/0');
  },
  'hypot/2'() {
    throw notImplementedError('hypot/2');
  },
  'floor/0'() {
    throw notImplementedError('floor/0');
  },
  'exp2/0'() {
    throw notImplementedError('exp2/0');
  },
  'exp/0'() {
    throw notImplementedError('exp/0');
  },
  'cosh/0'() {
    throw notImplementedError('cosh/0');
  },
  'cos/0'() {
    throw notImplementedError('cos/0');
  },
  'cbrt/0'() {
    throw notImplementedError('cbrt/0');
  },
  'atanh/0'() {
    throw notImplementedError('atanh/0');
  },
  'atan2/2'() {
    throw notImplementedError('atan2/2');
  },
  'atan/0'() {
    throw notImplementedError('atan/0');
  },
  'asinh/0'() {
    throw notImplementedError('asinh/0');
  },
  'asin/0'() {
    throw notImplementedError('asin/0');
  },
  'acosh/0'() {
    throw notImplementedError('acosh/0');
  },
  'acos/0'() {
    throw notImplementedError('acos/0');
  },
  'empty/0'() {
    throw notImplementedError('empty/0');
  },
  'not/0'() {
    throw notImplementedError('not/0');
  },
  'path/1'() {
    throw notImplementedError('path/1');
  },
  'range/2'() {
    throw notImplementedError('range/2');
  },
  'error/0'() {
    throw notImplementedError('error/0');
  },
  'scalars_or_empty/0'() {
    throw notImplementedError('scalars_or_empty/0');
  },
  'input/0'() {
    throw notImplementedError('input/0');
  },
  'pow10/0'() {
    throw notImplementedError('pow10/0');
  },
  'builtins/0'() {
    throw notImplementedError('builtins/0');
  },

  '_sort_by_impl/1'() {
    throw notImplementedError('_sort_by_impl/1');
  },
  '_group_by_impl/1'() {
    throw notImplementedError('_group_by_impl/1');
  },
  '_max_by_impl/1'() {
    throw notImplementedError('_max_by_impl/1');
  },
  '_min_by_impl/1'() {
    throw notImplementedError('_min_by_impl/1');
  },
  '_match_impl/3'() {
    throw notImplementedError('_match_impl/3');
  },
};
