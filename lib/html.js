/* eslint-disable max-len */
// const TAG = 0;
const ELEMENT = 1;
// const ATTRIBUTES = 2;
// const TEXT = 3;
const CHILD = 4;
const INTERPOLATE = '${}';
const DEFAULT_ASSIGN = document.createElement('div');
const COMPONENT_FINAL_REGISTRY = [];

let isAsyncReplace = false;
let autoBackAsync = isAsyncReplace;

const componentIdMap = new Map();
const root = {
  isAsynchReplace: isAsyncReplace,
  registerId: registerId,
  clearId: clearId,
  changeId: changeId,
};

// window.root = root;
// window.compenentIdMap = componentIdMap;
window.COMPONENT_FINAL_REGISTRY = COMPONENT_FINAL_REGISTRY;

export function getComponentById(id) {
  return componentIdMap.get(id);
}
export function createTextNode(value) {
  const text = document.createTextNode(value);
  return {
    attach(parent) {
      parent.append(text);
    },
    set(value) {
      text.textContent = value;
    },
    get() {
      return text.textContent;
    },
  };
}
export function createAttrNode(name, value) {
  const attr = document.createAttribute(name);
  attr.textContent = value;
  const result = {};
  // addProperty(result, name, attr);
  addProperty(result, 'node', attr);
  addProperty(result, 'set', (value) => {
    attr.textContent = value;
  }, {configurable: false, enumerable: false, writable: false});
  addProperty(result, 'get', () => {
    return attr.textContent;
  }, {configurable: false, enumerable: false, writable: false});
  return result;
}
export function createNode(tag = 'div', attributes = {}, children = []) {
  let element = /**/html`<${tag} ...${attributes}></>`;
  for (const child of children) {
    if (child instanceof Node) {
      element.append(child);
    } else {
      element.append(child.get());
    }
  }
  return {
    set(value) {
      if (element.isConnected) {
        if (element.replaceWith) {
          element.replaceWith(value);
        } else {
          element.parentElement.replaceChild(value, element);
        }
        element = value;
      } else {
        element = value;
      }
    },
    get() {
      return element;
    },
    render() {
      return element;
    },
  };
}
export function createChildNodes(...nodes) {
  let fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return {
    get() {
      return fragment.childNodes;
    },
    set(...nodes) {
      fragment.replaceChildren(...nodes);
    },
    attach(parent) {
      parent.append(fragment);
      fragment = parent;
    },
    splice(start = 0, deleteCount = 0, ...nodes) {
      const deleted = [];
      const length = fragment.childNodes.length;
      let limit = 0;
      if (start < 0) {
        start = length + start;
        limit = start + deleteCount;
      } else {
        limit = deleteCount + start;
      }
      limit = limit > length ? length : limit;
      for (let index = start; index < limit; index++) {
        deleted.push(document.adoptNode(fragment.childNodes[index]));
      }
      if (nodes.length) {
        const tmp = document.createDocumentFragment();
        tmp.append(...nodes);
        fragment.insertBefore(tmp, fragment.childNodes[start]);
      }
      return deleted;
    },
    concat(...items) {
      return [...fragment.children, ...items];
    },
    forEach(callBackFunc) {
      const length = fragment.children.length;
      for (let index = 0; index < length; index++) {
        callBackFunc(fragment.children[index], index);
      }
    },
    push(...nodes) {
      fragment.append(...nodes);
    },
    unshift(...nodes) {
      fragment.prepend(...nodes);
    },
    pop() {
      return document.adoptNode(fragment.childNodes.item(fragment.childNodes.length -1));
    },
    shift() {
      return document.adoptNode(fragment.childNodes.item(0));
    },
    sort(compareFunc) {
      return [...fragment.children].sort(compareFunc);
    },
    filter(predicate) {
      return [...fragment.children].filter(predicate);
    },
    some(predicate) {
      return [...fragment.children].some(predicate);
    },
    every(predicate) {
      return [...fragment.children].every(predicate);
    },
    find(predicate) {
      return [...fragment.children].find(predicate);
    },
    findIndex(predicate) {
      return [...fragment.children].findIndex(predicate);
    },
  };
}
export function getRoot() {
  return root;
}
export function compileCustomAttributes(parsedAttributesObject = {}, attrKey = '') {
  const compiledAttributesObject = {};
  if (attrKey && parsedAttributesObject?.[attrKey]) {
    addProperty(compiledAttributesObject, attrKey.slice(1), parsedAttributesObject[attrKey]);
    delete parsedAttributesObject[attrKey];
    return compiledAttributesObject;
  }
  for (const [key, values] of Object.entries(parsedAttributesObject)) {
    if (key[0] === '.') {
      if (typeof values[0] === 'string') {
        addProperty(compiledAttributesObject, key.slice(1), values.join(''));
      } else {
        addProperty(compiledAttributesObject, key.slice(1), values[0]);
      }
      delete parsedAttributesObject[key];
    }
  }
  return compiledAttributesObject;
}
export function compileCustomChildren(parsedChildrenObject = []) {
  const slots = [];
  for (const child of parsedChildrenObject) {
    const customAttributes = compileCustomAttributes(child.attributes, ':slotsname');
    if (customAttributes.slotsname) {
      slots[customAttributes.slotsname[0]] = child;
    } else {
      slots.push(child);
    }
  }
  return slots;
}
function registerId(id, component) {
  if (id) {
    if (componentIdMap.has(id) === false) {
      componentIdMap.set(id, component);
    } else {
      throw new TypeError('the id compenent must unique');
    }
  }
}
function clearId() {
  componentIdMap.clear();
}
function changeId(newId, oldId) {
  const component = componentIdMap.get(oldId);
  if (component) {
    componentIdMap.delete(oldId);
    componentIdMap.set(newId, component);
  } else {
    throw new TypeError('the component not exist');
  }
}

