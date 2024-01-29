import { ByteArrayBase } from './byte-array-base';

export class ByteArray extends ByteArrayBase {
  maxlength = 0;
  arraybytes; // ArrayBuffer
  unalignedarraybytestemp; // ArrayBuffer

  constructor() {
    super();

    this._mode = 'Typed array';
    this.maxlength = 4;
    this.arraybytes = new ArrayBuffer(this.maxlength);
    this.unalignedarraybytestemp = new ArrayBuffer(16);
  }

  /**
   * ensureWriteableSpace
   * ensure there is 'n' writable space in the ByteArray after the current position
   * @param n
   */
  ensureWriteableSpace(n: number) {
    this.ensureSpace(n + this.position);
  }

  /**
   * Assign an ArrayBuffer to the ByteArray Object
   * @param aBuffer
   */
  setArrayBuffer(aBuffer: ArrayBuffer): void {
    this.ensureSpace(aBuffer.byteLength);

    this.length = aBuffer.byteLength;

    let inInt8AView: Int8Array = new Int8Array(aBuffer);
    let localInt8View: Int8Array = new Int8Array(this.arraybytes, 0, this.length);

    localInt8View.set(inInt8AView);

    this.position = 0;
  }

  /**
   * The number of bytes of data available for reading from the current position in the byte array to the end of the array
   * @returns {number}
   */
  getBytesAvailable(): number {
    return this.length - this.position;
  }

  /**
   * Ensure the ByteArray stream has n space
   * @param n
   */
  ensureSpace(n: number) {
    if (n > this.maxlength) {
      let newmaxlength: number = (n + 255) & ~255;
      let newarraybuffer = new ArrayBuffer(newmaxlength);
      let view = new Uint8Array(this.arraybytes, 0, this.length);
      let newview = new Uint8Array(newarraybuffer, 0, this.length);

      newview.set(view); // memcpy

      this.arraybytes = newarraybuffer;
      this.maxlength = newmaxlength;
    }
  }

  /**
   * Writes a byte to the byte stream.
   * @param b
   */
  writeByte(b: number) {
    this.ensureWriteableSpace(1);

    let view = new Int8Array(this.arraybytes);

    view[this.position++] = ~~b; // ~~ is cast to int

    if (this.position > this.length) {
      this.length = this.position;
    }
  }

  /**
   * Reads a signed byte from the byte stream.
   * @returns {any}
   */
  readByte() {
    if (this.position >= this.length) {
      throw 'ByteArray out of bounds read. Position=' + this.position + ', Length=' + this.length;
    }

    let view = new Int8Array(this.arraybytes);

    return view[this.position++];
  }

  /**
   * Reads the number of data bytes, specified by the length parameter, from the byte stream.
   * @param bytes
   * @param offset
   * @param length
   */
  readBytes(bytes: ByteArray, offset = 0, length = 0) {
    if (length == null) {
      ({ length } = bytes);
    }

    bytes.ensureWriteableSpace(offset + length);

    let byteView: Int8Array = new Int8Array(bytes.arraybytes);
    let localByteView: Int8Array = new Int8Array(this.arraybytes);

    byteView.set(localByteView.subarray(this.position, this.position + length), offset);

    this.position += length;

    if (length + offset > bytes.length) {
      bytes.length += length + offset - bytes.length;
    }
  }

  /**
   * Writes an unsigned byte from the byte stream.
   * @param b
   */
  writeUnsignedByte(b: number) {
    this.ensureWriteableSpace(1);

    let view = new Uint8Array(this.arraybytes);

    view[this.position++] = ~~b & 0xff; // ~~ is cast to int

    if (this.position > this.length) {
      this.length = this.position;
    }
  }

  /**
   * Reads an unsigned byte from the byte stream.
   * @returns {any}
   */
  readUnsignedByte() {
    if (this.position >= this.length) {
      throw new Error('ByteArray out of bounds read. Position=' + this.position + ', Length=' + this.length);
    }

    let view = new Uint8Array(this.arraybytes);

    return view[this.position++];
  }

  /**
   * Writes a unsigned short to the byte stream.
   * @param b
   */
  writeUnsignedShort(b: number) {
    this.ensureWriteableSpace(2);

    if ((this.position & 1) == 0) {
      let view = new Uint16Array(this.arraybytes);

      view[this.position >> 1] = ~~b & 0xffff; // ~~ is cast to int
    } else {
      let view = new Uint16Array(this.unalignedarraybytestemp, 0, 1);

      view[0] = ~~b & 0xffff;

      let view2 = new Uint8Array(this.arraybytes, this.position, 2);
      let view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 2);

      view2.set(view3);
    }

    this.position += 2;

