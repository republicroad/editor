// 统计相关数据接口

import apiClient from '../apiClient';

export enum DataApi {
  overviewAPI = '/overview',
}
/**
 *
 * @param params
 * @returns 获取当前项目列表
 */
const getOVerviewData = (user_id: string) =>
  apiClient.get({ url: DataApi.overviewAPI, params: { user_id } });

export default { getOVerviewData };
