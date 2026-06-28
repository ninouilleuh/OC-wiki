// ═══════════════════════════════════════
// DESK PANNING — CENTERED ON CONTRAT
// ═══════════════════════════════════════
const desk = document.getElementById('desk');
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;
let velocityX = 0, velocityY = 0;
let lastX, lastY, lastTime;
let rafId;

const DESK_W = 3200;
const DESK_H = 2400;

function getDeskSize(){
    return { w: DESK_W, h: DESK_H };
}

function clampScroll(){
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxScrollX = Math.max(0, DESK_W - vw);
    const maxScrollY = Math.max(0, DESK_H - vh);
    let sx = window.scrollX;
    let sy = window.scrollY;
    if(sx < 0) sx = 0;
    if(sy < 0) sy = 0;
    if(sx > maxScrollX) sx = maxScrollX;
    if(sy > maxScrollY) sy = maxScrollY;
    if(sx !== window.scrollX || sy !== window.scrollY){
        window.scrollTo(sx, sy);
    }
}

function centerOnContrat(){
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Contrat: left:1340px, top:850px, size 520x700
    // Center of contrat: 1340 + 260 = 1600, 850 + 350 = 1200
    const targetX = 1600 - vw / 2;
    const targetY = 1200 - vh / 2;
    window.scrollTo(targetX, targetY);
    clampScroll();
}

window.addEventListener('load', () => {
    centerOnContrat();
    setTimeout(centerOnContrat, 100);
});
window.addEventListener('resize', () => {
    centerOnContrat();
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(centerOnContrat, 50);
    setTimeout(centerOnContrat, 300);
});

// Mouse drag panning
document.addEventListener('mousedown', (e) => {
    if(e.target.closest('.doc-item') || e.target.closest('.doc-envelope') || e.target.closest('.doc-full') || e.target.closest('.desk-watch')) return;
    isDragging = true;
    startX = e.pageX;
    startY = e.pageY;
    scrollLeft = window.scrollX;
    scrollTop = window.scrollY;
    lastX = e.pageX;
    lastY = e.pageY;
    lastTime = Date.now();
    velocityX = 0;
    velocityY = 0;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if(!isDragging) return;
    e.preventDefault();
    const dx = e.pageX - startX;
    const dy = e.pageY - startY;
    window.scrollTo(scrollLeft - dx, scrollTop - dy);
    clampScroll();

    const now = Date.now();
    const dt = now - lastTime;
    if(dt > 0){
        velocityX = (e.pageX - lastX) / dt * 16;
        velocityY = (e.pageY - lastY) / dt * 16;
    }
    lastX = e.pageX;
    lastY = e.pageY;
    lastTime = now;
});

document.addEventListener('mouseup', () => {
    if(!isDragging) return;
    isDragging = false;
    document.body.style.cursor = 'grab';
    document.body.style.userSelect = '';
    function momentum(){
        velocityX *= 0.92;
        velocityY *= 0.92;
        if(Math.abs(velocityX) < 0.5 && Math.abs(velocityY) < 0.5){
            clampScroll();
            return;
        }
        window.scrollBy(-velocityX, -velocityY);
        clampScroll();
        rafId = requestAnimationFrame(momentum);
    }
    cancelAnimationFrame(rafId);
    momentum();
});

// Touch support
let touchStartX, touchStartY;
document.addEventListener('touchstart', (e) => {
    if(e.target.closest('.doc-item') || e.target.closest('.doc-envelope') || e.target.closest('.doc-full') || e.target.closest('.desk-watch')) return;
    const t = e.touches[0];
    touchStartX = t.pageX;
    touchStartY = t.pageY;
    scrollLeft = window.scrollX;
    scrollTop = window.scrollY;
}, {passive:false});

document.addEventListener('touchmove', (e) => {
    if(!touchStartX) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.pageX - touchStartX;
    const dy = t.pageY - touchStartY;
    window.scrollTo(scrollLeft - dx, scrollTop - dy);
    clampScroll();
}, {passive:false});

document.addEventListener('touchend', () => {
    touchStartX = null;
    touchStartY = null;
});

// ═══════════════════════════════════════
// ENVELOPES — REVEAL HIDDEN DOCS
// ═══════════════════════════════════════
const envelopes = document.querySelectorAll('.doc-envelope');

envelopes.forEach(env => {
    env.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = env.dataset.target;
        const targetDoc = document.getElementById(targetId);
        if(!targetDoc) return;

        env.classList.add('open');

        setTimeout(() => {
            targetDoc.classList.add('revealed');
            targetDoc.style.boxShadow = '0 0 60px var(--blood-glow), 0 8px 30px rgba(0,0,0,0.5)';
            setTimeout(() => {
                targetDoc.style.boxShadow = '';
            }, 800);
        }, 400);

        setTimeout(() => {
            env.style.display = 'none';
        }, 1000);
    });
});

// ═══════════════════════════════════════
// DOCUMENT FOCUS / ZOOM
// ═══════════════════════════════════════
const docs = document.querySelectorAll('.doc-item, .hidden-doc');
let focusedDoc = null;

function openDoc(doc){
    if(focusedDoc) return;
    if(doc.classList.contains('hidden-doc') && !doc.classList.contains('revealed')) return;

    focusedDoc = doc;
    doc.classList.add('focused');
    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'default';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.id = 'docCloseBtn';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDoc();
    });
    doc.querySelector('.doc-full').appendChild(closeBtn);

    if(doc.querySelector('.secret-full')){
        document.getElementById('scanlines').classList.add('active');
    }
}

function closeDoc(){
    if(!focusedDoc) return;
    const closeBtn = document.getElementById('docCloseBtn');
    if(closeBtn) closeBtn.remove();
    focusedDoc.classList.remove('focused');
    focusedDoc = null;
    document.body.style.overflow = '';
    document.body.style.cursor = 'grab';
    document.getElementById('scanlines').classList.remove('active');
}

docs.forEach(doc => {
    doc.addEventListener('click', (e) => {
        if(focusedDoc) return;
        e.stopPropagation();
        openDoc(doc);
    });
});

document.addEventListener('click', (e) => {
    if(focusedDoc && !e.target.closest('.doc-item') && !e.target.closest('.hidden-doc')){
        closeDoc();
    }
});

document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && focusedDoc){
        closeDoc();
    }
});

// ═══════════════════════════════════════
// REDACTED TEXT
// ═══════════════════════════════════════
(function(){
    document.querySelectorAll('.redacted').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            el.classList.toggle('revealed');
        });
    });
})();

// ═══════════════════════════════════════
// CONSOLE EASTER EGG
// ═══════════════════════════════════════
console.log("%c L'Office | Bureau d'Archives ", "background: #b89b6a; color: #0a0908; font-family: monospace; font-size: 14px; padding: 4px 8px;");
console.log("%c Dossier PM-1920 — Paolo Meres ", "color: #7a6540; font-family: monospace; font-size: 10px;");
console.log("%c ◈ Les enveloppes cachent les secrets. Ouvrez-les. ", "color: #5a5248; font-family: monospace; font-size: 10px;");