import type {
  StatsResultSet,
  StatsResultSetRow,
  StatsResultSetValue,
  StatsResultSetsResponse,
} from "../models/statsResultSets";

export type RowFromHeaders<H extends readonly string[]> = {
  [K in H[number]]: StatsResultSetValue;
};

export function getResultSet(
  response: StatsResultSetsResponse,
  name: string,
): StatsResultSet | undefined {
  if (response.resultSets) {
    return response.resultSets.find((set) => set.name === name);
  }

  if (response.resultSet) {
    const resultSets = Array.isArray(response.resultSet)
      ? response.resultSet
      : [response.resultSet];
    return resultSets.find((set) => set.name === name);
  }

  return undefined;
}

export function normalizeResultSet<H extends readonly string[]>(
  resultSet: StatsResultSet,
  expectedHeaders: H,
): RowFromHeaders<H>[] {
  assertHeadersMatch(resultSet.headers, expectedHeaders);
  return mapRows(expectedHeaders, resultSet.rowSet);
}

export function mapRows<H extends readonly string[]>(
  headers: H,
  rows: StatsResultSetRow[],
): RowFromHeaders<H>[] {
  return rows.map((row) => {
    const record = {} as RowFromHeaders<H>;
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i];
      record[key] = (row[i] ?? null) as StatsResultSetValue;
    }
    return record;
  });
}

function assertHeadersMatch(expected: readonly string[], actual: string[]): void {
  if (expected.length !== actual.length) {
    throw new Error(
      `Unexpected header length: expected ${expected.length} but received ${actual.length}`,
    );
  }

  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] !== actual[i]) {
      throw new Error(
        `Unexpected header at index ${i}: expected ${expected[i]} but received ${actual[i]}`,
      );
    }
  }
}
