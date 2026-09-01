# common/action-menu — факты

Источник: `medusa-src/packages/admin/dashboard/src/components/common/action-menu/`
Дата замера: 2026-09-01. Только измеренное, без оценок.

Далее пути внутри дашборда даны от
`medusa-src/packages/admin/dashboard/src/`.

## Файлы компонента

Два файла, 126 строк.

| файл | строк | содержимое |
|---|---:|---|
| `components/common/action-menu/action-menu.tsx` | 125 | типы `Action`, `ActionGroup`, `ActionMenuProps`; компонент `ActionMenu` |
| `components/common/action-menu/index.ts` | 1 | `export * from "./action-menu"` |

Ни сторибука, ни теста, ни файла стилей в директории нет.

## Props

Компонент принимает три props (`action-menu.tsx:32-35`):

| prop | тип | обязателен | умолчание |
|---|---|---|---|
| `groups` | `ActionGroup[]` | да | нет |
| `variant` | `"transparent" \| "primary"` | нет | `"transparent"` (`:39`) |
| `children` | `ReactNode` (через `PropsWithChildren`) | нет | нет |

`ActionGroup` (`:28-30`) — объект с единственным полем:

```
actions: Action[]
```

Поля заголовка, метки или вложенных групп у `ActionGroup` нет.

`Action` (`:9-26`) — пересечение общей части и размеченного объединения:

| поле | тип | обязательно |
|---|---|---|
| `icon` | `ReactNode` | да (`:10`) |
| `label` | `string` | да (`:11`) |
| `disabled` | `boolean` | нет (`:12`) |
| `disabledTooltip` | `string \| ReactNode` | нет (`:16`) |

Плюс объединение (`:17-26`), взаимоисключающее:

- `to: string` и `onClick?: never` (`:18-21`), либо
- `onClick: () => void` и `to?: never` (`:22-25`)

Поля, помечающего действие как опасное или разрушающее, в типе `Action`
нет. Поля порядка, группы, горячей клавиши, описания — тоже нет.

## Варианты и состояния в коде

**Варианты триггера — два.**

1. Умолчание (`:43-47`): `IconButton` с `size="small"`, `variant={variant}`
   и иконкой `EllipsisHorizontal`.
2. Переданный `children` (`:43`): подставляется вместо `IconButton`
   целиком, через `DropdownMenu.Trigger asChild` (`:51`).

`variant` передаётся только в `IconButton` (`:44`). Когда передан
`children`, `IconButton` не отрисовывается, и `variant` ни на что
не влияет.

**Состояния пункта — два.**

1. Обычное: `[&_svg]:text-ui-fg-subtle` (`:85`, `:102`).
2. `disabled`: пробрасывается в `DropdownMenu.Item disabled`
   (`:79`, `:108`) и добавляет `[&_svg]:text-ui-fg-disabled`
   (`:87`, `:104`).

**Две ветки отрисовки пункта**, по наличию `onClick` (`:75`):

- с `onClick` (`:76-95`): `DropdownMenu.Item` с обработчиком, внутри
  которого сначала `e.stopPropagation()` (`:81`), затем `action.onClick()`
  (`:82`).
- иначе (`:98-116`): `DropdownMenu.Item asChild` (`:107`), внутрь
  вложен `Link to={action.to}` с `onClick={(e) => e.stopPropagation()}`
  (`:110`).

**Обёртка подсказки** (`:63-73`): если у действия есть
`disabledTooltip`, пункт оборачивается в `ConditionalTooltip` с
`showTooltip={action.disabled}`, `content={action.disabledTooltip}`,
`side="right"`, и внутри — дополнительный `div` (`:70`). Если
`disabledTooltip` нет, обёртка — строка `"div"` (`:73`).

**Пустая группа** (`:54-56`): если `group.actions.length` равно нулю,
группа возвращает `null`.

**Разделитель** (`:118`): `DropdownMenu.Separator` ставится после каждой
группы, кроме последней (`isLast`, `:58`). Props для управления
разделителем нет — он производен от числа групп.

**Направление письма** (`:42`, `:50`): `dir` берётся из хука
`useDocumentDirection()` и передаётся в `DropdownMenu`.

**Ключи** (`:61`, `:77`, `:99`) — индекс массива.

**Вложенность.** `ActionGroup.actions` имеет тип `Action[]`, а `Action`
не содержит поля с вложенными действиями (`:9-30`). Подменю средствами
этого компонента не выражается.

