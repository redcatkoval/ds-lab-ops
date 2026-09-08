/** Числа линтера, собранные в main.ts при поднятии конфига. */
declare module "virtual:ds-lab/lint" {
  const данные: {
    источник: "прогон" | "снимок" | "нет данных"
    снят: string | null
    почему: string | null
    данные: {
      вхождений_живых: number
      закомментировано: number
      нарушений_всего: number
      новых: number
      замороженных: number
      под_исключением: number
      не_проверено: number
      baseline_устарел: number
      статус_контракта: string
      правила: { id: string; раздел: string; исключение: string | null }[]
      замороженные: { file: string; line: number; detail: string }[]
      исключение: { file: string; line: number; why: string }[]
    } | null
  }
  export default данные
}

/** Размеры и даты замеров файлов-измерений, снятые со стороны Node. */
declare module "virtual:ds-lab/files" {
  type Каталог = Record<string, number>
  type Даты = Record<string, { замер: string | null; о: string | null }>
  const о: { размеры: { map: Каталог; tokens: Каталог }; даты: { map: Даты; tokens: Даты } }
  export default о
}

/** Поля разметки вопросов и решений — DEC-020 и DEC-022. */
declare module "virtual:ds-lab/corpus" {
  type Запись = {
    код: string
    файл: string
    заголовок: string
    состояние: string | null
    адресат: string | null
    предмет: string | null
    дата: string | null
  }
  const корпус: { вопросы: Запись[]; решения: Запись[] }
  export default корпус
}