// testOptimizations();

export function html(strings = [''], ...args) {
  return builder(
      transform(
          strings,
          args,
      ));
}
html.asyncBuilder = (value) => {
  // isAsyncReplace = value;
};

function builder(object) {
  let element = DEFAULT_ASSIGN;
  let parent = DEFAULT_ASSIGN;

  // console.log(object);

  if (typeof object.tag === 'string') {
    if (object.tag === 'fragment') {
      element = parent = document.createDocumentFragment();
      isAsyncReplace = false;
    } else if (object.tag === 'template') {
      element = document.createElement(object.tag);
      parent = element.content;
      isAsyncReplace = false;
    } else {
      element = parent = document.createElement(object.tag);
    }
  } else if (typeof object.tag === 'function') {
    if (object.tag.isClass) {
      element = createComponent(object);
    } else {
      element = object.tag(
          object.attributes,
          object.children,
      );

      // object.attributes = {};
      object.children.length = 0;
    }
  } else if (typeof object.tag === 'object') {
    if (object.tag instanceof Node) {
      element = object.tag;
    } else {
      element = object.tag.render(object.attributes, object.children);
    }
  } else {
    throw new TypeError('unimplement type object');
  }
  if (isAsyncReplace) {
    Promise
        .resolve(undefined)
        .then(() => {
          setAttributes();
        })
        .then(() => {
          setChildren();
        });
  } else {
    setAttributes();
    setChildren();
    isAsyncReplace = autoBackAsync;
  }
  return element;
  function setAttributes() {
    for (const [key, values] of Object.entries(object.attributes)) {
      if (key[0] === 'o' && key[1] === 'n') {
        const inject = [key.slice(2), ...values];
        if (Array.isArray(values)) {
          inject.push(...values);
        } else {
          inject.push(values);
        }
        element.addEventListener.apply(...[element, inject]);
      } else {
        let accumulation = '';
        if (Array.isArray(values)) {
          for (const value of values) {
            if (typeof value === 'string' || typeof value === 'number') {
              accumulation += value;
            } else if (typeof value === 'function') {
              accumulation += value();
            } else if (typeof value === 'object') {
              accumulation = value;
              // console.log(key, value);
            } else {
              console.error('not implemented type attribute');
            }
          }
          values.length = 0;
        } else {
          if (typeof values === 'object') {
            // console.log(object);
            if (values instanceof Node) {
              console.log(key, '|', values);
              // element.setAttributeNode(values);
              console.error('not implement type attribute');
            } else {
              // element.setAttributeNode(values.node);
              // console.log(key, '|', values);
              // console.log(object);
              values.attach(element);
            }
            continue;
          } else {
            accumulation = values;
          }
        }
        element.setAttribute(key, accumulation);
      }
    }
    return undefined;
  }
  function setChildren() {
    for (const node of object.children) {
      if (node.tag) {
        append(builder(node));
      } else if (node.hasOwnProperty('_value')) {
        if (typeof node._value === 'string') {
          append(document.createTextNode(node._value));
        } else if (typeof node._value === 'number') {
          append(document.createTextNode(node._value +''));
        } else if (typeof node._value === 'function') {
          append(node._value());
        } else if (typeof node._value === 'object') {
          node._value.attach(parent);
        } else {
          console.error('unimplement child');
        }
        // console.log(node);
      } else {
        if (node instanceof Node) {
          append(node);
        } else {
          node.attach(parent);
        }
        // console.log(node);
      }
    }
    // element = parent = object = undefined;
    return undefined;
    function append(element) {
      requestAnimationFrame(() => parent.append(element));
    }
  }
}

