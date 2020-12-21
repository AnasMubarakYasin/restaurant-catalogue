/* eslint-disable max-len */
import {addProperty, duplicate, genRandomNumber, genRandomString, hash} from './helper';
import {isConstructable} from './type';

const KEY = 0;
const VALUE = 1;
const GLOBAL = 0;
const LOCAL = 1;
const PARENT = 0;
const CHILD = 1;
const SCOPE_RULE = 0;
const STYLE_RULE = 1;
const MEDIA_RULE = 4;
const KEYFRAMES_RULE = 7;
const KEYFRAME_RULE = 8;
const MIX_RULE = 16;
const PARSERABLE = [...'@$'];
const MEDIA_RULE_NAME = '@media';
const KEYFRAMES_RULE_NAME = '@keyframes';
const EXTENDS_RULE_NAME = '@extend';
const MIX_RULE_NAME = '@mixin';
const INCLUDE_RULE_NAME = '@include';
// const VARIABLE_RULE_NAME = '@variable';
const VARIABLE_RULE_NAME = '$';
const REQUIRE_RULE_NAME = '@require';
const INTERPOLATE = '${_}';
const QUERY_PARENT_CHARS = [...'&'];
const QUERY_TYPED_CHARS = [...'.#:*'];
const QUERY_COMBINATOR_CHARS = [...'~+|>, '];

const GLOBAL_CONTEXT = new class GlobalContext {
  id = '#global'
  key = 9060
  name = '#global-9060'
  CSSStyleSheet: CSSStyleSheet;
  map: Map<string, CSSRule> = new Map();

  constructor() {
    const ALLOW = isConstructable(CSSStyleSheet);
    if (ALLOW) {
      this.CSSStyleSheet = new CSSStyleSheet();
      window.addEventListener('load', (event) => {
        document.adoptedStyleSheets = [
          this.CSSStyleSheet,
          ...document.adoptedStyleSheets,
        ];
      });
    } else {
      const style = document.createElement('style');
      style.id = this.id;
      document.head.append(style);
      this.CSSStyleSheet = style.sheet as CSSStyleSheet;
    }
    // window.cssstylesheet = this;
  }
  insertModule(module: ModuleStore) {
    // module.forEach((style) => {
    //   console.log(style.template);
    // });
    for (const style of module) {
      const index = this.CSSStyleSheet.insertRule(style.template);
      if (style.indexer) {
        this.map.set(style.indexer, this.CSSStyleSheet.cssRules[index]);
      }
    }
  }
};

type ModuleSelector = {[selector: string]: string};

class LocalContext {
  id;
  key;
  name;
  root;
  type = SCOPE_RULE;
  stylesheetMap = new Map();

  constructor(context = GLOBAL_CONTEXT) {
    this.id = genRandomString(4);
    this.key = genRandomNumber(4);
    this.name = '#'+ this.id +'-'+ this.key;
    this.root = context;
  }
}

