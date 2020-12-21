// eslint-disable-next-line max-len
import {Emitter, EventEmitter, EventEmitterInstanceSpec, EventType, ListenerHandler, ListenerId, ListenerOptions} from './emitter';

const finalizationRegistry = new FinalizationRegistry((name) => {
  console.warn('[GC]', name, 'was clean up');
});

// eslint-disable-next-line prefer-const
export const dbconfig = {
  TAG: '[DB]',
  logged: true,
  log(...args: Array<any>) {
    if (this.logged) {
      console.log(this.TAG, ...args);
    }
  },
};

/* eslint-disable max-len */
export async function dbfactory(name: string, key: number = 0): Promise<DBDatabase> {
  if (key === 0) {
    if (indexedDB.databases) {
      const list = await indexedDB.databases() as Array<{name: string, version: number}>;
      const result = list.find!((db) => db.name === name);

      if (result) {
        key = result.version;
      }
    }
  }
  if (key === 0) {
    key = 1;
  }

  const request = indexedDB.open(name, key);

  let session: Session;

  const ready: Promise<IDBDatabase> = new Promise((resolve, reject) => {
    session = new Session(resolve, reject);
  });
  let db: DBDatabase | undefined = undefined;

  return await new Promise((resolve, reject) => {
    request.addEventListener('success', (event) => {
      if (db) {
        session.success(request.result);
      } else {
        resolve(db = new DBDatabase(request, ready));

        session.success(request.result);
      }
      finalizationRegistry.register(db, db.name);

      dbconfig.log('success');
    });
    request.addEventListener('error', (event) => {
      reject(request);

      session.error(request.error);

      console.error(dbconfig.TAG, 'error', request);
    });
    request.addEventListener('blocked', (event) => {
      reject(request);

      session.error(request.error);

      console.error(dbconfig.TAG, 'blocked', request);
    });
    request.addEventListener('upgradeneeded', async (event) => {
      resolve(db = new DBDatabase(request, ready));

      dbconfig.log('upgradeneeded');
    });
  });
}

class Session {
  constructor(resolve: (value: any) => void, reject: (reason?: any) => void) {
    this.success = resolve;
    this.error = reject;
  }
  success;
  error;
}

class DBDatabase {
  constructor(request: IDBOpenDBRequest, ready: Promise<IDBDatabase>) {
    this.db = request.result;
    this.request = request;
    this.name = this.db.name;
    this.ready = ready.then((db) => {
      this.db = db;
      this.transactionStore = undefined;
      dbconfig.log('ready transaction');
      return this;
    });
    this.emitter = new Emitter();
    this.complete = Promise.resolve(this);

    this.db.addEventListener('abort', (event) => {
      dbconfig.log('abort');
    });
    this.db.addEventListener('close', (event) => {
      dbconfig.log('close');
    });
    this.db.addEventListener('error', (event) => {
      dbconfig.log('error');
    });
    this.db.addEventListener('versionchange', (event) => {
      dbconfig.log('versionchange');
    });
  }

  private db;
  private transactionStore: IDBTransaction | undefined;
  private objectStoreList: Array<DBObjectStore> = [];
  private modeTransaction: 'readonly' | 'readwrite' | 'versionchange' | undefined;
  private emitter: Emitter;

  public name;
  public request;
  public ready: Promise<DBDatabase>;
  public complete: Promise<DBDatabase>;
  public get mode() {
    return this.modeTransaction;
  }
  public get objectStoreNames() {
    return this.db.objectStoreNames;
  }
  public get isTransactionOpen() {
    if (this.transactionStore || this.request.transaction) {
      return true;
    } else {
      return false;
    }
  }

  async createObjectStore(name: string, option?: {autoIncrement?: boolean, keyPath?: string}): Promise<DBObjectStore> {
    if (this.request.transaction === null) {
      let dispatcher = (value: DBDatabase | PromiseLike<DBDatabase>) => {};

      this.db.close();
      this.ready = new Promise((resolve) => {
        dispatcher = resolve;
      });

      const db = await dbfactory(this.db.name, this.db.version +1);

      this.db = db.db;
      this.request = db.request;
      this.emitter = db.emitter;
      this.ready = db.ready.then((db) => {
        dispatcher(db);

        return db;
      });
    }
    const objectStore = new DBObjectStore(this.db.createObjectStore(name, option), this);
    finalizationRegistry.register(objectStore, 'object store '+ objectStore.name);
    return objectStore;
  }

