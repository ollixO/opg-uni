// 国际化语言管理工具
class I18n {
  constructor() {
    this.currentLanguage = '简体中文';
    this.listeners = []; // 事件监听器数组
    this.translations = {
      '简体中文': {
        // 通用
        'loading': '加载中...',
        'success': '成功',
        'error': '错误',
        'confirm': '确认',
        'cancel': '取消',
        'ok': '确定',
        'back': '返回',
        'save': '保存',
        'delete': '删除',
        'edit': '编辑',
        'add': '添加',
        'search': '搜索',
        'refresh': '刷新',
        
        // 导航和菜单
        'home': '首页',
        'node_subscription': '节点认购',
        'invite_friends': '邀请好友',
        'profile': '个人中心',
        'recharge': '充值',
        'records': '记录',
        
        // 钱包相关
        'connect_wallet': '连接钱包',
        'wallet_connected': '钱包连接成功',
        'wallet_disconnected': '钱包未连接',
        'current_balance': '当前余额',
        'recharge_amount': '充值金额',
        'min_amount': '最低金额',
        'buy_now': '立即购买',
        'recharge_success': '充值成功',
        'recharge_failed': '充值失败',
        
        // 节点认购
        'node_subscription_title': '节点认购',
        'v1_node': 'v1节点',
        'v2_node': 'v2节点',
        'v3_node': 'v3节点',
        'basic_node': '基础节点',
        'genesis_node': '创世节点',
        'super_node': '超级节点',
        'subscription_success': '认购成功',
        'subscription_failed': '认购失败',
        'confirm_subscription': '确认认购',
        'subscription_processing': '认购中...',
        
        // 邀请好友
        'invite_friends_title': '邀请好友',
        'invite_link': '邀请链接',
        'copy_link': '复制链接',
        'link_copied': '邀请链接已复制',
        
        // 大厅相关
        'lobby': '大厅',
        'open_time': '开放时间',
        'minutes_per_session': '分钟/次',
        'remaining_quota': '剩余额度',
        'open': '开放',
        'minutes': '分钟',
        
        // 用户级别
        'current_level': '当前级别',
        'level_loading': '级别加载中...',
        
        // 错误信息
        'network_error': '网络连接失败',
        'operation_failed': '操作失败',
        'please_try_again': '请重试',
        'feature_coming_soon': '功能开发中',
        'login_expired': '登录已过期，请重新登录',
        
        // 提示信息
        'please_connect_wallet': '请先连接钱包',
        'please_enter_valid_amount': '请输入有效金额',
        'transaction_success': '交易成功',
        'transaction_failed': '交易失败',
        'insufficient_balance': '余额不足',
        'gas_fee_required': '需要支付gas费',
        'ensure_network_stable': '请确保网络稳定'
      },
      'English': {
        // 通用
        'loading': 'Loading...',
        'success': 'Success',
        'error': 'Error',
        'confirm': 'Confirm',
        'cancel': 'Cancel',
        'ok': 'OK',
        'back': 'Back',
        'save': 'Save',
        'delete': 'Delete',
        'edit': 'Edit',
        'add': 'Add',
        'search': 'Search',
        'refresh': 'Refresh',
        
        // 导航和菜单
        'home': 'Home',
        'node_subscription': 'Node Subscription',
        'invite_friends': 'Invite Friends',
        'profile': 'Profile',
        'recharge': 'Recharge',
        'records': 'Records',
        
        // 钱包相关
        'connect_wallet': 'Connect Wallet',
        'wallet_connected': 'Wallet Connected',
        'wallet_disconnected': 'Wallet Disconnected',
        'current_balance': 'Current Balance',
        'recharge_amount': 'Recharge Amount',
        'min_amount': 'Minimum Amount',
        'buy_now': 'Buy Now',
        'recharge_success': 'Recharge Success',
        'recharge_failed': 'Recharge Failed',
        
        // 节点认购
        'node_subscription_title': 'Node Subscription',
        'v1_node': 'v1 Node',
        'v2_node': 'v2 Node',
        'v3_node': 'v3 Node',
        'basic_node': 'Basic Node',
        'genesis_node': 'Genesis Node',
        'super_node': 'Super Node',
        'subscription_success': 'Subscription Success',
        'subscription_failed': 'Subscription Failed',
        'confirm_subscription': 'Confirm Subscription',
        'subscription_processing': 'Processing...',
        
        // 邀请好友
        'invite_friends_title': 'Invite Friends',
        'invite_link': 'Invite Link',
        'copy_link': 'Copy Link',
        'link_copied': 'Link Copied',
        
        // 大厅相关
        'lobby': 'Lobby',
        'open_time': 'Open Time',
        'minutes_per_session': 'Minutes/Session',
        'remaining_quota': 'Remaining Quota',
        'open': 'Open',
        'minutes': 'Minutes',
        
        // 用户级别
        'current_level': 'Current Level',
        'level_loading': 'Loading Level...',
        
        // 错误信息
        'network_error': 'Network Connection Failed',
        'operation_failed': 'Operation Failed',
        'please_try_again': 'Please Try Again',
        'feature_coming_soon': 'Feature Coming Soon',
        'login_expired': 'Login Expired, Please Login Again',
        
        // 提示信息
        'please_connect_wallet': 'Please Connect Wallet First',
        'please_enter_valid_amount': 'Please Enter Valid Amount',
        'transaction_success': 'Transaction Success',
        'transaction_failed': 'Transaction Failed',
        'insufficient_balance': 'Insufficient Balance',
        'gas_fee_required': 'Gas Fee Required',
        'ensure_network_stable': 'Please Ensure Network Stable'
      }
    };
    
    this.init();
  }
  
