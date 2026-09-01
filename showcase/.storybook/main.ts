import type { StorybookConfig } from "@storybook/react-vite"
import autoprefixer from "autoprefixer"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "tailwindcss"

/**
 * Витрина компонентов дашборда, запускаемая снаружи монорепо.
 *
 * medusa-src/ не изменяется: конфиг, истории и кэш живут здесь,
 * Storybook зовётся с флагом -c. Тот же приём, что в ds-ops/dev/.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SHOWCASE = path.resolve(HERE, "..")
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
    path.join(SHOWCASE, ".storybook/**/*.{ts,tsx}"),
  ],
}

const config: StorybookConfig = {
  stories: [path.join(SHOWCASE, "stories/**/*.stories.@(ts|tsx)")],
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

    cfg.server = {
      ...(cfg.server ?? {}),
      fs: { allow: [MONOREPO, SHOWCASE] },
    }

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
