var Vue;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./compiler2/index.js":
/*!****************************!*\
  !*** ./compiler2/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mount": () => (/* binding */ mount)
/* harmony export */ });
/* harmony import */ var _mountComponent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mountComponent */ "./compiler2/mountComponent.js");

/**
 * Vue2
 * @param { Vue } vm 
 */
function mount(vm) {
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
    (0,_mountComponent__WEBPACK_IMPORTED_MODULE_0__.mountComponent)(vm);
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

/***/ }),

/***/ "./compiler2/mountComponent.js":
/*!*************************************!*\
  !*** ./compiler2/mountComponent.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mountComponent": () => (/* binding */ mountComponent),
/* harmony export */   "mixinRender": () => (/* binding */ mixinRender)
/* harmony export */ });
/* harmony import */ var _watcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../watcher */ "./watcher.js");


/**
 * 挂载
 * @param { Vue } vm 
 */
function mountComponent(vm) {

    const updateComponent = () => {
        vm._update(vm._render());
    }

    new _watcher__WEBPACK_IMPORTED_MODULE_0__["default"](updateComponent);
}


function mixinRender(Vue) {
    Vue.prototype._render = function() {
        return this.$options.render.call(this);
    }

    Vue.prototype._update = function(vnode) {
        // 获取旧的 VNode
        const prevVNode = this._vnode;
        // 更新实例上的 VNode
        this._vnode = vnode;

        if (!prevVNode) {
            // 旧的 VNode 不存在，说明首次渲染
            this.$el = this.__patch__(this.$el, vnode);
        } else {
            // 后续更新走这里
            this.$el = this.__patch__(prevVNode, vnode);
        }
    }
}

/***/ }),

/***/ "./compiler2/patch.js":
/*!****************************!*\
  !*** ./compiler2/patch.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ patch)
/* harmony export */ });
/* harmony import */ var _vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../vue */ "./vue.js");
/* harmony import */ var _src_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../src/utils */ "./src/utils/index.js");


/**
 * 
 * @param { Element|VNode } oldVnode 旧的 VNode 或者真实元素
 * @param { VNode } vnode 
 */
function patch(oldVnode, vnode) {
    if (oldVnode && !vnode) {
        // 1、旧的节点存在，而新的节点不存在，则销毁组件
        return;
    }
    if (!oldVnode) {
        // 2、旧的节点不存在，说明子组件首次渲染
        createElm(vnode);
    } else {
        if (oldVnode.nodeType) { // 表示真实元素，表示首次渲染根组件
            // 获取父节点，即 body
            const parent = oldVnode.parentNode;

            const referNode = oldVnode.nextSibling;

            createElm(vnode, parent, referNode);

            parent.removeChild(oldVnode);
        } else {
            // ...
        }
    }
    return vnode.elm;
}

/**
 * 创建元素
 * @param { VNode } vnode VNode 虚拟节点
 * @param { Element } parent 虚拟节点的父节点 真实元素
 * @param { Element|null } referNode 
 */
function createElm(vnode, parent, referNode) {

    vnode.parent = parent;
    // 判断是否为组件
    if (createComponent(vnode)) return;

    const { attr, children, text } = vnode;

    if (text) {
        // 1、文本节点
        vnode.elm = createTextNode(vnode);
    } else {
        // 2、元素节点
        vnode.elm = document.createElement(vnode.tag);

        // 给元素设置属性
        setAttribute(attr, vnode);

        // 递归子节点
        for (let i = 0; i < children.length; i++) {
            createElm(children[i], vnode.elm);
        }
    }

    // 如果有父节点，即将创建的元素添加到父节点内
    if (parent) {
        const elm = vnode.elm;
        if (referNode) {
            parent.insertBefore(elm, referNode);
        } else {
            parent.appendChild(elm);
        }
    }
}

/**
 * 创建文本节点
 * @param {*} textVNode 
 */
function createTextNode(textVNode) {
    const text = textVNode.text;
    let textNode = null;
    if (text.expression) {
        // 存在表达式，这个表达式的值是一个响应式数据
        const value = textVNode.context[text.expression];

        textNode = document.createTextNode(typeof value === 'object' ? JSON.stringify(value) : String(value));
    } else {
        // 纯文本
        textNode = document.createTextNode(text.text);
    }
    return textNode;
}

