/**
 * 统计与可视化模块
 * 热力图、记忆曲线、掌握度趋势等
 */

const Stats = {
    /**
     * 渲染学习热力图
     */
    renderHeatmap(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const streakDates = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        const dateSet = new Set(streakDates);

        // 生成最近 12 周的数据
        const weeks = 12;
        const days = weeks * 7;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 计算从几周前开始
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days + 1);
        // 调整到周日
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        let html = '';
        let currentDate = new Date(startDate);
        let weekHtml = '';
        let weekCount = 0;

        // 计算每天的学习量（用打卡记录 + 学习单词数）
        const learnedData = {};
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = this.formatDate(d);
            const key = `learned_${dateStr}`;
            const count = parseInt(localStorage.getItem(key) || '0');
            if (count > 0) learnedData[dateStr] = count;
        }

        while (currentDate <= today) {
            const dateStr = this.formatDate(currentDate);
            const count = learnedData[dateStr] || 0;
            const level = this.getHeatLevel(count);
            
            weekHtml += `<div class="heatmap-cell level-${level}" title="${dateStr}: ${count}个单词"></div>`;
            
            if (currentDate.getDay() === 6) { // 周六
                html += `<div class="heatmap-week">${weekHtml}</div>`;
                weekHtml = '';
                weekCount++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 最后一周不满的也要加上
        if (weekHtml) {
            html += `<div class="heatmap-week">${weekHtml}</div>`;
        }

        container.innerHTML = html;
    },

    /**
     * 根据学习量返回热力等级 (0-4)
     */
    getHeatLevel(count) {
        if (count === 0) return 0;
        if (count < 10) return 1;
        if (count < 30) return 2;
        if (count < 60) return 3;
        return 4;
    },

    /**
     * 渲染掌握度趋势图（简易 canvas 绘制）
     */
    renderMasteryChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // 生成最近 30 天的模拟数据（实际应该从存储中读取）
        const days = 30;
        const data = [];
        const today = new Date();
        
        // 从 localStorage 中读取历史掌握度数据，如果没有则生成
        const masteryHistory = JSON.parse(localStorage.getItem('mastery_history') || '[]');
        
        // 取最近30天
        const recentHistory = masteryHistory.slice(-days);
        
        // 补全到30天
        while (recentHistory.length < days) {
            recentHistory.unshift({ mastered: 0, total: 100, ratio: 0 });
        }

        const maxVal = 100; // 百分比

        // 绘制网格线
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            // Y轴标签
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${100 - i * 25}%`, padding.left - 5, y + 3);
        }

        // 绘制曲线
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.05)');

        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);
        
        recentHistory.forEach((d, i) => {
            const x = padding.left + (chartWidth / (days - 1)) * i;
            const y = padding.top + chartHeight * (1 - d.ratio / 100);
            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // 绘制线条
        ctx.beginPath();
        recentHistory.forEach((d, i) => {
            const x = padding.left + (chartWidth / (days - 1)) * i;
            const y = padding.top + chartHeight * (1 - d.ratio / 100);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.stroke();

        // X轴标签（只显示几个日期）
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < 5; i++) {
            const idx = Math.floor((days - 1) / 4 * i);
            const x = padding.left + (chartWidth / (days - 1)) * idx;
            const d = new Date(today);
            d.setDate(d.getDate() - (days - 1 - idx));
            ctx.fillText(`${d.getMonth() + 1}/${d.getDate()}`, x, height - 10);
        }
    },

    /**
     * 更新今日掌握度记录
     */
    async updateMasteryHistory() {
        const settings = Storage.getSettings();
        const stats = await Storage.getStats(settings.currentPackage);
        const ratio = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
        
        const today = this.formatDate(new Date());
        const history = JSON.parse(localStorage.getItem('mastery_history') || '[]');
        
        // 更新或添加今天的记录
        const lastEntry = history[history.length - 1];
        if (lastEntry && lastEntry.date === today) {
            lastEntry.mastered = stats.mastered;
            lastEntry.total = stats.total;
            lastEntry.ratio = ratio;
        } else {
            history.push({
                date: today,
                mastered: stats.mastered,
                total: stats.total,
                ratio: ratio
            });
        }
        
        // 只保留最近90天
        if (history.length > 90) {
            history.splice(0, history.length - 90);
        }
        
        localStorage.setItem('mastery_history', JSON.stringify(history));
    },

    /**
     * 获取即将到来的复习计划
     */
    async getUpcomingReviews(packageId, days = 7) {
        const cards = await Storage.getCardsByPackage(packageId);
        const result = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);
            result[dateStr] = { date: dateStr, count: 0, label: i === 0 ? '今天' : i === 1 ? '明天' : `${date.getMonth() + 1}/${date.getDate()}` };
        }

        cards.forEach(card => {
            if (!card.nextReview) return;
            const reviewDate = new Date(card.nextReview);
            reviewDate.setHours(0, 0, 0, 0);
            const dateStr = this.formatDate(reviewDate);
            
            if (result[dateStr]) {
                result[dateStr].count++;
            }
        });

        return Object.values(result);
    },

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 计算平均正确率
     */
    async getAverageAccuracy() {
        const records = await Storage.getQuizRecords(20);
        if (records.length === 0) return 0;
        
        const total = records.reduce((sum, r) => sum + r.percentage, 0);
        return Math.round(total / records.length);
    },

    /**
     * 获取累计学习天数
     */
    getTotalDays() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        return streak.length;
    },

    /**
     * 获取累计学习单词数
     */
    getTotalLearned() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        let total = 0;
        streak.forEach(date => {
            const key = `learned_${date}`;
            total += parseInt(localStorage.getItem(key) || '0');
        });
        return total;
    }
};
