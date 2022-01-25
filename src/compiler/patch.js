import Vue from "../vue";
import { isReserveTag } from '../utils';
/**
 * 
 * @param { Element|VNode } oldVnode 旧的 VNode 或者真实元素
 * @param { VNode } vnode 
 */
export default function patch(oldVnode, vnode) {
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
    if (vnode.tag && !isReserveTag(vnode.tag)) {
        // 非保留节点，则说明是组件
        // 获取组件配置信息
        const { tag, context: { $options: { components } } } = vnode;

        const componentOptions = components[tag];

        const componentInstance = new Vue(componentOptions);

        // 将父组件的 VNode 放到子组件的实例 __parentVnode 上
        componentInstance._parentVnode = vnode;

        componentInstance.$mount();

        componentInstance._vnode.parent = vnode.parent;

        // 将子组件添加到父节点内
        vnode.parent.appendChild(compIns._vnode.elm)

        return true;
    }
}