## Из чего собран

Из `@medusajs/ui` (`:1`) — три импорта, пять составных частей:

| импорт | где | вхождений |
|---|---|---:|
| `DropdownMenu` | `:50` | 1 |
| `DropdownMenu.Trigger` | `:51` | 1 |
| `DropdownMenu.Content` | `:52` | 1 |
| `DropdownMenu.Group` | `:61` | 1 |
| `DropdownMenu.Item` | `:78`, `:100` | 2 |
| `DropdownMenu.Separator` | `:118` | 1 |
| `IconButton` | `:44` | 1 |
| `clx` | `:84`, `:101` | 2 |

Остальные зависимости:

| источник | что | строка |
|---|---|---|
| `@medusajs/icons` | `EllipsisHorizontal` | `:3`, использован `:45` |
| `react` | `PropsWithChildren`, `ReactNode` | `:4` |
| `react-router-dom` | `Link` | `:5`, использован `:110` |
| `../conditional-tooltip` | `ConditionalTooltip` | `:6`, использован `:65` |
| `../../../hooks/use-document-direction` | `useDocumentDirection` | `:7`, использован `:42` |

`ConditionalTooltip` — локальный компонент
(`components/common/conditional-tooltip/`), не из `@medusajs/ui`.

## Отступы, радиусы, цвета литералами

**Отступы — два вхождения, оба одинаковые:** `gap-x-2` на `:85` и `:102`.
Больше классов отступа в файле нет.

**Радиусы — ни одного.** Ни именованной ступени, ни значения в скобках.

**Цвета литералами — ни одного.** Ни hex, ни `rgb()`, ни классов
встроенной палитры Tailwind. Цвет задаётся только токенами
дизайн-системы: `text-ui-fg-subtle` (`:85`, `:102`) и
`text-ui-fg-disabled` (`:87`, `:104`).

**Произвольные значения — четыре**, все одного вида: вариант `[&_svg]:`
на `:85`, `:87`, `:102`, `:104`.

Сверка: `ds-ops/tokens/literals.json` по этому файлу содержит ровно две
записи — `gap-x-2` на строках 85 и 102.

## Как его вызывают

**Потребителей — 104 файла, 115 вхождений тега `<ActionMenu`.**
Считано обходом `.tsx` по всему `dashboard/src/`; сам
`action-menu.tsx` из счёта исключён. Файлов, упоминающих имя `ActionMenu`
без тега, нет; сторибуков и тестов среди потребителей нет.

Из 115 вхождений полностью разобрано 105. Оставшиеся 10 перечислены
ниже отдельно.

### Какие props передают

| prop | вхождений | доля |
|---|---:|---:|
| `groups` явным атрибутом | 114 | 115 из 115 с учётом спреда |
| `groups` через спред `{...actionMenu}` | 1 | `components/data-table/data-table.tsx:433` |
| `variant` | 1 | `components/data-table/data-table.tsx:433`, значение `"primary"` |
| `children` | 1 | `routes/orders/order-detail/components/order-summary-section/order-summary-section.tsx:212` |

`groups` передают в 115 случаях из 115. `variant` и `children` — по
одному разу каждый, в разных файлах. Значение `"transparent"` явно
не передаёт никто.

Единственный `children` (`order-summary-section.tsx:212-243`) — это
`<Button variant="secondary" size="small">` вместо `IconButton`
по умолчанию.

### Сколько пунктов в меню

По 105 разобранным вхождениям.

| пунктов | вхождений |
|---:|---:|
| 0 | 1 |
| 1 | 45 |
| 2 | 36 |
| 3 | 20 |
| 4 | 3 |

Минимум — 0, максимум — 4, медиана — 2, чаще всего — 1 (45 из 105).
Пункты, добавляемые условным спредом, здесь посчитаны как присутствующие.
Без них распределение: 0 — 1, 1 — 45, 2 — 49, 3 — 7, 4 — 3; медиана та же.

Ноль пунктов — `groups={[]}` в
`routes/products/product-create/components/product-create-details-form/components/product-create-details-media-section/product-create-details-media-section.tsx:303`.

Всего действий в разобранных вхождениях — 189.

| поле действия | вхождений |
|---|---:|
| `to` | 100 |
| `onClick` | 89 |
| `disabled` | 18 |
| `disabledTooltip` | 3 |

