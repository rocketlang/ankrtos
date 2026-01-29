/**
 * Repository Registry — optional database backend swap for engines
 */

import type { ContainerRepository } from './repositories/container.repository';
import type { GateRepository } from './repositories/gate.repository';
import type { RailRepository } from './repositories/rail.repository';
import type { BillingRepository } from './repositories/billing.repository';
import type { CustomsRepository } from './repositories/customs.repository';
import type { FacilityRepository } from './repositories/facility.repository';

export interface RepositoryMap {
  container?: ContainerRepository;
  gate?: GateRepository;
  rail?: RailRepository;
  billing?: BillingRepository;
  customs?: CustomsRepository;
  facility?: FacilityRepository;
}

let registryInstance: RepositoryMap = {};

export function getRepository<K extends keyof RepositoryMap>(name: K): RepositoryMap[K] | undefined {
  return registryInstance[name];
}

export function registerRepository<K extends keyof RepositoryMap>(
  name: K,
  repo: RepositoryMap[K],
): void {
  registryInstance[name] = repo;
}

export function registerAllRepositories(): RepositoryMap {
  const { ContainerRepository } = require('./repositories/container.repository');
  const { GateRepository } = require('./repositories/gate.repository');
  const { RailRepository } = require('./repositories/rail.repository');
  const { BillingRepository } = require('./repositories/billing.repository');
  const { CustomsRepository } = require('./repositories/customs.repository');
  const { FacilityRepository } = require('./repositories/facility.repository');

  registryInstance = {
    container: new ContainerRepository(),
    gate: new GateRepository(),
    rail: new RailRepository(),
    billing: new BillingRepository(),
    customs: new CustomsRepository(),
    facility: new FacilityRepository(),
  };
  return registryInstance;
}

export function clearRepositories(): void {
  registryInstance = {};
}
