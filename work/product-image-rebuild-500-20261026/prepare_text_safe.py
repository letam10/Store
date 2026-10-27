"""Tạo copy tiếng Việt trước khi ImageGen chạy; ảnh AI không tự render chữ."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-500-20261026"


STYLES = [
    ("graphite-tech", "CÔNG NGHỆ THEO CÁCH RIÊNG", "XEM NGAY"),
    ("warm-home", "GỌN HƠN MỖI NGÀY", "KHÁM PHÁ"),
    ("luxury-macro", "CHI TIẾT TẠO KHÁC BIỆT", "XEM BỘ SƯU TẬP"),
    ("wellness", "CHỌN ĐÚNG NHỊP SỐNG", "XEM CHI TIẾT"),
    ("fashion-tech", "NỔI BẬT TỪ GÓC NHÌN", "CHỌN MẪU"),
    ("editorial", "ĐẬM CHẤT RIÊNG", "THỬ NGAY"),
    ("travel-work", "SẴN SÀNG ĐI XA", "LÊN ĐƯỜNG"),
    ("soft-lifestyle", "MANG THEO MỖI NGÀY", "CHỌN NGAY"),
]
STYLE_BY_KEY = {entry[0]: entry for entry in STYLES}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def display_name(value: object, fallback: str = "Sản phẩm Store") -> str:
    text = " ".join(str(value or "").split())
    text = re.sub(r"\b(AmazonBasics|Amazon Brand|Amazon Collection|Solimo|find\.|Symbol|The Fix|Stone & Beam|Samsung|Motorola|Lenovo|Vivo|Nokia|Gionee|Realme|Micromax)\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[^\u0000-\u024F\u1E00-\u1EFF0-9 .,()/&+\-]+", " ", text)
    text = " ".join(text.split()).strip(" -,:;")
    return text[:88] or fallback


def infer_feature(product: dict) -> str:
    name = str(product.get("name", "")).lower()
    category = str(product.get("category", "")).lower()
    if any(token in name for token in ("ốp lưng", "case")):
        return "LƯNG CỨNG • BẢO VỆ • HỌA TIẾT NỔI BẬT"
    if any(token in name for token in ("giày", "sneaker", "bốt", "dép", "shoe")):
        return "ĐẾ ÊM • DỄ PHỐI • ĐI HẰNG NGÀY"
    if any(token in name for token in ("laptopstativ", "giá đỡ laptop", "laptop stand", "stativ")):
        return "NHÔM BẠC • 2 QUẠT TẢN NHIỆT • GẬP GỌN"
    if "laptop" in name or "balo" in name or "vali" in name:
        return "BẢO VỆ THIẾT BỊ • NGĂN GỌN • DI CHUYỂN"
    if any(token in name for token in ("bông tai", "dây chuyền", "lắc tay", "bạc sterling", "kim cương")) or "trang sức" in category:
        return "KIM LOẠI TINH XẢO • BẮT SÁNG • DỄ PHỐI"
    if any(token in name for token in ("hạt", "cà phê", "coffee", "dressing", "snack")):
        return "THƠM NGON • TIỆN DÙNG • DỄ CHIA PHẦN"
    if "làm đẹp" in category or any(token in name for token in ("omega", "sữa tắm", "dầu cá")):
        return "DỊU NHẸ • DỄ DÙNG • CHO NHỊP SỐNG HẰNG NGÀY"
    if "trang phục" in category or any(token in name for token in ("mũ", "áo", "túi", "vải")):
        return "MỀM MẠI • DỄ PHỐI • THOẢI MÁI"
    if "điện tử" in category or "linh kiện" in category:
        return "GỌN NHẸ • BỀN BỈ • DỄ DÙNG"
    return "THIẾT KẾ CHỈN CHU • DỄ DÙNG • HẰNG NGÀY"


def product_title(product: dict) -> str:
    name = str(product.get("name", "")).lower()
    if any(token in name for token in ("laptopstativ", "giá đỡ laptop", "laptop stand", "stativ")):
        return "GIÁ ĐỠ LAPTOP ĐIỀU CHỈNH"
    if any(token in name for token in ("ốp lưng", "case")):
        return "ỐP LƯNG ĐIỆN THOẠI"
    if any(token in name for token in ("giày", "sneaker", "bốt", "dép", "shoe", "scarpe", "stringate", "brogue", "brouge")):
        return "GIÀY THỜI TRANG"
    if any(token in name for token in ("bông tai", "dây chuyền", "lắc tay", "bạc sterling", "kim cương")):
        return "TRANG SỨC TINH XẢO"
    if any(token in name for token in ("laptop", "balo", "vali")):
        return "PHỤ KIỆN LAPTOP"
    if any(token in name for token in ("hạt", "cà phê", "coffee", "dressing", "snack")):
        return "SẢN PHẨM ẨM THỰC"
    if any(token in name for token in ("thức ăn", "mèo", "pet", "cat")):
        return "THỨC ĂN HẠT CHO MÈO"
    if any(token in name for token in ("mũ", "áo", "túi", "vải")):
        return "PHỤ KIỆN HẰNG NGÀY"
    if any(token in name for token in ("màng ép", "laminating")):
        return "MÀNG ÉP NHIỆT CAO CẤP"
    if any(token in name for token in ("sổ tay", "notebook", "wirebound")):
        return "SỔ TAY GHI CHÉP"
    if any(token in name for token in ("chăn", "mền", "blanket")):
        return "CHĂN MỀN COTTON"
    if any(token in name for token in ("bình", "bottle")):
        return "BÌNH NƯỚC THỂ THAO"
    if any(token in name for token in ("sáp thơm", "degreaser", "cleaner")):
        return "SẢN PHẨM CHĂM SÓC NHÀ"
    if any(token in name for token in ("xà phòng", "soap", "dish")):
        return "KHAY ĐỰNG XÀ PHÒNG"
    return display_name(product.get("name"), "SẢN PHẨM STORE").upper()


def function_for(product: dict) -> str:
    name = str(product.get("name", "")).lower()
    if any(token in name for token in ("laptopstativ", "giá đỡ laptop", "laptop stand", "stativ")):
        return "Giá đỡ laptop bằng nhôm, điều chỉnh góc, có hai quạt tản nhiệt và chân gập; vật thể phải là giá đỡ rỗng, không phải laptop hay vali."
    if any(token in name for token in ("ốp lưng", "case")):
        return "Ốp lưng điện thoại vừa khít thân máy, có vùng khoét camera và bề mặt in hoặc phủ bảo vệ; không biến thành điện thoại mới."
    if any(token in name for token in ("giày", "sneaker", "bốt", "dép", "shoe", "scarpe", "stringate", "brogue", "brouge")):
        return "Một đôi giày có phần thân, dây hoặc quai, đế và đường may đúng cấu trúc; không biến thành túi hay vật trang trí."
    if any(token in name for token in ("bông tai", "dây chuyền", "lắc tay", "bạc sterling", "kim cương")):
        return "Trang sức kim loại nhỏ, phản chiếu ánh sáng, giữ đúng hình dạng món trang sức và không thêm người mẫu hoặc phụ kiện khác."
    if any(token in name for token in ("hạt", "cà phê", "coffee", "dressing", "snack")):
        return "Sản phẩm thực phẩm đóng gói hoặc hạt ăn được; thể hiện đúng bao bì, kết cấu và một lượng nhỏ sản phẩm dùng để minh họa."
    if any(token in name for token in ("thức ăn", "mèo", "pet", "cat")):
        return "Thức ăn hạt khô cho mèo, thể hiện đúng bao bì và hạt thức ăn; không biến thành món ăn cho người."
    if any(token in name for token in ("màng ép", "laminating")):
        return "Các tấm màng ép nhựa trong hoặc mờ dùng để ép tài liệu, phẳng, mỏng, không biến thành giấy hoặc màn hình."
    if any(token in name for token in ("sổ tay", "notebook", "wirebound")):
        return "Sổ tay gáy lò xo hoặc gáy dây với nhiều trang giấy, bìa và ngăn ghi chú đúng cấu trúc."
    if any(token in name for token in ("chăn", "mền", "blanket")):
        return "Chăn hoặc mền vải có nếp gấp, bề mặt dệt và kích thước thực tế; không biến thành thảm hoặc quần áo."
    if any(token in name for token in ("bình", "bottle")):
        return "Bình nước có thân bình, nắp và dung tích thể thao; giữ đúng chất liệu thủy tinh hoặc nhựa theo ảnh tham chiếu."
    if any(token in name for token in ("mũ", "hat", "cap")):
        return "Mũ đội đầu có vành hoặc thân len đúng loại, thể hiện kết cấu vải và form đội đầu nhưng không có người."
    if any(token in name for token in ("xà phòng", "soap", "dish")):
        return "Khay đựng xà phòng bằng thép không gỉ, có bề mặt thoát nước và dùng trong khu vực rửa tay."
    if any(token in name for token in ("túi", "tote", "bag")):
        return "Túi có thân, quai, khóa hoặc ngăn đúng cấu trúc, đặt trong bối cảnh thời trang phù hợp nhưng không có người."
    return "Giữ nguyên hình dạng, vật liệu và công dụng thực tế của sản phẩm trong ảnh tham chiếu; không biến thành vật thể khác."


def headline_for(product: dict, index: int) -> str:
    name = str(product.get("name", "")).lower()
    options = {
        "case": ["GIỮ MÁY, GIỮ GU", "CHỐNG XƯỚC, GIỮ CHẤT", "MẶC MỚI CHO ĐIỆN THOẠI", "GỌN MÁY, NỔI BẬT", "HỌA TIẾT KHÔNG ĐỤNG HÀNG", "CẦM CHẮC, NHÌN ĐẸP"],
        "shoe": ["BƯỚC ĐI CÓ CHẤT", "ĐI ÊM, ĐI ĐẸP", "SẮC BẠC TRÊN TỪNG BƯỚC", "DÁNG ĐẸP, ĐI CẢ NGÀY", "ĐẾ ÊM CHO NHỊP BẬN RỘN", "PHỐI ĐỒ, PHỐI CẢ PHONG CÁCH"],
        "jewelry": ["ÁNH KIM LÊN TIẾNG", "BẮT SÁNG TỪNG GÓC", "MỘT CHI TIẾT, CẢ PHONG CÁCH", "TINH XẢO TRONG TỪNG NÉT", "ĐIỂM SÁNG TRÊN TRANG PHỤC", "NHỎ GỌN NHƯNG KHÓ QUÊN"],
        "food": ["MỞ GÓI, GIÒN TAN", "VỊ NGON CÓ DẤU ẤN", "THƯỞNG THỨC THEO CÁCH RIÊNG", "NGON TỪ MIẾNG ĐẦU TIÊN", "HƯƠNG THƠM GỌN TRONG TAY", "MỘT GÓI NHỎ, NHIỀU NIỀM VUI"],
        "laptopstand": ["NÂNG GÓC NHÌN, GIẢM NHIỆT", "LÀM VIỆC MÁT HƠN", "GỌN BÀN, TĂNG HIỆU SUẤT", "ĐẶT ĐÚNG GÓC, LÀM ĐÚNG NHỊP", "TẢN NHIỆT TỐT, TẬP TRUNG HƠN", "BÀN LÀM VIỆC GỌN HƠN"],
        "laptop": ["LÀM VIỆC GỌN HƠN", "ĐI XA VẪN AN TÂM", "BẢO VỆ THIẾT BỊ, GIỮ NHỊP CÔNG VIỆC", "SẴN SÀNG CHO NGÀY BẬN RỘN", "MANG CẢ GÓC LÀM VIỆC ĐI XA", "BỀN BỈ TRONG MỌI LỊCH TRÌNH"],
        "apparel": ["MẶC ĐÚNG GU", "MỀM MẠI THEO TỪNG CHUYỂN ĐỘNG", "DỄ PHỐI, KHÓ NHẦM", "CHẤT LIỆU LÊN TIẾNG", "MỘT LỚP VẢI, MỘT DẤU ẤN", "THOẢI MÁI MÀ VẪN CÓ GU"],
        "bag": ["GỌN NGƯỜI, GỌN ĐỒ", "MANG THEO ĐIỀU QUAN TRỌNG", "MỘT CHIẾC TÚI, NHIỀU NHỊP SỐNG", "ĐI ĐÂU CŨNG HỢP", "NGĂN GỌN CHO NGÀY BẬN", "TÚI NHỎ, KHÔNG GIAN LỚN"],
        "home": ["MỖI GÓC NHÀ, MỘT LÝ DO", "GỌN NHÀ, NHẸ NGÀY", "ĐẸP TỪ CÁCH SẮP XẾP", "THÊM TIỆN NGHI CHO NHÀ", "SẮP XẾP LẠI NHỊP SỐNG", "MỘT CHI TIẾT ĐỔI CẢ KHÔNG GIAN"],
    }
    if any(token in name for token in ("ốp lưng", "case")):
        key = "case"
    elif any(token in name for token in ("laptopstativ", "giá đỡ laptop", "laptop stand", "stativ")):
        key = "laptopstand"
    elif any(token in name for token in ("giày", "sneaker", "bốt", "dép", "shoe", "scarpe", "stringate", "brogue", "brouge")):
        key = "shoe"
    elif any(token in name for token in ("bông tai", "dây chuyền", "lắc tay", "bạc sterling", "kim cương")):
        key = "jewelry"
    elif any(token in name for token in ("hạt", "cà phê", "coffee", "dressing", "snack", "thức ăn", "mèo", "pet", "cat")):
        key = "food"
    elif any(token in name for token in ("xà phòng", "soap", "dish")):
        key = "home"
    elif "laptop" in name or "balo" in name or "vali" in name:
        key = "laptop"
    elif any(token in name for token in ("mũ", "áo", "vải")):
        key = "apparel"
    elif any(token in name for token in ("túi", "tote", "bag")):
        key = "bag"
    elif str(product.get("category", "")).lower() == "đồ gia dụng":
        key = "home"
    else:
        key = "home"
    return options[key][index % len(options[key])]


def caption_for(product: dict, index: int) -> str:
    name = str(product.get("name", "")).lower()
    captions = [
        "Thiết kế đúng công dụng, dùng là thấy khác.",
        "Chọn chất liệu phù hợp cho nhịp sống của bạn.",
        "Một điểm nhấn riêng cho mỗi ngày sử dụng.",
        "Tối ưu trải nghiệm từ chi tiết nhỏ nhất.",
        "Nhìn gọn hơn, dùng thuận tay hơn.",
        "Được chọn để hợp với cách bạn sử dụng.",
        "Từ cấu trúc đến bề mặt, mọi thứ đều có lý do.",
        "Một lựa chọn nhỏ, khác biệt lớn trong ngày.",
    ]
    if any(token in name for token in ("laptopstativ", "giá đỡ laptop", "laptop stand", "stativ")):
        return "Nâng máy đúng góc, tản nhiệt chủ động."
    if any(token in name for token in ("ốp lưng", "case")):
        return "Bề mặt nổi bật, bảo vệ thiết bị mỗi ngày."
    if any(token in name for token in ("giày", "sneaker", "bốt", "dép", "shoe", "scarpe", "stringate", "brogue", "brouge")):
        return "Dáng dễ phối, bước đi thêm tự tin."
    if any(token in name for token in ("hạt", "cà phê", "coffee", "dressing", "snack")):
        return "Mở ra là thấy hương vị riêng."
    if any(token in name for token in ("thức ăn", "mèo", "pet", "cat")):
        return "Hạt vừa miệng cho bữa ăn của mèo."
    if any(token in name for token in ("bông tai", "dây chuyền", "lắc tay", "bạc sterling", "kim cương")):
        return "Bề mặt tinh xảo, ánh sáng thanh lịch."
    if any(token in name for token in ("màng ép", "laminating")):
        return "Ép gọn tài liệu, giữ bề mặt sạch và bền."
    if any(token in name for token in ("sổ tay", "notebook", "wirebound")):
        return "Ghi nhanh ý tưởng, giữ lại điều quan trọng."
    if any(token in name for token in ("chăn", "mền", "blanket")):
        return "Mềm mắt, dễ trải, hợp với góc nghỉ ngơi."
    if any(token in name for token in ("bình", "bottle")):
        return "Mang theo đủ nước cho một ngày năng động."
    if any(token in name for token in ("mũ", "hat", "cap")):
        return "Giữ ấm vừa đủ, hoàn thiện bộ đồ."
    if any(token in name for token in ("xà phòng", "soap", "dish")):
        return "Để bánh xà phòng khô ráo, sạch gọn."
    if any(token in name for token in ("túi", "tote", "bag")):
        return "Ngăn chứa hợp lý cho những món cần mang theo."
    return captions[index % len(captions)]


def make_prompt(index: int, product: dict, style: str) -> str:
    name = display_name(product.get("name"))
    category = display_name(product.get("category"), "Sản phẩm")
    style_text = STYLE_BY_KEY[style]
    copy = product["copy"]
    function_text = function_for(product)
    return f"""Use case: ads-marketing
