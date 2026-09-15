/**
 * 测验系统
 * 支持选择题、判断题、填空题、混合测验
 */

const Quiz = {
    currentQuiz: null,
    currentIndex: 0,
    answers: [],
    score: 0,

    /**
     * 开始测验
     */
    async start(type, count = 20) {
        const settings = Storage.getSettings();
        const pkg = await Storage.getPackage(settings.currentPackage);
        if (!pkg || !pkg.items || pkg.items.length === 0) {
            alert('请先导入学习包');
            return;
        }

        // 选择题目（优先从已学过的词中选）
        const cards = await Storage.getCardsByPackage(settings.currentPackage);
        const learnedCards = cards.filter(c => c.status && c.status !== 'new');
        const pool = learnedCards.length >= count ? learnedCards : pkg.items;
        
        const shuffled = this.shuffleArray([...pool]).slice(0, Math.min(count, pool.length));
        
        this.currentQuiz = {
            type: type,
            questions: [],
            total: shuffled.length
        };

        // 根据题型生成题目
        for (let i = 0; i < shuffled.length; i++) {
            const item = shuffled[i];
            let question;
            
            const actualType = type === 'mixed' 
                ? ['choice', 'judge', 'fill'][Math.floor(Math.random() * 3)]
                : type;
            
            switch (actualType) {
                case 'choice':
                    question = this.generateChoiceQuestion(item, pkg.items);
                    break;
                case 'judge':
                    question = this.generateJudgeQuestion(item, pkg.items);
                    break;
                case 'fill':
                    question = this.generateFillQuestion(item);
                    break;
            }
            
            if (question) {
                question.type = actualType;
                this.currentQuiz.questions.push(question);
            }
        }

        this.currentIndex = 0;
        this.answers = [];
        this.score = 0;

        this.showQuestion();
    },

    /**
     * 生成选择题
     */
    generateChoiceQuestion(item, allItems) {
        const correctAnswer = item.back;
        const wrongOptions = this.shuffleArray(
            allItems.filter(i => i.id !== item.id).slice(0, 50)
        ).slice(0, 3).map(i => i.back);

        const options = this.shuffleArray([correctAnswer, ...wrongOptions]);
        
        return {
            id: item.id,
            front: item.front,
            back: item.back,
            extra: item.extra,
            options: options,
            answer: correctAnswer
        };
    },

    /**
     * 生成判断题
     */
    generateJudgeQuestion(item, allItems) {
        const isCorrect = Math.random() > 0.5;
        let displayedMeaning;
        
        if (isCorrect) {
            displayedMeaning = item.back;
        } else {
            const wrongItems = allItems.filter(i => i.id !== item.id);
            const randomWrong = wrongItems[Math.floor(Math.random() * wrongItems.length)];
            displayedMeaning = randomWrong.back;
        }

        return {
            id: item.id,
            front: item.front,
            back: item.back,
            extra: item.extra,
            displayedMeaning: displayedMeaning,
            answer: isCorrect
        };
    },

    /**
     * 生成填空题
     */
    generateFillQuestion(item) {
        return {
            id: item.id,
            front: item.front,
            back: item.back,
            extra: item.extra,
            answer: item.back
        };
    },

    /**
     * 显示当前题目
     */
    showQuestion() {
        const q = this.currentQuiz.questions[this.currentIndex];
        const modal = document.getElementById('quizModal');
        const body = document.getElementById('quizBody');
        const title = document.getElementById('quizTitle');

        const typeNames = {
            choice: '词义选择',
            judge: '对错判断',
            fill: '拼写填空',
            mixed: '混合测验'
        };

        title.textContent = `${typeNames[this.currentQuiz.type]} (${this.currentIndex + 1}/${this.currentQuiz.total})`;

        let html = `
            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(this.currentIndex / this.currentQuiz.total) * 100}%"></div>
                </div>
            </div>
            <div class="quiz-question">
                <div class="quiz-question-text">${q.front}</div>
        `;

        if (q.type === 'choice') {
            html += `<div class="quiz-options">`;
            q.options.forEach((opt, i) => {
                html += `
                    <button class="quiz-option" onclick="Quiz.selectOption(${i})" data-index="${i}">
                        ${String.fromCharCode(65 + i)}. ${opt}
                    </button>
                `;
            });
            html += `</div>`;
        } else if (q.type === 'judge') {
            html += `
                <div style="text-align:center;font-size:18px;margin-bottom:20px;padding:20px;background:var(--bg-tertiary);border-radius:var(--radius-md);">
                    ${q.displayedMeaning}
                </div>
                <div class="quiz-options">
                    <button class="quiz-option" onclick="Quiz.selectJudge(true)">
                        ✅ 正确
                    </button>
                    <button class="quiz-option" onclick="Quiz.selectJudge(false)">
                        ❌ 错误
                    </button>
                </div>
            `;
        } else if (q.type === 'fill') {
            html += `
                <input type="text" class="quiz-input" id="fillInput" placeholder="输入中文释义..." onkeypress="if(event.key==='Enter')Quiz.submitFill()">
                <div style="text-align:center;margin-top:16px;">
                    <button class="btn-primary" onclick="Quiz.submitFill()">提交答案</button>
                </div>
            `;
        }

        html += `</div>`;
        body.innerHTML = html;
        modal.style.display = 'flex';

        // 聚焦输入框
        if (q.type === 'fill') {
            setTimeout(() => document.getElementById('fillInput')?.focus(), 100);
        }
    },

    /**
     * 选择选择题选项
     */
    selectOption(index) {
        const q = this.currentQuiz.questions[this.currentIndex];
        const selected = q.options[index];
        const isCorrect = selected === q.answer;

        // 显示结果
        const options = document.querySelectorAll('.quiz-option');
        options.forEach((opt, i) => {
            opt.disabled = true;
            if (q.options[i] === q.answer) {
                opt.classList.add('correct');
            } else if (i === index && !isCorrect) {
                opt.classList.add('wrong');
            }
        });

        this.answers.push({
            questionId: q.id,
            userAnswer: selected,
            correctAnswer: q.answer,
            isCorrect: isCorrect
        });

        if (isCorrect) this.score++;

        setTimeout(() => this.nextQuestion(), 1200);
    },

    /**
     * 判断题选择
     */
    selectJudge(userAnswer) {
        const q = this.currentQuiz.questions[this.currentIndex];
        const isCorrect = userAnswer === q.answer;

        const options = document.querySelectorAll('.quiz-option');
        options.forEach((opt, i) => {
            opt.disabled = true;
            if ((i === 0 && q.answer) || (i === 1 && !q.answer)) {
                opt.classList.add('correct');
            } else if ((i === 0 && userAnswer && !isCorrect) || (i === 1 && !userAnswer && !isCorrect)) {
                opt.classList.add('wrong');
            }
        });

        this.answers.push({
            questionId: q.id,
            userAnswer: userAnswer,
            correctAnswer: q.answer,
            isCorrect: isCorrect
        });

        if (isCorrect) this.score++;

        setTimeout(() => this.nextQuestion(), 1200);
    },

    /**
     * 填空题提交
     */
    submitFill() {
        const q = this.currentQuiz.questions[this.currentIndex];
        const input = document.getElementById('fillInput');
        const userAnswer = input.value.trim();
        
        // 模糊匹配：去掉空格，判断关键词是否匹配
        const isCorrect = this.checkFillAnswer(userAnswer, q.answer);

        this.answers.push({
            questionId: q.id,
            userAnswer: userAnswer,
            correctAnswer: q.answer,
            isCorrect: isCorrect
        });

        if (isCorrect) this.score++;

        // 显示结果
        const questionDiv = document.querySelector('.quiz-question');
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            margin-top: 16px;
            padding: 12px;
            border-radius: var(--radius-md);
            background: ${isCorrect ? '#f0fdf4' : '#fef2f2'};
            color: ${isCorrect ? '#16a34a' : '#dc2626'};
            text-align: center;
        `;
        resultDiv.textContent = isCorrect ? '✅ 回答正确！' : `❌ 正确答案：${q.answer}`;
        questionDiv.appendChild(resultDiv);

        input.disabled = true;
        document.querySelector('.btn-primary').disabled = true;

        setTimeout(() => this.nextQuestion(), 1500);
    },

    /**
     * 检查填空题答案（模糊匹配）
     */
    checkFillAnswer(userAnswer, correctAnswer) {
        if (!userAnswer) return false;
        
        // 完全匹配
        if (userAnswer === correctAnswer) return true;
        
        // 去掉标点和空格后比较
        const normalize = (s) => s.replace(/[，。；、\s]/g, '');
        if (normalize(userAnswer) === normalize(correctAnswer)) return true;
        
        // 关键词匹配：正确答案的主要释义至少有一个出现在用户答案中
        const meanings = correctAnswer.split(/[，；]/).filter(m => m.length >= 2);
        for (const meaning of meanings) {
            if (userAnswer.includes(meaning.trim())) return true;
        }
        
        return false;
    },

    /**
     * 下一题
     */
    nextQuestion() {
        this.currentIndex++;
        if (this.currentIndex >= this.currentQuiz.total) {
            this.showResult();
        } else {
            this.showQuestion();
        }
    },

    /**
     * 显示结果
     */
    async showResult() {
        const settings = Storage.getSettings();
        const percentage = Math.round((this.score / this.currentQuiz.total) * 100);
        
        // 保存记录
        await Storage.addQuizRecord({
            type: this.currentQuiz.type,
            packageId: settings.currentPackage,
            score: this.score,
            total: this.currentQuiz.total,
            percentage: percentage,
            date: Date.now(),
            answers: this.answers
        });

        const body = document.getElementById('quizBody');
        const title = document.getElementById('quizTitle');
        title.textContent = '测验结果';

        let level = '';
        let levelColor = '';
        if (percentage >= 90) { level = '太棒了！'; levelColor = '#22c55e'; }
        else if (percentage >= 70) { level = '还不错！'; levelColor = '#3b82f6'; }
        else if (percentage >= 50) { level = '继续加油！'; levelColor = '#f59e0b'; }
        else { level = '需要多复习'; levelColor = '#ef4444'; }

        body.innerHTML = `
            <div class="quiz-result">
                <div class="quiz-result-score" style="color:${levelColor}">${percentage}分</div>
                <div class="quiz-result-label">${level}</div>
                <div class="quiz-result-detail">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>答对</span>
                        <span style="color:var(--secondary);font-weight:600;">${this.score} 题</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>答错</span>
                        <span style="color:var(--danger);font-weight:600;">${this.currentQuiz.total - this.score} 题</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span>总题数</span>
                        <span style="font-weight:600;">${this.currentQuiz.total} 题</span>
                    </div>
                </div>
                <button class="btn-primary btn-large" onclick="Quiz.close()">完成</button>
            </div>
        `;
    },

    close() {
        document.getElementById('quizModal').style.display = 'none';
        this.currentQuiz = null;
        App.refreshStats();
        App.renderQuizHistory();
    },

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};

// 全局函数，供HTML调用
function startQuiz(type) {
    Quiz.start(type);
}

function closeQuiz() {
    Quiz.close();
}
