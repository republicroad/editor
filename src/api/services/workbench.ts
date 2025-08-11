/*
 * @Date: 2024-03-22 14:53:08
 * @LastEditors: xxx
 * @LastEditTime: 2025-01-08 09:38:55
 * @FilePath: /custom-rules/src/api/services/workbench.ts
 */
import { DecisionGraphType } from '@gorules/jdm-editor';
import { Simulation } from '@gorules/jdm-editor';

import apiClient from '../apiClient';

export interface RuleReq {
  content: DecisionGraphType;
  context: unknown;
  user_id: string;
}

export enum Workbench {
  getFunction = '/func',
  getGraph = '/run_debug',
  getCustomFunction = '/func_v2',
}

const runRule = (data: RuleReq) => apiClient.post<Simulation>({ url: Workbench.getGraph, data });
const getFunction = (user_id) =>
  apiClient.get<[]>({ url: Workbench.getFunction, params: { user_id } });
const getCustomFunction = (user_id) =>
  apiClient.get<[]>({ url: Workbench.getCustomFunction, params: { user_id } });
const getGraph = (user_id, rule_id) =>
  apiClient.get<{ context; content }>({ url: Workbench.getGraph, params: { user_id, rule_id } });

export default {
  runRule,
  getCustomFunction,
  getFunction,
  getGraph,
};