Asset type: premium e-commerce product advertising scene, sequential image {index} of 500
Input image role: the supplied local image is a reference for the exact product object. Preserve its real product type, dimensions, construction, material and distinctive details.
Primary request: Create a complete finished advertising banner for "{name}" in category "{category}". Preserve the exact product function and product form from the reference. ImageGen must render the Vietnamese copy below directly in the image.
Visual direction: {style_text[0]}, product-specific composition, varied subject placement, realistic commercial lighting and material detail.
Product accuracy: keep the hero object exactly functional and plausible; do not turn a stand into luggage, a case into a phone, a shoe into a generic object, or a household item into a decorative prop. Include only a restrained category-appropriate background.
Function accuracy: {function_text}
Composition: use a distinct layout for this index and place each text block according to the scene; avoid a fixed centered product-card template.
TEXT TO RENDER EXACTLY, preserving every Vietnamese diacritic and punctuation:
1. Headline: "{copy['headline']}"
2. Product label: "{copy['product']}"
3. Product caption: "{copy['caption']}"
4. Feature line: "{copy['feature']}"
5. Price: "{copy['price']}"
6. CTA button: "{copy['cta']}"
Do not translate, shorten, invent, or replace any character in these five lines. Do not add any other readable text, logo, watermark, or brand name.
Constraints: no unrelated objects, no duplicate hero, no distorted geometry, no invented product functions, no people unless strictly needed for scale."""


def main() -> int:
    path = WORK / "restart-items.json"
    data = load(path)
    for item in data["items"]:
        index = int(item["index"])
        style = STYLES[(index - 1) % len(STYLES)][0]
        headline = STYLE_BY_KEY[style][1]
        cta = STYLE_BY_KEY[style][2]
        item["copy"] = {
            "headline": headline_for(item, index),
            "product": product_title(item),
            "category": display_name(item.get("category", "Sản phẩm"), "Sản phẩm"),
            "caption": caption_for(item, index),
            "feature": infer_feature(item),
            "price": f"{int(item.get('price', 0)):,}".replace(",", ".") + "đ",
            "cta": cta,
        }
        item["styleKey"] = style
        item["prompt"] = make_prompt(index, item, style)
    data["copyPolicy"] = "ImageGen must render the five exact Vietnamese copy lines directly in the image."
    dump(path, data)
    print(json.dumps({"ok": True, "items": len(data["items"]), "copyPrepared": len(data["items"]), "updatedAt": datetime.now(timezone.utc).isoformat()}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
