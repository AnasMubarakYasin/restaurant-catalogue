export interface MenuDataState {
  menus: Array<MenuDataItem>;
}

export interface MenuActionState {
  LOADED: 0;
  LOADING: 1;
}

export type MenuDataItem = {name: string, list: Array<MenuItemState>}
export type MenuItemState = {name: string}
