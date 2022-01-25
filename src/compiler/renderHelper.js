import VNode from './vnode';

/**
 * 渲染辅助函数
 * @param {*} target 
 */
export default function renderHelper(target) {
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
    return new VNode(tag, attr, children, this);
}

/**
 * 文本节点 VNode
 * @param {*} textAst 
 */
function createTextNode(textAst) {
    return new VNode(null, null, null, this, textAst);
}
