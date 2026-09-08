import { useState } from "react"

import { Плашки, Плитка, Пояснение, Страница, Таблица } from "../_shell"

/**
 * Списки компонентов грузятся по требованию: карты весят десятки
 * килобайт, и в бандл страницы они не кладутся.
 */
const карты = import.meta.glob("../../../map/*.json", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>

type Компонент = { name: string; imports: number; files: number }
type Карта = { generated: string; components: Компонент[] }

// Единственный компонент с контрактом. Список ведётся вручную:
// контракт — это файл в ds-ops/contracts/, а не признак в коде.
const С_КОНТРАКТОМ = ["action-menu"]
const В_РАБОТЕ: string[] = []

export const Компоненты = () => {
  const [карта, setКарта] = useState<Карта | null>(null)
  const [слой, setСлой] = useState<"system" | "local" | null>(null)

  const открыть = async (какой: "system" | "local") => {
    setСлой(какой)
    setКарта(null)
    const путь = какой === "system" ? "../../../map/components.json" : "../../../map/local-components.json"
    setКарта(JSON.parse(await карты[путь]()) as Карта)
  }

  const список = карта?.components ?? []
  const состояние = (имя: string) =>
    С_КОНТРАКТОМ.includes(имя) ? "с контрактом" : В_РАБОТЕ.includes(имя) ? "в работе" : "не описан"
  const неописанные = [...список]
    .filter((к) => состояние(к.name) === "не описан")
    .sort((a, b) => b.imports - a.imports)

  return (
    <Страница
      title="Компоненты"
      источник={карта ? <>обход {карта.generated.slice(0, 10)}</> : <>ds-ops/map/</>}
    >
      <Пояснение>
        Что у нас есть и что из этого описано контрактом. Данные — из карт
        `ds-ops/map/`: обход импортов по дашборду, число вызовов у каждого
        компонента. Смотреть, чтобы выбрать следующий компонент для работы:
        не описанные отсортированы по числу вызовов, и это очередь —
        чем чаще компонент зовут, тем дороже обходится молчание контракта.
      </Пояснение>

      <Плашки>
        <Плитка что="с контрактом" сколько={С_КОНТРАКТОМ.length} чем="ActionMenu" />
        <Плитка что="в работе" сколько={В_РАБОТЕ.length} />
        <Плитка что="системных, не описаны" сколько={46 - 1} чем="@medusajs/ui" />
        <Плитка что="локальных, не описаны" сколько={126} чем="дашборд" />
      </Плашки>

      <div className="flex gap-2">
        {(["system", "local"] as const).map((к) => (
          <button
            key={к}
            type="button"
            onClick={() => void открыть(к)}
            className={`border-ui-border-base txt-compact-small rounded-lg border px-3 py-1.5 ${
              слой === к ? "bg-ui-bg-base-pressed" : "bg-ui-bg-base"
            }`}
          >
            {к === "system" ? "дизайн-система, 46" : "локальный слой, 126"}
          </button>
        ))}
      </div>

      {слой && !карта && (
        <div className="text-ui-fg-subtle txt-compact-small">загружается…</div>
      )}

      {карта && (
        <>
          <h2 className="txt-compact-small-plus">
            Очередь: не описаны, по числу вызовов
          </h2>
          <Таблица
            шапка={["компонент", "вызовов", "файлов", "состояние"]}
            строки={неописанные.slice(0, 30).map((к) => [
              <span className="font-mono">{к.name}</span>,
              к.imports,
              к.files,
              <span className="text-ui-fg-muted">{состояние(к.name)}</span>,
            ])}
          />
          <div className="txt-compact-xsmall text-ui-fg-muted">
            показаны первые 30 из {неописанные.length}
          </div>
        </>
      )}
    </Страница>
  )
}
