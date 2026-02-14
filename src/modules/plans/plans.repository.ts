import { planConfigs } from '../../config/plans';

export class PlansRepository {
  public getPlans() {
    return Object.values(planConfigs).map(({ resources, ...plan }) => plan);
  }
}
