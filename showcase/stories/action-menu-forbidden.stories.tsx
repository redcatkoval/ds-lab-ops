import { PencilSquare } from "@medusajs/icons";
import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";

import { ActionMenu } from "../../../medusa-src/packages/admin/dashboard/src/components/common/action-menu";

/**
 * Состояния, запрещённые контрактом. Показаны намеренно: витрина
 * показывает и то, как должно быть, и то, как нельзя.
 *
 * Эти вызовы — намеренные нарушения. См. README витрины, раздел
 * «Намеренные нарушения», прежде чем расширять область линтера.
 */
const meta = {
  title: "ActionMenu/Запрещено контрактом",
  component: ActionMenu,
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const НольДействий: Story = {
  name: "Ноль действий — нарушение",
  args: { actions: [] },
  parameters: {
    violation: {
      section: "4.1",
      text:
        "Действий два или больше; ноль и одно запрещены. Компонент рисует триггер, " +
        "который открывает пустое содержимое: actions.map по пустому списку " +
        "не даёт ни одного пункта (action-menu.tsx:47-48). Ветка, возвращавшая " +
        "null для группы с нулём действий, удалена вместе с группами 2026-09-02. " +
        "В коде дашборда так сделан один вызов — " +
        "product-create-details-media-section.tsx:296. Он заморожен в baseline " +
        "линтера как долг.",
    },
  },
};

export const ОдноДействие: Story = {
  name: "Одно действие — нарушение",
  args: {
    actions: [{ icon: <PencilSquare />, label: "Редактировать", to: "edit" }],
  },
  parameters: {
    violation: {
      section: "4.1",
      text:
        "Одно действие под меню — два клика вместо одного. По разделу 2 контракта " +
        "здесь нужна иконочная или текстовая кнопка, а не меню. В коде дашборда " +
        "так сделано 20 вызовов из 80 разобранных — контракт, раздел 6, пункт 1, " +
        "замер 2026-09-08. Из них 12 нарушением не считаются: единственное " +
        "действие там разрушающее, исключение правила 4.1 по DEC-017. " +
        "Остальные заморожены в baseline линтера как долг.",
    },
  },
};
