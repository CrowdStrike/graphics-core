export class StringUtils {
  static removeLeadingAndTrailingChars(str: string, char: string) {
    return StringUtils.removeTrailingChars(StringUtils.removeLeadingChars(str, char), char);
  }

  /**
   * remove all leaving characters ( TODO: Needs testing )
   * @param str
   * @param char
   * @returns {*}
   */
  static removeLeadingChars(str: string, char: string) {
    let counter = 0;

    for (let e = 0; e < str.length; e++) {
      if (str[e] === char && counter === e) {
        counter++;
      } else {
        break;
      }
    }

    return str.slice(counter, str.length);
  }

  /**
   * remove all trailing characters ( TODO: Needs testing )
   * @param str
   * @param char
   * @returns {*}
   */
  static removeTrailingChars(str: string, char: string) {
    let counter = str.length - 1;

    for (let e = str.length - 1; e > 0; e--) {
      if (str[e] === char && counter === e) {
        counter--;
      } else {
        break;
      }
    }

    return str.substring(0, counter + 1);
  }

  /**
   * replace occurences of a character in a string
   *
   * @usage
   *
   *      strUtils.replaceChar( "b,aaa,b,aaa,b,aaa,b,aaa,b,aaa,b,aaa,b", "a" , "b")//b,bbb,b,bbb,b,bbb,b,bbb,b,bbb,b,bbb,b
   *
   * @param   str
   * @param   charToRemove
   * @param   charToReplace
   *
   * @return  modified string
   */
  static replaceChar(str: string, charToRemove: string, charToReplace: string) {
    let temparray = str.split(charToRemove);

    return temparray.join(charToReplace);
  }

  /**
   * Capitalise first letter in string
   * @param str
   * @returns {string}
   */
  static capitaliseFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   *
   * @param str
   * @param len
   * @returns {*}
   */
  static truncateFromEnd(str: string, len = 15, truncationLabel = '...') {
    if (str.length - 1 < len) {
      return str;
    } else {
      return truncationLabel + str.substring(str.length - len);
    }
  }

  static truncate(str: string, len = 15, truncationLabel = '...') {
    if (str.length - 1 < len) {
      return str;
    } else {
      return `${str.substring(0, len)}${truncationLabel}`;
    }
  }

  static truncateMiddle(str: string, len = 15, truncationLabel = '...') {
    if (str.length <= len) {
      return str;
    }

    let frontChars = Math.ceil(len / 2);
    let backChars = Math.floor(len / 2);

    return `${str.substring(0, frontChars).trim()}${truncationLabel}${str.substring(str.length - backChars).trim()}`;
  }
}
