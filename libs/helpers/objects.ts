export function equals(x, y): boolean {
  if (x === y) {
    return true;
  }
  // if both x and y are null or undefined and exactly the same
  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }
  // if they are not strictly equal, they both need to be Objects
  if (x.constructor !== y.constructor) {
    return false;
  }
  // they must have the exact same prototype chain, the closest we can do is
  // test there constructor.

  for (const p in x) {
    if (!x.hasOwnProperty(p)) {
      continue;
    }
    // other properties were tested using x.constructor === y.constructor
    if (!y.hasOwnProperty(p)) {
      return false;
    }
    // allows to compare x[ p ] and y[ p ] when set to undefined
    if (x[p] === y[p]) {
      continue;
    }
    // if they have the same strict value or identity then they are equal
    if (typeof x[p] !== 'object') {
      return false;
    }
  }
  for (const p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
      return false;
    }
  }
  return true;
}

export const isString = (arg: any) => {
  return typeof arg === 'string';
};

export const isObject = (arg: any) => {
  // important to test *truthy* since `null` is also typeof === 'object'!
  return arg && typeof arg === 'object';
};

/**
 * Checks if an object is empty
 * @param obj [object]
 * @returns boolean
 */
export const isEmpty = obj => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};