/**
 * 给节点设置属性
 * @param {*} attr 
 * @param {*} vnode 
 */
function setAttribute(attr, vnode) {
    for (let key in attr) {
        if (key === 'vModel') {
            // v-model 指令
            const { tag, value } = attr.vModel
            setVModel(tag, value, vnode);
        } else if (key === 'vBind') {
            // v-bind
            setVBind(attr[key], vnode);
        } else if (key === 'vOn') {
            // v-on
            setVOn(attr[key], vnode);
        } else {
            // 普通属性
            vnode.elm.setAttribute(key, attr[key]);
        }
    }
}

/**
 * v-model 属性处理
 * @param {*} tag 
 * @param {*} value 
 * @param {*} vnode 
 */
function setVModel(tag, value, vnode) {
    const { context: vm, elm } = vnode;

    if (tag === 'select') {
        // 这里为啥用 Promise，因为子元素 option 还没创建呢
        Promise.resolve().then(() => {
            elm.value = vm[value];
        });
        elm.addEventListener('change', function() {
            vm[value] = elm.value;
        })
    } else if (tag === 'input' && vnode.elm.type === 'text') {
        elm.value = vm[value];

        elm.addEventListener('input', function() {
            vm[value] = elm.value;
        })
    } else if (tag === 'input' && vnode.elm.type === 'checkbox') {
        elm.checked = vm[value];
        elm.addEventListener('change', function() {
            vm[value] = elm.checked;
        })
    }
}

/**
 * 处理 v-bind
 * @param {*} vBind 
 * @param {*} vnode 
 */
function setVBind(vBind, vnode) {
    const { elm, context: vm } = vnode;

    for (let attrName in vBind) {
        elm.setAttribute(attrName, vm[vBind[attrName]]);

        elm.removeAttribute(`v-bind:${attrName}`);
    }
}

/**
 * 处理 v-on
 * @param {*} vOn 
 * @param {*} vnode 
 */
function setVOn(vOn, vnode) {
    const { elm, context: vm } = vnode;

    for (let eventName in vOn) {
        elm.addEventListener(eventName, function(...args) {
            vm.$options.methods[vOn[eventName]].apply(vm, args);
        })
    }
}

/**
 * 创建组件
 * @param {*} vnode 
 */
function createComponent(vnode) {
    if (vnode.tag && !(0,_src_utils__WEBPACK_IMPORTED_MODULE_1__.isReserveTag)(vnode.tag)) {
        // 非保留节点，则说明是组件
        // 获取组件配置信息
        const { tag, context: { $options: { components } } } = vnode;

        const componentOptions = components[tag];

        const componentInstance = new _vue__WEBPACK_IMPORTED_MODULE_0__["default"](componentOptions);

        // 将父组件的 VNode 放到子组件的实例 __parentVnode 上
        componentInstance._parentVnode = vnode;

        componentInstance.$mount();

        componentInstance._vnode.parent = vnode.parent;

        // 将子组件添加到父节点内
        vnode.parent.appendChild(compIns._vnode.elm)

        return true;
    }
}

/***/ }),

/***/ "./compiler2/renderHelper.js":
/*!***********************************!*\
  !*** ./compiler2/renderHelper.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ renderHelper)
/* harmony export */ });
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./compiler2/vnode.js");


/**
 * 渲染辅助函数
 * @param {*} target 
 */
function renderHelper(target) {
    target._c = createElement;
    target._v = createTextNode;
}

/**
 * 创建 VNode
 * @param {*} tag 标签名
 * @param {*} attr 属性
 * @param {*} children 
 */
function createElement(tag, attr, children) {
    return new _vnode__WEBPACK_IMPORTED_MODULE_0__["default"](tag, attr, children, this);
}

/**
 * 文本节点 VNode
 * @param {*} textAst 
 */
function createTextNode(textAst) {
    return new _vnode__WEBPACK_IMPORTED_MODULE_0__["default"](null, null, null, this, textAst);
}


/***/ }),

/***/ "./compiler2/vnode.js":
/*!****************************!*\
  !*** ./compiler2/vnode.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ VNode)
/* harmony export */ });
class VNode {
    /**
     * 
     * @param {*} tag 
     * @param {*} attr 
     * @param {*} children 
     * @param {*} context 
     * @param {*} text 
     */
    constructor(tag, attr, children, context, text = null) {
        this.tag = tag;
        this.attr = attr;
        this.children = children;
        this.parent = null;
        this.text = text;
        this.elm = null;
        this.context = context;
    }
}

