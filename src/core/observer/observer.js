import { protoArgument } from '../protoArgument';
import { defineReactive } from '../../utils/utils';
import Dep from '../vdom/dep';
/**
 * 响应式设置
 * @param { any } value 
 */
export function observe(value) {
    if (value === null || typeof value !== 'object') return;

    // 表示对象已经 经过响应式处理
    if (value.__ob__) return value.__ob__;

    return new Observer(value);
}

export default class Observer {
    constructor(value) {
        this.dep = new Dep();
        
        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true,
        });

        if (Array.isArray(value)) {
            // 数组响应式
            protoArgument(value)
            this.observeArray(value);
        } else {
            this.walk(value);
        }
    }

    walk(data) {
        for (let key in data) {
            defineReactive(data, key, data[key]);
        }
    }

    observeArray(arr) {
        for (let item of arr) {
            observe(item);
        }
    }
}