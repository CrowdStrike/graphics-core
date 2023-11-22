// https://github.com/jakesgordon/bin-packing/blob/master/js/packer.js

import type { Block, Fit } from './Block';

/******************************************************************************
 This is a very simple binary tree based bin packing algorithm that is initialized
 with a fixed width and height and will fit each block into the first node where
 it fits and then split that node into 2 parts (down and right) to track the
 remaining whitespace.
 Best results occur when the input blocks are sorted by height, or even better
 when sorted by max(width,height).
 Inputs:
 ------
 width:       width of target rectangle
 height:      height of target rectangle
 blocks: array of any objects that have .width and .height attributes
 Outputs:
 -------
 marks each block that fits with a .fit attribute pointing to a
 node with .x and .y coordinates
 Example:
 -------
 let blocks = [
 { width: 100, height: 100 },
 { width: 100, height: 100 },
 { width:  80, height:  80 },
 { width:  80, height:  80 },
 etc
 etc
 ];
 let packer = new Packer(500, 500);
 packer.fit(blocks);
 for(let n = 0 ; n < blocks.length ; n++) {
    let block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.width, block.height);
    }
  }
 ******************************************************************************/

export class Packer {
  blocksArray: Block[] = [];
  private _width: number;
  private _height: number;

  root: Fit;

  constructor(width: number, height: number) {
    this.init(width, height);
    this._width = width;
    this._height = height;
    this.root = { x: 0, y: 0, w: width, h: height };
  }

  /**
   * initialised the Packer ( width / height )
   * @param w
   * @param h
   */
  init(w: number, h: number) {
    this.root = { x: 0, y: 0, w, h };
  }

  /**
   * Fir a block into the packer
   * @param b : Block
   */
  fitBlock(b: Block) {
    this.blocksArray.push(b);
    this.fit(this.blocksArray);
  }

  /**
   * check if a block fits into the Packer \
   *
   * @param b : Block
   * @returns {boolean}
   */
  doesBlockFit(b: Block): boolean {
    let clonedArray = this.blocksArray.slice(0);

    clonedArray.push(b);

    this.fit(clonedArray);

    return b.fit !== null;
  }

  /**
   * Fit an array of blocks
   *
   * @param blocks : Array<Blocks>
   */
  fit(blocks: Block[]) {
    this.init(this._width, this._height);

    let n;
    let node;
    let block;

    for (n = 0; n < blocks.length; n++) {
      block = blocks[n] as Block;
      block.fit = null;
      node = this._findNode(this.root, block.w, block.h);

      if (node) {
        block.fit = this._splitNode(node, block.w, block.h);

        if (block.fit) {
          block.x = block.fit.x;
          block.y = block.fit.y;
        }
      }
    }
  }

  /**
   * find a partition for a node
   *
   * @param root
   * @param w
   * @param h
   * @returns {*}
   * @private
   */
  _findNode(root: Fit | undefined, w: number, h: number): Fit | null {
    if (root?.used) {
      return this._findNode(root.right, w, h) || this._findNode(root.down, w, h);
    } else if (root && w <= root.w && h <= root.h) {
      return root;
    } else {
      return null;
    }
  }

  /**
   * Split a node
   *
   * @param node
   * @param w
   * @param h
   * @returns {*}
   * @private
   */
  _splitNode(node: Fit, w: number, h: number): Fit {
    node.used = true;
    node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
    node.right = { x: node.x + w, y: node.y, w: node.w - w, h };

    return node;
  }
}
