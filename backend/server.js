// ==========================================
// BLOG APPLICATION BACKEND SERVER
// MongoDB Version
// ==========================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

// ==========================================
// APP SETUP
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
    process.env.JWT_SECRET || "blog_application_secret_key";

const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================
// CHECK MONGODB CONNECTION STRING
// ==========================================

if (!MONGODB_URI) {

    console.error(
        "ERROR: MONGODB_URI is missing from .env"
    );

    process.exit(1);
}

// ==========================================
// MONGODB
// ==========================================

const client = new MongoClient(MONGODB_URI);

let db;
let usersCollection;
let blogsCollection;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// Serve frontend files
app.use(
    express.static(
        require("path").join(__dirname, "..")
    )
);

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            message:
                "Access denied. Please login."
        });

    }

    const token =
        authHeader.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            message: "Token missing."
        });

    }

    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(403).json({
            message:
                "Invalid or expired token."
        });

    }
}

// ==========================================
// HOME / TEST ROUTE
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        message:
            "Blog Application Backend is running successfully!"
    });

});

// ==========================================
// REGISTER USER
// ==========================================

app.post(
    "/api/register",
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;

            // Validate fields
            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    message:
                        "Please fill all fields."
                });

            }

            const cleanName =
                name.trim();

            const cleanEmail =
                email.trim().toLowerCase();

            // Check existing user
            const existingUser =
                await usersCollection.findOne({
                    email: cleanEmail
                });

            if (existingUser) {

                return res.status(400).json({
                    message:
                        "Email already registered."
                });

            }

            // Hash password
            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            // Create user
            const newUser = {

                name: cleanName,

                email: cleanEmail,

                password: hashedPassword,

                createdAt:
                    new Date()

            };

            const result =
                await usersCollection.insertOne(
                    newUser
                );

            res.status(201).json({

                message:
                    "Registration successful.",

                user: {

                    id:
                        result.insertedId.toString(),

                    name:
                        newUser.name,

                    email:
                        newUser.email

                }

            });

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error during registration."
            });

        }

    }
);

// ==========================================
// LOGIN USER
// ==========================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({
                    message:
                        "Please enter email and password."
                });

            }

            const cleanEmail =
                email.trim().toLowerCase();

            // Find user
            const user =
                await usersCollection.findOne({
                    email: cleanEmail
                });

            if (!user) {

                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });

            }

            // Check password
            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {

                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });

            }

            // Create JWT
            const token =
                jwt.sign(

                    {
                        id:
                            user._id.toString(),

                        name:
                            user.name,

                        email:
                            user.email
                    },

                    JWT_SECRET,

                    {
                        expiresIn: "7d"
                    }

                );

            res.json({

                message:
                    "Login successful.",

                token: token,

                user: {

                    id:
                        user._id.toString(),

                    name:
                        user.name,

                    email:
                        user.email

                }

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error during login."
            });

        }

    }
);

// ==========================================
// GET ALL BLOGS
// ==========================================

app.get(
    "/api/blogs",
    async (req, res) => {

        try {

            const blogs =
                await blogsCollection
                    .find({})
                    .sort({
                        createdAt: -1
                    })
                    .toArray();

            const formattedBlogs =
                blogs.map(blog => ({

                    id:
                        blog._id.toString(),

                    title:
                        blog.title,

                    content:
                        blog.content,

                    author:
                        blog.author,

                    authorId:
                        blog.authorId,

                    createdAt:
                        blog.createdAt,

                    updatedAt:
                        blog.updatedAt

                }));

            res.json(
                formattedBlogs
            );

        } catch (error) {

            console.error(
                "Get blogs error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to get blogs."
            });

        }

    }
);

// ==========================================
// GET SINGLE BLOG
// ==========================================

app.get(
    "/api/blogs/:id",
    async (req, res) => {

        try {

            const id =
                req.params.id;

            if (
                !ObjectId.isValid(id)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid blog ID."
                });

            }

            const blog =
                await blogsCollection.findOne({
                    _id:
                        new ObjectId(id)
                });

            if (!blog) {

                return res.status(404).json({
                    message:
                        "Blog not found."
                });

            }

            res.json({

                id:
                    blog._id.toString(),

                title:
                    blog.title,

                content:
                    blog.content,

                author:
                    blog.author,

                authorId:
                    blog.authorId,

                createdAt:
                    blog.createdAt,

                updatedAt:
                    blog.updatedAt

            });

        } catch (error) {

            console.error(
                "Get single blog error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to get blog."
            });

        }

    }
);

