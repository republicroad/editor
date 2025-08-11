/*
 * @Date: 2024-04-11 11:36:05
 * @LastEditors: yawen Yang
 * @LastEditTime: 2024-04-22 16:01:55
 * @FilePath: /custom-rules/src/api/services/ruleService.ts
 */
import apiClient from '../apiClient';

import { RuleData, RuleDataType, ruleChartQueryData, ProjectListData } from '#/entity';

export enum RuleApi {
  getRule = '/rule',
  getProject = '/proj',
  getRuleView = '/rule_view',
  log = '/rule_log',
  runTest = '/run',
}

const getRule = (user_id, proj_id, rule_name, current, page_size, rule_id) =>
  apiClient.get<RuleData>({
    url: RuleApi.getRule,
    params: { user_id, proj_id, rule_name, current, page_size, rule_id },
  });
const putRule = (user_id, rule_id, proj_id, params) =>
  apiClient.put<RuleData>({
    url: RuleApi.getRule,
    params: { user_id, rule_id, proj_id },
    data: { ...params },
  });
const delRule = (rule_id, user_id) =>
  apiClient.delete<RuleData>({
    url: RuleApi.getRule,
    params: { rule_id, user_id },
  });
const postRule = (data) =>
  apiClient.post<RuleData>({
    url: RuleApi.getRule,
    data,
  });
const getProject = (user_id) =>
  apiClient.get<RuleDataType[]>({ url: RuleApi.getProject, params: { user_id } });

// 规则数据统计
const getRuleViewData = (params: ruleChartQueryData) =>
  apiClient.get({ url: RuleApi.getRuleView, params });

// 获取日志信息
const getRuleLog = (params: ProjectListData) => apiClient.get({ url: RuleApi.log, params });

// 规则测试页面测试
const runRule = (params, data) => apiClient.post({ url: RuleApi.runTest, data, params });
export default {
  getRule,
  putRule,
  delRule,
  postRule,
  getProject,
  getRuleViewData,
  getRuleLog,
  runRule,
};
