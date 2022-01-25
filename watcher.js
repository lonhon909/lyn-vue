import Dep from './dep';

export default class Watcher {
    constructor(cb) {
        this._cb = cb;

        Dep.target = this;
        // 执行 cb 函数，cb 函数中会发生 vm.xx 的属性读取，进行依赖收集
        cb();
        // 依赖收集完成，Dep.target 重新赋值为 null，防止重复收集
        Dep.target = null;
    }

    // 响应式数据更新时，dep 通知 watcher 执行 update 方法
    update() {
        this._cb();
    }
}