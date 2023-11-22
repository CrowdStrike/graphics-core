/**
 * USAGE:
 *
 *
 *  export class PoolTest
 *  {
 *		constructor()
 *		{
 *
 *			this.counter    = 0;
 *			this.pool       = new ObjectPool( () => this.itemConstructor()  , ( item ) => this.itemDestructor( item ) , 50 , 50 );
 *			this.items      = [];
 *
 *			for ( let c = 0 ; c < 101 ; c ++ )
 *			{
 *				let item        = this.pool.pop();
 *					item.name   = 'name_c';
 *				this.items.push ( item );
 *			}
 *
 *			console.log( this.pool );
 *
 *			setTimeout(()=> this.pushBackToPool() , 10000 );
 *		}
 *
 *		pushBackToPool()
 *		{
 *			for ( let d = 0 ; d < this.items.length ; d ++ )
 *			{
 *				this.pool.push( this.items.pop() );
 *			}
 *		}
 *
 *		itemConstructor()
 *		{
 *			return new PoolTestItem( this.counter ++ );
 *		}
 *
 *		itemDestructor( item )
 *		{
 *			item.name = null;
 *		}
 *
 *	}
 *
 *  module.exports = PoolTest;
 *
 **/
export class ObjectPool<T> {
  private _mCache: T[] = [];
  private _mConstructor: () => T | void;
  private _mDestructor: (v: T) => T | void;
  private _mSize = 0;
  private _mResize = 0;
  private _mPosition = 0;

  /**
   *
   * @param cnstrctr      : Function      - Pool item function factory
   * @param destructor    : Function      - Pool item destructor ( when pool.dispose is called )
   * @param size          : number        - Size of pool
   * @param resize        : number        - number of items to resize pool by
   */
  constructor(cnstrctr: () => T, destructor: (v: T) => T, size: number, resize = 0) {
    this._mCache = [];
    this._mSize = 0;
    this._mResize = 0;
    this._mPosition = 0;

    this._mConstructor = cnstrctr;
    this._mDestructor = destructor;
    this._mResize = resize;

    this._expand(size);
  }

  /**
   * pop an item from the pool
   */
  pop(): T {
    let o = null;

    if (this._mPosition === this._mSize) {
      if (this._mResize === 0) {
        throw new Error('The pool is empty');
      }

      this._expand(this._mResize);
    }

    o = this._mCache[this._mPosition++];

    return o as T;
  }

  /**
   * push an item back to the pool
   */
  push(o: T) {
    this._mCache[--this._mPosition] = o;
  }

  /**
   * destro the pool
   */
  dispose() {
    let i = this._mSize;

    while (i-- > 0) {
      this._mDestructor(this._mCache[i] as T);
    }

    this._mCache = [];
    this._mConstructor = () => undefined;
    this._mDestructor = () => undefined;
    this._mSize = 0;
    this._mResize = 0;
    this._mPosition = 0;
  }

  getCache() {
    return this._mCache;
  }

  /**
   * _expand the pool
   */
  private _expand(count: number) {
    let i = this._mSize;
    let n = this._mSize + count;
    let o = null;

    while (i < n) {
      o = this._mConstructor() as T;

      this._mCache[i] = o;

      i++;
    }

    this._mSize = n;
  }

  /**
   * Length of pool
   */
  getLength() {
    return this._mSize;
  }
}