function createComponent(object) {
  // console.log(object);
  // eslint-disable-next-line new-cap
  const component = new object.tag({
    attributes: object.attributes,
    slots: object.children,
  });
  component.init();
  registerId(component.id, component);
  return component.build();
}

function createElement(object) {
  let element = DEFAULT_ASSIGN;
  let isAsyncReplace = isAsyncReplace;
  if (typeof object.tag === 'string') {
    if (object.tag === 'fragment') {
      element = document.createDocumentFragment();
      isAsyncReplace = false;
    } else {
      element = document.createElement(object.tag);
    }
  } else if (typeof object.tag === 'function') {
    element = object.tag(object.attributes, object.children);

    object.attributes = {};
    object.children.length = 0;
  } else if (typeof object.tag === 'object') {
    if (object.tag instanceof Node) {
      element = object.tag;
    } else {
      element = object.tag.render(object.attributes, object.children);
    }
  } else {
    throw new TypeError('unimplement type object');
  }
  if (isAsyncReplace) {
    Promise
        .resolve(undefined)
        .then(() => setAttributes(element, object.attributes))
        .then(() => setChildren(element, object.children));
  } else {
    setAttributes(element, object.attributes);
    setChildren(element, object.children);
  }
  return element;
}

function setAttributes(element, attributes) {
  for (const [key, values] of Object.entries(attributes)) {
    if (key[0] === 'o' && key[1] === 'n') {
      const inject = [key.slice(2), ...values];
      if (Array.isArray(values)) {
        inject.push(...values);
      } else {
        inject.push(values);
      }
      element.addEventListener.apply(...[element, inject]);
    } else {
      let accumulation = '';
      if (Array.isArray(values)) {
        for (const value of values) {
          if (typeof value === 'string') {
            accumulation += value;
          } else if (typeof value === 'function') {
            accumulation += value();
          } else {
            console.log(attributes);
            console.error('not implemented type');
          }
        }
      } else {
        accumulation = values;
      }
      element.setAttribute(key, accumulation);
    }
  }
}

function setChildren(element, children) {
  for (const node of children) {
    if (node.tag) {
      element.append(builder(node));
    } else if (node._value) {
      if (typeof node._value === 'string') {
        element.append(document.createTextNode(node._value));
      } else if (typeof node._value === 'number') {
        element.append(document.createTextNode(node._value +''));
      } else if (typeof node._value === 'function') {
        element.append(node._value());
      } else {
        console.error('unimplement child');
      }
    } else {
      element.append(node);
    }
  }
}
function transform(literalStrings = [], interpolateQueue = []) {
  return transformCore({
    string: literalStrings.join(INTERPOLATE),
    interpolateQueue,
  });
}

