/* eslint-disable max-len */
export function itActsAsFavoriteRestaurantDb(db) {
  afterEach(() => {
    return db.clear();
  });

  it('should be able add data both short and detail', async () => {
    await db.add({id: 'b'}, {id: 'b'});

    expect(await db.getShortData('b')).toEqual({id: 'b'});
    expect(await db.getDetailData('b')).toEqual({id: 'b'});
  });

  it('should be able remove data both short and detail', async () => {
    await db.add({id: 'c'}, {id: 'c'});

    expect(await db.count()).toEqual(1);

    await db.remove('c');

    expect(await db.count()).toEqual(0);
  });

  it('should be able clear all data both short and detail', async () => {
    await db.add({id: 'v'}, {id: 'v'});
    await db.add({id: 's'}, {id: 's'});

    expect(await db.count()).toEqual(2);

    await db.clear();

    expect(await db.count()).toEqual(0);
  });

  it('should be able get all short data', async () => {
    await db.add({id: 'f'}, {id: 'f'});
    await db.add({id: 'w'}, {id: 'w'});
    await db.add({id: 'l'}, {id: 'l'});

    expect(await db.getAllShortData()).toEqual(jasmine.arrayContaining([{id: 'f'}, {id: 'w'}, {id: 'l'}]));
  });

  it('should be able get detail data', async () => {
    await db.add({id: 'd'}, {id: 'd'});

    expect(await db.getDetailData('d')).toEqual({id: 'd'});
  });

  it('should not add if accept different id between short and detail', async () => {
    expectAsync(db.add({id: 'a'}, {id: 'c'})).toBeRejectedWithError(Error, 'not allowed');

    expect(await db.count()).toEqual(0);
  });

  it('should not add, remove and get if type of id not string', async () => {
    expectAsync(db.add({id: 1}, {id: 1})).toBeRejectedWithError(Error, 'not allowed');

    expect(await db.count()).toEqual(0);

    expectAsync(db.remove(1)).toBeRejectedWithError(Error, 'not allowed');

    expectAsync(db.getShortData(1)).toBeRejectedWithError(Error, 'not allowed');
    expectAsync(db.getDetailData(1)).toBeRejectedWithError(Error, 'not allowed');
  });

  it('should not add, remove and get if id not exist', async () => {
    expectAsync(db.add({name: 1}, {name: 1})).toBeRejectedWithError(Error, 'not allowed');

    expect(await db.count()).toEqual(0);

    expectAsync(db.remove()).toBeRejectedWithError(Error, 'not allowed');
    expectAsync(db.getShortData()).toBeRejectedWithError(Error, 'not allowed');
    expectAsync(db.getDetailData()).toBeRejectedWithError(Error, 'not allowed');
  });

  it('should not add if type of id between short and detail different', async () => {
    expectAsync(db.add({id: 0}, {id: 'a'})).toBeRejectedWithError(Error, 'not allowed');

    expect(await db.count()).toEqual(0);
  });

  it('should not add, remove and get if id empty string', async () => {
    expectAsync(db.add({id: ''}, {id: ''})).toBeRejectedWithError(Error, 'not allowed');

    expect(await db.count()).toEqual(0);

    expectAsync(db.remove()).toBeRejectedWithError(Error, 'not allowed');
    expectAsync(db.getShortData()).toBeRejectedWithError(Error, 'not allowed');
    expectAsync(db.getDetailData()).toBeRejectedWithError(Error, 'not allowed');
  });

  it('should call listener on change if db storage change', async () => {
    const listener = jasmine.createSpy('listener');

    const id = await db.onChange(listener);

    await db.add({id: 'r'}, {id: 'r'});
    await db.remove('r');
    await db.clear();

    expect(listener).toHaveBeenCalledTimes(6);

    db.removeListener(id);
  });
}
