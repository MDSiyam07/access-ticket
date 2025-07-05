declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T[];
    errors: Array<{ type: string; code: string; message: string; row: number }>;
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
    };
  }

  export interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult<unknown>) => void;
    error?: (error: { type: string; code: string; message: string; row: number }) => void;
  }

  export function parse(file: File, config: ParseConfig): void;
}

declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: unknown };
  }

  export function read(data: Uint8Array, options: { type: string }): WorkBook;
  export const utils: {
    sheet_to_json: (worksheet: unknown) => unknown[];
  };
} 