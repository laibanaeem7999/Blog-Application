require("dotenv").config();

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function testConnection() {
    try {
        await client.connect();

        console.log("MongoDB Connected Successfully!");

        const db = client.db("blog_application");

        console.log("Database:", db.databaseName);
    } catch (error) {
        console.error("MongoDB Connection Failed:");
        console.error(error.message);
    } finally {
        await client.close();
    }
}

testConnection();