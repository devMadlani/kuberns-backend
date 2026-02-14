import { PlansRepository } from './plans.repository';

export class PlansService {
  constructor(private readonly plansRepository: PlansRepository) {}

  public getPlans() {
    return this.plansRepository.getPlans();
  }
}
