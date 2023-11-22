export abstract class ByteArrayBase {
  position = 0;
  length = 0;
  _mode = '';
  Base64Key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  public dumpToConsole() {
    let oldpos = this.position;

    this.position = 0;

    let nstep = 8;

    function asHexString(x: number, digits: number) {
      let lut: Array<string> = [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
      ];
      let sh = '';

      for (let d = 0; d < digits; d++) {
        sh = lut[(x >> (d << 2)) & 0xf] + sh;
      }

      return sh;
    }

    for (let i = 0; i < this.length; i += nstep) {
      let s: string = asHexString(i, 4) + ':';

      for (let j = 0; j < nstep && i + j < this.length; j++) {
        let b = this.readUnsignedByte();

        if (b) {
          s += ' ' + asHexString(b, 2);
        }
      }

      // eslint-disable-next-line no-console
      console.log(s);
    }

    this.position = oldpos;
  }

  abstract readUnsignedByte(): number | undefined;

  internalGetBase64String(count: number, getUnsignedByteFunc: () => number, self: unknown) {
    // return base64 string of the next count bytes
    let r = '';
    let b0;

    let b1;
    let b2;
    let enc1;
    let enc2;
    let enc3;

    let enc4;
    let base64Key = this.Base64Key;

    while (count >= 3) {
      b0 = getUnsignedByteFunc.apply(self);
      b1 = getUnsignedByteFunc.apply(self);
      b2 = getUnsignedByteFunc.apply(self);
      enc1 = b0 >> 2;
      enc2 = ((b0 & 3) << 4) | (b1 >> 4);
      enc3 = ((b1 & 15) << 2) | (b2 >> 6);
      enc4 = b2 & 63;
      r +=
        base64Key.charAt(enc1) +
        base64Key.charAt(enc2) +
        base64Key.charAt(enc3) +
        base64Key.charAt(enc4);
      count -= 3;
    }

    // pad
    if (count == 2) {
      b0 = getUnsignedByteFunc.apply(self);
      b1 = getUnsignedByteFunc.apply(self);
      enc1 = b0 >> 2;
      enc2 = ((b0 & 3) << 4) | (b1 >> 4);
      enc3 = (b1 & 15) << 2;
      r += base64Key.charAt(enc1) + base64Key.charAt(enc2) + base64Key.charAt(enc3) + '=';
    } else if (count == 1) {
      b0 = getUnsignedByteFunc.apply(self);
      enc1 = b0 >> 2;
      enc2 = (b0 & 3) << 4;
      r += base64Key.charAt(enc1) + base64Key.charAt(enc2) + '==';
    }

    return r;
  }
}
