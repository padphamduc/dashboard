window.requestAnimationFrame =
    window.__requestAnimationFrame ||
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (function () {
            return function (callback, element) {
                var lastTime = element.__lastTime;
                if (lastTime === undefined) {
                    lastTime = 0;
                }
                var currTime = Date.now();
                var timeToCall = Math.max(1, 33 - (currTime - lastTime));
                window.setTimeout(callback, timeToCall);
                element.__lastTime = currTime + timeToCall;
            };
        })();
window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var init = function () {
    if (loaded) return;
    loaded = true;
    var mobile = window.isDevice;
    var koef = 1; // Crisp rendering on all screens
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var canvas2 = document.getElementById('fireworks-canvas');
    var ctx2 = canvas2.getContext('2d');
    var width = canvas.width = canvas2.width = koef * innerWidth;
    var height = canvas.height = canvas2.height = koef * innerHeight;
    var rand = Math.random;
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, width, height);
    ctx2.clearRect(0, 0, width, height);

    var heartPosition = function (rad) {
        //return [Math.sin(rad), Math.cos(rad)];
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };
    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    var maxStars = mobile ? 30 : 65;
    var stars = [];
    
    var generateStars = function () {
        stars = [];
        for (var s = 0; s < maxStars; s++) {
            stars.push({
                x: rand() * width,
                y: rand() * height,
                size: rand() * 1.5 + 0.5,
                twinkleSpeed: 0.01 + rand() * 0.02,
                phase: rand() * Math.PI * 2
            });
        }
    };
    generateStars();

    var shootingStars = [];
    var spawnShootingStar = function () {
        var direction = rand() < 0.5 ? 1 : -1;
        var startX = direction === 1 ? rand() * width * 0.5 : width * 0.5 + rand() * width * 0.5;
        shootingStars.push({
            x: startX,
            y: 0,
            dx: direction * (4 + rand() * 5),
            dy: 4 + rand() * 5,
            life: 1.0,
            decay: 0.01 + rand() * 0.015
        });
    };

    var fireworks = [];
    var spawnFirework = function (side) {
        var startX = side === 0 ? width * 0.05 : width * 0.95;
        var startY = height;
        
        // Target explosion height is middle-upper screen
        var targetY = height * (0.15 + rand() * 0.35);
        // Explosions happen on the sides to frame the heart nicely
        var targetX = side === 0 ? width * (0.15 + rand() * 0.2) : width * (0.65 + rand() * 0.2);
        
        var dx = targetX - startX;
        var dy = targetY - startY;
        var duration = 50 + rand() * 20;
        var vx = dx / duration;
        var vy = dy / duration;
        
        fireworks.push({
            x: startX,
            y: startY,
            vx: vx,
            vy: vy,
            targetY: targetY,
            isExploded: false,
            particles: [],
            color: "hsl(" + (rand() * 35) + ", 100%, 70%)" // Vibrant Red/Orange/Yellow
        });
    };

    var explodeFirework = function (f) {
        f.isExploded = true;
        var particleCount = mobile ? 20 : 45;
        // Love website theme: Pure romantic pink and purple tones
        var baseHue = rand() * 35; // Red to Orange-Yellow tones 
        for (var p = 0; p < particleCount; p++) {
            var angle = rand() * Math.PI * 2;
            var speed = 0.8 + rand() * 3.0;
            f.particles.push({
                x: f.x,
                y: f.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1.0,
                decay: 0.01 + rand() * 0.012,
                size: mobile ? (6 + rand() * 7) : (8 + rand() * 10), // Heart font size
                color: "hsla(" + (baseHue + (rand() - 0.5) * 15) + ", 100%, " + (65 + rand() * 15) + "%, "
            });
        }
    };

    var baseScale;
    var outerScaleX, outerScaleY, midScaleX, midScaleY, innerScaleX, innerScaleY;
    var pointsOrigin = [];
    var heartPointsCount = 0;
    var dr = 0.1;
    
    var calculateScales = function() {
        if (width < height) {
            // Mobile / Portrait layout
            baseScale = width * 0.28;
        } else {
            // Desktop / Landscape layout
            baseScale = height * 0.20;
        }
        
        outerScaleX = baseScale;
        outerScaleY = baseScale * 0.062;
        midScaleX = baseScale * 0.714;
        midScaleY = baseScale * 0.714 * 0.06;
        innerScaleX = baseScale * 0.428;
        innerScaleY = baseScale * 0.428 * 0.055;
    };
    
    var generatePoints = function() {
        pointsOrigin = [];
        var idx;
        for (idx = 0; idx < Math.PI * 2; idx += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(idx), outerScaleX, outerScaleY, 0, 0));
        for (idx = 0; idx < Math.PI * 2; idx += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(idx), midScaleX, midScaleY, 0, 0));
        for (idx = 0; idx < Math.PI * 2; idx += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(idx), innerScaleX, innerScaleY, 0, 0));
        heartPointsCount = pointsOrigin.length;
    };

    calculateScales();
    generatePoints();

    window.addEventListener('resize', function () {
        width = canvas.width = canvas2.width = koef * innerWidth;
        height = canvas.height = canvas2.height = koef * innerHeight;
        ctx.fillStyle = "rgba(25, 8, 20, 1)"; // dark plum-magenta background
        ctx.fillRect(0, 0, width, height);
        ctx2.clearRect(0, 0, width, height);
        generateStars();
        calculateScales();
        generatePoints();
    });

    var traceCount = mobile ? 45 : 50; // Keep particle tail length long on mobile for a glowing look
    var i;

    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    // Reset a particle to a random position on the screen, creating the original gathering effect
    var resetParticle = function (u) {
        var x = rand() * width;
        var y = rand() * height;
        u.vx = 0;
        u.vy = 0;
        u.q = ~~(rand() * heartPointsCount);
        for (var k = 0; k < traceCount; k++) {
            u.trace[k] = {x: x, y: y};
        }
    };

    var e = [];
    // Increased particle count for a rich, dense, and solid heart shape
    var particleCount = mobile ? 500 : 550;
    for (i = 0; i < particleCount; i++) {
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            trace: []
        };
        resetParticle(e[i]);
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var heartState = 0; // 0: expanding, 1: holding, 2: shrinking, 3: resting
    var heartFrameCounter = 0;
    var currentScale = 0.55;
    var time = 0;

    var loop = function () {
        heartFrameCounter++;
        if (heartState === 0) {
            // Expanding phase: 12 frames (0.2s) - very fast swell
            var t = heartFrameCounter / 12;
            currentScale = 0.55 + (1.08 - 0.55) * t;
            if (heartFrameCounter >= 12) {
                heartState = 1;
                heartFrameCounter = 0;
                currentScale = 1.08;
            }
        } else if (heartState === 1) {
            // Holding phase: 300 frames (5.0 seconds at 60 FPS)
            // Add a small romantic heartbeat oscillation to make it look alive
            currentScale = 1.08 + Math.sin(heartFrameCounter * 0.1) * 0.015;
            if (heartFrameCounter >= 300) {
                heartState = 2;
                heartFrameCounter = 0;
            }
        } else if (heartState === 2) {
            // Shrinking phase: 30 frames (0.5s)
            var t = heartFrameCounter / 30;
            currentScale = 1.08 - (1.08 - 0.55) * t;
            if (heartFrameCounter >= 30) {
                heartState = 3;
                heartFrameCounter = 0;
                currentScale = 0.55;
            }
        } else if (heartState === 3) {
            // Resting phase: 90 frames (1.5s)
            currentScale = 0.55 + Math.sin(heartFrameCounter * 0.05) * 0.005;
            if (heartFrameCounter >= 90) {
                heartState = 0;
                heartFrameCounter = 0;
            }
        }

        // Normalize scale to [0, 1] for text scaling compatibility
        var n = (currentScale - 0.55) / (1.08 - 0.55);

        pulse(currentScale, currentScale);
        time += config.timeDelta;
        ctx.fillStyle = "rgba(0, 0, 0, 0.16)"; // Soft and smooth glowing trails like the original
        ctx.fillRect(0, 0, width, height);
        ctx2.clearRect(0, 0, width, height); // Clear second canvas to prevent fireworks from leaving trails

        // Draw Nebula clouds (Galaxy Background - Red/Orange Edition)
        // Red nebula (made fainter: opacity 0.015)
        var pinkGlow = ctx2.createRadialGradient(width * 0.25, height * 0.35, 10, width * 0.25, height * 0.35, Math.max(width, height) * 0.5);
        pinkGlow.addColorStop(0, "rgba(255, 0, 0, 0.015)"); // Deep red nebula
        pinkGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx2.fillStyle = pinkGlow;
        ctx2.beginPath();
        ctx2.arc(width * 0.25, height * 0.35, Math.max(width, height) * 0.5, 0, Math.PI * 2);
        ctx2.fill();

        // Warm orange-red nebula (made fainter: opacity 0.015)
        var roseGlow = ctx2.createRadialGradient(width * 0.75, height * 0.65, 10, width * 0.75, height * 0.65, Math.max(width, height) * 0.5);
        roseGlow.addColorStop(0, "rgba(255, 120, 120, 0.015)"); // Soft warm red nebula
        roseGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx2.fillStyle = roseGlow;
        ctx2.beginPath();
        ctx2.arc(width * 0.75, height * 0.65, Math.max(width, height) * 0.5, 0, Math.PI * 2);
        ctx2.fill();

        // Twinkling stars (fewer and fainter)
        ctx2.save();
        for (var s = 0; s < stars.length; s++) {
            var star = stars[s];
            star.phase += star.twinkleSpeed;
            var alpha = 0.15 + 0.3 * Math.abs(Math.sin(star.phase)); // Fainter stars
            ctx2.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
            ctx2.fillRect(star.x, star.y, star.size, star.size);
        }
        ctx2.restore();

        // Update and draw shooting stars (fewer meteors, drawn on ctx2)
        if (rand() < 0.007) { // 0.7% chance to spawn a shooting star per frame (down from 1.5%)
            spawnShootingStar();
        }
        
        ctx2.save();
        for (var s = shootingStars.length; s--;) {
            var ss = shootingStars[s];
            ss.x += ss.dx;
            ss.y += ss.dy;
            ss.life -= ss.decay;
            
            if (ss.life <= 0 || ss.x > width || ss.y > height) {
                shootingStars.splice(s, 1);
                continue;
            }
            
            // Draw shooting star trail (Pinkish Meteor trail on ctx2)
            var grad = ctx2.createLinearGradient(ss.x, ss.y, ss.x - ss.dx * 10, ss.y - ss.dy * 10);
            grad.addColorStop(0, "rgba(255, 255, 255, " + ss.life + ")");
            grad.addColorStop(0.5, "rgba(255, 100, 100, " + (ss.life * 0.5) + ")");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
            
            ctx2.strokeStyle = grad;
            ctx2.lineWidth = mobile ? 1.5 : 2.5;
            ctx2.lineCap = "round";
            ctx2.beginPath();
            ctx2.moveTo(ss.x, ss.y);
            ctx2.lineTo(ss.x - ss.dx * 5, ss.y - ss.dy * 5);
            ctx2.stroke();
        }
        ctx2.restore();

        // Update and draw fireworks ("Bắn ra tình yêu" - Hearts Fireworks Edition on ctx2)
        // Spawn fireworks slightly less periodically so screen remains clear
        if (time % 2.0 < 0.025) { 
            spawnFirework(rand() < 0.5 ? 0 : 1);
        }
        
        ctx2.save();
        for (var f = fireworks.length; f--;) {
            var fw = fireworks[f];
            if (!fw.isExploded) {
                // Rocket is going up (a rising glowing heart!)
                fw.x += fw.vx;
                fw.y += fw.vy;
                
                ctx2.font = (mobile ? "12px" : "15px") + " Arial";
                ctx2.textAlign = "center";
                ctx2.textBaseline = "middle";
                ctx2.fillStyle = fw.color;
                
                // Glowing trail for rocket
                ctx2.shadowBlur = 6;
                ctx2.shadowColor = fw.color;
                ctx2.fillText("❤", fw.x, fw.y);
                
                // If it reaches the target altitude, explode it!
                if (fw.y <= fw.targetY) {
                    explodeFirework(fw);
                }
            } else {
                // Exploded heart particles
                var alive = false;
                ctx2.textAlign = "center";
                ctx2.textBaseline = "middle";
                
                for (var p = fw.particles.length; p--;) {
                    var pt = fw.particles[p];
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vy += 0.045; // gravity (slightly slower fall for romantic weightless hearts)
                    pt.vx *= 0.98;  // air resistance
                    pt.vy *= 0.98;
                    pt.alpha -= pt.decay;
                    
                    if (pt.alpha > 0) {
                        alive = true;
                        
                        var size = pt.size * pt.alpha; // shrink as it fades
                        ctx2.font = size + "px Arial";
                        ctx2.fillStyle = pt.color + pt.alpha + ")";
                        ctx2.fillText("❤", pt.x, pt.y);
                    } else {
                        fw.particles.splice(p, 1);
                    }
                }
                
                if (!alive) {
                    fireworks.splice(f, 1);
                }
            }
        }
        ctx2.restore();

        // Draw "Mai Anh" text with elegant styling and neon glowing effect
        ctx.save();
        
        // Let the name pulsate dramatically from small to big and back in sync with the heart beat
        var textScale = 0.35 + 0.95 * n; // n is already normalized scale [0, 1]
        var fontSize = ~~(baseScale * 0.265 * textScale);
        ctx.font = fontSize + "px 'Great Vibes', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Glow effect also pulses with the size (Red Glow)
        ctx.shadowBlur = ~~(baseScale * 0.14 * textScale);
        ctx.shadowColor = "rgba(255, 0, 0, 0.95)"; // Pure hot red glow
        
        // Beautiful pure red-rose gradient for the text
        var textGradient = ctx.createLinearGradient(width / 2 - baseScale * 0.5, 0, width / 2 + baseScale * 0.5, 0);
        textGradient.addColorStop(0, "#d90429"); // Deep red
        textGradient.addColorStop(0.3, "#ef233c"); // Vibrant red
        textGradient.addColorStop(0.7, "#ff4d6d"); // Soft red/rose
        textGradient.addColorStop(1, "#ff8fa3"); // Pastel pink/red
        ctx.fillStyle = textGradient;
        
        // Offset slightly upward to account for the heart's visual center of gravity
        ctx.fillText("Mai Anh", width / 2, height / 2 - baseScale * 0.024);
        ctx.restore();

        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    // 18% chance to reset the particle back to the text, making it flow out continuously
                    if (0.18 > rand()) {
                        resetParticle(u);
                    } else {
                        u.q = ~~(rand() * heartPointsCount);
                    }
                }
                else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            
            // Dynamic particle coloring - Red Edition:
            // Particles start as bright golden/rose-red sparks near the name, and transition to rich red as they reach the outer heart.
            var dx_center = u.trace[0].x - width / 2;
            var dy_center = u.trace[0].y - height / 2;
            var dist_center = Math.sqrt(dx_center * dx_center + dy_center * dy_center);
            // Normalize distance based on layout scale
            var max_dist = baseScale * 1.2;
            var r = Math.min(1, dist_center / max_dist);
            
            var hue, Saturation, Lightness, Opacity;
            if (r < 0.3) {
                // Tâm đỏ: Warm crimson red core
                var local_r = r / 0.3;
                hue = 0; // Pure Red
                Saturation = 100;
                Lightness = ~~(85 - local_r * 25);
                Opacity = 0.55 - local_r * 0.3; // Soft transparent glowing red
            } else {
                // Trái tim hồng: Vibrant pink outer heart
                var local_r = (r - 0.3) / 0.7;
                hue = ~~(335 + local_r * 5); // Pink (335-340)
                Saturation = ~~(90 + (1 - r) * 10);
                Lightness = ~~(67 - local_r * 15);
                Opacity = 0.25; // Soft pink outline trail
            }
            
            ctx.fillStyle = "hsla(" + hue + "," + Saturation + "%," + Lightness + "%," + Opacity + ")";
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }
        //ctx.fillStyle = "rgba(255,255,255,1)";
        //for (i = u.trace.length; i--;) ctx.fillRect(targetPoints[i][0], targetPoints[i][1], 2, 2);

        window.requestAnimationFrame(loop, canvas);
    };

    var spawnTouchExplosion = function(x, y) {
        var clickX = x * koef;
        var clickY = y * koef;
        var f = {
            x: clickX,
            y: clickY,
            vx: 0,
            vy: 0,
            targetY: 0,
            isExploded: true,
            particles: []
        };
        
        var particlesCount = mobile ? 25 : 50;
        var baseHue = rand() * 360; // Multi-colored romantic touch sparks!
        for (var p = 0; p < particlesCount; p++) {
            var angle = rand() * Math.PI * 2;
            var speed = 1.0 + rand() * 4.0;
            f.particles.push({
                x: clickX,
                y: clickY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1.0,
                decay: 0.012 + rand() * 0.015,
                size: mobile ? (8 + rand() * 8) : (10 + rand() * 12),
                color: "hsla(" + (baseHue + (rand() - 0.5) * 30) + ", 100%, " + (70 + rand() * 15) + "%, "
            });
        }
        fireworks.push(f);
    };

    var handleInteraction = function(e) {
        var modal = document.getElementById('wishes-modal');
        if (modal && modal.classList.contains('show')) return;
        
        var clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        spawnTouchExplosion(clientX, clientY);
    };
    
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);

