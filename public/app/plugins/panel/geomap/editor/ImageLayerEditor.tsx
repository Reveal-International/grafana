import React, { FC } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { InlineField, InlineFieldRow } from '@grafana/ui';
import { GeomapPanelOptions, ImageLayerCoordinates } from '../types';
import { NumberInput } from 'app/features/dimensions/editors/NumberInput';

export const ImageLayerEditor: FC<StandardEditorProps<ImageLayerCoordinates, any, GeomapPanelOptions>> = ({
  value,
  onChange,
  context,
}) => {
  const labelWidth = 10;

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
    </>
  );
};
