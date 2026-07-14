document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Global Config Loader for Root Page
    let activeConfig = {
        name: "PHẠM ANH ĐỨC",
        birthdate: "2005-12-17",
        socials: [
            { name: "Facebook", url: "https://www.facebook.com/phamanhduc17122005", icon: "assets/images/fb.png" },
            { name: "Zalo", url: "https://zalo.me/0347697817/", icon: "assets/images/zl.png" },
            { name: "TikTok", url: "https://www.tiktok.com/@padphamduc", icon: "assets/images/tt.png" },
            { name: "Instagram", url: "https://www.instagram.com/phamanhduc17122005/", icon: "assets/images/in.png" }
        ],
        emailAccessKey: ""
    };

    if (typeof CONFIG !== 'undefined') {
        activeConfig = { ...activeConfig, ...CONFIG };
    }

    try {
        const stored = localStorage.getItem('dashboard_admin_config');
        if (stored && stored !== 'undefined') {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                activeConfig = { ...activeConfig, ...parsed };
            }
        }
    } catch (e) {
        console.warn("Lỗi đọc cấu hình từ localStorage:", e);
    }

    /* ==========================================================================
       Smooth Scrolling Logic
       ========================================================================== */
    const contentPanel = document.querySelector('.content-panel');
    const contactMeTrigger = document.getElementById('contact-me-trigger');
    const contactSection = document.getElementById('contact');
    
    if (contactMeTrigger && contactSection && contentPanel) {
        contactMeTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            contentPanel.scrollTo({
                top: contactSection.offsetTop - 30,
                behavior: 'smooth'
            });
            
            // On mobile view, scroll the window to the contact section
            if (window.innerWidth <= 991) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }



    /* ==========================================================================
       Contact Form Submission
       ========================================================================== */
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formFeedback = document.getElementById('form-feedback');
    
    if (contactForm && submitBtn && formFeedback) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Disable button and show loading state
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<span>SENDING...</span><i data-lucide="loader" class="animate-spin"></i>`;
            lucide.createIcons();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            if (name && email && message) {
                // If emailAccessKey exists, forward to Web3Forms
                if (activeConfig.emailAccessKey) {
                    const formData = {
                        access_key: activeConfig.emailAccessKey,
                        subject: `Tin nhắn mới từ: ${name} (Trang cá nhân) ✉️`,
                        from_name: name,
                        email: email,
                        message: `Họ tên: ${name}\nEmail: ${email}\nLời nhắn:\n"${message}"`
                    };

                    fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify(formData)
                    })
                    .then(response => response.json())
                    .then(json => {
                        console.log("Contact form email sent successfully:", json);
                    })
                    .catch(error => {
                        console.error("Error sending contact email:", error);
                    });
                }
                
                // Show success feedback
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    lucide.createIcons();
                    
                    formFeedback.textContent = "Lời nhắn của bạn đã được gửi thành công!";
                    formFeedback.className = "form-feedback success";
                    formFeedback.style.display = 'block';
                    contactForm.reset();

                    setTimeout(() => {
                        formFeedback.style.display = 'none';
                    }, 4000);
                }, 1200);
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                lucide.createIcons();
                
                formFeedback.textContent = "Vui lòng nhập đầy đủ thông tin.";
                formFeedback.className = "form-feedback error";
                formFeedback.style.display = 'block';

                setTimeout(() => {
                    formFeedback.style.display = 'none';
                }, 4000);
            }
        });
    }

    /* ==========================================================================
       Dynamic Configuration Loader (Profile Name, Age, Social Links)
       ========================================================================== */
    const socialLinksContainer = document.querySelector('.social-links');
    if (socialLinksContainer) {
        // Update Profile Name
        const profileNameEl = document.querySelector('.profile-name');
        if (profileNameEl && activeConfig.name) {
            profileNameEl.textContent = activeConfig.name;
        }

        // Update Profile Title (optional helper, default: Student)
        const profileTitleEl = document.querySelector('.profile-title');
        if (profileTitleEl && activeConfig.title) {
            profileTitleEl.textContent = activeConfig.title;
        }

        // Update Age dynamically
        const myAgeEl = document.getElementById('my-age');
        if (myAgeEl && activeConfig.birthdate) {
            const birth = new Date(activeConfig.birthdate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            myAgeEl.textContent = age;
        }

        // Render socials list
        socialLinksContainer.innerHTML = "";
        const socials = activeConfig.socials || [];
        socials.forEach(item => {
            const a = document.createElement('a');
            a.href = item.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.innerHTML = `<img src="${item.icon}" alt="${item.name}"><span>${item.name}</span>`;
            socialLinksContainer.appendChild(a);
        });
    }
});