// Modal interaction for love message & Text-to-Speech / Animation controls
document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('wishes-modal');
    var btn = document.getElementById('gift-button');
    var span = document.getElementsByClassName('close-btn')[0];
    var isMobileDevice = window.isDevice || false;
    var activeShootingSession = 0;

    // Load voices early for Text-to-Speech compatibility
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
    }

    // Play bg-music immediately on load, with interaction fallback due to browser security policies
    var bgMusic = document.getElementById('bg-music');
    var playBgMusic = function () {
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(function (e) {
                console.log("Fallback play failed:", e);
            });
        }
        // Clean up all possible triggers
        document.removeEventListener('click', playBgMusic);
        document.removeEventListener('touchstart', playBgMusic);
        document.removeEventListener('mousemove', playBgMusic);
        document.removeEventListener('scroll', playBgMusic);
        document.removeEventListener('keydown', playBgMusic);
    };

    if (bgMusic) {
        bgMusic.play().catch(function (err) {
            console.log("Autoplay blocked initially, setting up interaction fallback:", err);
            // Listen to any form of user activity
            document.addEventListener('click', playBgMusic);
            document.addEventListener('touchstart', playBgMusic);
            document.addEventListener('mousemove', playBgMusic);
            document.addEventListener('scroll', playBgMusic);
            document.addEventListener('keydown', playBgMusic);
        });
    }

    // Wishes audio & text animation coordination state
    var activeShootingSession = 0;
    var spans = [];
    var fallbackTimer = null;
    var bunny = null;
    var startX = 0, startY = 0;



    // Play loichuc.mp3 function
    function playWishAudio() {
        var wishMusic = document.getElementById('wish-music');
        if (wishMusic) {
            wishMusic.currentTime = 0; // Reset to beginning
            wishMusic.play().catch(function (err) {
                console.log("Wish music play prevented:", err);
            });
        }
    }

    // Open wishes: pause bg-music, play wish-music
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        
        // Remove all autoplay listeners
        document.removeEventListener('click', playBgMusic);
        document.removeEventListener('touchstart', playBgMusic);
        document.removeEventListener('mousemove', playBgMusic);
        document.removeEventListener('scroll', playBgMusic);
        document.removeEventListener('keydown', playBgMusic);

        var bgMusic = document.getElementById('bg-music');
        if (bgMusic) {
            // Browser policy workaround: play and immediately pause to authorize it with this user gesture context
            bgMusic.play().then(function() {
                bgMusic.pause();
            }).catch(function (err) {
                console.log("Bg music authorization failed:", err);
            });
        }

        modal.classList.add('show');
        createFloatingHearts();
        
        // Wait for modal zoom transition to finish (600ms), then start audio and lyric assembly together
        setTimeout(function() {
            playWishAudio();
            assembleTextWithHearts();
        }, 600);
    });

    // Close wishes function: pause wish-music, resume bg-music, clear timeouts
    var closeWishes = function () {
        modal.classList.remove('show');
        clearLyricTimeouts();

        var wishMusic = document.getElementById('wish-music');
        if (wishMusic) {
            wishMusic.pause();
        }

        var bgMusic = document.getElementById('bg-music');
        if (bgMusic) {
            bgMusic.play().catch(function (err) {
                console.log("Bg music resume prevented:", err);
            });
        }
    };

    span.addEventListener('click', function (e) {
        e.stopPropagation();
        closeWishes();
    });

    window.addEventListener('click', function (event) {
        if (event.target == modal) {
            closeWishes();
        }
    });

    // Replay button click handler
    var replayBtn = document.getElementById('replay-button');
    if (replayBtn) {
        replayBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Replay audio
            playWishAudio();
            // Replay text shooting animation
            assembleTextWithHearts();
        });
    }

    // Heart-shooting text assembly function
    var lyricTimeouts = [];

    function clearLyricTimeouts() {
        lyricTimeouts.forEach(function (t) {
            clearTimeout(t);
        });
        lyricTimeouts = [];
    }

    function assembleTextWithHearts() {
        activeShootingSession++;
        var mySession = activeShootingSession;
        
        clearLyricTimeouts();

        var container = document.getElementById('wishes-text');
        if (!container) return;
        
        container.innerHTML = '';
        container.style.opacity = '1';

        bunny = document.getElementById('bunny-shooter');
        if (!bunny) return;

        // Calculate start position: Right edge of the bunny image (bunny's hand area)
        var bunnyRect = bunny.getBoundingClientRect();
        startX = bunnyRect.right - 8;
        startY = bunnyRect.top + bunnyRect.height * 0.42;

        // 12 lines of lyrics for perfect timing with loichuc.mp3 (27s)
        var poem = [
            { text: "Tôi yêu em vì sao chẳng biết", start: 0, stagger: 15 },
            { text: "Chỉ thấy đời bỗng chốc hóa thơ", start: 1700, stagger: 15 },
            { text: "Chẳng cần đợi những giấc mơ", start: 3400, stagger: 15 },
            { text: "Chỉ cần mình mãi vẹn chờ bên nhau", start: 5100, stagger: 15 },
            { text: "Rừng xanh vốn thích mây ngàn", start: 7000, stagger: 15 },
            { text: "Riêng tôi chỉ thích dịu dàng bên em", start: 8900, stagger: 15 },
            { text: "Đại dương mặc sóng nhấp nhô", start: 10800, stagger: 15 },
            { text: "Tim này chỉ nguyện đổ xô về nàng", start: 12600, stagger: 15 },
            { text: "Thế gian lấp lánh bạc vàng", start: 14600, stagger: 15 },
            { text: "Với tôi  báu vật chính nàng mà thôi", start: 16500, stagger: 15 },
            { text: "Dẫu cho vật đổi sao giời", start: 18500, stagger: 15 },
            { text: "Nắm tay đi hết cuộc đời được không", start: 20500, stagger: 15 }
        ];

        // Create all line containers in advance so the layout is static and correct
        var lineSpans = [];
        poem.forEach(function (item) {
            var lineDiv = document.createElement('div');
            lineDiv.style.margin = '2px 0'; // Tighter line margin to fit mobile screens
            container.appendChild(lineDiv);

            // Prepare spans for this line and store them
            var spansArr = prepareSpans(item.text, lineDiv);
            lineSpans.push(spansArr);
        });

        // Schedule the stagger-shoot reveal for each line
        poem.forEach(function (item, index) {
            var t = setTimeout(function () {
                if (mySession !== activeShootingSession || !modal.classList.contains('show')) return;
                shootLine(lineSpans[index], item.stagger, mySession);
            }, item.start);
            lyricTimeouts.push(t);
        });
    }

    function prepareSpans(text, lineDiv) {
        var spansArr = [];
        var chars = text.split('');
        chars.forEach(function (char) {
            var span = document.createElement('span');
            span.className = 'wish-char';
            span.textContent = char;
            span.style.opacity = '0';
            span.style.transform = 'scale(0.3)';
            span.style.transition = 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            lineDiv.appendChild(span);
            spansArr.push(span);
        });
        return spansArr;
    }

    function shootLine(spansArr, staggerVal, sessionID) {
        var idx = 0;
        if (bunny && spansArr.length > 0) {
            bunny.classList.add('shoot-pulse');
            setTimeout(function() {
                if (bunny) bunny.classList.remove('shoot-pulse');
            }, 300);
        }
        function next() {
            if (sessionID !== activeShootingSession || !modal.classList.contains('show')) return;
            if (idx < spansArr.length) {
                shootToSpan(spansArr[idx], sessionID);
                idx++;
                setTimeout(next, staggerVal);
            }
        }
        next();
    }

    function shootToSpan(span, sessionID) {
        if (!span) return;
        if (span.textContent.trim() === '') {
            span.style.opacity = '1';
            span.style.transform = 'scale(1)';
            return;
        }

        var spanRect = span.getBoundingClientRect();
        var targetX = spanRect.left + spanRect.width / 2;
        var targetY = spanRect.top + spanRect.height / 2;

        // Calculate live start coordinates from the bunny image to avoid any rendering race conditions
        var bunnyEl = document.getElementById('bunny-shooter');
        var startX_live = window.innerWidth * 0.05; // Fallback to bottom-left area
        var startY_live = window.innerHeight * 0.90;
        if (bunnyEl) {
            var rect = bunnyEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                startX_live = rect.left + rect.width * 0.75; // Bunny's hand area
                startY_live = rect.top + rect.height * 0.45;
            }
        }

        // Spawn a cluster of 3 tiny heart particles
        var particlesCount = 3;
        var particles = [];
        for (var i = 0; i < particlesCount; i++) {
            var p = document.createElement('div');
            p.className = 'sparkle-particle';
            p.innerHTML = '❤';
            p.style.position = 'fixed';
            p.style.left = startX_live + 'px';
            p.style.top = startY_live + 'px';
            p.style.transform = 'translate(-50%, -50%) scale(' + (0.7 + Math.random() * 0.5) + ')';
            p.style.transition = 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.15)';
            document.body.appendChild(p);
            particles.push(p);
        }

        // Animate each particle with a tiny random offset to look like cluster dust
        particles.forEach(function (p) {
            var offsetX = (Math.random() - 0.5) * 8;
            var offsetY = (Math.random() - 0.5) * 8;
            requestAnimationFrame(function () {
                p.style.left = (targetX + offsetX) + 'px';
                p.style.top = (targetY + offsetY) + 'px';
                p.style.transform = 'translate(-50%, -50%) scale(1.4)';
            });
        });

        // Land on letter
        setTimeout(function () {
            if (!modal.classList.contains('show') || sessionID !== activeShootingSession) {
                particles.forEach(function (p) {
                    if (p.parentNode) p.parentNode.removeChild(p);
                });
                return;
            }
            
            span.style.opacity = '1';
            span.style.transform = 'scale(1)';
            
            // Explode tiny sparkles
            createSplash(targetX, targetY);

            particles.forEach(function (p) {
                if (p.parentNode) p.parentNode.removeChild(p);
            });
        }, 330);
    }

    function createSplash(x, y) {
        var sparksCount = isMobileDevice ? 4 : 6;
        for (var i = 0; i < sparksCount; i++) {
            var spark = document.createElement('div');
            spark.className = 'heart-spark';
            spark.innerHTML = '❤';
            spark.style.position = 'fixed';
            spark.style.left = x + 'px';
            spark.style.top = y + 'px';
            spark.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(spark);

            var angle = Math.random() * Math.PI * 2;
            var dist = Math.random() * 8 + 4;
            var tx = x + Math.cos(angle) * dist;
            var ty = y + Math.sin(angle) * dist;

            (function (s, targetX, targetY) {
                requestAnimationFrame(function () {
                    s.style.left = targetX + 'px';
                    s.style.top = targetY + 'px';
                    s.style.opacity = '0';
                    s.style.transform = 'translate(-50%, -50%) scale(0.2)';
                });
                setTimeout(function () {
                    if (s.parentNode) s.parentNode.removeChild(s);
                }, 250);
            })(spark, tx, ty);
        }
    }

    function createFloatingHearts() {
        var container = document.querySelector('.floating-hearts-container');
        container.innerHTML = ''; // Clear previous
        
        var count = isMobileDevice ? 12 : 25;
        for (var i = 0; i < count; i++) {
            var heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = '❤';
            
            var size = Math.random() * 20 + 12;
            var left = Math.random() * 100;
            var delay = Math.random() * 4;
            var duration = Math.random() * 3 + 3.5;
            
            heart.style.fontSize = size + 'px';
            heart.style.left = left + '%';
            heart.style.animationDelay = delay + 's';
            heart.style.animationDuration = duration + 's';
            heart.style.color = 'hsla(' + (320 + Math.random() * 40) + ', 100%, 75%, ' + (0.35 + Math.random() * 0.45) + ')';
            
            container.appendChild(heart);
        }
    }

    // ==========================================
    // TYPEWRITER & LIVE DAY COUNTER FOR LOVE-CARD
    // ==========================================
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================
    // TẢI CẤU HÌNH ĐỘNG (KỶ NIỆM & THƯ TÌNH & AVATAR)
    // ==========================================
    let config = {
      anniversary: "2026-07-04T23:40",
      userAvatar: "assets/images/avatar.png",
      girlfriendAvatar: "assets/images/manh.png",
      loveLetterCosmic: "Gửi Mai Anh, kể từ ngày 04/07/2026 định mệnh ấy, mỗi ngày trôi qua với anh đều là một ngày hạnh phúc ngọt ngào. Cảm ơn em vì đã đến và sưởi ấm trái tim anh. Chúc cho tình yêu của chúng mình mai luôn bền chặt và tràn đầy năng lượng như tinh vân rực rỡ này nhé! Yêu em thật nhiều!  "
    };

    if (typeof CONFIG !== 'undefined') {
      config = { ...config, ...CONFIG };
    }

    try {
      const stored = localStorage.getItem('dashboard_admin_config');
      if (stored) {
        config = { ...config, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.log("Could not load config in lovemaianh script:", e);
    }

    // Cập nhật ảnh đại diện cặp đôi động
    const userImgEl = document.getElementById('couple-avatar-user');
    const gfImgEl = document.getElementById('couple-avatar-gf');
    
    function formatAvatarUrl(url) {
      if (!url) return "";
      if (url.startsWith('http') || url.startsWith('../') || url.startsWith('data:')) {
        return url;
      }
      return '../' + url;
    }

    if (userImgEl && config.userAvatar) {
      userImgEl.src = formatAvatarUrl(config.userAvatar);
    }
    if (gfImgEl && config.girlfriendAvatar) {
      gfImgEl.src = formatAvatarUrl(config.girlfriendAvatar);
    }

    const loveCard = document.getElementById('love-card');
    const closeCardBtn = document.getElementById('close-card-btn');
    const expandCardBtn = document.getElementById('expand-card-btn');
    const typewriterEl = document.getElementById('typewriter-text');

    const letterText = config.loveLetterCosmic;
    let charIndex = 0;

    let typewriterTimeout = null;

    function startTypewriter() {
      if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
      }
      if (typewriterEl) {
        typewriterEl.textContent = "";
      }
      charIndex = 0;
      typeWriterLoop();
    }

    function typeWriterLoop() {
      if (typewriterEl && charIndex < letterText.length) {
        typewriterEl.textContent += letterText.charAt(charIndex);
        charIndex++;
        typewriterTimeout = setTimeout(typeWriterLoop, 55); 
      }
    }

    // Thu nhỏ / Mở rộng thư tình
    if (closeCardBtn && loveCard && expandCardBtn) {
      closeCardBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      closeCardBtn.addEventListener('touchstart', (e) => e.stopPropagation());
      closeCardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loveCard.style.display = 'none';
        expandCardBtn.style.display = 'flex';
      });

      expandCardBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      expandCardBtn.addEventListener('touchstart', (e) => e.stopPropagation());
      expandCardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        expandCardBtn.style.display = 'none';
        loveCard.style.display = 'flex';
        // Khởi chạy gõ chữ thư tình khi người dùng bấm vào mở
        startTypewriter();
      });
    }

    // Đồng hồ đếm ngày yêu thời gian thực (Kỷ niệm lấy động từ config)
    const startDate = new Date(config.anniversary);
    function updateLoveCounter() {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      if (diff < 0) return;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      const daysValEl = document.getElementById('days-val');
      const timeValEl = document.getElementById('time-val');
      if (daysValEl) daysValEl.textContent = days;
      if (timeValEl) {
        timeValEl.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }
    updateLoveCounter();
    setInterval(updateLoveCounter, 1000);
});


