import React, { PureComponent } from 'react';
import Page from 'app/core/components/Page/Page';
import { hot } from 'react-hot-loader';
import { Button, Form, Field, Input, FieldSet, Switch } from '@grafana/ui';
import { NavModel } from '@grafana/data';
import { connect } from 'react-redux';
import { getNavModel } from 'app/core/selectors/navModel';
import { StoreState } from 'app/types';

export interface Props {
  navModel: NavModel;
}

interface FeedDTO {
  name: string;
  enabled: boolean;
}

export class CreateFeed extends PureComponent<Props> {
  create = async (formModel: FeedDTO) => {
    // TODO
    console.error('Create feed not implemented yet');
    // const result = await getBackendSrv().post('/api/feeds', formModel);
    // if (result.feedId) {
    //   locationService.push(`/org/feeds/edit/${result.teamId}`);
    // }
  };
  render() {
    const { navModel } = this.props;

    return (
      <Page navModel={navModel}>
        <Page.Contents>
          <Form onSubmit={this.create}>
            {({ register }) => (
              <FieldSet label="New Feed">
                <Field label="Name">
                  <Input {...register('name', { required: true })} width={60} />
                </Field>
                <Field label="Feed Enabled">
                  <Switch {...register('enabled')} value={true} />
                </Field>
                <div className="gf-form-button-row">
                  <Button type="submit" variant="primary">
                    Create
                  </Button>
                </div>
              </FieldSet>
            )}
          </Form>
        </Page.Contents>
      </Page>
    );
  }
}

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'feeds'),
  };
}

export default hot(module)(connect(mapStateToProps)(CreateFeed));