class Parser {
  string: string;
  lastRead: number;
  length: number;
  node = PARENT;
  map = new Map();
  preset;
  context: PresetObject | null;
  childContextList: PresetObject[];
  constructor(preset: Preset, stringTemplate: TemplateStringsArray, interpolate: Array<any>) {
    this.preset = preset;
    this.context = null;
    this.childContextList = [];
    this.string = '';
    this.lastRead = 0;

    const length = stringTemplate.length;
    const limit = length -1;

    for (let index = 0; index < length; index++) {
      this.string += stringTemplate[index].trim();
      if (index < limit) {
        this.map.set(index, interpolate[index]);
        this.string += '%('+ index +')';
      }
    }
    // console.log(this.string);
    this.length = this.string.length;

    let buffer = '';
    let mode = KEY;
    let assignMode = false;
    let shortProperty = false;
    let context: PresetObject = this.preset;

    for (let index = this.lastRead; index < this.length; index++) {
      const char = this.string[index];

      if (char === '{') {
        if (assignMode) {
          buffer += char;
          continue;
        } else if (mode === KEY) {
          context = this.parsingContext(buffer.trim(), this.preset);
          mode = VALUE;
        } else {
          this.lastRead = index - buffer.length;
          this.childParser(context);

          index = this.lastRead;
        }
        buffer = '';

        continue;
      }
      if (char === '}') {
        if (shortProperty) {
          this.parsingAttributeContext(buffer.trim(), context);
          assignMode = false;
          shortProperty = false;
        } else {
          context = this.preset;
          mode = KEY;
        }
        buffer = '';

        continue;
      }
      if (char === ';') {
        if (buffer.includes('{')) {
          shortProperty = true;
          buffer += char;
        } else {
          this.parsingAttributeContext(buffer.trim() + char, context);
          assignMode = false;
          buffer = '';
        }
        continue;
      }
      if (char === ':') {
        if (buffer.includes('@') === false && this.string[index +1] === ' ') {
          assignMode = true;
        } else {
          assignMode = false;
        }
      }
      buffer += char;
    }
    // console.warn('buffer recidu', buffer);
  }
  childParser(context: PresetObject) {
    let buffer = '';
    let mode = KEY;
    let assignSymbol = false;
    let isShortProperty = false;
    let childContext = context;

    for (let index = this.lastRead; index < this.length; index++) {
      const char = this.string[index];

      if (char === '{') {
        if (assignSymbol) {
          buffer += char;
          assignSymbol = false;

          continue;
        } else if (mode === KEY) {
          childContext = this.parsingContext(buffer.trim(), context);
          mode = VALUE;
        } else {
          this.lastRead = index - buffer.length;
          this.childParser(childContext);

          index = this.lastRead;
        }
        buffer = '';

        continue;
      }
      if (char === '}') {
        if (isShortProperty) {
          this.parsingAttributeContext(buffer.trim(), childContext);
          isShortProperty = false;
          assignSymbol = false;
          buffer = '';

          continue;
        } else {
          this.lastRead = index +1;

          break;
        }
      }
      if (char === ';') {
        if (buffer.includes('{')) {
          isShortProperty = true;
          buffer += char;
        } else {
          this.parsingAttributeContext(buffer.trim() + char, childContext);
          assignSymbol = false;
          buffer = '';
        }

        continue;
      }
      if (char === ':') {
        if (buffer.includes('@') === false && this.string[index +1] === ' ') {
          assignSymbol = true;
        } else {
          assignSymbol = false;
        }
      }
      buffer += char;
    }
  }
  parsingContext(rule: string, context: PresetObject) {
    if (rule.startsWith(MEDIA_RULE_NAME)) {
      return this.mediaRuleParser(rule, context);
    } else if (rule.startsWith(KEYFRAMES_RULE_NAME)) {
      return this.keyframesRuleParser(rule, context);
    } else if (rule.startsWith(MIX_RULE_NAME)) {
      return this.mixinRuleParser(rule, context);
    } else {
      return this.styleRuleParser(rule, context);
    }
  }
  parsingAttributeContext(rule: string, context: PresetObject) {
    if (rule.startsWith(EXTENDS_RULE_NAME)) {
      this.extendsRuleParser(rule, context);
    } else if (rule.startsWith(REQUIRE_RULE_NAME)) {
      this.requireRuleParser(rule, context);
    } else if (rule.startsWith(VARIABLE_RULE_NAME)) {
      this.variableRuleParser(rule, context);
    } else if (rule.startsWith(INCLUDE_RULE_NAME)) {
      this.includeRuleParser(rule, context);
    } else {
      this.propertyParser(rule, context);
    }
  }
  styleRuleParser(selector: string, context: PresetObject) {
    const style = new StyleObject(
        this.selectorQueryParser(this.selectorListParser(selector)),
        this.preset.root,
    );
    style.simpleSelector = selector;
    context.append(style);
    return style;
  }
  selectorListParser(selector: string) {
    const length = selector.length;
    const result: string[] = [];

    let buffer = '';
    let countContainer = 0;

    for (let index = 0; index < length; index++) {
      const char = selector[index];
      if (char === '(' || char === '[') {
        ++countContainer;
        buffer += char;

        continue;
      }
      if (char === ')' || char === ']') {
        --countContainer;
        buffer += char;

        continue;
      }
      if (char === ',' && countContainer === 0) {
        result.push(buffer.trim());
        buffer = '';
        continue;
      }
      buffer += char;
    }
    result.push(buffer.trim());

    return result;
  }
  selectorQueryParser(selectorList: string[]): string[][] {
    const result = [];

    for (const selector of selectorList) {
      const length = selector.length +1;
      const list: string[] = [];

      let buffer = '';
      let compiling = false;
      let type = 'symbol';
      let options = '';
      let column = 0;
      let quote = false;

      for (let index = 0; index < length; index++) {
        let char = selector[index] || ' ';
        if (QUERY_COMBINATOR_CHARS.includes(char) || QUERY_PARENT_CHARS.includes(char)) {
          type = 'single';
          compiling = true;
        }
        if (QUERY_TYPED_CHARS.includes(char) && buffer.length > 2) {
          type = 'double';
          compiling = true;
        }
        if (char === '(') {
          ++column;
        }
        if (char === ')') {
          --column;
          compiling = false;
          options = 'column';
        }
        if (char === '[') {
          ++column;
        }
        if (char === ']') {
          --column;
          compiling = false;
        }
        if (char === '\"') {
          quote = quote ? false : true;
          options = '';
        }
        if (compiling && column === 0 && quote === false) {
          if (buffer) {
            if (options === 'column') {
              list.push(this.selectorFunctionParser({string: buffer, lastRead: 0}));
            } else {
              list.push(buffer);
            }
            options = '';
          }
          if (type === 'single' && index +1 < length) {
            list.push(char);
            char = '';
          }
          type = '';
          compiling = false;
          buffer = '';
        }
        buffer += char;
      }
      result.push(list);
    }
    return result;
  }
  selectorFunctionParser(template = {string: '', lastRead: 0}) {
    const params = [];
    const length = template.string.length;
    const string = template.string;

    let buffer = '';
    let name = '';
    let mode = 0;

    for (let index = template.lastRead; index < length; index++) {
      const char = string[index];

      if (char === '(') {
        if (mode === 0) {
          name = buffer;
          mode = 1;
          buffer = '';
        } else {
          template.lastRead = index - buffer.length;
          buffer = this.selectorFunctionParser(template);
          index = template.lastRead;
        }
        continue;
      }
      if (char === ')') {
        params.push(buffer);
        buffer = '';
        template.lastRead = index;

        break;
      }
      if (char === ',' && mode === 1) {
        params.push(buffer);
        buffer = '';

        continue;
      }
      buffer += char;
    }
    return {name, params};
  }
  propertiesParser(string: string, context: PresetObject) {
    const result = [];
    const length = string.length;

    let key = '';
    let buffer = '';

    for (let index = 0; index < length; index++) {
      const char = string[index];

      if (char === ';') {
        buffer = buffer.trim();
        if (PARSERABLE.includes(buffer[0])) {
          this.parsingAttributeContext(buffer, '', context);
        } else if (PARSERABLE.includes(key[0])) {
          this.parsingAttributeContext(key, buffer, context);
        } else {
          result.push([key, buffer]);
        }
        buffer = '';

        continue;
      }
      if (char === ':') {
        key = buffer.trim();
        buffer = '';

        continue;
      }
      buffer += char;
    }
    return result;
  }
  propertyParser(string: string, context: PresetObject) {
    const length = string.length;

    let key = '';
    let buffer = '';

    for (let index = 0; index < length; index++) {
      const char = string[index];

      if (char === ';') {
        context.setAttribute([key, this.propertyValueParser(buffer.trim())]);
        return;
      }
      if (char === ':') {
        key = buffer.trim();
        buffer = '';

        continue;
      }
      if (char === '{') {
        const attributesChild = string.slice(index +1, string.lastIndexOf('}')).split(';');
        // console.log(attributesChild);
        for (const child of attributesChild) {
          const desc = this.propertyChildParser(child +';');
          context.setAttribute([key +'-'+ desc.key, this.propertyValueParser(desc.value)]);
        }
        return;
      }
      buffer += char;
    }
  }
  propertyChildParser(string: string) {
    const length = string.length;

    let key = '';
    let value = '';
    let buffer = '';

    for (let index = 0; index < length; index++) {
      const char = string[index];

      if (char === ';') {
        value += buffer.trim();

        break;
      }
      if (char === ':') {
        key = buffer.trim();
        buffer = '';

        continue;
      }
      buffer += char;
    }
    return {
      key,
      value,
    };
  }
  propertyValueParser(string: string) {
    const result = [];

    let buffer = '';

    for (let sentence of this.propertyValuesParser(string)) {
      const words = [];
      sentence += ' ';
      // console.log(sentence);
      word:
      for (let index = 0; index < sentence.length; index++) {
        const char = sentence[index];
        if (char === ' ') {
          words.push(buffer);
          buffer = '';

          continue word;
        }
        if (char === ',') {
          words.push(buffer);
          words.push(char);
          buffer = '';

          continue word;
        }
        if (char === '(') {
          if (sentence[index -1] === ' ' || sentence[index -1] === undefined) {
            if (buffer) {
              words.push(buffer);
              buffer = '';
            }
            words.push('calc(');
          } else {
            words.push(buffer + char);

            buffer = '';
          }
          continue word;
        }
        if (char === ')') {
          words.push(buffer);

          buffer = char;

          continue word;
        }

        buffer += char;
      }
      result.push(words);
    }
    // console.log(result);
    return result;
  }
  propertyValuesParser(string: string) {
    const length = string.length;
    const result: string[] = [];

    let buffer = '';
    let countContainer = 0;

    for (let index = 0; index < length; index++) {
      const char = string[index];
      if (char === '(' || char === '[') {
        ++countContainer;
      }
      if (char === ')' || char === ']') {
        --countContainer;
      }
      if (char === ',' && countContainer === 0) {
        result.push(buffer.trim());
        buffer = '';

        continue;
      }
      buffer += char;
    }
    result.push(buffer.trim());

    return result;
  }
  mediaRuleParser(key: string, context: PresetObject) {
    const media = new MediaObject(key.slice(MEDIA_RULE_NAME.length +1), this.preset.root);
    context.append(media);
    return media;
  }
  keyframesRuleParser(key: string, context: PresetObject) {
    const keyframes = new KeyframesObject(key.slice(KEYFRAMES_RULE_NAME.length +1), this.preset.root);
    context.append(keyframes);
    return keyframes;
  }
  keyframeRuleParser(key: string, properties: [string, string[][]][]) {
    return new KeyframeObject(key, properties, this.preset.root);
  }
  extendsRuleParser(key: string, context: PresetObject) {
    context.extendList.push(...this.selectorListParser(key.slice(EXTENDS_RULE_NAME.length +1, -1)));
  }
  variableRuleParser(key: string, context: PresetObject) {
    const length = key.length;

    let varKey = '';
    let varValue = '';
    let buffer = '';

    for (let index = 0; index < length; index++) {
      const char = key[index];

      if (char === ':') {
        varKey += buffer.trim();
        buffer = '';

        continue;
      }
      if (char === ';') {
        varValue += buffer.trim();

        break;
      }
      buffer += char;
    }
    varKey = varKey.slice(1);
    context.setVariable(varKey, varValue);
    context.setAttribute(['--'+ varKey, [[varValue]]]);
  }
  requireRuleParser(key: string, value: string) {
  }
  mixinRuleParser(rule: string, context: PresetObject) {
    const identifier = this.paramParser(rule.slice(MIX_RULE_NAME.length +1));
    const mixinObject = new MixinObject(identifier.name, this.preset.root);

    if (identifier.params.length) {
      for (const param of identifier.params) {
        mixinObject.argMap.set(param[KEY], param[VALUE].trim());
      }
    }
    context.append(mixinObject);

    return mixinObject;
  }
  includeRuleParser(rule: string, context: PresetObject) {
    const identifier = this.paramParser(rule.slice(INCLUDE_RULE_NAME.length +1));
    context.includeList.push(identifier);
  }
  paramParser(string: string) {
    const params: [string, string][] = [];
    const semi = string.lastIndexOf(';');
    if (semi > -1) {
      string = string.slice(0, semi);
    }
    const hasColumn = string.includes('(') ? string.indexOf('(') : string.length;
    const name = string.slice(0, hasColumn);
    if (hasColumn !== string.length) {
      const rawParam = string.slice(string.indexOf('(') +1, string.lastIndexOf(')'));
      const paramList = this.propertyValuesParser(rawParam);
      for (const param of paramList) {
        let [name, value] = param.split(':');
        name = name[0] === '$' ? name.slice(1) : name;
        params.push([name, value || '']);
      }
    }
    return {name, params};
  }
}