  // 初始化
  init() {
    const savedLanguage = uni.getStorageSync('app_language');
    if (savedLanguage) {
      this.currentLanguage = savedLanguage;
    }
  }
  
  // 获取翻译文本
  t(key) {
    const translation = this.translations[this.currentLanguage];
    return translation && translation[key] ? translation[key] : key;
  }
  
  // 设置语言
  setLanguage(language) {
    this.currentLanguage = language;
    uni.setStorageSync('app_language', language);
  }
  
  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  // 切换语言
  toggleLanguage() {
    console.log('i18n.toggleLanguage 被调用，当前语言:', this.currentLanguage);
    const newLanguage = this.currentLanguage === '简体中文' ? 'English' : '简体中文';
    console.log('准备切换到:', newLanguage);
    
    this.setLanguage(newLanguage);
    console.log('语言设置完成，当前语言:', this.currentLanguage);
    
    // 触发自定义事件系统
    console.log('准备触发事件，监听器数量:', this.listeners['languageChanged'] ? this.listeners['languageChanged'].length : 0);
    this.emit('languageChanged', newLanguage);
    console.log('事件触发完成');
    
    return newLanguage;
  }
  
  // 添加事件监听器
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  // 移除事件监听器
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }
  
  // 触发事件
  emit(event, data) {
    console.log(`触发事件 ${event}，数据:`, data);
    if (this.listeners[event]) {
      console.log(`找到 ${this.listeners[event].length} 个监听器`);
      this.listeners[event].forEach((callback, index) => {
        try {
          console.log(`执行监听器 ${index + 1}`);
          callback(data);
          console.log(`监听器 ${index + 1} 执行完成`);
        } catch (error) {
          console.error(`监听器 ${index + 1} 执行错误:`, error);
        }
      });
    } else {
      console.log(`没有找到事件 ${event} 的监听器`);
    }
  }
  
  // 检查是否为中文
  isChinese() {
    return this.currentLanguage === '简体中文';
  }
  
  // 检查是否为英文
  isEnglish() {
    return this.currentLanguage === 'English';
  }
}

// 创建全局实例
const i18n = new I18n();
// 初始化实例
i18n.init();

// 导出实例和类
export default i18n;
export { I18n };
