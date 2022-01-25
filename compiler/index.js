import Watcher from "../watcher";

export function mount(vm) {
    // 获取 el 选择器所表示的元素
    let el = document.querySelector(vm.$options.el);

    // 编译节点
    compileNode(Array.from(el.childNodes), vm)
}

/**
 * 递归编译整棵节点树
 * @param {*} nodes 
 * @param {*} vm 
 */
function compileNode(nodes, vm) {
    for (let node of nodes) {
        if (node.nodeType === 1) { // 元素节点
            // 编译元素上的属性节点
            compileAttribute(node, vm)
            // 递归编译子节点
            compileNode(Array.from(node.childNodes), vm);
        } else if (node.nodeType === 3 && node.textContent.match(/{{(.*)}}/)) {
            // 编译文本节点
            compileTextNode(node, vm);
        }
    }
}

/**
 * 编译文本节点
 * @param { HTMLElement } textNode 
 * @param { Vue } vm 
 */
function compileTextNode(textNode, vm) {
    const prop = RegExp.$1.trim();

    new Watcher(() => {
        textNode.textContent = JSON.stringify(vm[key]);
    })
}

/**
 * 元素节点 Attribute
 * @param {*} node 
 * @param {*} vm 
 */
function compileAttribute(node, vm) {
    // 获取节点的 attribute 并转换为数组
    const attrs = Array.from(node.attributes);

    for (let attr of attrs) {
        const { name, value } = attr;
        // 处理 v-on
        if (/v-on:click|@click/.test(name)) {
            // 编译 v-on:click 指令
            compileVOnClick(node, value, vm)
        } else if (/v-bind:(.*)/.test(name)) {
            compileVBind(node, value, vm);
        } else if (/v-model/.test(name)) {
            compileVModel(node, value, vm);
        }
    }
}

/**
 * 
 * @param { Element } node 
 * @param { String } method 
 * @param { Vue } vm 
 */
function compileVOnClick(node, method, vm) {
    node.addEventListener('click', function(...args) {
        vm.$options.methods[method].apply(vm, args);
    });
}

function compileVBind(node, value, vm) {
    const attrName = RegExp.$1;

    node.removeAttribute(`v-bind:${attrName}`);

    new Watcher(function() {
        node.setAttribute(attrName, vm[value])
    })
}

function compileVModel(node, key, vm) {
    let { tagName, type } = node;

    tagName = tagName.toLowerCase();

    if (tagName === 'input' && type === 'text') {
        // 设置输入框的默认值
        node.value = vm[key];

        node.addEventListener('input', function() {
            vm[key] = node.value;
        })
    } else if (tagName === 'input', type === 'checkbox') {
        node.checked = vm[key];

        node.addEventListener('change', function() {
            vm[key] = node.checked;
        })
    } else if (tagName === 'select') {
        node.value = vm[key];

        node.addEventListener('change', function() {
            vm[key] = node.value;
        })
    }
}