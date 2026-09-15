/**
 * 本地存储模块
 * 使用 IndexedDB 存储学习数据，localStorage 存储配置
 */

const DB_NAME = 'StudyAppDB';
const DB_VERSION = 1;

const Storage = {
    db: null,

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 卡片进度表
                if (!db.objectStoreNames.contains('cards')) {
                    const store = db.createObjectStore('cards', { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('nextReview', 'nextReview', { unique: false });
                    store.createIndex('packageId', 'packageId', { unique: false });
                }
                
                // 学习记录表
                if (!db.objectStoreNames.contains('studyLogs')) {
                    const store = db.createObjectStore('studyLogs', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('packageId', 'packageId', { unique: false });
                }
                
                // 测验记录表
                if (!db.objectStoreNames.contains('quizRecords')) {
                    const store = db.createObjectStore('quizRecords', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('packageId', 'packageId', { unique: false });
                }
                
                // 学习包表
                if (!db.objectStoreNames.contains('packages')) {
                    db.createObjectStore('packages', { keyPath: 'package_id' });
                }
            };
        });
    },

    // ========== 学习包操作 ==========

    async savePackage(pkg) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('packages', 'readwrite');
            const store = tx.objectStore('packages');
            store.put(pkg);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getPackage(packageId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('packages', 'readonly');
            const store = tx.objectStore('packages');
            const request = store.get(packageId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllPackages() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('packages', 'readonly');
            const store = tx.objectStore('packages');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async deletePackage(packageId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('packages', 'readwrite');
            const store = tx.objectStore('packages');
            store.delete(packageId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // ========== 卡片操作 ==========

    async saveCard(card) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('cards', 'readwrite');
            const store = tx.objectStore('cards');
            store.put(card);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async saveCards(cards) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('cards', 'readwrite');
            const store = tx.objectStore('cards');
            cards.forEach(card => store.put(card));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getCard(cardId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('cards', 'readonly');
            const store = tx.objectStore('cards');
            const request = store.get(cardId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getCardsByPackage(packageId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('cards', 'readonly');
            const store = tx.objectStore('cards');
            const index = store.index('packageId');
            const request = index.getAll(packageId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async getDueCards(packageId) {
        const cards = await this.getCardsByPackage(packageId);
        const now = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = today.getTime() + 24 * 60 * 60 * 1000;
        
        return cards.filter(card => {
            if (card.status === 'new') return true;
            return card.nextReview && card.nextReview < endOfDay;
        });
    },

    async getNewCards(packageId, limit = 50) {
        const cards = await this.getCardsByPackage(packageId);
        return cards.filter(c => c.status === 'new' || !c.status).slice(0, limit);
    },

    // ========== 学习记录操作 ==========

    async addStudyLog(log) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('studyLogs', 'readwrite');
            const store = tx.objectStore('studyLogs');
            store.add(log);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getStudyLogsByDate(date) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('studyLogs', 'readonly');
            const store = tx.objectStore('studyLogs');
            const index = store.index('date');
            const request = index.getAll(date);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllStudyLogs() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('studyLogs', 'readonly');
            const store = tx.objectStore('studyLogs');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    // ========== 测验记录操作 ==========

    async addQuizRecord(record) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizRecords', 'readwrite');
            const store = tx.objectStore('quizRecords');
            store.add(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getQuizRecords(limit = 10) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizRecords', 'readonly');
            const store = tx.objectStore('quizRecords');
            const request = store.getAll();
            request.onsuccess = () => {
                const records = request.result || [];
                records.sort((a, b) => b.date - a.date);
                resolve(records.slice(0, limit));
            };
            request.onerror = () => reject(request.error);
        });
    },

    // ========== 统计相关 ==========

    async getStats(packageId) {
        const cards = await this.getCardsByPackage(packageId);
        const stats = {
            total: cards.length,
            new: 0,
            learning: 0,
            mastered: 0,
            dueToday: 0,
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = today.getTime() + 24 * 60 * 60 * 1000;
        
        cards.forEach(card => {
            const status = card.status || 'new';
            if (status === 'new') stats.new++;
            else if (status === 'learning') stats.learning++;
            else if (status === 'mastered') stats.mastered++;
            
            if (status === 'new' || (card.nextReview && card.nextReview < endOfDay)) {
                stats.dueToday++;
            }
        });
        
        return stats;
    },

    // ========== 数据导入导出 ==========

    async exportAll() {
        const packages = await this.getAllPackages();
        const cards = [];
        const studyLogs = await this.getAllStudyLogs();
        const quizRecords = await new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizRecords', 'readonly');
            const store = tx.objectStore('quizRecords');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });

        for (const pkg of packages) {
            const pkgCards = await this.getCardsByPackage(pkg.package_id);
            cards.push(...pkgCards);
        }

        return {
            version: 1,
            exportDate: new Date().toISOString(),
            packages,
            cards,
            studyLogs,
            quizRecords,
            settings: this.getSettings()
        };
    },

    async importAll(data) {
        if (data.packages) {
            for (const pkg of data.packages) {
                await this.savePackage(pkg);
            }
        }
        if (data.cards) {
            await this.saveCards(data.cards);
        }
        if (data.studyLogs) {
            const tx = this.db.transaction('studyLogs', 'readwrite');
            const store = tx.objectStore('studyLogs');
            data.studyLogs.forEach(log => store.put(log));
            await new Promise(resolve => { tx.oncomplete = resolve; });
        }
        if (data.quizRecords) {
            const tx = this.db.transaction('quizRecords', 'readwrite');
            const store = tx.objectStore('quizRecords');
            data.quizRecords.forEach(r => store.put(r));
            await new Promise(resolve => { tx.oncomplete = resolve; });
        }
        if (data.settings) {
            this.saveSettings(data.settings);
        }
    },

    // ========== 配置存储 (localStorage) ==========

    getSettings() {
        const defaults = {
            currentPackage: 'cet6-vocabulary',
            dailyNewCount: 50,
            dailyReviewLimit: 100,
            feishuWebhook: '',
            reminderTime: '08:00',
        };
        try {
            const saved = JSON.parse(localStorage.getItem('study_settings') || '{}');
            return { ...defaults, ...saved };
        } catch {
            return defaults;
        }
    },

    saveSettings(settings) {
        localStorage.setItem('study_settings', JSON.stringify(settings));
    },

    getTodayDateStr() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },

    getTodayLearnedCount() {
        const today = this.getTodayDateStr();
        const learned = JSON.parse(localStorage.getItem(`learned_${today}`) || '0');
        return learned;
    },

    incrementTodayLearned() {
        const today = this.getTodayDateStr();
        const key = `learned_${today}`;
        const current = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, current + 1);
        
        // 记录到打卡记录
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        if (!streak.includes(today)) {
            streak.push(today);
            localStorage.setItem('streak_dates', JSON.stringify(streak));
        }
    },

    getStreak() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        if (streak.length === 0) return 0;
        
        // 计算连续天数
        streak.sort().reverse();
        const today = this.getTodayDateStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        
        // 如果今天或昨天没有打卡，连续天数重置
        if (streak[0] !== today && streak[0] !== yesterdayStr) {
            return 0;
        }
        
        let count = 1;
        for (let i = 1; i < streak.length; i++) {
            const d1 = new Date(streak[i - 1]);
            const d2 = new Date(streak[i]);
            const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
            if (diff === 1) count++;
            else break;
        }
        return count;
    },

    getMaxStreak() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        if (streak.length === 0) return 0;
        
        streak.sort();
        let maxCount = 1;
        let currentCount = 1;
        
        for (let i = 1; i < streak.length; i++) {
            const d1 = new Date(streak[i - 1]);
            const d2 = new Date(streak[i]);
            const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                currentCount++;
                maxCount = Math.max(maxCount, currentCount);
            } else {
                currentCount = 1;
            }
        }
        return maxCount;
    }
};
