// ═══════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════
class AudioEngine{
    constructor(){
        this.ctx=null;
        this.masterGain=null;
        this.osc1=null;
        this.osc2=null;
        this.noise=null;
        this.filter=null;
        this.lfo=null;
        this.isPlaying=false;
        this.scrollPercent=0;
    }

    init(){
        this.ctx=new(window.AudioContext||window.webkitAudioContext)();
        this.masterGain=this.ctx.createGain();
        this.masterGain.gain.value=0;
        this.masterGain.connect(this.ctx.destination);

        this.osc1=this.ctx.createOscillator();
        this.osc1.type='sine';
        this.osc1.frequency.value=55;
        const gain1=this.ctx.createGain();
        gain1.gain.value=0.4;
        this.osc1.connect(gain1);
        gain1.connect(this.masterGain);
        this.osc1.start();

        this.osc2=this.ctx.createOscillator();
        this.osc2.type='triangle';
        this.osc2.frequency.value=110;
        const gain2=this.ctx.createGain();
        gain2.gain.value=0.08;
        this.osc2.connect(gain2);
        gain2.connect(this.masterGain);
        this.osc2.start();

        this.filter=this.ctx.createBiquadFilter();
        this.filter.type='lowpass';
        this.filter.frequency.value=120;
        this.filter.Q.value=1.2;

        this.lfo=this.ctx.createOscillator();
        this.lfo.type='sine';
        this.lfo.frequency.value=0.15;
        const lfoGain=this.ctx.createGain();
        lfoGain.gain.value=2;
        this.lfo.connect(lfoGain);
        lfoGain.connect(this.osc1.frequency);
        this.lfo.start();

        const bufferSize=this.ctx.sampleRate*2;
        const buffer=this.ctx.createBuffer(1,bufferSize,this.ctx.sampleRate);
        const data=buffer.getChannelData(0);
        for(let i=0;i<bufferSize;i++){data[i]=Math.random()*2-1;}
        this.noise=this.ctx.createBufferSource();
        this.noise.buffer=buffer;
        this.noise.loop=true;
        const noiseFilter=this.ctx.createBiquadFilter();
        noiseFilter.type='lowpass';
        noiseFilter.frequency.value=400;
        const noiseGain=this.ctx.createGain();
        noiseGain.gain.value=0.02;
        this.noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        this.noise.start();

        this.updateFromScroll();
        this.loop();
    }

    updateFromScroll(){
        const scrollMax=document.body.scrollHeight-window.innerHeight;
        this.scrollPercent=Math.min(window.scrollY/scrollMax,1);
        if(!this.ctx)return;
        const intensity=this.scrollPercent;
        this.filter.frequency.setTargetAtTime(80+intensity*520,this.ctx.currentTime,0.1);
        const targetVol=0.03+intensity*0.06;
        this.masterGain.gain.setTargetAtTime(targetVol,this.ctx.currentTime,0.2);
        this.osc2.frequency.setTargetAtTime(110+intensity*55,this.ctx.currentTime,0.1);
        this.lfo.frequency.setTargetAtTime(0.15+intensity*0.25,this.ctx.currentTime,0.1);
    }

    loop(){
        if(!this.isPlaying)return;
        this.updateFromScroll();
        requestAnimationFrame(()=>this.loop());
    }

    toggle(){
        if(!this.ctx){
            this.init();
            this.isPlaying=true;
            this.loop();
            return true;
        }
        if(this.ctx.state==='suspended'){
            this.ctx.resume();
            this.isPlaying=true;
            this.loop();
            return true;
        }
        if(this.isPlaying){
            this.masterGain.gain.setTargetAtTime(0,this.ctx.currentTime,0.5);
            setTimeout(()=>{this.ctx.suspend();this.isPlaying=false;},500);
            return false;
        }else{
            this.ctx.resume();
            this.isPlaying=true;
            this.loop();
            return true;
        }
    }
}

const audioEngine=new AudioEngine();

// ═══════════════════════════════════════
// SECURITY CLEARANCE POPUP
// ═══════════════════════════════════════
class SecurityPopup{
    constructor(){
        this.popup=document.getElementById('securityPopup');
        this.acceptBtn=document.getElementById('popupAccept');
        this.denyBtn=document.getElementById('popupDeny');
        this.trackingId=document.getElementById('trackingId');

        // Generate fake tracking ID
        this.trackingId.textContent='OFC-'+Math.random().toString(36).substr(2,6).toUpperCase()+'-'+Date.now().toString(36).substr(-4).toUpperCase();

        this.acceptBtn.addEventListener('click',()=>this.accept());
        this.denyBtn.addEventListener('click',()=>this.deny());
    }

