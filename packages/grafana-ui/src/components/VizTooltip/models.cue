package grafanaschema

TooltipDisplayMode: "single" | "multi" | "none" @cuetsy(targetType="enum")

TooltipExtension: "date-offset" | "delta-numeric" | "delta-percent" | "delta-trend" @cuetsy(kind="enum")

VizTooltipOptions: {
	mode: TooltipDisplayMode
  extensions?: [TooltipExtension]
	dateFormat?: string
} @cuetsy(targetType="interface")
