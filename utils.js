import Dep from './dep';
import { observe } from './observer';

/**
 * 将 sourceKey 属性代理到 target 上
 * @param { Vue } vm
 * @param { Object }
 * @param { String } key 属性名
 */
export function proxy(target, sourceKey, key) {
    Object.defineProperty(target, key, {
        get() {
            // 读取 vm.xx 实际上返回的是 vm[sourceKey].xx
            return target[sourceKey][key];
        },
        set(value) {
            // vm.xx = value 实际上是对 target[sourceKey][key] 赋值
            target[sourceKey][key] = value;
        }
    })
}

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
                console.log(dep)
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