# ds-ops/dev — запуск админки из исходников

Запускает `medusa-src/packages/admin/dashboard/` в dev-режиме против
работающего локального бэкенда `store/` (порт 9000).

```bash
cd /Users/pavelkoval/Documents/Projects/DS-LAB/medusa-src/packages/admin/dashboard
../../../node_modules/.bin/vite \
  --config /Users/pavelkoval/Documents/Projects/DS-LAB/ds-ops/dev/vite.config.mts \
  --port 5173 --strictPort
```

Две вещи в этой команде обязательны, обе проверены на практике.

**Запускать из папки дашборда.** `dashboard/postcss.config.cjs:3` подключает
`tailwindcss: {}` без пути к конфигу, поэтому Tailwind ищет
`tailwind.config.cjs` от текущего каталога, а `content` в нём задан
относительными путями (`dashboard/tailwind.config.cjs:13`). Из другого
каталога конфиг не находится, `content` оказывается пустым, и сборка
падает на `The 'bg-ui-bg-subtle' class does not exist`. Значение `root`
в нашем конфиге на это не влияет — Tailwind про Vite ничего не знает.

**Звать бинарник напрямую**, как это делает родной скрипт
`dashboard/package.json:8`. `corepack yarn vite` из папки пакета не
сработает: yarn ищет скрипт с именем `vite`, а в `package.json` пакета
такого скрипта нет.

Порт строго 5173: `store/apps/backend/.env:3-4` разрешает в `ADMIN_CORS`
и `AUTH_CORS` именно этот origin. На 5174 логин не пройдёт, поэтому
`--strictPort` — чтобы Vite падал, а не переезжал молча.

## Зачем это вообще

Родной конфиг дашборда нельзя запустить как есть — приложение падает
на белой странице:

```
ReferenceError: __AUTH_TYPE__ is not defined
    at src/lib/client/client.ts:3:18
```

Дашборд ждёт шесть глобальных констант — `medusa-src/packages/admin/dashboard/src/vite-env.d.ts:16-21`:

| Токен | Где используется |
|---|---|
| `__BACKEND_URL__` | `src/lib/client/client.ts:3`, `src/lib/query-client.ts:3` |
| `__STOREFRONT_URL__` | `src/lib/storefront.ts:2` |
| `__BASE__` | `src/dashboard-app/dashboard-app.tsx:581`, `src/components/data-table/data-table.tsx:311` |
| `__AUTH_TYPE__` | `src/lib/client/client.ts:4` |
| `__JWT_TOKEN_STORAGE_KEY__` | `src/lib/client/client.ts:5` |
| `__MAX_UPLOAD_FILE_SIZE__` | `src/components/common/file-upload/file-upload.tsx:26` |

Родной dev-конфиг `medusa-src/packages/admin/dashboard/vite.config.mts:29-32`
объявляет из них только три: `__BASE__`, `__BACKEND_URL__`, `__STOREFRONT_URL__`.

Все шесть задаются лишь в продовой сборке админки —
`medusa-src/packages/admin/admin-bundler/src/utils/config.ts:61-71`. Она
собирает дашборд как зависимость внутри проекта Medusa, поэтому в самом
пакете дырка и не проявляется: разработчики монорепо запускают админку
через бэкенд, а не напрямую через `yarn dev`.

Важно, что в dev-режиме Vite не подставляет `define` текстом, а объявляет
их глобалями. Необъявленный токен поэтому не превращается в `undefined`,
а даёт `ReferenceError` при первом же импорте — до рендера. Отсюда белая
страница вместо частично рабочего интерфейса.

Наш конфиг повторяет три родных define с их дефолтами и добавляет три
недостающих.

## Значения недостающих трёх

Взяты так же, как их берёт admin-bundler (`utils/config.ts:26-28, 61-71`):

- `__AUTH_TYPE__` — из `ADMIN_AUTH_TYPE`, по умолчанию литерал `undefined`;
  код дашборда сам падает на `?? "session"` (`client.ts:4`).
- `__JWT_TOKEN_STORAGE_KEY__` — из `ADMIN_JWT_TOKEN_STORAGE_KEY`, по
  умолчанию литерал `undefined` (`client.ts:5` ждёт именно его).
- `__MAX_UPLOAD_FILE_SIZE__` — 1 МБ, как дефолт в `config.ts:67-70`.

Подставляется литерал `undefined`, а не строка `"undefined"`: операторы
`??` и `||` в коде дашборда рассчитаны на настоящее отсутствие значения.

## Почему рядом лежит symlink node_modules

`ds-ops/` вне монорепо, и выше него нет ни одного `node_modules`. Vite
грузит конфиг, вынося внешние импорты наружу и резолвя их относительно
папки самого конфига, так что `import ... from "vite"` отсюда не
находился бы. Symlink `node_modules -> ../../medusa-src/node_modules`
это чинит. Он в `.gitignore`, как и кэш `.vite/`.

Кэш оптимизатора зависимостей уводится в `ds-ops/dev/.vite` (`cacheDir`
в конфиге), чтобы Vite ничего не писал внутрь `medusa-src/`.

## Границы

`medusa-src/` и `store/` не изменяются. Обход целиком снаружи: конфиг,
кэш и symlink живут здесь. Проверка — `git status --short` в
`medusa-src/` должен оставаться пустым.

## Что сломается при обновлении монорепо

Конфиг дублирует три родных define вместе с их дефолтами. Если апстрим
поменяет `vite.config.mts:10-13` или добавит седьмой токен в
`vite-env.d.ts`, здесь нужно повторить руками — связи между файлами нет.
Симптом тот же: белая страница и `ReferenceError` в консоли.
