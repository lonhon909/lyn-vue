/**
 * 是否为平台保留节点
 * @param {*} tagName 
 */
export function isReserveTag(tagName) {
    const reserveTag = ['div', 'h3', 'span', 'input', 'select', 'option', 'p', 'button', 'template'];
    return reserveTag.includes(tagName);
}

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