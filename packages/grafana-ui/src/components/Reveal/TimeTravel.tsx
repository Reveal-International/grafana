import React, { MouseEvent, useState } from 'react';
import { dateTime, DateTime, DurationUnit, SelectableValue } from '@grafana/data';
import { ButtonSelect } from '../Dropdown/ButtonSelect';
import { ButtonGroup, ToolbarButton } from '../Button';
import { useInterval } from 'react-use';

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
  { label: 'Off', value: '0' },
  { label: '250ms', value: '250' },
  { label: '500ms', value: '500' },
  { label: '750ms', value: '750' },
  { label: '1s', value: '1000' },
  { label: '2s', value: '2000' },
  { label: '5s', value: '5000' },
  { label: '10s', value: '10000' },
  { label: '30s', value: '30000' },
  { label: '1m', value: '60000' },
] as Array<SelectableValue<string>>;

export interface Props {
  getStartTime: () => DateTime;
  onUpdateTimeRange: (from: DateTime, to: DateTime) => void;
  maxHops?: number;
}

function applyTimeOffset(start: DateTime, timeOffset: string, subtract?: boolean): [DateTime, DateTime] {
  const parts = timeOffset.trim().match(/^(\d+)([s|m|h|d|w|M|y])$/);
  if (parts?.length === 3) {
    const amount = parseInt(parts[1], 10);
    const duration = parts[2] as DurationUnit;
    const from = subtract ? dateTime(start).subtract(amount, duration) : dateTime(start).add(amount, duration);
    const to = dateTime(from).add(amount, duration).subtract(1, 's');
    return [from, to];
  }
  return [start, start];
}

export function TimeTravel(props: Props) {
  const [hops, setHops] = useState(() => 0);
  const [timeHop, setTimeHop] = useState(() => '1h');
  const [refreshInterval, setRefreshInterval] = useState((): string => '1000');
  const [running, setRunning] = useState((): boolean => false);

  useInterval(
    () => {
      if (timeHop) {
        const maxHops = props.maxHops || 500; // need some sensible default
        const [from, to] = applyTimeOffset(props.getStartTime(), timeHop);
        setHops(hops + 1);
        // console.log('Set time range ' + from.toISOString() + ' to ' + to.toISOString());
        if (!from.isBefore(dateTime()) || hops > maxHops) {
          setRunning(false);
          setHops(0);
          return;
        }
        props.onUpdateTimeRange(from, to);
      }
    },
    running ? parseInt(refreshInterval, 10) : null
  );

  const onTimeHopChanged = (item: SelectableValue<string>) => {
    setTimeHop(item.value!);
  };

  const onStartStopClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setRunning(!running);
  };

  const onRefreshIntervalChanged = (item: SelectableValue<string>) => {
    setRefreshInterval(item.value!);
  };

  const onBack = () => {
    const [from, to] = applyTimeOffset(props.getStartTime(), timeHop, true);
    props.onUpdateTimeRange(from, to);
  };

  const onForward = () => {
    const [from, to] = applyTimeOffset(props.getStartTime(), timeHop);
    props.onUpdateTimeRange(from, to);
  };

  const selRefreshInterval = refreshIntervals.find(({ value }) => value === refreshInterval);
  const selTimeHop = timeHops.find(({ value }) => value === timeHop);
  const variant = 'default';
  return (
    <ButtonGroup className="refresh-picker">
      {!running && (
        <ToolbarButton tooltip={'Go back one time step (' + timeHop + ')'} variant={variant} icon={'arrow-left'} onClick={onBack} />
      )}
      {!running && (
        <ToolbarButton
          tooltip={'Go forward one time step (' + timeHop + ')'}
          variant={variant}
          icon={'arrow-right'}
          onClick={onForward}
        />
      )}
      <ToolbarButton
        tooltip={running ? 'Stop auto play' : 'Start auto play'}
        variant={variant}
        icon={running ? 'square' : 'play'}
        onClick={onStartStopClicked}
      />
      <ButtonSelect
        value={selRefreshInterval}
        title={'Refresh interval; when auto playing the dashboard will be updated once every interval'}
        options={refreshIntervals}
        onChange={onRefreshIntervalChanged}
        variant={variant}
      />
      <ButtonSelect
        value={selTimeHop}
        title={'Time step; when auto playing the dashboard date range will be shifted by this amount'}
        options={timeHops}
        onChange={onTimeHopChanged}
        variant={variant}
      />
    </ButtonGroup>
  );
}
