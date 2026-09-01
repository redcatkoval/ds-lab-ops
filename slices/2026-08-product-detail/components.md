# Компоненты экрана

Источник: `ds-ops/map/screens-products.json`, экран `product-detail`,
срез `transitive` — обход по 20 модулям раздела, начиная с файла экрана
`routes/products/product-detail/product-detail.tsx`.

Колонка «файлов» — из общих карт: сколько файлов `dashboard/src`
импортируют компонент, по `ds-ops/map/components.json` для системных
и `ds-ops/map/local-components.json` для локальных. Это число по всему
дашборду, не по этому экрану.

| компонент | слой | файлов | статус |
|---|---|---:|---|
| heading | системный | 238 | нет контракта |
| button | системный | 206 | нет контракта |
| text | системный | 176 | нет контракта |
| container | системный | 130 | нет контракта |
| common/action-menu | локальный | 103 | нет контракта |
| layout-composer | локальный | 80 | нет контракта |
| tooltip | системный | 69 | нет контракта |
| badge | системный | 49 | нет контракта |
| common/skeleton | локальный | 45 | нет контракта |
| checkbox | системный | 44 | нет контракта |
| data-table | локальный | 30 | нет контракта |
| status-badge | системный | 23 | нет контракта |
| common/thumbnail | локальный | 20 | нет контракта |
| common/section | локальный | 12 | нет контракта |
| command-bar | системный | 7 | нет контракта |

Всего 15: девять системных, шесть локальных.

## Что в таблицу не вошло

С того же экрана импортируются семь имён из `@medusajs/ui`, которые
не являются компонентами из `ui/src/components/`: `DataTableAction`,
`clx`, `createDataTableColumnHelper`, `createDataTableCommandHelper`,
`createDataTableFilterHelper`, `toast`, `usePrompt`. Они в
`screens-products.json` в поле `ui_non_component_symbols`.

Компоненты, собранные внутри самого раздела
(`routes/products/product-detail/components/`), в таблице не значатся:
они не принадлежат ни системному, ни локальному слою. Их 20 модулей —
это и есть обойдённые файлы.

---

# Компоненты самого раздела

`routes/products/product-detail/components/` — восемь секций, из которых
собран экран. Ни в системный, ни в локальный слой они не входят и в
общих картах не считались, но экран собран в основном из них.

Раздел целиком — 21 файл, из них 16 приходится на эти восемь секций
(по два файла у каждой: `index.ts` и реализация).

| секция | своих файлов | импортирующих файлов раздела | системных | локальных |
|---|---:|---:|---:|---:|
| product-media-section | 2 | 1 | 7 | 1 |
| product-organization-section | 2 | 1 | 4 | 2 |
| product-sales-channel-section | 2 | 1 | 4 | 1 |
| product-general-section | 2 | 1 | 3 | 2 |
| product-option-section | 2 | 1 | 3 | 2 |
| product-variant-section | 2 | 1 | 3 | 2 |
| product-attribute-section | 2 | 1 | 2 | 2 |
| product-shipping-profile-section | 2 | 1 | 2 | 1 |

«Импортирующих файлов раздела» у всех восьми равно единице: каждую
секцию импортирует только `product-detail.tsx`. Колонки «системных» и
«локальных» — сколько разных компонентов каждого слоя использует сама
секция.

## Из чего состоит каждая секция

| секция | системные | локальные |
|---|---|---|
| product-media-section | button, checkbox, command-bar, container, heading, text, tooltip | common/action-menu |
| product-organization-section | badge, container, heading, tooltip | common/action-menu, common/section |
| product-sales-channel-section | container, heading, text, tooltip | common/action-menu |
| product-general-section | container, heading, status-badge | common/action-menu, common/section |
| product-option-section | badge, container, heading | common/action-menu, common/section |
| product-variant-section | badge, container, tooltip | common/thumbnail, data-table |
| product-attribute-section | container, heading | common/action-menu, common/section |
| product-shipping-profile-section | container, heading | common/action-menu |

`container` используют все восемь секций, `heading` — семь,
`common/action-menu` — семь, `tooltip` — четыре, `common/section` — четыре.
