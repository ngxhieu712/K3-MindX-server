// Tự suy ra Cinema.brandId / Cinema.districtId từ field cũ `chain` (String) và
// `address` (String tự do), để admin panel cũ (chỉ biết name/chain/color/address)
// không cần sửa gì mà Cinema vẫn có đủ liên kết chuẩn hoá cho phía khách hàng.
import { CinemaBrand } from "../model/CinemaBrand.js";
import { Location } from "../model/Location.js";
import { slugify } from "./slugify.js";

// chain (String) -> CinemaBrand._id, tự tạo CinemaBrand nếu chưa có brand nào
// trùng tên (không phân biệt hoa/thường).
async function findOrCreateBrandId(chain) {
  if (!chain) return null;
  const slug = slugify(chain);
  let brand = await CinemaBrand.findOne({ slug });
  if (!brand) {
    brand = await CinemaBrand.create({ name: chain, slug });
  }
  return brand._id;
}

// Best-effort: dò tên quận/huyện (Location type="district") xuất hiện trong
// chuỗi address tự do. Không match được thì trả về null (không suy đoán bừa) —
// cinema đó chỉ đơn giản là chưa lọc được theo khu vực ở trang khách hàng, các
// tính năng khác không bị ảnh hưởng.
async function guessDistrictId(address) {
  if (!address) return null;
  const districts = await Location.find({ type: "district" }).select("name").lean();
  const normalizedAddress = address.toLowerCase();
  const found = districts.find((d) => normalizedAddress.includes(d.name.toLowerCase()));
  return found ? found._id : null;
}

// doc: object có { chain, address, brandId, districtId } (đọc field hiện có,
// CHỈ tính lại phần nào đang thiếu — không ghi đè giá trị đã có sẵn).
export async function deriveCinemaFields(doc) {
  const result = {};
  if (!doc.brandId && doc.chain) {
    result.brandId = await findOrCreateBrandId(doc.chain);
  }
  if (!doc.districtId && doc.address) {
    const districtId = await guessDistrictId(doc.address);
    if (districtId) result.districtId = districtId;
  }
  return result;
}

export default deriveCinemaFields;
