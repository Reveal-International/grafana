package grafanaschema

LegendPlacement: "bottom" | "right" @cuetsy(targetType="type")
LegendDisplayMode: "list" | "table" | "hidden" @cuetsy(targetType="enum")

VizLegendOptions: {
    displayMode: LegendDisplayMode
    placement: LegendPlacement
    dateFormat?:  string
    calcs: [...string]
} @cuetsy(targetType="interface")

// TODO this excludes all the types that include function definitions
