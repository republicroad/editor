// 日志相关数据接口

import apiClient from '../apiClient';

import { ProjectListData } from '#/entity';

export enum DataApi {
  logAPI = '/op_log',
}
/**
 *
 * @param params
 * @returns 获取当前项目列表
 */
const getLogData = (params: ProjectListData) => apiClient.get({ url: DataApi.logAPI, params });

export default { getLogData };
