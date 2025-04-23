import Hotel from "src/models/HotelModel";
import { distance } from "src/utils/constant";
const findNearestHotel = async (lat: number, lon: number) => {
  let hotels = await Hotel.findAll({});
  return hotels
    .map((hotel) => {
      return {
        ...hotel,
        distance: distance(
          lat,
          lon,
          Number(hotel.latitude),
          Number(hotel.longitude)
        ),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);
};

export { findNearestHotel };
