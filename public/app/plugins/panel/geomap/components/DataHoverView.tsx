import React, { PureComponent } from 'react';
import { stylesFactory } from '@grafana/ui';
import { DataFrame, Field, formattedValueToString, getFieldDisplayName, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { config } from 'app/core/config';

export type ToolTipRenderer = (
  data?: DataFrame,
  rowIndex?: number,
  columnIndex?: number,
  point?: Record<string, any>
) => React.ReactNode;

export interface Props {
  data?: DataFrame; // source data
  rowIndex?: number; // the hover row
  columnIndex?: number; // the hover column
  tooltipRender?: ToolTipRenderer;
  point?: Record<string, any>;
}

export class DataHoverView extends PureComponent<Props> {
  style = getStyles(config.theme2);

  render() {
    const { data, rowIndex, columnIndex, point } = this.props;
    if (!data || rowIndex == null) {
      return null;
    }

    // Optionally render using tooltip render
    if (this.props.tooltipRender) {
      return this.props.tooltipRender(data, rowIndex, columnIndex, point);
    }

    return (
      <table className={this.style.infoWrap}>
        <tbody>
          {data.fields.map((f, i) => (
            <tr key={`${i}/${rowIndex}`} className={i === columnIndex ? this.style.highlight : ''}>
              <th>{getFieldDisplayName(f, data)}:</th>
              <td>{fmt(f, rowIndex)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

function fmt(field: Field, row: number): string {
  const v = field.values.get(row);
  if (field.display) {
    return formattedValueToString(field.display(v));
  }
  return `${v}`;
}

const getStyles = stylesFactory((theme: GrafanaTheme2) => ({
  infoWrap: css`
    padding: 8px;
    th {
      font-weight: bold;
      padding: 2px 10px 2px 0px;
    }
  `,
  highlight: css`
    background: ${theme.colors.action.hover};
  `,
}));
