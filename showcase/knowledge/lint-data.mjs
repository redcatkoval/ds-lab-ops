// Числа для вкладки «Долг»: прогон линтера при сборке, снимок — запасной путь.
//
// Оболочка обязана быть либо свежей, либо честно старой. Поэтому дата
// и происхождение чисел возвращаются всегда, а не только при отказе,
// и показываются на экране (DEC-018: у числа записывается, чем оно
// получено; у наблюдения — дата).
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DS_OPS = path.resolve(HERE, "../..")
// Путь к дереву дашборда тоже переопределяется окружением — по той же
// причине, что и python3 ниже: иначе запасной путь нечем проверить.
const DASHBOARD_SRC =
  process.env.DS_LAB_DASHBOARD_SRC ??
  path.resolve(DS_OPS, "../medusa-src/packages/admin/dashboard/src")
const SNAPSHOT = path.join(HERE, "lint-snapshot.json")

// Двоичное имя вынесено в переменную окружения ради негативных прогонов:
// DS_LAB_PYTHON=/нет/такого проверяет запасной путь, не ломая систему.
const PYTHON = process.env.DS_LAB_PYTHON ?? "python3"

const сегодня = () => new Date().toISOString().slice(0, 10)

export function собратьЧисла() {
  try {
    if (!fs.existsSync(DASHBOARD_SRC)) {
      throw new Error(`нет дерева дашборда: ${DASHBOARD_SRC}`)
    }
    const вывод = execFileSync(
      PYTHON,
      [path.join(DS_OPS, "tools/lint/lint.py"), "--json", "--root", DASHBOARD_SRC],
      { encoding: "utf8", cwd: DS_OPS, stdio: ["ignore", "pipe", "pipe"] }
    )
    const данные = JSON.parse(вывод)
    const снимок = { снят: сегодня(), данные }
    fs.writeFileSync(SNAPSHOT, JSON.stringify(снимок, null, 2) + "\n", "utf8")
    return { источник: "прогон", снят: снимок.снят, данные, почему: null }
  } catch (е) {
    const причина = е instanceof Error ? е.message : String(е)
    if (!fs.existsSync(SNAPSHOT)) {
      return { источник: "нет данных", снят: null, данные: null, почему: причина }
    }
    const снимок = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"))
    return {
      источник: "снимок",
      снят: снимок.снят,
      данные: снимок.данные,
      почему: причина,
    }
  }
}
