import React, { useCallback, useState } from 'react';
import { dateTime, DateTime, DurationUnit, SelectableValue } from '@grafana/data';
import { ButtonSelect } from '../Dropdown/ButtonSelect';
import { ButtonGroup, ToolbarButton, ToolbarButtonVariant } from '../Button';
import { useInterval } from 'react-use';
import { getTimeSrv } from '../../../../../public/app/features/dashboard/services/TimeSrv';

export const timeHops = [
  { label: '', value: '' },
  { label: '1m', value: '1m' },
  { label: '2m', value: '2m' },
  { label: '5m', value: '5m' },
  { label: '10m', value: '10m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '2hr', value: '2h' },
  { label: '3hr', value: '3h' },
  { label: '6hr', value: '6h' },
  { label: '12hr', value: '12h' },
  { label: '1d', value: '1d' },
  { label: '2d', value: '2d' },
  { label: '5d', value: '5d' },
  { label: '1w', value: '1w' },
  { label: '2w', value: '2w' },
  { label: '1M', value: '1M' },
] as Array<SelectableValue<string>>;

export const refreshIntervals = [
  { label: 'Off', value: '', icon: 'video' },
  { label: '1s', value: '1' },
  { label: '2s', value: '2' },
  { label: '5s', value: '5' },
  { label: '10s', value: '10' },
  { label: '30s', value: '30' },
  { label: '1m', value: '60' },
] as Array<SelectableValue<string>>;

export interface Props {
  onUpdateTimeRange: (from: number, to: number) => void;
  isLoading?: boolean;
  isLive?: boolean;
  width?: string;
  primary?: boolean;
  maxHops?: number;
}

function addTimeOffset(start: DateTime, timeOffset: string): [DateTime, DateTime] {
  const parts = timeOffset.trim().match(/^(\d+)([s|m|h|d|w|M|y])$/);
  if (parts?.length === 3) {
    const amount = parseInt(parts[1], 10);
    const duration = parts[2] as DurationUnit;
    const from = dateTime(start).add(amount, duration);
    const to = dateTime(from).add(amount, duration).subtract(1, 's');
    return [from, to];
  }
  return [start, start];
}

export function TimeTravel(props: Props) {
  const [hops, setHops] = useState(() => 0);
  const [timeHop, setTimeHop] = useState(() => '');
  const [refreshInterval, setRefreshInterval] = useState(() => '');

  useInterval(
    () => {
      if (timeHop) {
        const maxHops = props.maxHops || 2;
        const [from, to] = addTimeOffset(getTimeSrv().timeRange().from, timeHop);
        setHops(hops + 1);
        if (hops > maxHops) {
          setRefreshInterval('');
          setHops(0);
          return;
        }
        // TODO restrict number of hops..
        getTimeSrv().setTime(
          {
            from,
            to,
          },
          undefined,
          false
        );
      }
    },
    refreshInterval ? parseInt(refreshInterval, 10) * 1000 : null
  );

  const onTimeHopChanged = useCallback(
    (item: SelectableValue<string>) => {
      setTimeHop(item.value!);
    },
    [setTimeHop]
  );

  const onRefreshIntervalChanged = useCallback(
    (item: SelectableValue<string>) => {
      setRefreshInterval(item.value!);
    },
    [setRefreshInterval]
  );

  const getVariant = (): ToolbarButtonVariant => {
    if (props.isLive) {
      return 'primary';
    }
    if (props.isLoading) {
      return 'destructive';
    }
    if (props.primary) {
      return 'primary';
    }
    return 'default';
  };

  const currentRefreshInterval = refreshInterval || '';
  const currentTimeHop = timeHop || '';
  const variant = getVariant();
  const selRefreshInterval = refreshIntervals.find(({ value }) => value === currentRefreshInterval);
  const selTimeHop = timeHops.find(({ value }) => value === currentTimeHop);

  return (
    <ButtonGroup className="refresh-picker">
      <ToolbarButton tooltip={'TODO'} variant={variant} icon={'video'} />
      <ButtonSelect
        value={selRefreshInterval}
        options={refreshIntervals}
        onChange={onRefreshIntervalChanged}
        variant={variant}
      />
      <ButtonSelect value={selTimeHop} options={timeHops} onChange={onTimeHopChanged} variant={variant} />
    </ButtonGroup>
  );
}