type ModuleStore = {template: string, indexer: string}[];

class Compiler {
  key;
  tree;
  parser;
  string: string;
  module: ModuleStore;
  hash: {key: string, value: string}[];
  // scop: string
  constructor(parsedObject: Parser) {
    this.key = parsedObject.preset.root.key;
    this.tree = parsedObject.preset;
    this.parser = parsedObject;
    this.string = '';
    this.module = [];
    this.hash = [];

    this.tree.string += (this.key ? ':root' : ':host') + ' {';
    this.tree.traversing(this.extendsRuleCompiler, 'style');
    this.tree.string += this.propertiesCompiler(this.tree.unknownAttributeList, this.tree);
    this.tree.string += '}\n';
    this.module.push({indexer: '', template: this.tree.string});

    for (const iterator of this.tree.iterator()) {
      this.compiler(iterator, this.module);
    }
    // this.module.forEach(({indexer, template}) => {
    //   console.log(template);
    // });
    // console.log(this);
  }
  compiler(style: PresetObject, store?: ModuleStore) {
    if (style.type === STYLE_RULE) {
      return this.styleRuleCompiler(style as StyleObject, store);
    } else if (style.type === MEDIA_RULE) {
      return this.mediaRuleCompiler(style as MediaObject, store);
    } else if (style.type === KEYFRAMES_RULE) {
      return this.keyframesRuleCompiler(style as KeyframesObject, store);
    } else {
      throw new TypeError('compiler');
    }
  }
  styleRuleCompiler(style: StyleObject, store?: ModuleStore) {
    const parent = style.getParentStyle();

    this.includeCompiler(style as StyleObject);


    for (const selector of this.selectorCompiler(style.parsedSelector)) {
      if (parent && parent.selectorPredence) {
        for (const parentPredence of parent.selectorPredence) {
          style.selectorPredence.push(parentPredence +' '+ selector);
        }
      } else {
        style.selectorPredence.push(selector);
      }
      if (selector[0] === '&') {
        let index = 0;

        for (const parentSelector of parent!.selectorPredence) {
          const composite = parentSelector + selector.slice(1);
          const last = parent.predenceCompiled[index].length - parentSelector.length;

          style.selectorCompiled.push(composite);
          style.predenceCompiled.push(parent.predenceCompiled[index].slice(0, last) + composite);

          ++index;
        }
      } else {
        if (parent && parent.predenceCompiled) {
          for (const parentPredence of parent.predenceCompiled) {
            style.predenceCompiled.push(parentPredence +' '+ selector);
          }
        } else {
          style.predenceCompiled.push(selector);
        }
        style.selectorCompiled.push(selector);
      }
    }
    style.propertiesCompiled += this.propertiesCompiler(style.parsedProperties, style);
    style.string += `${style.predenceCompiled.join(', ')} {${style.propertiesCompiled}}\n`;

    if (store) {
      let selectorCompiled = style.selectorCompiled.join('');
      if (this.key === 0 || [...'.#'].includes(selectorCompiled[0]) === false) {
        selectorCompiled = '';
      } else {
        selectorCompiled = selectorCompiled.replace(/\.|\#/g, '');
      }
      store.push({template: style.string, indexer: selectorCompiled});
    }

    for (const iterator of style.iterator()) {
      const string = this.compiler(iterator, store);
      style.string += string;
    }
    return style.string;
  }
  propertiesCompiler(properties: [string, string[][]][], parsedObject: PresetObject) {
    const limit = properties.length -1;

    let result = '';
    let index = 0;
    for (const attributeMap of properties) {
      // console.log(attributeMap);
      if (
        (attributeMap[KEY] === 'animation' ||
        attributeMap[KEY] === 'animation-name') &&
        this.key
      ) {
        // const value = attributeMap[VALUE].split(' ');
        const value = attributeMap[VALUE];
        if (value[0][0] === '.' || parseInt(value[0][0]) > -1) {
          value.push([hash(value.pop()!.join(''))]);
        } else {
          value.unshift([hash(value.shift()!.join(''))]);
        }
        // attributeMap[VALUE] = value;
      }
      const sentenceLimit = attributeMap[VALUE].length -1;
      let indexSentence = 0;
      let string = '';
      for (const sentence of attributeMap[VALUE]) {
        const wordLimit = sentence.length -1;
        let indexWord = 0;
        for (const word of sentence) {
          if (word[0] === '$') {
            string += this.variableRuleCompiler(word, parsedObject) + (indexWord === wordLimit ? '' : ' ');
          } else {
            string += word + (indexWord === wordLimit ? '' : ' ');
          }
          indexWord++;
        }
        string += indexSentence === sentenceLimit ? '' : ', ';
        indexSentence++;
      }
      result += (index ? '' : '\n\t') + attributeMap[KEY] +': '+ string + (index === limit ? ';\n' : ';\n\t');
      index++;
    }
    return result;
  }
  selectorCompiler(parsedSelector: string[][]) {
    const result = [];

    for (const array of parsedSelector) {
      const list = [];

      let index = 0;

      for (const selector of array) {
        if (typeof selector === 'string') {
          let compiled = selector;
          if (selector === ':local' || selector === ':global') {
            continue;
          }
          if (
            (selector[0] === '.' || selector[0] === '#') &&
            this.key &&
            (array![index -1] ?
              array![index -1] !== ':global' ?
                true : false : true)
          ) {
            list.push(compiled = hash(selector, this.key));
            this.hash.push({key: selector.slice(1), value: compiled.slice(1)});
          } else {
            list.push(selector);
          }
        } else {
          list.push(this.selectorFunctionCompiler(selector));
        }
        index++;
      }
      result.push(list.join(''));
    }
    return result;
  }
  selectorFunctionCompiler(parsedFunction: {name: string, params: string[]}) {
    const argument = [];

    let template = ``;

    for (const param of parsedFunction.params) {
      if (typeof param === 'string') {
        argument.push(param);
      } else {
        argument.push(this.selectorFunctionCompiler(param));
      }
    }
    if (parsedFunction.name === 'global' || parsedFunction.name === 'local') {
      if (parsedFunction.name === 'local') {
        for (let index = 0; index < argument.length; index++) {
          template += this.selectorCompiler(this.parser.selectorQueryParser([argument[index]]))
              .join('') + (index < argument.length ? ', ' : '');
        }
      } else {
        template += argument.join(', ');
      }
    } else {
      template += `${parsedFunction.name}(${argument.join(', ')})`;
    }
    return template;
  }
  mediaRuleCompiler(mediaParsed: MediaObject, store?: ModuleStore) {
    let stringStyle = '';
    if (mediaParsed.unknownAttributeList.length) {
      const style = new StyleObject([['&']], mediaParsed.root);
      style.parent = mediaParsed;
      mediaParsed.styleList.unshift(style);
      for (const unknownAttr of mediaParsed.unknownAttributeList) {
        style.setAttribute(unknownAttr);
      }
    }
    for (const style of mediaParsed.styleList) {
      stringStyle += this.styleRuleCompiler(style).replace(/\t/g, '\t\t').replace(/[}]\n/g, '\t}\n\t');
    }
    mediaParsed.string += `${MEDIA_RULE_NAME} ${mediaParsed.condition} {\n\t${stringStyle.replace(/\t$/, '')}}\n`;

    if (store) {
      store.push({template: mediaParsed.string, indexer: ''});
    }

    return mediaParsed.string;
  }
  keyframesRuleCompiler(keyframes: KeyframesObject, store?: ModuleStore) {
    keyframes.compiledName += this.key ? hash(keyframes.name, this.key) : keyframes.name;
    keyframes.string += `${KEYFRAMES_RULE_NAME} ${keyframes.compiledName} {${this.keyframeRuleCompiler(keyframes.keyframeList)}\n}\n`;

    if (store) {
      store.push({template: keyframes.string, indexer: keyframes.compiledName});
    }

    return keyframes.string;
  }
  keyframeRuleCompiler(keyframeList: KeyframeObject[]) {
    let template = '';
    for (const keyframe of keyframeList) {
      const string = this.propertiesCompiler(keyframe.properties, keyframe).split(';').map((str) => '\n\t\t'+ str.trim()).join(';').trimEnd();
      template += `\n\t${this.selectorCompiler(keyframe.key).join(', ')} {${string}\n\t}`;
    }
    return template;
  }
  extendsRuleCompiler(parsedObject: StyleObject) {
    for (const selector of parsedObject.extendList) {
      parsedObject.findStyle(selector, PARENT)!.parsedSelector.push(...parsedObject.parsedSelector);
    }
  }
  variableRuleCompiler(name: string, parsedObject: PresetObject): string {
    name = name.slice(1);
    const value = parsedObject.getVariable(name);
    let result = '';
    if (value) {
      result += '--'+ name;
    } else {
      result = this.tree.getVariable(name);
      if (result === undefined) {
        console.warn('missing variable', name);
        throw new RangeError('variable not exist');
      }
    }
    return `var(${result})`;
  }
  includeCompiler(parsedObject: StyleObject) {
    for (const include of parsedObject.includeList) {
      const mixin = parsedObject.getMixin(include.name);
      if (mixin) {
        const body = mixin.bind(include);
        for (const [varKey, varValue] of mixin.variableMap.entries()) {
          parsedObject.setVariable(varKey, varValue);
        }
        parsedObject.apply(body);
        mixin.variableMap.clear();
      }
    }
  }
  requireRuleCompiler() {
  }
}

