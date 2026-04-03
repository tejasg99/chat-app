export interface ApiResponseShape<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

export const createApiResponse = <T>(
  statusCode: number,
  message: string,
  data: T | null = null,
): ApiResponseShape<T> => ({
  success: statusCode < 400,
  statusCode,
  message,
  data,
});
