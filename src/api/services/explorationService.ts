import apiClient from '../apiClient';

export enum Api {
  getTag = '/get_tag',
  getDetail = '/tag_detail',
}

const getTag = (user_id, proj_id) =>
  apiClient.get({
    url: Api.getTag,
    params: { user_id, proj_id },
  });

const getDetail = (data) =>
  apiClient.post({
    url: Api.getDetail,
    data,
  });

export default {
  getTag,
  getDetail,
};
