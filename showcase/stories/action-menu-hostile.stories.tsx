import { PencilSquare, Trash } from "@medusajs/icons"
import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"

import { ActionMenu } from "../../../medusa-src/packages/admin/dashboard/src/components/common/action-menu"
import { noop } from "./_shared"

/**
 * Враждебные данные. Контракт длину и вид метки не ограничивает
 * (раздел 3: label — string, без условий), поэтому это не нарушения,
 * а проверка того, что произойдёт.
 */
const meta = {
  title: "ActionMenu/Враждебные данные",
  component: ActionMenu,
} satisfies Meta<typeof ActionMenu>

export default meta
type Story = StoryObj<typeof meta>

export const ОченьДлиннаяМетка: Story = {
  name: "Очень длинная метка",
  args: {
    groups: [
      {
        actions: [
          {
            icon: <PencilSquare />,
            label:
              "Редактировать параметры доставки для всех регионов, включая те, " +
              "где включён расчёт налога по месту назначения покупателя",
            to: "edit",
          },
          { icon: <Trash />, label: "Удалить", onClick: noop },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Метка обёрнута в span без ограничения ширины (action-menu.tsx:92, :112). " +
          "Ширину меню задаёт DropdownMenu.Content из @medusajs/ui — смотрим, " +
          "переносится строка или растягивает меню.",
      },
    },
  },
}

export const МеткаБезПробелов: Story = {
  name: "Метка в одно слово без пробелов",
  args: {
    groups: [
      {
        actions: [
          {
            icon: <PencilSquare />,
            label:
              "Редактироватьпараметрыдоставкидлявсехрегионоввключаярасчётналога",
            to: "edit",
          },
          { icon: <Trash />, label: "Удалить", onClick: noop },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Слово без пробелов переносить не по чему. Классов break-words или " +
          "truncate у метки нет (action-menu.tsx:92, :112) — смотрим, что делает " +
          "меню: расширяется, обрезает или выходит за край экрана.",
      },
    },
  },
}
