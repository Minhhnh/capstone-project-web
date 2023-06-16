import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const serverInstance = axios.create({
  baseURL:
    !process.env.NODE_ENV || process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://minhhnh.tech",
});

interface ISWR {
  get: <T>(url: string) => Promise<T>;
  post: <T, U>(url: string, { data }: { data: T }) => Promise<U>;
  delete: <T, U>(url: string, { data }: { data: T }) => Promise<U>;
}
class SWR implements ISWR {
  private static instance: SWR;
  private axiosProvider: AxiosInstance;

  private constructor(axiosProvider: AxiosInstance) {
    this.axiosProvider = axiosProvider;
  }

  public static getInstance(axiosProvider: AxiosInstance): SWR {
    SWR.instance = new SWR(axiosProvider);
    return SWR.instance;
  }

  async get<T>(url: string): Promise<T> {
    return this.axiosProvider
      .get(url)
      .then((res) => {
        return res.data;
      })
      .catch((err: any) => {
        throw new Error(err);
      });
  }

  async post<T, U>(url: string, payload?: T): Promise<U> {
    return this.axiosProvider
      .post(url, { ...payload })
      .then((res) => {
        return res.data;
      })
      .catch((err: any) => {
        throw new Error(err);
      });
  }

  async delete<T, U>(url: string, payload?: T): Promise<U> {
    const requestConfig: AxiosRequestConfig = {};
    requestConfig.data = { ...payload };

    return this.axiosProvider
      .delete(url, requestConfig)
      .then((res) => {
        return res.data;
      })
      .catch((err: any) => {
        throw new Error(err);
      });
  }

  async put<T, U>(url: string, payload?: T): Promise<U> {
    return this.axiosProvider
      .put(url, { ...payload })
      .then((res) => {
        return res.data;
      })
      .catch((err: any) => {
        throw new Error(err);
      });
  }
}

export const serverSWR = SWR.getInstance(serverInstance);
