# GROK BUILD PROMPT — Gnoland Ecosystem Tracker

Dán TOÀN BỘ file này vào Grok (hoặc Cursor / Claude) rồi nói:
**"Build đúng spec này. Trả về đúng 1 file HTML hoàn chỉnh, không TODO."**

Bạn là senior frontend engineer. Hãy **code hoàn thiện** một trang tracker hệ sinh thái Gno.land.

## Output bắt buộc

- **Đúng 1 file**: `gnoland-ecosystem-tracker.html` (standalone, không framework, không npm, không build step).
- Mở file bằng trình duyệt là chạy được. Không phụ thuộc server.
- CSS + JS nhúng trong cùng file.
- Font: dùng Google Fonts `IBM Plex Sans` + `IBM Plex Mono` (fallback system-ui).
- Không bịa TVL, giá token, volume, market cap.
- UI tiếng Việt. Dữ liệu tên dự án / URL giữ nguyên tiếng Anh.
- Code sạch, indent 2 spaces, không minify.

---

## Tham chiếu giao diện (bắt buộc bám sát)

Mẫu: https://arc-chain-launchpad-tier-list-f318a3.surf.computer/

Sao chép **cấu trúc board**, không sao chép nội dung Arc:

1. Nền đen gần như full-bleed.
2. Header giữa trang: eyebrow nhỏ có chấm xanh live + mô tả chain, **title lớn**, subtitle 1 dòng, bên phải ngày cập nhật.
3. Board chính là một card lớn bo góc:
   - Cột trái mỗi hàng là **ô tier màu** (S hồng, A cam, B mint, C xám) viết chữ cái rất lớn.
   - Bên phải là lưới logo tròn: mỗi dự án = avatar tròn + tên + dòng phụ (category hoặc status + score).
4. Hàng xếp dọc: S → A → B → C.
5. Click 1 card → **drawer/panel bên phải** hiện chi tiết (giống tab Details của mẫu).
6. Thanh công cụ trên board: Search + chip filter.
7. Footer nhỏ: nguồn + DYOR + “sửa mảng PROJECTS để cập nhật”.
8. Responsive: desktop giữ hàng ngang; mobile ô tier hẹp lại, card wrap 3–4 cột.

Đây **không** phải bảng xếp hạng meme/launchpad. Tier = độ chín sản phẩm (shipping maturity).

---

## Theme / token màu

```css
--bg: #070808;
--panel: #101214;
--panel-2: #16191d;
--line: #252a31;
--text: #e8edf2;
--muted: #8b96a3;
--accent: #3ee08f;      /* Gno green */
--s: #ff4d8d;           /* tier S */
--a: #f5b942;           /* tier A */
--b: #3ee0c2;           /* tier B */
--c: #8b93a3;           /* tier C */
```

Logo dự án: hình tròn, chữ cái viết tắt (initials) màu accent trên nền tối. Không cần tải logo ngoài (tránh broken image). Nếu sau này thêm field `logo` thì dùng khi URL hợp lệ, fallback initials.

---

## Tính năng phải có

1. **Stats row**: Tổng dự án · Live · Beta/Alpha/Dev · Số đang hiện (theo filter).
2. **Search**: lọc theo name, team, category, status, realm, notes.
3. **Chip filter category**: All + Infra, Wallet, Explorer, DeFi, Social, Game, DevTool, Governance, Community.
4. **Board 4 hàng S/A/B/C**. Trong cùng hàng sort `score` giảm dần.
5. **Click card → drawer** với: tên, oneLiner, badge status, category, team, website, github, x, realm, lastUpdated, notes. Nút Đóng + click overlay để đóng. Esc đóng.
6. **Empty state** khi filter không ra dự án.
7. **META.updated** hiện ở header.
8. Comment rõ trong JS: `/* ==== SỬA DỮ LIỆU Ở ĐÂY ==== */` ngay trên `const META` và `const PROJECTS`.
9. Favicon không bắt buộc. Title tab: `Gnoland Ecosystem Tracker`.
10. Phím `/` focus ô search. Phím `Esc` đóng drawer.
11. Link website / github / x / realm: ẩn hàng nếu rỗng, không hiện `undefined`.
12. `lastUpdated` trong drawer format `DD/MM/YYYY`.
13. Mỗi hàng tier hiện số lượng card đang visible, ví dụ `S · 6`.
14. Nút **Sao chép realm** trong drawer nếu `realm` không rỗng; sau khi copy đổi text thành `Đã sao chép` 1.5s.

