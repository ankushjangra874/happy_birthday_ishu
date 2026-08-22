/* ==========================================================================
   Romantic Birthday Wish — Script  (v4 — Video Memory Reel + Smooth)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. SLIDE NAVIGATION  (7 slides now)
    // =========================================================================
    let currentSlide = 1;
    const TOTAL = 7;

    function goToSlide(next) {
        if (next < 1 || next > TOTAL) return;

        const curEl  = document.getElementById(`slide-${currentSlide}`);
        const nextEl = document.getElementById(`slide-${next}`);
        if (!nextEl) return;

        playChime();

        if (curEl) {
            curEl.classList.add('slide-exit');
            setTimeout(() => curEl.classList.remove('active', 'slide-exit'), 480);
        }

        setTimeout(() => {
            nextEl.classList.add('active');
            currentSlide = next;
            onSlideEnter(next);
        }, 320);
    }

    function onSlideEnter(n) {
        if (n === 4) startLetterReveal();
        else stopLetterReveal();

        if (n === 5) initVideoReel();
        if (n === 6) initCandleMic();
    }

    // ── Button wiring ───────────────────────────────────────────────
    document.getElementById('btn-slide-1')?.addEventListener('click', () => { startSong(); goToSlide(2); });
    document.getElementById('btn-slide-2')?.addEventListener('click', () => goToSlide(3));
    document.getElementById('fallbackBtn')?.addEventListener('click',  voiceSuccess);
    document.getElementById('btn-slide-4')?.addEventListener('click', () => goToSlide(5));
    document.getElementById('btn-slide-6')?.addEventListener('click', () => goToSlide(7));

    document.getElementById('btnRestart')?.addEventListener('click', () => {
        // Reset all state
        document.querySelectorAll('.flame').forEach(f => f.classList.remove('out'));
        document.getElementById('slide6NextWrapper')?.classList.add('hidden');
        document.getElementById('wishBoxWrapper')?.classList.remove('hidden');
        document.getElementById('candleInstruction')?.classList.remove('hidden');
        document.getElementById('letterFinishWrapper')?.classList.add('hidden');
        currentLineIdx = 0;
        videoIdx = 0;
        resetVideoSlide();
        goToSlide(1);
    });

    document.body.addEventListener('click', () => startSong(), { once: true });

    // =========================================================================
    // 2. AUDIO
    // =========================================================================
    const bgMusic = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicToggle');
    let muted = false;
    let sfxCtx = null;

    function startSong() {
        if (!bgMusic || !bgMusic.paused) return;
        bgMusic.volume = 0.78;
        bgMusic.play().catch(() => {});
        muted = false;
        musicBtn?.classList.remove('muted');
    }

    musicBtn?.addEventListener('click', () => {
        if (!bgMusic) return;
        if (bgMusic.paused) { bgMusic.play(); muted = false; musicBtn.classList.remove('muted'); }
        else                { bgMusic.pause(); muted = true;  musicBtn.classList.add('muted'); }
    });

    function getSfxCtx() {
        if (!sfxCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) sfxCtx = new AC();
        }
        if (sfxCtx?.state === 'suspended') sfxCtx.resume();
        return sfxCtx;
    }

    function beep(freq, dur, vol = 0.07, type = 'sine') {
        const ctx = getSfxCtx();
        if (!ctx || muted) return;
        try {
            const osc = ctx.createOscillator();
            const g   = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.connect(g); g.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + dur);
        } catch(_) {}
    }

    function playChime() {
        [[523,0],[659,0.1],[784,0.2],[1047,0.32]].forEach(([f,d]) =>
            setTimeout(() => beep(f, 0.75, 0.09, 'triangle'), d * 1000)
        );
    }

    // =========================================================================
    // 3. PARTICLE ENGINE
    // =========================================================================
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx    = bgCanvas?.getContext('2d');
    let W = 0, H = 0;
    let particles = [];

    function resize() {
        if (!bgCanvas) return;
        W = bgCanvas.width  = window.innerWidth;
        H = bgCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function rand(a, b) { return Math.random() * (b - a) + a; }

    class Particle {
        constructor(forced) { this.respawn(forced); }
        respawn(forced) {
            const r = Math.random();
            this.type = forced || (r < 0.35 ? 'butterfly' : r < 0.65 ? 'heart' : 'petal');
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.size  = this.type === 'butterfly' ? rand(18,28) : this.type === 'heart' ? rand(14,22) : rand(8,14);
            this.vx    = rand(-1,1) * (this.type === 'butterfly' ? 1.2 : 0.5);
            this.vy    = this.type === 'heart' ? -rand(0.4,1.0) : this.type === 'petal' ? rand(0.4,0.9) : rand(-0.8,0.8);
            this.angle = Math.random() * Math.PI * 2;
            this.dAngle= rand(-0.025, 0.025);
            this.wing  = Math.random() * Math.PI * 2;
            this.dWing = rand(0.08, 0.16);
            this.alpha = rand(0.3, 0.75);
            this.color = rand(0,1) > 0.5 ? '#ff6b95' : '#f48fb1';
            this.emojis= ['❤️','💖','💕','💗','✨'];
            this.emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        }
        update() {
            if (this.type === 'butterfly') {
                this.wing += this.dWing;
                this.x += Math.cos(this.wing * 0.45) * 1.6 + this.vx;
                this.y += Math.sin(this.wing * 0.6)  * 1.1 + this.vy;
                if (this.x < -30 || this.x > W+30 || this.y < -30 || this.y > H+30) {
                    this.x = Math.random()*W; this.y = H+20; this.vy = -rand(0.5,1.2);
                }
            } else if (this.type === 'heart') {
                this.y += this.vy;
                this.x += Math.sin(this.y * 0.016) * 0.7;
                if (this.y < -30) { this.y = H+20; this.x = Math.random()*W; }
            } else {
                this.y += this.vy;
                this.angle += this.dAngle;
                this.x += Math.sin(this.y * 0.012) * 0.55;
                if (this.y > H+20) { this.y = -20; this.x = Math.random()*W; }
            }
        }
        draw() {
            if (!bgCtx) return;
            bgCtx.save();
            bgCtx.globalAlpha = this.alpha;
            bgCtx.translate(this.x, this.y);

            if (this.type === 'butterfly') {
                const ws = Math.abs(Math.sin(this.wing));
                bgCtx.rotate(Math.atan2(this.vy, this.vx));
                bgCtx.shadowBlur = 14; bgCtx.shadowColor = this.color;
                bgCtx.fillStyle = this.color;
                bgCtx.beginPath();
                bgCtx.ellipse(-this.size*0.38*ws, 0, this.size*0.55*ws, this.size*0.38, Math.PI/4, 0, Math.PI*2);
                bgCtx.fill();
                bgCtx.beginPath();
                bgCtx.ellipse( this.size*0.38*ws, 0, this.size*0.55*ws, this.size*0.38, -Math.PI/4, 0, Math.PI*2);
                bgCtx.fill();
                bgCtx.shadowBlur = 0; bgCtx.fillStyle = '#fff';
                bgCtx.beginPath();
                bgCtx.ellipse(0, 0, this.size*0.09, this.size*0.38, 0, 0, Math.PI*2);
                bgCtx.fill();
            } else if (this.type === 'heart') {
                bgCtx.shadowBlur = 16; bgCtx.shadowColor = '#ff4081';
                bgCtx.font = `${this.size}px sans-serif`;
                bgCtx.fillText(this.emoji, 0, 0);
            } else {
                bgCtx.rotate(this.angle);
                bgCtx.fillStyle = this.color;
                bgCtx.beginPath();
                bgCtx.moveTo(0, 0);
                bgCtx.bezierCurveTo( this.size*.5, -this.size*.5,  this.size, 0, 0, this.size);
                bgCtx.bezierCurveTo(-this.size,    0,             -this.size*.5, -this.size*.5, 0, 0);
                bgCtx.fill();
            }
            bgCtx.restore();
        }
    }

    for (let i = 0; i < 48; i++) particles.push(new Particle());

    (function animate() {
        bgCtx?.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    })();

    function burst(x, y, n = 18) {
        for (let i = 0; i < n; i++) {
            const p = new Particle(i % 2 === 0 ? 'butterfly' : 'heart');
            p.x = x ?? W/2; p.y = y ?? H/2;
            p.vx = rand(-5,5); p.vy = rand(-6,2);
            p.size = rand(20,34);
            particles.push(p);
        }
        if (particles.length > 90) particles.splice(0, particles.length - 80);
    }

    // =========================================================================
    // 4. SLIDE 3 — Speech Recognition
    // =========================================================================
    const micBtn     = document.getElementById('micBtn');
    const voiceStatus= document.getElementById('voiceStatus');
    let recog = null;
    let listening = false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
        recog = new SR();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onstart = () => {
            listening = true;
            micBtn?.parentElement?.classList.add('listening');
            if (voiceStatus) voiceStatus.textContent = 'Listening... Say "I love you" ❤️';
        };
        recog.onresult = (ev) => {
            const t = Array.from(ev.results).map(r => r[0].transcript).join('').toLowerCase();
            if (voiceStatus) voiceStatus.textContent = `"${t}"...`;
            if (t.includes('love')) { recog.stop(); voiceSuccess(); }
        };
        recog.onerror = () => {
            listening = false;
            micBtn?.parentElement?.classList.remove('listening');
            if (voiceStatus) voiceStatus.textContent = 'Could not hear. Tap button below! ❤️';
        };
        recog.onend = () => {
            listening = false;
            micBtn?.parentElement?.classList.remove('listening');
        };
    }

    micBtn?.addEventListener('click', () => {
        startSong();
        if (recog) {
            if (listening) recog.stop();
            else { try { recog.start(); } catch(_) { voiceSuccess(); } }
        } else { voiceSuccess(); }
    });

    function voiceSuccess() {
        if (voiceStatus) voiceStatus.textContent = 'I love you too! ❤️ Opening your letter...';
        playChime(); burst();
        setTimeout(() => goToSlide(4), 1200);
    }

    // =========================================================================
    // 5. SLIDE 4 — Love Letter Sequential Reveal
    // =========================================================================
    const LINES = [
        "Happy Birthday, my love, my bebuu, my baby girl! ❤️🥺",
        "Today is not just another day for me. It's the day the most beautiful and special person in my life was born, and I honestly feel so lucky that you are a part of my life. ❤️",
        "I don't think words will ever be enough to explain how much I love you, but today I just want to tell you everything that I sometimes fail to say.",
        "My bebuu, thank you for always taking care of me, understanding me, and being there for me. ❤️ Whenever I'm angry, upset, or in a bad mood, you still try to make me smile. No matter how much I get angry or how much I get upset with you, you always come back and make me feel better. 🥺",
        "And the thing that means the most to me is how you forgive me every single time. Even when I make mistakes, even when I behave stupidly, you still choose to understand me and stay with me. I know I'm not perfect, and sometimes my anger and mood can be difficult, but you always handle me with so much love and patience. ❤️",
        "I notice all the little things you do for me, even if I don't always say it. The way you care about me, worry about me, understand my mood, and try to make everything okay—it all means more to me than you could ever imagine. 🥹❤️",
        "You are my bebuu, my baby girl, my favourite person, and someone I love with all my heart. ❤️",
        "On your birthday, I just want to wish you all the happiness in the world. I hope every dream you have comes true, I hope you always have reasons to smile, and I hope life gives you all the beautiful things you deserve. 🎂✨",
        "And I hope I can always be there to celebrate your happiness, support you when things are difficult, and make you smile whenever you need it. ❤️",
        "Thank you for coming into my life. Thank you for loving me, caring for me, forgiving me, understanding me, and for never giving up on me even when I'm being difficult. 🥺❤️",
        "I love you so much, my bebuu. Maybe I don't say it perfectly every time, but you are genuinely one of the most precious people in my life. ❤️",
        "So today, forget everything else and just enjoy your day, my baby girl. You deserve to feel special today because you really are special to me. 🫶🏻❤️",
        "Happy Birthday, My Love. ❤️🎂",
        "Happy Birthday, My Bebuu. 🥺❤️",
        "Happy Birthday, My Baby Girl. 🎀❤️",
        "I love you more than I can ever put into words. ❤️🥺🫶🏻"
    ];

    const PHOTOS = ['/photo1.jpg','/photo2.jpg','/photo3.jpg','/photo4.jpg','/photo5.jpg'];

    let currentLineIdx = 0;
    let autoPlay = false;
    let lineTimer = null;

    const lineEl      = document.getElementById('currentLetterLine');
    const counterEl   = document.getElementById('lineCounter');
    const letterPhoto = document.getElementById('letterPhoto');
    const finishEl    = document.getElementById('letterFinishWrapper');
    const pauseBtn    = document.getElementById('pauseCreditsBtn');
    const prevBtn     = document.getElementById('prevLineBtn');
    const nextBtn     = document.getElementById('nextLineBtn');

    function showLine(idx) {
        if (idx < 0) idx = 0;
        if (idx >= LINES.length) idx = LINES.length - 1;
        currentLineIdx = idx;

        if (counterEl) counterEl.textContent = `${idx+1} / ${LINES.length}`;

        if (letterPhoto) {
            const next = PHOTOS[idx % PHOTOS.length];
            if (!letterPhoto.src.endsWith(next)) {
                letterPhoto.style.opacity = '0';
                setTimeout(() => { letterPhoto.src = next; letterPhoto.style.opacity = '1'; }, 220);
            }
        }

        if (lineEl) {
            lineEl.style.animation = 'none';
            lineEl.offsetHeight; // trigger reflow
            lineEl.style.animation = '';
            lineEl.textContent = LINES[idx];
        }

        burst(W/2, H*0.55, 8);

        if (idx === LINES.length - 1) {
            finishEl?.classList.remove('hidden');
            stopAuto();
            return;
        }

        if (autoPlay) {
            if (lineTimer) clearTimeout(lineTimer);
            lineTimer = setTimeout(() => showLine(currentLineIdx + 1), 4800);
        }
    }

    function startAuto() {
        autoPlay = true;
        if (pauseBtn) pauseBtn.textContent = '⏸️ Pause';
        showLine(currentLineIdx);
    }
    function stopAuto() {
        autoPlay = false;
        if (pauseBtn) pauseBtn.textContent = '▶️ Play';
        if (lineTimer) clearTimeout(lineTimer);
    }
    function startLetterReveal() { startAuto(); }
    function stopLetterReveal()  { stopAuto(); }

    pauseBtn?.addEventListener('click', () => autoPlay ? stopAuto() : startAuto());
    prevBtn?.addEventListener('click',  () => { stopAuto(); showLine(currentLineIdx - 1); });
    nextBtn?.addEventListener('click',  () => { stopAuto(); showLine(currentLineIdx + 1); });

    // =========================================================================
    // 6. SLIDE 5 — VIDEO MEMORY REEL ❤️
    // =========================================================================

    const VIDEO_SRCS = ['/video1.mp4', '/video2.mp4', '/video3.mp4'];

    const VIDEO_CAPTIONS = [
        "every moment with you is a treasure ❤️",
        "you make everything beautiful 🥺✨",
        "forever & always, it's you 💖"
    ];

    const TRANS_DATA = [
        { emoji: '💕', text: 'And here comes another memory...' },
        { emoji: '🥺', text: 'The most precious moments of my life...' },
    ];

    let videoIdx   = 0;
    let reelStarted = false;

    const videoIntro    = document.getElementById('videoIntro');
    const videoPlayerWrap= document.getElementById('videoPlayerWrap');
    const memoryVideo   = document.getElementById('memoryVideo');
    const videoFlash    = document.getElementById('videoFlash');
    const videoCaption  = document.getElementById('videoCaption');
    const videoTransCard= document.getElementById('videoTransCard');
    const transEmoji    = document.getElementById('transEmoji');
    const transText     = document.getElementById('transText');
    const vDots         = document.querySelectorAll('.vdot');

    function resetVideoSlide() {
        reelStarted = false;
        videoIdx = 0;
        videoIntro?.classList.remove('hidden');
        videoPlayerWrap?.classList.add('hidden');
        videoTransCard?.classList.add('hidden');
        if (memoryVideo) { memoryVideo.pause(); memoryVideo.src = ''; }
        updateDots(-1);
    }

    function updateDots(activeIdx) {
        vDots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < activeIdx)  dot.classList.add('done');
            if (i === activeIdx) dot.classList.add('active');
        });
    }

    function initVideoReel() {
        if (reelStarted) return;
        reelStarted = true;

        // Show intro for 2.5s then start first video
        setTimeout(() => {
            flashTransition(() => {
                videoIntro?.classList.add('hidden');
                startVideo(0);
            });
        }, 2500);
    }

    function startVideo(idx) {
        if (!memoryVideo) return;
        videoIdx = idx;

        // Show player
        videoPlayerWrap?.classList.remove('hidden');
        videoTransCard?.classList.add('hidden');

        // Reset animation
        videoPlayerWrap.style.animation = 'none';
        videoPlayerWrap.offsetHeight;
        videoPlayerWrap.style.animation = '';

        // Set source and caption
        memoryVideo.src = VIDEO_SRCS[idx];
        memoryVideo.load();

        if (videoCaption) {
            videoCaption.style.animation = 'none';
            videoCaption.offsetHeight;
            videoCaption.style.animation = '';
            videoCaption.textContent = VIDEO_CAPTIONS[idx];
        }

        updateDots(idx);
        burst(W/2, H/2, 14);

        // Autoplay with sound allowed
        memoryVideo.play().catch(err => {
            console.log('Autoplay blocked, trying muted:', err);
            memoryVideo.muted = true;
            memoryVideo.play().catch(() => {});
        });

        // When this video ends
        memoryVideo.onended = () => onVideoEnded(idx);
    }

    function onVideoEnded(idx) {
        const nextIdx = idx + 1;

        if (nextIdx >= VIDEO_SRCS.length) {
            // All videos done — go to slide 6 (cake)
            flashTransition(() => {
                videoPlayerWrap?.classList.add('hidden');
                burst(W/2, H/2, 30);
                playChime();
                setTimeout(() => goToSlide(6), 400);
            });
            return;
        }

        // Show between-video transition card
        const td = TRANS_DATA[idx] || { emoji: '💫', text: 'One more memory...' };
        if (transEmoji) transEmoji.textContent = td.emoji;
        if (transText)  transText.textContent  = td.text;

        flashTransition(() => {
            videoPlayerWrap?.classList.add('hidden');
            videoTransCard?.classList.remove('hidden');

            // Re-trigger animations on trans card
            if (transEmoji) { transEmoji.style.animation='none'; transEmoji.offsetHeight; transEmoji.style.animation=''; }
            if (transText)  { transText.style.animation='none';  transText.offsetHeight;  transText.style.animation=''; }

            burst(W/2, H/2, 16);

            // After 2.2s show next video
            setTimeout(() => {
                flashTransition(() => startVideo(nextIdx));
            }, 2200);
        });
    }

    function flashTransition(callback) {
        if (!videoFlash) { callback(); return; }

        // Flash IN (instant white)
        videoFlash.classList.remove('flash-out');
        videoFlash.classList.add('flash-in');

        setTimeout(() => {
            // Execute the change during white flash
            callback?.();

            // Flash OUT (slow fade to transparent)
            videoFlash.classList.remove('flash-in');
            videoFlash.classList.add('flash-out');

            setTimeout(() => videoFlash.classList.remove('flash-out'), 650);
        }, 120);
    }

    // =========================================================================
    // 7. SLIDE 6 — Candle Blowing & Wish Lanterns
    // =========================================================================
    const flames = document.querySelectorAll('.flame');

    function blowCandles() {
        let anyLit = false;
        flames.forEach(f => { if (!f.classList.contains('out')) anyLit = true; });
        if (!anyLit) return;
        flames.forEach(f => f.classList.add('out'));
        beep(300, 0.5, 0.15, 'sine');
        setTimeout(() => playChime(), 350);
        burst(W/2, H*0.6, 20);

        const instr = document.getElementById('candleInstruction');
        if (instr) instr.innerHTML = '<span style="color:var(--gold);font-size:1.1rem;">✨ Candles out! Make your wish...</span>';
    }

    document.getElementById('blowCandleBtn')?.addEventListener('click', blowCandles);
    document.getElementById('cakeContainer')?.addEventListener('click', blowCandles);

    function initCandleMic() {
        if (!navigator.mediaDevices?.getUserMedia) return;
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const AC = window.AudioContext || window.webkitAudioContext;
            const ac = new AC();
            const an = ac.createAnalyser();
            const src = ac.createMediaStreamSource(stream);
            const proc = ac.createScriptProcessor(2048, 1, 1);
            an.smoothingTimeConstant = 0.8; an.fftSize = 1024;
            src.connect(an); an.connect(proc); proc.connect(ac.destination);
            proc.onaudioprocess = () => {
                const buf = new Uint8Array(an.frequencyBinCount);
                an.getByteFrequencyData(buf);
                const avg = buf.reduce((a,b) => a+b, 0) / buf.length;
                if (avg > 44) {
                    blowCandles();
                    proc.onaudioprocess = null;
                    stream.getTracks().forEach(t => t.stop());
                }
            };
        }).catch(() => {});
    }

    document.getElementById('btnReleaseWish')?.addEventListener('click', () => {
        blowCandles();
        launchLanterns();
        document.getElementById('wishBoxWrapper')?.classList.add('hidden');
        document.getElementById('slide6NextWrapper')?.classList.remove('hidden');
        playChime();
        burst(W/2, H/2, 24);
    });

    // =========================================================================
    // 8. WISH LANTERNS (Canvas)
    // =========================================================================
    const wCanvas = document.getElementById('wishCanvas');
    const wCtx    = wCanvas?.getContext('2d');
    let lanterns  = [];

    function launchLanterns() {
        if (!wCanvas || !wCtx) return;
        wCanvas.width  = window.innerWidth;
        wCanvas.height = window.innerHeight;
        for (let i = 0; i < 20; i++) {
            lanterns.push({
                x: rand(0, wCanvas.width),
                y: wCanvas.height + rand(0, 250),
                vy: rand(1.0, 2.2),
                sz: rand(22, 40),
                sway: rand(0, Math.PI * 2)
            });
        }
        animateLanterns();
    }

    function animateLanterns() {
        if (!wCtx || !wCanvas) return;
        wCtx.clearRect(0, 0, wCanvas.width, wCanvas.height);
        lanterns = lanterns.filter(l => l.y > -60);
        lanterns.forEach(l => {
            l.y -= l.vy;
            l.sway += 0.03;
            l.x += Math.sin(l.sway) * 0.6;
            wCtx.save();
            wCtx.translate(l.x, l.y);
            wCtx.shadowBlur = 22; wCtx.shadowColor = '#f8dfa1';
            wCtx.fillStyle = 'rgba(248,223,161,0.88)';
            wCtx.beginPath();
            if (wCtx.roundRect) wCtx.roundRect(-l.sz/2, -l.sz/2, l.sz, l.sz*1.25, 8);
            else wCtx.rect(-l.sz/2, -l.sz/2, l.sz, l.sz*1.25);
            wCtx.fill();
            wCtx.fillStyle = '#ff6000';
            wCtx.beginPath();
            wCtx.arc(0, l.sz*0.28, l.sz*0.22, 0, Math.PI*2);
            wCtx.fill();
            wCtx.restore();
        });
        if (lanterns.length > 0) requestAnimationFrame(animateLanterns);
    }

});
