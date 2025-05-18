import { Op } from "sequelize";
import { Province, City } from "../models";

export const searchLocation = async (req: any, res: any) => {
  const { keyword } = req.query;

  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ message: "Keyword is required." });
  }

  try {
    const provinceResults = await Province.findAll({
      where: {
        name: {
          [Op.iLike]: `%${keyword}%`,
        },
      },
      limit: 5,
    });

    const cityResults = await City.findAll({
      where: {
        name: {
          [Op.iLike]: `%${keyword}%`,
        },
      },
      include: [
        {
          model: Province,
          attributes: ["id", "name"],
        },
      ],

      limit: 5,
    });
    const finalResults = [...provinceResults, ...cityResults].slice(0, 5);

    return res.json(finalResults);
  } catch (error) {
    console.error("Error searching location:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
