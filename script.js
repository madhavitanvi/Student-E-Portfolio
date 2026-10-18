import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "firebase/auth";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

import { auth, db, googleProvider } from "./firebase.js";

const app = document.getElementById("app");

let currentUser = null;

let portfolio = {
    fullName: "",
    college: "",
    branch: "",
    year: "",
    about: "",
    skills: "",
    projects: "",
    achievements: "",
    interests: ""
};

let activeSection = "home";

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showMessage(message, type = "success") {
    const box = document.getElementById("message");

    if (!box) {
        alert(message);
        return;
    }

    box.className = `message ${type}`;
    box.textContent = message;
}

function renderLogin() {
    app.innerHTML = `
        <main class="container">
            <section class="card auth-card">
                <h1>🎓 Student E-Portfolio</h1>
                <p>Create your professional student portfolio.</p>

                <div id="message" class="message hidden"></div>

                <form id="authForm">
                    <label for="authName">Full Name (for registration)</label>
                    <input id="authName" name="name"
                           placeholder="Enter your full name">

                    <label for="authEmail">Email</label>
                    <input id="authEmail" name="email"
                           type="email" required
                           placeholder="Enter your email">

                    <label for="authPassword">Password</label>
                    <input id="authPassword" name="password"
                           type="password" required minlength="6"
                           placeholder="Minimum 6 characters">

                    <button type="submit" id="loginBtn">
                        Login
                    </button>

                    <button type="button" id="registerBtn">
                        Create Account
                    </button>

                    <button type="button" id="googleBtn">
                        Continue with Google
                    </button>
                </form>
            </section>
        </main>
    `;

    document.getElementById("authForm").addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("authEmail").value.trim();
        const password = document.getElementById("authPassword").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    document.getElementById("registerBtn").addEventListener("click", async () => {
        const name = document.getElementById("authName").value.trim();
        const email = document.getElementById("authEmail").value.trim();
        const password = document.getElementById("authPassword").value;

        if (!name) {
            showMessage("Please enter your full name.", "error");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must contain at least 6 characters.", "error");
            return;
        }

        try {
            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: name
            });
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    document.getElementById("googleBtn").addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

function dashboard() {
    const name = currentUser.displayName || "Student";

    app.innerHTML = `
        <header class="app-header container">
            <h2>🎓 Student E-Portfolio</h2>

            <div class="header-right">
                <span class="user-email">
                    ${escapeHTML(currentUser.email || "")}
                </span>
                <button type="button" id="logoutBtn">Logout</button>
            </div>
        </header>

        <div class="dashboard-layout">
            <aside class="sidebar">
                <div class="sidebar-title">MY WORKSPACE</div>

                <button class="nav-button active"
                        data-section="home">🏠 Home</button>

                <button class="nav-button"
                        data-section="profile">👤 My Profile</button>

                <button class="nav-button"
                        data-section="create">✏️ Create Portfolio</button>

                <button class="nav-button"
                        data-section="preview">👁️ Preview Portfolio</button>

                <button class="nav-button"
                        data-section="download">📄 Download PDF</button>

                <div class="sidebar-note">
                    <strong>Keep growing! 🌱</strong>
                    <p>Your journey, achievements and skills belong here.</p>
                </div>
            </aside>

            <main class="dashboard-main">
                <div id="message" class="message hidden"></div>

                <section id="section-home" class="page-section">
                    <div class="hero card">
                        <p class="eyebrow">YOUR PERSONAL WORKSPACE</p>
                        <h1>Welcome, ${escapeHTML(name)}! 👋</h1>
                        <p>Showcase your skills, projects and achievements.</p>
                        <button type="button" data-go="create">
                            Create My Portfolio →
                        </button>
                    </div>

                    <div class="stats-grid">
                        <article class="card stat-card">
                            <div class="stat-icon">👤</div>
                            <h3>My Profile</h3>
                            <p>View your student information.</p>
                            <button type="button" data-go="profile">
                                View Profile
                            </button>
                        </article>

                        <article class="card stat-card">
                            <div class="stat-icon">✨</div>
                            <h3>My Portfolio</h3>
                            <p>Add your projects and achievements.</p>
                            <button type="button" data-go="create">
                                Edit Portfolio
                            </button>
                        </article>

                        <article class="card stat-card">
                            <div class="stat-icon">👁️</div>
                            <h3>Preview</h3>
                            <p>See how your portfolio looks.</p>
                            <button type="button" data-go="preview">
                                View Preview
                            </button>
                        </article>

                        <article class="card stat-card">
                            <div class="stat-icon">📄</div>
                            <h3>Download PDF</h3>
                            <p>Print or save your portfolio as a PDF.</p>
                            <button type="button" data-go="download">
                                Download
                            </button>
                        </article>
                    </div>
                </section>

                <section id="section-profile"
                         class="page-section hidden">
                    <div class="section-heading">
                        <p class="eyebrow">ABOUT YOU</p>
                        <h1>My Profile 👤</h1>
                        <p>Your student details and personal information.</p>
                    </div>

                    <div class="card">
                        <div id="profileDetails"></div>
                        <button type="button" data-go="create">
                            Edit My Details
                        </button>
                    </div>
                </section>

                <section id="section-create"
                         class="page-section hidden">
                    <div class="section-heading">
                        <p class="eyebrow">BUILD YOUR FUTURE</p>
                        <h1>Create Portfolio ✏️</h1>
                        <p>Fill in your information and save your work.</p>
                    </div>

                    <form id="portfolioForm" class="card">
                        <div class="form-grid">
                            <div>
                                <label for="fullName">Full Name</label>
                                <input id="fullName" name="fullName"
                                       placeholder="Your full name">
                            </div>

                            <div>
                                <label for="college">College Name</label>
                                <input id="college" name="college"
                                       placeholder="Your college">
                            </div>

                            <div>
                                <label for="branch">Branch / Department</label>
                                <input id="branch" name="branch"
                                       placeholder="e.g. Information Technology">
                            </div>

                            <div>
                                <label for="year">Academic Year</label>
                                <input id="year" name="year"
                                       placeholder="e.g. Third Year">
                            </div>
                        </div>

                        <label for="about">About Me</label>
                        <textarea id="about" name="about" rows="4"
                                  placeholder="Introduce yourself"></textarea>

                        <label for="skills">Skills</label>
                        <textarea id="skills" name="skills" rows="3"
                                  placeholder="HTML, CSS, JavaScript..."></textarea>

                        <label for="projects">Projects</label>
                        <textarea id="projects" name="projects" rows="4"
                                  placeholder="Describe your projects"></textarea>

                        <label for="achievements">Achievements</label>
                        <textarea id="achievements" name="achievements" rows="3"
                                  placeholder="Awards, certificates, accomplishments"></textarea>

                        <label for="interests">Interests</label>
                        <textarea id="interests" name="interests" rows="3"
                                  placeholder="Your interests and hobbies"></textarea>

                        <button type="submit">💾 Save Portfolio</button>

                        <button type="button" id="previewBtn">
                            Preview Portfolio
                        </button>
                    </form>
                </section>

                <section id="section-preview"
                         class="page-section hidden">
                    <div class="section-heading no-print">
                        <p class="eyebrow">YOUR ACHIEVEMENTS</p>
                        <h1>Portfolio Preview 👁️</h1>
                        <p>This is how your portfolio will look.</p>
                    </div>

                    <article class="card preview-card">
                        <div id="portfolioPreview" class="preview"></div>
                    </article>

                    <button type="button" id="previewEditBtn" class="no-print">
                        Edit Portfolio
                    </button>

                    <button type="button" id="previewPrintBtn" class="no-print">
                        Print / Save as PDF
                    </button>
                </section>

                <section id="section-download"
                         class="page-section hidden">
                    <div class="section-heading">
                        <p class="eyebrow">TAKE YOUR WORK WITH YOU</p>
                        <h1>Download Portfolio 📄</h1>
                    </div>

                    <div class="card download-card">
                        <div class="download-icon">📄</div>
                        <h2>Your Portfolio PDF</h2>
                        <p>
                            Open the print window and choose
                            <strong>Save as PDF</strong>.
                        </p>
                        <button type="button" id="downloadBtn">
                            Download / Save as PDF
                        </button>
                    </div>
                </section>
            </main>
        </div>
    `;

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.go);
        });
    });

    document.getElementById("portfolioForm").addEventListener(
        "submit",
        savePortfolio
    );

    document.getElementById("previewBtn").addEventListener("click", () => {
        readForm();
        renderPreview();
        showSection("preview");
    });

    document.getElementById("previewEditBtn").addEventListener("click", () => {
        showSection("create");
    });

    document.getElementById("previewPrintBtn").addEventListener(
        "click",
        printPortfolio
    );

    document.getElementById("downloadBtn").addEventListener(
        "click",
        printPortfolio
    );

    fillForm();
    renderProfile();
    renderPreview();
    showSection("home");
}

