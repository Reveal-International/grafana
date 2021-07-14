import React from 'react';
import { connect } from 'react-redux';
import { hot } from 'react-hot-loader';

import { NavModel } from '@grafana/data';

import { StoreState } from 'app/types';
import { getNavModel } from 'app/core/selectors/navModel';
import Page from 'app/core/components/Page/Page';
import { Field, RadioButtonGroup } from '@grafana/ui';

interface Features {
  manageBusinessUnits: boolean;
  manageOperationalRanges: boolean;
}

interface Props {
  navModel: NavModel;
}

interface State {
  features: Features;
  isLoading: boolean;
}

/** Function that returns a map of features. */
export function retrieveFeatures(): Features {
  // TODO back end state and with security...
  // const features: Features = await getBackendSrv().get('/avenge/api/features', {});
  const localStorage = window.localStorage.getItem('g-admin-features');
  const features = localStorage != null ? JSON.parse(localStorage) : {};
  if (typeof features.manageBusinessUnits === 'undefined') {
    features.manageBusinessUnits = false;
  }
  if (typeof features.manageOperationalRanges === 'undefined') {
    features.manageOperationalRanges = false;
  }
  console.warn('Stub loaded features', features);
  return features;
}

/** Function that saves a map of features. */
export function saveFeatures(features: Features) {
  // TODO back end state and with security...
  console.warn('Stub saved features', features);
  window.localStorage.setItem('g-admin-features', JSON.stringify(features));
}

export class AdminFeatures extends React.PureComponent<Props, State> {
  state: State = {
    features: retrieveFeatures(),
    isLoading: true,
  };

  async componentDidMount() {
    const features: Features = retrieveFeatures();
    this.setState({
      features,
      isLoading: false,
    });
  }

  onFeatureChanged = (name: string, value: boolean) => {
    let state = { features: retrieveFeatures() };
    // @ts-ignore
    state.features[name] = value;
    saveFeatures(state.features);
    // console.log('Feature changed', name, value, state.features);
    this.setState(state);
  };

  render() {
    const { features, isLoading } = this.state;
    const { navModel } = this.props;
    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={isLoading}>
          <div className="grafana-info-box span8" style={{ margin: '20px 0 25px 0' }}>
            These features are stored in the Revelation back end operated on immediately.
          </div>

          <Field label="Maintain Business Units">
            <RadioButtonGroup
              value={features.manageBusinessUnits}
              options={[
                { value: true, label: 'Enabled' },
                { value: false, label: 'Disabled' },
              ]}
              onChange={(v) => this.onFeatureChanged('manageBusinessUnits', v)}
            />
          </Field>
          <Field label="Maintain Operational Ranges">
            <RadioButtonGroup
              value={features.manageOperationalRanges}
              options={[
                { value: true, label: 'Enabled' },
                { value: false, label: 'Disabled' },
              ]}
              onChange={(v) => this.onFeatureChanged('manageOperationalRanges', v)}
            />
          </Field>
        </Page.Contents>
      </Page>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'server-features'),
});

export default hot(module)(connect(mapStateToProps)(AdminFeatures));
