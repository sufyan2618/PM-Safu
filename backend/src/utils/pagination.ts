import { PAGINATION_DEFAULTS } from "../config/constants";
import type { PaginationMeta } from "./apiResponse";

export interface PaginationParams {
  page?: unknown;
  limit?: unknown;
  sort?: unknown;
}

export interface ResolvedPagination {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

/**
 * Parses pagination + sort query params into a Mongo-ready shape.
 * `sort` accepts the typical `-createdAt,name` syntax (prefix `-` = descending).
 */
export function getPagination(query: PaginationParams, defaultSort = "-createdAt"): ResolvedPagination {
  const page = parsePositiveInt(query.page, PAGINATION_DEFAULTS.page);
  const rawLimit = parsePositiveInt(query.limit, PAGINATION_DEFAULTS.limit);
  const limit = Math.min(rawLimit, PAGINATION_DEFAULTS.maxLimit);
  const skip = (page - 1) * limit;

  const sortString = typeof query.sort === "string" && query.sort.length > 0 ? query.sort : defaultSort;
  const sort: Record<string, 1 | -1> = {};
  for (const field of sortString.split(",")) {
    const trimmed = field.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("-")) {
      sort[trimmed.slice(1)] = -1;
    } else {
      sort[trimmed] = 1;
    }
  }

  return { page, limit, skip, sort };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
