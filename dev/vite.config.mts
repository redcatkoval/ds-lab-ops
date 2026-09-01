import inject from "@medusajs/admin-vite-plugin"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import inspect from "vite-plugin-inspect"

/**
 * Dev-конфиг для запуска админки Medusa из исходников монорепо
 * против локального бэкенда в store/.
 *
 * Существует только потому, что родной dev-конфиг дашборда
 * (medusa-src/packages/admin/dashboard/vite.config.mts:29-32)
 * объявляет три define из шести, которые требует код дашборда
 * (medusa-src/packages/admin/dashboard/src/vite-env.d.ts:16-21).
 * Полный набор задаётся только в продовой сборке —
 * medusa-src/packages/admin/admin-bundler/src/utils/config.ts:61-71.
 *
 * Подробности — в README.md рядом.
 *
 * medusa-src/ не изменяется: конфиг живёт здесь, запускается
 * через `vite --config`, кэш пишется тоже сюда.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MONOREPO = path.resolve(HERE, "../../medusa-src")
const DASHBOARD = path.join(MONOREPO, "packages/admin/dashboard")

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, DASHBOARD)

  // Три значения ниже повторяют родной конфиг (vite.config.mts:10-13),
  // включая его дефолты.
  const BASE = env.VITE_MEDUSA_BASE || "/"
  const BACKEND_URL = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000"

  // Три недостающих. Имена переменных окружения — те же, что читает
  // admin-bundler (utils/config.ts:26-28), чтобы поведение совпадало.
  const AUTH_TYPE = process.env.ADMIN_AUTH_TYPE
  const JWT_TOKEN_STORAGE_KEY = process.env.ADMIN_JWT_TOKEN_STORAGE_KEY
  const MAX_UPLOAD_FILE_SIZE = 1024 * 1024

  // Проект, откуда подхватываются admin-расширения (родной конфиг, :18).
  const MEDUSA_PROJECT = env.VITE_MEDUSA_PROJECT || null
  const sources = MEDUSA_PROJECT ? [MEDUSA_PROJECT] : []

  return {
    root: DASHBOARD,
    // Кэш оптимизатора — в нашу папку, а не в medusa-src/.
    cacheDir: path.join(HERE, ".vite"),
    plugins: [inspect(), react(), inject({ sources })],
    define: {
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      // `?? / ||` в коде дашборда рассчитаны на настоящий undefined,
      // поэтому подставляем литерал, а не строку "undefined".
      __AUTH_TYPE__: AUTH_TYPE ? JSON.stringify(AUTH_TYPE) : "undefined",
      __JWT_TOKEN_STORAGE_KEY__: JWT_TOKEN_STORAGE_KEY
        ? JSON.stringify(JWT_TOKEN_STORAGE_KEY)
        : "undefined",
      __MAX_UPLOAD_FILE_SIZE__: JSON.stringify(MAX_UPLOAD_FILE_SIZE),
    },
    server: {
      open: true,
      fs: {
        // Исходники и зависимости лежат вне root.
        allow: [MONOREPO, HERE],
      },
    },
  }
})
