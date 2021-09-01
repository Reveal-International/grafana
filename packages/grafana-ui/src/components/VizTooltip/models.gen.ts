//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// NOTE: This file will be auto generated from models.cue
// It is currenty hand written but will serve as the target for cuetsy
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @public
 */
export enum TooltipDisplayMode {
  Single = 'single',
  Multi = 'multi',
  None = 'none',
}

/**
 * @public
 */
export enum TooltipExtension {
  DateOffset = 'date-offset',
  DeltaNumeric = 'delta-numeric',
  DeltaPercent = 'delta-percent',
  DeltaTrend = 'delta-trend',
}

/**
 * @public
 */
export type VizTooltipOptions = {
  mode: TooltipDisplayMode;
  extensions?: TooltipExtension[];
  dateFormat?: string;
};