  public transaction(
      objectStoreNames: string | Array<string>,
      mode?: 'readonly' | 'readwrite' | 'versionchange' | undefined,
      option?: {durability: 'default' | 'strict' | 'relaxed'},
  ) {
    if (this.request.transaction) {
      throw new RangeError('the db '+ this.name +'must be ready before making transactions');
    }
    const objectStoreNameList: Array<string> = [];

    this.transactionStore = this.db.transaction(objectStoreNames, mode, option);
    this.modeTransaction = mode;

    dbconfig.log('transaction open', mode, objectStoreNames);

    if (typeof objectStoreNames === 'string') {
      objectStoreNameList.push(objectStoreNames);
    } else {
      for (const objectStoreName of objectStoreNames) {
        objectStoreNameList.push(objectStoreName);
      }
    }

    for (const objectStoreName of objectStoreNameList) {
      const objectStore = create(objectStoreName, this.transactionStore, this);
      this.objectStoreList.push(objectStore);
      finalizationRegistry.register(objectStore, 'object store '+ objectStore.name);
    }

    let session: Session;

    this.complete = new Promise((resolve, reject) => {
      session = new Session(resolve, reject);
    });

    this.transactionStore.addEventListener('abort', (event) => {
      empty(this);

      session.error(this.transactionStore!.error);

      dbconfig.log('transaction abort');
    });
    this.transactionStore.addEventListener('error', (event) => {
      empty(this);

      session.error(this.transactionStore!.error);

      dbconfig.log('transaction error');
    });
    this.transactionStore.addEventListener('complete', (event) => {
      empty(this);

      session.success(this);

      dbconfig.log('transaction complete');
    });

    return this;

    function create(name: string, transaction: IDBTransaction, context: DBDatabase) {
      const objectStore = new DBObjectStore(transaction.objectStore(name), context);
      return objectStore;
    }
    function empty(db: DBDatabase) {
      db.transactionStore = undefined;
      db.objectStoreList.length = 0;
    }
  }
  public store(name: string) {
    const objectStore = this.objectStoreList.find((objectStore) => objectStore.name === name);
    if (objectStore) {
      return objectStore;
    } else {
      let message = 'object store not exist';
      if (this.request.transaction) {
        message = 'versionchange transaction open';
      }
      throw new RangeError(dbconfig.TAG +' '+ message);
    }
  }
  public emit(event: DBEventChange) {
    this.emitter.emit(event);
  }
  public onChange(type: EventType, handler: ListenerHandler, options?: ListenerOptions) {
    if (type === 'change') {
      return this.emitter.on(type, handler, options);
    } else {
      throw new TypeError('not implement type event');
    }
  }
  public removeListener(id: ListenerId) {
    this.emitter.remove(id);
  }
}

class DBEventChange extends EventEmitter {}
type DBObjectStoreMethod = 'add' |
  'get' |
  'getAll' |
  'put' |
  'openCursor' |
  'delete' |
  'clear' |
  'count' |
  'createIndex' |
  'index' |
  'deleteIndex'
;

class DBObjectStore {
  constructor(objectStore: IDBObjectStore, database: DBDatabase) {
    this.objectStore = objectStore;
    this.name = objectStore.name;
    this.database = database;
    this.allowedEmit = ['add', 'put', 'delete', 'clear'];
  }

  private objectStore
  private allowedEmit: Array<string>;

  public name;
  public database;

  public get isTransactionOpen() {
    if (this.database.isTransactionOpen) {
      return true;
    } else {
      return false;
    }
  }
  private emitting(method: DBObjectStoreMethod) {
    if (this.allowedEmit.includes(method)) {
      const extra: EventEmitterInstanceSpec = {
        data: {
          mode: this.database.mode,
          name: this.database.name,
          storeName: this.name,
          method: method,
        },
      };
      const event = new DBEventChange('change', extra);

      this.database.emit(event);
    }
  }
  private promising<T>(request: IDBRequest<T>, method: DBObjectStoreMethod): Promise<T> {
    return new Promise((resolve, reject) => {
      request.addEventListener('error', (event) => {
        dbconfig.log('request', method, 'error');

        reject(request);
      });
      request.addEventListener('success', (event) => {
        dbconfig.log('request', method, 'success');

        this.emitting(method);

        resolve(request.result);
      });
    });
  }
  add(value: any, key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey): Promise<IDBValidKey> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.add(value, key);