function showSection(section) {
    const validSections = [
        "home",
        "profile",
        "create",
        "preview",
        "download"
    ];

    if (!validSections.includes(section)) {
        section = "home";
    }

    activeSection = section;

    document.querySelectorAll(".page-section").forEach(element => {
        element.classList.add("hidden");
    });

    const target = document.getElementById(`section-${section}`);

    if (target) {
        target.classList.remove("hidden");
    }

    document.querySelectorAll("[data-section]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === section
        );
    });

    if (section === "profile") {
        renderProfile();
    }

    if (section === "preview") {
        renderPreview();
    }
}

function fillForm() {
    const form = document.getElementById("portfolioForm");

    if (!form) return;

    Object.keys(portfolio).forEach(key => {
        const field = form.elements.namedItem(key);

        if (field && "value" in field) {
            field.value = portfolio[key] ?? "";
        }
    });
}

function readForm() {
    const form = document.getElementById("portfolioForm");

    if (!form) return portfolio;

    Object.keys(portfolio).forEach(key => {
        const field = form.elements.namedItem(key);

        if (field && "value" in field) {
            portfolio[key] = field.value.trim();
        }
    });

    return portfolio;
}

async function savePortfolio(event) {
    if (event) event.preventDefault();

    if (!currentUser) {
        showMessage("Please log in first.", "error");
        return;
    }

    try {
        readForm();

        await setDoc(
            doc(db, "portfolios", currentUser.uid),
            {
                ...portfolio,
                email: currentUser.email || "",
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        renderProfile();
        renderPreview();

        showMessage("Portfolio saved successfully! 💚");
    } catch (error) {
        console.error("Save portfolio error:", error);
        showMessage(
            "Could not save portfolio. Check your Firebase Firestore rules.",
            "error"
        );
    }
}

function renderProfile() {
    const details = document.getElementById("profileDetails");

    if (!details) return;

    const fields = [
        ["Full Name", portfolio.fullName],
        ["Email", currentUser?.email || ""],
        ["College", portfolio.college],
        ["Branch", portfolio.branch],
        ["Academic Year", portfolio.year],
        ["Skills", portfolio.skills],
        ["Interests", portfolio.interests]
    ];

    details.innerHTML = fields.map(([label, value]) => `
        <div class="profile-row">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(value || "Not added yet")}</strong>
        </div>
    `).join("");
}

function renderPreview() {
    const preview = document.getElementById("portfolioPreview");

    if (!preview) return;

    const data = readForm();

    function section(title, content) {
        if (!content || !content.trim()) return "";

        return `
            <section class="portfolio-section">
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(content).replace(/\n/g, "<br>")}</p>
            </section>
        `;
    }

    preview.innerHTML = `
        <div class="portfolio-top">
            <p class="eyebrow">STUDENT E-PORTFOLIO</p>
            <h2>${escapeHTML(data.fullName || currentUser?.displayName || "Your Name")}</h2>
            <p>${escapeHTML(data.branch || "Your Branch")}</p>
            <p>${escapeHTML(data.college || "Your College")}</p>
            <p>${escapeHTML(data.year || "")}</p>
            <p>${escapeHTML(currentUser?.email || "")}</p>
        </div>

        ${section("About Me", data.about)}
        ${section("Skills", data.skills)}
        ${section("Projects", data.projects)}
        ${section("Achievements", data.achievements)}
        ${section("Interests", data.interests)}

        <p class="muted">Created with Student E-Portfolio</p>
    `;
}

function printPortfolio() {
    readForm();
    renderPreview();
    showSection("preview");

    window.setTimeout(() => {
        window.print();
    }, 150);
}

async function loadPortfolio(user) {
    currentUser = user;

    try {
        const snapshot = await getDoc(
            doc(db, "portfolios", user.uid)
        );

        if (snapshot.exists()) {
            const savedData = snapshot.data();

            Object.keys(portfolio).forEach(key => {
                if (savedData[key] !== undefined) {
                    portfolio[key] = savedData[key] ?? "";
                }
            });
        } else if (user.displayName) {
            portfolio.fullName = user.displayName;
        }
    } catch (error) {
        console.error("Load portfolio error:", error);
    }

    dashboard();
}

onAuthStateChanged(auth, async user => {
    if (user) {
        await loadPortfolio(user);
    } else {
        currentUser = null;
        renderLogin();
    }
});