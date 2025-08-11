/**
 * 项目管理相关接口
 */

import apiClient from '../apiClient';

import { ProjectListData } from '#/entity';

export enum ProjApi {
  projectAPI = '/proj',
  validateApi = '/proj_msg',
}
/**
 *
 * @param params ProjectListData
 * @returns 获取当前项目列表
 */
const getProject = (params: ProjectListData) => apiClient.get({ url: ProjApi.projectAPI, params });

/**
 *
 * @param user_id
 * @param proj_name 项目名称
 * @returns 创建新项目
 */
const createProject = (user_id: string, proj_name: string) =>
  apiClient.post({ url: ProjApi.projectAPI, data: { user_id, proj_name } });

/**
 *
 * @param proj_id 项目id
 * @returns 删除项目
 */
const deleteProject = (proj_id: string, user_id: string) =>
  apiClient.delete({ url: ProjApi.projectAPI, params: { proj_id, user_id } });

/**
 * 通过project ID 或者当前user_key & 在有运行的规则
 */

const getProjectRule = (proj_id: string, user_id: string) =>
  apiClient.get({ url: ProjApi.validateApi, params: { proj_id, user_id } });

export default { getProject, createProject, deleteProject, getProjectRule };
