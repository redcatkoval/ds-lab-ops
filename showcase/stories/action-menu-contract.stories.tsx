import {
  ArrowPath,
  DocumentText,
  GlobeEurope,
  PencilSquare,
  Plus,
  Trash,
} from "@medusajs/icons"
import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"

import { ActionMenu } from "../../../medusa-src/packages/admin/dashboard/src/components/common/action-menu"
import { noop } from "./_shared"

const meta = {
  title: "ActionMenu/По контракту",
  component: ActionMenu,
} satisfies Meta<typeof ActionMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Правило 4.1: действий два или больше. Это нижняя граница. */
export const ДваДействия: Story = {
  name: "Два действия — минимум по правилу 4.1",
  args: {
    groups: [
      {
        actions: [
          { icon: <PencilSquare />, label: "Редактировать", to: "edit" },
          { icon: <Trash />, label: "Удалить", onClick: noop },
        ],
      },
    ],
  },
  parameters: {
    gap: {
      section: "4.2",
      text:
        "Контракт требует разделитель между всеми действиями. Компонент ставит " +
        "его между группами (action-menu.tsx:118), поэтому здесь, внутри одной " +
        "группы, разделителя нет. Группировки в целевом API не будет вовсе.",
    },
  },
}

/** Правило 4.1: до пяти действий — рекомендуемый потолок. */
export const ПятьДействий: Story = {
  name: "Пять действий — рекомендуемый потолок",
  args: {
    groups: [
      {
        actions: [
          { icon: <PencilSquare />, label: "Редактировать", to: "edit" },
          { icon: <GlobeEurope />, label: "Переводы", to: "translations" },
          { icon: <DocumentText />, label: "История изменений", onClick: noop },
          { icon: <ArrowPath />, label: "Пересобрать", onClick: noop },
          { icon: <Plus />, label: "Добавить вариант", onClick: noop },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Пять — рекомендация, а не запрет. Превышение контракт не считает " +
          "ошибкой: ни линтер, ни ревью его не блокируют.",
      },
    },
  },
}

/** Правило 4.3: разрушающее действие последнее и помечено красным. */
export const СОпаснымДействием: Story = {
  name: "С опасным действием",
  args: {
    groups: [
      {
        actions: [
          { icon: <PencilSquare />, label: "Редактировать", to: "edit" },
          { icon: <GlobeEurope />, label: "Переводы", to: "translations" },
        ],
      },
      {
        actions: [
          {
            icon: <Trash />,
            label: "Удалить",
            onClick: noop,
            destructive: true,
          },
        ],
      },
    ],
  },
  parameters: {
    gap: {
      section: "4.3",
      text:
        "Половина правила закрыта. Признак destructive в типе Action есть " +
        "(action-menu.tsx:20), и по нему пункт красится токеном fg-error — " +
        "и текст, и иконка (action-menu.tsx:91-92, :110-111, решение DEC-011). " +
        "Не закрыто остальное: последним в списке действие стоит потому, что так " +
        "составлен этот вызов, а не потому, что компонент это гарантирует. " +
        "Подтверждение по контракту обязательно, но проверяется человеком — " +
        "здесь его нет, обработчик пустой.",
    },
  },
}

/** Раздел 3: disabled и disabledTooltip. */
export const ЗапрещённоеДействиеСПодсказкой: Story = {
  name: "С disabled и подсказкой",
  args: {
    groups: [
      {
        actions: [
          { icon: <PencilSquare />, label: "Редактировать", to: "edit" },
          {
            icon: <Trash />,
            label: "Удалить",
            onClick: noop,
            disabled: true,
            disabledTooltip: "Нельзя удалить: на товар ссылается активный заказ",
          },
        ],
      },
    ],
  },
  parameters: {
    gap: {
      section: "3",
      text:
        "Поля disabled и disabledTooltip в API есть и работают " +
        "(action-menu.tsx:12, :16, :63-73). Разрыв в другом: раздел 4 контракта " +
        "не описывает, как запрещённый пункт должен выглядеть и когда подсказка " +
        "обязательна. Правила на это нет — проверить нечего.",
    },
    docs: {
      description: {
        story: "Подсказка появляется при наведении на запрещённый пункт, сбоку справа.",
      },
    },
  },
}