type PresetObject = Preset | StyleObject | MediaObject | KeyframesObject | KeyframeObject;

class Preset {
  root: LocalContext;
  parent: PresetObject | null = null;
  styleList: StyleObject[] = [];
  mediaList: MediaObject[] = [];
  keyframesList: KeyframesObject[] = [];
  variableMap = new Map<string, string>();
  extendList: string[] = [];
  includeList: {name: string, params: [string, string][]}[] = []
  mixinMap: Map<string, MixinObject> = new Map();
  type: number = 0;
  string: string = '';
  unknownAttributeList: any[] = [];
  constructor(context: LocalContext) {
    this.root = context;
  }
  append(...styleFamily: PresetObject[]) {
    // console.warn('default method');
    for (const style of styleFamily) {
      if (style.type === STYLE_RULE) {
        this.styleList.push(style as StyleObject);
      } else if (style.type === MEDIA_RULE) {
        this.mediaList.push(style as MediaObject);
      } else if (style.type === KEYFRAMES_RULE) {
        this.keyframesList.push(style as KeyframesObject);
      } else if (style.type === MIX_RULE) {
        this.mixinMap.set((style as MixinObject).name, style as MixinObject);
      }
      style.parent = this;
    }
  }
  setAttribute(value: any) {
    this.unknownAttributeList.push(value);
    // console.warn('unimplement method', value);
  }
  iterator(type?: 'style' | 'media' | 'keyframes'): Generator<PresetObject, any, unknown> {
    const queue = [];
    if (type === 'style') {
      queue.push(...this.styleList);
    } else if (type === 'media') {
      queue.push(...this.mediaList);
    } else if (type === 'keyframes') {
      queue.push(...this.keyframesList);
    } else {
      queue.push(...this.styleList, ...this.mediaList, ...this.keyframesList);
    }
    return iterator(queue);
    function* iterator(queue: Array<PresetObject>) {
      for (const style of queue) {
        yield style;
        // yield* style.iterator(type);
      }
    };
  }
  traversing(callback: (object: PresetObject) => void, type?: 'style' | 'media' | 'keyframes') {
    for (const iterator of this.iterator(type)) {
      callback(iterator);
      iterator.traversing(callback, type);
    }
  }
  getVariable(name: string, context: PresetObject | null = null): string | undefined {
    let variable: string | undefined = '';
    context = context ? context : this;
    while (context) {
      variable = context.variableMap.get(name);
      if (variable) {
        return variable;
      } else {
        context = context.parent;
      }
    }
  }
  setVariable(name: string, value: string) {
    this.variableMap.set(name, value);
  }
  getMixin(name: string) {
    // console.log('get mixin', name);
    let context: PresetObject | null = this.parent;
    while (context) {
      const mix = context.mixinMap.get(name);
      if (mix) {
        return mix;
      }
      context = context.parent;
    }
    return undefined;
  }
}
class StyleObject extends Preset {
  parsedSelector;
  simpleSelector = '';
  parsedProperties: [string, string[][]][] = [];
  styleList: StyleObject[] = [];
  type = STYLE_RULE;
  selectorCompiled: string[] = [];
  predenceCompiled: string[] = [];
  selectorPredence: string[] = [];
  propertiesCompiled = '';
  constructor(selector: string[][], root: LocalContext) {
    super(root);

    this.parsedSelector = selector;
  }
  setAttribute(value: [string, string[][]]) {
    this.parsedProperties.push(value);
  }
  getParentStyle(): StyleObject | undefined {
    let parent = this.parent;
    let level = 1;
    while (parent) {
      if (parent.type === this.type && level < 3) {
        return parent as StyleObject;
      } else {
        parent = parent.parent;
      }
      level++;
    }
    return undefined;
  }
  findStyle(selector: string, bound: number): StyleObject | undefined {
    // console.log('searching :', selector, 'searcher :', this.simpleSelector);
    let result = undefined;
    if (bound === PARENT) {
      let context: PresetObject | null = this.parent;
      let self: PresetObject = this;
      while (context) {
        for (const style of context.styleList) {
          if (style !== self) {
            const result = style.findStyle(selector, CHILD);
            if (result) {
              return result;
            }
          }
          continue;
        }
        self = context;
        context = context.parent;
      }
    } else {
      if (this.simpleSelector === selector) {
        return this;
      }
      for (const style of this.styleList) {
        result = style.findStyle(selector, CHILD);
        if (result) {
          return result;
        }
      }
    }
    return result;
  }
  clone() {
    const style = new StyleObject(duplicate(this.parsedSelector), this.root);
    style.parsedProperties = duplicate(this.parsedProperties);
    style.variableMap = new Map(this.variableMap);
    style.mixinMap = new Map(this.mixinMap);
    for (const media of this.mediaList) {
      style.mediaList.push(media.clone());
    }
    for (const keyframes of this.keyframesList) {
      style.keyframesList.push(keyframes.clone());
    }
    for (const include of this.includeList) {
      style.includeList.push(duplicate(include));
    }
    return style;
  }
  apply(style: StyleObject) {
    this.mediaList.push(...style.mediaList);
    this.keyframesList.push(...style.keyframesList);
    this.includeList.push(...style.includeList);
    this.parsedProperties.unshift(...style.parsedProperties);
    for (const [varKey, varValue] of this.variableMap.entries()) {
      this.variableMap.set(varKey, varValue);
    }
    for (const [name, mixin] of this.mixinMap.entries()) {
      this.mixinMap.set(name, mixin);
    }
    // for (const property of properties) {
    //   this.parsedProperties.unshift(property);
    // }
    // console.log(this);
  }
}
class MediaObject extends Preset {
  condition = '';
  styleList: StyleObject[] = [];
  type = MEDIA_RULE;
  constructor(condition: string, root: LocalContext) {
    super(root);

    this.condition = condition;
  }
  clone() {
    const media = new MediaObject(this.condition, this.root);
    for (const style of this.styleList) {
      media.styleList.push(style.clone());
    }
    return media;
  }
}
class KeyframesObject extends Preset {
  name;
  keyframeList: KeyframeObject[] = [];
  compiledName = '';
  type = KEYFRAMES_RULE;
  constructor(name: string, root: LocalContext) {
    super(root);

    this.name = name;
  }
  append(...styleObject: PresetObject[]) {
    for (const style of styleObject as StyleObject[]) {
      const keyframe = new KeyframeObject(style.parsedSelector, style.parsedProperties, this.root);
      keyframe.variableMap = style.variableMap;
      this.keyframeList.push(keyframe);
      keyframe.parent = this;
    }
  }
  clone() {
    const keyframes = new KeyframesObject(this.name, this.root);
    for (const keyframe of this.keyframeList) {
      keyframes.keyframeList.push(keyframe.clone());
    }
    return keyframes;
  }
}
class KeyframeObject extends Preset {
  key;
  properties;
  type = KEYFRAME_RULE;
  constructor(key: string[][], properties: [string, string[][]][], root: LocalContext) {
    super(root);

    this.key = key;
    this.properties = properties;
  }
  clone() {
    return new KeyframeObject(this.key, duplicate(this.properties), this.root);
  }
}
class MixinObject extends Preset {
  name: string;
  argMap: Map<string, string>;
  type: number = MIX_RULE;
  parsedBody: [string, string[][]][] = [];
  clonedBody: [string, string[][]][] = [];
  constructor(name: string, root: LocalContext) {
    super(root);

    this.name = name;
    this.argMap = new Map();
  }
  bind(include: {name: string, params: [string, string][]}) {
    const list = [...this.argMap.keys()];
    const properties = duplicate(this.parsedBody);
    const style = new StyleObject([['']], this.root);

    for (const preset of this.iterator()) {
      if (preset.type === STYLE_RULE) {
        style.styleList.push((preset as StyleObject).clone());
      } else if (preset.type === MEDIA_RULE) {
        style.mediaList.push((preset as MediaObject).clone());
      } else if (preset.type === KEYFRAMES_RULE) {
        style.keyframesList.push((preset as KeyframesObject).clone());
      }
    }
    style.includeList.push(...duplicate(this.includeList));

    let index = 0;
    let params: Iterable<[string, string]> = include.params;

    this.variableMap = new Map(this.argMap);

    if (include.params.length && include.params[0]![KEY] === '') {
      params = this.variableMap.entries();
    }
    for (const param of params) {
      // console.log(param);
      if (param[VALUE]) {
        this.variableMap.set(param[KEY], param[VALUE]);
      } else {
        this.variableMap.set(list[index], param[KEY]);
      }
      index++;
    }
    for (const variable of this.variableMap.entries()) {
      properties.unshift(['--'+ variable[KEY], [[variable[VALUE].trim()]]]);
    }
    style.parsedProperties = properties;
    return style;
  }
  setAttribute(value: any) {
    this.parsedBody.push(value);
  }
}

