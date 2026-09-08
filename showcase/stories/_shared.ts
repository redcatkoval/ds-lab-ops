/**
 * Общее для историй ActionMenu.
 *
 * Компонент берётся из форка как есть, без обёрток:
 * medusa-src/packages/admin/dashboard/src/components/common/action-menu/
 *
 * Истории написаны на нынешнем API — плоский `actions` (action-menu.tsx:32-34).
 * Признак `destructive` в типе есть (:20). Компонент приведён к разделу 3
 * контракта 2026-09-02, истории переведены тем же днём, коммит aad2c8f.
 *
 * Где витрина расходится с контрактом, это помечено рамкой на самой
 * истории — виды пометок перечислены в .storybook/preview.tsx.
 */
export const CONTRACT = "ds-ops/contracts/action-menu.md"

export const noop = () => {}
