import type { StorybookConfig } from "@storybook/react-vite"
import autoprefixer from "autoprefixer"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "tailwindcss"

import fs from "node:fs"

import { собратьЧисла } from "../knowledge/lint-data.mjs"

/**
 * Витрина компонентов дашборда, запускаемая снаружи монорепо.
 *
 * medusa-src/ не изменяется: конфиг, истории и кэш живут здесь,
 * Storybook зовётся с флагом -c. Тот же приём, что в ds-ops/dev/.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = path.resolve(HERE, "..")
const DS_OPS = path.resolve(SHOWCASE, "..")
const MONOREPO = path.resolve(SHOWCASE, "../../medusa-src")
const DASHBOARD = path.join(MONOREPO, "packages/admin/dashboard")

const require_ = createRequire(import.meta.url)

/**
 * Конфиг Tailwind берём у дашборда и правим две вещи.
 *
 * 1. `content` в нём задан путями от текущего каталога
 *    (dashboard/tailwind.config.cjs:12). Разворачиваем их в абсолютные,
 *    чтобы не зависеть от того, откуда запущен Storybook.
 * 2. Добавляем к `content` наши истории: классы из них тоже должны
 *    попасть в сборку.
 */
const dashboardTailwind = require_(path.join(DASHBOARD, "tailwind.config.cjs"))
const tailwindConfig = {
  ...dashboardTailwind,
  content: [
    ...dashboardTailwind.content.map((p: string) =>
      p.startsWith(".") ? path.join(DASHBOARD, p) : p
    ),
    path.join(SHOWCASE, "stories/**/*.{ts,tsx}"),
    path.join(SHOWCASE, "knowledge/**/*.{ts,tsx}"),
    path.join(SHOWCASE, ".storybook/**/*.{ts,tsx}"),
  ],
}

/**
 * Числа для вкладки «Долг» собираются один раз, при поднятии конфига,
 * и отдаются страницам виртуальным модулем. Прогон линтера — основной
 * путь, сохранённый снимок — запасной; что из двух сработало и когда,
 * возвращается вместе с данными и показывается на экране (DEC-021
 * про запасной путь, который обязан сообщать о себе).
 */
const числа = собратьЧисла()
console.log(
  `[знания] числа линтера: ${числа.источник}` +
    (числа.снят ? `, ${числа.снят}` : "") +
    (числа.почему ? ` (${числа.почему.split("\n")[0]})` : "")
)

const ЧИСЛА_МОДУЛЬ = "virtual:ds-lab/lint"
const РАЗМЕРЫ_МОДУЛЬ = "virtual:ds-lab/files"
const КОРПУС_МОДУЛЬ = "virtual:ds-lab/corpus"

/**
 * Размеры файлов-измерений — со стороны Node, а не импортом содержимого.
 *
 * Иначе список файлов пришлось бы получать через import.meta.glob
 * с eager, а он кладёт в бандл сами файлы: tokens/literals.json — 502 КБ.
 * Проверено сборкой: с eager кусок вкладки весил 845 КБ, без него — 6 КБ.
 */
const размерыКаталога = (каталог: string) =>
  Object.fromEntries(
    fs
      .readdirSync(path.join(DS_OPS, каталог))
      .filter((f) => f.endsWith(".json"))
      .map((f) => [f, fs.statSync(path.join(DS_OPS, каталог, f)).size])
  )
const размеры = { map: размерыКаталога("map"), tokens: размерыКаталога("tokens") }

/** Дата замера и способ — из самих файлов измерений: поле generated. */
const датыКаталога = (каталог: string) =>
  Object.fromEntries(
    fs
      .readdirSync(path.join(DS_OPS, каталог))
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const d = JSON.parse(
          fs.readFileSync(path.join(DS_OPS, каталог, f), "utf8")
        ) as Record<string, unknown>
        return [
          f,
          {
            замер: typeof d.generated === "string" ? d.generated.slice(0, 10) : null,
            о: typeof d.вопрос === "string" ? d.вопрос : (typeof d.subject === "string" ? d.subject : null),
          },
        ]
      })
  )
const даты = { map: датыКаталога("map"), tokens: датыКаталога("tokens") }

/**
 * Поля разметки вопросов и решений — со стороны Node.
 *
 * Разбираются только поля (DEC-020, DEC-022): состояние, адресат,
 * предмет, дата. Проза не разбирается и в бандл не попадает — иначе
 * оболочка потянула бы за собой весь корпус.
 */
