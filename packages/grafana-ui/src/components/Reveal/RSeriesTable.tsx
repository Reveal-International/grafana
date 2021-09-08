import React from 'react';
import { GrafanaTheme2, GraphSeriesValue } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { SeriesIcon } from '../VizLegend/SeriesIcon';
import { useStyles2 } from '../../themes';

/**
 * @public
 */
export interface RSeriesTableRowProps {
  color?: string;
  label1?: string;
  label2?: string;
  value?: string | GraphSeriesValue;
  value1?: string | GraphSeriesValue;
  value2?: string | GraphSeriesValue;
  img?: React.ReactNode;
  isActive?: boolean;
}

const getSeriesTableRowStyles = (theme: GrafanaTheme2) => {
  return {
    icon: css`
      margin-right: ${theme.spacing(1)};
      vertical-align: middle;
    `,
    img: css`
      margin-left: ${theme.spacing(1)};
      vertical-align: middle;
    `,
    seriesTable: css`
      display: table;
    `,
    seriesTableRow: css`
      display: table-row;
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    seriesTableCell: css`
      display: table-cell;
    `,
    label1: css`
      word-break: break-all;
    `,
    label2: css`
      padding-left: ${theme.spacing(1)};
      word-break: break-all;
    `,
    value: css`
      padding-left: ${theme.spacing(1)};
    `,
    value2: css`
      padding-left: ${theme.spacing(1)};
    `,
    value3: css`
      padding-left: ${theme.spacing(1)};
    `,
    activeSeries: css`
      font-weight: ${theme.typography.fontWeightBold};
      color: ${theme.colors.text.maxContrast};
    `,
    title: css`
      font-weight: ${theme.typography.fontWeightBold};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
  };
};

/**
 * @public
 */
export const RSeriesTableRow: React.FC<RSeriesTableRowProps> = ({
  color,
  label1,
  label2,
  value,
  value1,
  value2,
  img,
  isActive,
}) => {
  const styles = useStyles2(getSeriesTableRowStyles);

  return (
    <div className={cx(styles.seriesTableRow, isActive && styles.activeSeries)}>
      {color && (
        <div className={styles.seriesTableCell}>
          <SeriesIcon color={color} className={styles.icon} />
        </div>
      )}
      {label1 && <div className={cx(styles.seriesTableCell, styles.label1)}>{label1}</div>}
      {label2 && <div className={cx(styles.seriesTableCell, styles.label2)}>{label2}</div>}
      {value && <div className={cx(styles.seriesTableCell, styles.value)}>{value}</div>}
      {value1 && <div className={cx(styles.seriesTableCell, styles.value2)}>{value1}</div>}
      {value2 && <div className={cx(styles.seriesTableCell, styles.value3)}>{value2}</div>}
      {img && <div className={cx(styles.seriesTableCell, styles.img)}>{img}</div>}
    </div>
  );
};

/**
 * @public
 */
export interface RSeriesTableProps {
  title?: string | GraphSeriesValue | React.ReactNode;
  series: RSeriesTableRowProps[];
}

/**
 * @public
 */
export const RSeriesTable: React.FC<RSeriesTableProps> = ({ title, series }) => {
  const styles = useStyles2(getSeriesTableRowStyles);

  return (
    <>
      {title && (
        <div className={styles.title} aria-label="Title">
          {title}
        </div>
      )}
      {series.map((s, i) => {
        return (
          <RSeriesTableRow
            isActive={s.isActive}
            label1={s.label1}
            label2={s.label2}
            color={s.color}
            value={s.value}
            value1={s.value1}
            value2={s.value2}
            img={s.img}
            key={`${i}`}
          />
        );
      })}
    </>
  );
};
