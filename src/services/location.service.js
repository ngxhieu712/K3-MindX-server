import { Location } from "../model/Location.js";

// GET /api/customer/locations
// Trả về cây: [{ _id, name, slug, districts: [{ _id, name, slug }] }]
export const getLocationsTree = async () => {
  const [cities, districts] = await Promise.all([
    Location.find({ type: "city", isActive: true }).sort({ name: 1 }).lean(),
    Location.find({ type: "district", isActive: true }).sort({ name: 1 }).lean(),
  ]);

  return cities.map((city) => ({
    _id: city._id,
    name: city.name,
    slug: city.slug,
    districts: districts
      .filter((district) => String(district.parentId) === String(city._id))
      .map((district) => ({
        _id: district._id,
        name: district.name,
        slug: district.slug,
      })),
  }));
};

export default { getLocationsTree };