      return this.promising(request, 'add');
    } else {
      console.warn(dbconfig.TAG, 'request add fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.add(value);
    }
  }
  get(query: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange): Promise<any> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.get(query);

      return this.promising(request, 'get');
    } else {
      console.warn(dbconfig.TAG, 'request get fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.get(query);
    }
  }
  getAll(
      query?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange,
      count?: number | undefined,
  ): Promise<Array<any>> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.getAll(query, count);

      return this.promising(request, 'getAll');
    } else {
      console.warn(dbconfig.TAG, 'request getAll fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.getAll(query, count);
    }
  }
  put(value: any, key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | undefined): Promise<IDBValidKey> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.put(value, key);

      return this.promising(request, 'put');
    } else {
      console.warn(dbconfig.TAG, 'request put fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);
      return objectStore.put(value, key);
    }
  }
  openCursor(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection): Promise<IDBCursorWithValue | null> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.openCursor(query, direction);

      return this.promising(request, 'openCursor');
    } else {
      console.warn(dbconfig.TAG, 'request openCursor fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.openCursor(query, direction);
    }
  }
  delete(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange): Promise<undefined> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.delete(key);

      return this.promising(request, 'delete');
    } else {
      console.warn(dbconfig.TAG, 'request delete fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.delete(key);
    }
  }
  clear(): Promise<undefined> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.clear();

      return this.promising(request, 'clear');
    } else {
      console.warn(dbconfig.TAG, 'request clear fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.clear();
    }
  }
  count(key?: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange | undefined): Promise<number> {
    if (this.isTransactionOpen) {
      const request = this.objectStore.count(key);

      return this.promising(request, 'count');
    } else {
      console.warn(dbconfig.TAG, 'request count fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.count(key);
    }
  }

  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters | undefined): DBIndex {
    if (this.isTransactionOpen) {
      dbconfig.log('request create index');

      const index = new DBIndex(this.objectStore.createIndex(name, keyPath, options), this);
      finalizationRegistry.register(index, 'index '+ index.name);

      return index;
    } else {
      console.warn(dbconfig.TAG, 'create index fallback');

      return (this.database
          .transaction(this.name, this.database.mode))
          .store(this.name)
          .createIndex(name, keyPath, options);
    }
  }

  index(name: string): DBIndex {
    if (this.isTransactionOpen) {
      dbconfig.log('index');

      const index = new DBIndex(this.objectStore.index(name), this);
      finalizationRegistry.register(index, 'index '+ index.name);

      return index;
    } else {
      console.warn(dbconfig.TAG, 'index fallback');

      const objectStore = (this.database.transaction(this.name, this.database.mode)).store(this.name);

      return objectStore.index(name);
    }
  }
  deleteIndex(name: string): void {
    if (this.isTransactionOpen) {
      dbconfig.log('delete index');

      return this.objectStore.deleteIndex(name);
    } else {
      console.warn(dbconfig.TAG, 'delete index fallback');

      return (this.database
          .transaction(this.name, this.database.mode))
          .store(this.name)
          .deleteIndex(name);
    }
  }
  release() {
    this.database = undefined;
    this.objectStore = undefined;
  }
}

class DBIndex {
  constructor(index: IDBIndex, objectStore: DBObjectStore) {
    this.index = index;
    this.objectStore = objectStore;
    this.name = index.name;
  }

  private index
  private objectStore;

  public name

  private promising<T>(request: IDBRequest<T>, method: string): Promise<T> {
    return new Promise((resolve, reject) => {
      request.addEventListener('error', (event) => {
        dbconfig.log('request', method, 'error');

        reject(request);
      });
      request.addEventListener('success', (event) => {
        dbconfig.log('request', method, 'success');

        resolve(request.result);
      });
    });
  }

  get(key: string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange): Promise<any> {
    if (this.objectStore.isTransactionOpen) {
      const request = this.index.get(key);

      return this.promising(request, 'get');
    } else {
      console.warn(dbconfig.TAG, 'index fallback');

      const index = (this.objectStore.database
          .transaction(this.objectStore.name, 'readonly'))
          .store(this.objectStore.name)
          .index(this.index.name);

      return index.get(key);
    }
  }

  release() {
    this.objectStore = undefined;
    this.index = undefined;
  }
}
