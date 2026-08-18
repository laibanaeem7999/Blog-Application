// ==========================================
// BLOG APPLICATION JAVASCRIPT
// ==========================================


// ==========================================
// REGISTER
// ==========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const user = {
            name: name,
            email: email,
            password: password
        };

        localStorage.setItem("user", JSON.stringify(user));

        alert("Registration successful!");

        window.location.href = "login.html";
    });
}


// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const savedUser =
            JSON.parse(localStorage.getItem("user"));

        if (!savedUser) {
            alert("No account found. Please register first.");
            return;
        }

        if (
            email === savedUser.email &&
            password === savedUser.password
        ) {

            localStorage.setItem("loggedIn", "true");

            alert("Login successful!");

            window.location.href = "dashboard.html";

        } else {

            alert("Invalid email or password!");

        }
    });
}


// ==========================================
// CREATE / EDIT BLOG
// ==========================================

const blogForm = document.getElementById("blogForm");

if (blogForm) {

    const titleInput =
        document.getElementById("blogTitle");

    const contentInput =
        document.getElementById("blogContent");

    const formTitle =
        document.getElementById("blogFormTitle");

    const formDescription =
        document.getElementById("blogFormDescription");

    const submitButton =
        document.getElementById("blogSubmitButton");


    // Check if we are editing a blog
    const urlParams =
        new URLSearchParams(window.location.search);

    const editId =
        urlParams.get("edit");


    // ======================================
    // EDIT MODE
    // ======================================

    if (editId) {

        let blogs =
            JSON.parse(localStorage.getItem("blogs")) || [];

        const blog =
            blogs.find(function (item) {

                return String(item.id) === String(editId);

            });


        if (blog) {

            // Put existing information into form
            titleInput.value = blog.title;

            contentInput.value = blog.content;

            formTitle.textContent =
                "Edit Blog";

            formDescription.textContent =
                "Update your blog and save the changes.";

            submitButton.textContent =
                "Update Blog";

        } else {

            alert("Blog not found!");

            window.location.href =
                "dashboard.html";
        }
    }


    // ======================================
    // FORM SUBMIT
    // ======================================

    blogForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const title =
            titleInput.value.trim();

        const content =
            contentInput.value.trim();


        if (title === "" || content === "") {

            alert(
                "Please enter both a title and blog content."
            );

            return;
        }


        let blogs =
            JSON.parse(localStorage.getItem("blogs")) || [];


        // ==================================
        // UPDATE EXISTING BLOG
        // ==================================

        if (editId) {

            const blog =
                blogs.find(function (item) {

                    return String(item.id) === String(editId);

                });


            if (!blog) {

                alert("Blog not found!");

                return;
            }


            blog.title = title;

            blog.content = content;


            localStorage.setItem(
                "blogs",
                JSON.stringify(blogs)
            );


            alert("Blog updated successfully!");

            window.location.href =
                "dashboard.html";

            return;
        }


        // ==================================
        // CREATE NEW BLOG
        // ==================================

        const newBlog = {

            id: Date.now(),

            title: title,

            content: content

        };


        blogs.push(newBlog);


        localStorage.setItem(
            "blogs",
            JSON.stringify(blogs)
        );


        alert("Blog published successfully!");

        window.location.href =
            "dashboard.html";
    });
}


// ==========================================
// DISPLAY BLOGS
// ==========================================

const blogList =
    document.getElementById("blogList");


if (blogList) {

    const blogs =
        JSON.parse(localStorage.getItem("blogs")) || [];


    blogList.innerHTML = "";


    if (blogs.length === 0) {

        blogList.innerHTML = `
            <p class="no-blogs">
                No blogs yet. Create your first blog!
            </p>
        `;

    } else {

        blogs.forEach(function (blog) {

            const blogCard =
                document.createElement("article");

            blogCard.className =
                "blog-card";


            blogCard.innerHTML = `

                <h3>${blog.title}</h3>

                <p>${blog.content}</p>

                <button
                    type="button"
                    class="edit-btn">
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-btn">
                    Delete
                </button>

            `;


            blogList.appendChild(blogCard);


            // ==================================
            // EDIT BUTTON
            // ==================================

            const editButton =
                blogCard.querySelector(".edit-btn");


            editButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "create-blog.html?edit=" + blog.id;

                }
            );


            // ==================================
            // DELETE BUTTON
            // ==================================

            const deleteButton =
                blogCard.querySelector(".delete-btn");


            deleteButton.addEventListener(
                "click",
                function () {

                    deleteBlog(blog.id);

                }
            );

        });
    }
}


// ==========================================
// DELETE BLOG
// ==========================================

function deleteBlog(id) {

    const confirmDelete =
        window.confirm(
            "Are you sure you want to delete this blog?"
        );


    // Cancel or X
    if (!confirmDelete) {
        return;
    }


    let blogs =
        JSON.parse(localStorage.getItem("blogs")) || [];


    blogs =
        blogs.filter(function (blog) {

            return String(blog.id) !== String(id);

        });


    localStorage.setItem(
        "blogs",
        JSON.stringify(blogs)
    );


    alert("Blog deleted successfully!");

    window.location.reload();
}
// ==========================================
// LOGOUT
// ==========================================

const logoutLink =
    document.getElementById("logoutLink");

if (logoutLink) {

    logoutLink.addEventListener("click", function (event) {

        event.preventDefault();

        localStorage.removeItem("loggedIn");

        alert("You have been logged out.");

        window.location.href = "login.html";
    });
}
// ==========================================
// READ MORE / BLOG DETAILS
// ==========================================

const detailsTitle =
    document.getElementById("detailsTitle");

const detailsContent =
    document.getElementById("detailsContent");

if (detailsTitle && detailsContent) {

    const urlParams =
        new URLSearchParams(window.location.search);

    const blogNumber =
        urlParams.get("blog");

    const sampleBlogs = {

        "1": {
            title: "Getting Started with Web Development",
            content:
                "Web development is the process of creating websites and web applications. HTML is used to create the structure of a webpage, CSS is used to design it, and JavaScript adds interactive functionality."
        },

        "2": {
            title: "Why Learn JavaScript?",
            content:
                "JavaScript is one of the most important technologies for modern web development. It allows developers to create interactive websites, handle user actions, modify webpage content and build dynamic applications."
        },

        "3": {
            title: "Tips for Better Web Design",
            content:
                "Good web design should be simple, responsive and easy to use. Use clear navigation, readable text, appropriate spacing and responsive layouts so your website works well on different screen sizes."
        }

    };


    const selectedBlog =
        sampleBlogs[blogNumber];


    if (selectedBlog) {

        detailsTitle.textContent =
            selectedBlog.title;

        detailsContent.textContent =
            selectedBlog.content;

    } else {

        detailsTitle.textContent =
            "Blog Not Found";

        detailsContent.textContent =
            "Sorry, this blog could not be found.";

    }
}