/***/ }),

/***/ "./dep.js":
/*!****************!*\
  !*** ./dep.js ***!
  \****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Dep)
/* harmony export */ });
class Dep {
    // 存储当前 dep 收集到的 watcher
    watchers = [];

    // 收集 watcher
    // 在发生读取操作时（vm.xx) && 并且 Dep.target 不为 null 时进行依赖收集
    depend() {
        // 防止 Watcher 实例被重复收集
        if (!Dep.target || this.watchers.includes(Dep.target)) return;

        this.watchers.push(Dep.target);
    }

    // dep 通知自己收集的所有 watcher 执行更新函数
    notify() {
        for (let watcher of this.watchers) {
            watcher.update();
        }
    }
}

// 是一个静态属性
Dep.target = null;



/***/ }),

/***/ "./observer.js":
/*!*********************!*\
  !*** ./observer.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "observe": () => (/* binding */ observe),
/* harmony export */   "default": () => (/* binding */ Observer)
/* harmony export */ });
/* harmony import */ var _protoArgument__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./protoArgument */ "./protoArgument.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./utils.js");
/* harmony import */ var _dep__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dep */ "./dep.js");



/**
 * 响应式设置
 * @param { any } value 
 */
function observe(value) {
    if (value === null || typeof value !== 'object') return;

    // 表示对象已经 经过响应式处理
    if (value.__ob__) return value.__ob__;

    return new Observer(value);
}

class Observer {
    constructor(value) {
        this.dep = new _dep__WEBPACK_IMPORTED_MODULE_2__["default"]();
        
        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true,
        });

        if (Array.isArray(value)) {
            // 数组响应式
            (0,_protoArgument__WEBPACK_IMPORTED_MODULE_0__.protoArgument)(value)
            this.observeArray(value);
        } else {
            this.walk(value);
        }
    }

    walk(data) {
        for (let key in data) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_1__.defineReactive)(data, key, data[key]);
        }
    }

    observeArray(arr) {
        for (let item of arr) {
            observe(item);
        }
    }
}

/***/ }),

/***/ "./protoArgument.js":
/*!**************************!*\
  !*** ./protoArgument.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "protoArgument": () => (/* binding */ protoArgument)
/* harmony export */ });
const arrProto = Array.prototype;

const arrayMethods = Object.create(arrProto);

const methodsToPatch = ['push', 'pop', 'unshift', 'shift', 'splice', 'sort', 'reverse'];

// 数组的变异方法
methodsToPatch.forEach((method) => {
    Object.defineProperty(arrayMethods, method, {
        value: function(...args) {
            const result = arrProto[method].apply(this, args);

            // 拦截这几个操作数组的方法，数组改变时通知依赖更新
            let inserted = [];
            switch(method) {
                case 'push':
                case 'unshift':
                    inserted = args;
                    break;
                case 'splice':
                    inserted = args.slice(2);
                    break;
                default:
                    inserted = [];
            }
            // 表示数组元素增加，增加部分需要设置响应式
            if (inserted.length > 0) {
                this.__ob__.observeArray(args);
            }
            // 通知依赖更新
            this.__ob__.dep.notify();

            return result;
        },
        configurable: true,
        writable: true,
        enumerable: true
    })
})

function protoArgument(arr) {
    Object.setPrototypeOf(arr, arrayMethods);
}

/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isReserveTag": () => (/* binding */ isReserveTag)
/* harmony export */ });
/**
 * 是否为平台保留节点
 * @param {*} tagName 
 */
function isReserveTag(tagName) {
    const reserveTag = ['div', 'h3', 'span', 'input', 'select', 'option', 'p', 'button', 'template'];
    return reserveTag.includes(tagName);
}

/***/ }),

/***/ "./utils.js":
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "proxy": () => (/* binding */ proxy),
/* harmony export */   "defineReactive": () => (/* binding */ defineReactive)
/* harmony export */ });
/* harmony import */ var _dep__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dep */ "./dep.js");
/* harmony import */ var _observer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./observer */ "./observer.js");



