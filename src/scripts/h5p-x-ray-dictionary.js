import he from 'he';
import Util from './h5p-x-ray-util';

/** Class for dictionary */
export default class Dictionary {
  /**
   * Fill dictionary with translations.
   * @param {object} translation Translations.
   */
  static fill(translation) {
    translation = Util.extend(Dictionary.DEFAULT_TRANSLATIONS, translation);
    Dictionary.translation = Dictionary.sanitize(translation);
  }

  /**
   * Get translation for a key.
   * @param {string} key Key to look for.
   * @return {string} Translation.
   */
  static get(key) {
    return Dictionary.translation[key];
  }

  /**
   * Sanitize translations recursively: HTML decode and strip HTML.
   * @param {object|string} translation Translation.
   * @return {object|string} Sanitized translation.
   */
  static sanitize(translation) {
    if (typeof translation === 'object') {
      for (let key in translation) {
        translation[key] = Dictionary.sanitize(translation[key]);
      }
    }
    else if (typeof translation === 'string') {
      translation = he.decode(translation);
      const div = document.createElement('div');
      div.innerHTML = translation;
      translation = div.textContent || div.innerText || '';
    }
    else {
      // Invalid translation
    }

    return translation;
  }
}

/** @constant {object} Default translations */
Dictionary.DEFAULT_TRANSLATIONS = {
  xRay: 'X-ray',
  xRayOn: 'X-ray activated.',
  xRayOff: 'X-ray deactivated.',
  instructions: 'Use arrow keys to move X-ray lens.',
  movedLensTo: 'Moved lens to @positionHorizontal horizontally and to @positionVertical vertically.',
  unknown: 'unknown'
};
