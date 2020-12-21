import {genRandomString} from './helper';

abstract class Mutable<T, K> {
  get Class() {
    return Mutable;
  }
  abstract attach(element: HTMLElement): Mutable<T, K>;
  abstract set(value: T): void
  abstract get(): K
  abstract release(): void;
}
export class MutableTextNode extends Mutable<string, string> {
  private instance: Text;
  private element: Element | null;
  constructor(text: string = '') {
    super();

    this.instance = document.createTextNode(text);
    this.element = null;
  }
  attach(element: Element): MutableTextNode {
    this.element = element;
    this.element.append(this.instance);

    return this;
  }
  set(value: string): void {
    this.instance.textContent = value;
  }
  get(): string {
    return this.instance.textContent || '';
  }
  release(): void {
    delete this.element;
    delete this.instance;
  }
}
export class MutableAttrNode<T> extends Mutable<string, string> {
  private instance: Attr;
  private parent: Element | DocumentFragment;
  private map: Map<string, T>;
  private list: Set<string>;
  constructor(
      type: string, value: string = '', extraValue: T | undefined = undefined,
  ) {
    super();

    this.instance = document.createAttribute(type);
    this.parent = document.createDocumentFragment();
    this.instance.textContent = value;
    this.map = new Map();
    this.list = new Set();

    if (value) {
      this.add(value, extraValue);
    }
  }
  private update() {
    this.instance.textContent = [...this.list.values()].join(' ');
  }
  attach(element: Element): MutableAttrNode<T> {
    element.setAttributeNode(this.instance);
    this.parent = element;

    return this;
  }
  set(value: string | number): void {
    this.instance.textContent = value.toString();
  }
  get(): string {
    return this.instance.textContent || '';
  }
  getType() {
    return this.instance.name;
  }
  item(name: string): T | undefined {
    return this.map.get(name);
  }
  contains(name: string): boolean {
    return this.list.has(name);
  }
  add(value: string | number, extraValue: T | undefined = undefined) {
    value = value.toString().trim();
    if (extraValue) {
      this.map.set(value, extraValue);
    }
    this.list.add(value);
    this.update();
  }
  remove(value: string) {
    value = value.trim();
    this.map.delete(value);
    this.list.delete(value);
    this.update();
  }
  replace(
      oldValue: string | number,
      newValue: string | number,
      extraValue: T | undefined = undefined,
  ) {
    oldValue = oldValue.toString().trim();
    newValue = newValue.toString().trim();
    if (extraValue) {
      this.map.delete(oldValue);
      this.map.set(newValue, extraValue);
    }
    this.list.delete(oldValue);
    this.list.add(newValue);
    this.update();
  }
  supports(): boolean {
    throw new Error('Method not implemented.');
  }
  toggle(value: string, extraValue: T | undefined = undefined): boolean {
    value = value.trim();
    let exist = false;
    if (this.list.has(value)) {
      this.remove(value);
      exist = false;
    } else {
      this.add(value, extraValue);
      exist = true;
    }
    return exist;
  }
  release() {
    this.map.clear();
    this.list.clear();
    if (this.parent instanceof Element) {
      this.parent.removeAttributeNode(this.instance);
    }
    delete this.parent;
    delete this.instance;
  }
  keys() {
    return this.list.keys();
  }
  extraValues() {
    return this.map.values();
  }
}
type ElementAttributes = {
  [name: string]: any;
}

export class MutableNode extends Mutable<HTMLElement, HTMLElement> {
  private instance: HTMLElement;
  constructor(
      tag: keyof HTMLElementTagNameMap | string,
      attributes: ElementAttributes = {},
      children: Array<Element> = [],
  ) {
    super();

    this.instance = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (key[0] === 'o' && key[1] === 'n') {
        this.instance.addEventListener(key.slice(2), value);
      } else {
        this.instance.setAttribute(key, value);
      }
    }
    this.instance.append(...children);
  }
  attach(element: Element): void {
    throw new Error('Method not implemented.');
  }
  set(value: HTMLElement) {
    if (this.instance.isConnected) {
      if (this.instance.replaceWith) {
        this.instance.replaceWith(value);
      } else {
        if (this.instance.parentElement) {
          this.instance.parentElement.replaceChild(value, this.instance);
        } else {
          throw new Error('element parent not exist');
        }
      }
    }
    this.instance = value;
  }
  get(): HTMLElement {
    return this.instance;
  }
  render() {
    return this.instance;
  }
  release(): void {
    delete this.instance;
  }
}
export class MutableChildNodes extends Mutable<Node | string, HTMLCollection> {
  private parent: Element | DocumentFragment;
  constructor(...nodes: Array<Node | string>) {
    super();

    this.parent = document.createDocumentFragment();
    this.parent.append(...nodes);
  }
  attach(parent: Element): MutableChildNodes {
    parent.append(this.parent);
    this.parent = parent;

    return this;
  }
  set(...nodes: Array<Node | string>) {
    this.parent.replaceChildren(...nodes);
  }
  get(): HTMLCollection {
    return this.parent.children;
  }
  splice(start = 0, deleteCount = 0, ...nodes: Array<Node | string>) {
    const deleted = [];
    const length = this.parent.children.length;
    let limit = 0;
    if (start < 0) {
      start = length + start;
      limit = start + deleteCount;
    } else {
      limit = deleteCount + start;
    }
    limit = limit > length ? length : limit;
    for (let index = start; index < limit; index++) {
      deleted.push(document.adoptNode(this.parent.children[index]));
    }
    if (nodes.length) {
      const tmp = document.createDocumentFragment();
      tmp.append(...nodes);
      this.parent.insertBefore(tmp, this.parent.children[start]);
    }
    return deleted;
  }
  clear() {
    for (const element of [...this.parent.children]) {
      element.remove();
    }
  }
  concat(...nodes: Array<Node | string>) {
    return [...this.parent.children, ...nodes];
  }
  forEach(callBackFunc: (value: Element, index: number) => void) {
    const length = this.parent.children.length;
    const children = this.parent.children;
    for (let index = 0; index < length; index++) {
      callBackFunc(children[index], index);
    }
  }
  push(...nodes: Array<Node | string>) {
    this.parent.append(...nodes);
  }
  unshift(...nodes: Array<Node | string>) {
    this.parent.prepend(...nodes);
  }
  pop() {
    const element = this.parent.children.item(this.parent.children.length -1);
    if (element) {
      return document.adoptNode(element);
    }
    return undefined;
  }
  shift() {
    const element = this.parent.children.item(0);
    if (element) {
      return document.adoptNode(element);
    }
    return undefined;
  }
  sort(compareFunc: Compare) {
    return [...this.parent.children].sort(compareFunc);
  }
  reverse() {
    return [...this.parent.children].reverse();
  }
  filter(predicate: Predicate) {
    return [...this.parent.children].filter(predicate);
  }
  some(predicate: Predicate) {
    return [...this.parent.children].some(predicate);
  }
  every(predicate: Predicate) {
    return [...this.parent.children].every(predicate);
  }
  find(predicate: Predicate) {
    return [...this.parent.children].find(predicate);
  }
  findIndex(predicate: Predicate) {
    return [...this.parent.children].findIndex(predicate);
  }
  release(): void {
    this.clear();
    delete this.parent;
  }
}
type Predicate = (value: Element, index: number) => boolean;
type Compare = (a: Element, b: Element) => number;

