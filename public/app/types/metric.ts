export interface Metric {
  start?: Date;
  finish?: Date;
  clientCode?: string;
  type: string;
  name: string;
  category?: string;
  tag?: string;
  group?: string;
  source?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userOrgId?: string;
  // values are fully indexed and searchable
  values?: { [k: string]: any };
  // data is not indexed and only available for reference
  data?: { [k: string]: any };
}
