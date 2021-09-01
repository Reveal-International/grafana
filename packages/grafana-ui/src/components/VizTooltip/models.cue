package grafanaschema

TooltipDisplayMode: "single" | "multi" | "none" @cuetsy(targetType="enum")

VizTooltipOptions: {
	mode: TooltipDisplayMode
	timeFormat?: string
} @cuetsy(targetType="interface")
