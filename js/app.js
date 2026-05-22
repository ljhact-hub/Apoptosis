const app = {
    SHEET_DATA: {
        "ASCPi": {
            "Hematology": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHj_HvmwKjNLQFgJVo2AauHR5bqoBppnhijqepJ3Q4hnjPVHt3R2TDXzUGRyG8k8igkEAr8UwVMFI/pub?output=csv",
            "Immunology": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRobSYYDi5NPFlkFr2g6si4oFsuaB822Ufq3DlGU0xBCKTFAxs-o8UZvJPWz-N9W5of84hFicaEpR0r/pub?output=csv",
            "Immunohematology": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwgFtMq982lUFF602_gxZ99mzUSlLoSFiqHHmo4BMZCmF8Do9z25x_VfulSFLzxfYLEcG0wGkDWTTQ/pub?output=csv",
            "Clinical Chemistry": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSSEOW5QZtsgD4MG8H4sVhA4nG8NxZ7-BKxhYvdKQP_xmaD58Ecr_JKmEFl59a6-Pu9cn-w9KS106-/pub?output=csv",
            "Urinalysis and body fluids": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLnu1ToQISYbnc0mnH26KWygYD8Jiq-oedwXgYcoC4LXTo7JtMwd132PZaT2hh7T-TCA9yh13-aWOW/pub?output=csv",
            "microbiology": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRywHxs6B-70nxhM_UmDBJsIxW8oEsdkY0HeilZQaCEJU0FXUBZcgjDGRkRD3iUvFBmkRVwtashiQev/pub?output=csv",
            "molecular diagnosis": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGlsxMbI0P0GTwsBAlFD-Lo7NN9sRTZz1adsAtKgtOQUOZUTL_IrqFkTsganU--U7rbVNMLkfbKzLZ/pub?output=csv",
            "education and management": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKaMQ4UBRtgIrmCIefOiHu6_6CkMqM-veGCWbFm-RtP3NMTUC2hRryPqw9QN0xwGFnYbTNjtZ3ZVei/pub?output=csv",
            "photomicrograph and color plate examination": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7-7jZTBCDyltd_yrA_LEVUPGMaCzjeCZelirD0ywwdrKp5ciGnDu_UemH7sYJMyKr1_oghDmdl0Qw/pub?output=csv"
        },
        "Simulation": {
            "Self-Assessment": "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_HRXA4uhh3GanmWZxHsS7EDcJ_5qOf4g4yunwlT7jSfoJYLOo3dLAsDAdEruyjj9fD-0cLI5CMdNR/pub?output=csv"
        },
        "내신": {
            "임상화학": "https://docs.google.com/spreadsheets/d/e/2PACX-1vR9G8mJqpsn9xWmhg_2LCAWbfi2vsZTxRdq77NStrnzYHG3HCfgpatnlFh1Y6gP0IblU3EVJMPYr6_0/pub?output=csv"
        }
    },
    currentCategory: "ASCPi", currentSubject: "ALL",
    allQuizData: [], currentQuizPool: [],
    learningProgress: {}, bookmarks: {},
    currentMode: "", itemsPerPage: 2, currentPage: 0,
    studyPage: 0, itemsPerStudyPage: 10,
    searchPage: 0, itemsPerSearchPage: 10, searchResults: [],
    bookmarkPage: 0, itemsPerBookmarkPage: 10, currentBookmarkFolder: "",
    resultPage: 0, itemsPerResultPage: 10, wrongList: [],
    wrongNotePage: 0, itemsPerWrongNotePage: 10, filteredWrongList: [], currentWrongFilter: "전체",
    userAnswers: {}, practiceSubmitted: {},
    searchTimeout: null,

    init() {
        this.updateItemsPerPage();
        window.addEventListener('resize', () => {
            const oldItemsPerPage = this.itemsPerPage;
            this.updateItemsPerPage();
            if (oldItemsPerPage !== this.itemsPerPage && $("quiz-area").style.display === "block") {
                const firstQuestionIndex = this.currentPage * oldItemsPerPage;
                this.currentPage = Math.floor(firstQuestionIndex / this.itemsPerPage);
                this.renderQuizPage();
            }
        });

        window.addEventListener('scroll', () => {
            const btn = $("fixed-back-btn");
            const shouldShow = window.scrollY > 300 && 
                ($("study-area").style.display === "block" || 
                 $("quiz-area").style.display === "block" || 
                 $("search-screen").style.display === "block" || 
                 $("bookmark-screen").style.display === "block" ||
                 $("wrong-note-screen").style.display === "block" ||
                 $("progress-screen").style.display === "block");
            btn.style.display = shouldShow ? "block" : "none";
        });

        this.loadTheme();
        this.loadStorageData();
        $("category-select").value = this.currentCategory;
        this.showScreen("start-screen");
        this.onCategoryChange();
    },

    updateItemsPerPage() {
        if (window.innerWidth < 768) this.itemsPerPage = 1;
        else if (window.innerWidth < 1200) this.itemsPerPage = 2;
        else if (window.innerWidth < 1600) this.itemsPerPage = 4;
        else this.itemsPerPage = 6;
    },

    loadStorageData() {
        const lp = localStorage.getItem("clinical_learning_progress");
        this.learningProgress = lp ? JSON.parse(lp) : {};
        const bm = localStorage.getItem("clinical_bookmarks");
        this.bookmarks = bm ? JSON.parse(bm) : {};
    },

    saveProgress() { localStorage.setItem("clinical_learning_progress", JSON.stringify(this.learningProgress)); },
    saveBookmarks() { localStorage.setItem("clinical_bookmarks", JSON.stringify(this.bookmarks)); },

    onCategoryChange() {
        this.currentCategory = $("category-select").value;
        const subjects = Object.keys(this.SHEET_DATA[this.currentCategory]);
        const sel = $("subject-select");
        sel.innerHTML = "";
        
        const optAll = document.createElement("option");
        optAll.value = "ALL"; optAll.innerText = "전체 과목 (통합)";
        sel.appendChild(optAll);

        subjects.forEach(sub => {
            const o = document.createElement("option");
            o.value = sub; o.innerText = sub;
            sel.appendChild(o);
        });

        this.fetchAllCategoryData().then(() => {
            this.currentSubject = "ALL";
            sel.value = "ALL";
            this.updateDashboardUI();
        }).catch(err => {
            console.error("데이터 로딩 실패:", err);
            this.updateDashboardUI();
        });
    },

    fetchAllCategoryData() {
        const subjects = Object.keys(this.SHEET_DATA[this.currentCategory]);
        const promises = subjects.map(sub => this.fetchSubjectData(sub));
        return Promise.all(promises).then(results => {
            this.allQuizData = results.flat();
        });
    },

    onSubjectChange() {
        this.currentSubject = $("subject-select").value;
        $("display-subject-name").innerText = this.currentSubject === "ALL" ? "전체 통합" : this.currentSubject;
        this.updateDashboardUI();
    },

    fetchSubjectData(subject) {
        return new Promise((resolve) => {
            const url = this.SHEET_DATA[this.currentCategory][subject];
            if (!url) return resolve([]);
            Papa.parse(url, {
                download: true, header: true, skipEmptyLines: true,
                transformHeader: h => h.trim(),
                complete: (results) => {
                    const data = results.data.map(row => {
                        const n = {};
                        for (const k in row) {
                            const nk = k.trim().replace(/^보기([a-e])$/i, (_, c) => '보기' + c.toUpperCase());
                            n[nk] = (row[k] || '').trim();
                        }
                        n['_subject'] = subject; 
                        return n;
                    }).filter(row => row['문제']);
                    resolve(data);
                },
                error: (err) => {
                    console.error(`${subject} 데이터 로드 실패:`, err);
                    resolve([]);
                }
            });
        });
    },

    updateDashboardUI() {
        // 1. 전체 통합 숙지율 계산
        const globalTotal = this.allQuizData.length;
        let globalCorrectCount = 0;
        this.allQuizData.forEach(q => {
            const sub = q['_subject'];
            if (this.learningProgress[sub] && this.learningProgress[sub][q['문제']] === true) {
                globalCorrectCount++;
            }
        });
        const globalRate = globalTotal === 0 ? 0 : Math.round((globalCorrectCount / globalTotal) * 100);
        
        $("global-total-count").innerText = globalTotal;
        $("global-check-count").innerText = globalCorrectCount;
        $("global-learning-rate-text").innerText = globalRate;
        $("global-learning-rate-bar").style.width = globalRate + "%";

        // 2. 조건부 UI 노출 제어
        if (this.currentSubject === "ALL") {
            $("current-subject-stat").style.display = "none";
            $("pc-subject-list-container").style.display = "block";
            const mobileBtn = $("mobile-progress-btn-container");
            if (mobileBtn) mobileBtn.style.display = "block";
        } else {
            $("current-subject-stat").style.display = "block";
            $("pc-subject-list-container").style.display = "none";
            const mobileBtn = $("mobile-progress-btn-container");
            if (mobileBtn) mobileBtn.style.display = "none";

            const displayData = this.allQuizData.filter(q => q['_subject'] === this.currentSubject);
            const total = displayData.length;
            $("total-db-count").innerText = total;
            $("total-db-count-lr").innerText = total;

            let checkCount = 0;
            displayData.forEach(q => {
                if (this.learningProgress[this.currentSubject] && this.learningProgress[this.currentSubject][q['문제']] === true) {
                    checkCount++;
                }
            });

            $("check-count").innerText = checkCount;
            const rate = total === 0 ? 0 : Math.round((checkCount / total) * 100);
            $("learning-rate-text").innerText = rate;
            $("learning-rate-bar").style.width = rate + "%";
        }
        
        this.renderSubjectStats("subject-stats-list-pc");
        this.renderSubjectStats("subject-stats-list-mobile");
        this.renderBookmarkFolders();
    },

    renderSubjectStats(containerId) {
        const container = $(containerId);
        if (!container) return;
        container.innerHTML = "";
        
        const subjects = Object.keys(this.SHEET_DATA[this.currentCategory]);
        
        const renderItem = (name, correct, total) => {
            const rate = total === 0 ? 0 : Math.round((correct / total) * 100);
            const item = document.createElement("div");
            item.className = "stat-item";
            item.innerHTML = `
                <div class="stat-label">
                    <span>${name}</span>
                    <span>${rate}% (${correct}/${total})</span>
                </div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${rate}%"></div>
                </div>
            `;
            return item;
        };

        subjects.forEach(sub => {
            const subData = this.allQuizData.filter(q => q['_subject'] === sub);
            let subCorrect = 0;
            subData.forEach(q => {
                if (this.learningProgress[sub] && this.learningProgress[sub][q['문제']] === true) subCorrect++;
            });
            container.appendChild(renderItem(sub, subCorrect, subData.length));
        });
    },

    showProgressScreen() {
        this.showScreen("progress-screen");
        this.renderSubjectStats("subject-stats-list-mobile");
    },

    showWrongNoteScreen() {
        const filter = this.currentSubject === "ALL" ? "전체" : this.currentSubject;
        this.currentWrongFilter = filter;
        this.filteredWrongList = [];
        
        const collectFromSubject = (sub) => {
            const sp = this.learningProgress[sub] || {};
            this.allQuizData.forEach(q => {
                if (q['_subject'] === sub && sp[q['문제']] === false) {
                    this.filteredWrongList.push(q);
                }
            });
        };

        if (filter === "전체") {
            const subjects = Object.keys(this.SHEET_DATA[this.currentCategory]);
            subjects.forEach(sub => collectFromSubject(sub));
        } else {
            collectFromSubject(filter);
        }

        if (this.filteredWrongList.length === 0) {
            return alert(`${filter} 과목에 등록된 오답이 없습니다.`);
        }

        this.wrongNotePage = 0;
        this.showScreen("wrong-note-screen");
        $("wrong-note-title").innerText = filter;
        $("wrong-note-count").innerText = this.filteredWrongList.length;
        this.renderWrongNotePage();
    },

    startPracticeFromWrongNotes() {
        if (this.filteredWrongList.length === 0) return alert("문제가 없습니다.");
        this.currentQuizPool = [...this.filteredWrongList].sort(() => 0.5 - Math.random());
        this.currentMode = "practice";
        this.launchQuiz();
    },

    renderWrongNotePage() {
        const list = $("wrong-note-list");
        list.innerHTML = "";
        const s = this.wrongNotePage * this.itemsPerWrongNotePage;
        const e = Math.min(s + this.itemsPerWrongNotePage, this.filteredWrongList.length);
        
        for (let i = s; i < e; i++) {
            const q = this.filteredWrongList[i];
            const div = document.createElement("div");
            div.className = "review-card";
            const imgHtml = (q['이미지'] && q['이미지'].trim()) ? '<img src="./images/' + q['이미지'].trim() + '" class="zoomable-img" style="max-width:100%;display:block;margin-bottom:10px;" onerror="this.style.display=\'none\'" onclick="app.showImageModal(this.src)">' : '';
            const starText = this.isBookmarked(q) ? "Saved" : "BM";
            let optsHtml = '<div class="options" style="margin-top:10px;">';
            ['A','B','C','D','E'].forEach(opt => {
                const val = getOptVal(q, opt);
                if (!val) return;
                const isCor = getCorrect(q) === opt;
                let bg = 'background:#fff;border:1px solid #cbd5e1;color:#334155;';
                let icon = '';
                if (isCor) { bg = 'background:#d4edda;border:1px solid #1e7e34;color:#155724;font-weight:bold;'; icon = ' (정답)'; }
                optsHtml += '<div style="padding:10px 14px;border-radius:6px;margin-bottom:8px;' + bg + '">' + opt + ') ' + val + icon + '</div>';
            });
            optsHtml += '</div>';
            const subjectBadge = q['_subject'] ? `<span style="font-size: 0.75em; background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; margin-right: 8px; vertical-align: middle; display: inline-block; line-height: 1;">${q['_subject']}</span>` : '';
            div.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:10px;right:10px;background:none;border:1px solid #cbd5e1;font-size:0.65em;padding:2px 5px;border-radius:4px;cursor:pointer;color:#64748b;font-weight:bold;">' + starText + '</button>'
                + '<div class="q-title" style="padding-right:50px; min-height:0; margin-bottom:10px;">' + subjectBadge + (i + 1) + '. ' + q['문제'] + '</div>'
                + imgHtml + optsHtml
                + '<div class="feedback info" style="display:block;margin-top:auto;"><strong>해설:</strong><br><span class="explanation-text">' + (q['해설'] || '해설이 등록되지 않았습니다.') + '</span></div>';
            div.querySelector('.card-bookmark-btn').onclick = (e) => this.toggleBookmark(q, e.target);
            list.appendChild(div);
        }

        $("wrong-note-current-page").innerText = this.wrongNotePage + 1;
        this.renderGenericPagination("wrong-note-pagination-controls", this.filteredWrongList.length, this.itemsPerWrongNotePage, this.wrongNotePage, (p) => {
            this.wrongNotePage = p;
            this.renderWrongNotePage();
        });
        window.scrollTo(0, 0);
    },

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
            name.innerText = folder + " (" + this.bookmarks[folder].length + ")";
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
        this.backToBookmarkFolders(); 
        this.renderBookmarkFolders();
    },

    viewBookmarkQuestions(folder) {
        this.currentBookmarkFolder = folder;
        this.bookmarkPage = 0;
        $("bookmark-folders-container").style.display = "none";
        $("bookmark-view-area").style.display = "block";
        $("bookmark-folder-title").innerText = folder;
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
        ["start-screen","quiz-area","study-area","result-screen","search-screen","bookmark-screen","progress-screen","wrong-note-screen"].forEach(s => {
            const el = $(s);
            if (el) el.style.display = s === id ? 'block' : 'none';
        });
        $("fixed-back-btn").style.display = "none"; 
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
                this.removeBookmark(q); btn.innerText = "BM"; this.renderBookmarkFolders();
                if ($("bookmark-view-area").style.display === "block") this.renderBookmarkQuestionsPage();
            }
        } else {
            const f = prompt("저장할 북마크 폴더명을 입력하세요:", "기본 폴더");
            if (!f) return;
            if (!this.bookmarks[f]) this.bookmarks[f] = [];
            this.bookmarks[f].push(q); this.saveBookmarks();
            btn.innerText = "Saved"; this.renderBookmarkFolders();
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
        const starText = this.isBookmarked(q) ? "Saved" : "BM";
        const subjectBadge = q['_subject'] ? `<span style="font-size: 0.75em; background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; margin-right: 8px; vertical-align: middle; display: inline-block; line-height: 1;">${q['_subject']}</span>` : '';
        div.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:10px;right:10px;background:none;border:1px solid #cbd5e1;font-size:0.65em;padding:2px 5px;border-radius:4px;cursor:pointer;color:#64748b;font-weight:bold;">' + starText + '</button>'
            + '<div class="q-title" style="padding-right:50px; min-height:0; margin-bottom:10px;">' + subjectBadge + indexText + 'Q. ' + q['문제'] + '</div>'
            + imgHtml + optsHtml
            + '<div class="feedback info" style="display:block;margin-top:auto;"><strong>해설:</strong><br><span class="explanation-text">' + (q['해설'] || '해설이 등록되지 않았습니다.') + '</span></div>';
        div.querySelector('.card-bookmark-btn').onclick = (e) => this.toggleBookmark(q, e.target);
        return div;
    },

    startQuiz(mode) {
        if (this.allQuizData.length === 0) return alert("문제가 로드되지 않았습니다.");
        this.currentMode = mode;
        
        let pool = this.currentSubject === "ALL" 
            ? this.allQuizData 
            : this.allQuizData.filter(q => q['_subject'] === this.currentSubject);

        let count = Math.min(parseInt($("question-count").value) || 10, pool.length);
        this.currentQuizPool = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
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
        const starText = this.isBookmarked(q) ? "Saved" : "BM";
        const imgHtml = (q['이미지'] && q['이미지'].trim()) ? '<img src="./images/' + q['이미지'].trim() + '" class="zoomable-img" style="max-width:100%;display:block;margin-bottom:10px;" onerror="this.style.display=\'none\'" onclick="app.showImageModal(this.src)">' : '';
        card.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:10px;right:10px;background:none;border:1px solid #cbd5e1;font-size:0.65em;padding:2px 5px;border-radius:4px;cursor:pointer;color:#64748b;font-weight:bold;">' + starText + '</button>'
            + '<div class="q-title" style="padding-right:50px; min-height:0; margin-bottom:10px;">' + (index + 1) + '. ' + q['문제'] + '</div>' + imgHtml;
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

        const info = document.createElement("span");
        info.style.margin = "0 15px"; info.style.fontWeight = "bold"; info.style.color = "#64748b";
        info.innerText = `${this.currentPage + 1} / ${total}`;
        c.appendChild(info);
        
        const next = document.createElement("button");
        next.className = "page-btn"; next.innerText = "다음 >"; next.disabled = this.currentPage === total - 1;
        next.onclick = () => { this.currentPage++; this.renderQuizPage(); };
        c.appendChild(next);
        $("finish-exam-btn").style.display = (this.currentMode === 'exam' && this.currentPage === total - 1) ? "block" : "none";
    },

    updateLearningRate(q, isCorrect) {
        if (!this.learningProgress[this.currentSubject]) this.learningProgress[this.currentSubject] = {};
        const sub = q['_subject'] || this.currentSubject;
        if (!this.learningProgress[sub]) this.learningProgress[sub] = {};
        this.learningProgress[sub][q['문제']] = isCorrect;
        this.saveProgress();
    },

    finishExam() {
        const unanswered = this.currentQuizPool.length - Object.keys(this.userAnswers).length;
        if (unanswered > 0 && !confirm(unanswered + "문제를 아직 풀지 않았습니다. 정말로 제출하시겠습니까?")) return;
        let correctCount = 0;
        this.wrongList = []; 
        this.currentQuizPool.forEach((q, idx) => {
            const ua = this.userAnswers[idx] || "";
            const isCor = ua === getCorrect(q);
            this.updateLearningRate(q, isCor);
            if (isCor) correctCount++;
            else this.wrongList.push({ question: q, userAns: ua, index: idx + 1 });
        });
        this.showScreen("result-screen");
        $("correct-count").innerText = correctCount;
        $("result-total-count").innerText = this.currentQuizPool.length;
        const r = correctCount / this.currentQuizPool.length;
        $("score-message").innerText = r === 1 ? "Perfect! 완벽합니다." : r >= 0.7 ? "합격권입니다. 오답을 확인하세요." : "복습이 필요합니다.";
        
        this.resultPage = 0;
        this.renderResultPage();
    },

    renderResultPage() {
        const rc = $("wrong-review-list");
        rc.innerHTML = "";
        if (this.wrongList.length === 0) { 
            rc.innerHTML = "<div style='color:#1e7e34;font-weight:bold;text-align:center;padding:30px;grid-column:1/-1;'>틀린 문제가 없습니다!</div>"; 
            $("result-pagination-controls").innerHTML = "";
            return; 
        }

        const s = this.resultPage * this.itemsPerResultPage;
        const e = Math.min(s + this.itemsPerResultPage, this.wrongList.length);
        
        for (let i = s; i < e; i++) {
            const wi = this.wrongList[i];
            const q = wi.question;
            const div = document.createElement("div");
            div.className = "review-card";
            const imgHtml = (q['이미지'] && q['이미지'].trim()) ? '<img src="./images/' + q['이미지'].trim() + '" class="zoomable-img" style="max-width:100%;display:block;margin-bottom:10px;" onerror="this.style.display=\'none\'" onclick="app.showImageModal(this.src)">' : '';
            const starText = this.isBookmarked(q) ? "Saved" : "BM";
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
            div.innerHTML = '<button class="card-bookmark-btn" style="position:absolute;top:10px;right:10px;background:none;border:1px solid #cbd5e1;font-size:0.65em;padding:2px 5px;border-radius:4px;cursor:pointer;color:#64748b;font-weight:bold;">' + starText + '</button>'
                + '<div class="q-title" style="padding-right:50px; min-height:0; margin-bottom:10px;">' + subjectBadge + wi.index + '. ' + q['문제'] + '</div>'
                + imgHtml + optsHtml
                + '<div class="feedback info" style="display:block;margin-top:auto;"><strong>해설:</strong><br><span class="explanation-text">' + (q['해설'] || '해설이 등록되지 않았습니다.') + '</span></div>';
            div.querySelector('.card-bookmark-btn').onclick = (e) => this.toggleBookmark(q, e.target);
            rc.appendChild(div);
        }

        $("result-current-page").innerText = this.resultPage + 1;
        this.renderGenericPagination("result-pagination-controls", this.wrongList.length, this.itemsPerResultPage, this.resultPage, (p) => {
            this.resultPage = p;
            this.renderResultPage();
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
            const opts = ['A', 'B', 'C', 'D','E'];
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