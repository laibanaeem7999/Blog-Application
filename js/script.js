// ==========================================
// BLOG APPLICATION FRONTEND
// Connected to Node.js + Express Backend
// ==========================================

const API_URL = "/api";

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

// ==========================================
// API REQUEST
// ==========================================

async function apiRequest(url, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const token = getToken();

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    try {

        const response = await fetch(
            API_URL + url,
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

    } catch (error) {

        console.error("API Error:", error);

        throw error;
    }
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
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const confirmPassword =
                document.getElementById("confirmPassword").value;

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

                alert(
                    data.message ||
                    "Registration successful!"
                );

                window.location.href = "login.html";

            } catch (error) {

                alert(
                    error.message ||
                    "Registration failed."
                );
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
                document.getElementById("loginEmail").value.trim();

            const password =
                document.getElementById("loginPassword").value;

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

                alert(
                    data.message ||
                    "Login successful!"
                );

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                alert(
                    error.message ||
                    "Login failed."
                );
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

                const data =
                    await apiRequest(
                        "/blogs",
                        {
                            method: "POST",

                            body: JSON.stringify({
                                title: title,
                                content: content
                            })
                        }
                    );

                alert(
                    data.message ||
                    "Blog created successfully!"
                );

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                alert(
                    error.message ||
                    "Unable to create blog."
                );
            }
        }
    );
}

// ==========================================
// DASHBOARD BLOGS
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

        const myBlogs =
            blogs.filter(
                function (blog) {

                    if (!currentUser) {
                        return false;
                    }

                    return String(blog.authorId) ===
                        String(currentUser.id);
                }
            );

        if (myBlogs.length === 0) {

            blogList.innerHTML =
                "<p>No blogs yet. Create your first blog!</p>";

            return;
        }

        myBlogs.forEach(
            function (blog) {

                const blogId =
                    blog.id || blog._id;

                const blogCard =
                    document.createElement("article");

                blogCard.className =
                    "blog-card";

                blogCard.innerHTML =
                    "<h3>" +
                    escapeHTML(blog.title) +
                    "</h3>" +

                    "<p>" +
                    escapeHTML(blog.content) +
                    "</p>" +

                    '<button class="edit-btn">Edit</button>' +

                    '<button class="delete-btn">Delete</button>';

                blogList.appendChild(blogCard);

                const editButton =
                    blogCard.querySelector(".edit-btn");

                editButton.addEventListener(
                    "click",
                    function () {

                        editBlog(blog);
                    }
                );

                const deleteButton =
                    blogCard.querySelector(".delete-btn");

                deleteButton.addEventListener(
                    "click",
                    function () {

                        deleteBlog(blogId);
                    }
                );
            }
        );

    } catch (error) {

        console.error(error);

        blogList.innerHTML =
            "<p>Unable to load blogs.</p>";
    }
}

// ==========================================
// EDIT BLOG
// ==========================================

async function editBlog(blog) {

    const blogId =
        blog.id || blog._id;

    const newTitle =
        prompt(
            "Enter new blog title:",
            blog.title
        );

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
                "/blogs/" + blogId,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        title: trimmedTitle,
                        content: trimmedContent
                    })
                }
            );

        alert(
            data.message ||
            "Blog updated successfully!"
        );

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

    if (!confirmDelete) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/blogs/" + id,
                {
                    method: "DELETE"
                }
            );

        alert(
            data.message ||
            "Blog deleted successfully!"
        );

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
        document.querySelector(".blog-container");

    if (!homeBlogContainer) {
        return;
    }

    try {

        const blogs =
            await apiRequest("/blogs");

        homeBlogContainer.innerHTML = "";

        if (
            !Array.isArray(blogs) ||
            blogs.length === 0
        ) {

            homeBlogContainer.innerHTML =
                "<p>No blogs available yet.</p>";

            return;
        }

        const latestBlogs =
            blogs
                .slice()
                .sort(
                    function (a, b) {

                        return new Date(b.createdAt) -
                            new Date(a.createdAt);
                    }
                )
                .slice(0, 6);

        latestBlogs.forEach(
            function (blog) {

                const blogId =
                    blog.id || blog._id;

                const card =
                    document.createElement("article");

                card.className =
                    "blog-card";

                const content =
                    blog.content || "";

                const shortContent =
                    content.length > 150
                        ? content.substring(0, 150) + "..."
                        : content;

                card.innerHTML =
                    "<h3>" +
                    escapeHTML(blog.title) +
                    "</h3>" +

                    "<p>" +
                    escapeHTML(shortContent) +
                    "</p>" +

                    '<a href="blog-details.html?blog=' +
                    blogId +
                    '" class="btn">Read More</a>';

                homeBlogContainer.appendChild(card);
            }
        );

    } catch (error) {

        console.error(error);

        homeBlogContainer.innerHTML =
            "<p>Unable to load blogs.</p>";
    }
}

loadHomeBlogs();

// ==========================================
// BLOG DETAILS
// ==========================================

const detailsTitle =
    document.getElementById("detailsTitle");

const detailsContent =
    document.getElementById("detailsContent");

if (
    detailsTitle &&
    detailsContent
) {

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
                "/blogs/" + blogId
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
// ==========================================

function escapeHTML(text) {

    if (text === null || text === undefined) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;
}