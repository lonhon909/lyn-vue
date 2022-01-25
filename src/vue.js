import { proxy } from './utils';
import { observe } from './core/observer/observer';
import { mount } from './compiler';
import renderHelper from './compiler/renderHelper';
import patch from './compiler/patch';

function Vue(options) {
    this._init(options);
}

Vue.prototype._init = function(options) {
    const vm = this;
    vm.$options = options;

    initData(vm);

    renderHelper(this);

    this.__patch__ = patch;

    if (vm.$options.el) {
        this.$mount()
    }
}

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

Vue.prototype.$mount = function () {
    mount(this);
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
        proxy(vm, '_data', key);
    }

    // 设置响应式
    observe(vm._data);
}


export default Vue;
