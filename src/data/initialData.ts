import { PetSize, ExtraService, Station, DiscountRule } from '../types';

export const petSizes: PetSize[] = [
  { id: 'small', name: '小型犬', basePrice: 60, description: '5kg以下' },
  { id: 'medium', name: '中型犬', basePrice: 100, description: '5-15kg' },
  { id: 'large', name: '大型犬', basePrice: 150, description: '15-30kg' },
  { id: 'cat', name: '猫咪', basePrice: 80, description: '猫咪洗护' },
];

export const extraServices: ExtraService[] = [
  { id: 'nail_trim', name: '指甲修剪', price: 20, description: '指甲修剪与打磨' },
  { id: 'ear_clean', name: '耳道清洁', price: 15, description: '耳道清洁护理' },
  { id: 'med_bath', name: '药浴', price: 50, description: '药用沐浴护理' },
  { id: 'deworming', name: '体外驱虫', price: 40, description: '体外驱虫处理' },
  { id: 'hair_cut', name: '造型修剪', price: 80, description: '毛发造型修剪' },
];

export const stations: Station[] = [
  { id: 'A1', name: 'A1号工位', type: 'wash', status: 'available' },
  { id: 'A2', name: 'A2号工位', type: 'wash', status: 'available' },
  { id: 'B1', name: 'B1号工位', type: 'dry', status: 'available' },
  { id: 'B2', name: 'B2号工位', type: 'dry', status: 'available' },
  { id: 'C1', name: 'C1号工位', type: 'groom', status: 'available' },
  { id: 'C2', name: 'C2号工位', type: 'groom', status: 'available' },
];

export const discountRules: DiscountRule[] = [
  {
    id: 'new_customer',
    name: '新客户9折优惠',
    type: 'percentage',
    value: 10,
    enabled: true,
    description: '新客户首次消费享受9折优惠',
  },
  {
    id: 'threshold_200',
    name: '满200减30',
    type: 'threshold',
    value: 30,
    threshold: 200,
    enabled: true,
    description: '消费满200元立减30元',
  },
  {
    id: 'vip_discount',
    name: 'VIP立减50',
    type: 'fixed',
    value: 50,
    enabled: false,
    description: 'VIP会员消费立减50元',
  },
];

export const BUSINESS_START = '09:00';
export const BUSINESS_END = '21:00';
export const TIME_SLOT_DURATION = 30;
