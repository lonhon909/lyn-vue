import Watcher from "../watcher";

/**
 * 挂载
 * @param { Vue } vm 
 */
export function mountComponent(vm) {

    const updateComponent = () => {
        vm._update(vm._render());
    }

    new Watcher(updateComponent);
}


export function mixinRender(Vue) {
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