    accept(){
        audioEngine.toggle();
        this.popup.classList.add('hidden');
        // Show attention label after popup closes
        setTimeout(()=>{
            document.getElementById('attentionLabel').classList.add('visible');
        },1000);
    }

    deny(){
        // Still close popup but don't start audio
        this.popup.classList.add('hidden');
        setTimeout(()=>{
            document.getElementById('attentionLabel').classList.add('visible');
        },1000);
    }
}

const securityPopup=new SecurityPopup();

// ═══════════════════════════════════════
// KONAMI CODE
// ═══════════════════════════════════════
class KonamiCode{
    constructor(){
        this.sequence=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        this.index=0;
        this.triggered=false;
        this.badge=document.querySelector('.security-badge .level');
        this.access=document.getElementById('accessLevel');

        document.addEventListener('keydown',(e)=>{
            if(this.triggered)return;
            if(e.key===this.sequence[this.index]){
                this.index++;
                if(this.index===this.sequence.length){
                    this.trigger();
                }
            }else{
                this.index=0;
            }
        });
    }

    trigger(){
        this.triggered=true;
        document.body.classList.add('declass-mode');
        this.badge.textContent='OMEGA';
        this.badge.style.color='var(--blood-soft)';
        this.access.textContent='ARCHIVISTE SUPREME';
        this.access.style.color='var(--blood-soft)';

        if(audioEngine.ctx){
            const osc=audioEngine.ctx.createOscillator();
            const gain=audioEngine.ctx.createGain();
            osc.type='square';
            osc.frequency.setValueAtTime(440,audioEngine.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880,audioEngine.ctx.currentTime+0.1);
            osc.frequency.exponentialRampToValueAtTime(1760,audioEngine.ctx.currentTime+0.2);
            gain.gain.setValueAtTime(0.1,audioEngine.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001,audioEngine.ctx.currentTime+0.5);
            osc.connect(gain);
            gain.connect(audioEngine.ctx.destination);
            osc.start();
            osc.stop(audioEngine.ctx.currentTime+0.5);
        }
    }
}

const konami=new KonamiCode();

// ═══════════════════════════════════════
// PARAGRAPH ANNOTATIONS (Notes de l'archiviste)
// ═══════════════════════════════════════
class ParagraphAnnotations{
    constructor(){
        document.querySelectorAll('.body-text p[data-note]').forEach(p=>{
            const noteText=p.dataset.note;
            if(!noteText)return;

            const annotation=document.createElement('div');
            annotation.className='para-annotation';
            annotation.innerHTML=`
                <div class="para-annotation-header">Note de l'archiviste — H. Maret, 1897</div>
                <span class="para-annotation-close">×</span>
                <div class="para-annotation-body">${noteText}</div>
            `;
            p.style.position='relative';
            p.appendChild(annotation);

            // Close button
            annotation.querySelector('.para-annotation-close').addEventListener('click',(e)=>{
                e.stopPropagation();
                annotation.classList.remove('visible');
            });

            // Toggle on paragraph click
            p.addEventListener('click',(e)=>{
                if(e.target.closest('.para-annotation'))return;
                // Close others
                document.querySelectorAll('.para-annotation.visible').forEach(other=>{
                    if(other!==annotation)other.classList.remove('visible');
                });
                annotation.classList.toggle('visible');
            });
        });
    }
}

const paragraphAnnotations=new ParagraphAnnotations();

// ═══════════════════════════════════════
// IMAGE ANNOTATIONS
// ═══════════════════════════════════════
class ImageAnnotations{
    constructor(){
        document.querySelectorAll('.img-frame[data-note]').forEach(frame=>{
            const noteText=frame.dataset.note;
            if(!noteText)return;

            const note=document.createElement('div');
            note.className='img-note';
            note.innerHTML=`
                <div class="img-note-header">
                    <span>Note de l'archiviste — H. Maret, 1897</span>
                    <span class="img-note-close" title="Fermer">×</span>
                </div>
                <div class="img-note-body">${noteText}</div>
            `;
            frame.appendChild(note);

            // Toggle on frame click
            frame.addEventListener('click',(e)=>{
                if(e.target.closest('.img-note'))return;
                document.querySelectorAll('.img-frame.show-note').forEach(other=>{
                    if(other!==frame)other.classList.remove('show-note');
                });
                frame.classList.toggle('show-note');
            });

            // Close button
            note.querySelector('.img-note-close').addEventListener('click',(e)=>{
                e.stopPropagation();
                frame.classList.remove('show-note');
            });
        });
    }
}

