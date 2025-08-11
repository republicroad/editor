import apiClient from '../apiClient';


export enum DemoApi {
  demo_expressions = '/demo_expressions',
}

const demoExpressionsApi = (context_variables: string, evaluate_expressions: string,action_type:string) => apiClient.post({ url: DemoApi.demo_expressions, data: { context_variables, evaluate_expressions,action_type } });

export default {
  demoExpressionsApi,
};
