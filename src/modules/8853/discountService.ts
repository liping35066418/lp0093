import { v4 as uuidv4 } from 'uuid';
import { DiscountRule } from '../../types';
import { dataStore } from './dataStore';

export interface CreateDiscountRuleRequest {
  name: string;
  type: 'percentage' | 'fixed' | 'threshold';
  value: number;
  threshold?: number;
  enabled?: boolean;
  description: string;
}

export class DiscountService {
  getAllRules(): DiscountRule[] {
    return dataStore.getDiscountRules();
  }

  getEnabledRules(): DiscountRule[] {
    return dataStore.getEnabledDiscountRules();
  }

  getRuleById(id: string): DiscountRule | undefined {
    return dataStore.getDiscountRules().find(r => r.id === id);
  }

  createRule(request: CreateDiscountRuleRequest): DiscountRule {
    const rule: DiscountRule = {
      id: uuidv4(),
      name: request.name,
      type: request.type,
      value: request.value,
      threshold: request.threshold,
      enabled: request.enabled !== undefined ? request.enabled : true,
      description: request.description,
    };
    dataStore.addDiscountRule(rule);
    return rule;
  }

  updateRule(id: string, updates: Partial<Omit<DiscountRule, 'id'>>): DiscountRule | null {
    const existing = this.getRuleById(id);
    if (!existing) return null;

    const updated: DiscountRule = {
      ...existing,
      ...updates,
    };

    dataStore.addDiscountRule(updated);
    return updated;
  }

  toggleRuleStatus(id: string): boolean {
    const rule = this.getRuleById(id);
    if (!rule) return false;
    return dataStore.updateDiscountRuleStatus(id, !rule.enabled);
  }

  deleteRule(id: string): boolean {
    return dataStore.deleteDiscountRule(id);
  }
}

export const discountService = new DiscountService();
