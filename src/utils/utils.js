import Dep from '../core/vdom/dep';
import { observe } from '../core/observer/observer';

/**
 * 通过 Object.defineProperty 设置 getter setter 拦截
 * @param {*} obj 
 * @param {*} key 
 * @param {*} value 
 */
export function defineReactive(obj, key, value) {
    const childOb = observe(value);

    const dep = new Dep();

    Object.defineProperty(obj, key, {
        get() {
            if (Dep.target) {
                dep.depend();
                if (childOb) {
                    childOb.dep.depend();
                }
            }
            return value;
        },
        set(newVal) {
            if (newVal === value) return;

            value = newVal;
            // 对新值进行响应式处理
            observe(newVal);

            // 通知依赖更新
            dep.notify();
        }
    })
}