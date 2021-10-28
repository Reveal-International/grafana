import React, { FC, useCallback } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, InlineField, InlineFieldRow, VerticalGroup } from '@grafana/ui';
import { Map3dPanelOptions, MapViewConfig } from '../types';
import { NumberInput } from 'app/features/dimensions/editors/NumberInput';
import { lastMap3dPanelInstance } from '../Map3dPanel';

export const MapViewEditor: FC<StandardEditorProps<MapViewConfig, any, Map3dPanelOptions>> = ({
  value,
  onChange,
  context,
}) => {
  const labelWidth = 10;

  const onSetCurrentView = useCallback(() => {
    const map = lastMap3dPanelInstance.map;
    if (map) {
      onChange({
        ...value,
        lon: map.getCenter().lng.toFixed(6),
        lat: map.getCenter().lat.toFixed(6),
        zoom: map.getZoom().toFixed(2),
      });
    }
  }, [value, onChange]);

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Latitude" labelWidth={labelWidth} grow={true}>
          <NumberInput
            value={value.lat}
            min={-90}
            max={90}
            step={0.001}
            onChange={(v) => {
              onChange({ ...value, lat: v });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Longitude" labelWidth={labelWidth} grow={true}>
          <NumberInput
            value={value.lon}
            min={-180}
            max={180}
            step={0.001}
            onChange={(v) => {
              onChange({ ...value, lon: v });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Zoom" labelWidth={labelWidth} grow={true}>
          <NumberInput
            value={value.zoom ?? 1}
            min={1}
            max={18}
            step={0.01}
            onChange={(v) => {
              onChange({ ...value, zoom: v });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      <VerticalGroup>
        <Button variant="secondary" size="sm" fullWidth onClick={onSetCurrentView}>
          <span>Use current map settings</span>
        </Button>
      </VerticalGroup>
    </>
  );
};
