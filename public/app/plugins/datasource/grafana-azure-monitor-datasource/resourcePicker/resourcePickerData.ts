import { DataSourceWithBackend } from '@grafana/runtime';

import { DataSourceInstanceSettings } from '../../../../../../packages/grafana-data/src';
import {
  locationDisplayNames,
  logsSupportedLocationsKusto,
  logsSupportedResourceTypesKusto,
  resourceTypeDisplayNames,
} from '../azureMetadata';
import { ResourceRow, ResourceRowGroup, ResourceRowType } from '../components/ResourcePicker/types';
import { parseResourceURI } from '../components/ResourcePicker/utils';
import {
  AzureDataSourceJsonData,
  AzureGraphResponse,
  AzureMonitorQuery,
  AzureResourceGraphOptions,
  AzureResourceSummaryItem,
  RawAzureResourceGroupItem,
  RawAzureResourceItem,
  RawAzureSubscriptionItem,
} from '../types';
import { routeNames } from '../utils/common';

const RESOURCE_GRAPH_URL = '/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01';

export default class ResourcePickerData extends DataSourceWithBackend<AzureMonitorQuery, AzureDataSourceJsonData> {
  private resourcePath: string;

  constructor(instanceSettings: DataSourceInstanceSettings<AzureDataSourceJsonData>) {
    super(instanceSettings);
    this.resourcePath = `${routeNames.resourceGraph}`;
  }

  static readonly templateVariableGroupID = '$$grafana-templateVariables$$';

  async getSubscriptions(): Promise<ResourceRowGroup> {
    const query = `
    resources
    | join kind=inner (
              ResourceContainers
                | where type == 'microsoft.resources/subscriptions'
                | project subscriptionName=name, subscriptionURI=id, subscriptionId
              ) on subscriptionId
    | summarize count() by subscriptionName, subscriptionURI, subscriptionId
    | order by subscriptionName desc
  `;

    let resources: RawAzureSubscriptionItem[] = [];

    let allFetched = false;
    let $skipToken = undefined;
    while (!allFetched) {
      // The response may include several pages
      let options: Partial<AzureResourceGraphOptions> = {};
      if ($skipToken) {
        options = {
          $skipToken,
        };
      }
      const resourceResponse = await this.makeResourceGraphRequest<RawAzureSubscriptionItem[]>(query, 1, options);
      if (!resourceResponse.data.length) {
        throw new Error('unable to fetch resource details');
      }
      resources = resources.concat(resourceResponse.data);
      $skipToken = resourceResponse.$skipToken;
      allFetched = !$skipToken;
    }

    return resources.map((subscription) => ({
      name: subscription.subscriptionName,
      id: subscription.subscriptionId,
      typeLabel: 'Subscription',
      type: ResourceRowType.Subscription,
      children: [],
    }));
  }

  async getResourceGroupsBySubscriptionId(subscriptionId: string) {
    const query = `
    resources
     | join kind=inner (
       ResourceContainers
       | where type == 'microsoft.resources/subscriptions/resourcegroups'
       | project resourceGroupURI=id, resourceGroupName=name, resourceGroup, subscriptionId
     ) on resourceGroup, subscriptionId

     | where type in (${logsSupportedResourceTypesKusto})
     | where subscriptionId == '${subscriptionId}'
     | summarize count() by resourceGroupName, resourceGroupURI
     | order by resourceGroupURI asc`;

    let resources: RawAzureResourceGroupItem[] = [];
    let allFetched = false;
    let $skipToken = undefined;
    while (!allFetched) {
      // The response may include several pages
      let options: Partial<AzureResourceGraphOptions> = {};
      if ($skipToken) {
        options = {
          $skipToken,
        };
      }
      const resourceResponse = await this.makeResourceGraphRequest<RawAzureResourceGroupItem[]>(query, 1, options);
      if (!resourceResponse.data.length) {
        throw new Error('unable to fetch resource details');
      }
      resources = resources.concat(resourceResponse.data);
      $skipToken = resourceResponse.$skipToken;
      allFetched = !$skipToken;
    }

    return resources.map((r) => ({
      name: r.resourceGroupName,
      id: r.resourceGroupURI,
      type: ResourceRowType.ResourceGroup,
      typeLabel: 'Resource Group',
      children: [],
    }));
  }

