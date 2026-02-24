// lib/pm-import/index.ts
// Public entry point — exports all adapters and types for the PM import system.

export { BasecampAdapter }  from "./adapters/basecamp"
export { AsanaAdapter }     from "./adapters/asana"
export { ClickupAdapter }   from "./adapters/clickup"
export { MondayAdapter }    from "./adapters/monday"
export { TrelloAdapter }    from "./adapters/trello"
export { CsvAdapter, parsePmCsv } from "./adapters/csv"
export * from "./types"

import { BasecampAdapter } from "./adapters/basecamp"
import { AsanaAdapter }    from "./adapters/asana"
import { ClickupAdapter }  from "./adapters/clickup"
import { MondayAdapter }   from "./adapters/monday"
import { TrelloAdapter }   from "./adapters/trello"
import { CsvAdapter }      from "./adapters/csv"
import type { PmPlatform, TaskImportAdapter } from "./types"

export const ADAPTER_REGISTRY: Record<PmPlatform, TaskImportAdapter> = {
  basecamp: BasecampAdapter,
  asana:    AsanaAdapter,
  clickup:  ClickupAdapter,
  monday:   MondayAdapter,
  trello:   TrelloAdapter,
  csv:      CsvAdapter,
}
