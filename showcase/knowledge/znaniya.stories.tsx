import type { Meta, StoryObj } from "@storybook/react"

import { Замеры } from "./stranicy/zamery"
import { Вопросы } from "./stranicy/voprosy"
import { Компоненты } from "./stranicy/komponenty"
import { Обзор } from "./stranicy/obzor"
import { Решения } from "./stranicy/resheniya"
import { ЧтоПроверяется } from "./stranicy/chto-proveryaetsya"

/**
 * Оболочка знаний — шесть страниц одним разделом.
 *
 * Заголовок один на все шесть нарочно: `title: "Знания/Обзор"` завёл бы
 * «Обзор» отдельным узлом-компонентом, а страницу сделал его ребёнком,
 * и дерево читалось бы в два уровня. С одним заголовком боковая панель
 * показывает «Знания → Обзор, Компоненты, …» — как и задумано.
 */
const meta = {
  title: "Знания",
  parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type История = StoryObj<typeof meta>

export const обзор: История = { name: "Обзор", render: () => <Обзор /> }
export const компоненты: История = { name: "Компоненты", render: () => <Компоненты /> }
export const чтоПроверяется: История = {
  name: "Что проверяется",
  render: () => <ЧтоПроверяется />,
}
export const вопросы: История = { name: "Вопросы", render: () => <Вопросы /> }
export const решения: История = { name: "Решения", render: () => <Решения /> }
export const замеры: История = { name: "Замеры", render: () => <Замеры /> }