const поле = (текст: string, имя: string) => {
  const m = текст.match(new RegExp(`^\\*\\*${имя}:\\*\\* (.+)$`, "m"))
  return m ? m[1].trim() : null
}
const заголовок = (текст: string) => текст.split("\n")[0].replace(/^#\s*/, "")
const дата = (текст: string) => {
  const m = текст.match(/^\*\*Дата\.\*\* (\d{4}-\d{2}-\d{2})/m)
  return m ? m[1] : null
}
const читать = (каталоги: string[]) =>
  каталоги
    .flatMap((к) =>
      fs
        .readdirSync(path.join(DS_OPS, к))
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(DS_OPS, к, f))
    )
    .map((p) => {
      const текст = fs.readFileSync(p, "utf8")
      const имя = path.basename(p)
      return {
        код: имя.slice(0, имя.indexOf("-", 5) === -1 ? 5 : имя.indexOf("-")),
        файл: имя,
        заголовок: заголовок(текст),
        состояние: поле(текст, "Состояние"),
        адресат: поле(текст, "Адресат"),
        предмет: поле(текст, "Предмет"),
        дата: дата(текст),
      }
    })
    .sort((a, b) => a.код.localeCompare(b.код))

const корпус = {
  вопросы: читать(["questions", "questions/reshennye"]),
  решения: читать(["decisions"]),
}

const config: StorybookConfig = {
  stories: [
    path.join(SHOWCASE, "stories/**/*.stories.@(ts|tsx)"),
    path.join(SHOWCASE, "knowledge/**/*.stories.@(ts|tsx)"),
  ],
  addons: ["@storybook/addon-themes"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (cfg) => {
    // root уводим к себе вместе с кэшем оптимизатора: Vite отдаёт
    // предсобранные зависимости по URL /.vite/deps, а он считается
    // от root. Если увести только cacheDir, превью падает на
    // "Failed to fetch dynamically imported module: /.vite/deps/...".
    // Заодно внутрь medusa-src/ ничего не пишется.
    cfg.root = SHOWCASE
    cfg.cacheDir = path.join(SHOWCASE, ".vite")

    // PostCSS задаём объектом, а не путём к dashboard/postcss.config.cjs:
    // тот подключает `tailwindcss: {}` без пути к конфигу, и Tailwind
    // ищет его от текущего каталога. Здесь путь задан явно.
    cfg.css = { ...(cfg.css ?? {}), postcss: { plugins: [tailwindcss(tailwindConfig), autoprefixer()] } }

    // ds-ops добавлен в fs.allow ради оболочки знаний: она читает
    // map/, tokens/ и tools/lint/baseline.json, а они лежат выше root.
    // На сборку статики это не влияет — fs.allow стережёт дев-сервер.
    cfg.server = {
      ...(cfg.server ?? {}),
      fs: { allow: [MONOREPO, SHOWCASE, DS_OPS] },
    }

    cfg.plugins = [
      ...(cfg.plugins ?? []),
      {
        name: "ds-lab-lint-numbers",
        resolveId: (id: string) =>
          id === ЧИСЛА_МОДУЛЬ ? "\0" + ЧИСЛА_МОДУЛЬ : null,
        load: (id: string) =>
          id === "\0" + ЧИСЛА_МОДУЛЬ
            ? `export default ${JSON.stringify(числа)}`
            : null,
      },
      {
        name: "ds-lab-file-sizes",
        resolveId: (id: string) =>
          id === РАЗМЕРЫ_МОДУЛЬ ? "\0" + РАЗМЕРЫ_МОДУЛЬ : null,
        load: (id: string) =>
          id === "\0" + РАЗМЕРЫ_МОДУЛЬ
            ? `export default ${JSON.stringify({ размеры, даты })}`
            : null,
      },
      {
        name: "ds-lab-corpus",
        resolveId: (id: string) =>
          id === КОРПУС_МОДУЛЬ ? "\0" + КОРПУС_МОДУЛЬ : null,
        load: (id: string) =>
          id === "\0" + КОРПУС_МОДУЛЬ
            ? `export default ${JSON.stringify(корпус)}`
            : null,
      },
    ]

    // Дашборд объявляет шесть глобалей (dashboard/src/vite-env.d.ts:16-21).
    // ActionMenu ими не пользуется, но соседний импорт может их потянуть,
    // а необъявленная глобаль в dev-режиме даёт ReferenceError до рендера.
    // Значения — те же, что в ds-ops/dev/vite.config.mts.
    cfg.define = {
      ...(cfg.define ?? {}),
      __BASE__: JSON.stringify("/"),
      __BACKEND_URL__: JSON.stringify("http://localhost:9000"),
      __STOREFRONT_URL__: JSON.stringify("http://localhost:8000"),
      __AUTH_TYPE__: "undefined",
      __JWT_TOKEN_STORAGE_KEY__: "undefined",
      __MAX_UPLOAD_FILE_SIZE__: JSON.stringify(1024 * 1024),
    }
    return cfg
  },
}

export default config
