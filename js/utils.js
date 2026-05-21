const $ = (id) => document.getElementById(id);

function getOptVal(q, opt) { 
    return (q['보기' + opt] || q['보기' + opt.toLowerCase()] || '').trim(); 
}

function getCorrect(q) { 
    return (q['정답'] || '').trim().toUpperCase(); 
}