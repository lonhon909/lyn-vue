export default class Dep {
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