export function css(lit: TemplateStringsArray, ...args: any[]) {
  const context = new LocalContext();
  const tree = new Preset(context);
  const parsedObject = new Parser(tree, lit, args);
  const compiledObject = new Compiler(parsedObject);
  const result: ModuleSelector = {};

  // console.log(compiledObject);

  GLOBAL_CONTEXT.insertModule(compiledObject.module);

  for (const hash of compiledObject.hash) {
    addProperty(result, camelCase(hash.key), hash.value);
  }
  return result;
}
export function style(lit: TemplateStringsArray, ...args: any[]) {
  const context = new LocalContext();
  context.key = 0;
  const preset = new Preset(context);
  const parsedObject = new Parser(preset, lit, args);
  const compiledObject = new Compiler(parsedObject);

  let string = '';

  for (const module of compiledObject.module) {
    string += module.template;
  }
  return string;
}

function camelCase(text: string) {
  return text.replace(/\-(.{1})/g, (match, group) => group.toUpperCase());
}

/* console.time('test css parsing');
const m = css`
@mixin active($color: black, $width: 1) {
  color: $color;
  opacity: $width;
}
.btn {
  @include active;
  $left: 40px;
  $level: 20px;
  color: linear-gradient(to right, #e3e3e3, #d4d4d4, #e3e3e3, #d4d4d4);
  margin: {
    left: $left;
    right: 10px;
  }
  box-shadow: (1px + $level) (1px + $level) (3px + $level)  rgba(0, 0, 0, 0.150),
              (-1px - $level) (1px + $level) (3px + $level)  rgba(0, 0, 0, 0.150);
  font-variant: normal;
  &::before {
    padding: 3px;
  }
  size: initial;
  @media only screen and (width: 500px) {
    font-size: 4px;
    place: {
      content: center;
      self: start;
    }
    font-style: italic;
    span {
      @include active(royalblue, .2);
      text-align: justify;
      font-weight: 400;
    }
  }
  transition: color 1s ease 0s, border 2s ease 1s;
  span {
    gap: 4px;
    animation: {
      name: anima;
      delay: 8s;
    }
    @media (height: 700px) {
      display: block;
      grid-template-columns: 40px;
    }
    display: grid;
  }
  text-align: justify;
}
input {
  $secondary: teal;
  $width: 5px;
  $stroke: solid;
  padding: {
    top: $width;
    bottom: $stroke;
  }
  &::after {
    border: {
      radius: 6px;
      top: thin solid black;
    }
    text-align: center;
  }
  background-color: $secondary;
  border: (1px + $width) $stroke tomato;
}
@media (hover) {
  button {
    $color: teal;
    perspective: 0rem;
    color: $color;
  }
  form {
    display: none;
  }
}
@keyframes anima {
  to {
    $left: 4px;
    top: $left;
    transform: matrix();
  }
  from {
    transform: matrix3d();
    top: 4px;
  }
}
`;
console.timeEnd('test css parsing');
console.log(m); */
