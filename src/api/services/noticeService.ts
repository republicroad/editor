/*
 * @Date: 2024-11-19 10:20:10
 * @LastEditors: yawen Yang
 * @LastEditTime: 2024-12-17 12:03:59
 * @FilePath: /custom-rules/src/api/services/noticeService.ts
 */
// 通知管理
import apiClient from '../apiClient';

import { EmailData, EmailSearchData } from '#/entity';

export enum NoticeApi {
  email = '/email_info',
  feishu = '/feishu_info',
  dingtalk = '/dingtalk_info',
  webhook = '/webhook_info',
}
/**
 *
 * @param user_id
 * @param list_name
 * @returns 创建邮箱
 */
const createEmail = (params: EmailData) => apiClient.post({ url: NoticeApi.email, data: params });

const getEmailData = (params: EmailSearchData) => apiClient.get({ url: NoticeApi.email, params });
// 修改
const putEmailData = (user_id, id, params: EmailData) =>
  apiClient.put({
    url: NoticeApi.email,
    params: { user_id, id },
    data: { ...params },
  });
const delEamilData = (id, user_id) =>
  apiClient.delete({
    url: NoticeApi.email,
    params: { id, user_id },
  });

// 飞书
const createFeishu = (params) => apiClient.post({ url: NoticeApi.feishu, data: params });
const getFeishuData = (params) => apiClient.get({ url: NoticeApi.feishu, params });
const putFeishuData = (user_id, id, params) =>
  apiClient.put({
    url: NoticeApi.feishu,
    params: { user_id, id },
    data: { ...params },
  });
const delFeishuData = (id, user_id) =>
  apiClient.delete({
    url: NoticeApi.feishu,
    params: { id, user_id },
  });

// 钉钉
const createDingtalk = (params) => apiClient.post({ url: NoticeApi.dingtalk, data: params });
const getDingtalkData = (params) => apiClient.get({ url: NoticeApi.dingtalk, params });
const putDingtalkData = (user_id, id, params) =>
  apiClient.put({
    url: NoticeApi.dingtalk,
    params: { user_id, id },
    data: { ...params },
  });
const delDingtalkData = (id, user_id) =>
  apiClient.delete({
    url: NoticeApi.dingtalk,
    params: { id, user_id },
  });

// webhook
const createWebhook = (params) => apiClient.post({ url: NoticeApi.webhook, data: params });

const getWebhookData = (params) => apiClient.get({ url: NoticeApi.webhook, params });
const putWebhookData = (user_id, id, params) =>
  apiClient.put({
    url: NoticeApi.webhook,
    params: { user_id, id },
    data: { ...params },
  });
const delWebhookData = (id, user_id) =>
  apiClient.delete({
    url: NoticeApi.webhook,
    params: { id, user_id },
  });

export default {
  createEmail,
  getEmailData,
  putEmailData,
  delEamilData,
  createFeishu,
  getFeishuData,
  putFeishuData,
  delFeishuData,
  createDingtalk,
  getDingtalkData,
  putDingtalkData,
  delDingtalkData,
  createWebhook,
  getWebhookData,
  putWebhookData,
  delWebhookData,
};
