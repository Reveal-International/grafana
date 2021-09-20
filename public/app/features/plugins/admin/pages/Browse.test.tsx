import React from 'react';
import { Router } from 'react-router-dom';
import { render, RenderResult, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { locationService } from '@grafana/runtime';
import { PluginType } from '@grafana/data';
import { getRouteComponentProps } from 'app/core/navigation/__mocks__/routeProps';
import { configureStore } from 'app/store/configureStore';
import { PluginAdminRoutes, CatalogPlugin } from '../types';
import { getCatalogPluginMock, getPluginsStateMock } from '../__mocks__';
import BrowsePage from './Browse';

// Mock the config to enable the plugin catalog
jest.mock('@grafana/runtime', () => {
  const original = jest.requireActual('@grafana/runtime');

  return { ...original, pluginAdminEnabled: true };
});

const renderBrowse = (path = '/plugins', plugins: CatalogPlugin[] = []): RenderResult => {
  const store = configureStore({ plugins: getPluginsStateMock(plugins) });
  locationService.push(path);
  const props = getRouteComponentProps({
    route: { routeName: PluginAdminRoutes.Home } as any,
  });

  return render(
    <Provider store={store}>
      <Router history={locationService.getHistory()}>
        <BrowsePage {...props} />
      </Router>
    </Provider>
  );
};

describe('Browse list of plugins', () => {
  describe('when filtering', () => {
    it('should list installed plugins by default', async () => {
      const { queryByText } = renderBrowse('/plugins', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-4', name: 'Plugin 4', isInstalled: false }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 1')).toBeInTheDocument());
      expect(queryByText('Plugin 1')).toBeInTheDocument();
      expect(queryByText('Plugin 2')).toBeInTheDocument();
      expect(queryByText('Plugin 3')).toBeInTheDocument();

      expect(queryByText('Plugin 4')).toBeNull();
    });

    it('should list all plugins (except core plugins) when filtering by all', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&filterByType=all', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', isInstalled: false }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-4', name: 'Plugin 4', isInstalled: true, isCore: true }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 1')).toBeInTheDocument());
      expect(queryByText('Plugin 2')).toBeInTheDocument();
      expect(queryByText('Plugin 3')).toBeInTheDocument();

      // Core plugins should not be listed
      expect(queryByText('Plugin 4')).not.toBeInTheDocument();
    });

    it('should list installed plugins (including core plugins) when filtering by installed', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=installed', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', isInstalled: false }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-4', name: 'Plugin 4', isInstalled: true, isCore: true }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 1')).toBeInTheDocument());
      expect(queryByText('Plugin 3')).toBeInTheDocument();
      expect(queryByText('Plugin 4')).toBeInTheDocument();

      // Not showing not installed plugins
      expect(queryByText('Plugin 2')).not.toBeInTheDocument();
    });

    it('should list all plugins (including disabled plugins) when filtering by all', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&filterByType=all', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', isInstalled: false }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-4', name: 'Plugin 4', isInstalled: true, isDisabled: true }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 1')).toBeInTheDocument());

      expect(queryByText('Plugin 2')).toBeInTheDocument();
      expect(queryByText('Plugin 3')).toBeInTheDocument();
      expect(queryByText('Plugin 4')).toBeInTheDocument();
    });

    it('should list installed plugins (including disabled plugins) when filtering by installed', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=installed', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', isInstalled: false }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', isInstalled: true }),
        getCatalogPluginMock({ id: 'plugin-4', name: 'Plugin 4', isInstalled: true, isDisabled: true }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 1')).toBeInTheDocument());
      expect(queryByText('Plugin 3')).toBeInTheDocument();
      expect(queryByText('Plugin 4')).toBeInTheDocument();

      // Not showing not installed plugins
      expect(queryByText('Plugin 2')).not.toBeInTheDocument();
    });

    it('should list enterprise plugins when querying for them', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&q=wavefront', [
        getCatalogPluginMock({ id: 'wavefront', name: 'Wavefront', isInstalled: true, isEnterprise: true }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', isInstalled: true, isCore: true }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', isInstalled: true }),
      ]);

      await waitFor(() => expect(queryByText('Wavefront')).toBeInTheDocument());

      // Should not show plugins that don't match the query
      expect(queryByText('Plugin 2')).not.toBeInTheDocument();
      expect(queryByText('Plugin 3')).not.toBeInTheDocument();
    });

    it('should list only datasource plugins when filtering by datasource', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&filterByType=datasource', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', type: PluginType.app }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', type: PluginType.datasource }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', type: PluginType.panel }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 2')).toBeInTheDocument());

      // Other plugin types shouldn't be shown
      expect(queryByText('Plugin 1')).not.toBeInTheDocument();
      expect(queryByText('Plugin 3')).not.toBeInTheDocument();
    });

    it('should list only panel plugins when filtering by panel', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&filterByType=panel', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', type: PluginType.app }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', type: PluginType.datasource }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', type: PluginType.panel }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 3')).toBeInTheDocument());

      // Other plugin types shouldn't be shown
      expect(queryByText('Plugin 1')).not.toBeInTheDocument();
      expect(queryByText('Plugin 2')).not.toBeInTheDocument();
    });

    it('should list only app plugins when filtering by app', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&filterByType=app', [
        getCatalogPluginMock({ id: 'plugin-1', name: 'Plugin 1', type: PluginType.app }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2', type: PluginType.datasource }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3', type: PluginType.panel }),
      ]);

      await waitFor(() => expect(queryByText('Plugin 1')).toBeInTheDocument());

      // Other plugin types shouldn't be shown
      expect(queryByText('Plugin 2')).not.toBeInTheDocument();
      expect(queryByText('Plugin 3')).not.toBeInTheDocument();
    });
  });
  describe('when searching', () => {
    it('should only list plugins matching search', async () => {
      const { queryByText } = renderBrowse('/plugins?filterBy=all&q=zabbix', [
        getCatalogPluginMock({ id: 'zabbix', name: 'Zabbix' }),
        getCatalogPluginMock({ id: 'plugin-2', name: 'Plugin 2' }),
        getCatalogPluginMock({ id: 'plugin-3', name: 'Plugin 3' }),
      ]);

      await waitFor(() => expect(queryByText('Zabbix')).toBeInTheDocument());

      // Other plugin types shouldn't be shown
      expect(queryByText('Plugin 2')).not.toBeInTheDocument();
      expect(queryByText('Plugin 3')).not.toBeInTheDocument();
    });
  });

  describe('when sorting', () => {
    it('should sort plugins by name in ascending alphabetical order', async () => {
      const { findByTestId } = renderBrowse('/plugins?filterBy=all', [
        getCatalogPluginMock({ id: 'wavefront', name: 'Wavefront' }),
        getCatalogPluginMock({ id: 'redis-application', name: 'Redis Application' }),
        getCatalogPluginMock({ id: 'zabbix', name: 'Zabbix' }),
        getCatalogPluginMock({ id: 'diagram', name: 'Diagram' }),
        getCatalogPluginMock({ id: 'acesvg', name: 'ACE.SVG' }),
      ]);

      const pluginList = await findByTestId('plugin-list');
      const pluginHeadings = within(pluginList).queryAllByRole('heading');
      expect(pluginHeadings.map((heading) => heading.innerHTML)).toStrictEqual([
        'ACE.SVG',
        'Diagram',
        'Redis Application',
        'Wavefront',
        'Zabbix',
      ]);
    });

    it('should sort plugins by name in descending alphabetical order', async () => {
      const { findByTestId } = renderBrowse('/plugins?filterBy=all&sortBy=nameDesc', [
        getCatalogPluginMock({ id: 'wavefront', name: 'Wavefront' }),
        getCatalogPluginMock({ id: 'redis-application', name: 'Redis Application' }),
        getCatalogPluginMock({ id: 'zabbix', name: 'Zabbix' }),
        getCatalogPluginMock({ id: 'diagram', name: 'Diagram' }),
        getCatalogPluginMock({ id: 'acesvg', name: 'ACE.SVG' }),
      ]);

      const pluginList = await findByTestId('plugin-list');
      const pluginHeadings = within(pluginList).queryAllByRole('heading');
      expect(pluginHeadings.map((heading) => heading.innerHTML)).toStrictEqual([
        'Zabbix',
        'Wavefront',
        'Redis Application',
        'Diagram',
        'ACE.SVG',
      ]);
    });

    it('should sort plugins by date in ascending updated order', async () => {
      const { findByTestId } = renderBrowse('/plugins?filterBy=all&sortBy=updated', [
        getCatalogPluginMock({ id: '1', name: 'Wavefront', updatedAt: '2021-04-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '2', name: 'Redis Application', updatedAt: '2021-02-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '3', name: 'Zabbix', updatedAt: '2021-01-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '4', name: 'Diagram', updatedAt: '2021-05-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '5', name: 'ACE.SVG', updatedAt: '2021-02-01T00:00:00.000Z' }),
      ]);

      const pluginList = await findByTestId('plugin-list');
      const pluginHeadings = within(pluginList).queryAllByRole('heading');
      expect(pluginHeadings.map((heading) => heading.innerHTML)).toStrictEqual([
        'Diagram',
        'Wavefront',
        'Redis Application',
        'ACE.SVG',
        'Zabbix',
      ]);
    });

    it('should sort plugins by date in ascending published order', async () => {
      const { findByTestId } = renderBrowse('/plugins?filterBy=all&sortBy=published', [
        getCatalogPluginMock({ id: '1', name: 'Wavefront', publishedAt: '2021-04-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '2', name: 'Redis Application', publishedAt: '2021-02-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '3', name: 'Zabbix', publishedAt: '2021-01-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '4', name: 'Diagram', publishedAt: '2021-05-01T00:00:00.000Z' }),
        getCatalogPluginMock({ id: '5', name: 'ACE.SVG', publishedAt: '2021-02-01T00:00:00.000Z' }),
      ]);

      const pluginList = await findByTestId('plugin-list');
      const pluginHeadings = within(pluginList).queryAllByRole('heading');
      expect(pluginHeadings.map((heading) => heading.innerHTML)).toStrictEqual([
        'Diagram',
        'Wavefront',
        'Redis Application',
        'ACE.SVG',
        'Zabbix',
      ]);
    });

    it('should sort plugins by number of downloads in ascending order', async () => {
      const { findByTestId } = renderBrowse('/plugins?filterBy=all&sortBy=downloads', [
        getCatalogPluginMock({ id: '1', name: 'Wavefront', downloads: 30 }),
        getCatalogPluginMock({ id: '2', name: 'Redis Application', downloads: 10 }),
        getCatalogPluginMock({ id: '3', name: 'Zabbix', downloads: 50 }),
        getCatalogPluginMock({ id: '4', name: 'Diagram', downloads: 20 }),
        getCatalogPluginMock({ id: '5', name: 'ACE.SVG', downloads: 40 }),
      ]);

      const pluginList = await findByTestId('plugin-list');
      const pluginHeadings = within(pluginList).queryAllByRole('heading');
      expect(pluginHeadings.map((heading) => heading.innerHTML)).toStrictEqual([
        'Zabbix',
        'ACE.SVG',
        'Wavefront',
        'Diagram',
        'Redis Application',
      ]);
    });
  });
});
