import React, { PureComponent } from 'react';
import { Input, TimeZonePicker, Field, Switch, CollapsableSection } from '@grafana/ui';
import { rangeUtil, TimeZone } from '@grafana/data';
import { isEmpty } from 'lodash';
import { selectors } from '@grafana/e2e-selectors';
import { AutoRefreshIntervals } from './AutoRefreshIntervals';

interface Props {
  onTimeZoneChange: (timeZone: TimeZone) => void;
  onRefreshIntervalChange: (interval: string[]) => void;
  onNowDelayChange: (nowDelay: string) => void;
  onHideTimePickerChange: (hide: boolean) => void;
  onTimeTravelVisibleChange: (visible: boolean) => void;
  refreshIntervals: string[];
  timePickerHidden: boolean;
  timeTravelVisible: boolean;
  nowDelay: string;
  timezone: TimeZone;
}

interface State {
  isNowDelayValid: boolean;
}

export class TimePickerSettings extends PureComponent<Props, State> {
  state: State = { isNowDelayValid: true };

  onNowDelayChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;

    if (isEmpty(value)) {
      this.setState({ isNowDelayValid: true });
      return this.props.onNowDelayChange(value);
    }

    if (rangeUtil.isValidTimeSpan(value)) {
      this.setState({ isNowDelayValid: true });
      return this.props.onNowDelayChange(value);
    }

    this.setState({ isNowDelayValid: false });
  };

  onHideTimePickerChange = () => {
    this.props.onHideTimePickerChange(!this.props.timePickerHidden);
  };

  onTimeTravelVisibleChange = () => {
    this.props.onTimeTravelVisibleChange(!this.props.timeTravelVisible);
  };

  onTimeZoneChange = (timeZone?: string) => {
    if (typeof timeZone !== 'string') {
      return;
    }
    this.props.onTimeZoneChange(timeZone);
  };

  render() {
    return (
      <CollapsableSection label="Time options" isOpen={true}>
        <Field label="Timezone" aria-label={selectors.components.TimeZonePicker.container}>
          <TimeZonePicker
            includeInternal={true}
            value={this.props.timezone}
            onChange={this.onTimeZoneChange}
            width={40}
          />
        </Field>
        <AutoRefreshIntervals
          refreshIntervals={this.props.refreshIntervals}
          onRefreshIntervalChange={this.props.onRefreshIntervalChange}
        />
        <Field
          label="Now delay now"
          description="Enter 1m to ignore the last minute. It might contain incomplete metrics."
        >
          <Input
            invalid={!this.state.isNowDelayValid}
            placeholder="0m"
            onChange={this.onNowDelayChange}
            defaultValue={this.props.nowDelay}
          />
        </Field>
        <Field label="Hide time picker">
          <Switch value={!!this.props.timePickerHidden} onChange={this.onHideTimePickerChange} />
        </Field>
        <Field
          label="Show time travel"
          description="Allows the user to trigger time travel (note this can be computationally expensive)"
        >
          <Switch value={this.props.timeTravelVisible} onChange={this.onTimeTravelVisibleChange} />
        </Field>
      </CollapsableSection>
    );
  }
}
