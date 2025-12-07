interface ResponseBodyDefault {
  dateTime: string;
  version: string;
  status: {
    code: string;
    message: string;
  };
}

interface Pagination {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export type { Pagination, ResponseBodyDefault };
