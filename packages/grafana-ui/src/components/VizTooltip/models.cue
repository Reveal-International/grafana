package grafanaschema

TooltipDisplayMode: "single" | "multi" | "none" @cuetsy(targetType="enum")

VizTooltipOptions: {
	mode: TooltipDisplayMode
	timeOffsetFormat?: string
} @cuetsy(targetType="interface")
