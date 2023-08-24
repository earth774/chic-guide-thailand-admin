import { ParseUser } from "../user/parse-user.model";

export interface ParseQueryParams {
  query?: string;
  page?: number;
  limit?: number;
  status?: string;
  exclude?: string[];
  user?: ParseUser | Parse.Pointer;
  sort?: { field: string, direction: string };
}

export interface ParseQueryResult<T> {
  count?: number;
  results?: T[];
}