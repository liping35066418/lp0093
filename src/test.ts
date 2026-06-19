import { petSizes, extraServices, stations, discountRules } from './data/initialData';
import { bookingService } from './modules/8853/bookingService';
import { billingService } from './modules/8853/billingService';
import { discountService } from './modules/8853/discountService';
import { generateTimeSlots, checkTimeOverlap, formatDate } from './modules/8853/timeUtils';

let testOutput = '';

function log(message: string): void {
  console.log(message);
  testOutput += message + '\n';
}

function logTest(name: string, passed: boolean, actual?: string, expected?: string): void {
  const status = passed ? '✅' : '❌';
  let msg = `${status} ${name}`;
  if (actual !== undefined && expected !== undefined) {
    msg += `\n   期望: ${expected}\n   实际: ${actual}`;
  }
  console.log(msg);
  testOutput += msg + '\n';
}

async function runTests(): Promise<void> {
  log('');
  log('========== 宠物洗护门店系统 - 后端逻辑测试 ==========');
  log('');

  log('1. 基础数据加载测试');
  log(`   宠物体型: ${petSizes.length} 种`);
  log(`   附加服务: ${extraServices.length} 项`);
  log(`   工位数: ${stations.length} 个`);
  log(`   折扣规则: ${discountRules.length} 条`);
  log('');

  log('2. 工位时段可用性格式测试');
  const slots = generateTimeSlots();
  log(`   A1号工位 今日时段总数: ${slots.length}`);
  log(`   首个时段: ${slots[0].startTime} - ${slots[0].endTime}`);
  log(`   末个时段: ${slots[slots.length - 1].startTime} - ${slots[slots.length - 1].endTime}`);
  const allAvailable = slots.every(s => s.available);
  logTest('   所有时段初始均可用', allAvailable, allAvailable ? '是' : '否', '是');
  log('');

  log('3. 时段冲突检测测试');
  const conflict1 = checkTimeOverlap('10:00', '11:00', '10:30', '11:30');
  logTest('   10:00-11:00 与 10:30-11:30 冲突', conflict1, conflict1 ? '是' : '否', '是');
  
  const conflict2 = checkTimeOverlap('10:00', '11:00', '11:00', '12:00');
  logTest('   10:00-11:00 与 11:00-12:00 冲突', !conflict2, !conflict2 ? '否' : '是', '否');
  log('');

  log('4. 创建预约测试');
  const today = formatDate(new Date());
  const bookingResult = bookingService.createBooking({
    stationId: 'A1',
    petName: '旺财',
    petSizeId: 'medium',
    extraServiceIds: ['nail_trim', 'ear_clean'],
    startTime: '10:00',
    endTime: '12:00',
    date: today,
    customerName: '张三',
    customerPhone: '13800138000',
  });
  
  logTest('   创建预约', bookingResult.success, bookingResult.success ? '成功' : '失败', '成功');
  
  if (bookingResult.booking) {
    log(`   预约ID: ${bookingResult.booking.id.substring(0, 8)} ...`);
    log(`   宠物: ${bookingResult.booking.petName} (${bookingResult.booking.petSizeId})`);
    log(`   时段: ${bookingResult.booking.startTime} - ${bookingResult.booking.endTime}`);
  }
  log('');

  log('5. 时段冲突校验测试（重复预约相同时段）');
  const conflictBooking = bookingService.createBooking({
    stationId: 'A1',
    petName: '豆豆',
    petSizeId: 'small',
    extraServiceIds: [],
    startTime: '10:30',
    endTime: '11:30',
    date: today,
    customerName: '李四',
    customerPhone: '13900139000',
  });
  
  logTest('   创建冲突预约', !conflictBooking.success, 
    conflictBooking.success ? '未拦截' : '正确拦截', '正确拦截');
  log(`   提示信息: ${conflictBooking.error}`);
  log('');

  log('6. 工位可用性更新测试');
  const occupiedCount = bookingService.getOccupiedSlotCount('A1', today);
  log(`   预约后 A1号工位 占用时段数: ${occupiedCount} 个`);
  log('');

  log('7. 账单计算测试 - 中型犬基础洗护 + 2项附加服务 + 9折优惠');
  const enabledRules = discountService.getEnabledRules();
  log(`   启用中的折扣规则: ${enabledRules.length} 条`);
  
  const billCalc = billingService.calculateBill({
    bookingId: bookingResult.booking?.id || 'test',
    petSizeId: 'medium',
    extraServiceIds: ['nail_trim', 'ear_clean'],
  });
  
  logTest('   账单生成', billCalc.items.length > 0, billCalc.items.length > 0 ? '成功' : '失败', '成功');
  
  log(`   基础洗护费: ¥${billCalc.items[0]?.price.toFixed(2) || '0.00'}`);
  const extraTotal = billCalc.items.slice(1).reduce((sum, item) => sum + item.price, 0);
  log(`   附加服务费: ¥${extraTotal.toFixed(2)}`);
  log(`   小计: ¥${billCalc.subtotal.toFixed(2)}`);
  
  if (billCalc.discounts.length > 0) {
    billCalc.discounts.forEach(d => {
      log(`   折扣 (${d.ruleName}): -¥${d.discountAmount.toFixed(2)}`);
    });
  }
  log(`   实付金额: ¥${billCalc.totalAmount.toFixed(2)}`);
  
  log(`   服务明细:`);
  billCalc.items.forEach(item => {
    log(`     - ${item.name}: ¥${item.price.toFixed(2)}`);
  });
  log('');

  log('8. 账单快速核算测试（不同组合）');
  const calc1 = billingService.quickCalculate('small', []);
  log(`   小型犬 - 基础洗护: ¥${calc1.toFixed(2)}`);
  
  const calc2 = billingService.quickCalculate('large', ['med_bath', 'deworming']);
  log(`   大型犬 - 基础洗护+药浴+体外驱虫: ¥${calc2.toFixed(2)}`);
  
  const calc3 = billingService.quickCalculate('cat', ['nail_trim']);
  log(`   猫咪 - 基础洗护+指甲修剪: ¥${calc3.toFixed(2)}`);
  log('');

  log('9. 折扣规则管理测试');
  const allRules = discountService.getAllRules();
  log(`   规则总数: ${allRules.length}`);
  allRules.forEach(rule => {
    const status = rule.enabled ? '启用' : '停用';
    log(`     - ${rule.name} [${status}]`);
  });
  log('');

  log('10. 今日营收看板测试');
  const revenueBefore = billingService.getDailyRevenue(today);
  log(`   支付前 - 已收金额: ¥${revenueBefore.totalRevenue.toFixed(2)}`);
  log(`   支付前 - 已结单数: ${revenueBefore.paidCount}`);
  log(`   支付前 - 平均客单价: ¥${revenueBefore.avgOrderValue.toFixed(2)}`);
  logTest('   无已支付账单时已结单数为0', revenueBefore.paidCount === 0, 
    revenueBefore.paidCount.toString(), '0');
  logTest('   无已支付账单时平均客单价为0', revenueBefore.avgOrderValue === 0, 
    revenueBefore.avgOrderValue.toFixed(2), '0.00');
  
  const testBill = billingService.createBill(
    bookingResult.booking?.id || 'test-booking',
    'medium',
    ['nail_trim', 'ear_clean']
  );
  log(`   创建测试账单: #${testBill.id.substring(0, 8)}，金额: ¥${testBill.totalAmount.toFixed(2)}`);
  
  billingService.markBillAsPaid(testBill.id);
  log('   标记账单为已支付');
  
  const revenueAfter = billingService.getDailyRevenue(today);
  log(`   支付后 - 已收金额: ¥${revenueAfter.totalRevenue.toFixed(2)}`);
  log(`   支付后 - 已结单数: ${revenueAfter.paidCount}`);
  log(`   支付后 - 平均客单价: ¥${revenueAfter.avgOrderValue.toFixed(2)}`);
  
  logTest('   支付后已结单数为1', revenueAfter.paidCount === 1, 
    revenueAfter.paidCount.toString(), '1');
  logTest('   支付后已收金额等于账单金额', revenueAfter.totalRevenue === testBill.totalAmount,
    `¥${revenueAfter.totalRevenue.toFixed(2)}`, `¥${testBill.totalAmount.toFixed(2)}`);
  logTest('   平均客单价等于已收金额/已结单数', 
    Math.abs(revenueAfter.avgOrderValue - revenueAfter.totalRevenue / revenueAfter.paidCount) < 0.01,
    `¥${revenueAfter.avgOrderValue.toFixed(2)}`, 
    `¥${(revenueAfter.totalRevenue / revenueAfter.paidCount).toFixed(2)}`);
  log('');

  log('11. 已取消预约账单不计入营收测试');
  const cancelledBooking = bookingService.createBooking({
    stationId: 'A2',
    petName: '取消测试',
    petSizeId: 'small',
    extraServiceIds: [],
    startTime: '14:00',
    endTime: '15:00',
    date: today,
    customerName: '测试用户',
    customerPhone: '13000000000',
  });
  
  if (cancelledBooking.booking) {
    const cancelledBill = billingService.createBill(
      cancelledBooking.booking.id,
      'small',
      []
    );
    billingService.markBillAsPaid(cancelledBill.id);
    log(`   创建已支付账单（对应待取消预约）: ¥${cancelledBill.totalAmount.toFixed(2)}`);
    
    const revenueBeforeCancel = billingService.getDailyRevenue(today);
    log(`   取消预约前 - 已结单数: ${revenueBeforeCancel.paidCount}`);
    
    bookingService.updateBookingStatus(cancelledBooking.booking.id, 'cancelled');
    log('   取消对应预约');
    
    const revenueAfterCancel = billingService.getDailyRevenue(today);
    log(`   取消预约后 - 已结单数: ${revenueAfterCancel.paidCount}`);
    
    logTest('   取消预约后已结单数减少', 
      revenueAfterCancel.paidCount < revenueBeforeCancel.paidCount,
      `${revenueAfterCancel.paidCount}单`, `${revenueBeforeCancel.paidCount - 1}单`);
  }
  log('');

  log('12. 数据一致性测试 - 营收看板与账单列表汇总一致');
  const bills = billingService.getBillsByDate(today);
  const paidBillsFromList = bills.filter(bill => {
    if (bill.status !== 'paid') return false;
    const booking = bookingService.getBooking(bill.bookingId);
    return !booking || booking.status !== 'cancelled';
  });
  
  const totalFromList = paidBillsFromList.reduce((sum, b) => sum + b.totalAmount, 0);
  const revenueFromApi = billingService.getDailyRevenue(today);
  
  logTest('   营收金额与账单列表汇总一致', 
    Math.abs(totalFromList - revenueFromApi.totalRevenue) < 0.01,
    `看板: ¥${revenueFromApi.totalRevenue.toFixed(2)}, 列表合计: ¥${totalFromList.toFixed(2)}`,
    '两者相等');
  logTest('   已结单数与账单列表数一致', 
    paidBillsFromList.length === revenueFromApi.paidCount,
    `看板: ${revenueFromApi.paidCount}单, 列表: ${paidBillsFromList.length}单`,
    '两者相等');
  log('');

  log('========== 测试完成 ==========');
  log('');

  const fs = require('fs');
  fs.writeFileSync('/Volumes/代码/solo/lp0093/test_output.txt', testOutput);
}

runTests().catch(console.error);
