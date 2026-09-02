# Q-019. Разнобой меток у одинаковых действий

**Вопрос.** Одно и то же по сути действие названо в разных секциях
разными словами, а иногда одно слово записано разными ключами.
До 2026-09-02 это было почти незаметно: действия лежали в свёрнутых
меню, и рядом друг с другом не оказывались. После замены меню
на кнопки метки вышли на экран.

## Обстановка

Замер 2026-09-02 по всему `dashboard/src`. Действий с `to` в шапках
секций — 69, из них ведут на форму редактирования или добавления — 63.
**Различных меток — 15.** Шесть встречаются больше одного раза,
девять — по одному.

| ключ | строка | раз |
|---|---|---:|
| `actions.edit` | Edit | 25 |
| `actions.create` | Create | 16 |
| `general.add` | Add | 5 |
| `actions.add` | Add | 4 |
| `actions.editImages` | Edit images | 2 |
| `categories.organize.action` | Edit ranking | 2 |

## Семь пар

### 1. `actions.add` и `general.add` — разные ключи, строка одна

Обе дают `Add`. В шапках секций расходятся ровно по виду элемента,
9 из 9: пункт меню — `actions.add`, кнопка — `general.add`.

За пределами шапок правило не держится. По всему `dashboard/src`:

| ключ | пункт меню | кнопка |
|---|---:|---:|
| `actions.add` | 8 | 5 |
| `general.add` | 3 | 5 |

То есть 8 расхождений на 21 вхождение обоих ключей. Соглашение
существует в одном месте и не существует в остальных.

### 2. Добавление товаров — три секции, две формулировки

| секция | метка | строка |
|---|---|---|
| `category-product-section.tsx:114` | `actions.add` | Add |
| `collection-product-section.tsx:104` | `actions.add` | Add |
| `price-list-product-section.tsx:120` | `priceLists.products.actions.addProducts` | Add products |

Все три добавляют товары в раздел.

### 3. Редактирование цен — две секции, две формулировки

| секция | метка | строка | маршрут |
|---|---|---|---|
| `variant-prices-section.tsx:38` | `actions.edit` | Edit | `/products/…/variants/…/prices` |
| `price-list-product-section.tsx:125` | `priceLists.products.actions.editPrices` | Edit prices | `products/edit` |

Заголовок первой секции — `labels.prices`, то есть слово «цены»
на экране и так есть.

### 4. `Manage` — три формулировки

| место | метка | строка |
|---|---|---|
| `product-option-section.tsx:41` | `actions.manage` | Manage |
| `inventory-item-location-levels.tsx:18` | `inventory.manageLocations` | Manage locations |
| `variant-inventory-section.tsx:48` | `products.variant.inventory.manageItems` / `manageKit` | Manage inventory items / Manage inventory kit |

### 5. `order-customer-section` — метки существительными

Три пункта одного меню, все ведут на форму редактирования:

| метка | строка | маршрут |
|---|---|---|
| `addresses.shippingAddress.editLabel` | Shipping address | `shipping-address` |
| `addresses.billingAddress.editLabel` | Billing address | `billing-address` |
| `email.editLabel` | Email | `email` |

Ключи содержат `editLabel`, отображаемые строки слова «Edit»
не содержат. В остальных 25 случаях то же действие названо
`actions.edit` → `Edit`.

### 6. Изменение порядка

`categories.organize.action` → `Edit ranking`, 2 вхождения
(`category-organize-section.tsx:30`, `category-list-table.tsx:49`).
Иконка `PencilSquare` — та же, что у 25 вхождений `actions.edit`.

### 7. Одна иконка под четырьмя метками

`PencilSquare` в шапках секций стоит при `actions.edit`,
`actions.editImages`, `actions.manage` и `categories.organize.action`.
После замены меню на кнопки иконки сняты (DEC-015), и различать
эти действия теперь нечем, кроме самих слов.

## Что известно про «Edit»

Проверено 2026-09-02: в `en.json` строку ровно `Edit` дают три ключа —
`actions.edit` (79 вхождений в коде), `dataGrid.shortcuts.commands.edit`
(1, подпись горячей клавиши) и `permissions.actions.update` (0).
Ключа `general.edit` в словаре нет.

То есть у «Edit», в отличие от «Add», парного ключа не существует:
разнобой в паре 1 — свойство именно добавления.

## Почему это стало заметнее

Правилу о кнопке разнобой не мешает: правило 4.1 считает действия,
а не читает их метки. Линтер на него не реагирует и реагировать
не должен.

Но 2026-09-02 из шапок секций убрано 25 меню и поставлено 25 кнопок
(DEC-014, DEC-015). Метка, которая раньше открывалась по нажатию
на «⋯» и читалась по одной, теперь напечатана на кнопке и видна
всегда. На карточке товара рядом оказываются секции, где одно и то же
действие подписано `Edit`, `Edit images` и `Manage`.

Разнобой не создан правкой — он был. Правка сделала его видимым.

## Чего мы не делали

Ни одной метки не изменили. При заменах 2026-09-02 метка переносилась
из пункта меню на кнопку дословно, включая `actions.add` там, где
соседние кнопки в шапках используют `general.add`.

Выбор слов — предмет продуктового решения, не контракта на компонент.
Контракт `ActionMenu` о содержании меток не высказывается, и добавлять
такое правило в него не предлагается: слово зависит от того, что
делает действие, а это знает продукт.

**Кому адресован.** Продуктовой команде.

**Статус.** Открыт.

**Дата.** 2026-09-02
