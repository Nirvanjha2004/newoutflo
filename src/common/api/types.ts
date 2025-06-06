export type GenericApiResponse<T extends {} = {}> = {
  message: string;
  data: T;
};
