document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================
    // CÁU HÌNH MẶC ĐỊNH (Tải từ assets/js/config.js)
    // ==========================================
    // Fallback nếu vì lý do nào đó CONFIG trong config.js không tải được
    const fallbackConfig = {
      name: "PHẠM ANH ĐỨC",
      birthdate: "2005-12-17",
      girlfriendName: "Mai Anh",
      anniversary: "2026-07-04T23:40",
      userAvatar: "assets/images/avatar.png",
      girlfriendAvatar: "assets/images/manh.png",
      loveQuote: "Em là lý do khiến mỗi ngày của anh trở nên ngọt ngào và ý nghĩa hơn.",
      loveLetterCosmic: "Gửi Mai Anh, kể từ ngày 04/07/2026 định mệnh ấy, mỗi ngày trôi qua với anh đều là một ngày hạnh phúc ngọt ngào. Cảm ơn em vì đã đến và sưởi ấm trái tim anh. Chúc cho tình yêu của chúng mình mãi luôn bền chặt và tràn đầy năng lượng như tinh vân rực rỡ này nhé! Yêu em thật nhiều! ♥",
      socials: [
        { name: "Facebook", url: "https://www.facebook.com/phamanhduc17122005", icon: "assets/images/fb.png" },
        { name: "Zalo", url: "https://zalo.me/0347697817/", icon: "assets/images/zl.png" },
        { name: "TikTok", url: "https://www.tiktok.com/@padphamduc", icon: "assets/images/tt.png" },
        { name: "Instagram", url: "https://www.instagram.com/phamanhduc17122005/", icon: "assets/images/in.png" }
      ],
      birthdayLetter: "Hôm nay là một ngày vô cùng đặc biệt - ngày mà em bước sang tuổi mới với nhiều niềm vui và hoài bão lớn.\nChúc em luôn rạng rỡ như ánh nắng ban mai, rực rỡ như những đóa hồng và luôn kiên cường hạnh phúc trong cuộc đời.\nHy vọng tuổi mới sẽ mang đến cho em những cơ hội mới, thành công rực rỡ và những khoảnh khắc đáng nhớ nhất.\nMong rằng mọi sinh nhật sau này, anh vẫn luôn được ở bên cạnh em. Anh yêu em💗",
      birthdayPhotos: [
        { url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600", caption: "Ngày đặc biệt của Mai Anh 🎂" },
        { url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600", caption: "Những nụ cười rạng rỡ Nhất✨" },
        { url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=600", caption: "Ngập tràn hoa và niềm vui 🌸" },
        { url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600", caption: "Ước mơ bay thật cao 🎈" }
      ],
      emailAccessKey: ""
    };

    const STORAGE_KEY = 'dashboard_admin_config';

    // ==========================================
    // KHỞI TẠO DÒNG MẠNG XÃ HỘI ĐỘNG
    // ==========================================
    const socialContainer = document.getElementById('social-list-container');
    const btnAddSocial = document.getElementById('btn-add-social');

    function addSocialRow(name = "", url = "", icon = "") {
      if (!socialContainer) return;
      const row = document.createElement('div');
      row.className = 'social-item-row';
      row.innerHTML = `
        <div class="form-group">
          <label>Tên mạng xã hội</label>
          <input type="text" class="social-name" placeholder="Ví dụ: Facebook" value="${name}" required>
        </div>
        <div class="form-group">
          <label>Đường dẫn (URL)</label>
          <input type="url" class="social-url" placeholder="https://..." value="${url}" required>
        </div>
        <div class="form-group">
          <label>Đường dẫn Icon/Ảnh</label>
          <input type="text" class="social-icon" placeholder="Ví dụ: assets/images/fb.png" value="${icon}" required>
        </div>
        <button type="button" class="btn-delete-social" title="Xóa mạng xã hội này">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      row.querySelector('.btn-delete-social').addEventListener('click', () => {
        row.remove();
      });

      socialContainer.appendChild(row);

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    if (btnAddSocial) {
      btnAddSocial.addEventListener('click', () => {
        addSocialRow();
      });
    }

    // ==========================================
    // KHỞI TẠO HÀNG HÌNH ẢNH ALBUM ĐỘNG
    // ==========================================
    const photosContainer = document.getElementById('photos-list-container');
    const btnAddPhoto = document.getElementById('btn-add-photo');

    function addPhotoRow(url = "", caption = "") {
      if (!photosContainer) return;
      const row = document.createElement('div');
      row.className = 'photo-item-row';
      row.innerHTML = `
        <div class="form-group" style="flex: 2;">
          <label>Đường dẫn / URL hình ảnh</label>
          <input type="text" class="photo-url" placeholder="Ví dụ: ../assets/images/pic1.jpg hoặc link web" value="${url}" required>
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Lời chú thích ảnh</label>
          <input type="text" class="photo-caption" placeholder="Ví dụ: Nụ cười tỏa nắng ✨" value="${caption}" required>
        </div>
        <button type="button" class="btn-delete-photo" title="Xóa ảnh này" style="align-self: flex-end; margin-bottom: 25px; background: rgba(255, 82, 124, 0.1); border: 1px solid rgba(255, 82, 124, 0.2); color: #ff527c; width: 38px; height: 38px; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center;">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      row.querySelector('.btn-delete-photo').addEventListener('click', () => {
        row.remove();
      });

      photosContainer.appendChild(row);

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    if (btnAddPhoto) {
      btnAddPhoto.addEventListener('click', () => {
        addPhotoRow();
      });
    }



    // ==========================================
    // KHỞI TẠO TABS CHUYỂN ĐỔI
    // ==========================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');

        // Gỡ bỏ active cũ
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Kích hoạt tab mới
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        // Load wishes if wishes tab is selected
        if (tabId === 'wishes') {
          loadWishes();
        }
      });
    });

    // ==========================================
    // ĐỌC VÀ HIỂN THỊ CẤU HÌNH LÊN FORM
    // ==========================================
    function loadConfig() {
      // Bắt đầu bằng CONFIG trong config.js hoặc fallbackConfig
      let config = { ...fallbackConfig };
      if (typeof CONFIG !== 'undefined') {
        config = { ...config, ...CONFIG };
      }

      // Đè cấu hình từ localStorage lên (nếu có)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem(STORAGE_KEY);
          if (stored) {
            config = { ...config, ...JSON.parse(stored) };
          }
        }
      } catch (e) {
        console.warn("Không đọc được localStorage, sử dụng config.js:", e);
      }

      // Đưa dữ liệu lên Form
      document.getElementById('input-name').value = config.name;
      document.getElementById('input-birthdate').value = config.birthdate;
      document.getElementById('input-girlfriend').value = config.girlfriendName;
      document.getElementById('input-anniversary').value = config.anniversary;
      document.getElementById('input-user-avatar').value = config.userAvatar || "";
      document.getElementById('input-gf-avatar').value = config.girlfriendAvatar || "";
      document.getElementById('input-love-quote').value = config.loveQuote || "";
      document.getElementById('input-letter').value = config.loveLetterCosmic;
      document.getElementById('input-birthday-letter').value = config.birthdayLetter || "";
      document.getElementById('input-email-key').value = config.emailAccessKey || "";

      // Hiển thị danh sách mạng xã hội động
      if (socialContainer) {
        socialContainer.innerHTML = "";
        const socials = config.socials || [];
        socials.forEach(item => {
          addSocialRow(item.name, item.url, item.icon);
        });
      }

      // Hiển thị danh sách hình ảnh động
      if (photosContainer) {
        photosContainer.innerHTML = "";
        const photos = config.birthdayPhotos || [];
        photos.forEach(item => {
          addPhotoRow(item.url, item.caption);
        });
      }
    }

    // ==========================================
    // LẤY DỮ LIỆU CẤU HÌNH TỪ BIỂU MẪU FORM
    // ==========================================
    function getFormData() {
      let base = { ...fallbackConfig };
      if (typeof CONFIG !== 'undefined') {
        base = { ...base, ...CONFIG };
      }

      // Lấy danh sách mạng xã hội từ các dòng động
      const socials = [];
      const rows = document.querySelectorAll('.social-item-row');
      rows.forEach(row => {
        const nameInput = row.querySelector('.social-name');
        const urlInput = row.querySelector('.social-url');
        const iconInput = row.querySelector('.social-icon');
        if (nameInput && urlInput && iconInput) {
          const name = nameInput.value.trim();
          const url = urlInput.value.trim();
          const icon = iconInput.value.trim();
          if (name && url && icon) {
            socials.push({ name, url, icon });
          }
        }
      });

      // Lấy danh sách hình ảnh từ các dòng động
      const photos = [];
      const photoRows = document.querySelectorAll('.photo-item-row');
      photoRows.forEach(row => {
        const urlInput = row.querySelector('.photo-url');
        const captionInput = row.querySelector('.photo-caption');
        if (urlInput && captionInput) {
          const url = urlInput.value.trim();
          const caption = captionInput.value.trim();
          if (url && caption) {
            photos.push({ url, caption });
          }
        }
      });

      return {
        name: document.getElementById('input-name').value.trim() || base.name,
        birthdate: document.getElementById('input-birthdate').value || base.birthdate,
        girlfriendName: document.getElementById('input-girlfriend').value.trim() || base.girlfriendName,
        anniversary: document.getElementById('input-anniversary').value || base.anniversary,
        userAvatar: document.getElementById('input-user-avatar').value.trim() || base.userAvatar,
        girlfriendAvatar: document.getElementById('input-gf-avatar').value.trim() || base.girlfriendAvatar,
        loveQuote: document.getElementById('input-love-quote').value.trim() || base.loveQuote,
        loveLetterCosmic: document.getElementById('input-letter').value.trim() || base.loveLetterCosmic,
        socials: socials,
        birthdayLetter: document.getElementById('input-birthday-letter').value.trim() || base.birthdayLetter,
        birthdayPhotos: photos,
        emailAccessKey: document.getElementById('input-email-key').value.trim() || ""
      };
    }

    // ==========================================
    // LƯU CẤU HÌNH XUỐNG LOCALSTORAGE
    // ==========================================
    const form = document.getElementById('config-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newConfig = getFormData();
      console.log("Đang tiến hành lưu cấu hình mới:", newConfig);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        console.log("Lưu localStorage thành công với key:", STORAGE_KEY);
        showToast("Đã lưu cấu hình thành công!");
      } catch (e) {
        console.error("Lỗi lưu cấu hình localStorage:", e);
        alert("⚠️ Không thể lưu qua localStorage!\n\nLý do: Trình duyệt chặn lưu trữ trên giao thức file:// (nhấp đúp mở file).\n\n👉 Giải pháp: Vui lòng nhấn nút 'Tải tệp config.js' ngay bên cạnh để tải file về và chép đè vào thư mục assets/js/config.js của dự án!");
      }
    });

    // ==========================================
    // TẢI FILE CONFIG.JS DỰ PHÒNG
    // ==========================================
    const btnDownload = document.getElementById('btn-download-config');
    btnDownload.addEventListener('click', () => {
      const configData = getFormData();
      
      // Tạo chuỗi định nghĩa cấu hình tĩnh JS
      const fileContent = `// Tệp cấu hình tĩnh của website - Có thể chỉnh sửa thủ công hoặc tải về từ trang Admin\nconst CONFIG = ${JSON.stringify(configData, null, 2)};\n`;
      
      const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast("Đã chuẩn bị tải tệp config.js!", "download");
    });

    // ==========================================
    // KHÔI PHỤC MẶC ĐỊNH
    // ==========================================
    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
      if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ cấu hình về mặc định ban đầu?")) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          loadConfig();
          showToast("Đã khôi phục cài đặt mặc định!", "rotate-ccw");
        } catch (e) {
          console.error("Lỗi xóa cấu hình:", e);
          alert("⚠️ Trình duyệt chặn localStorage. Hãy tải tệp config.js mặc định ban đầu đè lại để khôi phục.");
        }
      }
    });

    // ==========================================
    // HIỂN THỊ TOAST THÔNG BÁO
    // ==========================================
    function showToast(message, iconName = 'check-circle') {
      const toast = document.getElementById('toast');
      const toastMsg = toast.querySelector('.toast-message');
      const toastIcon = toast.querySelector('.toast-icon');

      toastMsg.textContent = message;
      if (toastIcon) {
        toastIcon.setAttribute('data-lucide', iconName);
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }

      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    // ==========================================
    // QUẢN LÝ ĐIỀU ƯỚC SINH NHẬT (Birthday Wishes)
    // ==========================================
    const wishesContainer = document.getElementById('wishes-admin-list');
    const btnClearWishes = document.getElementById('btn-clear-wishes');
    const WISHES_STORAGE_KEY = 'birthday_wishes_admin';

    function loadWishes() {
      if (!wishesContainer) return;
      wishesContainer.innerHTML = "";
      
      let wishes = [];
      try {
        const stored = localStorage.getItem(WISHES_STORAGE_KEY);
        if (stored) {
          wishes = JSON.parse(stored);
        }
      } catch (err) {
        console.error("Lỗi đọc danh sách điều ước từ localStorage:", err);
      }

      if (wishes.length === 0) {
        wishesContainer.innerHTML = `
          <div style="text-align:center;padding:40px 20px;color:var(--text-secondary);">
            <i data-lucide="inbox" style="width:48px;height:48px;margin-bottom:15px;color:rgba(255,255,255,0.15);"></i>
            <p>Chưa nhận được điều ước sinh nhật nào từ Mai Anh 🎂</p>
          </div>
        `;
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
        return;
      }

      wishes.forEach((wish, idx) => {
        const item = document.createElement('div');
        item.className = 'wish-admin-item';
        item.innerHTML = `
          <div class="wish-info-wrapper">
            <span class="wish-text-content">${escapeHTML(wish.text)}</span>
            <div class="wish-meta-info">
              <i data-lucide="clock"></i>
              <span class="wish-date">${wish.date || "Không rõ thời gian"}</span>
            </div>
          </div>
          <button type="button" class="wish-delete-btn" title="Xóa điều ước này" data-index="${idx}">
            <i data-lucide="trash-2"></i>
          </button>
        `;
        
        item.querySelector('.wish-delete-btn').addEventListener('click', (e) => {
          const indexToDelete = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          deleteWish(indexToDelete);
        });

        wishesContainer.appendChild(item);
      });

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    function deleteWish(index) {
      if (confirm("Bạn có chắc muốn xóa điều ước này?")) {
        try {
          let wishes = JSON.parse(localStorage.getItem(WISHES_STORAGE_KEY)) || [];
          wishes.splice(index, 1);
          localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(wishes));
          loadWishes();
          showToast("Đã xóa điều ước thành công!", "check-circle");
        } catch (err) {
          console.error("Lỗi xóa điều ước:", err);
        }
      }
    }

    if (btnClearWishes) {
      btnClearWishes.addEventListener('click', () => {
        try {
          const wishes = JSON.parse(localStorage.getItem(WISHES_STORAGE_KEY)) || [];
          if (wishes.length === 0) {
            alert("Danh sách điều ước trống.");
            return;
          }
          if (confirm("Cảnh báo: Bạn có chắc chắn muốn XÓA TOÀN BỘ điều ước sinh nhật của Mai Anh không? Hành động này không thể hoàn tác.")) {
            localStorage.removeItem(WISHES_STORAGE_KEY);
            loadWishes();
            showToast("Đã xóa toàn bộ điều ước thành công!", "check-circle");
          }
        } catch (err) {
          console.error("Lỗi xóa toàn bộ điều ước:", err);
        }
      });
    }

    function escapeHTML(str) {
      return str.replace(/[&<>'"]/g, 
        tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
      );
    }

    // Tự động load cấu hình khi vào trang
    loadConfig();
    loadWishes();
});