// ==========================================
// CREATE BLOG
// ==========================================

app.post(
    "/api/blogs",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                title,
                content
            } = req.body;

            if (
                !title ||
                !content
            ) {

                return res.status(400).json({
                    message:
                        "Title and content are required."
                });

            }

            const newBlog = {

                title:
                    title.trim(),

                content:
                    content.trim(),

                author:
                    req.user.name,

                authorId:
                    req.user.id,

                createdAt:
                    new Date(),

                updatedAt:
                    new Date()

            };

            const result =
                await blogsCollection.insertOne(
                    newBlog
                );

            res.status(201).json({

                message:
                    "Blog created successfully.",

                blog: {

                    id:
                        result.insertedId.toString(),

                    title:
                        newBlog.title,

                    content:
                        newBlog.content,

                    author:
                        newBlog.author,

                    authorId:
                        newBlog.authorId,

                    createdAt:
                        newBlog.createdAt,

                    updatedAt:
                        newBlog.updatedAt

                }

            });

        } catch (error) {

            console.error(
                "Create blog error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to create blog."
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
    async (req, res) => {

        try {

            const id =
                req.params.id;

            if (
                !ObjectId.isValid(id)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid blog ID."
                });

            }

            const blog =
                await blogsCollection.findOne({
                    _id:
                        new ObjectId(id)
                });

            if (!blog) {

                return res.status(404).json({
                    message:
                        "Blog not found."
                });

            }

            // Only owner can edit
            if (
                String(blog.authorId) !==
                String(req.user.id)
            ) {

                return res.status(403).json({
                    message:
                        "You can only edit your own blog."
                });

            }

            const {
                title,
                content
            } = req.body;

            if (
                !title ||
                !content
            ) {

                return res.status(400).json({
                    message:
                        "Title and content are required."
                });

            }

            const updatedAt =
                new Date();

            await blogsCollection.updateOne(

                {
                    _id:
                        new ObjectId(id)
                },

                {
                    $set: {

                        title:
                            title.trim(),

                        content:
                            content.trim(),

                        updatedAt:
                            updatedAt

                    }

                }

            );

            const updatedBlog =
                await blogsCollection.findOne({
                    _id:
                        new ObjectId(id)
                });

            res.json({

                message:
                    "Blog updated successfully.",

                blog: {

                    id:
                        updatedBlog._id.toString(),

                    title:
                        updatedBlog.title,

                    content:
                        updatedBlog.content,

                    author:
                        updatedBlog.author,

                    authorId:
                        updatedBlog.authorId,

                    createdAt:
                        updatedBlog.createdAt,

                    updatedAt:
                        updatedBlog.updatedAt

                }

            });

        } catch (error) {

            console.error(
                "Update blog error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to update blog."
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
    async (req, res) => {

        try {

            const id =
                req.params.id;

            if (
                !ObjectId.isValid(id)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid blog ID."
                });

            }

            const blog =
                await blogsCollection.findOne({
                    _id:
                        new ObjectId(id)
                });

            if (!blog) {

                return res.status(404).json({
                    message:
                        "Blog not found."
                });

            }

            // Only owner can delete
            if (
                String(blog.authorId) !==
                String(req.user.id)
            ) {

                return res.status(403).json({
                    message:
                        "You can only delete your own blog."
                });

            }

            await blogsCollection.deleteOne({
                _id:
                    new ObjectId(id)
            });

            res.json({

                message:
                    "Blog deleted successfully."

            });

        } catch (error) {

            console.error(
                "Delete blog error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to delete blog."
            });

        }

    }
);

// ==========================================
// CONNECT TO MONGODB AND START SERVER
// ==========================================

async function startServer() {

    try {

        await client.connect();

        db =
            client.db("blog_application");

        usersCollection =
            db.collection("users");

        blogsCollection =
            db.collection("blogs");

        // Create unique email index
        await usersCollection.createIndex(
            {
                email: 1
            },
            {
                unique: true
            }
        );

        console.log(
            "=========================================="
        );

        console.log(
            "MongoDB Connected Successfully!"
        );

        console.log(
            "Database: blog_application"
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

        app.listen(
            PORT,
            () => {
                console.log(
                    `Server is ready on port ${PORT}`
                );
            }
        );

    } catch (error) {

        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

}

startServer();