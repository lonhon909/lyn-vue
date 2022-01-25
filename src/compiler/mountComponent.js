import Watcher from "../core/observer/watcher";

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
