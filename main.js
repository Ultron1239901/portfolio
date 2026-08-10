const TOTAL_FRAMES = 300;
const canvas = document.getElementById('hero-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');

const images = [];
let loadedCount = 0;

let currentFrame = 0;
let targetFrame = 0;
let isUserScrolling = false;
let scrollTimeout = null;

// Easing factor for linear interpolation (lerp)
const LERP_EASE = 0.1;

// Function to generate frame file paths
function currentFramePath(index) {
  const frameNum = String(index + 1).padStart(3, '0');
  return `./ezgif-1843afaa8b8b4bd4-jpg/ezgif-frame-${frameNum}.jpg`;
}

// Preload images into memory (if canvas exists)
function preloadImages() {
  if (!canvas) return Promise.resolve();

  return new Promise((resolve) => {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = currentFramePath(i);
      
      const onImageLoad = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderText) {
          loaderText.textContent = `Loading Experience ${percent}%`;
        }

        if (loadedCount === TOTAL_FRAMES) {
          resolve();
        }
      };

      img.onload = onImageLoad;
      img.onerror = onImageLoad;
      images.push(img);
    }
  });
}

// Render specific frame onto canvas with cover aspect ratio
function renderFrame(frameIdx) {
  if (!canvas || !ctx) return;

  const index = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(frameIdx)));
  const img = images[index];

  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Calculate cover scaling
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
  }

  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Calculate target frame from scroll position
function updateScrollTarget() {
  if (!canvas) {
    updateActiveNav();
    return;
  }

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
  
  isUserScrolling = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isUserScrolling = false;
  }, 150);

  updateActiveNav();
}

// Highlight active navigation link based on current section
function updateActiveNav() {
  let currentSectionId = '';
  const scrollPosition = window.scrollY + 200;

  sections.forEach((sec) => {
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    if (scrollPosition >= top && scrollPosition < top + height) {
      currentSectionId = sec.getAttribute('id');
    }
  });

  if (currentSectionId) {
    navItems.forEach((nav) => {
      if (nav.getAttribute('href').startsWith('#')) {
        nav.classList.remove('active');
        if (nav.getAttribute('data-section') === currentSectionId) {
          nav.classList.add('active');
        }
      }
    });
  }
}

// Animation loop handling lerp interpolation & idle auto-play
function animate() {
  if (!canvas) return;

  if (!isUserScrolling) {
    targetFrame += 0.25; // Gentle idle auto-play speed
    if (targetFrame >= TOTAL_FRAMES) {
      targetFrame = 0;
      currentFrame = 0;
    }
  }

  // Smooth lerp
  currentFrame += (targetFrame - currentFrame) * LERP_EASE;
  
  if (currentFrame >= TOTAL_FRAMES) currentFrame = 0;
  if (currentFrame < 0) currentFrame = TOTAL_FRAMES - 1;

  renderFrame(currentFrame);
  requestAnimationFrame(animate);
}

// Handle screen resizing
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  renderFrame(currentFrame);
}

// Wheel scrubbing handler
window.addEventListener('wheel', (e) => {
  if (!canvas) return;
  targetFrame += e.deltaY * 0.04;
  if (targetFrame < 0) targetFrame = 0;
  if (targetFrame >= TOTAL_FRAMES) targetFrame = TOTAL_FRAMES - 1;
  
  isUserScrolling = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isUserScrolling = false;
  }, 150);
}, { passive: true });

// Touch support
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!canvas) return;
  const deltaY = touchStartY - e.touches[0].clientY;
  touchStartY = e.touches[0].clientY;
  
  targetFrame += deltaY * 0.08;
  if (targetFrame < 0) targetFrame = 0;
  if (targetFrame >= TOTAL_FRAMES) targetFrame = TOTAL_FRAMES - 1;

  isUserScrolling = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isUserScrolling = false;
  }, 150);
}, { passive: true });

// Window Listeners
window.addEventListener('scroll', updateScrollTarget, { passive: true });
window.addEventListener('resize', resizeCanvas);

// Mobile Hamburger Drawer Navigation
const hamburgerBtn = document.getElementById('hamburger-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const mobileOverlay = document.getElementById('mobile-overlay');

function openMobileMenu() {
  if (sidebar) sidebar.classList.add('sidebar-open');
  if (mobileOverlay) mobileOverlay.classList.add('active');
}

function closeMobileMenu() {
  if (sidebar) sidebar.classList.remove('sidebar-open');
  if (mobileOverlay) mobileOverlay.classList.remove('active');
}

if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileMenu);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMobileMenu);
if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