/**
 * 将 sourceKey 属性代理到 target 上
 * @param { Vue } vm
 * @param { Object }
 * @param { String } key 属性名
 */
function proxy(target, sourceKey, key) {
    Object.defineProperty(target, key, {
        get() {
            // 读取 vm.xx 实际上返回的是 vm[sourceKey].xx
            return target[sourceKey][key];
        },
        set(value) {
            // vm.xx = value 实际上是对 target[sourceKey][key] 赋值
            target[sourceKey][key] = value;
        }
    })
}

/**
 * 通过 Object.defineProperty 设置 getter setter 拦截
 * @param {*} obj 
 * @param {*} key 
 * @param {*} value 
 */
function defineReactive(obj, key, value) {
    const childOb = (0,_observer__WEBPACK_IMPORTED_MODULE_1__.observe)(value);

    const dep = new _dep__WEBPACK_IMPORTED_MODULE_0__["default"]();

    Object.defineProperty(obj, key, {
        get() {
            if (_dep__WEBPACK_IMPORTED_MODULE_0__["default"].target) {
                console.log(dep)
                dep.depend();
                if (childOb) {
                    childOb.dep.depend();
                }
            }
            return value;
        },
        set(newVal) {
            if (newVal === value) return;

            value = newVal;
            // 对新值进行响应式处理
            (0,_observer__WEBPACK_IMPORTED_MODULE_1__.observe)(newVal);

            // 通知依赖更新
            dep.notify();
        }
    })
}

/***/ }),

/***/ "./vue.js":
/*!****************!*\
  !*** ./vue.js ***!
  \****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./utils.js");
/* harmony import */ var _observer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./observer */ "./observer.js");
/* harmony import */ var _compiler2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./compiler2 */ "./compiler2/index.js");
/* harmony import */ var _compiler2_mountComponent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./compiler2/mountComponent */ "./compiler2/mountComponent.js");
/* harmony import */ var _compiler2_renderHelper__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./compiler2/renderHelper */ "./compiler2/renderHelper.js");
/* harmony import */ var _compiler2_patch__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./compiler2/patch */ "./compiler2/patch.js");
/* harmony import */ var _watcher__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./watcher */ "./watcher.js");








function Vue(options) {
    debugger
    this._init(options);
}

Vue.prototype._init = function(options) {
    const vm = this;
    vm.$options = options;

    initData(vm);

    (0,_compiler2_renderHelper__WEBPACK_IMPORTED_MODULE_4__["default"])(this);

    this.__patch__ = _compiler2_patch__WEBPACK_IMPORTED_MODULE_5__["default"];

    if (vm.$options.el) {
        this.$mount()
    }
}

;(0,_compiler2_mountComponent__WEBPACK_IMPORTED_MODULE_3__.mixinRender)(Vue);

Vue.prototype.$mount = function () {
    (0,_compiler2__WEBPACK_IMPORTED_MODULE_2__.mount)(this);
}

function initData(vm) {
    const data = vm.$options.data;

    if (!data) {
        vm._data = {};
    } else {
        vm._data = typeof data === 'function' ? data() : data;
    }

    // 将 _data 属性代理到 vm 上
    for (let key in vm._data) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_0__.proxy)(vm, '_data', key);
    }

    // 设置响应式
    (0,_observer__WEBPACK_IMPORTED_MODULE_1__.observe)(vm._data);

    new _watcher__WEBPACK_IMPORTED_MODULE_6__["default"](function() {
        console.log('更新啦');
    });
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Vue);


/***/ }),

/***/ "./watcher.js":
/*!********************!*\
  !*** ./watcher.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Watcher)
/* harmony export */ });
/* harmony import */ var _dep__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dep */ "./dep.js");


class Watcher {
    constructor(cb) {
        this._cb = cb;

        _dep__WEBPACK_IMPORTED_MODULE_0__["default"].target = this;
        // 执行 cb 函数，cb 函数中会发生 vm.xx 的属性读取，进行依赖收集
        cb();
        // 依赖收集完成，Dep.target 重新赋值为 null，防止重复收集
        _dep__WEBPACK_IMPORTED_MODULE_0__["default"].target = null;
    }

    // 响应式数据更新时，dep 通知 watcher 执行 update 方法
    update() {
        this._cb();
    }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./vue.js");
/******/ 	Vue = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=vue.js.map