  async getResourcesForResourceGroup(resourceGroupId: string) {
    const { data: response } = await this.makeResourceGraphRequest<RawAzureResourceItem[]>(`
      resources
      | where id hasprefix "${resourceGroupId}"
      | where type in (${logsSupportedResourceTypesKusto}) and location in (${logsSupportedLocationsKusto})
    `);

    return formatResourceGroupChildren(response);
  }

  async getResourceURIDisplayProperties(resourceURI: string): Promise<AzureResourceSummaryItem> {
    const { subscriptionID, resourceGroup } = parseResourceURI(resourceURI) ?? {};

    if (!subscriptionID) {
      throw new Error('Invalid resource URI passed');
    }

    // resourceGroupURI and resourceURI could be invalid values, but that's okay because the join
    // will just silently fail as expected
    const subscriptionURI = `/subscriptions/${subscriptionID}`;
    const resourceGroupURI = `${subscriptionURI}/resourceGroups/${resourceGroup}`;

    const query = `
    resourcecontainers
    | where type == "microsoft.resources/subscriptions"
    | where id =~ "${subscriptionURI}"
    | project subscriptionName=name, subscriptionId

    | join kind=leftouter (
      resourcecontainers            
            | where type == "microsoft.resources/subscriptions/resourcegroups"
            | where id =~ "${resourceGroupURI}"
            | project resourceGroupName=name, resourceGroup, subscriptionId
        ) on subscriptionId

        | join kind=leftouter (
          resources
            | where id =~ "${resourceURI}"
            | project resourceName=name, subscriptionId
        ) on subscriptionId

        | project subscriptionName, resourceGroupName, resourceName
    `;

    const { data: response } = await this.makeResourceGraphRequest<AzureResourceSummaryItem[]>(query);

    if (!response.length) {
      throw new Error('unable to fetch resource details');
    }

    return response[0];
  }

  async getResourceURIFromWorkspace(workspace: string) {
    const { data: response } = await this.makeResourceGraphRequest<RawAzureResourceItem[]>(`
      resources
      | where properties['customerId'] == "${workspace}"
      | project id
    `);

    if (!response.length) {
      throw new Error('unable to find resource for workspace ' + workspace);
    }

    return response[0].id;
  }

  async makeResourceGraphRequest<T = unknown>(
    query: string,
    maxRetries = 1,
    reqOptions?: Partial<AzureResourceGraphOptions>
  ): Promise<AzureGraphResponse<T>> {
    try {
      return await this.postResource(this.resourcePath + RESOURCE_GRAPH_URL, {
        query: query,
        options: {
          resultFormat: 'objectArray',
          ...reqOptions,
        },
      });
    } catch (error) {
      if (maxRetries > 0) {
        return this.makeResourceGraphRequest(query, maxRetries - 1);
      }

      throw error;
    }
  }

  transformVariablesToRow(templateVariables: string[]): ResourceRow {
    return {
      id: ResourcePickerData.templateVariableGroupID,
      name: 'Template variables',
      type: ResourceRowType.VariableGroup,
      typeLabel: 'Variables',
      children: templateVariables.map((v) => ({
        id: v,
        name: v,
        type: ResourceRowType.Variable,
        typeLabel: 'Variable',
      })),
    };
  }
}

function formatResourceGroupChildren(rawData: RawAzureResourceItem[]): ResourceRowGroup {
  return rawData.map((item) => ({
    name: item.name,
    id: item.id,
    resourceGroupName: item.resourceGroup,
    type: ResourceRowType.Resource,
    typeLabel: resourceTypeDisplayNames[item.type] || item.type,
    location: locationDisplayNames[item.location] || item.location,
  }));
}
