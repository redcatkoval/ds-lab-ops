/// <reference types="vite/client" />
import { TooltipProvider } from "@medusajs/ui"
import { withThemeByClassName } from "@storybook/addon-themes"
import type { Decorator, Preview } from "@storybook/react"
import * as React from "react"
import { MemoryRouter } from "react-router-dom"

// Стили дашборда: @tailwind base/components/utilities и шрифты.
import "../../../medusa-src/packages/admin/dashboard/src/index.css"

/**
 * ActionMenu рендерит Link из react-router-dom
 * (action-menu.tsx:110) — без роутера истории со ссылками падают.
 */
const withRouter: Decorator = (Story) => (
  <MemoryRouter initialEntries={["/"]}>
    <Story />
  </MemoryRouter>
)

/**
 * disabledTooltip оборачивает пункт в ConditionalTooltip
 * (action-menu.tsx:63-73), а тот рендерит Tooltip из @medusajs/ui
 * (conditional-tooltip.tsx:16). Провайдер нужен на всё дерево.
 *
 * Провайдер — отдельный именованный экспорт TooltipProvider
 * (ui/src/components/tooltip/tooltip.tsx:124), а не Tooltip.Provider.
 */
const withTooltip: Decorator = (Story) => (
  <TooltipProvider>
    <Story />
  </TooltipProvider>
)

/**
 * Рамка вокруг истории. Два вида, оба задаются через parameters,
 * чтобы пометка стояла на самой истории, а не в её описании.
 *
 * violation — состояние, запрещённое контрактом.
 * gap — компонент не умеет того, что контракт требует.
 */
type Note = { section: string; text: string }

const withNotes: Decorator = (Story, ctx) => {
  const violation = ctx.parameters.violation as Note | undefined
  const gap = ctx.parameters.gap as Note | undefined

  const story = (
    <div className="flex justify-end">
      <Story />
    </div>
  )

  return (
    <div className="min-h-[240px] space-y-3 p-6">
      {violation && (
        <div className="border-ui-tag-red-border bg-ui-tag-red-bg rounded-lg border border-dashed p-4">
          <div className="text-ui-tag-red-text txt-compact-small-plus mb-1">
            ЗАПРЕЩЕНО КОНТРАКТОМ — раздел {violation.section}
          </div>
          <div className="text-ui-fg-subtle txt-small">{violation.text}</div>
          <div className="text-ui-fg-muted txt-compact-xsmall mt-1">
            ds-ops/contracts/action-menu.md
          </div>
        </div>
      )}
      {gap && (
        <div className="border-ui-tag-orange-border bg-ui-tag-orange-bg rounded-lg border border-dashed p-4">
          <div className="text-ui-tag-orange-text txt-compact-small-plus mb-1">
            РАЗРЫВ С КОНТРАКТОМ — раздел {gap.section}
          </div>
          <div className="text-ui-fg-subtle txt-small">{gap.text}</div>
          <div className="text-ui-fg-muted txt-compact-xsmall mt-1">
            контракт описывает целевое состояние, компонент этого пока не умеет
          </div>
        </div>
      )}
      {violation || gap ? (
        <div className="border-ui-border-base rounded-lg border p-4">{story}</div>
      ) : (
        story
      )}
    </div>
  )
}

export const decorators = [
  withNotes,
  withTooltip,
  withRouter,
  withThemeByClassName({
    themes: { Light: "", Dark: "dark" },
    defaultTheme: "Light",
  }),
]

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    layout: "fullscreen",
    options: {
      storySort: {
        order: ["ActionMenu", ["По контракту", "Враждебные данные", "Запрещено контрактом"]],
      },
    },
  },
}

export default preview
