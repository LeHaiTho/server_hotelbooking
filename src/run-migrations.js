const path = require("path");
const { Sequelize } = require("sequelize");
const Umzug = require("umzug");
require("dotenv").config();

// Database configuration
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hotel_booking",
  logging: console.log,
});

// Umzug instance for migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, "./migrations"),
    params: [sequelize.getQueryInterface(), Sequelize],
  },
  storage: "sequelize",
  storageOptions: {
    sequelize: sequelize,
  },
});

// Function to run migrations
const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Run pending migrations
    const migrations = await umzug.up();

    if (migrations.length === 0) {
      console.log(
        "No migrations were executed, database schema already up to date"
      );
    } else {
      console.log(
        "Executed migrations:",
        migrations.map((m) => m.file).join(", ")
      );
    }

    console.log("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
};

// Run migrations
runMigrations();
