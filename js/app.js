/**
 * 极简学习助手 v2.0
 * 核心功能：首页智能推荐 + 卡片学习 + 错题本 + 测验
 */

const App = {
    // 状态
    pkg: null,
    cards: {},         // id -> card progress
    wrongWords: [],    // 错词列表
    wrongQuiz: [],     // 错题列表
    studyQueue: [],
    currentIdx: 0,
    currentMode: '',   // review, learn, wrong
    isFlipped: false,
    wrongTab: 'word',

    // ========== 初始化 ==========
    async init() {
        await this.loadPackage();
        this.loadProgress();
        this.loadWrongBook();
        this.renderHome();
        this.renderMe();
        this.updateDate();
    },

    // 加载学习包
    async loadPackage() {
        const saved = localStorage.getItem('current_package');
        const pkgId = saved || 'cet6-vocabulary';
        
        try {
            const res = await fetch(`data/${pkgId}.json`);
            this.pkg = await res.json();
        } catch (e) {
            // 从 localStorage 中找自定义包
            const customPkgs = JSON.parse(localStorage.getItem('custom_packages') || '{}');
            if (customPkgs[pkgId]) {
                this.pkg = customPkgs[pkgId];
            }
        }
        
        if (!this.pkg) {
            console.error('No package found');
        }
    },

    // 加载学习进度
    loadProgress() {
        const saved = localStorage.getItem(`progress_${this.pkg.package_id}`);
        if (saved) {
            this.cards = JSON.parse(saved);
        }
    },

    saveProgress() {
        localStorage.setItem(`progress_${this.pkg.package_id}`, JSON.stringify(this.cards));
    },

    // 错题本
    loadWrongBook() {
        const saved = localStorage.getItem(`wrong_${this.pkg.package_id}`);
        if (saved) {
            const data = JSON.parse(saved);
            this.wrongWords = data.words || [];
            this.wrongQuiz = data.quiz || [];
        }
    },

    saveWrongBook() {
        localStorage.setItem(`wrong_${this.pkg.package_id}`, JSON.stringify({
            words: this.wrongWords,
            quiz: this.wrongQuiz
        }));
    },

    addWrongWord(wordId, source) {
        if (!this.wrongWords.find(w => w.id === wordId)) {
            const item = this.pkg.items.find(i => i.id === wordId);
            if (item) {
                this.wrongWords.unshift({
                    id: wordId,
                    word: item.front,
                    meaning: item.back,
                    source: source,
                    addedAt: Date.now()
                });
                this.saveWrongBook();
            }
        }
    },

    removeWrongWord(wordId) {
        this.wrongWords = this.wrongWords.filter(w => w.id !== wordId);
        this.saveWrongBook();
        this.renderWrongList();
    },

    // 打卡相关
    getToday() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },

    isTodayLearned() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        return streak.includes(this.getToday());
    },

    markLearned() {
        const today = this.getToday();
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        if (!streak.includes(today)) {
            streak.push(today);
            localStorage.setItem('streak_dates', JSON.stringify(streak));
        }
    },

    getStreak() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        if (streak.length === 0) return 0;
        
        streak.sort().reverse();
        const today = this.getToday();
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterday = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
        
        if (streak[0] !== today && streak[0] !== yesterday) return 0;
        
        let count = 1;
        for (let i = 1; i < streak.length; i++) {
            const d1 = new Date(streak[i-1]);
            const d2 = new Date(streak[i]);
            if ((d1 - d2) / 86400000 === 1) count++;
            else break;
        }
        return count;
    },

    getMaxStreak() {
        const streak = JSON.parse(localStorage.getItem('streak_dates') || '[]');
        if (streak.length === 0) return 0;
        streak.sort();
        let max = 1, cur = 1;
        for (let i = 1; i < streak.length; i++) {
            const d1 = new Date(streak[i-1]);
            const d2 = new Date(streak[i]);
            if ((d2 - d1) / 86400000 === 1) { cur++; max = Math.max(max, cur); }
            else cur = 1;
        }
        return max;
    },

    getTotalDays() {
        return JSON.parse(localStorage.getItem('streak_dates') || '[]').length;
    },

    // 今日学习统计
    getTodayLearned() {
        return parseInt(localStorage.getItem(`learned_${this.getToday()}`) || '0');
    },

    incrementLearned() {
        const key = `learned_${this.getToday()}`;
        const cur = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, cur + 1);
        this.markLearned();
    },

    getSettings() {
        return {
            dailyNew: parseInt(localStorage.getItem('daily_new') || '50'),
            dailyReview: parseInt(localStorage.getItem('daily_review') || '100'),
            feishuWebhook: localStorage.getItem('feishu_webhook') || ''
        };
    },

    // ========== 智能推荐 ==========
    getRecommendation() {
        const settings = this.getSettings();
        const dueReview = this.getDueCount();
        const newAvailable = this.getNewCount();
        const todayLearned = this.getTodayLearned();
        const remainingNew = Math.max(0, settings.dailyNew - todayLearned);
        const wrongCount = this.wrongWords.length;
        
        // 优先级：错题 > 到期复习 > 新学 > 测验
        if (wrongCount >= 10) {
            return {
                icon: '❌',
                text: '先刷错题',
                sub: `${wrongCount} 个错题等待攻克`,
                action: 'wrong'
            };
        }
        
        if (dueReview > 0) {
            return {
                icon: '🔄',
                text: '开始复习',
                sub: `${dueReview} 个单词到期需复习`,
                action: 'review'
            };
        }
        
        if (remainingNew > 0 && newAvailable > 0) {
            return {
                icon: '📖',
                text: '学习新单词',
                sub: `今天还能学 ${Math.min(remainingNew, newAvailable)} 个`,
                action: 'learn'
            };
        }
        
        if (this.getLearnedCount() >= 20) {
            return {
                icon: '📝',
                text: '来个测验',
                sub: '检验一下学习成果',
                action: 'quiz'
            };
        }
        
        return {
            icon: '🎉',
            text: '今日已完成',
            sub: '明天继续加油！',
            action: 'done'
        };
    },

    // 统计方法
    getDueCount() {
        const today = new Date();
        today.setHours(0,0,0,0);
        const end = today.getTime() + 86400000;
        let count = 0;
        for (const id in this.cards) {
            const c = this.cards[id];
            if (c.status === 'new') continue;
            if (c.nextReview && c.nextReview < end) count++;
        }
        return count;
    },

    getNewCount() {
        let learned = new Set(Object.keys(this.cards));
        return this.pkg.items.filter(i => !learned.has(i.id)).length;
    },

    getLearnedCount() {
        return Object.keys(this.cards).length;
    },

    getMasteredCount() {
        let count = 0;
        for (const id in this.cards) {
            if (this.cards[id].status === 'mastered') count++;
        }
        return count;
    },

    // 获取学习阶段
    getPhaseInfo() {
        const total = this.pkg.total_items;
        const learned = this.getLearnedCount();
        const day = Math.floor(learned / 50) + 1;
        const totalDays = Math.ceil(total / 50);
        
        let phaseName, desc;
        if (day <= 5) { phaseName = '入门阶段'; desc = '熟悉节奏，建立习惯'; }
        else if (day <= 10) { phaseName = '进阶阶段'; desc = '稳步推进，积累词汇'; }
        else if (day <= 15) { phaseName = '深化阶段'; desc = '难度提升，巩固记忆'; }
        else if (day <= 20) { phaseName = '冲刺阶段'; desc = '最后冲刺，全面掌握'; }
        else { phaseName = '复习巩固'; desc = '间隔复习，长期记忆'; }
        
        return {
            day: Math.min(day, totalDays),
            totalDays: totalDays,
            phaseName: phaseName,
            desc: desc
        };
    },

    // ========== 渲染首页 ==========
    renderHome() {
        const rec = this.getRecommendation();
        const streak = this.getStreak();
        const due = this.getDueCount();
        const settings = this.getSettings();
        const remainingNew = Math.max(0, settings.dailyNew - this.getTodayLearned());
        const newAvailable = this.getNewCount();
        const actualNew = Math.min(remainingNew, newAvailable);
        const wrong = this.wrongWords.length;
        
        // 今日进度
        const todayTotal = due + actualNew;
        const todayDone = this.getTodayLearned();
        const percent = todayTotal > 0 ? Math.min(100, Math.round((todayDone / todayTotal) * 100)) : 0;
        
        // 更新DOM
        document.getElementById('streakDays').textContent = streak;
        document.getElementById('dueCount').textContent = due;
        document.getElementById('newCount').textContent = actualNew;
        document.getElementById('wrongCount').textContent = wrong;
        
        document.getElementById('mainActionIcon').textContent = rec.icon;
        document.getElementById('mainActionText').textContent = rec.text;
        document.getElementById('mainActionSub').textContent = rec.sub;
        
        // 进度圆环
        const circle = document.getElementById('progressCircle');
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        document.getElementById('todayPercent').textContent = percent + '%';
        
        // 阶段信息
        const phase = this.getPhaseInfo();
        document.getElementById('phaseTitle').textContent = `第 ${phase.day} / ${phase.totalDays} 天 · ${phase.phaseName}`;
        document.getElementById('phaseDesc').textContent = phase.desc;
    },

    updateDate() {
        const d = new Date();
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        document.getElementById('todayDate').textContent = 
            `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
    },

    // ========== 页面切换 ==========
    switchPage(page) {
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.page === page);
        });
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });
        
        if (page === 'wrong') {
            this.renderWrongList();
        }
        if (page === 'me') {
            this.renderMe();
        }
    },

    // ========== 学习/复习卡片 ==========
    startMainAction() {
        const rec = this.getRecommendation();
        if (rec.action === 'done') {
            alert('今天的任务已经完成啦！🎉');
            return;
        }
        this.quickAction(rec.action);
    },

    quickAction(action) {
        if (action === 'wrong') {
            this.switchPage('wrong');
            return;
        }
        if (action === 'quiz') {
            this.startQuiz();
            return;
        }
        this.openStudyModal(action);
    },

    openStudyModal(mode) {
        this.currentMode = mode;
        this.isFlipped = false;
        
        const settings = this.getSettings();
        let queue = [];
        
        if (mode === 'review') {
            // 到期复习的卡片
            const today = new Date();
            today.setHours(0,0,0,0);
            const end = today.getTime() + 86400000;
            
            const dueItems = [];
            for (const id in this.cards) {
                const c = this.cards[id];
                if (c.status === 'new') continue;
                if (c.nextReview && c.nextReview < end) {
                    const item = this.pkg.items.find(i => i.id === id);
                    if (item) dueItems.push(item);
                }
            }
            queue = this.shuffle(dueItems).slice(0, settings.dailyReview || 999);
            document.getElementById('studyModalTitle').textContent = '复习';
        } else if (mode === 'learn') {
            // 新单词
            const remaining = settings.dailyNew - this.getTodayLearned();
            if (remaining <= 0) {
                alert('今天的新单词已经学完啦！');
                return;
            }
            const learned = new Set(Object.keys(this.cards));
            const newItems = this.pkg.items.filter(i => !learned.has(i.id));
            queue = newItems.slice(0, remaining);
            document.getElementById('studyModalTitle').textContent = '学习新单词';
        } else if (mode === 'wrong') {
            // 错题
            queue = this.wrongWords.map(w => {
                const item = this.pkg.items.find(i => i.id === w.id);
                return item || { id: w.id, front: w.word, back: w.meaning, extra: {} };
            });
            document.getElementById('studyModalTitle').textContent = '刷错题';
        }
        
        if (queue.length === 0) {
            alert('没有可学习的内容');
            return;
        }
        
        this.studyQueue = queue;
        this.currentIdx = 0;
        
        document.getElementById('studyTotal').textContent = queue.length;
        document.getElementById('studyCurrent').textContent = 0;
        document.getElementById('startArea').style.display = 'block';
        document.getElementById('ratingArea').style.display = 'none';
        document.getElementById('cardFlip').classList.remove('flipped');
        document.getElementById('cardWord').textContent = '准备好了吗？';
        document.getElementById('cardHint').textContent = '点击开始按钮';
        
        document.getElementById('studyModal').style.display = 'flex';
    },

    startCardSession() {
        document.getElementById('startArea').style.display = 'none';
        document.getElementById('ratingArea').style.display = 'block';
        this.showCurrentCard();
    },

    showCurrentCard() {
        if (this.currentIdx >= this.studyQueue.length) {
            this.finishStudy();
            return;
        }
        
        const item = this.studyQueue[this.currentIdx];
        this.isFlipped = false;
        
        document.getElementById('cardWord').textContent = item.front;
        document.getElementById('cardPos').textContent = item.extra?.pos || '';
        document.getElementById('cardMeaning').textContent = item.back;
        document.getElementById('cardFlip').classList.remove('flipped');
        document.getElementById('studyCurrent').textContent = this.currentIdx + 1;
    },

    flipCard() {
        if (document.getElementById('startArea').style.display !== 'none') return;
        this.isFlipped = !this.isFlipped;
        document.getElementById('cardFlip').classList.toggle('flipped', this.isFlipped);
    },

    rateCard(quality) {
        const item = this.studyQueue[this.currentIdx];
        const cardId = item.id;
        
        // 获取或创建卡片进度
        let card = this.cards[cardId] || {
            id: cardId,
            status: 'new',
            easinessFactor: 2.5,
            interval: 0,
            repetitions: 0
        };
        
        // 使用 SM-2 算法
        const updated = SM2.calculate(card, quality);
        this.cards[cardId] = updated;
        this.saveProgress();
        
        // 新学的词，增加今日计数
        if ((!card.status || card.status === 'new') && quality >= 1) {
            this.incrementLearned();
        }
        
        // 答错了加入错题本
        if (quality === 0) {
            this.addWrongWord(cardId, this.currentMode === 'review' ? '复习' : '学习');
        }
        
        // 答对了且之前在错题本里，自动移除
        if (quality >= 2 && this.currentMode !== 'wrong') {
            this.wrongWords = this.wrongWords.filter(w => w.id !== cardId);
            this.saveWrongBook();
        }
        
        this.currentIdx++;
        document.getElementById('cardFlip').classList.remove('flipped');
        
        setTimeout(() => this.showCurrentCard(), 200);
    },

    finishStudy() {
        document.getElementById('studyModal').style.display = 'none';
        this.renderHome();
        
        // 提示
        const count = this.studyQueue.length;
        if (count > 0) {
            // 简单的完成提示，用原生alert
            setTimeout(() => alert(`完成了 ${count} 个，继续加油！`), 100);
        }
    },

    closeStudy() {
        document.getElementById('studyModal').style.display = 'none';
        this.renderHome();
    },

    // ========== 测验 ==========
    startQuiz() {
        const learnedCount = this.getLearnedCount();
        if (learnedCount < 5) {
            alert('先学几个单词再来测验吧！');
            return;
        }
        
        // 从已学单词中抽题
        const learnedIds = Object.keys(this.cards);
        const shuffled = this.shuffle(learnedIds).slice(0, Math.min(10, learnedIds.length));
        
        this.quizQuestions = shuffled.map(id => {
            const item = this.pkg.items.find(i => i.id === id);
            // 生成选项
            const wrongOptions = this.shuffle(
                this.pkg.items.filter(i => i.id !== id).slice(0, 100)
            ).slice(0, 3).map(i => i.back);
            
            const options = this.shuffle([item.back, ...wrongOptions]);
            
            return {
                id: id,
                word: item.front,
                answer: item.back,
                options: options
            };
        });
        
        this.quizIdx = 0;
        this.quizScore = 0;
        
        document.getElementById('quizTotal').textContent = this.quizQuestions.length;
        document.getElementById('quizCurrent').textContent = 1;
        document.getElementById('quizModal').style.display = 'flex';
        
        this.showQuizQuestion();
    },

    showQuizQuestion() {
        if (this.quizIdx >= this.quizQuestions.length) {
            this.showQuizResult();
            return;
        }
        
        const q = this.quizQuestions[this.quizIdx];
        document.getElementById('quizCurrent').textContent = this.quizIdx + 1;
        
        const body = document.getElementById('quizBody');
        body.innerHTML = `
            <div class="quiz-question">
                <div class="quiz-q-word">${q.word}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, i) => `
                        <button class="quiz-option" onclick="App.answerQuiz(${i})">
                            ${String.fromCharCode(65 + i)}. ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    answerQuiz(idx) {
        const q = this.quizQuestions[this.quizIdx];
        const selected = q.options[idx];
        const isCorrect = selected === q.answer;
        
        const options = document.querySelectorAll('.quiz-option');
        options.forEach((opt, i) => {
            opt.disabled = true;
            if (q.options[i] === q.answer) {
                opt.classList.add('correct');
            } else if (i === idx && !isCorrect) {
                opt.classList.add('wrong');
            }
        });
        
        if (isCorrect) {
            this.quizScore++;
        } else {
            // 加入错题本
            this.addWrongWord(q.id, '测验');
        }
        
        this.quizIdx++;
        setTimeout(() => this.showQuizQuestion(), 1200);
    },

    showQuizResult() {
        const total = this.quizQuestions.length;
        const percent = Math.round((this.quizScore / total) * 100);
        
        const body = document.getElementById('quizBody');
        body.innerHTML = `
            <div class="quiz-result">
                <div class="quiz-result-score">${percent}<span style="font-size:24px;">分</span></div>
                <div class="quiz-result-text">
                    ${percent >= 80 ? '🎉 太棒了！' : percent >= 60 ? '👍 还不错' : '💪 继续加油'}
                </div>
                <div class="quiz-result-detail">
                    <div><span>答对</span><span style="color:#10b981;font-weight:600;">${this.quizScore} 题</span></div>
                    <div><span>答错</span><span style="color:#ef4444;font-weight:600;">${total - this.quizScore} 题</span></div>
                    <div><span>总计</span><span style="font-weight:600;">${total} 题</span></div>
                </div>
                <button class="btn-primary-big" onclick="App.closeQuiz()">完成</button>
            </div>
        `;
    },

    closeQuiz() {
        document.getElementById('quizModal').style.display = 'none';
        this.renderHome();
    },

    // ========== 错题本 ==========
    switchWrongTab(type) {
        this.wrongTab = type;
        document.querySelectorAll('.wrong-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.type === type);
        });
        this.renderWrongList();
    },

    renderWrongList() {
        const list = document.getElementById('wrongList');
        const badge = document.getElementById('wrongTotalBadge');
        
        let items = this.wrongTab === 'word' ? this.wrongWords : this.wrongQuiz;
        
        if (badge) badge.textContent = `${items.length} 个`;
        
        if (items.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <div class="empty-text">太棒了，没有错题</div>
                </div>
            `;
            return;
        }
        
        if (this.wrongTab === 'word') {
            list.innerHTML = items.map((w, i) => `
                <div class="wrong-item">
                    <div>
                        <div class="wrong-word">${w.word}</div>
                        <div class="wrong-meaning">${w.meaning}</div>
                        <div class="wrong-source">来源：${w.source || '学习'}</div>
                    </div>
                    <button class="wrong-delete" onclick="App.removeWrongWord('${w.id}')">✕</button>
                </div>
            `).join('');
        }
    },

    // ========== 我的页面 ==========
    renderMe() {
        document.getElementById('totalDays').textContent = this.getTotalDays();
        document.getElementById('totalWords').textContent = this.getLearnedCount();
        document.getElementById('masteredWords').textContent = this.getMasteredCount();
        document.getElementById('maxStreak').textContent = this.getMaxStreak();
        
        const settings = this.getSettings();
        document.getElementById('dailyNewCount').textContent = settings.dailyNew;
        document.getElementById('dailyReviewCount').textContent = settings.dailyReview;
        document.getElementById('feishuWebhook').value = settings.feishuWebhook;
        document.getElementById('currentPackageName').textContent = this.pkg.title;
    },

    adjustDaily(type, delta) {
        const settings = this.getSettings();
        const key = type === 'new' ? 'dailyNew' : 'dailyReview';
        let val = settings[key] + delta;
        val = Math.max(10, Math.min(500, val));
        localStorage.setItem(type === 'new' ? 'daily_new' : 'daily_review', val);
        document.getElementById(type === 'new' ? 'dailyNewCount' : 'dailyReviewCount').textContent = val;
        this.renderHome();
    },

    editPlan() {
        this.switchPage('me');
    },

    saveWebhook() {
        const val = document.getElementById('feishuWebhook').value.trim();
        localStorage.setItem('feishu_webhook', val);
    },

    async testFeishu() {
        const webhook = document.getElementById('feishuWebhook').value.trim();
        if (!webhook) {
            alert('请先填写 Webhook 地址');
            return;
        }
        
        try {
            const res = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    msg_type: 'text',
                    content: { text: '✅ 飞书推送测试成功！\nAI 学习助手已连接。' }
                })
            });
            if (res.ok) {
                alert('推送测试成功！');
            } else {
                alert('推送失败，请检查地址');
            }
        } catch (e) {
            alert('推送失败：' + e.message);
        }
    },

    importPackage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const pkg = JSON.parse(e.target.result);
                if (!pkg.package_id || !pkg.items) {
                    alert('格式不正确');
                    return;
                }
                
                const customPkgs = JSON.parse(localStorage.getItem('custom_packages') || '{}');
                customPkgs[pkg.package_id] = pkg;
                localStorage.setItem('custom_packages', JSON.stringify(customPkgs));
                localStorage.setItem('current_package', pkg.package_id);
                
                this.pkg = pkg;
                this.cards = {};
                this.wrongWords = [];
                this.wrongQuiz = [];
                
                alert(`"${pkg.title}" 导入成功！`);
                location.reload();
            } catch (err) {
                alert('导入失败：' + err.message);
            }
        };
        reader.readAsText(file);
    },

    exportData() {
        const data = {
            version: 2,
            exportDate: new Date().toISOString(),
            progress: this.cards,
            wrongWords: this.wrongWords,
            wrongQuiz: this.wrongQuiz,
            streak: JSON.parse(localStorage.getItem('streak_dates') || '[]'),
            settings: this.getSettings()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-backup-${this.getToday()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.progress) {
                    this.cards = data.progress;
                    this.saveProgress();
                }
                if (data.wrongWords) {
                    this.wrongWords = data.wrongWords;
                    this.wrongQuiz = data.wrongQuiz || [];
                    this.saveWrongBook();
                }
                if (data.streak) {
                    localStorage.setItem('streak_dates', JSON.stringify(data.streak));
                }
                alert('导入成功！');
                location.reload();
            } catch (err) {
                alert('导入失败：' + err.message);
            }
        };
        reader.readAsText(file);
    },

    resetAll() {
        if (!confirm('确定要重置所有数据吗？无法恢复！')) return;
        localStorage.clear();
        location.reload();
    },

    // 工具
    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
};

// 全局函数
function switchPage(p) { App.switchPage(p); }
function startMainAction() { App.startMainAction(); }
function quickAction(a) { App.quickAction(a); }
function flipCard() { App.flipCard(); }
function rateCard(q) { App.rateCard(q); }
function closeStudy() { App.closeStudy(); }
function startCardSession() { App.startCardSession(); }
function startQuiz() { App.startQuiz(); }
function closeQuiz() { App.closeQuiz(); }
function switchWrongTab(t) { App.switchWrongTab(t); }
function adjustDaily(t, d) { App.adjustDaily(t, d); }
function editPlan() { App.editPlan(); }
function saveWebhook() { App.saveWebhook(); }
function testFeishu() { App.testFeishu(); }
function importPackage(e) { App.importPackage(e); }
function exportData() { App.exportData(); }
function importData(e) { App.importData(e); }
function resetAll() { App.resetAll(); }

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
