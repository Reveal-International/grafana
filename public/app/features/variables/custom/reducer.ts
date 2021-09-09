import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { CustomVariableModel, initialVariableModelState, VariableOption } from '../types';
import {
  ALL_VARIABLE_TEXT,
  ALL_VARIABLE_VALUE,
  getInstanceState,
  VariablePayload,
  initialVariablesState,
  VariablesState,
} from '../state/types';

export const initialCustomVariableModelState: CustomVariableModel = {
  ...initialVariableModelState,
  type: 'custom',
  multi: false,
  includeAll: false,
  allValue: null,
  query: '',
  options: [],
  current: {} as VariableOption,
};

export const customVariableSlice = createSlice({
  name: 'templating/custom',
  initialState: initialVariablesState,
  reducers: {
    createCustomOptionsFromQuery: (state: VariablesState, action: PayloadAction<VariablePayload>) => {
      const instanceState = getInstanceState<CustomVariableModel>(state, action.payload.id);
      const { includeAll, query } = instanceState;

      // Changed to split by newline and comma and be a bit more consistent and easy to use.
      let options = [];
      query.split(/\r?\n/).forEach((line) => {
        line = line.trim();
        if (line.endsWith(',')) {
          line = line.substr(0, line.length - 1);
        }
        const textMatch = /^(.+)\s?:\s?(.+)$/g.exec(line) ?? [];
        if (textMatch.length === 3) {
          const [, key, value] = textMatch;
          options.push({ text: key.trim(), value: value.trim(), selected: false });
        } else {
          options.push({ text: line.trim(), value: line.trim(), selected: false });
        }
      });

      if (includeAll) {
        options.unshift({ text: ALL_VARIABLE_TEXT, value: ALL_VARIABLE_VALUE, selected: false });
      }

      instanceState.options = options;
    },
  },
});

export const customVariableReducer = customVariableSlice.reducer;

export const { createCustomOptionsFromQuery } = customVariableSlice.actions;
