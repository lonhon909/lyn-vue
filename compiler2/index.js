import { mountComponent } from './mountComponent';
/**
 * Vue2
 * @param { Vue } vm 
 */
export function mount(vm) {
    // 没有提供 render 选项，则编译生成 render 函数
    if (!vm.$options.render) {
        
        let template = '';
        if (vm.$options.template) {
            // 优先模板
            template = vm.$options.template;

        } else if (vm.$options.el) {
            // el 选项
            vm.$el = document.querySelector(vm.$options.el);
            template = vm.$el.outerHTML;
        }

        const render = compileToFunction(template);

        vm.$options.render = render;
    }
    mountComponent(vm);
}

/**
 * 解析模版字符串，得到 AST 语法树
 * 将 AST 语法树生成渲染函数
 * @param { String } template 模板字符串
 * @return { Function } 渲染函数
 */
function compileToFunction(template) {
    // 解析模版，生成 ast
    const ast = parse(template);

    const render = generate(ast);

    return render;
}

/**
 * 将模板解析成 AST
 * @param {*} template 
 */
function parse(template) {
    // 存放所有的未配对的开始标签的 AST 对象
    const stack = [];
    // 最终的 AST 语法树
    let root = null;

    let html = template;

    while(html.trim()) {
        // 注释标签 直接忽视
        if (html.indexOf('<!--') === 0) {
            html = html.slice(html.indexOf('-->') + 3);
            continue;
        }

        // 匹配开始标签
        const startIdx = html.indexOf('<');
        if (startIdx === 0) {
            if (html.indexOf('</') === 0) {
                // 闭合标签
                parseEnd();
            } else {
                // 开始标签
                parseStartTag();
            }
        } else if (startIdx > 0) {
            // 说明开始标签之前还有其他文本

            /*
                如果栈为空，说明该段文本不属于任何标签，即无需处理
            */
            if (stack.length) {
                // 文本属于栈顶元素
                processChars(html.slice(0, startIdx));
            }
            html = html.slice(startIdx);
        } else {
            // 说明没有匹配到开始标签，整个 html 就是一段文本
        }
    }

    /**
     * 处理开始标签
     * '<div class="name">xxx</div>'
     */
    function parseStartTag() {
        // 开始标签的结束位置
        const end = html.indexOf('>');
        /*
            div class="name"
            用于解析标签名称与属性
        */
        const content = html.slice(1, end);

        // 截断html，剩余部分为未处理的模板字符串
        html = html.slice(end + 1);
        // 第一个空格位置
        const firstSpaceIdx = content.indexOf(' ');

        let tagName, // 标签名
            attrName; // 属性名
        
        if (firstSpaceIdx === -1) {
            // <p>xxx</p> 这种格式下就没有空格,content就是标签名
            tagName = content;
        } else {
            tagName = content.slice(0, firstSpaceIdx);
            // 剩余的就是属性名
            attrName = content.slice(firstSpaceIdx + 1);
        }

        // 属性名数组 [class="name", id="xxx"]
        const attrs = attrName ? attrName.split(' ') : [];
        // 解析属性数组
        const attrMap = parseAttrs(attrs);
        // 生成 ast
        const elementAst = generateAST(tagName, attrMap);
        // 如果根节点不存在，说明当前节点为整个模版的第一个节点
        if (!root) {
            root = elementAst;
        }
        // 将开始标签放入 栈顶，等遇到结束标签就 出队，就形成一个完整标签
        stack.push(elementAst);

        // 自闭和标签
        if (isUnaryTag(tagName)) {
            processElement();
        }
    }
    /**
     * 闭合标签
     */
    function parseEnd() {
        html = html.slice(html.indexOf('>') + 1);
        // 栈顶元素出队，表示与该闭合标签配套的标签已经处理
        processElement();
    }

    /**
     * 处理完闭合标签后调用
     */
    function processElement() {
        // 弹出栈顶元素，进一步处理该元素
        const curEle = stack.pop();
        const stackLen = stack.length;

        const { tag, rawAttr } = curEle;

        // 处理结果都放到 attr 对象上
        curEle.attr = {};

        for (let key in rawAttr) {
            if (key === 'v-model') {
                // 处理 v-model
                processVModel(curEle);
            } else if (/^v-bind:(.*)$/.test(key)) {
                // 处理 v-bind
                processVBind(curEle.attr, RegExp.$1, rawAttr[key]);
            } else if (/^v-on:(.*)$/.test(key)) {
                // 处理 v-on
                processVOn(curEle.attr, RegExp.$1, rawAttr[key]);
            }
        }

        // 栈顶的元素是下层元素的子元素
        if (stackLen > 0) {
            stack[stack.length - 1].children.push(curEle);
            curEle.parent = stack[stack.length - 1];
        }

    }

    /**
     * 处理 文本
     */
    function processChars(text) {
        if (!text.trim()) return;

        const textAST = {
            type: 3,
            text,
        };

        if (text.match(/{{(.*)}}/)) {
            // 说明是表达式
            textAST.expression = RegExp.$1.trim();
        }
        // 将 ast 放到栈顶元素的肚子里
        stack[stack.length - 1].children.push(textAST);
    }

    return root;
}

