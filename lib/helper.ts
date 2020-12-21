import {isObject, isArray} from './type';

export function getConstructName(arg: any): string {
  if (typeof arg!.name === 'string' && arg!.name !== '') {
    return arg.name;
  } else {
    return arg.constructor.name;
  }
}

export function addProperty(source: object, key: string, value: any): object {
  return Object.defineProperty(source, key, {
    configurable: true,
    enumerable: true,
    value: value,
    writable: true,
  });
}

export function addProperties(source: object, target: object) {
  for (const [key, value] of Object.entries(target)) {
    addProperty(source, key, value);
  }
  return source;
}
// export const ref = new WeakMap();
// eslint-disable-next-line max-len
export function duplicate<T extends object>(object: T): T {
  if (isObject(object) === false) {
    throw new TypeError('wrong type');
  } else {
    // const r = ref.get(object);
    // if (r !== undefined) {
    //   return 'self';
    // } else {
    //   ref.set(object, '$');
    // }
  }
  if (isArray(object)) {
    let index = 0;
    const result = [];
    for (const iterator of object as Array<unknown>) {
      if (isObject(iterator)) {
        const tmp = duplicate(iterator as T);
        result[index] = tmp;
      } else {
        result[index] = iterator;
      }
      index++;
    }
    return result as T;
  } else {
    const result = {} as T;
    for (const [key, value] of Object.entries(object)) {
      if (isObject(value)) {
        const tmp = duplicate(value);
        addProperty(result, key, tmp);
      } else {
        addProperty(result, key, value);
      }
    }
    return result;
  }
}

export function mix<T extends object, K extends object>(source: T, target: K) {
  for (const [key, value] of Object.entries(target)) {
    if (key in source) {
      if (typeof source[key as keyof T] === typeof value) {
        source[key as keyof T] = value;
      } else {
        console.warn('attribute', key, 'different type in', source);
      }
    } else {
      console.warn('attribute', key, 'not exist in', source);
    }
  }
}

export function genRandomNumber(length: number = 0) {
  return +Math.random().toFixed(length).slice(2, length+2);
}

export function genRandomString(length: number = 0) {
  const allCapsAlpha = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const allLowerAlpha = [...'abcdefghijklmnopqrstuvwxyz'];
  const base = [...allLowerAlpha, ...allCapsAlpha];
  return [...Array(length)]
      .map((value) => {
        const digit = (Math.random() * base.length);
        return base[digit%2?Math.ceil(digit):Math.floor(digit)];
      })
      .join('');
}

export function hash(str = '', key = 0) {
  let hash = key;
  let index = str.length;
  while (index) {
    hash = (hash * 37) ^ str.charCodeAt(--index);
  };
  return str +'-'+ (hash >>> 0).toString(36);
}

export function domParser(string: string): Element | null {
  const dom = new DOMParser();
  return dom.parseFromString(string, 'text/html').body.firstElementChild;
}

export function trim(string: string): string {
  return string.replaceAll(/\s|\n/g, '');
}
