// ==========================================
// BLOG APPLICATION BACKEND
// Node.js + Express + MongoDB
// Vercel Serverless Version
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

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

const MONGODB_URI = process.env.MONGODB_URI;

const JWT_SECRET =
    process.env.JWT_SECRET || "blog_application_secret_key";

// ==========================================
// CHECK MONGODB URI
// ==========================================

if (!MONGODB_URI) {
    console.error(
        "ERROR: MONGODB_URI environment variable is missing."
    );
}

// ==========================================
// MONGODB CONNECTION
// ==========================================

const client = new MongoClient(MONGODB_URI || "");

let db = null;
let usersCollection = null;
let blogsCollection = null;

let databaseConnection = null;

// ==========================================
// CONNECT TO DATABASE
// ==========================================

async function connectDatabase() {

    if (db && usersCollection && blogsCollection) {
        return;
    }

    if (!MONGODB_URI) {
        throw new Error(
            "MONGODB_URI is not configured in Vercel Environment Variables."
        );
    }

    if (!databaseConnection) {

        databaseConnection = client.connect()
            .then(async () => {

                console.log(
                    "MongoDB Connected Successfully!"
                );

                db = client.db("blog_application");

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
                    "Database: blog_application"
                );

            })
            .catch((error) => {

                databaseConnection = null;

                console.error(
                    "MongoDB connection failed:"
                );

                console.error(
                    error.message
                );

                throw error;
            });
    }

    await databaseConnection;
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
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
            message:
                "Token missing."
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

app.get(
    "/api",
    async (req, res) => {

        try {

            await connectDatabase();

            res.json({
                message:
                    "Blog Application Backend is running successfully!"
            });

        } catch (error) {

            console.error(
                "API test error:",
                error
            );

            res.status(500).json({
                message:
                    "Backend is running, but MongoDB connection failed."
            });
        }
    }
);

// ==========================================
// REGISTER USER
// ==========================================

app.post(
    "/api/register",
    async (req, res) => {

        try {

            await connectDatabase();

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
                String(name).trim();

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            // Validate password
            if (password.length < 6) {

                return res.status(400).json({
                    message:
                        "Password must be at least 6 characters."
                });
            }

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

                name:
                    cleanName,

                email:
                    cleanEmail,

                password:
                    hashedPassword,

                createdAt:
                    new Date()
            };

            const result =
                await usersCollection.insertOne(
                    newUser
                );

            return res.status(201).json({

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

            // Handle duplicate email
            if (error.code === 11000) {

                return res.status(400).json({
                    message:
                        "Email already registered."
                });
            }

            return res.status(500).json({
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

            await connectDatabase();

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
                String(email)
                    .trim()
                    .toLowerCase();

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
                        expiresIn:
                            "7d"
                    }
                );

            return res.json({

                message:
                    "Login successful.",

                token:
                    token,

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

            return res.status(500).json({
                message:
                    "Server error during login."
            });
        }
    }
);

// ==========================================
// GET ALL BLOGS
// PUBLIC ROUTE
// ==========================================

app.get(
    "/api/blogs",
    async (req, res) => {

        try {

            await connectDatabase();

            const blogs =
                await blogsCollection
                    .find({})
                    .sort({
                        createdAt: -1
                    })
                    .toArray();

            const formattedBlogs =
                blogs.map(
                    function (blog) {

                        return {

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
                        };
                    }
                );

            return res.json(
                formattedBlogs
            );

        } catch (error) {

            console.error(
                "Get blogs error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to get blogs."
            });
        }
    }
);

// ==========================================
// GET SINGLE BLOG
// PUBLIC ROUTE
// ==========================================

app.get(
    "/api/blogs/:id",
    async (req, res) => {

        try {

            await connectDatabase();

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

            return res.json({

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

            return res.status(500).json({
                message:
                    "Unable to get blog."
            });
        }
    }
);

// ==========================================
// CREATE BLOG
// PROTECTED ROUTE
// ==========================================

app.post(
    "/api/blogs",
    authenticateToken,
    async (req, res) => {

        try {

            await connectDatabase();

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

            const cleanTitle =
                String(title).trim();

            const cleanContent =
                String(content).trim();

            if (
                !cleanTitle ||
                !cleanContent
            ) {

                return res.status(400).json({
                    message:
                        "Title and content cannot be empty."
                });
            }

            const newBlog = {

                title:
                    cleanTitle,

                content:
                    cleanContent,

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

            return res.status(201).json({

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

            return res.status(500).json({
                message:
                    "Unable to create blog."
            });
        }
    }
);

// ==========================================
// UPDATE BLOG
// PROTECTED ROUTE
// ==========================================

app.put(
    "/api/blogs/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await connectDatabase();

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

            const cleanTitle =
                String(title).trim();

            const cleanContent =
                String(content).trim();

            if (
                !cleanTitle ||
                !cleanContent
            ) {

                return res.status(400).json({
                    message:
                        "Title and content cannot be empty."
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
                            cleanTitle,

                        content:
                            cleanContent,

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

            return res.json({

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

            return res.status(500).json({
                message:
                    "Unable to update blog."
            });
        }
    }
);

// ==========================================
// DELETE BLOG
// PROTECTED ROUTE
// ==========================================

app.delete(
    "/api/blogs/:id",
    authenticateToken,
    async (req, res) => {

        try {

            await connectDatabase();

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

            return res.json({

                message:
                    "Blog deleted successfully."
            });

        } catch (error) {

            console.error(
                "Delete blog error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to delete blog."
            });
        }
    }
);

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
    function (error, req, res, next) {

        console.error(
            "Unexpected server error:",
            error
        );

        res.status(500).json({
            message:
                "Internal server error."
        });
    }
);

// ==========================================
// VERCEL EXPORT
// ==========================================

// IMPORTANT:
// Do NOT use app.listen() on Vercel.

module.exports = app;