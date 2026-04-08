import { createReadStream } from "node:fs";
import readline from "node:readline";

export type RowRecord = Record<string, string | null>;

function unescapeMysqlBatchValue(value: string) {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];

    if (current !== "\\") {
      result += current;
      continue;
    }

    const next = value[index + 1];

    if (next === undefined) {
      result += "\\";
      continue;
    }

    index += 1;

    switch (next) {
      case "0":
        result += "\0";
        break;
      case "b":
        result += "\b";
        break;
      case "n":
        result += "\n";
        break;
      case "r":
        result += "\r";
        break;
      case "t":
        result += "\t";
        break;
      case "Z":
        result += "\x1a";
        break;
      case "\\":
        result += "\\";
        break;
      default:
        result += next;
        break;
    }
  }

  return result;
}

export function parseMysqlBatchCell(value: string | undefined) {
  if (value === undefined || value === "\\N") {
    return null;
  }

  return unescapeMysqlBatchValue(value);
}

export async function *iterateMysqlBatchTsvRows(
  filePath: string,
): AsyncGenerator<RowRecord> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const lineReader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let expectedTabCount = 0;
  let buffer = "";

  for await (const line of lineReader) {
    if (!headers.length) {
      headers = line.split("\t").map((value) => unescapeMysqlBatchValue(value));
      expectedTabCount = Math.max(headers.length - 1, 0);
      continue;
    }

    if (!line.length && !buffer.length) {
      continue;
    }

    buffer = buffer.length ? `${buffer}\n${line}` : line;

    if ((buffer.match(/\t/g) ?? []).length < expectedTabCount) {
      continue;
    }

    const values = buffer.split("\t");

    if (values.length < headers.length) {
      continue;
    }

    yield Object.fromEntries(headers.map((header, index) => [header, parseMysqlBatchCell(values[index])]));
    buffer = "";
  }

  if (buffer.length) {
    const values = buffer.split("\t");

    if (values.length >= headers.length) {
      yield Object.fromEntries(
        headers.map((header, index) => [header, parseMysqlBatchCell(values[index])]),
      );
    }
  }
}

export async function countMysqlBatchTsvRows(filePath: string) {
  let rowCount = 0;

  for await (const _row of iterateMysqlBatchTsvRows(filePath)) {
    rowCount += 1;
  }

  return rowCount;
}

export async function countMysqlBatchTsvMatches(
  filePath: string,
  predicate: (row: RowRecord) => boolean,
) {
  let matched = 0;

  for await (const row of iterateMysqlBatchTsvRows(filePath)) {
    if (predicate(row)) {
      matched += 1;
    }
  }

  return matched;
}
