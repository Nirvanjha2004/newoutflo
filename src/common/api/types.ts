
export type GenericApiResponse<T extends {} = {}> = {
  user: any;
  message: string;
  data: T;
};
