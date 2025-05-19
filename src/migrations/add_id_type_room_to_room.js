"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists
    const tableInfo = await queryInterface.describeTable("Room");
    if (!tableInfo.id_type_room) {
      // Add the column only if it doesn't exist
      await queryInterface.addColumn("Room", "id_type_room", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "TypeRoom",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      console.log("Added id_type_room column to Room table");
    } else {
      console.log("id_type_room column already exists in Room table");
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn("Room", "id_type_room");
      console.log("Removed id_type_room column from Room table");
    } catch (error) {
      console.error("Error removing id_type_room column:", error);
    }
  },
};
