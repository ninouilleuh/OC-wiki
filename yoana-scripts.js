/* ═══════════════════════════════════════════════
   YOANA NOXLEY — SCRIPTS (VERSION SECRÈTE)
   L'Office | 1920 — Archives Classifiées
   Mode Raven : KONAMI CODE UNIQUEMENT
   ═══════════════════════════════════════════════ */

(function() {
    'use strict';

    const CONFIG = {
        featherCount: 35,
        runeCount: 15,
        bloodDropCount: 40,
        quoteInterval: 6000,
        revealThreshold: 0.1,
        statThreshold: 0.3,
        konamiCode: ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'],
        konamiTimeout: 3000 // 3 secondes max entre chaque touche
    };

    const state = {
        ravenRevealed: false,
        konamiIndex: 0,
        konamiTriggered: false,
        konamiLastTime: 0,
        attentionLevel: 0,
        quotes: {
            cover: [
                "Le silence est le langage des intelligences supérieures.",
                "Chaque secret a un prix. Le mien est plus élevé que vous ne le pensez.",
                "Je ne tue pas. Je fais en sorte que les autres se détruisent eux-mêmes.",
                "Le temps appartient à ceux qui savent l'écouter.",
                "Un corbeau ne chante pas. Il observe. Il attend. Il frappe.",
                "Pourquoi les adultes croient-ils toujours qu'ils ont la seule vraie réponse ?",
                "L'élégance est une arme. Le silence est une forteresse.",
                "Les ombres me connaissent par mon nom."
            ],
            secret: [
                "Le pouvoir n'est pas dans le fait de frapper fort. Le pouvoir est dans le fait de savoir exactement où frapper.",
                "Chaque plume sur mon chapeau est un secret enterré.",
                "Je vois à travers vos mensonges comme à travers du verre.",
                "L'Office ne pardonne pas. L'Office n'oublie jamais.",
                "La montre ne mesure pas le temps. Elle mesure ce qui vous reste.",
                "Certains monstres portent des gants de velours.",
                "La vérité est une arme à double tranchant. Moi, je préfère les couteaux.",
                "Nora est ma main droite. Paolo est ma carte cachée."
            ]
        }
    };

    const DOM = {
        body: document.body,
        feathersContainer: document.getElementById('feathers-container'),
        runesContainer: document.getElementById('runes-container'),
        bloodRainContainer: document.getElementById('blood-rain-container'),
        ravenEye: document.getElementById('raven-eye'),
        lightbox: document.getElementById('lightbox'),
        lightboxImg: document.getElementById('lightbox-img'),
        secretTerminal: document.getElementById('secret-terminal'),
        quoteBox: document.getElementById('quote-box'),
        quoteBoxSecret: document.getElementById('quote-box-secret'),
        dossierCode: document.querySelector('.char-hero .dossier-code'),
        heroTagline: document.querySelector('.char-hero .tagline'),
        heroMetaItems: document.querySelectorAll('.char-hero .meta-item span')
    };

    function initFeathers() {
        let container = document.getElementById('feathers-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'feathers-container';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9990;overflow:hidden;';
            document.body.appendChild(container);
        }
        for (let i = 0; i < CONFIG.featherCount; i++) {
            const f = document.createElement('span');
            f.classList.add('feather');
            f.style.left = Math.random() * 100 + 'vw';
            f.style.top = (-Math.random() * 100) + 'vh';
            f.style.animationDuration = (10 + Math.random() * 15) + 's';
            f.style.animationDelay = (-Math.random() * 20) + 's';
            f.style.opacity = (0.15 + Math.random() * 0.2).toString();
            const size = 0.8 + Math.random() * 0.6;
            f.style.transform = 'scale(' + size + ')';
            container.appendChild(f);
        }
    }

    const RUNES = ['\u16A0','\u16A2','\u16A6','\u16A8','\u16B1','\u16B2','\u16B7','\u16B9','\u16BA','\u16BE','\u16C1','\u16C3','\u16C7','\u16C8','\u16C9','\u16CB','\u16CF','\u16D2','\u16D6','\u16D7','\u16DA','\u16DC','\u16DE','\u16DF'];

    function initRunes() {
        let container = document.getElementById('runes-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'runes-container';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9991;overflow:hidden;';
            document.body.appendChild(container);
        }
        for (let i = 0; i < CONFIG.runeCount; i++) {
            const rune = document.createElement('span');
            rune.classList.add('rune');
            rune.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];
            rune.style.left = Math.random() * 100 + 'vw';
            rune.style.animationDuration = (6 + Math.random() * 10) + 's';
            rune.style.animationDelay = (Math.random() * 8) + 's';
            rune.style.fontSize = (0.5 + Math.random() * 0.5) + 'rem';
            container.appendChild(rune);
        }
    }

    function initBloodRain() {
        let container = document.getElementById('blood-rain-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'blood-rain-container';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9992;overflow:hidden;';
            document.body.appendChild(container);
        }
        for (let i = 0; i < CONFIG.bloodDropCount; i++) {
            const drop = document.createElement('div');
            drop.classList.add('blood-drop');
            drop.style.left = Math.random() * 100 + 'vw';
            drop.style.animationDuration = (0.5 + Math.random() * 1) + 's';
            drop.style.animationDelay = (Math.random() * 2) + 's';
            drop.style.height = (10 + Math.random() * 20) + 'px';
            container.appendChild(drop);
        }
    }

    function initRavenEye() {
        if (!DOM.ravenEye) return;
        let mouseX = 0, mouseY = 0;
        let eyeX = 0, eyeY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        function animateEye() {
            eyeX += (mouseX - eyeX) * 0.15;
            eyeY += (mouseY - eyeY) * 0.15;
            DOM.ravenEye.style.left = eyeX + 'px';
            DOM.ravenEye.style.top = eyeY + 'px';
            requestAnimationFrame(animateEye);
        }
        animateEye();
    }

    const COVER_SECTIONS = [
        'resumeCover','enfanceCover','apparenceCover','personnaliteCover',
        'competencesCover','statsCover','objetsCover','galerieCover',
        'citationsCover','relationsCover'
    ];
    const SECRET_SECTIONS = [
        'resumeSecret','enfanceSecret','apparenceSecret','personnaliteSecret',
        'competencesSecret','statsSecret','objetsSecret','galerieSecret',
        'citationsSecret','relationsSecret','secretOmega'
    ];

    function activateRavenMode() {
        if (state.ravenRevealed) return; // Irréversible
        state.ravenRevealed = true;
        
        DOM.body.classList.add('raven-active');
        
        const infoboxCover = document.getElementById('infoboxCover');
        const infoboxSecret = document.getElementById('infoboxSecret');
        if (infoboxCover) infoboxCover.style.display = 'none';
        if (infoboxSecret) {
            infoboxSecret.style.display = 'block';
            infoboxSecret.classList.add('visible');
        }
        
        COVER_SECTIONS.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                el.style.opacity = '0';
                el.style.transform = 'translateY(-10px)';
                setTimeout(() => { el.style.display = 'none'; }, 350);
            }
        });
        
        SECRET_SECTIONS.forEach((id, index) => {
            const el = document.getElementById(id);
            if (el) {
                setTimeout(() => {
                    el.style.display = 'block';
                    el.classList.add('visible');
                    el.classList.add('reveal');
                    requestAnimationFrame(() => el.classList.add('visible'));
                }, 400 + index * 80);
            }
        });
        
        if (DOM.dossierCode) {
            DOM.dossierCode.innerHTML = "Dossier #YN-1920 — Niveau d'accès : <span style='color:var(--crimson-soft)'>OMÉGA</span>";
        }
        if (DOM.heroMetaItems[2]) DOM.heroMetaItems[2].textContent = "Directrice de l'Office";
        if (DOM.heroMetaItems[3]) DOM.heroMetaItems[3].textContent = "Actif — Niveau IV";
        if (DOM.heroTagline) {
            DOM.heroTagline.style.opacity = '0';
            setTimeout(() => {
                DOM.heroTagline.textContent = "« The Black Raven — celle qui voit tout »";
                DOM.heroTagline.style.opacity = '1';
            }, 300);
        }
        if (DOM.runesContainer) DOM.runesContainer.classList.add('active');
        
        showTerminal();
        
        setTimeout(() => {
            const resumeSecret = document.getElementById('resumeSecret');
            if (resumeSecret) resumeSecret.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 700);
        
        setTimeout(() => {
            const statsSecret = document.getElementById('statsSecret');
            if (statsSecret) animateStats(statsSecret);
        }, 1200);
    }

    const TERMINAL_MESSAGES = [
        { text: 'Connexion établie...', delay: 0 },
        { text: 'Déchiffrement des archives...', delay: 400 },
        { text: 'Accès niveau OMÉGA accordé.', delay: 800 },
        { text: 'Bienvenue, Corbeau.', delay: 1200 },
        { text: '> _', delay: 1600, blink: true }
    ];

    function showTerminal() {
        if (!DOM.secretTerminal) return;
        DOM.secretTerminal.innerHTML = '<div class="terminal-header"><span>TERMINAL — ARCHIVES</span><span style="color:var(--crimson-soft)">●</span></div>';
        DOM.secretTerminal.classList.add('active');
        TERMINAL_MESSAGES.forEach((msg) => {
            setTimeout(() => {
                const line = document.createElement('div');
                line.classList.add('terminal-line');
                line.style.animationDelay = '0s';
                if (msg.blink) {
                    line.innerHTML = '<span class="terminal-prompt">></span> <span class="terminal-cursor"></span>';
                } else {
                    line.innerHTML = '<span class="terminal-prompt">></span> ' + msg.text;
                }
                DOM.secretTerminal.appendChild(line);
            }, msg.delay);
        });
        setTimeout(() => { hideTerminal(); }, 8000);
    }

    function hideTerminal() {
        if (!DOM.secretTerminal) return;
        DOM.secretTerminal.style.opacity = '0';
        setTimeout(() => {
            DOM.secretTerminal.classList.remove('active');
            DOM.secretTerminal.style.opacity = '1';
        }, 500);
    }

    let currentQuoteIndex = 0;
    let quoteIntervalId = null;

    function rotateQuotes() {
        const isSecret = state.ravenRevealed;
        const quotes = isSecret ? state.quotes.secret : state.quotes.cover;
        const box = isSecret ? DOM.quoteBoxSecret : DOM.quoteBox;
        if (!box) return;
        box.innerHTML = '<p class="quote-fade">' + quotes[currentQuoteIndex] + '</p>';
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    }

    function startQuoteRotator() {
        rotateQuotes();
        quoteIntervalId = setInterval(rotateQuotes, CONFIG.quoteInterval);
    }

    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: CONFIG.revealThreshold });
        revealElements.forEach(el => observer.observe(el));
    }

    function animateStats(container) {
        if (!container) return;
        const bars = container.querySelectorAll('.bar-fill');
        bars.forEach((bar, i) => {
            const width = bar.dataset.width;
            bar.style.width = '0%';
            setTimeout(() => { bar.style.width = width + '%'; }, 200 + i * 100);
        });
    }

    function initStatsObserver() {
        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats(entry.target);
                    statObserver.unobserve(entry.target);
                }
            });
        }, { threshold: CONFIG.statThreshold });
        document.querySelectorAll('#statsCover, #statsSecret').forEach(el => {
            if (el) statObserver.observe(el);
        });
    }

    function openLightbox(element) {
        const img = element.querySelector('img');
        if (!img || !DOM.lightbox || !DOM.lightboxImg) return;
        DOM.lightboxImg.src = img.src;
        DOM.lightboxImg.alt = img.alt;
        DOM.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!DOM.lightbox) return;
        DOM.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function initNavHighlight() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    }

    // ═══════════════════════════════════════════════
    // KONAMI CODE — SEULE MÉTHODE D'ACTIVATION
    // ═══════════════════════════════════════════════

    function initKonamiCode() {
        document.addEventListener('keydown', (e) => {
            const now = Date.now();
            
            // Reset si trop de temps entre deux touches
            if (now - state.konamiLastTime > CONFIG.konamiTimeout) {
                state.konamiIndex = 0;
            }
            state.konamiLastTime = now;
            
            if (e.key === CONFIG.konamiCode[state.konamiIndex]) {
                state.konamiIndex++;
                if (state.konamiIndex === CONFIG.konamiCode.length) {
                    triggerKonami();
                    state.konamiIndex = 0;
                }
            } else {
                state.konamiIndex = 0;
            }
        });
    }

    function triggerKonami() {
        if (state.konamiTriggered) return;
        state.konamiTriggered = true;
        
        // Effet visuel temporaire
        DOM.body.classList.add('konami-active');
        if (DOM.bloodRainContainer) DOM.bloodRainContainer.classList.add('active');
        
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-mono);font-size:1.5rem;color:var(--crimson);z-index:10001;text-align:center;letter-spacing:4px;text-shadow:0 0 20px var(--crimson-glow);pointer-events:none;';
        msg.innerHTML = 'PROTOCOLE KONAMI ACTIVÉ<br><span style="font-size:0.8rem;color:var(--text-muted)">Les ombres se souviennent de tout</span>';
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.remove();
            DOM.body.classList.remove('konami-active');
            if (DOM.bloodRainContainer) DOM.bloodRainContainer.classList.remove('active');
            activateRavenMode(); // Active le mode Raven APRÈS l'effet
        }, 2000);
    }

    function initMouseTrail() {
        let lastTrail = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTrail < 50) return;
            lastTrail = now;
            const trail = document.createElement('div');
            trail.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:3px;height:3px;background:rgba(184,155,106,0.3);border-radius:50%;pointer-events:none;z-index:9998;transition:opacity 1s ease,transform 1s ease;';
            document.body.appendChild(trail);
            requestAnimationFrame(() => {
                trail.style.opacity = '0';
                trail.style.transform = 'scale(0)';
            });
            setTimeout(() => trail.remove(), 1000);
        });
    }

    function initParallax() {
        const hero = document.querySelector('.char-hero');
        if (!hero) return;
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled < window.innerHeight * 0.8) {
                hero.style.transform = 'translateY(' + (scrolled * 0.15) + 'px)';
            }
        });
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
            // ❌ Plus de touche 'R' pour activer le mode Raven
        });
    }

    function initAttentionSystem() {
        if (!document.getElementById('attentionBar')) {
            const bar = document.createElement('div');
            bar.id = 'attentionBar';
            bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--blood-soft));z-index:10001;width:0%;transition:width 0.5s ease;';
            document.body.appendChild(bar);
        }
        const attentionBar = document.getElementById('attentionBar');
        let attentionLevel = 0;
        function updateAttention(amount) {
            attentionLevel = Math.min(attentionLevel + amount, 100);
            attentionBar.style.width = attentionLevel + '%';
        }
        document.querySelectorAll('.section, .gallery-item, .map-region, .char-card').forEach(el => {
            el.addEventListener('mouseenter', () => updateAttention(2));
        });
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const current = window.scrollY;
            if (Math.abs(current - lastScroll) > 100) {
                updateAttention(1);
                lastScroll = current;
            }
        });
    }

    function initConsoleEasterEgg() {
        console.log('%c L\'Office | 1920 ', 'background: #b89b6a; color: #0a0908; font-family: monospace; font-size: 14px; padding: 4px 8px;');
        console.log('%c Archives Classifiées — Dossier #YN-1920 ', 'color: #7a6540; font-family: monospace; font-size: 10px;');
        console.log('%c ◈ Essayez le Konami Code (↑↑↓↓←→←→BA)... ', 'color: #5a5248; font-family: monospace; font-size: 10px;');
        // ❌ Plus d'indice sur le double-clic ou la touche R
    }


    // ═══════════════════════════════════════════════
    // RUNES AU SURVOL DES TITRES
    // ═══════════════════════════════════════════════

    function initHoverRunes() {
        // Créer un conteneur absolute sur tout le document (pas fixed)
        let hoverContainer = document.getElementById('hover-runes-container');
        if (!hoverContainer) {
            hoverContainer = document.createElement('div');
            hoverContainer.id = 'hover-runes-container';
            hoverContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:0;pointer-events:none;z-index:99999;overflow:visible;';
            document.body.appendChild(hoverContainer);
        }

        const titles = document.querySelectorAll('h1, h2, h3, .section-title, .char-title, [class*="title"]');
        let lastSpawn = 0;

        titles.forEach(title => {
            title.addEventListener('mousemove', function(e) {
                const now = Date.now();
                if (now - lastSpawn < 120) return;
                lastSpawn = now;
                // pageX/pageY = position absolue dans le document (inclut le scroll)
                spawnHoverRunes(e.pageX, e.pageY);
            });
        });
    }

    function spawnHoverRunes(pageX, pageY) {
        const hoverContainer = document.getElementById('hover-runes-container');
        if (!hoverContainer) return;

        for (let i = 0; i < 4; i++) {
            const rune = document.createElement('span');
            rune.textContent = RUNES[Math.floor(Math.random() * RUNES.length)];
            rune.style.cssText = 'position:absolute;pointer-events:none;z-index:99999;font-family:monospace;color:#b89b6a;text-shadow:0 0 10px #b89b6a,0 0 20px #b89b6a;opacity:0;font-size:1.4rem;white-space:nowrap;';

            // Position de départ: aléatoire autour de la souris (5-15px)
            const startAngle = Math.random() * Math.PI * 2;
            const startDist = 5 + Math.random() * 10;
            const startX = pageX + Math.cos(startAngle) * startDist;
            const startY = pageY + Math.sin(startAngle) * startDist;

            // Position d'arrivée: plus loin
            const endAngle = startAngle + (Math.random() - 0.5) * 1.2;
            const endDist = startDist + 30 + Math.random() * 40;
            const endX = pageX + Math.cos(endAngle) * endDist;
            const endY = pageY + Math.sin(endAngle) * endDist;

            rune.style.left = startX + 'px';
            rune.style.top = startY + 'px';

            hoverContainer.appendChild(rune);

            // Force reflow
            rune.offsetHeight;

            rune.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            rune.style.opacity = '1';
            rune.style.left = endX + 'px';
            rune.style.top = endY + 'px';
            rune.style.transform = 'rotate(' + (Math.random() * 360 - 180) + 'deg) scale(1.2)';

            setTimeout(() => {
                rune.style.opacity = '0';
                rune.style.transform = 'rotate(' + (Math.random() * 360 - 180) + 'deg) scale(0.1)';
                setTimeout(() => rune.remove(), 800);
            }, 600);
        }
    }

    function init() {
        initFeathers();
        initRunes();
        initBloodRain();
        initRavenEye();
        initScrollReveal();
        initStatsObserver();
        initNavHighlight();
        initKonamiCode(); // Seule méthode d'activation
        initHoverRunes();   // Runes au survol des titres
        initMouseTrail();
        initParallax();
        initKeyboardShortcuts();
        initAttentionSystem();
        startQuoteRotator();
        initConsoleEasterEgg();

        // ❌ Plus d'écouteur sur ravenTrigger (supprimé du DOM)
        if (DOM.lightbox) {
            DOM.lightbox.addEventListener('click', closeLightbox);
        }
        window.openLightbox = openLightbox;
        window.closeLightbox = closeLightbox;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
