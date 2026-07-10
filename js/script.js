document.addEventListener('DOMContentLoaded', () => {
  setYear();
  highlightActiveNav();
  runSignalPulse();
  animateSkillBars();
  setupContactForm();
  setupSoundToggle();
  setupInteractionSounds();
  runTypewriter();
  setupGalleryLightbox();
});

const SOUND_KEY = 'portfolio-sound-enabled';
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';
let audioCtx = null;

function unlockAudioOnce(){
  getAudioCtx();
  document.removeEventListener('click', unlockAudioOnce);
  document.removeEventListener('touchstart', unlockAudioOnce);
}
document.addEventListener('click', unlockAudioOnce);
document.addEventListener('touchstart', unlockAudioOnce);

function getAudioCtx(){
  if (!audioCtx){
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone({ freq = 440, duration = 0.08, type = 'sine', gain = 0.05, glideTo = null } = {}){
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  try{
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }catch(e){ /* áudio indisponível — falha silenciosa */ }
}

function playHoverSound(){ playTone({ freq: 740, duration: 0.05, type: 'sine', gain: 0.03 }); }
function playClickSound(){ playTone({ freq: 260, duration: 0.09, type: 'square', gain: 0.045, glideTo: 120 }); }
function playToggleSound(on){ playTone({ freq: on ? 660 : 300, duration: 0.09, type: 'triangle', gain: 0.05, glideTo: on ? 880 : 220 }); }

function playTypingTick(){
  playTone({ freq: 1000 + Math.random() * 500, duration: 0.018, type: 'square', gain: 0.02 });
}

function setupSoundToggle(){
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  updateSoundToggleUI(btn);
  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
    updateSoundToggleUI(btn);
    playToggleSound(soundEnabled);
  });
}

function updateSoundToggleUI(btn){
  const icon = btn.querySelector('.sound-icon');
  const label = btn.querySelector('.sound-label');
  if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
  if (label) label.textContent = soundEnabled ? 'Efeitos Sonoros' : 'MUDO';
  btn.classList.toggle('is-off', !soundEnabled);
  btn.setAttribute('aria-pressed', String(soundEnabled));
}

function setupInteractionSounds(){
  const hoverables = document.querySelectorAll(
    '.btn, nav a, .module-card, .prevnext a, .proj-link, .brand, .gallery-item:has(img), .diagram-frame:has(img)'
  );
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', playHoverSound);
    el.addEventListener('click', playClickSound);
  });
}

function runTypewriter(){
  const el = document.querySelector('.typewriter');
  if (!el) return;

  const text = el.dataset.text || '';
  const cursor = el.querySelector('.cursor');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.from(el.childNodes).forEach(node => {
    if (node !== cursor) node.remove();
  });

  if (prefersReduced || !text){
    el.insertBefore(document.createTextNode(text), cursor);
    return;
  }

  let i = 0;
  function typeNext(){
    if (i < text.length){
      el.insertBefore(document.createTextNode(text[i]), cursor);
      playTypingTick();
      i++;
      setTimeout(typeNext, 65 + Math.random() * 70);
    }
  }
  setTimeout(typeNext, 300);
}

function setYear(){
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

function highlightActiveNav(){
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const projectPages = ['cleangrow.html', 'visiongate.html'];
  const target = projectPages.includes(current) ? 'projetos.html' : current;
  document.querySelectorAll('nav a[href]').forEach(link => {
    const hrefBase = link.getAttribute('href').split('/').pop();
    if (hrefBase === target) link.classList.add('active');
  });
}

function runSignalPulse(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pulse = document.querySelector('.pulse-line');
  if (!pulse || prefersReduced) return;

  let offset = 0;
  function animate(){
    offset -= 4;
    if (offset < -1000) offset = 0;
    pulse.style.strokeDashoffset = offset;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function animateSkillBars(){
  const bars = document.querySelectorAll('.skill-bar-fill[data-level]');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const el = entry.target;
        el.style.width = el.dataset.level + '%';
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => {
    bar.style.width = '0%';
    observer.observe(bar);
  });
}

function setupContactForm(){
  const form = document.getElementById('contact-form');
  if (!form) return;

  const feedback = document.getElementById('form-feedback');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const accessKey = form.querySelector('[name="access_key"]')?.value || '';
    if (!accessKey || accessKey === 'COLOQUE_SUA_ACCESS_KEY_AQUI'){
      if (feedback){
        feedback.textContent = 'Formulário ainda não configurado: falta colocar a access_key do Web3Forms no contato.html.';
        feedback.style.color = 'var(--text-faint)';
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (feedback){
      feedback.textContent = 'Enviando...';
      feedback.style.color = 'var(--text-faint)';
    }

    try{
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const result = await response.json();

      if (result.success){
        if (feedback){
          feedback.textContent = 'Mensagem enviada! Vou te responder em breve.';
          feedback.style.color = 'var(--copper-bright)';
        }
        form.reset();
      } else {
        if (feedback){
          feedback.textContent = 'Não deu pra enviar agora. Tenta de novo ou me chama direto por e-mail.';
          feedback.style.color = 'var(--text-faint)';
        }
      }
    }catch(err){
      if (feedback){
        feedback.textContent = 'Erro de conexão. Tenta de novo em alguns instantes.';
        feedback.style.color = 'var(--text-faint)';
      }
    }finally{
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function setupGalleryLightbox(){
  const items = document.querySelectorAll('.gallery-item, .diagram-frame');
  if (!items.length) return;

  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lightboxImg = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  function openLightbox(img){
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCaption.textContent = img.alt || '';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  items.forEach(item => {
    const img = item.querySelector('img');
    if (!img) return;
    item.addEventListener('click', () => openLightbox(img));
  });

  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}
