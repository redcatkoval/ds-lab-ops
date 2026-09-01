/**
 * Общее для историй ActionMenu.
 *
 * Компонент берётся из форка как есть, без обёрток:
 * medusa-src/packages/admin/dashboard/src/components/common/action-menu/
 *
 * ВАЖНО. Истории написаны на нынешнем API компонента — `groups`.
 * Контракт ds-ops/contracts/action-menu.md, раздел 3, описывает
 * плоский `actions` и признак `destructive`. Их в коде ещё нет
 * (action-menu.tsx:9-35). Витрина показывает этот разрыв, а не прячет:
 * такие места помечены рамкой «РАЗРЫВ С КОНТРАКТОМ».
 */
export const CONTRACT = "ds-ops/contracts/action-menu.md"

export const noop = () => {}
