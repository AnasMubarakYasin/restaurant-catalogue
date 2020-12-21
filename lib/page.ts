import {Router} from './router';

/* eslint-disable max-len */
type ActionPage = {
  HOME: Action;
  NOT_FOUND: Action;
}
type HandlerNavigationEvent = (path: Path, data: Data) => {};
type LoaderPage = (name: string) => Promise<typeof Page>;

export class PageManager {
  public static isStarting: boolean = false;
  public static setHistory: boolean = true;
  public static logged: boolean = true;
  public static readonly TAG: string = '[PAGE]';
  public static readonly ACTION_PAGE: ActionPage = {
    HOME: 0,
    NOT_FOUND: 1,
  };

  public static log(...args: Array<any>): void {
    if (this.logged) {
      console.log(this.TAG, ...args);
    }
  }

  public static readonly nodeMain: HTMLElement = document.querySelector('main') || document.body;
  public static readonly pageClassMapByPath: Map<Path, typeof Page | string> = new Map();
  public static readonly pageClassMapByAction: Map<number, typeof Page | string> = new Map();
  public static readonly stack: Array<Page> = [];

  public static readonly finalizationRegistryPage = new FinalizationRegistry((name) => {
    console.warn('[GC] the page', name, 'was clean up');
  })
  public static readonly finalizationRegistryContent = new FinalizationRegistry((name) => {
    console.warn('[GC] the content', name, 'was clean up');
  })

  public static loader = (name: string) => Promise.resolve(Page);

  private static readonly handlerList: Array<HandlerNavigationEvent> = [];

  public static register(PageClass: typeof Page | string, ...paths: Array<Path | Action>) {
    for (let path of paths) {
      if (typeof path === 'string') {
        path = Router.resolver(path);
        this.pageClassMapByPath.set(path, PageClass);
        this.log('register by path', path);
      } else if (typeof path === 'number') {
        this.pageClassMapByAction.set(path, PageClass);
        this.log('register by action', path);
      } else {
        throw new TypeError('unknown type');
      }
    }
    return this;
  }

  public static async navigate(path: Path | Action, data: Data = {}): Promise<void> {
    const previousPage = this.stack.shift();
    const pageInfo = this.getPage(path);
    const PageClass = await pageInfo.PageClass;
    const pagePath = pageInfo.path;

    let page = null;

    this.log('navigate to', pagePath);

    if (PageClass) {
      page = new PageClass({targetNode: this.nodeMain});

      if (previousPage) {
        previousPage.destruct();

        console.warn(this.TAG, 'destructing', previousPage.title, 'page');
      }
      try {
        page.build(data);

        this.log('building', page.title);
      } catch (error) {
        console.warn(this.TAG, 'error on build', error);

        return this.navigate(this.ACTION_PAGE.NOT_FOUND);
      }

      this.stack.unshift(page);
    } else {
      if (this.checkPage(PageManager.ACTION_PAGE.NOT_FOUND)) {
        return this.navigate(this.ACTION_PAGE.NOT_FOUND, data);
      } else {
        throw new TypeError('page not exist');
      }
    }

    PageManager.finalizationRegistryPage.register(page, page.title);

    document.title = page.title;

    if (this.setHistory) {
      history.pushState(data, page.title, page.path);
    } else {
      this.setHistory = true;
    }

    for (const handler of this.handlerList) {
      handler(pagePath, data);
    }

    return undefined;
  }
  public static onNavigation(handler: HandlerNavigationEvent) {
    return this.handlerList.push(handler) -1;
  }
  public static async start(path: Path, data: Data) {
    if (this.isStarting === false) {
      window.addEventListener('popstate', (event) => {
        this.setHistory = false;
        this.navigate(location.pathname, event.state);
      });
      if (Router.isAbsolute(path)) {
        this.navigate(path, data);
      } else {
        this.navigate(Router.resolver(path), data);
      }
    } else {
      throw new Error('start only once invoke');
    }
    return this;
  }
  public static async redirect(path: Path | Action, data: Data = {}) {
    const previousPage = this.stack.shift();
    const pageInfo = this.getPage(path);
    const PageClass = await pageInfo.PageClass;
    const pagePath = pageInfo.path;

    if (PageClass) {
      this.log('redirecting to', pagePath);

      const page = new PageClass({targetNode: this.nodeMain});

      if (previousPage) {
        console.warn(this.TAG, 'destructing', previousPage.title, 'page');

        previousPage.destruct();
      }

      page.build(data);

      this.log('building', page.title);

      this.stack.unshift(page);
      PageManager.finalizationRegistryPage.register(page, page.title);
      history.replaceState(data, page.title, page.path);
    } else {
      throw new RangeError('page not exist');
    }
  }
  public static back() {
    history.back();
  }
  public static forward() {
    history.forward();
  }
  public static setLoaderPage(loader: LoaderPage) {
    this.loader = loader;

    return this;
  }
  private static getPage(path: Path | Action) {
    let PageClass = undefined;
    if (typeof path === 'string') {
      path = Router.resolver(path);
      this.log('get page', path);
      PageClass = this.pageClassMapByPath.get(path);
    } else if (typeof path === 'number') {
      PageClass = this.pageClassMapByAction.get(path);
      if (path === this.ACTION_PAGE.HOME) {
        path = Router.resolver('home');
      } else {
        path = Router.resolver('404');
      }
    }
    if (typeof PageClass === 'string') {
      PageClass = this.loader(PageClass).then((module: any) => module[Object.keys(module)[0]]);
    } else {
      PageClass = Promise.resolve(PageClass);
    }
    return {path, PageClass};
  }
  private static checkPage(path: Path | Action) {
    if (typeof path === 'string') {
      return this.pageClassMapByPath.has(path);
    } else {
      return this.pageClassMapByAction.has(path);
    }
  }
}

type Path = string;
type Action = number;
type Data = {[key: string]: any};
type PageParams = {
  targetNode: HTMLElement
}

export class Page {
  public static Class = class Page {};
  public constructor({targetNode}: PageParams) {
    this.element = document.createElement('div');
    this.targetNode = targetNode;
    this.title = '';
    this.path = '';
  }

  public title: string;
  public path: Path;

  private element: HTMLElement;
  private targetNode: HTMLElement;


  protected setContent(element: HTMLElement): void {
    this.element = element;
    PageManager.finalizationRegistryContent.register(element, this.title);
  };

  protected create(data: Data) {

  }
  protected destroy() {

  }

  public build(data: Data) {
    this.create(data);
    this.attach();
  }
  public destruct() {
    this.destroy();
    this.detach();
  }

  private attach() {
    this.targetNode.append(this.element);
  }
  private detach() {
    this.element.remove();
    this.element = document.createElement('div');
  }
}
