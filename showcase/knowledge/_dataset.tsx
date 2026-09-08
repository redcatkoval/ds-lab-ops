import { useState } from "react"

import { Таблица, размер } from "./_shell"

/**
 * Список файлов-измерений с загрузкой по требованию.
 *
 * Крупные файлы корпуса (tokens/literals.json — 502 КБ) в бандл
 * не кладутся: import.meta.glob без eager даёт функцию, которая
 * тянет файл отдельным куском в момент нажатия.
 */
export type Файлы = Record<string, () => Promise<string>>

const имя = (путь: string) => путь.split("/").pop() ?? путь

const свод = (текст: string) => {
  const d = JSON.parse(текст) as Record<string, unknown>
  const списки = Object.entries(d)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}: ${(v as unknown[]).length}`)
  return {
    ключи: Object.keys(d),
    списки,
    generated: typeof d.generated === "string" ? d.generated : null,
    method: typeof d.method === "string" ? d.method : null,
  }
}

export const Измерения = ({
  файлы,
  размеры,
  даты,
}: {
  файлы: Файлы
  размеры: Record<string, number>
  /** Дата обхода из поля generated самого файла. */
  даты?: Record<string, string | null>
}) => {
  const [открыт, setОткрыт] = useState<string | null>(null)
  const [текст, setТекст] = useState<string | null>(null)
  const [ошибка, setОшибка] = useState<string | null>(null)

  const открыть = async (путь: string) => {
    if (открыт === путь) {
      setОткрыт(null)
      setТекст(null)
      return
    }
    setОткрыт(путь)
    setТекст(null)
    setОшибка(null)
    try {
      setТекст(await файлы[путь]())
    } catch (e) {
      setОшибка(e instanceof Error ? e.message : String(e))
    }
  }

  const разобранное = текст ? свод(текст) : null

  return (
    <>
      <Таблица
        шапка={["файл", "обход", "размер", ""]}
        строки={Object.keys(файлы)
          .sort()
          .map((путь) => [
            <span className="font-mono">{имя(путь)}</span>,
            <span className="text-ui-fg-muted">{даты?.[путь] ?? "—"}</span>,
            размер(размеры[путь] ?? 0),
            <button
              type="button"
              onClick={() => void открыть(путь)}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            >
              {открыт === путь ? "свернуть" : "открыть"}
            </button>,
          ])}
      />

      {открыт && (
        <div className="border-ui-border-base bg-ui-bg-base rounded-lg border p-4">
          <div className="txt-compact-small-plus mb-2 font-mono">{имя(открыт)}</div>
          {ошибка && (
            <div className="text-ui-fg-error txt-compact-small">
              не прочитан: {ошибка}
            </div>
          )}
          {!ошибка && !текст && (
            <div className="text-ui-fg-subtle txt-compact-small">загружается…</div>
          )}
          {разобранное && (
            <div className="flex flex-col gap-2">
              <div className="txt-compact-small text-ui-fg-subtle">
                замер {разобранное.generated ?? "без даты"}
                {разобранное.method ? ` · ${разобранное.method}` : ""}
              </div>
              <div className="txt-compact-small">
                ключи: <span className="font-mono">{разобранное.ключи.join(", ")}</span>
              </div>
              {разобранное.списки.length > 0 && (
                <div className="txt-compact-small">
                  списки: <span className="font-mono">{разобранное.списки.join(" · ")}</span>
                </div>
              )}
              <pre className="bg-ui-bg-subtle txt-compact-xsmall max-h-96 overflow-auto rounded p-3">
                {(текст ?? "").slice(0, 4000)}
                {(текст ?? "").length > 4000 ? "\n… показано 4000 знаков из " + (текст ?? "").length : ""}
              </pre>
            </div>
          )}
        </div>
      )}
    </>
  )
}
