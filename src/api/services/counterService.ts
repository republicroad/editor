// 统计相关数据接口

import apiClient from '../apiClient';

import { CounterListData } from '#/entity';

export enum DataApi {
  counterAPI = '/counter_info',
  counterValueAPI = '/counter_value',
}
/**
 *
 * @param params
 * @returns 获取当前列表
 */
const getCounterData = (params: CounterListData) =>
  apiClient.get({ url: DataApi.counterAPI, params });

/**
 *
 * @param params
 * @returns 创建
 */
const createCounterData = (
  user_id: string,
  counter_name: string,
  counter_type: string,
  counter_time: string,
) =>
  apiClient.post({
    url: DataApi.counterAPI,
    data: { user_id, counter_name, counter_type, counter_time },
  });

/**
 *
 * @param user_id id
 * @returns 删除
 */
const deleteCounterData = (user_id: string, id: string) =>
  apiClient.delete({ url: DataApi.counterAPI, params: { id, user_id } });

/**
 *
 * @param params
 * @returns 获取带选项
 */
const getCounterTypeData = (user_id: string) =>
  apiClient.get({ url: DataApi.counterValueAPI, params: { user_id } });

const getCounterList = (params) => apiClient.get({ url: DataApi.counterAPI, params });

export default {
  getCounterData,
  getCounterTypeData,
  createCounterData,
  deleteCounterData,
  getCounterList,
};
