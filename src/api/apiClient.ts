/*
 * @Date: 2024-03-13 14:15:32
 * @LastEditors: yawen Yang
 * @LastEditTime: 2024-07-26 17:33:36
 * @FilePath: /custom-rules/src/api/apiClient.ts
 */
import { message as Message } from 'antd';
import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { isEmpty } from 'ramda';

// import { t } from '@/locales/i18n';

interface Result<T = any> {
  status: number;
  message: string;
  data?: T;
}
enum ResultEnum {
  SUCCESS = 0,
  ERROR = -1,
  TIMEOUT = 401,
}

enum StorageEnum {
  User = 'user',
  Token = 'token',
  Settings = 'settings',
  I18N = 'i18nextLng',
  Project = 'project',
  List = 'list',
  BRDE_SESSION = 'Brde_session',
}

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API as string,
  timeout: 50000,
  headers: { 
    'Content-Type': 'application/json;charset=utf-8',
    'Udf-Spec': 'v3'
  },
});
let token: any = '';
// 请求拦截
axiosInstance.interceptors.request.use(
  (config) => {
    // 在请求被发送之前做些什么
    // if (!token) {
    token = Cookies.get(StorageEnum.BRDE_SESSION) || '';
    // }
    config.headers.Authorization = token !== null && token ? token : '';
    return config;
  },
  (error) => {
    // 请求错误时做些什么
    return Promise.reject(error);
  },
);

// 响应拦截
axiosInstance.interceptors.response.use(
  (res: AxiosResponse<Result>) => {
    if (!res.data) throw new Error(('请求出错，请稍候重试'));
    const { status, data, message } = res.data;
    // 业务请求成功
    const hasSuccess = data && Reflect.has(res.data, 'status') && status === ResultEnum.SUCCESS;
    if (hasSuccess) {
      return data;
    }
    message ? Message.error(message) : Message.error(('请求出错，请稍候重试'));
    const err: any = new Error(message || ('请求出错，请稍候重试'));
    err.data = data;
    throw err;
    // 业务请求错误
    // throw new Error(message || t('sys.api.apiRequestFailed'));
  },
  (error: AxiosError<Result>) => {
    const { response, message } = error || {};
    let errMsg = '';
    try {
      errMsg = response?.data?.message || message;
    } catch (error) {
      throw new Error(error as unknown as string);
    }
    // 对响应错误做点什么
    if (isEmpty(errMsg)) {
      // checkStatus
      // errMsg = checkStatus(response.data.status);
      errMsg = ('操作失败,系统异常!');
    }
    Message.error(errMsg);
    if (error.response && error.response.status === 401) {
      Cookies.remove(StorageEnum.BRDE_SESSION);
    }
    return Promise.reject(error);
  },
);

class APIClient {
  get<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'GET' });
  }

  post<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'POST' });
  }

  put<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'PUT' });
  }

  delete<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'DELETE' });
  }

  request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      axiosInstance
        .request<any, AxiosResponse<Result>>(config)
        .then((res: AxiosResponse<Result>) => {
          resolve(res as unknown as Promise<T>);
        })
        .catch((e: Error | AxiosError) => {
          reject(e);
        });
    });
  }
}
export default new APIClient();
