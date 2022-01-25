export default class VNode {
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