/**
 * 是否为平台保留节点
 * @param {*} tagName 
 */
export function isReserveTag(tagName) {
    const reserveTag = ['div', 'h3', 'span', 'input', 'select', 'option', 'p', 'button', 'template'];
    return reserveTag.includes(tagName);
}