export class MutableAttrNodes
  extends Mutable<MutableAttrNode<unknown>, Array<MutableAttrNode<unknown>>> {
  private readonly map: Map<string, MutableAttrNode<unknown>>;
  private readonly parent: Element | DocumentFragment;

  constructor(attrs: Attributes) {
    super();

    this.map = new Map();
    this.parent = document.createDocumentFragment();

    for (const [key, value] of Object.entries(attrs)) {
      this.map.set(key, new MutableAttrNode(key, value, undefined));
    }
  }
  attach(parent: Element): MutableAttrNodes {
    for (const mutableAttr of this.map.values()) {
      mutableAttr.attach(parent);
    }
    this.parent = parent;

    return this;
  }
  set(...mutableAttrs: Array<MutableAttrNode<unknown>>) {
    for (const mutableAttr of this.map.values()) {
      mutableAttr.release();
    }
    this.map.clear();
    for (const mutableAttr of mutableAttrs) {
      this.map.set(mutableAttr.getType(), mutableAttr);
      mutableAttr.attach(this.parent as Element);
    }
  }
  get(): Array<MutableAttrNode<unknown>> {
    return [...this.map.values()];
  }
  getNamedItem(name: string) {
    return this.map.get(name);
  }
  setNamedItem(
      type: string, value: string, extravalue: unknown | undefined = undefined,
  ) {
    let attr = this.map.get(type);
    if (attr) {
      attr.release();
    }
    attr = new MutableAttrNode(type, value, extravalue);
    attr.attach(this.parent as Element);
    this.map.set(type, attr);
  }
  removeNamedItem(type: string) {
    const attr = this.map.get(type);
    if (attr) {
      attr.release();
    }
    this.map.delete(type);
  }
  toggleNamedItem(type: string) {
    if (this.map.has(type)) {
      this.removeNamedItem(type);
    } else {
      this.setNamedItem(type, '', undefined);
    }
  }
  release(): void {
    throw new Error('Method not implemented.');
  }
}
type Attributes = {
  [type: string]: string;
}

export class TemplateManager {
  private id: string;
  private instance: HTMLTemplateElement;
  private marker: Marker;
  constructor(name: string, node: Element, marker: Marker) {
    this.id = name;
    this.instance = document.createElement('template');
    this.instance.content.append(node);
    this.instance.id = this.id;
    this.marker = marker;
  }
  adopt() {
    throw new Error('Method not implemented.');
  }
  clone() {
    const nodeClone = this.instance.content.firstElementChild!.cloneNode(true);
    this.marker.retrieve(nodeClone as Element);
    return {
      node: nodeClone,
      marker: this.marker,
    };
  }
}
type Mark = {
  name: string
  type: 'text' | 'attr' | 'node' | 'childNodes'
  selector: string;
  value: string
}
type MarkerType = 'text' | 'attr' | 'node' | 'childNodes';
export class Marker {
  private isLocked: boolean = false;
  private map: Map<string, Mutable<any, any>> = new Map();
  private list: Array<Mark> = [];
  useNameAsSelector = false;

  mark(name: string, type: MarkerType, value: string = '') {
    const selector = this.useNameAsSelector ? name : genRandomString(4);
    this.list.push({name, type, value, selector});
  }
  retrieve(root: Element) {
    if (this.isLocked) {
      throw new Error('marker is locked');
    }
    for (const marker of this.list) {
      const element = root.querySelector('.'+ marker.selector);
      let node = null;
      if (marker.type === 'text') {
        node = new MutableTextNode(marker.value);
      } else if (marker.type === 'attr') {
        node = new MutableAttrNode(marker.value, '');
      } else if (marker.type === 'node') {
        node = new MutableNode(marker.value);
      } else if (marker.type === 'childNodes') {
        node = new MutableChildNodes();
      }
      if (element && node) {
        node.attach(element);
        this.map.set(marker.name, node);
      } else {
        throw new Error('node target not exist');
      }
    }
    this.isLocked = true;
    this.list.length = 0;
  }
  clear() {
    this.map.clear();
    this.list.length = 0;
  }
  get(name: string) {
    return this.map.get(name);
  }
}
