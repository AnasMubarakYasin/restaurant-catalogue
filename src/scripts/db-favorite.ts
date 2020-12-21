/* eslint-disable max-len */
import {dbfactory} from '../../lib/db';
import {ListenerHandler, ListenerOptions} from '../../lib/emitter';
import {CardState} from '../components/cards/state';
import {RestaurantDetailData} from '../page/detail/state';
import {CONSTANT} from '../resource/constant';

export interface RestaurantShortData {
  city: string;
  description: string;
  id: string;
  name: string;
  pictureId: string;
  rating: number;
}

type DBMode = 'readwrite' | 'readonly';
type DBBasicSchema = {id: string};
type DBFavoriteStoreAvailable = ['short', 'detail'];

export class DBFavorite {
  constructor() {
    this.name = CONSTANT.DB.FAVORITE.NAME;
    this.key = CONSTANT.DB.FAVORITE.KEY;
    this.index = CONSTANT.DB.FAVORITE.INDEX;
    this.storeAvailable = CONSTANT.DB.FAVORITE.STORE_LIST as DBFavoriteStoreAvailable;
    this.db = dbfactory(this.name);

    this.init();
  }

  private db;

  name
  key
  index
  storeAvailable: DBFavoriteStoreAvailable;

  private async init() {
    const db = await this.db;

    for (const storeName of this.storeAvailable) {
      if (db.objectStoreNames.contains(storeName) === false) {
        await db.createObjectStore(storeName, {autoIncrement: true, keyPath: 'id'});
      }
    }
  }
  private async openTransaction(mode: DBMode) {
    let db = await this.db;

    db = await db.ready;
    db = await db.complete;

    return db.transaction(this.storeAvailable, mode);
  }
  private requestStored(mode: DBMode, ...dataList: Array<DBBasicSchema>) {
    const isPass = this.checkSchema(...dataList);
    if (isPass) {
      return this.openTransaction(mode);
    } else {
      throw new Error('not allowed');
    }
  }
  async getAllShortData(): Promise<Array<CardState>> {
    const transaction = await this.openTransaction('readonly');
    const result = await transaction.store('short').getAll();

    if (result) {
      return result;
    } else {
      throw new TypeError('data not exist');
    }
  }
  async getShortData(id: string): Promise<CardState> {
    const transaction = await this.requestStored('readonly', {id});
    const result = transaction.store('short').get(id);

    return result;
  }
  async getDetailData(id: string): Promise<RestaurantDetailData> {
    const transaction = await this.requestStored('readonly', {id});
    const result = transaction.store('detail').get(id);

    return result;
  }
  async add(shortData: CardState, detailData: RestaurantDetailData) {
    const transaction = await this.requestStored('readwrite', shortData, detailData);

    await transaction.store('short').add(shortData);
    await transaction.store('detail').add(detailData);
  }
  async remove(id: string): Promise<void> {
    const transaction = await this.requestStored('readwrite', {id});

    await transaction.store('short').delete(id);
    await transaction.store('detail').delete(id);
  }
  async count() {
    const transaction = await this.openTransaction('readonly');
    const result = transaction.store('short').count();

    return result;
  }
  async clear() {
    const transaction = await this.openTransaction('readwrite');

    await transaction.store('short').clear();
    await transaction.store('detail').clear();
  }
  async onChange(handler: ListenerHandler, options?: ListenerOptions) {
    const db = await this.db;
    const id = db.onChange('change', handler, options);

    return id;
  }
  private checkSchema(...data: Array<DBBasicSchema>): boolean {
    if (data.length) {
      const idRef = data[0].id;

      return data.every((item) => {
        if (item && item.id && typeof item.id === 'string' && item.id === idRef) {
          return true;
        }
        return false;
      });
    }
    return false;
  }
  removeListener(id: number) {
    this.db.then((db) => db.removeListener(id));
  }
}

export const dbFavorite = new DBFavorite();
