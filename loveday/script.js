document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* ==========================================================================
       Love Counter Calculation
       ========================================================================== */
    // ==========================================
    // TẢI CẤU HÌNH ĐỘNG (KỶ NIỆM & AVATAR & TÊN & CHÂM NGÔN)
    // ==========================================
    let config = {
      name: "PHẠM ANH ĐỨC",
      girlfriendName: "Mai Anh",
      anniversary: "2026-07-04T23:40",
      userAvatar: "assets/images/avatar.png",
      girlfriendAvatar: "assets/images/manh.png",
      loveQuote: "Em là lý do khiến mỗi ngày của anh trở nên ngọt ngào và ý nghĩa hơn."
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
      console.log("Could not load config in loveday script:", e);
    }

    // Cập nhật tên hiển thị
    const userNameEl = document.getElementById('loveday-name-user');
    const gfNameEl = document.getElementById('loveday-name-gf');
    if (userNameEl && config.name) {
        // Lấy tên gọi ngắn (tên cuối cùng)
        const names = config.name.split(' ');
        userNameEl.textContent = names[names.length - 1];
    }
    if (gfNameEl && config.girlfriendName) {
        gfNameEl.textContent = config.girlfriendName;
    }

    // Cập nhật châm ngôn tình yêu
    const quoteEl = document.getElementById('loveday-quote');
    if (quoteEl && config.loveQuote) {
        quoteEl.textContent = `"${config.loveQuote}"`;
    }

    // Cập nhật ảnh đại diện cặp đôi động
    const userImgEl = document.getElementById('loveday-avatar-user');
    const gfImgEl = document.getElementById('loveday-avatar-gf');
    
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

    const startDate = new Date(config.anniversary);

    const updateCounter = () => {
        const now = new Date();
        const difference = now.getTime() - startDate.getTime();

        if (difference < 0) {
            // Trường hợp ngày kỷ niệm ở tương lai
            document.getElementById('days-count').textContent = "0";
            document.getElementById('val-days').textContent = "00";
            document.getElementById('val-hours').textContent = "00";
            document.getElementById('val-minutes').textContent = "00";
            document.getElementById('val-seconds').textContent = "00";
            return;
        }

        // Tính toán các đơn vị thời gian
        const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Hiển thị ra màn hình
        document.getElementById('days-count').textContent = totalDays;
        
        // Định dạng thêm số 0 ở trước nếu số bé hơn 10
        document.getElementById('val-days').textContent = String(totalDays).padStart(2, '0');
        document.getElementById('val-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('val-minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('val-seconds').textContent = String(seconds).padStart(2, '0');
    };

    // Chạy ngay lập tức và thiết lập cập nhật mỗi giây
    updateCounter();
    setInterval(updateCounter, 1000);

    /* ==========================================================================
       Floating Hearts Particle Background (Canvas)
       ========================================================================== */
    const canvas = document.getElementById('heart-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const hearts = [];
        const maxHearts = 45;

        // Xử lý co giãn màn hình
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        class Heart {
            constructor() {
                this.reset();
                this.y = Math.random() * height; // Khởi tạo ở vị trí ngẫu nhiên chiều cao ban đầu
            }

            reset() {
                this.x = Math.random() * width;
                this.y = height + 20; // Xuất hiện từ mép dưới màn hình
                this.size = Math.random() * 15 + 8; // Kích thước ngẫu nhiên
                this.speedY = -(Math.random() * 1.2 + 0.6); // Tốc độ đi lên
                this.speedX = Math.random() * 0.6 - 0.3; // Độ lắc nhẹ ngang
                this.opacity = Math.random() * 0.4 + 0.15; // Độ mờ
                this.scaleSpeed = Math.random() * 0.002;
                this.scale = 1;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                
                // Mờ dần khi bay gần mép trên
                if (this.y < height * 0.25) {
                    this.opacity -= 0.005;
                }

                // Reset khi bay hết màn hình hoặc biến mất hoàn toàn
                if (this.y < -20 || this.opacity <= 0) {
                    this.reset();
                }
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.opacity);
                ctx.translate(this.x, this.y);
                ctx.beginPath();
                
                // Vẽ trái tim bằng bezier curves
                const d = this.size;
                ctx.moveTo(0, -d / 4);
                ctx.bezierCurveTo(-d / 2, -d * 0.7, -d, -d / 3, -d, d / 4);
                ctx.bezierCurveTo(-d, d * 0.6, -d / 6, d * 0.9, 0, d);
                ctx.bezierCurveTo(d / 6, d * 0.9, d, d * 0.6, d, d / 4);
                ctx.bezierCurveTo(d, -d / 3, d / 2, -d * 0.7, 0, -d / 4);
                
                ctx.closePath();
                ctx.fillStyle = '#ff4e50';
                ctx.fill();
                ctx.restore();
            }
        }

        // Tạo danh sách trái tim hạt ban đầu
        for (let i = 0; i < maxHearts; i++) {
            hearts.push(new Heart());
        }

        // Hàm hoạt ảnh chính (Loop)
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Vẽ các hạt
            hearts.forEach(heart => {
                heart.update();
                heart.draw();
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    /* ==========================================================================
       Background Music Autoplay & Toggle Controller
       ========================================================================== */
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-toggle-btn');

    if (bgMusic && musicBtn) {
        // Bật/tắt phát nhạc
        const toggleMusic = () => {
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    musicBtn.classList.add('playing');
                }).catch(err => {
                    console.log("Không thể phát nhạc:", err);
                });
            } else {
                bgMusic.pause();
                musicBtn.classList.remove('playing');
            }
        };

        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });

        // Xử lý tự động phát nhạc khi chạm vào trang (tránh chính sách bảo mật trình duyệt)
        const startAutoplay = () => {
            bgMusic.play().then(() => {
                musicBtn.classList.add('playing');
                document.removeEventListener('click', startAutoplay);
                document.removeEventListener('touchstart', startAutoplay);
            }).catch(err => {
                console.log("Chờ tương tác của người dùng để phát nhạc:", err);
            });
        };

        // Thử phát ngay lập tức
        bgMusic.play().then(() => {
            musicBtn.classList.add('playing');
        }).catch(() => {
            // Bị trình duyệt chặn, lắng nghe lượt chạm đầu tiên để phát
            document.addEventListener('click', startAutoplay);
            document.addEventListener('touchstart', startAutoplay);
        });
    }
});