Действий без `to` и без `onClick` — ноль. `disabledTooltip` встречается
в двух файлах: `routes/sales-channels/sales-channel-list/components/sales-channel-list-table-actions.tsx:52`
и `routes/policies/policy-detail/components/policy-general-section/policy-general-section.tsx:64` (дважды).

Иконки действий, топ: `PencilSquare` 71, `Trash` 60, `GlobeEurope` 11,
`XCircle` 10, `ArrowPath` 5, `Plus` 5.
Метки, топ: `actions.edit` 64, `actions.delete` 51, `actions.remove` 15,
`translations.actions.manage` 11.

### Группы и разделители

Групп во всех разобранных вхождениях — 172.

| групп в вызове | вхождений (без условных) | вхождений (с условными) |
|---:|---:|---:|
| 0 | 1 | 1 |
| 1 | 51 | 50 |
| 2 | 51 | 40 |
| 3 | 2 | 14 |

Размер группы: 159 групп из 172 состоят ровно из одного действия,
9 — из двух, 4 — из трёх.

Разделитель ставит сам компонент между группами (`action-menu.tsx:118`).
Из 105 разобранных вхождений 53 всегда дают две и более групп, то есть
хотя бы один разделитель; 1 даёт вторую группу только при выполнении
условия; 51 всегда обходится одной группой и разделителя не даёт.

Условные группы — через спред `...(условие ? [{...}] : [])` — встречаются
в 13 вхождениях из 105.

### Вложенные группы

Ни одного. Тип `ActionGroup` вложенности не выражает (`action-menu.tsx:28-30`),
и ни одно из 115 вхождений вложенной структуры не передаёт.

### Опасные действия

Поля для разметки опасного действия в типе `Action` нет. Отличить их
можно только по иконке и метке.

Действий с иконкой `Trash`, `XCircle` или `XMark` — 70 из 189.
Действий с меткой `actions.delete`, `actions.remove` или
`actions.cancel` — 68. Совпадают оба признака у 68; ещё у 2 совпадает
только иконка; случаев, где совпадает только метка, нет.

Разбивка: иконка `Trash` 60, `XCircle` 10; метка `actions.delete` 51,
`actions.remove` 15, `actions.cancel` 2.

Хотя бы одно такое действие есть в 69 вхождениях из 105.

**Все 70 лежат в последней группе вызова.** Вхождений, где действие
с этими признаками стоит не в последней группе, — ноль.

## Чего этот способ не видит

**10 вхождений из 115 разобраны не полностью** — состав меню в них
собирается в рантайме:

| вид | файл и строка |
|---|---|
| `groups` — переменная | `components/common/file-preview/file-preview.tsx:47` |
| `groups` — переменная | `routes/customers/customer-detail/components/customer-general-section/customer-general-section.tsx:108` |
| `groups` — переменная | `routes/locations/location-detail/components/location-general-section/location-general-section.tsx:564` |
| `groups` — переменная | `routes/roles/role-detail/components/role-general-section/role-general-section.tsx:129` |
| `groups` через спред пропсов | `components/data-table/data-table.tsx:433` |
| `actions` — переменная внутри литерала | `routes/api-key-management/api-key-management-detail/components/api-key-general-section/api-key-general-section.tsx:134` |
| `actions` — переменная внутри литерала | `routes/customers/customer-detail/components/customer-group-section/customer-group-section.tsx:233` |
| `actions` — переменная внутри литерала | `routes/customers/customer-list/components/customer-list-table/customer-list-table-actions.tsx:34` |
| `actions` — переменная внутри литерала | `routes/promotions/promotion-detail/components/campaign-section/campaign-section.tsx:67` |
| `actions` собирается `.map()` | `routes/orders/order-detail/components/order-summary-section/order-summary-section.tsx:212` |

Числа разделов «Сколько пунктов», «Группы и разделители» и «Опасные
действия» посчитаны по 105 вхождениям, не по 115. Разделы «Какие props
передают» и «Вложенные группы» — по всем 115.

**Условные пункты внутри одного вызова** дают разное меню при разных
условиях. В таблице пунктов такие посчитаны как присутствующие; вариант
без них приведён рядом.

**Опасность действия** определена по иконке и метке, потому что в типе
`Action` признака для неё нет. Действие, названное иначе, этим способом
не опознаётся.

**Литералы вне строк** — значения, собранные в рантайме или переданные
пропом, в разделе про отступы и цвета не искались.
