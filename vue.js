import { proxy } from './utils';
import { observe } from './observer';
import { mount } from './compiler2';
import { mixinRender } from './compiler2/mountComponent';
import renderHelper from './compiler2/renderHelper';
import patch from './compiler2/patch';
import Watcher from './watcher';

function Vue(options) {
    debugger
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

mixinRender(Vue);

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

    new Watcher(function() {
        console.log('更新啦');
    });
}


export default Vue;