// Smooth scroll & page transition nav links
navItems.forEach((nav) => {
  nav.addEventListener('click', (e) => {
    closeMobileMenu();
    const href = nav.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetEl = document.querySelector(href);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Contact Form AJAX Handler (Delivers directly to vaibhavp9901@gmail.com)
const contactForm = document.getElementById('portfolio-contact-form');
const submitBtn = document.getElementById('submit-btn');
const formStatus = document.getElementById('form-status');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;
    }
    if (formStatus) {
      formStatus.className = 'form-status';
      formStatus.textContent = '';
    }

    const formData = new FormData(contactForm);

    try {
      const response = await fetch('https://formsubmit.co/ajax/vaibhavp9901@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
          _subject: formData.get('_subject') || 'New Portfolio Contact Message for Vaibhav P!'
        })
      });

      if (response.ok) {
        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.textContent = 'Thank you for contacting !!';
        }
        alert('Thank you for contacting !!');
        contactForm.reset();
      } else {
        throw new Error('Submission error');
      }
    } catch (err) {
      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = 'Thank you for contacting !!';
      }
      alert('Thank you for contacting !!');
      contactForm.reset();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Send Message</span> <i class="fa-solid fa-paper-plane"></i>`;
      }
    }
  });
}

// Animated Typewriter Roles Effect
const roles = [
  "Data Science",
  "Cloud Engineering",
  "Artificial Intelligence",
  "Machine Learning"
];

const typingTextEl = document.getElementById('typing-text');

if (typingTextEl) {
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typeSpeed = 90;
  const deleteSpeed = 45;
  const delayNext = 1800;

  function typeEffect() {
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
      typingTextEl.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingTextEl.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
    }

    let timeoutSpeed = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === currentRole.length) {
      timeoutSpeed = delayNext;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      timeoutSpeed = 350;
    }

    setTimeout(typeEffect, timeoutSpeed);
  }

  typeEffect();
}

// Dynamic Portfolio Database Fetcher & Renderer
async function loadDynamicPortfolioData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return;
    const data = await res.json();
    if (!data) return;

    // Update Roles for Typewriter
    if (data.personalInfo && Array.isArray(data.personalInfo.roles) && data.personalInfo.roles.length > 0) {
      roles.length = 0;
      roles.push(...data.personalInfo.roles);
    }

    // Update Brand Name & Glowing Letter
    if (data.personalInfo) {
      const p = data.personalInfo;
      const brandElements = document.querySelectorAll('.brand-info h2, .brand-title, .footer-brand h3');
      brandElements.forEach(el => {
        el.innerHTML = `${p.name || 'Vaibhav'} <span class="glowing-purple-p">${p.glowingLetter || 'P'}</span>`;
      });

      const heroName = document.querySelector('.hero-name');
      if (heroName) {
        heroName.innerHTML = `${p.name || 'Vaibhav'} <span class="glowing-purple-p">${p.glowingLetter || 'P'}</span>`;
      }

      // Update Social & Contact Links Across Pages
      if (p.github) {
        document.querySelectorAll('.sidebar-github-link, .footer-github-link').forEach(el => {
          el.href = p.github;
        });
      }
      if (p.linkedin) {
        document.querySelectorAll('.sidebar-linkedin-link, .footer-linkedin-link').forEach(el => {
          el.href = p.linkedin;
        });
      }
      if (p.email) {
        document.querySelectorAll('.sidebar-email-link, .contact-email-link, .footer-email-link').forEach(el => {
          if (el.classList.contains('contact-email-link')) {
            el.href = `mailto:${p.email}`;
            const valEl = el.querySelector('.email-val');
            if (valEl) valEl.textContent = p.email;
          } else if (el.classList.contains('footer-email-link')) {
            el.href = `mailto:${p.email}`;
            el.innerHTML = `<i class="fa-solid fa-envelope"></i> ${p.email}`;
          } else {
            el.href = `mailto:${p.email}`;
          }
        });
        const contactForm = document.getElementById('portfolio-contact-form');
        if (contactForm) {
          contactForm.action = `https://formsubmit.co/${p.email}`;
        }
      }
    }

    // Dynamic Projects Grid Renderer
    const projectsGrid = document.querySelector('.projects-page .grid-2, #projects-showcase-grid');
    if (projectsGrid && Array.isArray(data.projects) && data.projects.length > 0) {
      projectsGrid.innerHTML = data.projects.map(proj => `
        <div class="glass-card project-card">
          <div class="project-header">
            <span class="project-tag ${proj.tagColor || 'purple-blue-tag'}">${proj.tag || 'Engineering'}</span>
            <a href="${proj.github || '#'}" target="_blank" class="github-link"><i class="fa-brands fa-github"></i> GitHub</a>
          </div>
          <h3>${proj.title}</h3>
          <p class="project-desc">${proj.description}</p>
          <ul class="project-bullet-list">
            ${(proj.bullets || []).map(b => `<li>${b}</li>`).join('')}
          </ul>
          <div class="tech-pills">
            ${(proj.techStack || []).map(t => `<span>${t}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }

    // Dynamic Certifications Grid Renderer
    const certsContainer = document.querySelector('#certifications .grid-2');
    if (certsContainer && Array.isArray(data.certifications) && data.certifications.length > 0) {
      certsContainer.innerHTML = data.certifications.map(cert => `
        <div class="glass-card">
          <div class="card-icon cyan"><i class="fa-solid fa-certificate"></i></div>
          <div class="exp-title-row">
            <div>
              <h3>${cert.title}</h3>
              <h4 class="company-name">${cert.issuer}</h4>
            </div>
            <span class="exp-badge">${cert.badgeText || 'Verified Certification'}</span>
          </div>
          <p class="card-text margin-top-sm">${cert.description}</p>
        </div>
      `).join('');
    }

    // Dynamic Skills Grid Renderer
    const skillsGrid = document.querySelector('#skills .grid-4');
    if (skillsGrid && Array.isArray(data.skills) && data.skills.length > 0) {
      skillsGrid.innerHTML = data.skills.map(cat => `
        <div class="glass-card skill-card">
          <div class="card-icon ${cat.color || 'purple'}"><i class="fa-solid ${cat.icon || 'fa-code'}"></i></div>
          <h3>${cat.category}</h3>
          <ul class="skill-list">
            ${(cat.items || []).map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    }

  } catch (err) {
    // Fail gracefully and use static HTML defaults
  }
}

// App Initialization
async function init() {
  await loadDynamicPortfolioData();

  if (canvas) {
    resizeCanvas();
    await preloadImages();
    updateScrollTarget();
    renderFrame(0);
    requestAnimationFrame(animate);
  }

  if (loader) {
    loader.classList.add('loaded');
  }
}

init();