function transformCore(template = {string, interpolateQueue}) {
  const string = template.string;
  const length = string.length;
  const child = [];

  let buffer = '';
  let element = '';
  let countContainer = 0;
  let node = ELEMENT;
  let root = {};

  for (let index = 0; index < length; index++) {
    const char = string[index];

    if (char === '\n' && countContainer === 0) {
      continue;
    }
    if (char === ' ' && string[index +1] === ' ') {
      index += 1;

      continue;
    }
    if (char === '<') {
      if (node === ELEMENT) {
        ++countContainer;
      } else if (string[index +1] !== '/') {
        if (root.hasOwnProperty('tag') === false) {
          if (buffer && buffer !== ' ') {
            child.push(buffer);
          }
          root = transformChild(element, child, template);
        }
        node = CHILD;
        template.string = string.slice(index);
        root.children.push(transformCore(template));
        index += template.lastRead;
        buffer = '';
      }
      continue;
    }
    if (char === '/' && (string[index -1] === '<' || string[index +1] === '>')) {
      --countContainer;
      node = ELEMENT;
      if (element.length === 0) {
        element = buffer += ' ';
      } else {
        if (buffer && (buffer !== ' ')) {
          child.unshift(buffer);
        }
      }
      if (root.hasOwnProperty('tag') === false) {
        root = transformChild(element, child, template);
      }
      buffer = '';

      continue;
    }
    if (char === '>') {
      if (element.length === 0) {
        element = buffer += ' ';
      }
      if (countContainer !== 0) {
        node = CHILD;
      } else {
        template.lastRead = index;

        break;
      }
      buffer = '';

      continue;
    }
    buffer += char;
  }
  return root;
}
function transformChild(element, child, template) {
  const attributes = {};
  const children = [];
  const value = [];
  const elementLength = element.length +1;

  let tag = '';
  let key = '';
  let buffer = '';
  let quote = false;
  let pos = 0;

  for (let index = pos; index < elementLength; index++) {
    const char = element[index];
    if (char === ' ') {
      pos = ++index;

      break;
    }
    if (char === '$') {
      tag = template.interpolateQueue.shift();
      index += 3;
      pos = index;
      break;
    }
    tag += char;
  }
  for (let index = pos; index < elementLength; index++) {
    const char = element[index];
    if ((char === ' ' || char === '\n') && quote === false) {
      if (buffer) {
        value.push(buffer);
        // console.log(key, '|', ...value);
        if (key) {
          addProperty(attributes, key, [...value]);
        } else if (typeof value[0] === 'object') {
          const attrs = value.pop();
          // console.log(attrs);
          if (attrs.Class) {
            addProperty(attributes, 'class', attrs);
          } else {
            addProperties(attributes, attrs);
          }
          // console.log(attributes);
        } else if (typeof value[0] === 'function') {
          throw new TypeError('not implemented type');
        } else {
          addProperty(attributes, value.pop(), '');
        }
        key = '';
        value.length = 0;
      }
      buffer = '';

      continue;
    }
    if (char === ' ' && quote === true) {
      value.push(buffer);
      value.push(' ');
      buffer = '';

      continue;
    }
    if (char === '=' && quote === false) {
      if (typeof buffer === 'string') {
        key = buffer.trim();
      } else if (typeof buffer === 'function') {
        key = buffer().trim();
      } else {
        throw new TypeError('key of attribute element must string');
      }
      buffer = '';

      continue;
    }
    if (char === '\"') {
      quote = quote ? false : true;

      continue;
    }
    if (char === '$') {
      buffer = template.interpolateQueue.shift() || ' ';
      index += 2;

      continue;
    }
    if (char === '.' && element[index +3] === '$') {
      buffer = template.interpolateQueue.shift();
      index += 5;

      continue;
    }
    buffer += char;
  }

  buffer = '';

  for (const childNode of child) {
    for (let index = 0; index < childNode.length; index++) {
      const char = childNode[index];

      if (char === '$') {
        if (buffer.length > 1) {
          children.push({_value: buffer});
        }
        children.push({_value: template.interpolateQueue.shift()});
        buffer = '';
        index += 2;

        continue;
      }
      if (char === '.' && childNode[index +3] === '$') {
        if (buffer.length > 1) {
          children.push({_value: buffer});
        } else {
          if (template.interpolateQueue[0] instanceof Array) {
            children.push(...template.interpolateQueue.shift());
          } else {
            children.push(template.interpolateQueue.shift());
          }
        }
        buffer = '';
        index += 5;

        continue;
      }
      buffer += char;
    }
  }
  if (buffer.length > 1) {
    children.push({_value: buffer});
  }
  // console.log('parsed object', attributes);
  return {tag, attributes, children};
}
function addProperty(object, key, value, descriptor = {
  configurable: true,
  enumerable: true,
  writable: true,
  value: null,
}) {
  descriptor.value = value;
  return Object.defineProperty(object, key, descriptor);
}
function addProperties(object, objectSource) {
  // const keys = Object.keys(objectSource);
  // const values = Object.values(objectSource);
  for (const [key, value] of Object.entries(objectSource)) {
    addProperty(object, key, value);
  }
  return object;
}

function testOptimizations() {
  const button = (attributes, children) => {
    return /**/html`
      <button ${attributes} type="menu">
        <span class="text">...${children}</span>
        <i class="icons">arrow_forward</i>
      </button>
    `;
  };
  const attributes = {'class': 'btn-red', 'id': 'btn'};
  const eventClick = (event) => console.log(event.target);
  const text = 'click me';

  console.time('test optimizations');

  const result = /**/html`
    <div title="testing">
      <${button} ${attributes} onclick="${eventClick}">
        ${text}
      </>
    </div>
  `;

  console.timeEnd('test optimizations');

  console.log(result);
}
