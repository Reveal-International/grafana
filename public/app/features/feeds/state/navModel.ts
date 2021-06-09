import { NavModelItem } from '@grafana/data';
import { Feed } from 'app/types/feeds';

export function buildNavModel(feed: Feed): NavModelItem {
  const navModel = {
    id: 'feed-' + feed.id,
    subTitle: 'Manage feed settings',
    url: '',
    text: feed.name,
    breadcrumbs: [{ title: 'feeds', url: 'org/feeds' }],
  };
  return navModel;
}
