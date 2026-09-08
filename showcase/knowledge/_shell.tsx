import type { ReactNode } from "react"

/**
 * Общее оформление страниц оболочки знаний.
 *
 * Страницы — не истории компонента: у них нет args и controls, они
 * показывают корпус ds-ops. Отсюда и раздел «Знания» в боковой панели,
 * отдельный от «ActionMenu».
 */
export const Страница = ({
  title,
  источник,
  children,
}: {
  title: string
  /** Откуда взяты числа и когда. Показывается всегда, а не при отказе. */
  источник: ReactNode
  children: ReactNode
}) => (
  <div className="text-ui-fg-base bg-ui-bg-subtle min-h-screen p-6">
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="txt-compact-large-plus">{title}</h1>
        <div className="txt-compact-xsmall text-ui-fg-muted">{источник}</div>
      </div>
      {children}
    </div>
  </div>
)

/**
 * Плашки с числами — всегда четыре в ряд.
 *
 * Первая редакция раскладывала их разными сетками (4 и 3), и последний
 * ряд выходил шире остальных: плашки одного веса читались как разные.
 */
export const Плашки = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-4 gap-3">{children}</div>
)

/** Шапка страницы: что за срез, откуда данные, зачем смотреть. */
export const Пояснение = ({ children }: { children: ReactNode }) => (
  <div className="border-ui-border-base bg-ui-bg-base txt-compact-small text-ui-fg-subtle rounded-lg border p-4">
    {children}
  </div>
)

export const Плитка = ({
  что,
  сколько,
  чем,
}: {
  что: string
  сколько: ReactNode
  чем?: string
}) => (
  <div className="border-ui-border-base bg-ui-bg-base rounded-lg border p-4">
    <div className="txt-compact-xsmall text-ui-fg-subtle">{что}</div>
    <div className="txt-compact-large-plus mt-1">{сколько}</div>
    {chemStr(чем)}
  </div>
)

const chemStr = (чем?: string) =>
  чем ? <div className="txt-compact-xsmall text-ui-fg-muted mt-1">{чем}</div> : null

export const Таблица = ({
  шапка,
  строки,
}: {
  шапка: string[]
  строки: ReactNode[][]
}) => (
  <div className="border-ui-border-base bg-ui-bg-base overflow-x-auto rounded-lg border">
    <table className="txt-compact-small w-full border-collapse">
      <thead>
        <tr className="border-ui-border-base text-ui-fg-subtle border-b">
          {шапка.map((h) => (
            <th key={h} className="px-3 py-2 text-left font-normal">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {строки.map((r, i) => (
          <tr key={i} className="border-ui-border-base border-b last:border-0">
            {r.map((c, j) => (
              <td key={j} className="px-3 py-2 align-top">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

/** Человеческий размер файла: числа корпуса меряются и в килобайтах. */
export const размер = (байт: number) =>
  байт < 1024 ? `${байт} Б` : `${Math.round(байт / 1024)} КБ`
