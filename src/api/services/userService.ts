import apiClient from '../apiClient';

import { UserInfo, UserToken } from '#/entity';

export interface SignInReq {
  username: string;
  password: string;
}
export interface ResetPwdReq {
  username: string;
  password: string;
  captcha: string;
}

export interface SignUpReq extends SignInReq {
  email: string;
}
export type SignInRes = UserToken & { user: UserInfo };

export enum UserApi {
  SignIn = '/login',
  SignUp = '/register',
  Logout = '/logout',
  SentEmail = '/captcha_email',
  ResetPwd = '/reset_pwd',
}

const signin = (data: SignInReq) => apiClient.post<SignInRes>({ url: UserApi.SignIn, data });
const signup = (data: SignUpReq) => apiClient.post<SignInRes>({ url: UserApi.SignUp, data });
const logout = () => apiClient.get({ url: UserApi.Logout });
const sentCode = (username: string) =>
  apiClient.post({ url: `${UserApi.SentEmail}`, data: { username } });
const resetPwd = (data: ResetPwdReq) => apiClient.post({ url: UserApi.ResetPwd, data });

export default {
  signin,
  signup,
  sentCode,
  logout,
  resetPwd,
};
