/*
 * @Date: 2024-07-12 17:16:57
 * @LastEditors: yawen Yang
 * @LastEditTime: 2024-08-14 10:41:27
 * @FilePath: /custom-rules/src/api/services/listService.ts
 */
// 名单管理
import apiClient from '../apiClient';

interface ListData {
  current: number;
  user_id: string;
  page_size?: number;
  search?: string;
}
export enum ListApi {
  list = '/list',
  listData = '/list_data',
  uploadApi = '/upload_list',
  downloadApi = '/export_list',
}
/**
 *
 * @param ListData 获取名单名称列表
 * @returns
 */
const getListData = (params: any) => apiClient.get({ url: ListApi.list, params });
/**
 *
 * @param user_id
 * @param list_name
 * @returns 创建名单
 */
const createList = (user_id: string, list_name: string) =>
  apiClient.post({ url: ListApi.list, data: { user_id, list_name } });

/**
 *
 * @param user_id
 * @param list_name
 * @returns 删除名单
 */
const deleteList = (user_id: string, list_id: string) =>
  apiClient.delete({ url: ListApi.list, params: { user_id, list_id } });

// const createListNameData = (user_id: string, list_name: string) =>
//   apiClient.post({ url: ListApi.list, data: { user_id, list_name } });

// /geerule/list_data
const getFromData = (params) => apiClient.get({ url: ListApi.listData, params });

const creatFromData = (params) => apiClient.post({ url: ListApi.listData, data: params });

// 修改
const putFormData = (user_id, data_id, params) =>
  apiClient.put({
    url: ListApi.listData,
    params: { user_id, data_id },
    data: { ...params },
  });

const delFormData = (data_id, user_id) =>
  apiClient.delete({
    url: ListApi.listData,
    params: { data_id, user_id },
  });

// 上传文件附件 /geerule/upload_list

const uploadMethod = (user_id, parmas, data) =>
  apiClient.post({
    url: ListApi.uploadApi,
    params: { user_id, ...parmas },
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
//  批量下载
const downMethod = (user_id, parmas) =>
  apiClient.get({
    url: ListApi.downloadApi,
    params: { user_id, ...parmas },
  });

export default {
  getListData,
  createList,
  deleteList,
  getFromData,
  creatFromData,
  putFormData,
  delFormData,
  uploadMethod,
  downMethod,
};
