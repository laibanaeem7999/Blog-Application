// ==========================================
// BLOG APPLICATION BACKEND SERVER
// ==========================================

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// ==========================================
// APP SETUP
// ==========================================

const app = express();
const PORT = 5000;

const JWT_SECRET = "blog_application_secret_key";

// ==========================================
// FILE PATHS
// ==========================================

const dataFolder = path.join(__dirname, "data");

const usersFile = path.join(dataFolder, "users.json");
const blogsFile = path.join(dataFolder, "blogs.json");

// ==========================================
// CREATE DATA FOLDER AND FILES IF MISSING
// ==========================================

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]");
}

if (!fs.existsSync(blogsFile)) {
    fs.writeFileSync(blogsFile, "[]");
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from main Blog_Application folder
app.use(express.static(path.join(__dirname, "..")));

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading users:", error);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );
}

function readBlogs() {
    try {
        const data = fs.readFileSync(blogsFile, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading blogs:", error);
        return [];
    }
}

function saveBlogs(blogs) {
    fs.writeFileSync(
        blogsFile,
        JSON.stringify(blogs, null, 2)
    );
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token missing."
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(403).json({
            message: "Invalid or expired token."
        });
    }
}

// ==========================================
// HOME / TEST ROUTE
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        message: "Blog Application Backend is running successfully!"
    });

});

// ==========================================
// REGISTER USER
// ==========================================

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        // Check required fields
        if (!name || !email || !password) {

            return res.status(400).json({
                message: "Please fill all fields."
            });

        }

        const users = readUsers();

        // Check existing email
        const existingUser = users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        );

        if (existingUser) {

            return res.status(400).json({
                message: "Email already registered."
            });

        }

        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);

        const newUser = {

            id: Date.now(),

            name: name.trim(),

            email: email.trim().toLowerCase(),

            password: hashedPassword

        };

        users.push(newUser);

        saveUsers(users);

        res.status(201).json({

            message: "Registration successful.",

            user: {

                id: newUser.id,

                name: newUser.name,

                email: newUser.email

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error during registration."
        });

    }

});

// ==========================================
// LOGIN USER
// ==========================================

app.post("/api/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message: "Please enter email and password."
            });

        }

        const users = readUsers();

        const user = users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        );

        if (!user) {

            return res.status(401).json({
                message: "Invalid email or password."
            });

        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid email or password."
            });

        }

        // Create JWT token
        const token = jwt.sign(

            {
                id: user.id,

                name: user.name,

                email: user.email

            },

            JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );

        res.json({

            message: "Login successful.",

            token: token,

            user: {

                id: user.id,

                name: user.name,

                email: user.email

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error during login."
        });

    }

});

// ==========================================
// GET ALL BLOGS
// ==========================================

app.get("/api/blogs", (req, res) => {

    try {

        const blogs = readBlogs();

        res.json(blogs);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to get blogs."
        });

    }

});

// ==========================================
// GET SINGLE BLOG
// ==========================================

app.get("/api/blogs/:id", (req, res) => {

    try {

        const blogs = readBlogs();

        const id = Number(req.params.id);

        const blog = blogs.find(
            blog => blog.id === id
        );

        if (!blog) {

            return res.status(404).json({
                message: "Blog not found."
            });

        }

        res.json(blog);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Unable to get blog."
        });

    }

});

// ==========================================
// CREATE BLOG
// ==========================================

app.post(
    "/api/blogs",
    authenticateToken,
    (req, res) => {

        try {

            const {
                title,
                content
            } = req.body;

            if (!title || !content) {

                return res.status(400).json({
                    message: "Title and content are required."
                });

            }

            const blogs = readBlogs();

            const newBlog = {

                id: Date.now(),

                title: title.trim(),

                content: content.trim(),

                author: req.user.name,

                authorId: req.user.id,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };

            blogs.push(newBlog);

            saveBlogs(blogs);

            res.status(201).json({

                message: "Blog created successfully.",

                blog: newBlog

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Unable to create blog."
            });

        }

    }
);

// ==========================================
// UPDATE BLOG
// ==========================================

app.put(
    "/api/blogs/:id",
    authenticateToken,
    (req, res) => {

        try {

            const blogs = readBlogs();

            const id = Number(req.params.id);

            const blogIndex = blogs.findIndex(
                blog => blog.id === id
            );

            if (blogIndex === -1) {

                return res.status(404).json({
                    message: "Blog not found."
                });

            }

            const blog = blogs[blogIndex];

          // Only the owner can edit
if (Number(blog.authorId) !== Number(req.user.id)) {

    return res.status(403).json({
        message:
            "You can only edit your own blog."
    });

}

            const {
                title,
                content
            } = req.body;

            if (!title || !content) {

                return res.status(400).json({
                    message:
                        "Title and content are required."
                });

            }

            blog.title = title.trim();

            blog.content = content.trim();

            blog.updatedAt =
                new Date().toISOString();

            blogs[blogIndex] = blog;

            saveBlogs(blogs);

            res.json({

                message:
                    "Blog updated successfully.",

                blog: blog

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Unable to update blog."
            });

        }

    }
);

// ==========================================
// DELETE BLOG
// ==========================================

app.delete(
    "/api/blogs/:id",
    authenticateToken,
    (req, res) => {

        try {

            let blogs = readBlogs();

            const id = Number(req.params.id);

            const blog = blogs.find(
                blog => blog.id === id
            );

            if (!blog) {

                return res.status(404).json({
                    message: "Blog not found."
                });

            }

            // Only owner can delete
            if (
                blog.authorId &&
                blog.authorId !== req.user.id
            ) {

                return res.status(403).json({
                    message:
                        "You can only delete your own blog."
                });

            }

            blogs = blogs.filter(
                blog => blog.id !== id
            );

            saveBlogs(blogs);

            res.json({

                message:
                    "Blog deleted successfully."

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Unable to delete blog."
            });

        }

    }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        "=========================================="
    );

    console.log(
        "Blog Application Backend Started"
    );

    console.log(
        `Server running at http://localhost:${PORT}`
    );

    console.log(
        "=========================================="
    );

});