Không cần backend. Không cần dark/light toggle. localStorage nhớ search là optional.

---

## Mapping tier

| tier | Ý nghĩa | status điển hình |
|------|---------|------------------|
| S | Live production, hạ tầng hoặc app flagship đang dùng được | Live |
| A | Live / usable, chưa phải trụ cột | Live |
| B | Alpha hoặc đang phát triển | Alpha, Dev, Experimental |
| C | Công bố / thí nghiệm / frontend có thể chết | Announced, Experimental |

Status hợp lệ: `Live | Beta | Alpha | Dev | Experimental | Announced | Pending GPAO`

`Pending GPAO` = package đã submit sau genesis, bị park đến khi package-approvals oracle duyệt. Không được ghi Live chỉ vì đã `addpkg`.

Score 0–100 chỉ để sort trong hàng, không phải điểm đầu tư.

---

## Copy UI tiếng Việt

- Title: `Gnoland Ecosystem Tracker`
- Eyebrow: `Gno.land mainnet · gnoland-1 · live 12 Sep 2026`
- Subtitle: `Bảng theo dõi dự án đang phát triển trên Gno.land. Xếp theo mức độ ship sản phẩm, không phải volume hay meme rank.`
- Stats: `Tổng dự án` / `Live` / `Beta · Alpha · Dev` / `Đang hiện`
- Search placeholder: `Tìm dự án, team, realm, X...`
- Tier caption dưới chữ S/A/B/C: `Live` / `Usable` / `Building` / `Early`
- Drawer nút: `Đóng`
- Legend: `S = Live production · A = Live/Beta dùng được · B = Đang phát triển / Alpha · C = Thí nghiệm / sớm`
- Footer: `Không phải lời khuyên đầu tư · DYOR`
- Empty: `Không có dự án khớp bộ lọc.`

---

## Schema mỗi project (bắt buộc đủ field)

```ts
type Project = {
  id: string;            // slug unique, không dấu
  name: string;
  tier: "S" | "A" | "B" | "C";
  status: "Live" | "Beta" | "Alpha" | "Dev" | "Experimental" | "Announced" | "Pending GPAO";
  category: "Infra" | "Wallet" | "Explorer" | "DeFi" | "Social" | "Game" | "DevTool" | "Governance" | "Community";
  score: number;         // 0-100
  oneLiner: string;
  team: string;
  website: string;       // "" nếu chưa có
  github: string;
  x: string;
  realm: string;
  lastUpdated: string;   // YYYY-MM-DD
  notes: string;
};
```

Link website/github/x trong drawer phải `target="_blank" rel="noreferrer"`. Field rỗng hiện `—`.

---

## Dữ liệu — paste nguyên vào file

