export const allowedPlans = ['starter', 'pro'] as const;

export type PlanId = (typeof allowedPlans)[number];

export type PlanConfig = {
  id: PlanId;
  name: string;
  storage: string;
  bandwidth: string;
  memory: string;
  cpu: string;
  monthlyCost: string;
  pricePerHour: string;
  description: string;
  resources: {
    cpu: number;
    ram: number;
    storage: number;
    instanceType: string;
  };
};

export const planConfigs: Record<PlanId, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    storage: '10 GB',
    bandwidth: '10 GB',
    memory: '1024 MB',
    cpu: '1 vCPU',
    monthlyCost: '$0',
    pricePerHour: '$0',
    description: 'Ideal for personal blogs and small websites',
    resources: {
      cpu: 1,
      ram: 1024,
      storage: 10,
      instanceType: 't2.micro',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    storage: '50 GB',
    bandwidth: '100 GB',
    memory: '4096 MB',
    cpu: '2 vCPU',
    monthlyCost: '$29',
    pricePerHour: '$0.04',
    description: 'Perfect for growing businesses and applications',
    resources: {
      cpu: 2,
      ram: 4096,
      storage: 50,
      instanceType: 't3.medium',
    },
  },
};
