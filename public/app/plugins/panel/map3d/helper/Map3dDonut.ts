import { Series, formatNumber } from '../utils';
import { config } from '@grafana/runtime';

function getColors(): string[] {
  const isDarkMode = config.theme.isDark;
  if (isDarkMode) {
    return ['#2b908f', '#90ee7e', '#f45b5b'];
  }
  // Otherwise return light colors
  return ['#058DC7', '#64E572', '#ED561B'];
}

// Creates an SVG donut chart from series
export function createDonutChart(series: Series) {
  var offsets = [0];
  var total = series.totalValue;

  // Set the offset values that will be used to create the donut arcs
  // Goes from 0 to next value until just 1 value before the end
  const aggregatedSeriesValues: number[] = series.getAggregatedSeriesValues();
  for (var i = 0; i < aggregatedSeriesValues.length - 1; i++) {
    offsets.push(offsets[i] + aggregatedSeriesValues[i]);
  }

  // TODO find a way to adjust these values more accordingly
  var fontSize = 16;
  var r = 32;

  var r0 = Math.round(r * 0.6);
  var w = r * 2;

  var html =
    '<div><svg width="' +
    w +
    '" height="' +
    w +
    '" viewbox="0 0 ' +
    w +
    ' ' +
    w +
    '" text-anchor="middle" style="font: ' +
    fontSize +
    'px sans-serif; display: block">';

  const colors: string[] = getColors();

  for (i = 0; i < aggregatedSeriesValues.length; i++) {
    html += donutSegment(offsets[i] / total, (offsets[i] + aggregatedSeriesValues[i]) / total, r, r0, colors[i]);
  }

  const totalShortFormat = formatNumber(total, { notation: 'compact', compactDisplay: 'short' });
  html +=
    '<circle cx="' +
    r +
    '" cy="' +
    r +
    '" r="' +
    r0 +
    '" fill="white" /><text dominant-baseline="central" transform="translate(' +
    r +
    ', ' +
    r +
    ')">' +
    totalShortFormat +
    '</text></svg></div>';

  let el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild;
}

/**
 * Creates an outline segment of a circle (an arc of the donut)
 */
const donutSegment = (start: any, end: any, r: any, r0: any, color: any) => {
  if (end - start === 1) {
    end -= 0.00001;
  }
  var a0 = 2 * Math.PI * (start - 0.25);
  var a1 = 2 * Math.PI * (end - 0.25);
  var x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  var x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  var largeArc = end - start > 0.5 ? 1 : 0;

  return [
    '<path d="M',
    r + r0 * x0,
    r + r0 * y0,
    'L',
    r + r * x0,
    r + r * y0,
    'A',
    r,
    r,
    0,
    largeArc,
    1,
    r + r * x1,
    r + r * y1,
    'L',
    r + r0 * x1,
    r + r0 * y1,
    'A',
    r0,
    r0,
    0,
    largeArc,
    0,
    r + r0 * x0,
    r + r0 * y0,
    '" fill="' + color + '" />',
  ].join(' ');
};