```js
const META = {
  updated: "2026-09-25",
  chain: "gnoland-1",
  rpc: "https://rpc.gno.land:443",
  mainnet: "2026-09-12"
};

const PROJECTS = [
  {
    id: "gnoweb",
    name: "Gnoweb",
    tier: "S",
    status: "Live",
    category: "Infra",
    score: 95,
    oneLiner: "Giao diện web chính thức để duyệt realm, package và mã nguồn on-chain.",
    team: "Gno.land core",
    website: "https://gno.land",
    github: "https://github.com/gnolang/gno",
    x: "https://x.com/_gnoland",
    realm: "/",
    lastUpdated: "2026-09-12",
    notes: "Mainnet phục vụ tại gno.land từ 12 Sep 2026. Cổng mặc định để khám phá chain."
  },
  {
    id: "gnoscan",
    name: "Gnoscan",
    tier: "S",
    status: "Live",
    category: "Explorer",
    score: 93,
    oneLiner: "Explorer chính của Gno.land: block, tx, ví, realm.",
    team: "Onbloc",
    website: "https://gnoscan.io",
    github: "https://github.com/onbloc/gnoscan",
    x: "https://x.com/onblocxyz",
    realm: "",
    lastUpdated: "2026-09-16",
    notes: "Hạ tầng dùng nhiều nhất cùng Adena. Hỗ trợ mainnet và staging."
  },
  {
    id: "adena",
    name: "Adena",
    tier: "S",
    status: "Live",
    category: "Wallet",
    score: 92,
    oneLiner: "Ví non-custodial mã nguồn mở cho Gno.land, UX tốt, kết nối dApp.",
    team: "Onbloc",
    website: "https://adena.app",
    github: "https://github.com/onbloc/adena-wallet",
    x: "https://x.com/onblocxyz",
    realm: "",
    lastUpdated: "2026-09-23",
    notes: "Chrome extension. Ví mặc định của hệ sinh thái hiện tại."
  },
  {
    id: "gnoswap",
    name: "GnoSwap",
    tier: "S",
    status: "Live",
    category: "DeFi",
    score: 90,
    oneLiner: "DEX AMM concentrated liquidity đầu tiên trên Gno.land, viết bằng Gno.",
    team: "GnoSwap Labs / Onbloc",
    website: "https://gnoswap.io",
    github: "https://github.com/gnoswap-labs/gnoswap",
    x: "https://x.com/gnoswaplabs",
    realm: "gno.land/r/gnoswap",
    lastUpdated: "2026-09-16",
    notes: "Announce live mainnet 16 Sep 2026 tại gnoswap.io / beta.gnoswap.io. Audit OpenZeppelin 2 lần. Token $GNS. UI vẫn có cảm giác beta. Docs: https://docs.gnoswap.io"
  },
  {
    id: "playground",
    name: "Gno Playground",
    tier: "S",
    status: "Live",
    category: "DevTool",
    score: 88,
    oneLiner: "IDE trên trình duyệt: viết, test, deploy Gno không cần setup máy.",
    team: "Gno.land core",
    website: "https://play.gno.land",
    github: "https://github.com/gnolang/gno",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-12",
    notes: "Công cụ onboarding dev quan trọng nhất sau docs.gno.land."
  },
  {
    id: "gnodev",
    name: "gnodev",
    tier: "S",
    status: "Live",
    category: "DevTool",
    score: 86,
    oneLiner: "Môi trường dev local kèm hot-reload cho realm và package.",
    team: "Gno.land core",
    website: "https://docs.gno.land",
    github: "https://github.com/gnolang/gno",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-12",
    notes: "Dùng khi build app thật. Không nhầm với binary node gnoland."
  },
  {
    id: "gnoverse",
    name: "Gnoverse",
    tier: "A",
    status: "Live",
    category: "Community",
    score: 84,
    oneLiner: "Tổ chức GitHub cộng đồng: tooling, app, awesome-gno.",
    team: "Community",
    website: "https://github.com/gnoverse",
    github: "https://github.com/gnoverse/awesome-gno",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-23",
    notes: "Cổng chính để phát hiện dự án mới. Watch repo awesome-gno."
  },
  {
    id: "boards",
    name: "Boards",
    tier: "A",
    status: "Live",
    category: "Social",
    score: 82,
    oneLiner: "Diễn đàn on-chain native, ứng viên social flagship của mạng.",
    team: "Gno.land core",
    website: "https://gno.land/r/gnoland/boards2/v0",
    github: "https://github.com/gnolang/gno",
    x: "https://x.com/_gnoland",
    realm: "gno.land/r/gnoland/boards2/v0",
    lastUpdated: "2026-09-12",
    notes: "Nằm trong genesis packages. Không moderation tập trung."
  },
  {
    id: "govdao",
    name: "GovDAO",
    tier: "A",
    status: "Live",
    category: "Governance",
    score: 81,
    oneLiner: "Hệ governance theo tầng, tách quyền quyết định khỏi vốn đầu tư.",
    team: "Gno.land core",
    website: "https://gno.land",
    github: "https://github.com/gnolang/gno",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-16",
    notes: "Mainnet khởi động với T1 hạn chế; thành viên còn lại vào bằng proposal."
  },
  {
    id: "gnokey",
    name: "gnokey",
    tier: "A",
    status: "Live",
    category: "Wallet",
    score: 80,
    oneLiner: "CLI quản lý key và ký giao dịch chính thức.",
    team: "Gno.land core",
    website: "https://docs.gno.land",
    github: "https://github.com/gnolang/gno",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-12",
    notes: "Adena phủ UX; gnokey phủ automation, validator, script."
  },
  {
    id: "gnolove",
    name: "Gnolove",
    tier: "A",
    status: "Live",
    category: "Community",
    score: 78,
    oneLiner: "Bảng xếp hạng đóng góp và analytics cho builder Gnoland.",
    team: "Community",
    website: "https://gnolove.world",
    github: "",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Hữu ích để theo dõi ai đang ship code."
  },
  {
    id: "zenao",
    name: "Zenao",
    tier: "A",
    status: "Live",
    category: "Social",
    score: 76,
    oneLiner: "Tổ chức sự kiện rồi xây cộng đồng / social org.",
    team: "Community",
    website: "https://zenao.io",
    github: "",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Listed trên awesome-gno."
  },
  {
    id: "connect",
    name: "Gno Studio Connect",
    tier: "A",
    status: "Live",
    category: "DevTool",
    score: 74,
    oneLiner: "Gọi trực tiếp hàm realm từ web, khám phá contract không cần CLI.",
    team: "Gno.land",
    website: "https://gno.studio/connect",
    github: "",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Một số bản cũ chỉ trỏ testnet đã nghỉ. Kiểm tra network selector trước khi dùng mainnet."
  },
  {
    id: "status",
    name: "Status",
    tier: "A",
    status: "Live",
    category: "Infra",
    score: 72,
    oneLiner: "Dashboard trạng thái dịch vụ và mạng Gno.land.",
    team: "Gno.land core",
    website: "https://status.gnoteam.com",
    github: "",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-16",
    notes: "Announcement mainnet cũng nêu status.gno.land. Dùng khi nghi RPC / gnoweb / indexer down."
  },
  {
    id: "faucet",
    name: "Faucet Hub",
    tier: "A",
    status: "Live",
    category: "Infra",
    score: 70,
    oneLiner: "Faucet tập trung cho các mạng testnet Gno.land.",
    team: "Gno.land core",
    website: "https://faucet.gno.land",
    github: "https://github.com/gnolang/faucet-hub",
    x: "https://x.com/_gnoland",
    realm: "",
    lastUpdated: "2026-09-12",
    notes: "Mainnet không có faucet. Chỉ dùng cho testnet."
  },
  {
    id: "akkadia",
    name: "Akkadia",
    tier: "B",
    status: "Alpha",
    category: "Game",
    score: 68,
    oneLiner: "Game world-building on-chain lấy cảm hứng Thư viện Alexandria.",
    team: "Akkadia",
    website: "https://app.alpha.akkadia.land",
    github: "",
    x: "https://x.com/_akkadia",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Một trong những app sáng tạo on-chain sớm. Docs: https://docs.akkadia.land"
  },
  {
    id: "kourt",
    name: "Kourt",
    tier: "B",
    status: "Experimental",
    category: "DeFi",
    score: 62,
    oneLiner: "Tòa án fact-staking: cược coin của court; stake hoàn 1x, chỉ độ chính xác được trả.",
    team: "Community",
    website: "https://kourt.xyz",
    github: "https://github.com/jaekwon/kourt",
    x: "",
    realm: "gno.land/r/g1ecsuj0q572jr0dhu29q9njtnmw03hyu7tyyvv6/kourt",
    lastUpdated: "2026-09-17",
    notes: "Realm đã có trên mainnet. Xác minh lại path nếu layout đổi."
  },
  {
    id: "commondao",
    name: "CommonDAO",
    tier: "B",
    status: "Dev",
    category: "Governance",
    score: 60,
    oneLiner: "Framework DAO phân tầng parent/subDAO cho app Gno.land.",
    team: "Community",
    website: "https://newtendermint.org/",
    github: "",
    x: "",
    realm: "p/nt/commondao",
    lastUpdated: "2026-09-17",
    notes: "Hạ tầng governance cho builder, chưa phải app end-user."
  },
  {
    id: "gnochess",
    name: "GnoChess",
    tier: "B",
    status: "Dev",
    category: "Game",
    score: 58,
    oneLiner: "Server cờ vua bằng Gno, có frontend, faucet và tutorial.",
    team: "Gnoverse",
    website: "",
    github: "https://github.com/gnoverse/gnochess",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Dự án giáo dục / demo composability."
  },
  {
    id: "gnonative",
    name: "Gno Native Kit",
    tier: "B",
    status: "Dev",
    category: "DevTool",
    score: 57,
    oneLiner: "Framework port dApp Gno sang native, có React Native / Expo.",
    team: "Gno.land",
    website: "https://github.com/gnolang/gnonative",
    github: "https://github.com/gnolang/gnonative",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Hạ tầng mobile, chưa phải app người dùng cuối."
  },
  {
    id: "openocean",
    name: "OpenOcean",
    tier: "B",
    status: "Dev",
    category: "DeFi",
    score: 55,
    oneLiner: "Clone OpenSea viết bằng Gno.",
    team: "Community",
    website: "",
    github: "https://github.com/Molaryy/openocean",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Marketplace NFT sớm. Tình trạng frontend/mainnet cần xác minh lại."
  },
  {
    id: "gnomputer",
    name: "Gnomputer",
    tier: "B",
    status: "Dev",
    category: "DevTool",
    score: 54,
    oneLiner: "Workstation cửa sổ để duyệt realm, source và hoạt động chain.",
    team: "moul",
    website: "",
    github: "https://github.com/moul/gnomputer",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Listed awesome-gno / gnoverse."
  },
  {
    id: "dsocial",
    name: "dSocial",
    tier: "C",
    status: "Experimental",
    category: "Social",
    score: 42,
    oneLiner: "Nhóm app/tool social thí nghiệm trên Gno.",
    team: "Gnoverse",
    website: "",
    github: "https://github.com/gnoverse/dsocial",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "Early / experimental."
  },
  {
    id: "memeland",
    name: "meme.land",
    tier: "C",
    status: "Announced",
    category: "Social",
    score: 35,
    oneLiner: "Ứng dụng chia sẻ ảnh bằng Gno + React/Vue.",
    team: "Gnoverse",
    website: "",
    github: "https://github.com/gnoverse/memeland",
    x: "",
    realm: "",
    lastUpdated: "2026-09-17",
    notes: "awesome-gno đánh dấu frontend hosted không còn reach chain. Giữ C đến khi sống lại."
  }
];
```