const imageAnnotations=new ImageAnnotations();

// ═══════════════════════════════════════
// TYPEWRITER SUR ARCHIVE BOXES
// ═══════════════════════════════════════
class ArchiveTypewriter{
    constructor(){
        this.typed=new WeakSet();

        const observer=new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                if(entry.isIntersecting&&!this.typed.has(entry.target)){
                    this.typed.add(entry.target);
                    this.typeBox(entry.target);
                }
            });
        },{threshold:0.3});

        document.querySelectorAll('.archive-box, .act-box').forEach(box=>{
            observer.observe(box);
        });
    }

    async typeBox(box){
        const content=box.querySelector('.archive-content, .act-content');
        if(!content)return;
        content.classList.add('typing');
        const paragraphs=Array.from(content.children);
        for(const p of paragraphs){
            await this.typeElement(p,18);
        }
    }

    typeElement(element,speed){
        return new Promise(resolve=>{
            if(element.dataset.typed==='true'){resolve();return;}
            element.dataset.typed='true';
            element.style.visibility='visible';
            const originalHTML=element.innerHTML;
            element.innerHTML='';
            const temp=document.createElement('div');
            temp.innerHTML=originalHTML;

            function processNode(node,parent){
                if(node.nodeType===Node.TEXT_NODE){
                    const span=document.createElement('span');
                    parent.appendChild(span);
                    const text=node.textContent;
                    let i=0;
                    return new Promise(r=>{
                        function type(){
                            if(i<text.length){
                                span.textContent+=text.charAt(i);
                                i++;
                                if(audioEngine.ctx && audioEngine.isPlaying && i%3===0 && Math.random()>0.6){
                                    const click=audioEngine.ctx.createOscillator();
                                    const clickGain=audioEngine.ctx.createGain();
                                    click.type='triangle';
                                    click.frequency.value=900+Math.random()*300;
                                    clickGain.gain.value=0.004;
                                    click.connect(clickGain);
                                    clickGain.connect(audioEngine.ctx.destination);
                                    click.start();
                                    click.stop(audioEngine.ctx.currentTime+0.02);
                                }
                                setTimeout(type,speed+Math.random()*12);
                            }else{r();}
                        }
                        type();
                    });
                }else if(node.nodeType===Node.ELEMENT_NODE){
                    const clone=node.cloneNode(false);
                    parent.appendChild(clone);
                    const promises=[];
                    for(const child of node.childNodes){promises.push(processNode(child,clone));}
                    return Promise.all(promises);
                }
                return Promise.resolve();
            }

            const promises=[];
            for(const child of temp.childNodes){promises.push(processNode(child,element));}
            Promise.all(promises).then(()=>{element.dataset.typed='done';resolve();});
        });
    }
}

const archiveTypewriter=new ArchiveTypewriter();

// ═══════════════════════════════════════
// SCROLL-DRIVEN UPDATES
// ═══════════════════════════════════════
window.addEventListener('scroll',()=>{
    if(audioEngine.isPlaying){audioEngine.updateFromScroll();}

    // Nav visibility
    const nav=document.getElementById('mainNav');
    if(window.scrollY>100){
        nav.classList.add('visible');
    }else{
        nav.classList.remove('visible');
    }
});

// ═══════════════════════════════════════
// REVEAL ON SCROLL
// ═══════════════════════════════════════
const revealObserver=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.classList.add('visible');
        }
    });
},{threshold:0.1});

document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

// ═══════════════════════════════════════
// HERO PARTICLES
// ═══════════════════════════════════════
function initParticles(){
    const container=document.getElementById('heroParticles');
    if(!container)return;
    for(let i=0;i<30;i++){
        const p=document.createElement('div');
        p.className='particle';
        p.style.left=Math.random()*100+'%';
        p.style.animationDelay=Math.random()*20+'s';
        p.style.animationDuration=(15+Math.random()*10)+'s';
        container.appendChild(p);
    }
}

// ═══════════════════════════════════════
// PAGE LOAD
// ═══════════════════════════════════════
window.addEventListener('load',()=>{
    initParticles();
    setTimeout(()=>{
        document.getElementById('pageLoadOverlay').classList.add('hidden');
    },800);
});
