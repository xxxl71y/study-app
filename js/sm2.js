/**
 * SM-2 间隔重复算法
 * 基于 SuperMemo 2 算法实现
 * 
 * 评分等级:
 * 0 - 忘记了 (完全不记得)
 * 1 - 有点难 (想了很久才想起来，或者记错了)
 * 2 - 还不错 (想了一会想起来了)
 * 3 - 太简单 (一眼就认出来了)
 */

const SM2 = {
    /**
     * 计算下次复习间隔
     * @param {Object} card - 卡片数据
     * @param {number} quality - 评分 (0-3)
     * @returns {Object} 更新后的卡片数据
     */
    calculate(card, quality) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        // 初始化新卡片
        if (!card.easinessFactor) card.easinessFactor = 2.5;
        if (!card.interval) card.interval = 0;
        if (!card.repetitions) card.repetitions = 0;
        if (!card.status) card.status = 'new'; // new, learning, mastered
        if (card.status === 'new') card.status = 'learning';

        if (quality < 1) {
            // 忘记了，重置
            card.repetitions = 0;
            card.interval = 0; // 当天重新学习
            card.status = 'learning';
            card.lapses = (card.lapses || 0) + 1;
        } else {
            // 更新 EF (easiness factor)
            // SM-2 公式: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
            // 我们将 quality 从 0-3 映射到 2-5
            const q = quality + 2; // 2, 3, 4, 5
            card.easinessFactor = card.easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
            
            // EF 最低为 1.3
            if (card.easinessFactor < 1.3) card.easinessFactor = 1.3;
            
            card.repetitions += 1;
            
            // 计算间隔
            if (card.repetitions === 1) {
                card.interval = 1; // 1 天
            } else if (card.repetitions === 2) {
                card.interval = 3; // 3 天
            } else {
                card.interval = Math.round(card.interval * card.easinessFactor);
            }
            
            // 根据评分调整间隔
            if (quality === 1) {
                // 有点难，间隔缩短
                card.interval = Math.max(1, Math.round(card.interval * 0.6));
            } else if (quality === 3) {
                // 太简单，间隔加长
                card.interval = Math.round(card.interval * 1.3);
            }
            
            // 如果连续答对多次，标记为已掌握
            if (card.repetitions >= 5 && card.easinessFactor >= 2.5 && card.interval >= 21) {
                card.status = 'mastered';
            }
        }
        
        // 计算下次复习日期
        const nextReview = new Date(today + card.interval * 24 * 60 * 60 * 1000);
        card.nextReview = nextReview.getTime();
        card.lastReview = today;
        
        return card;
    },

    /**
     * 获取下次复习的间隔天数描述
     */
    getNextIntervalText(card, quality) {
        const tempCard = { ...card };
        const result = this.calculate(tempCard, quality);
        const days = result.interval;
        
        if (days === 0) return '今天';
        if (days === 1) return '明天';
        if (days < 7) return `${days}天`;
        if (days < 30) return `${Math.round(days / 7)}周`;
        return `${Math.round(days / 30)}月`;
    },

    /**
     * 检查卡片是否今天需要复习
     */
    isDueToday(card) {
        if (!card.nextReview) return true; // 新卡片随时可以学
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const tomorrow = today + 24 * 60 * 60 * 1000;
        return card.nextReview < tomorrow;
    },

    /**
     * 检查卡片是否到期（包括过期的）
     */
    isDue(card) {
        if (!card.nextReview) return true;
        const now = Date.now();
        return card.nextReview <= now;
    }
};
