import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getLocationsTree } from "../services/location.service.js";

export const getLocations = asyncHandler(async (req, res) => {
  const data = await getLocationsTree();
  return sendSuccess(res, data);
});

export default { getLocations };