Không thêm dự án ngoài list trên. Không bịa URL. Field trống để `""`.

---

## Footer nguồn (link thật)

- https://gno.land/
- https://gno.land/ecosystem
- https://github.com/gnoverse/awesome-gno
- https://newtendermint.org/
- https://docs.gno.land/
- https://x.com/_gnoland

Thêm 1 dòng hướng dẫn: `Cập nhật: mở file → tìm const PROJECTS → thêm hoặc sửa object → lưu → refresh.`

---

## Chất lượng code

- HTML semantic: `header`, `main`, `aside`, `footer`.
- JS thuần ES2020, không jQuery.
- Không inline event trong HTML trừ chỗ thật sự gọn; ưu tiên `addEventListener`.
- Tránh layout shift; board min-height ổn định.
- Focus state cho search và chip.
- Drawer accessible: overlay, nút Đóng, phím Esc.
- Không console.log rác.
- Comment ngắn, tiếng Việt, chỉ ở block dữ liệu.

---

## Acceptance checklist (tự kiểm trước khi trả file)

- [ ] Mở `index.html` trực tiếp trong Chrome/Firefox không lỗi console.
- [ ] Thấy đủ 4 hàng S/A/B/C và khoảng 24 card.
- [ ] GnoSwap nằm hàng S, status Live, website gnoswap.io.
- [ ] Gõ "onbloc" ra Adena + Gnoscan + GnoSwap.
- [ ] Chip `Game` chỉ còn Akkadia + GnoChess.
- [ ] Click Adena mở drawer, link adena.app hoạt động.
- [ ] Esc hoặc overlay đóng drawer.
- [ ] Thêm 1 object mẫu vào PROJECTS thì card mới xuất hiện không phải sửa HTML khác.
- [ ] Mobile < 720px không vỡ hàng, vẫn đọc được.
- [ ] Không hiện số TVL / giá / volume bịa.

---

## Cách trả lời

Chỉ output **toàn bộ nội dung file `gnoland-ecosystem-tracker.html`** trong một fence markdown:

```html
<!DOCTYPE html>
...
```

Không giải thích dài. Không tách CSS/JS ra file khác. Không TODO. Không placeholder. Bắt đầu code ngay.