    if (this.position > this.length) {
      this.length = this.position;
    }
  }

  /**
   * Reads a UTF-8 string from the byte stream
   * @param len
   * @returns {string}
   */
  readUTFBytes(len: number): string {
    let value = '';
    let max: number = this.position + len;
    let data: DataView = new DataView(this.arraybytes);

    // utf8-encode
    while (this.position < max) {
      let c: number = data.getUint8(this.position++);

      if (c < 0x80) {
        if (c == 0) break;
        value += String.fromCharCode(c);
      } else if (c < 0xe0) {
        value += String.fromCharCode(((c & 0x3f) << 6) | (data.getUint8(this.position++) & 0x7f));
      } else if (c < 0xf0) {
        let c2 = data.getUint8(this.position++);

        value += String.fromCharCode(((c & 0x1f) << 12) | ((c2 & 0x7f) << 6) | (data.getUint8(this.position++) & 0x7f));
      } else {
        let c2 = data.getUint8(this.position++);

        let c3 = data.getUint8(this.position++);

        value += String.fromCharCode(
          ((c & 0x0f) << 18) | ((c2 & 0x7f) << 12) | ((c3 << 6) & 0x7f) | (data.getUint8(this.position++) & 0x7f),
        );
      }
    }

    return value;
  }

  /**
   * Reads a signed 32-bit integer from the byte stream.
   * @returns {number}
   */
  readInt(): number {
    let data: DataView = new DataView(this.arraybytes);
    let int: number = data.getInt32(this.position, true);

    this.position += 4;

    return int;
  }

  /**
   * Reads a signed 16-bit integer from the byte stream
   * @returns {number}
   */
  readShort(): number {
    let data: DataView = new DataView(this.arraybytes);
    let short: number = data.getInt16(this.position, true);

    this.position += 2;

    return short;
  }

  /**
   * Reads an IEEE 754 double-precision (64-bit) floating-point number from the byte stream
   * @returns {number}
   */
  readDouble(): number {
    let data: DataView = new DataView(this.arraybytes);
    let double: number = data.getFloat64(this.position, true);

    this.position += 8;

    return double;
  }

  /**
   * Reads an unsigned 16-bit integer from the byte stream
   * @returns {any}
   */
  readUnsignedShort() {
    if (this.position > this.length + 2) {
      throw 'ByteArray out of bounds read. Position=' + this.position + ', Length=' + this.length;
    }

    if ((this.position & 1) == 0) {
      let view = new Uint16Array(this.arraybytes);
      let pa: number = this.position >> 1;

      this.position += 2;

      return view[pa];
    } else {
      let view = new Uint16Array(this.unalignedarraybytestemp, 0, 1);
      let view2 = new Uint8Array(this.arraybytes, this.position, 2);
      let view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 2);

      view3.set(view2);

      this.position += 2;

      return view[0];
    }
  }

  /**
   * Write an unsigned 32-bit integer from the byte stream.
   * @param b
   */
  writeUnsignedInt(b: number) {
    this.ensureWriteableSpace(4);

    if ((this.position & 3) == 0) {
      let view = new Uint32Array(this.arraybytes);

      view[this.position >> 2] = ~~b & 0xffffffff; // ~~ is cast to int
    } else {
      let view = new Uint32Array(this.unalignedarraybytestemp, 0, 1);

      view[0] = ~~b & 0xffffffff; // ~~ is cast to int

      let view2 = new Uint8Array(this.arraybytes, this.position, 4);
      let view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);

      view2.set(view3);
    }

    this.position += 4;

    if (this.position > this.length) {
      this.length = this.position;
    }
  }

  /**
   * Reads an unsigned 32-bit integer from the byte stream.
   * @returns {any}
   */
  readUnsignedInt() {
    if (this.position > this.length + 4) {
      throw 'ByteArray out of bounds read. Position=' + this.position + ', Length=' + this.length;
    }

    if ((this.position & 3) == 0) {
      let view = new Uint32Array(this.arraybytes);
      let pa: number = this.position >> 2;

      this.position += 4;

      return view[pa];
    } else {
      let view = new Uint32Array(this.unalignedarraybytestemp, 0, 1);
      let view2 = new Uint8Array(this.arraybytes, this.position, 4);
      let view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);

      view3.set(view2);

      this.position += 4;

      return view[0];
    }
  }

  /**
   * Writes an IEEE 754 single-precision (32-bit) floating-point number to the byte stream.
   * @param b
   */
  writeFloat(b: number) {
    this.ensureWriteableSpace(4);

    if ((this.position & 3) == 0) {
      let view = new Float32Array(this.arraybytes);

      view[this.position >> 2] = b;
    } else {
      let view = new Float32Array(this.unalignedarraybytestemp, 0, 1);

      view[0] = b;

      let view2 = new Uint8Array(this.arraybytes, this.position, 4);
      let view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);

      view2.set(view3);
    }

    this.position += 4;

    if (this.position > this.length) {
      this.length = this.position;
    }
  }

  /**
   * Reads an IEEE 754 single-precision (32-bit) floating-point number from the byte stream.
   * @returns {any}
   */
  readFloat() {
    if (this.position > this.length + 4) {
      throw 'ByteArray out of bounds read. Position=' + this.position + ', Length=' + this.length;
    }

    if ((this.position & 3) == 0) {
      let view = new Float32Array(this.arraybytes);
      let pa = this.position >> 2;

      this.position += 4;

      return view[pa];
    } else {
      let view = new Float32Array(this.unalignedarraybytestemp, 0, 1);
      let view2 = new Uint8Array(this.arraybytes, this.position, 4);
      let view3 = new Uint8Array(this.unalignedarraybytestemp, 0, 4);

      view3.set(view2);

      this.position += 4;

      return view[0];
    }
  }
}
