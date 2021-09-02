package schema

TooltipDisplayMode: "single" | "multi" | "none" @cuetsy(kind="enum")

TooltipExtension: "date-offset" | "delta-numeric" | "delta-percent" | "delta-trend" @cuetsy(kind="enum")

VizTooltipOptions: {
	mode: TooltipDisplayMode
  extensions?: [TooltipExtension]
	dateFormat?: string
} @cuetsy(kind="interface")
