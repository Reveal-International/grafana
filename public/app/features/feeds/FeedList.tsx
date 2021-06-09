import React, { PureComponent } from 'react';
import { hot } from 'react-hot-loader';
import Page from 'app/core/components/Page/Page';
import { DeleteButton, LinkButton } from '@grafana/ui';
import { NavModel } from '@grafana/data';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { OrgRole, StoreState, Feed } from 'app/types';
import { loadFeeds, deleteFeed } from './state/actions';
import { getSearchQuery, getFeeds, getFeedsCount } from './state/selectors';
import { getNavModel } from 'app/core/selectors/navModel';
import { FilterInput } from 'app/core/components/FilterInput/FilterInput';
import { config } from 'app/core/config';
import { contextSrv, User } from 'app/core/services/context_srv';
import { connectWithCleanUp } from '../../core/components/connectWithCleanUp';
import { setSearchQuery } from './state/reducers';

export interface Props {
  navModel: NavModel;
  feeds: Feed[];
  searchQuery: string;
  feedsCount: number;
  hasFetched: boolean;
  loadFeeds: typeof loadFeeds;
  deleteFeed: typeof deleteFeed;
  setSearchQuery: typeof setSearchQuery;
  editorsCanAdmin: boolean;
  signedInUser: User;
}

export class FeedList extends PureComponent<Props, any> {
  componentDidMount() {
    this.fetchFeeds();
  }

  async fetchFeeds() {
    await this.props.loadFeeds();
  }

  deleteFeed = (feed: Feed) => {
    this.props.deleteFeed(feed.id);
  };

  onSearchQueryChange = (value: string) => {
    this.props.setSearchQuery(value);
  };

  renderFeed(feed: Feed) {
    const { editorsCanAdmin, signedInUser } = this.props;
    const feedUrl = `org/feeds/edit/${feed.id}`;
    const canDelete = signedInUser.isGrafanaAdmin || (editorsCanAdmin && signedInUser.orgRole === OrgRole.Editor);
    return (
      <tr key={feed.id}>
        <td className="link-td">
          <a href={feedUrl}>{feed.name}</a>
        </td>
        <td className="text-right">{feed.enabled}</td>
        <td className="text-right">
          <DeleteButton size="sm" disabled={!canDelete} onConfirm={() => this.deleteFeed(feed)} />
        </td>
      </tr>
    );
  }

  renderEmptyList() {
    return (
      <EmptyListCTA
        title="You haven't created any feeds yet."
        buttonIcon="rocket"
        buttonLink="org/feeds/new"
        buttonTitle=" New feed"
        proTip=""
        proTipLink=""
        proTipLinkTitle=""
        proTipTarget="_blank"
      />
    );
  }

  renderFeedList() {
    const { feeds, searchQuery, editorsCanAdmin, signedInUser } = this.props;
    const isCanAdminAndViewer = editorsCanAdmin && signedInUser.orgRole === OrgRole.Viewer;
    const disabledClass = isCanAdminAndViewer ? ' disabled' : '';
    const newFeedHref = isCanAdminAndViewer ? '#' : 'org/feeds/new';

    return (
      <>
        <div className="page-action-bar">
          <div className="gf-form gf-form--grow">
            <FilterInput placeholder="Search feeds" value={searchQuery} onChange={this.onSearchQueryChange} />
          </div>

          <LinkButton className={disabledClass} href={newFeedHref}>
            New Feed
          </LinkButton>
        </div>

        <div className="admin-list-table">
          <table className="filter-table filter-table--hover form-inline">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>{feeds.map((feed) => this.renderFeed(feed))}</tbody>
          </table>
        </div>
      </>
    );
  }

  renderList() {
    const { feedsCount, hasFetched } = this.props;

    if (!hasFetched) {
      return null;
    }

    if (feedsCount > 0) {
      return this.renderFeedList();
    } else {
      return this.renderEmptyList();
    }
  }

  render() {
    const { hasFetched, navModel } = this.props;

    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={!hasFetched}>{this.renderList()}</Page.Contents>
      </Page>
    );
  }
}

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'feeds'),
    feeds: getFeeds(state.feeds),
    searchQuery: getSearchQuery(state.feeds),
    feedsCount: getFeedsCount(state.feeds),
    hasFetched: state.feeds.hasFetched,
    editorsCanAdmin: config.editorsCanAdmin, // this makes the feature toggle mockable/controllable from tests,
    signedInUser: contextSrv.user, // this makes the feature toggle mockable/controllable from tests,
  };
}

const mapDispatchToProps = {
  loadFeeds,
  deleteFeed,
  setSearchQuery,
};

export default hot(module)(connectWithCleanUp(mapStateToProps, mapDispatchToProps, (state) => state.feeds)(FeedList));
