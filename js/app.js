    renderBookmarkFolders() {
        const c = $("bookmark-folders-list");
        if (!c) return;
        c.innerHTML = "";
        const folders = Object.keys(this.bookmarks);
        if (folders.length === 0) { c.innerHTML = '<span style="font-size: 0.9em; color: #94a3b8;">저장된 폴더가 없습니다.</span>'; return; }
        folders.forEach(folder => {
            const wrap = document.createElement("div");
            wrap.className = "folder-tag";
            wrap.style.display = "flex"; wrap.style.alignItems = "center"; wrap.style.gap = "8px";
            
            const name = document.createElement("span");
            name.innerText = "[Folder] " + folder + " (" + this.bookmarks[folder].length + ")";
            name.onclick = () => this.startQuizFromBookmark(folder);
            
            const viewBtn = document.createElement("button");
            viewBtn.innerText = "보기";
            viewBtn.style.padding = "2px 8px"; viewBtn.style.fontSize = "0.8em";
            viewBtn.className = "btn btn-outline";
            viewBtn.onclick = (e) => { e.stopPropagation(); this.viewBookmarkQuestions(folder); };
            
            wrap.appendChild(name);
            wrap.appendChild(viewBtn);
            c.appendChild(wrap);
        });
    },

    showBookmarkScreen() {
        this.showScreen("bookmark-screen");
        this.backToBookmarkFolders(); // 폴더 목록부터 표시
        this.renderBookmarkFolders();
    },

    viewBookmarkQuestions(folder) {
        this.currentBookmarkFolder = folder;
        this.bookmarkPage = 0;
        $("bookmark-folders-container").style.display = "none";
        $("bookmark-view-area").style.display = "block";
        $("bookmark-folder-title").innerText = "[Folder] " + folder;
        this.renderBookmarkQuestionsPage();
    },

    backToBookmarkFolders() {
        $("bookmark-folders-container").style.display = "block";
        $("bookmark-view-area").style.display = "none";
    },

    renderBookmarkQuestionsPage() {
        const list = $("bookmark-questions-list");
        list.innerHTML = "";
        const data = this.bookmarks[this.currentBookmarkFolder] || [];
        const s = this.bookmarkPage * this.itemsPerBookmarkPage;
        const e = Math.min(s + this.itemsPerBookmarkPage, data.length);
        
        for (let i = s; i < e; i++) list.appendChild(this.createReviewCard(data[i], (i + 1) + ". "));
        
        this.renderGenericPagination("bookmark-pagination-controls", data.length, this.itemsPerBookmarkPage, this.bookmarkPage, (p) => {
            this.bookmarkPage = p;
            this.renderBookmarkQuestionsPage();
        });
        window.scrollTo(0, 0);
    },

    showScreen(id) {
        ["start-screen","quiz-area","study-area","result-screen","search-screen","bookmark-screen"].forEach(s => $(s).style.display = s === id ? 'block' : 'none');
        $("fixed-back-btn").style.display = "none"; 
        // 📝 OMR 서랍 표시 여부 제어 (시험/시뮬레이션 모드에서만 노출 가능)
        if (id === "quiz-area" && this.currentMode === "exam") {
            $("omr-drawer").style.display = "flex";
            this.renderOMR();
        } else {
            $("omr-drawer").style.display = "none";
            $("omr-drawer").classList.remove("open");
            $("omr-toggle").innerText = ">";
        }
    },

    toggleOMR() {
        const d = $("omr-drawer");
        const isOpen = d.classList.toggle("open");
        $("omr-toggle").innerText = isOpen ? "<" : ">";
    },

    renderOMR() {
        const grid = $("omr-grid");
        grid.innerHTML = "";
        this.currentQuizPool.forEach((q, idx) => {
            const row = document.createElement("div");
            row.className = "omr-row";
            const num = document.createElement("span");
            num.className = "omr-num";
            num.innerText = (idx + 1) + ".";
            num.onclick = () => this.jumpToQuestion(idx);
            row.appendChild(num);
            const optsDiv = document.createElement("div");
            optsDiv.className = "omr-opts";
            ['A','B','C','D','E'].forEach(opt => {
                const val = getOptVal(q, opt);
                if (!val) return;
                const optBtn = document.createElement("div");
                optBtn.className = "omr-opt" + (this.userAnswers[idx] === opt ? " selected" : "");
                optBtn.innerText = opt;
                optBtn.onclick = () => {
                    this.userAnswers[idx] = opt;
                    this.renderOMR();
                    this.renderQuizPage(false);
                };
                optsDiv.appendChild(optBtn);
            });
            row.appendChild(optsDiv);
            grid.appendChild(row);
        });
    },

    jumpToQuestion(index) {
        const targetPage = Math.floor(index / this.itemsPerPage);
        this.currentPage = targetPage;
        this.renderQuizPage();
        setTimeout(() => {
            const cards = document.querySelectorAll("#quiz-grid .review-card");
            const cardIdx = index % this.itemsPerPage;
            if (cards[cardIdx]) cards[cardIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    },

    showImageModal(src) {
        $("modal-img").src = src;
        $("image-modal").style.display = "flex";
    },

    isBookmarked(q) { return Object.values(this.bookmarks).some(arr => arr.some(bq => bq['문제'] === q['문제'])); },

    removeBookmark(q) {
        for (const f in this.bookmarks) {
            this.bookmarks[f] = this.bookmarks[f].filter(bq => bq['문제'] !== q['문제']);
            if (this.bookmarks[f].length === 0) delete this.bookmarks[f];
        }
        this.saveBookmarks();
    },

    toggleBookmark(q, btn) {
        if (this.isBookmarked(q)) {
            if (confirm("이 문제를 북마크에서 삭제하시겠습니까?")) {
                this.removeBookmark(q); btn.innerText = "Add Bookmark"; this.renderBookmarkFolders();
                // 북마크 보기 화면에서 삭제 시 갱신
                if ($("bookmark-view-area").style.display === "block") this.renderBookmarkQuestionsPage();
            }
        } else {
            const f = prompt("저장할 북마크 폴더명을 입력하세요:", "기본 폴더");
            if (!f) return;
            if (!this.bookmarks[f]) this.bookmarks[f] = [];
            this.bookmarks[f].push(q); this.saveBookmarks();
            btn.innerText = "Bookmarked"; this.renderBookmarkFolders();
            alert("'" + f + "' 폴더에 저장되었습니다.");
        }
    },

    showSearchScreen() {
        this.showScreen("search-screen");
        $("full-search-input").value = "";
        $("full-search-results").innerHTML = "<div style='color:#64748b;text-align:center;padding:30px;grid-column:1/-1;'>검색어를 입력하면 전체 문제 정보가 나타납니다.</div>";
        $("search-pagination-controls").innerHTML = "";
    },

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.executeSearch(), 300);
    },

    executeSearch() {
        const kw = $("full-search-input").value.toLowerCase().trim();
        if (kw.length < 2) return;
        this.searchResults = this.allQuizData.filter(q => q['문제'].toLowerCase().includes(kw) || (q['해설'] && q['해설'].toLowerCase().includes(kw)));
        this.searchPage = 0;
        this.renderSearchPage();
    },

    renderSearchPage() {
        const rc = $("full-search-results");
        rc.innerHTML = "";
        if (this.searchResults.length === 0) {
            rc.innerHTML = "<div style='color:#b91c1c;text-align:center;padding:30px;font-weight:bold;grid-column:1/-1;'>검색 결과가 없습니다.</div>";
            $("search-pagination-controls").innerHTML = "";
            return;
        }
        const s = this.searchPage * this.itemsPerSearchPage;
        const e = Math.min(s + this.itemsPerSearchPage, this.searchResults.length);
        for (let i = s; i < e; i++) rc.appendChild(this.createReviewCard(this.searchResults[i]));
        $("search-current-page").innerText = this.searchPage + 1;
        this.renderGenericPagination("search-pagination-controls", this.searchResults.length, this.itemsPerSearchPage, this.searchPage, (p) => {
            this.searchPage = p;
            this.renderSearchPage();
        });
        window.scrollTo(0, 0);
    },

    createReviewCard(q, indexText = "") {
        const div = document.createElement("div");
        div.className = "review-card";
        const imgHtml = (q['이미지'] && q['이미지'].trim()) ? '<img src="./images/' + q['이미지'].trim() + '" class="zoomable-img" style="max-width:100%;display:block;margin-bottom:10px;" onerror="this.style.display=\'none\'" onclick="app.showImageModal(this.src)">' : '';
        let optsHtml = '<div class="options" style="margin-top:10px;">';
        ['A','B','C','D','E'].forEach(opt => {
            const val = getOptVal(q, opt);
            if (!val) return;
            const isCor = getCorrect(q) === opt;
            const bg = isCor ? 'background:#d4edda;border:1px solid #1e7e34;color:#155724;font-weight:bold;' : 'background:#fff;border:1px solid #cbd5e1;color:#334155;';
            optsHtml += '<div style="padding:10px 14px;border-radius:6px;margin-bottom:8px;' + bg + '">' + opt + ') ' + val + (isCor ? ' (정답)' : '') + '</div>';
        });
        optsHtml += '</div>';
        const starText = this.isBookmarked(q) ? "Bookmarked" : "Add Bookmark";
        const subjectBadge = q['_subject'] ? `<span style="font-size: 0.75em; background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; margin-right: 8px; vertical-align: middle; display: inline-block; line-height: 1;">${q['_subject']}</span>` : '';
        div.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:15px;right:15px;background:none;border:1px solid #cbd5e1;font-size:0.8em;padding:4px 8px;border-radius:4px;cursor:pointer;color:#64748b;">' + starText + '</button>'
            + '<div class="q-title" style="padding-right:110px;">' + subjectBadge + indexText + 'Q. ' + q['문제'] + '</div>'
            + imgHtml + optsHtml
            + '<div class="feedback info" style="display:block;margin-top:auto;"><strong>해설:</strong><br><span class="explanation-text">' + (q['해설'] || '해설이 등록되지 않았습니다.') + '</span></div>';
        div.querySelector('.card-bookmark-btn').onclick = (e) => this.toggleBookmark(q, e.target);
        return div;
    },

    startQuiz(mode) {
        if (this.allQuizData.length === 0) return alert("문제가 로드되지 않았습니다.");
        this.currentMode = mode;
        let count = Math.min(parseInt($("question-count").value) || 10, this.allQuizData.length);
        this.currentQuizPool = [...this.allQuizData].sort(() => Math.random() - 0.5).slice(0, count);
        this.launchQuiz();
    },

    startQuizFromBookmark(f) {
        this.currentQuizPool = [...this.bookmarks[f]].sort(() => Math.random() - 0.5);
        this.currentMode = "practice";
        this.launchQuiz();
    },

    launchQuiz() {
        this.currentPage = 0; this.userAnswers = {}; this.practiceSubmitted = {};
        $("total-quiz-num").innerText = this.currentQuizPool.length;
        $("mode-badge").innerText = this.currentMode === 'exam' ? "시험모드" : "연습모드";
        this.showScreen("quiz-area");
        this.renderQuizPage();
    },

    renderQuizPage(autoScroll = true) {
        const grid = $("quiz-grid");
        grid.innerHTML = "";
        const s = this.currentPage * this.itemsPerPage;
        const e = Math.min(s + this.itemsPerPage, this.currentQuizPool.length);
        for (let i = s; i < e; i++) grid.appendChild(this.createInteractiveQuizCard(i));
        $("current-page-text").innerText = this.currentPage + 1;
        this.renderPagination();
        if (autoScroll) window.scrollTo(0, 0); 
    },

    createInteractiveQuizCard(index) {
        const q = this.currentQuizPool[index];
        const card = document.createElement("div");
        card.className = "review-card";
        const starText = this.isBookmarked(q) ? "Bookmarked" : "Add Bookmark";
        const imgHtml = (q['이미지'] && q['이미지'].trim()) ? '<img src="./images/' + q['이미지'].trim() + '" class="zoomable-img" style="max-width:100%;display:block;margin-bottom:10px;" onerror="this.style.display=\'none\'" onclick="app.showImageModal(this.src)">' : '';
        card.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:15px;right:15px;background:none;border:1px solid #cbd5e1;font-size:0.8em;padding:4px 8px;border-radius:4px;cursor:pointer;color:#64748b;">' + starText + '</button>'
            + '<div class="q-title" style="padding-right:110px;">' + (index + 1) + '. ' + q['문제'] + '</div>' + imgHtml;
        card.querySelector('.card-bookmark-btn').onclick = (e) => this.toggleBookmark(q, e.target);
        const optsDiv = document.createElement("div");
        optsDiv.className = "options";
        ['A','B','C','D','E'].forEach(opt => {
            const val = getOptVal(q, opt);
            if (!val) return;
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.innerText = opt + ') ' + val;
            if (this.userAnswers[index] === opt) btn.classList.add("selected");
            if (this.currentMode === 'practice' && this.practiceSubmitted[index]) {
                btn.disabled = true;
                if (getCorrect(q) === opt) btn.classList.add("correct");
                else if (this.userAnswers[index] === opt) btn.classList.add("wrong");
            }
            btn.onclick = () => {
                if (this.currentMode === 'practice' && this.practiceSubmitted[index]) return;
                this.userAnswers[index] = opt;
                this.renderQuizPage(false); 
                if (this.currentMode === "exam") this.renderOMR();
            };
            optsDiv.appendChild(btn);
        });
        card.appendChild(optsDiv);
        if (this.currentMode === 'practice') {
            if (!this.practiceSubmitted[index]) {
                const cb = document.createElement("button");
                cb.className = "btn btn-primary btn-small check-ans-btn";
                cb.style.marginTop = "15px";
                cb.innerText = "정답 확인하기";
                cb.onclick = () => this.submitPracticeAnswer(index);
                card.appendChild(cb);
            } else {
                const isCor = this.userAnswers[index] === getCorrect(q);
                const fb = document.createElement("div");
                fb.className = "feedback " + (isCor ? 'correct' : 'wrong');
                fb.style.display = 'block';
                fb.innerHTML = '<div style="font-weight:bold;">' + (isCor ? '정답입니다!' : '오답입니다. (정답: ' + getCorrect(q) + ')') + '</div>'
                    + '<div class="explanation-text">' + (q['해설'] || '해설이 없습니다.') + '</div>';
                card.appendChild(fb);
            }
        }
        return card;
    },

    submitPracticeAnswer(index) {
        if (!this.userAnswers[index]) return alert("먼저 답안을 선택해주세요.");
        this.practiceSubmitted[index] = true;
        const q = this.currentQuizPool[index];
        this.updateLearningRate(q, this.userAnswers[index] === getCorrect(q));
        this.renderQuizPage(false); 
    },

    renderPagination() {
        const total = Math.ceil(this.currentQuizPool.length / this.itemsPerPage);
        const c = $("pagination-controls");
        c.innerHTML = "";
        if (total <= 1) return;
        const prev = document.createElement("button");
        prev.className = "page-btn"; prev.innerText = "< 이전"; prev.disabled = this.currentPage === 0;
        prev.onclick = () => { this.currentPage--; this.renderQuizPage(); };
        c.appendChild(prev);
        if (this.currentMode === 'exam') {
            const info = document.createElement("span");
            info.style.margin = "0 15px"; info.style.fontWeight = "bold"; info.style.color = "#64748b";
            info.innerText = `${this.currentPage + 1} / ${total}`;
            c.appendChild(info);
        } else {
            // 숫자 나열 방식: 현재 페이지 앞뒤 5개씩 표시
            for (let i = 0; i < total; i++) {
                if (i === 0 || i === total - 1 || (i >= this.currentPage - 5 && i <= this.currentPage + 5)) {
                    const pb = document.createElement("button");
                    pb.className = "page-btn" + (i === this.currentPage ? ' active' : '');
                    pb.innerText = i + 1;
                    pb.onclick = () => { this.currentPage = i; this.renderQuizPage(); };
                    c.appendChild(pb);
                } else if (i === 1 || i === total - 2) {
                    if (c.lastChild && c.lastChild.tagName === 'SPAN') continue;
                    const span = document.createElement("span");
                    span.innerText = "..."; span.style.padding = "0 5px";
                    c.appendChild(span);
                }
            }
        }
        const next = document.createElement("button");
        next.className = "page-btn"; next.innerText = "다음 >"; next.disabled = this.currentPage === total - 1;
        next.onclick = () => { this.currentPage++; this.renderQuizPage(); };
        c.appendChild(next);
        $("finish-exam-btn").style.display = (this.currentMode === 'exam' && this.currentPage === total - 1) ? "block" : "none";
    },

    updateLearningRate(q, isCorrect) {
        if (!this.learningProgress[this.currentSubject]) this.learningProgress[this.currentSubject] = {};
        this.learningProgress[this.currentSubject][q['문제']] = isCorrect;
        this.saveProgress();
    },

    finishExam() {
        const unanswered = this.currentQuizPool.length - Object.keys(this.userAnswers).length;
        if (unanswered > 0 && !confirm(unanswered + "문제를 아직 풀지 않았습니다. 정말로 제출하시겠습니까?")) return;
        let correctCount = 0;
        const wrongList = [];
        this.currentQuizPool.forEach((q, idx) => {
            const ua = this.userAnswers[idx] || "";
            const isCor = ua === getCorrect(q);
            this.updateLearningRate(q, isCor);
            if (isCor) correctCount++;
            else wrongList.push({ question: q, userAns: ua, index: idx + 1 });
        });
        this.showScreen("result-screen");
        $("correct-count").innerText = correctCount;
        $("result-total-count").innerText = this.currentQuizPool.length;
        const r = correctCount / this.currentQuizPool.length;
        $("score-message").innerText = r === 1 ? "Perfect! 완벽합니다." : r >= 0.7 ? "합격권입니다. 오답을 확인하세요." : "복습이 필요합니다.";
        const rc = $("wrong-review-list");
        rc.innerHTML = "";
        if (wrongList.length === 0) { rc.innerHTML = "<div style='color:#1e7e34;font-weight:bold;text-align:center;padding:30px;grid-column:1/-1;'>틀린 문제가 없습니다!</div>"; return; }
        wrongList.forEach(wi => {
            const q = wi.question;
            const div = document.createElement("div");
            div.className = "review-card";
            const imgHtml = (q['이미지'] && q['이미지'].trim()) ? '<img src="./images/' + q['이미지'].trim() + '" class="zoomable-img" style="max-width:100%;display:block;margin-bottom:10px;" onerror="this.style.display=\'none\'" onclick="app.showImageModal(this.src)">' : '';
            const starText = this.isBookmarked(q) ? "Bookmarked" : "Add Bookmark";
            let optsHtml = '<div class="options" style="margin-top:10px;">';
            ['A','B','C','D','E'].forEach(opt => {
                const val = getOptVal(q, opt);
                if (!val) return;
                const isCor = getCorrect(q) === opt;
                const isUser = wi.userAns.toUpperCase() === opt;
                let bg = 'background:#fff;border:1px solid #cbd5e1;color:#334155;';
                let icon = '';
                if (isCor) { bg = 'background:#d4edda;border:1px solid #1e7e34;color:#155724;font-weight:bold;'; icon = ' (정답)'; }
                else if (isUser) { bg = 'background:#f8d7da;border:1px solid #b91c1c;color:#721c24;font-weight:bold;'; icon = ' (나의 답)'; }
                optsHtml += '<div style="padding:10px 14px;border-radius:6px;margin-bottom:8px;' + bg + '">' + opt + ') ' + val + icon + '</div>';
            });
            optsHtml += '</div>';
            const subjectBadge = q['_subject'] ? `<span style="font-size: 0.75em; background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; margin-right: 8px; vertical-align: middle; display: inline-block; line-height: 1;">${q['_subject']}</span>` : '';
            div.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:15px;right:15px;background:none;border:1px solid #cbd5e1;font-size:0.8em;padding:4px 8px;border-radius:4px;cursor:pointer;color:#64748b;">' + starText + '</button>'
                + '<div class="q-title" style="padding-right:110px;">' + subjectBadge + wi.index + '. ' + q['문제'] + '</div>'
                + imgHtml + optsHtml
                + '<div class="feedback info" style="display:block;margin-top:auto;"><strong>해설:</strong><br><span class="explanation-text">' + (q['해설'] || '해설이 등록되지 않았습니다.') + '</span></div>';
            div.querySelector('.card-bookmark-btn').onclick = (e) => this.toggleBookmark(q, e.target);
            rc.appendChild(div);
        });
        window.scrollTo(0, 0);
    },

    startReviewMode() {
        if (this.allQuizData.length === 0) return alert("문제가 로드되지 않았습니다.");
        this.studyPage = 0;
        $("study-total-num").innerText = this.allQuizData.length;
        this.showScreen("study-area");
        this.renderStudyPage();
    },

    startSimulation(type) {
        if (type === 'fixed') {
            const url = this.SHEET_DATA["Simulation"]["Self-Assessment"];
            this.currentMode = "exam"; this.currentSubject = "Mock Exam 1";
            Papa.parse(url, {
                download: true, header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
                complete: (results) => {
                    this.currentQuizPool = results.data.map(row => {
                        const n = {};
                        for (const k in row) {
                            const nk = k.trim().replace(/^보기([a-e])$/i, (_, c) => '보기' + c.toUpperCase());
                            n[nk] = (row[k] || '').trim();
                        }
                        n['_subject'] = "Self-Assessment";
                        return n;
                    }).filter(row => row['문제']);
                    if (this.currentQuizPool.length === 0) return alert("시뮬레이션 데이터를 불러오지 못했습니다.");
                    this.launchQuiz();
                }
            });
        } else if (type === 'random') {
            const BLUEPRINT = { "Hematology": 18, "Immunology": 10, "Immunohematology": 18, "Clinical Chemistry": 18, "microbiology": 18, "Urinalysis and body fluids": 6, "molecular diagnosis": 6, "education and management": 3, "photomicrograph and color plate examination": 3 };
            this.currentMode = "exam"; this.currentSubject = "Random Mock Exam";
            const subjects = Object.keys(this.SHEET_DATA["ASCPi"]);
            const promises = subjects.map(sub => this.fetchSubjectData(sub));
            Promise.all(promises).then(results => {
                let pool = [];
                results.forEach((data, idx) => {
                    const subName = subjects[idx];
                    const targetCount = BLUEPRINT[subName] || 0;
                    const shuffled = data.sort(() => 0.5 - Math.random());
                    pool = pool.concat(shuffled.slice(0, targetCount));
                });
                if (pool.length < 100) {
                    const remaining = results.flat().filter(q => !pool.includes(q)).sort(() => 0.5 - Math.random());
                    pool = pool.concat(remaining.slice(0, 100 - pool.length));
                }
                this.currentQuizPool = pool.sort(() => 0.5 - Math.random());
                this.launchQuiz();
            });
        }
    },

    renderStudyPage() {
        const c = $("study-list");
        c.innerHTML = "";
        const s = this.studyPage * this.itemsPerStudyPage;
        const e = Math.min(s + this.itemsPerStudyPage, this.allQuizData.length);
        for (let i = s; i < e; i++) c.appendChild(this.createReviewCard(this.allQuizData[i], (i + 1) + ". "));
        $("study-current-page").innerText = this.studyPage + 1;
        this.renderGenericPagination("study-pagination-controls", this.allQuizData.length, this.itemsPerStudyPage, this.studyPage, (p) => {
            this.studyPage = p;
            this.renderStudyPage();
        });
        window.scrollTo(0, 0);
    },

    renderGenericPagination(containerId, totalItems, itemsPerPage, currentPage, onPageChange) {
        const total = Math.ceil(totalItems / itemsPerPage);
        const c = $(containerId);
        c.innerHTML = "";
        if (total <= 1) return;
        const prev = document.createElement("button");
        prev.className = "page-btn"; prev.innerText = "< 이전"; prev.disabled = currentPage === 0;
        prev.onclick = () => onPageChange(currentPage - 1);
        c.appendChild(prev);
        for (let i = 0; i < total; i++) {
            // 현재 페이지 기준 앞뒤 5개씩 표시
            if (i === 0 || i === total - 1 || (i >= currentPage - 5 && i <= currentPage + 5)) {
                const pb = document.createElement("button");
                pb.className = "page-btn" + (i === currentPage ? ' active' : '');
                pb.innerText = i + 1;
                pb.onclick = () => onPageChange(i);
                c.appendChild(pb);
            } else if (i === 1 || i === total - 2) {
                if (c.lastChild && c.lastChild.tagName === 'SPAN') continue;
                const span = document.createElement("span");
                span.innerText = "..."; span.style.padding = "0 5px";
                c.appendChild(span);
            }
        }
        const next = document.createElement("button");
        next.className = "page-btn"; next.innerText = "다음 >"; next.disabled = currentPage === total - 1;
        next.onclick = () => onPageChange(currentPage + 1);
        c.appendChild(next);
    },

    goHome() { this.updateDashboardUI(); this.showScreen("start-screen"); window.scrollTo(0, 0); },

    toggleTheme() {
        const b = document.body;
        if (b.classList.contains("yonsei-theme")) {
            b.classList.remove("yonsei-theme"); b.classList.add("korea-theme");
            $("main-title").innerText = "Korea Univ. Med-Lab Portal";
            localStorage.setItem("theme", "korea");
        } else if (b.classList.contains("korea-theme")) {
            b.classList.remove("korea-theme");
            $("main-title").innerText = "CLST";
            localStorage.setItem("theme", "default");
        } else {
            b.classList.add("yonsei-theme");
            $("main-title").innerText = "Yonsei Univ. Med-Lab Portal";
            localStorage.setItem("theme", "yonsei");
        }
    },

    loadTheme() { 
        const t = localStorage.getItem("theme");
        if (t === "yonsei") {
            document.body.classList.add("yonsei-theme");
            $("main-title").innerText = "Yonsei Univ. Med-Lab Portal";
        } else if (t === "korea") {
            document.body.classList.add("korea-theme");
            $("main-title").innerText = "Korea Univ. Med-Lab Portal";
        } else {
            $("main-title").innerText = "CLST";
        }
    }
};

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === 'INPUT' || $("image-modal").style.display === "flex") return;
    if ($("quiz-area").style.display === "block") {
        if (e.key === "ArrowLeft") {
            const prev = document.querySelector("#pagination-controls .page-btn:first-child");
            if (prev && !prev.disabled) prev.click();
        } else if (e.key === "ArrowRight") {
            const next = document.querySelector("#pagination-controls .page-btn:last-child");
            if (next && !next.disabled) next.click();
        } else if (e.key === "Enter") {
            if (app.currentMode === 'practice') {
                const checks = document.querySelectorAll(".check-ans-btn");
                if (checks.length > 0) checks[0].click();
            } else if (app.currentMode === 'exam') {
                const finish = $("finish-exam-btn");
                if (finish && finish.style.display !== "none") finish.click();
            }
        } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
            const opts = ['A', 'B', 'C', 'D', 'E'];
            const optIdx = parseInt(e.key) - 1;
            const currentQIndex = app.currentPage * app.itemsPerPage;
            if (currentQIndex < app.currentQuizPool.length) {
                const q = app.currentQuizPool[currentQIndex];
                const val = getOptVal(q, opts[optIdx]);
                if (val && (!app.practiceSubmitted[currentQIndex] || app.currentMode !== 'practice')) {
                    app.userAnswers[currentQIndex] = opts[optIdx];
                    app.renderQuizPage();
                }
            }
        }
    }
});

document.addEventListener("DOMContentLoaded", () => app.init());