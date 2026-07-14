document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const introScreen = document.getElementById('intro-screen');
    const mainContent = document.getElementById('main-content');
    const introTitleText = document.getElementById('intro-title-text');
    const partyHat = document.getElementById('party-hat');
    const introDate = document.getElementById('intro-date');
    const introPhoto = document.getElementById('intro-photo');
    const openBtn = document.getElementById('open-btn');
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    
    // Steps
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');
    
    // Step 1: Wish Form
    const wishForm = document.getElementById('wish-form');
    const wishInput = document.getElementById('wish-input');
    
    // Step 2: Cake
    const cakeCanvasContainer = document.getElementById('cake-3d-canvas');
    const cakeMessage = document.getElementById('cake-message');
    const goToLetterBtn = document.getElementById('go-to-letter');
    
    // Step 3: Letter
    const envelope = document.getElementById('envelope');
    const envelopePrompt = document.getElementById('envelope-prompt-text');
    const readCompletionContainer = document.getElementById('read-completion-container');
    const goToGalleryBtn = document.getElementById('go-to-gallery');
    let typingTexts = Array.from(document.querySelectorAll('.letter-body p'));
    
    // Step 4: Gallery
    const sliderPrev = document.getElementById('slider-prev');
    const sliderNext = document.getElementById('slider-next');
    const slidesContainer = document.getElementById('slides-container');
    let polaroidCards = document.querySelectorAll('.polaroid-card');

    // Canvas Background
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');

    // State Variables
    let musicPlaying = false;
    let particles = [];
    let animationFrameId = null;
    let canvasActive = false;
    let isCandleBlown = false;
    let isLetterOpened = false;
    let isTyping = false;
    let activeSlideIndex = 0;
    let totalSlides = polaroidCards.length;
    let activeConfig = {}; // Stores loaded config parameters

    // Original texts for typewriter effect
    let originalLetterTexts = typingTexts.map(el => el.textContent);
    // Clear texts initially so they can type out
    typingTexts.forEach(el => el.textContent = '');

    // ==========================================
    // DYNAMIC CONTENT LOADER FROM CONFIG / LOCALSTORAGE
    // ==========================================
    function initializeDynamicContent() {
        let config = {};
        if (typeof CONFIG !== 'undefined') {
            config = { ...CONFIG };
        }
        try {
            const stored = localStorage.getItem('dashboard_admin_config');
            if (stored) {
                config = { ...config, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn("Could not read localStorage configuration:", e);
        }
        
        activeConfig = config; // Save loaded config in state

        // Load Dynamic Birthday Letter
        if (config.birthdayLetter) {
            const letterBody = document.querySelector('.letter-body');
            if (letterBody) {
                letterBody.innerHTML = '';
                const paragraphs = config.birthdayLetter.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                if (paragraphs.length > 0) {
                    typingTexts = paragraphs.map((text, idx) => {
                        const p = document.createElement('p');
                        p.id = `typing-text-${idx + 1}`;
                        p.innerHTML = `<span class="typed-span" style="color: #4a4a4a;"></span><span class="untyped-span" style="color: transparent; user-select: none;">${text}</span>`;
                        letterBody.appendChild(p);
                        return p;
                    });
                    originalLetterTexts = paragraphs;
                }
            }
        } else {
            // Fallback for static HTML paragraphs
            const letterBody = document.querySelector('.letter-body');
            if (letterBody) {
                const staticParagraphs = Array.from(letterBody.querySelectorAll('p'));
                originalLetterTexts = staticParagraphs.map(el => el.textContent.trim());
                typingTexts = staticParagraphs.map((el, idx) => {
                    const text = originalLetterTexts[idx];
                    el.innerHTML = `<span class="typed-span" style="color: #4a4a4a;"></span><span class="untyped-span" style="color: transparent; user-select: none;">${text}</span>`;
                    return el;
                });
            }
        }

        // Load Dynamic Birthday Photos
        if (config.birthdayPhotos && config.birthdayPhotos.length > 0 && slidesContainer) {
            slidesContainer.innerHTML = '';
            config.birthdayPhotos.forEach((photo) => {
                const card = document.createElement('div');
                card.className = 'polaroid-card';
                card.innerHTML = `
                    <div class="tape-effect"></div>
                    <div class="polaroid-img-wrapper">
                        <img src="${photo.url}" alt="${photo.caption}" onerror="this.src='https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'">
                    </div>
                    <div class="polaroid-caption">${photo.caption}</div>
                `;
                slidesContainer.appendChild(card);
            });
            // Re-assign polaroid slides and refresh
            polaroidCards = document.querySelectorAll('.polaroid-card');
            totalSlides = polaroidCards.length;
            activeSlideIndex = 0;
            updateGallery();
        }
    }

    // Load config immediately since config.js is loaded in the HTML
    initializeDynamicContent();

    // ==========================================
    // STEP TRANSITION UTILITY
    // ==========================================
    function transitionStep(currentStep, nextStep) {
        currentStep.classList.add('hidden-step');
        currentStep.classList.remove('active-step');
        
        setTimeout(() => {
            nextStep.classList.remove('hidden-step');
            nextStep.classList.add('active-step');
            
            // Initialize Three.js 3D Cake if entering Step 2
            if (nextStep.id === 'step-2') {
                if (!scene) {
                    init3DCake();
                }
            }

            // Shrink header size in steps 1, 2, 3, and 4
            const header = document.querySelector('.main-header');
            if (header) {
                if (nextStep.id === 'step-1' || nextStep.id === 'step-2' || nextStep.id === 'step-3' || nextStep.id === 'step-4') {
                    header.classList.add('compact');
                } else {
                    header.classList.remove('compact');
                }
            }
            
            // Scroll to the active content smoothly
            window.scrollTo({
                top: mainContent.offsetTop - 20,
                behavior: 'smooth'
            });
        }, 500);
    }

    // ==========================================
    // 0. OPENING SEQUENCE (Sequenced Intro Animations)
    // ==========================================
    const welcomeText = "Happy Birthday";
    let typeIndex = 0;

    function typeWelcomeText() {
        if (typeIndex < welcomeText.length) {
            introTitleText.textContent += welcomeText.charAt(typeIndex);
            typeIndex++;
            setTimeout(typeWelcomeText, 120);
        } else {
            // Typing complete, hide cursor
            introTitleText.classList.add('typing-finished');
            
            // Reveal party hat at tail
            setTimeout(() => {
                partyHat.classList.add('show');
                
                // Reveal date
                setTimeout(() => {
                    introDate.classList.remove('hidden-intro-el');
                    introDate.classList.add('show-intro-el');
                    
                    // Reveal photo
                    setTimeout(() => {
                        introPhoto.classList.remove('hidden-intro-el');
                        introPhoto.classList.add('show-intro-el');
                        
                        // Reveal Start Button
                        setTimeout(() => {
                            openBtn.classList.remove('hidden-intro-el');
                            openBtn.classList.add('show-intro-el');
                        }, 800);
                    }, 800);
                }, 800);
            }, 400);
        }
    }

    // Start intro sequence after a small initial delay
    setTimeout(typeWelcomeText, 600);

    function startBirthdayParty() {
        // Play music
        playMusic();

        // Shrink header right away when transitioning to step 1
        const header = document.querySelector('.main-header');
        if (header) {
            header.classList.add('compact');
        }

        // Reveal content and transition from Intro Screen
        introScreen.classList.add('fade-out');
        mainContent.classList.remove('hidden');
        musicToggle.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        setTimeout(() => {
            introScreen.style.display = 'none';
            canvasActive = true;
            initCanvas();
            animateParticles();
        }, 1000);
    }

    function playMusic() {
        bgMusic.play().then(() => {
            musicPlaying = true;
            musicToggle.classList.add('playing');
        }).catch(err => {
            console.log("Autoplay blocked or audio load error:", err);
        });
    }

    function toggleMusic() {
        if (musicPlaying) {
            bgMusic.pause();
            musicPlaying = false;
            musicToggle.classList.remove('playing');
        } else {
            bgMusic.play();
            musicPlaying = true;
            musicToggle.classList.add('playing');
        }
    }

    openBtn.addEventListener('click', startBirthdayParty);
    musicToggle.addEventListener('click', toggleMusic);

    // ==========================================
    // 1. STEP 1: WISH SUBMIT (Send to Admin localStorage)
    // ==========================================
    function launchWishLantern(text) {
        const lantern = document.createElement('div');
        lantern.classList.add('floating-wish-lantern');
        lantern.textContent = text;
        
        // Random horizontal position
        const randomX = Math.random() * (window.innerWidth - 180) + 50;
        lantern.style.left = `${randomX}px`;
        
        document.body.appendChild(lantern);
        
        // Confetti explosion at bottom
        triggerExplosion(randomX, window.innerHeight - 80, 20);

        // Remove lantern from DOM when done animating
        setTimeout(() => lantern.remove(), 8000);
    }

    function sendWishToEmail(wishText, accessKey) {
        const formData = {
            access_key: accessKey,
            subject: "Điều ước sinh nhật mới từ Mai Anh! 🎂",
            from_name: "Hệ thống Sinh Nhật Mai Anh",
            message: `Mai Anh đã ghi một điều ước mới:\n\n"${wishText}"\n\nThời gian: ${new Date().toLocaleString('vi-VN')}`
        };

        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(formData)
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status == 200) {
                console.log("Wish email sent successfully:", json);
            } else {
                console.warn("Wish email sending failed:", json);
            }
        })
        .catch(error => {
            console.error("Error sending wish email:", error);
        });
    }

    wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = wishInput.value.trim();
        if (!text) return;

        // Save wish to Admin's shared localStorage key
        try {
            let adminWishes = JSON.parse(localStorage.getItem('birthday_wishes_admin')) || [];
            adminWishes.push({
                text: text,
                date: new Date().toLocaleString('vi-VN')
            });
            localStorage.setItem('birthday_wishes_admin', JSON.stringify(adminWishes));
        } catch (err) {
            console.warn("Could not save to localStorage (sandboxed/file protocol limit):", err);
        }

        // Send email via Web3Forms if Access Key is configured
        if (activeConfig && activeConfig.emailAccessKey) {
            sendWishToEmail(text, activeConfig.emailAccessKey);
        }

        // Float the lantern
        launchWishLantern(text);
        wishInput.value = '';
        
        // Transition to Step 2
        transitionStep(step1, step2);
    });

    // ==========================================
    // 2. STEP 2: THREE.JS 3D CAKE & BLOW CANDLE
    // ==========================================
    let scene, camera, renderer, cakeGroup, flameMesh, flameLight;
    let isCandleActive = true;
    let targetRotationY = 0;
    let targetRotationX = 0.2; // slight tilt down
    let isPointerDown = false;
    let previousPointerPosition = { x: 0, y: 0 };

    function init3DCake() {
        if (!cakeCanvasContainer) return;

        const width = cakeCanvasContainer.clientWidth || 300;
        const height = cakeCanvasContainer.clientHeight || 300;

        // 1. Create Scene
        scene = new THREE.Scene();

        // 2. Create Camera
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 3.2, 7.5);
        camera.lookAt(0, 1.2, 0);

        // 3. Create Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        cakeCanvasContainer.appendChild(renderer.domElement);

        // 4. Create Cake Group
        cakeGroup = new THREE.Group();
        scene.add(cakeGroup);

        // --- BUILD CAKE MESHES ---
        // Stand base
        const standGeom = new THREE.CylinderGeometry(2.1, 2.3, 0.15, 32);
        const standMat = new THREE.MeshStandardMaterial({ 
            color: 0xe0e0e0, 
            metalness: 0.8, 
            roughness: 0.2 
        });
        const stand = new THREE.Mesh(standGeom, standMat);
        stand.position.y = 0.075;
        stand.receiveShadow = true;
        stand.castShadow = true;
        cakeGroup.add(stand);

        // Stand stem
        const stemGeom = new THREE.CylinderGeometry(0.5, 0.7, 0.4, 16);
        const stem = new THREE.Mesh(stemGeom, standMat);
        stem.position.y = -0.2;
        cakeGroup.add(stem);

        // Bottom Layer (Pastel Pink / Strawberry)
        const botGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.8, 32);
        const botMat = new THREE.MeshStandardMaterial({ color: 0xff7597, roughness: 0.6 });
        const bottomLayer = new THREE.Mesh(botGeom, botMat);
        bottomLayer.position.y = 0.55;
        bottomLayer.castShadow = true;
        bottomLayer.receiveShadow = true;
        cakeGroup.add(bottomLayer);

        // Middle Layer (Vanilla Cream)
        const midGeom = new THREE.CylinderGeometry(1.4, 1.4, 0.7, 32);
        const midMat = new THREE.MeshStandardMaterial({ color: 0xfff5eb, roughness: 0.5 });
        const middleLayer = new THREE.Mesh(midGeom, midMat);
        middleLayer.position.y = 1.3;
        middleLayer.castShadow = true;
        middleLayer.receiveShadow = true;
        cakeGroup.add(middleLayer);

        // Top Layer (Strawberry Cream / Pink Glow)
        const topGeom = new THREE.CylinderGeometry(1.0, 1.0, 0.6, 32);
        const topMat = new THREE.MeshStandardMaterial({ color: 0xff527c, roughness: 0.6 });
        const topLayer = new THREE.Mesh(topGeom, topMat);
        topLayer.position.y = 1.95;
        topLayer.castShadow = true;
        topLayer.receiveShadow = true;
        cakeGroup.add(topLayer);

        // Whipped Cream Dollops on the rims
        const dollopGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const dollopMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        
        // Dollops on Top Layer (8 dollops)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dollop = new THREE.Mesh(dollopGeom, dollopMat);
            dollop.position.set(Math.cos(angle) * 0.9, 2.25, Math.sin(angle) * 0.9);
            cakeGroup.add(dollop);
        }

        // Dollops on Middle Layer (12 dollops)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dollop = new THREE.Mesh(dollopGeom, dollopMat);
            dollop.position.set(Math.cos(angle) * 1.3, 1.65, Math.sin(angle) * 1.3);
            cakeGroup.add(dollop);
        }

        // Colorful Sprinkles (scattered on top surfaces)
        const sprinkleColors = [0xff527c, 0xf7b154, 0x60efff, 0xb19ffb, 0xffffff];
        for (let i = 0; i < 35; i++) {
            const col = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];
            const spGeom = new THREE.BoxGeometry(0.03, 0.09, 0.03);
            const spMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
            const sp = new THREE.Mesh(spGeom, spMat);
            
            // Randomly place on bottom, middle or top top-surface
            const layerIdx = Math.floor(Math.random() * 3);
            let maxRadius, heightOffset;
            if (layerIdx === 0) { maxRadius = 1.7; heightOffset = 0.96; }
            else if (layerIdx === 1) { maxRadius = 1.3; heightOffset = 1.66; }
            else { maxRadius = 0.9; heightOffset = 2.26; }
            
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.3 + (maxRadius - 0.4);
            sp.position.set(Math.cos(angle) * r, heightOffset, Math.sin(angle) * r);
            sp.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            cakeGroup.add(sp);
        }

        // --- SINGLE CANDLE ---
        const candleGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16);
        const candleMat = new THREE.MeshStandardMaterial({ color: 0xb19ffb, roughness: 0.4 });
        const candle = new THREE.Mesh(candleGeom, candleMat);
        candle.position.y = 2.6; // Y: 2.25 is top layer surface + 0.35 Y offset
        candle.castShadow = true;
        cakeGroup.add(candle);

        // Candle stripes (decorative rings)
        const ringGeom = new THREE.TorusGeometry(0.062, 0.015, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xff7597 });
        for (let yOffset = -0.25; yOffset <= 0.25; yOffset += 0.15) {
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(0, 2.6 + yOffset, 0);
            ring.rotation.x = Math.PI / 2;
            cakeGroup.add(ring);
        }

        // Wick
        const wickGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const wick = new THREE.Mesh(wickGeom, wickMat);
        wick.position.y = 2.98;
        cakeGroup.add(wick);

        // --- FLAME ---
        const flameGeom = new THREE.ConeGeometry(0.07, 0.22, 12);
        flameMesh = new THREE.Mesh(flameGeom, new THREE.MeshBasicMaterial({ 
            color: 0xffd060,
            transparent: true,
            opacity: 0.95
        }));
        flameMesh.position.y = 3.12;
        cakeGroup.add(flameMesh);

        // Inner glowing flame
        const innerFlameGeom = new THREE.ConeGeometry(0.04, 0.14, 12);
        const innerFlame = new THREE.Mesh(innerFlameGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        innerFlame.position.y = -0.02;
        flameMesh.add(innerFlame);

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(3, 8, 4);
        dirLight.castShadow = true;
        scene.add(dirLight);

        flameLight = new THREE.PointLight(0xffaa44, 2.2, 7);
        flameLight.position.set(0, 3.15, 0);
        flameLight.castShadow = true;
        cakeGroup.add(flameLight);

        // --- ROTATION & DRAG EVENTS ---
        function handlePointerDown(e) {
            isPointerDown = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            previousPointerPosition = { x: clientX, y: clientY };
        }

        function handlePointerMove(e) {
            if (!isPointerDown) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - previousPointerPosition.x;
            const deltaY = clientY - previousPointerPosition.y;

            targetRotationY += deltaX * 0.008;
            targetRotationX = Math.max(-0.2, Math.min(0.8, targetRotationX + deltaY * 0.008));

            previousPointerPosition = { x: clientX, y: clientY };
        }

        function handlePointerUp() {
            isPointerDown = false;
        }

        // Tap/click to blow out candle
        function handleBlowTrigger() {
            if (!isCandleActive || isCandleBlown) return;
            
            isCandleActive = false;
            isCandleBlown = true;
            
            // Turn off flame
            flameMesh.visible = false;
            flameLight.intensity = 0;
            
            const rect = cakeCanvasContainer.getBoundingClientRect();
            const x = rect.left + rect.width / 2 + window.scrollX;
            const y = rect.top + rect.height * 0.25 + window.scrollY; // Y coordinate near candle Y
            
            // Trigger smoke puff
            const smoke = document.createElement('div');
            smoke.className = 'smoke';
            smoke.style.left = '50%';
            smoke.style.top = '30%';
            cakeCanvasContainer.parentNode.appendChild(smoke);
            setTimeout(() => smoke.remove(), 600);
            
            triggerExplosion(x, y, 20);

            setTimeout(() => {
                cakeMessage.classList.remove('hidden');
                triggerExplosion(canvas.width / 2, canvas.height / 2, 80);
                setTimeout(() => triggerExplosion(canvas.width / 3, canvas.height / 3, 50), 300);
                setTimeout(() => triggerExplosion(2 * canvas.width / 3, canvas.height / 3, 50), 600);
                
                // Auto-transition to Step 3 after 2500ms
                setTimeout(() => {
                    transitionStep(step2, step3);
                }, 2500);
            }, 500);
        }

        // Bind events
        const canvasEl = renderer.domElement;
        canvasEl.addEventListener('mousedown', handlePointerDown);
        canvasEl.addEventListener('touchstart', handlePointerDown, { passive: true });

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('touchmove', handlePointerMove, { passive: true });

        window.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);

        // Click to blow
        cakeCanvasContainer.addEventListener('click', (e) => {
            if (isPointerDown) return;
            handleBlowTrigger();
        });
        cakeCanvasContainer.addEventListener('touchend', (e) => {
            handleBlowTrigger();
        });

        // --- ANIMATION LOOP ---
        function animate() {
            if (!canvasActive) return;
            requestAnimationFrame(animate);

            if (!isPointerDown) {
                targetRotationY += 0.006;
            }

            cakeGroup.rotation.y += (targetRotationY - cakeGroup.rotation.y) * 0.08;
            cakeGroup.rotation.x += (targetRotationX - cakeGroup.rotation.x) * 0.08;

            if (isCandleActive && flameMesh) {
                flameMesh.scale.y = 1 + Math.sin(Date.now() * 0.015) * 0.12;
                flameMesh.scale.x = 1 + Math.cos(Date.now() * 0.02) * 0.06;
                flameMesh.scale.z = 1 + Math.sin(Date.now() * 0.02) * 0.06;
                
                flameLight.intensity = 2.2 + Math.sin(Date.now() * 0.04) * 0.2;
            }

            renderer.render(scene, camera);
        }

        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            if (!scene) return;
            const w = cakeCanvasContainer.clientWidth;
            const h = cakeCanvasContainer.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    goToLetterBtn.addEventListener('click', () => {
        transitionStep(step2, step3);
    });

    // ==========================================
    // 3. STEP 3: READ LETTER (Wax Seal & Envelope)
    // ==========================================
    // 3D Parallax Tilt effect on Envelope Card
    const envelopeWrapper = document.querySelector('.envelope-wrapper');
    if (envelopeWrapper && envelope) {
        envelopeWrapper.addEventListener('mousemove', (e) => {
            if (isTyping || envelope.classList.contains('open')) {
                // If open or typing, reset tilt for readability
                envelope.style.transform = 'translateY(50px) rotateX(0deg) rotateY(0deg)';
                return;
            }
            const rect = envelopeWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Limit tilt angle to max 18 degrees
            const tiltX = (x / (rect.width / 2)) * 18;
            const tiltY = -(y / (rect.height / 2)) * 18;
            
            envelope.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg) translateZ(10px)`;
        });

        envelopeWrapper.addEventListener('mouseleave', () => {
            if (envelope.classList.contains('open')) {
                envelope.style.transform = 'translateY(50px)';
            } else {
                envelope.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0)';
            }
        });
    }

    envelope.addEventListener('click', () => {
        if (isTyping) return; // ignore clicks if already typing
        
        envelope.classList.toggle('open');
        isLetterOpened = envelope.classList.contains('open');

        if (isLetterOpened) {
            if (envelopePrompt) {
                envelopePrompt.style.opacity = '0';
            }
            startTypewriter();
        } else {
            if (envelopePrompt) {
                envelopePrompt.style.opacity = '1';
            }
            resetTypewriter();
        }
    });

    function startTypewriter() {
        isTyping = true;
        let pIndex = 0;
        
        function typeParagraph() {
            if (pIndex >= typingTexts.length) {
                isTyping = false;
                return;
            }
            
            const element = typingTexts[pIndex];
            const text = originalLetterTexts[pIndex];
            element.classList.add('visible');
            
            const typedSpan = element.querySelector('.typed-span');
            const untypedSpan = element.querySelector('.untyped-span');
            
            let charIndex = 0;
            function typeChar() {
                if (!isLetterOpened) return; // stop typing if envelope is closed
                 
                if (charIndex <= text.length) {
                    if (typedSpan && untypedSpan) {
                        typedSpan.textContent = text.slice(0, charIndex);
                        untypedSpan.textContent = text.slice(charIndex);
                    }
                    charIndex++;
                     
                    const speed = text.charAt(charIndex - 1) === ',' || text.charAt(charIndex - 1) === '.' ? 150 : 35;
                    setTimeout(typeChar, speed);
                } else {
                    pIndex++;
                    setTimeout(typeParagraph, 400); // pause between paragraphs
                }
            }
            typeChar();
        }

        setTimeout(() => {
            if (isLetterOpened) typeParagraph();
        }, 1000); // wait for envelope folding animation
    }

    function resetTypewriter() {
        typingTexts.forEach((el, idx) => {
            const text = originalLetterTexts[idx];
            const typedSpan = el.querySelector('.typed-span');
            const untypedSpan = el.querySelector('.untyped-span');
            if (typedSpan && untypedSpan) {
                typedSpan.textContent = '';
                untypedSpan.textContent = text;
            }
            el.classList.remove('visible');
        });
        isTyping = false;
    }

    goToGalleryBtn.addEventListener('click', () => {
        transitionStep(step3, step4);
        
        // Trigger large explosion on gallery reveal
        setTimeout(() => {
            triggerExplosion(canvas.width / 4, canvas.height / 2, 40);
            triggerExplosion(3 * canvas.width / 4, canvas.height / 2, 40);
            updateGallery(); // layout cards properly
        }, 600);
    });

    // ==========================================
    // 4. STEP 4: MEMORY LANE GALLERY
    // ==========================================
    function updateGallery() {
        const isMobile = window.innerWidth < 640;
        const tx = isMobile ? 65 : 170;
        const ry = isMobile ? 25 : 35;
        const tz = isMobile ? 20 : 50;

        polaroidCards.forEach((card, idx) => {
            card.className = 'polaroid-card';
            let offset = idx - activeSlideIndex;
            
            if (offset < -1 && activeSlideIndex === totalSlides - 1) offset = 1;
            if (offset > 1 && activeSlideIndex === 0) offset = -1;

            if (offset === 0) {
                const tr = 'rotateY(0deg) translateZ(100px) scale(1)';
                card.style.transform = tr;
                card.style.webkitTransform = tr;
                card.style.zIndex = '10';
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            } else if (offset === -1 || (offset < -1 && Math.abs(offset) === totalSlides - 1)) {
                const tr = `translateX(-${tx}px) rotateY(${ry}deg) translateZ(${tz}px) scale(0.85) rotateZ(-3deg)`;
                card.style.transform = tr;
                card.style.webkitTransform = tr;
                card.style.zIndex = '5';
                card.style.opacity = '0.65';
                card.style.pointerEvents = 'none';
            } else if (offset === 1 || (offset > 1 && Math.abs(offset) === totalSlides - 1)) {
                const tr = `translateX(${tx}px) rotateY(-${ry}deg) translateZ(${tz}px) scale(0.85) rotateZ(3deg)`;
                card.style.transform = tr;
                card.style.webkitTransform = tr;
                card.style.zIndex = '5';
                card.style.opacity = '0.65';
                card.style.pointerEvents = 'none';
            } else {
                const tr = 'rotateY(0deg) translateZ(-150px) scale(0.5)';
                card.style.transform = tr;
                card.style.webkitTransform = tr;
                card.style.zIndex = '1';
                card.style.opacity = '0';
                card.style.pointerEvents = 'none';
            }
        });
    }

    function showNextSlide() {
        activeSlideIndex = (activeSlideIndex + 1) % totalSlides;
        updateGallery();
    }

    function showPrevSlide() {
        activeSlideIndex = (activeSlideIndex - 1 + totalSlides) % totalSlides;
        updateGallery();
    }

    sliderNext.addEventListener('click', showNextSlide);
    sliderPrev.addEventListener('click', showPrevSlide);

    // Touch Swipe Slider Support
    let startX = 0;
    let dist = 0;
    slidesContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    slidesContainer.addEventListener('touchmove', (e) => {
        if (!startX) return;
        let currentX = e.touches[0].clientX;
        dist = startX - currentX;
    }, { passive: true });

    slidesContainer.addEventListener('touchend', () => {
        const threshold = 50;
        if (Math.abs(dist) >= threshold) {
            if (dist > 0) {
                showNextSlide();
            } else {
                showPrevSlide();
            }
        }
        startX = 0;
        dist = 0;
    });

    // ==========================================
    // BACKGROUND PARTICLE ENGINE (Canvas with Star Dust)
    // ==========================================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const colors = [
        '#ff7597', '#f7b154', '#b19ffb', '#7cfc9e', '#60efff', 
        '#ff527c', '#ff8e53', '#70e1f5', '#ffd194', '#ea80fc'
    ];

    class Star {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speed = Math.random() * 0.02 + 0.005;
            this.angle = Math.random() * Math.PI * 2;
            this.opacity = Math.random() * 0.5 + 0.3;
        }

        update() {
            this.angle += this.speed;
            this.opacity = Math.sin(this.angle) * 0.4 + 0.6;
            
            if (this.x > canvas.width || this.y > canvas.height) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class Confetti {
        constructor(x, y, isExplosion = false) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 4;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            if (isExplosion) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 4;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed - Math.random() * 2;
            } else {
                this.vx = Math.random() * 2 - 1;
                this.vy = Math.random() * 2 + 1;
            }
            
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 5 - 2.5;
            this.opacity = 1;
            this.decay = Math.random() * 0.015 + 0.005;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05;
            this.rotation += this.rotationSpeed;
            
            if (this.opacity > this.decay) {
                this.opacity -= this.decay;
            } else {
                this.opacity = 0;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    class Balloon {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100 + 50;
            this.radius = Math.random() * 15 + 15;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speed = Math.random() * 1 + 0.5;
            this.swing = Math.random() * 2 + 1;
            this.swingSpeed = Math.random() * 0.02 + 0.01;
            this.angle = Math.random() * Math.PI;
        }

        update() {
            this.y -= this.speed;
            this.angle += this.swingSpeed;
            this.x += Math.sin(this.angle) * 0.5;
            
            if (this.y < -this.radius * 2) {
                this.y = canvas.height + Math.random() * 100 + 50;
                this.x = Math.random() * canvas.width;
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.radius);
            ctx.lineTo(this.x - 4, this.y + this.radius + 6);
            ctx.lineTo(this.x + 4, this.y + this.radius + 6);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.radius + 6);
            ctx.quadraticCurveTo(
                this.x + Math.sin(this.angle) * 10, 
                this.y + this.radius + 20, 
                this.x, 
                this.y + this.radius + 40
            );
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }

    function initCanvas() {
        resizeCanvas();
        particles = [];
        
        for (let i = 0; i < 40; i++) {
            particles.push(new Star());
        }

        for (let i = 0; i < 15; i++) {
            particles.push(new Balloon());
        }
        
        setInterval(() => {
            if (canvasActive && particles.filter(p => p instanceof Confetti).length < 60) {
                particles.push(new Confetti(Math.random() * canvas.width, -10));
            }
        }, 150);
    }

    function triggerExplosion(x, y, count = 40) {
        for (let i = 0; i < count; i++) {
            particles.push(new Confetti(x, y, true));
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, idx) => {
            p.update();
            p.draw();
            if (p instanceof Confetti && p.opacity <= 0) {
                particles.splice(idx, 1);
            }
        });
        
        animationFrameId = requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', () => {
        if (canvasActive) resizeCanvas();
    });
});
