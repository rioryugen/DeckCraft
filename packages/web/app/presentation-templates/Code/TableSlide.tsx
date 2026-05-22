// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import * as z from "zod";

const DEFAULT_TABLE_COLUMNS = ["Feature", "Column 1", "Column 2", "Column 3"];

const DEFAULT_ROWS = [
  { cells: ["Component-based", "check", "check", "check"] },
  { cells: ["TypeScript Support", "check", "check", "check"] },
  { cells: ["Learning Curve", "Medium", "Easy", "Steep"] },
  { cells: ["Bundle Size", "40KB", "34KB", "167KB"] },
  { cells: ["Performance", "Excellent", "Excellent", "Good"] },
  { cells: ["Community Size", "Huge", "Large", "Large"] },
];

const ComparisonRowSchema = z.object({
  cells: z.array(z.string().max(24)).min(1).max(6).meta({
    description: "Cell values for this row in left-to-right order. Match the number of table columns.",
  }),
});

export const slideLayoutId = "table-slide";
export const slideLayoutName = "Table Slide";
export const slideLayoutDescription =
  "A slide with title and a table.";

export const Schema = z.object({
  title: z.string().min(6).max(18).default("Comparison").meta({
    description: "Slide title shown above the table.",
  }),
  tableColumns: z.array(z.string().max(18)).min(1).max(6).meta({
    description: "Table columns shown in the first row.",
  }).default(DEFAULT_TABLE_COLUMNS),
  rows: z
    .array(ComparisonRowSchema)
    .min(1)
    .max(6)
    .default(DEFAULT_ROWS)
    .meta({
      description: "Table rows where each row contains a cells array matching the table columns.",
    }),
}).superRefine((value, ctx) => {
  value.rows.forEach((row, rowIndex) => {
    if (row.cells.length !== value.tableColumns.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rows", rowIndex, "cells"],
        message: "Each row must contain the same number of cells as tableColumns.",
      });
    }
  });
});

export type SchemaType = z.infer<typeof Schema>;

function getColumnWidth(columnCount: number, columnIndex: number) {
  if (columnCount <= 1) {
    return "100%";
  }

  const firstColumnWeight = 1.4;
  const totalWeight = firstColumnWeight + columnCount - 1;
  const columnWeight = columnIndex === 0 ? firstColumnWeight : 1;

  return `${(columnWeight / totalWeight) * 100}%`;
}

function renderCell(value: string, isFirstColumn: boolean) {
  if (!isFirstColumn && value && value.toLowerCase() === "check") {
    return <span className="text-[26px] px-[32px]" style={{ color: "var(--graph-2,#37f08e)" }}>✓</span>;
  }

  return (
    <span
      className="text-[18px] px-[32px]"
      style={{
        color: isFirstColumn
          ? "var(--background-text,#d5dcff)"
          : "var(--background-text,#CAD5E2)",
      }}
    >
      {value}
    </span>
  );
}

const CodeSlide05ComparisonTable = ({ data }: { data: Partial<SchemaType> }) => {
  const tableColumns = data.tableColumns?.length ? data.tableColumns : DEFAULT_TABLE_COLUMNS;
  const rows = data.rows?.length ? data.rows : DEFAULT_ROWS;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet" />
      <div
        className="relative h-[720px] w-[1280px] overflow-hidden p-[53px]"
        style={{
          backgroundColor: "var(--background-color,#101B37)",
          fontFamily: "var(--body-font-family,Nunito Sans)",
        }}
      >

        <h2 className="text-[64px] font-medium" style={{ color: "var(--background-text,#ffffff)" }}>{data.title}</h2>

        <div
          className="mt-[22px] min-h-0 flex-1 rounded-[16px] border"
          style={{
            backgroundColor: "var(--card-color,#0F172BCC)",
            borderColor: "var(--stroke,#1D293D80)",
          }}
        >
          <table className="w-full table-fixed border-separate border-spacing-0" style={{ color: "var(--background-text,#8ea1da)" }}>
            <colgroup>
              {tableColumns.map((_, columnIndex) => (
                <col key={columnIndex} style={{ width: getColumnWidth(tableColumns.length, columnIndex) }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {tableColumns.map((column, columnIndex) => (
                  <th
                    key={`${column}-${columnIndex}`}
                    scope="col"
                    className="px-[32px] py-[16px] text-[18px] text-center font-normal border-b border-r"
                    style={{
                      color: "var(--background-text,#ffffff)",
                      borderColor: "var(--stroke,#1D293D80)",
                      borderRightWidth: columnIndex === tableColumns.length - 1 ? "0px" : undefined,
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {Array.from({ length: tableColumns.length }, (_, cellIndex) => (
                    <td
                      key={`row-${rowIndex}-cell-${cellIndex}`}
                      className="border-b border-r px-[20px] py-[20px] text-center align-middle"
                      style={{
                        borderColor: "var(--stroke,#1D293D80)",
                        borderRightWidth: cellIndex === tableColumns.length - 1 ? "0px" : undefined,
                      }}
                    >
                      {renderCell(row.cells[cellIndex] || "", cellIndex === 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CodeSlide05ComparisonTable;
