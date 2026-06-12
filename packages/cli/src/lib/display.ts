import Table from 'cli-table3';
import chalk from 'chalk';

/**
 * Renders a formatted table to stdout.
 */
export function printTable(headers: string[], rows: string[][]): void {
  const table = new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: { head: [], border: [] },
  });

  for (const row of rows) {
    table.push(row);
  }

  console.log(table.toString());
}

/**
 * Pretty-prints a JSON value with syntax highlighting.
 * Applies all replacements on the raw JSON string in a single pass
 * to avoid regex collisions with ANSI escape codes.
 */
export function printJson(data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const highlighted = json.replace(
    /"([^"]+)"\s*:|:\s*"((?:[^"\\]|\\.)*)"|:\s*(-?\d+(?:\.\d+)?)/g,
    (match, key: string | undefined, strVal: string | undefined, numVal: string | undefined) => {
      if (key !== undefined) return `${chalk.cyan(`"${key}"`)}:`;
      if (strVal !== undefined) return `: ${chalk.green(`"${strVal}"`)}`;
      if (numVal !== undefined) return `: ${chalk.yellow(numVal)}`;
      return match;
    }
  );
  console.log(highlighted);
}

/**
 * Prints a key-value pair with label formatting.
 */
export function printDetail(label: string, value: string): void {
  console.log(`${chalk.bold(label.padEnd(14))}${value}`);
}
