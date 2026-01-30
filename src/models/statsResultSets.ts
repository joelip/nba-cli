export type StatsResultSetValue = string | number | boolean | null;
export type StatsResultSetRow = StatsResultSetValue[];

export interface StatsResultSet {
  name: string;
  headers: string[];
  rowSet: StatsResultSetRow[];
}

export interface StatsResultSetsResponse {
  resource?: string;
  parameters?: unknown;
  resultSets?: StatsResultSet[];
  resultSet?: StatsResultSet | StatsResultSet[];
}
