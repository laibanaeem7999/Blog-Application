// ==========================================
// BLOG APPLICATION FRONTEND
// Connected to Node.js + Express Backend
// ==========================================

const API_URL = "http://localhost:5000/api";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getToken() {
    return localStorage.getItem("token");
}

function getCurrentUser() {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        return null;
    }
}

function saveLoginData(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");

    window.location.href = "login.html";
}

async function apiRequest(url, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}${url}`,
        {
            ...options,
            headers: headers
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.message || "Something went wrong."
        );

    }

    return data;
}

// ==========================================
// REGISTER
// ==========================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document.getElementById("name")
                    .value
                    .trim();

            const email =
                document.getElementById("email")
                    .value
                    .trim();

            const password =
                document.getElementById("password")
                    .value;

            const confirmPassword =
                document.getElementById("confirmPassword")
                    .value;

            if (password !== confirmPassword) {

                alert("Passwords do not match!");

                return;
            }

            try {

                const data = await apiRequest(
                    "/register",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            password: password
                        })
                    }
                );

                alert(data.message);

                window.location.href =
                    "login.html";

            } catch (error) {

                alert(error.message);

            }

        }
    );
}

// ==========================================
// LOGIN
// ==========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById("loginEmail")
                    .value
                    .trim();

            const password =
                document.getElementById("loginPassword")
                    .value;

            try {

                const data = await apiRequest(
                    "/login",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );

                saveLoginData(data);

                alert(data.message);

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                alert(error.message);

            }

        }
    );
}

// ==========================================
// LOGOUT
// ==========================================

const logoutLink =
    document.getElementById("logoutLink");

if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            logout();

        }
    );
}

// ==========================================
// PROTECT LOGIN-ONLY PAGES
// ==========================================

const currentPage =
    window.location.pathname
        .split("/")
        .pop();

const protectedPages = [
    "dashboard.html",
    "create-blog.html"
];

if (
    protectedPages.includes(currentPage) &&
    !getToken()
) {

    alert("Please login first.");

    window.location.href =
        "login.html";
}

// ==========================================
// CREATE BLOG
// ==========================================

const blogForm =
    document.getElementById("blogForm");

if (blogForm) {

    blogForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const title =
                document.getElementById("blogTitle")
                    .value
                    .trim();

            const content =
                document.getElementById("blogContent")
                    .value
                    .trim();

            if (!title || !content) {

                alert(
                    "Please enter both title and content."
                );

                return;
            }

            try {

                const data = await apiRequest(
                    "/blogs",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            title: title,
                            content: content
                        })
                    }
                );

                alert(data.message);

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                alert(error.message);

            }

        }
    );
}

// ==========================================
// DISPLAY DASHBOARD BLOGS
// ==========================================

const blogList =
    document.getElementById("blogList");

if (blogList) {

    loadDashboardBlogs();

}

async function loadDashboardBlogs() {

    try {

        const blogs =
            await apiRequest("/blogs");

        const currentUser =
            getCurrentUser();

        blogList.innerHTML = "";

        const myBlogs = blogs.filter(
            function (blog) {

                return (
                    currentUser &&
                    blog.authorId === currentUser.id
                );

            }
        );

        if (myBlogs.length === 0) {

            blogList.innerHTML = `
                <p>No blogs yet. Create your first blog!</p>
            `;

            return;
        }

        myBlogs.forEach(
            function (blog) {

                const blogCard =
                    document.createElement("article");

                blogCard.className =
                    "blog-card";

                blogCard.innerHTML = `
                    <h3>${escapeHTML(blog.title)}</h3>

                    <p>
                        ${escapeHTML(blog.content)}
                    </p>

                    <button
                        class="edit-btn"
                        data-id="${blog.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${blog.id}"
                    >
                        Delete
                    </button>
                `;

                blogList.appendChild(blogCard);

                const editButton =
                    blogCard.querySelector(
                        ".edit-btn"
                    );

                editButton.addEventListener(
                    "click",
                    function () {

                        editBlog(blog);

                    }
                );

                const deleteButton =
                    blogCard.querySelector(
                        ".delete-btn"
                    );

                deleteButton.addEventListener(
                    "click",
                    function () {

                        deleteBlog(blog.id);

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        blogList.innerHTML = `
            <p>Unable to load blogs.</p>
        `;

    }
}

// ==========================================
// EDIT BLOG
// ==========================================

async function editBlog(blog) {

    const newTitle =
        prompt(
            "Enter new blog title:",
            blog.title
        );

    // Cancel or close = do nothing
    if (newTitle === null) {
        return;
    }

    const trimmedTitle =
        newTitle.trim();

    if (!trimmedTitle) {

        alert(
            "Blog title cannot be empty."
        );

        return;
    }

    const newContent =
        prompt(
            "Enter new blog content:",
            blog.content
        );

    // Cancel or close = do nothing
    if (newContent === null) {
        return;
    }

    const trimmedContent =
        newContent.trim();

    if (!trimmedContent) {

        alert(
            "Blog content cannot be empty."
        );

        return;
    }

    try {

        const data =
            await apiRequest(
                `/blogs/${blog.id}`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        title: trimmedTitle,
                        content: trimmedContent
                    })
                }
            );

        alert(data.message);

        await loadDashboardBlogs();

    } catch (error) {

        alert(error.message);

    }
}

// ==========================================
// DELETE BLOG
// ==========================================

async function deleteBlog(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this blog?"
        );

    // Cancel or close popup = DO NOT DELETE
    if (!confirmDelete) {
        return;
    }

    try {

        const data =
            await apiRequest(
                `/blogs/${id}`,
                {
                    method: "DELETE"
                }
            );

        alert(data.message);

        await loadDashboardBlogs();

    } catch (error) {

        alert(error.message);

    }
}

// ==========================================
// HOME PAGE BLOGS
// ==========================================

async function loadHomeBlogs() {

    const homeBlogContainer =
        document.querySelector(
            ".blog-container"
        );

    if (!homeBlogContainer) {
        return;
    }

    try {

        const blogs =
            await apiRequest("/blogs");

        homeBlogContainer.innerHTML = "";

        if (blogs.length === 0) {

            homeBlogContainer.innerHTML = `
                <p>No blogs available yet.</p>
            `;

            return;
        }

        // Show newest blogs first
        const latestBlogs =
            [...blogs]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )
                .slice(0, 6);

        latestBlogs.forEach(
            function (blog) {

                const card =
                    document.createElement("article");

                card.className =
                    "blog-card";

                const shortContent =
                    blog.content.length > 150
                        ? blog.content.substring(0, 150) + "..."
                        : blog.content;

                card.innerHTML = `
                    <h3>
                        ${escapeHTML(blog.title)}
                    </h3>

                    <p>
                        ${escapeHTML(shortContent)}
                    </p>

                    <a
                        href="blog-details.html?blog=${blog.id}"
                        class="btn"
                    >
                        Read More
                    </a>
                `;

                homeBlogContainer.appendChild(card);

            }
        );

    } catch (error) {

        console.error(error);

        homeBlogContainer.innerHTML = `
            <p>Unable to load blogs.</p>
        `;

    }
}

// Run Home page blog loading
loadHomeBlogs();

// ==========================================
// BLOG DETAILS PAGE
// ==========================================

const detailsTitle =
    document.getElementById("detailsTitle");

const detailsContent =
    document.getElementById("detailsContent");

if (detailsTitle && detailsContent) {

    loadBlogDetails();

}

async function loadBlogDetails() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const blogId =
        params.get("blog");

    if (!blogId) {

        detailsTitle.textContent =
            "Blog Not Found";

        detailsContent.textContent =
            "No blog was selected.";

        return;
    }

    try {

        const blog =
            await apiRequest(
                `/blogs/${blogId}`
            );

        detailsTitle.textContent =
            blog.title;

        detailsContent.textContent =
            blog.content;

    } catch (error) {

        detailsTitle.textContent =
            "Blog Not Found";

        detailsContent.textContent =
            error.message;

    }
}

// ==========================================
// ESCAPE HTML
// Prevent HTML injection in blog previews
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}