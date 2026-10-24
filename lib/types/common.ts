export type DateString = string; // "YYYY-MM-DD"
export type TimestampString = string; // ISO 8601 UTC string

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  fields?: Record<string, string>;

  constructor(message: string, code = "UNKNOWN_ERROR", statusCode = 400, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