/**
 * 解析属性数组
 * @param { Array[] } attrs
 * @return { Object } 属性名：属性值
 */
function parseAttrs(attrs) {
    const attrMap = {};

    for (let i = 0; i < attrs.length; i++) {
        const [attrName, attrValue] = attrs[i].split('=');

        attrMap[attrName] = attrValue ? attrValue.replace(/['"]/g, '') : undefined;
    }

    return attrMap;
}

/**
 * 生成 AST
 * @param { String } tagName 
 * @param { Object } attrMap 
 */
function generateAST(tagName, attrMap) {
    return {
        // 元素节点
        type: 1,
        // 标签
        tag: tagName,
        rawAttr: attrMap,
        // 子元素
        children: [],
    }
}

/**
 * 处理 v-model
 * @param {} curEle
 */
function processVModel(curEle) {
    const { tag, attr, rawAttr } = curEle;
    const { type, 'v-model': vModelValue } = rawAttr;

    if (tag === 'input') {
        if (type.trim() === 'text') {
            // <input type="text" v-model="value" />
            attr.vModel = { tag, type: 'text', value: vModelValue };
        } else if (type.trim() === 'checkbox') {
            // <input type="checkbox" v-model="checked" />
            attr.vModel = { tag, type: 'checkbox', value: vModelValue };
        }
    } else if (tag === 'textarea') {
        // <textarea v-model="value" />
        attr.vModel = { tag, value: vModelVal };
    } else if (tag === 'select') {
        // <select v-model="value">...</select>
        attr.vModel = { tag, value: vModelVal };
    }
}

/**
 * 处理 v-bind
 * @param {*} attr
 * @param {*} key
 * @param {*} value 
 */
function processVBind(attr, key, value) {
    let vBind = attr.vBind;
    if (!vBind) {
        vBind = attr.vBind = {};
    }
    vBind[key] = value;
}

/**
 * 处理 v-on
 * @param {*} attr 
 * @param {*} key 
 * @param {*} value 
 */
function processVOn(attr, key, value) {
    let vOn = attr.vOn;
    if (!vOn) {
        vOn = attr.vOn = {};
    }
    vOn[key] = value;
}

/**
 * 判断是否自闭和标签
 * @param {*} tagName 
 */
function isUnaryTag(tagName) {
    const unaryTag = ['input'];
    return unaryTag.includes(tagName);
}

/**
 * ast 生成 渲染函数
 * @param {*} ast
 * @return { Function } 可执行的渲染函数
 */
function generate(ast) {
    const renderStr = genElement(ast);

    return new Function(`with(this) { return ${renderStr} }`)
}

/**
 * 
 * @param {*} ast 
 */
function genElement(ast) {
    const { tag, rawAttr, attr } = ast;

    const attrs = { ...rawAttr, ...attr };

    // 处理子节点，得到一个所有子节点渲染函数组成的数组
    const children = genChildren(ast.children);

    return `_c('${tag}', ${JSON.stringify(attrs)}, [${children}])`;
}

/**
 * 处理子节点
 * @param {*} children 
 */
function genChildren(children) {
    const ret = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.type === 3) {
            // 处理文本节点
            ret.push(`_v(${JSON.stringify(child)})`);
        } else if (child.type === 1) {
            // 元素节点
            ret.push(genElement(child));
        }
    }

    return ret;
}