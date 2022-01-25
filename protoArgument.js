const arrProto = Array.prototype;

const arrayMethods = Object.create(arrProto);

const methodsToPatch = ['push', 'pop', 'unshift', 'shift', 'splice', 'sort', 'reverse'];

// 数组的变异方法
methodsToPatch.forEach((method) => {
    Object.defineProperty(arrayMethods, method, {
        value: function(...args) {
            const result = arrProto[method].apply(this, args);

            // 拦截这几个操作数组的方法，数组改变时通知依赖更新
            let inserted = [];
            switch(method) {
                case 'push':
                case 'unshift':
                    inserted = args;
                    break;
                case 'splice':
                    inserted = args.slice(2);
                    break;
                default:
                    inserted = [];
            }
            // 表示数组元素增加，增加部分需要设置响应式
            if (inserted.length > 0) {
                this.__ob__.observeArray(args);
            }
            // 通知依赖更新
            this.__ob__.dep.notify();

            return result;
        },
        configurable: true,
        writable: true,
        enumerable: true
    })
})

export function protoArgument(arr) {
    Object.setPrototypeOf(arr, arrayMethods);
}