export interface Metric {
  start?: Date;
  finish?: Date;
  clientCode: string;
  type: string;
  name: string;
  category?: string;
  source?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userOrgId?: string;
  // values are fully indexed and searchable
  values?: { [k: string]: any };
  // date is not indexed and only available for reference
  data?: { [k: string]: any };
}
