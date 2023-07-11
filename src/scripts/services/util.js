/** Class for utility functions */
export default class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (
            typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object'
          ) {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Map a value from one range to another.
   * @param {number} value Value to me remapped.
   * @param {number} lo1 Lower boundary of first range.
   * @param {number} hi1 Upper boundary of first range.
   * @param {number} lo2 Lower boundary of second range.
   * @param {number} hi2 Upper boundary of second range.
   * @returns {number} Remapped value.
   */
  static project(value, lo1, hi1, lo2, hi2) {
    return lo2 + (hi2 - lo2) * (value - lo1) / (hi1 - lo1);
  }

  /**
   * Detect whether user is running iOS.
   * @returns {boolean} True, if user is running iOS.
   */
  static isIOS() {
    return (
      ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
  }
}
