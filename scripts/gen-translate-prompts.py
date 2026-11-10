#!/usr/bin/env python3
"""docs/translate-prompt-*.md 를 찍어낸다.

용어집은 **각 언어로** 적는다. 대역의 출처는 두 가지뿐이다.
  1. messages/<lang>.json — 사람이 번역한 화면 문구. 이게 1순위다
  2. 그 언어 K-POP 팬덤의 관용 표기

둘 다 확실하지 않은 칸은 `native (english)` 꼴로 영어를 괄호에 남겨 둔다 —
프롬프트가 「확신이 없으면 영어를 그대로 둔다」로 받게 하기 위해서다.
"""
import pathlib

DOCS = pathlib.Path("docs")

# 멤버 이름은 **그 나라 공식 · 팬덤 표기**를 쓴다. 브랜드 이름(규칙 8)과 다른 반이다 —
# 브랜드는 「검색해서 찾을 글자」라 라틴 한 벌이고, 멤버 이름은 그 언어로 읽히는 글자다.
#
#   ja  가타카나. ja.wikipedia 의 공식 표기 (일본 매체는 `RENJUN（ロンジュン）` 꼴로 쓴다)
#   zh  중국어 이름. 런쥔 · 천러는 본명이고, 한국 멤버는 중국 팬덤의 한자 표기다
#   en · id · th  라틴 (SM 이 쓰는 활동명 표기)
MEMBER_NOTE = "※ 앨범 버전 이름처럼 **상품에 라틴으로 박혀 있는 것**(`JENO Ver.`)은 그대로 둔다"

MEMBERS_LATIN = ["런쥔 → Renjun", "제노 → Jeno", "해찬 → Haechan",
                 "재민 → Jaemin", "천러 → Chenle", "지성 → Jisung"]
MEMBERS_JA = ["런쥔 → ロンジュン", "제노 → ジェノ", "해찬 → ヘチャン",
              "재민 → ジェミン", "천러 → チョンロ", "지성 → チソン"]
# zh 는 **예명의 한자 표기**다. 중국 매체 · 팬덤이 달고 쓰는 꼴이 성 없는 두 글자다
# (「仁俊、帝努、楷灿、渽民、辰乐、志晟」). 성은 원문이 성까지 적었을 때만 붙인다.
#
# 여섯 중 다섯은 **예명이 곧 본명**이라 본명 한자와 같다. 해찬만 다르다 —
# 본명은 이동혁(李东赫)이고 해찬은 예명이라, 한자로는 楷灿(성을 붙이면 李楷灿)이다.
# 그래서 규칙을 「본명 한자」로 적으면 해찬 한 명이 틀린다.
MEMBERS_ZH = ["런쥔 → 仁俊", "제노 → 帝努", "해찬 → 楷灿",
              "재민 → 渽民", "천러 → 辰乐", "지성 → 志晟"]
MEMBERS_ZH_FULL = ("※ 원문이 성까지 적었으면(「황런쥔」) 성을 붙인다 — "
                   "黄仁俊 · 李帝努 · 李楷灿 · 罗渽民 · 钟辰乐 · 朴志晟\n"
                   "※ 원문이 **본명**을 적었으면(「이동혁」) 본명 한자를 쓴다 — 李东赫. "
                   "해찬(楷灿)과 같은 사람이지만 글자가 다르다")

CHONG_EN = {"stream": "mass streaming", "vote": "mass voting",
            "tag": "hashtag campaign", "do": "「총공 참여하세요」 → Stream with us at 5PM KST",
            "extra": None}

def chonggong(c):
    out = [
        "- 총공 → **무엇을 하는 총공인지로 적는다**",
        f"    - 스밍 총공 → {c['stream']}",
        f"    - 투표 총공 → {c['vote']}",
        f"    - 해시태그 총공 → {c['tag']}",
        "    - 대상이 안 적혀 있으면 → **Total Attack** (언어와 무관하게 이 영문 그대로)",
        "        - 스밍인지 투표인지 **원문에 없을 때만.** 적혀 있으면 위의 셋 중에서 쓴다",
        "        - 제목 · 배너 이름에만 쓴다. **대문자로** 적어야 이름으로 읽힌다",
        "    - ※ chonggong · total attack(소문자) · organized fan push 금지",
    ]
    if c.get("extra"):
        out.append("    - ※ " + c["extra"])
    out += ["    - ※ 「총공 참여」처럼 **하라는 말**이면 할 일을 적는다",
            "        - " + c["do"]]
    return "\n".join(out)

LANGS = [
 dict(code="en", members=MEMBERS_LATIN, member_head="멤버 이름 — 이 라틴 표기를 쓴다 (SM 이 쓰는 활동명 표기다)", name="영어", suffix="EN", word="영어", style="영어",
  chong=dict(CHONG_EN, extra="시각이 박힌 한 번짜리는 streaming party 도 좋다 — 「17시 총공」"),
  gloss=["스밍 → streaming (팬이 조직적으로 하는 음원 스트리밍)",
         "스밍리스트 → streaming playlist", None,
         "공구 / 공동구매 → group order  ※ tool 이 아니다",
         "공구주 → group order host",
         "특전 → inclusions  ※ special benefit 금지",
         "이용권 → subscription pass", "음방 → music show",
         "음원 → audio  ※ sound source 금지", "선공개 → pre-release",
         "컴백 → comeback", "예약판매 / 예판 → pre-order", "헬퍼 → helper",
         "원클릭 → one-click", "아이디 생성 → creating an account",
         "사연 → radio message", "편성표 → schedule", "시상식 → awards show",
         "데뷔일 → debut anniversary", "써클차트 → Circle Chart",
         "바로가기 → shortcuts", "폼 → form"],
  gloss_note=None,
  tail="자연스러운 구어체 영어로. 팬덤이 실제로 쓰는 말을 고른다.",
  num="「12종 중 랜덤 2종」 → 「2 random out of 12 types」",
  words=["초회 한정 → first press", "포토카드 → photocard", "랜덤 → random",
         "~종 → types (12종 = 12 types)", "세트 구매 → set purchase",
         "전 버전 공통 → all versions", "미니 포스터 → mini poster",
         "접지 포스터 → folded poster", "엽서 → postcard", "스티커 → sticker",
         "북마크 → bookmark", "증정 → included", "선착순 → while supplies last",
         "예약판매 / 예판 → pre-order", "공구 / 공동구매 → group order"],
  b_out=["    • 2 random first-press photocards out of 12 types",
         "    • 4 random first-press photocards out of 12 types with a set purchase"],
  b_tail="자연스러운 구어체 영어로."),

 dict(code="ja", members=MEMBERS_JA, member_head="멤버 이름 — 일본 공식 표기(가타카나)를 쓴다", name="일본어", suffix="JA", word="일본어", style="일본어",
  chong=dict(stream="一斉ストリーミング", vote="一斉投票",
             tag="ハッシュタグ一斉投稿 (hashtag campaign)",
             extra=None,
             do="「총공 참여하세요」 → 「17時にみんなでストリーミング」처럼 **할 일을 일본어로** 적는다"),
  gloss=["스밍 → ストリーミング", "스밍리스트 → ストリーミングリスト", None,
         "공구 / 공동구매 → 共同購入", "공구주 → 共同購入の主催者 (group order host)",
         "특전 → 特典", "이용권 → サブスク (定額プラン)", "음방 → 音楽番組",
         "음원 → 音源", "선공개 → 先行公開", "컴백 → カムバック",
         "예약판매 / 예판 → 予約販売", "헬퍼 → ヘルパー", "원클릭 → ワンクリック",
         "아이디 생성 → アカウント作成", "사연 → (ラジオへの)メッセージ",
         "편성표 → 番組表", "시상식 → 授賞式", "데뷔일 → デビュー記念日",
         "써클차트 → Circle Chart (영문 그대로)", "바로가기 → ショートカット",
         "폼 → フォーム"],
  gloss_note="※ 괄호에 영어가 붙은 칸은 **확신이 없으면 영어를 그대로 둔다.**",
  tail="日本語 로. K-POP 팬덤의 일본어 관용 표기를 따른다.",
  num="「12종 중 랜덤 2종」 → 「12種の中からランダム2種」",
  words=["초회 한정 → 初回限定", "포토카드 → フォトカード", "랜덤 → ランダム",
         "~종 → ~種 (12종 = 12種)", "세트 구매 → セット購入",
         "전 버전 공통 → 全バージョン共通", "미니 포스터 → ミニポスター",
         "접지 포스터 → 折りポスター", "엽서 → ポストカード", "스티커 → ステッカー",
         "북마크 → しおり (bookmark)", "증정 → 同封 · 特典として付く",
         "선착순 → 先着順", "예약판매 / 예판 → 予約販売", "공구 / 공동구매 → 共同購入"],
  b_out=["    • 初回限定フォトカード12種の中からランダム2種",
         "    • セット購入時、初回限定フォトカード12種の中からランダム4種"],
  b_tail="日本語 로. K-POP 팬덤의 일본어 관용 표기를 따른다."),

 dict(code="zh", members=MEMBERS_ZH, member_extra=MEMBERS_ZH_FULL, member_head="멤버 이름 — 예명의 한자 표기를 쓴다 (성은 붙이지 않는다)", name="중국어(간체)", suffix="ZH", word="중국어(간체)", style="중국어",
  chong=dict(stream="集中打榜", vote="集中投票", tag="冲热搜 (hashtag campaign)",
             extra=None,
             do="「총공 참여하세요」 → 「17点一起打榜」처럼 **할 일을 중국어로** 적는다"),
  gloss=["스밍 → 打榜", "스밍리스트 → 打榜歌单", None,
         "공구 / 공동구매 → 团购", "공구주 → 团长 (group order host)",
         "특전 → 特典", "이용권 → 会员套餐", "음방 → 音乐节目", "음원 → 音源",
         "선공개 → 先行公开", "컴백 → 回归", "예약판매 / 예판 → 预售",
         "헬퍼 → 志愿者", "원클릭 → 一键", "아이디 생성 → 注册账号",
         "사연 → 投稿", "편성표 → 节目表", "시상식 → 颁奖礼",
         "데뷔일 → 出道纪念日", "써클차트 → Circle Chart (영문 그대로)",
         "바로가기 → 快捷入口", "폼 → 表单"],
  gloss_note="※ 괄호에 영어가 붙은 칸은 **확신이 없으면 영어를 그대로 둔다.**",
  tail="简体中文 로. K-POP 팬덤의 중국어 관용 표기를 따른다.",
  num="「12종 중 랜덤 2종」 → 「12种中随机2种」",
  words=["초회 한정 → 首批限定", "포토카드 → 小卡", "랜덤 → 随机",
         "~종 → ~种 (12종 = 12种)", "세트 구매 → 套装购买",
         "전 버전 공통 → 全版本通用", "미니 포스터 → 迷你海报",
         "접지 포스터 → 折叠海报", "엽서 → 明信片", "스티커 → 贴纸",
         "북마크 → 书签", "증정 → 赠送", "선착순 → 先到先得",
         "예약판매 / 예판 → 预售", "공구 / 공동구매 → 团购"],
  b_out=["    • 首批限定小卡12种中随机2种",
         "    • 套装购买时首批限定小卡12种中随机4种"],
  b_tail="简体中文 로. K-POP 팬덤의 중국어 관용 표기를 따른다."),

 dict(code="id", members=MEMBERS_LATIN, member_head="멤버 이름 — 이 라틴 표기를 쓴다 (SM 이 쓰는 활동명 표기다)", name="인도네시아어", suffix="ID", word="인도네시아어", style="인도네시아어",
  chong=dict(stream="mass streaming", vote="mass voting", tag="hashtag campaign",
             extra="이 셋과 Total Attack 은 **영어 그대로** 둔다 — 팬덤이 영어로 쓴다",
             do="「총공 참여하세요」 → 「Streaming bareng jam 5 sore KST」처럼 **할 일을 인도네시아어로** 적는다"),
  gloss=["스밍 → streaming", "스밍리스트 → playlist streaming", None,
         "공구 / 공동구매 → group order", "공구주 → host group order",
         "특전 → benefit", "이용권 → paket langganan", "음방 → music show",
         "음원 → audio", "선공개 → pre-release", "컴백 → comeback",
         "예약판매 / 예판 → pre-order (PO)", "헬퍼 → helper",
         "원클릭 → one-click", "아이디 생성 → membuat akun",
         "사연 → pesan untuk radio", "편성표 → jadwal", "시상식 → awards show",
         "데뷔일 → anniversary debut", "써클차트 → Circle Chart",
         "바로가기 → akses cepat", "폼 → formulir"],
  gloss_note="※ 팬덤에 영어로 굳은 말은 **영어를 그대로 둔다.** 위 목록이 그렇게 돼 있다.",
  tail="Bahasa Indonesia 로. 팬덤에 이미 영어로 굳은 말은 영어를 그대로 둔다.",
  num="「12종 중 랜덤 2종」 → 「2 random dari 12 jenis」",
  words=["초회 한정 → first press", "포토카드 → photocard", "랜덤 → random",
         "~종 → jenis (12종 = 12 jenis)", "세트 구매 → pembelian set",
         "전 버전 공통 → semua versi", "미니 포스터 → mini poster",
         "접지 포스터 → poster lipat", "엽서 → postcard", "스티커 → sticker",
         "북마크 → pembatas buku (bookmark)", "증정 → termasuk",
         "선착순 → selama persediaan masih ada", "예약판매 / 예판 → pre-order (PO)",
         "공구 / 공동구매 → group order"],
  b_out=["    • 2 photocard first press random dari 12 jenis",
         "    • 4 photocard first press random dari 12 jenis untuk pembelian set"],
  b_tail="Bahasa Indonesia 로. 팬덤에 영어로 굳은 말은 영어를 그대로 둔다."),

 dict(code="th", members=MEMBERS_LATIN, member_head="멤버 이름 — 이 라틴 표기를 쓴다 (SM 이 쓰는 활동명 표기다)", name="태국어", suffix="TH", word="태국어", style="태국어",
  chong=dict(stream="mass streaming", vote="mass voting", tag="hashtag campaign",
             extra="이 셋과 Total Attack 은 **영어 그대로** 둔다 — 팬덤이 영어로 쓴다",
             do="「총공 참여하세요」 → 「สตรีมพร้อมกัน 17:00 KST」처럼 **할 일을 태국어로** 적는다"),
  gloss=["스밍 → สตรีมมิง", "스밍리스트 → เพลย์ลิสต์สตรีมมิง", None,
         "공구 / 공동구매 → group order", "공구주 → คนจัด group order",
         "특전 → ของแถม", "이용권 → แพ็กเกจสมาชิก", "음방 → รายการเพลง",
         "음원 → เพลง", "선공개 → pre-release", "컴백 → คัมแบ็ก",
         "예약판매 / 예판 → พรีออเดอร์", "헬퍼 → เฮลเปอร์",
         "원클릭 → one-click", "아이디 생성 → สมัครบัญชี",
         "사연 → ข้อความส่งเข้ารายการวิทยุ", "편성표 → ผังรายการ",
         "시상식 → งานประกาศรางวัล", "데뷔일 → วันครบรอบเดบิวต์",
         "써클차트 → Circle Chart", "바로가기 → ทางลัด", "폼 → ฟอร์ม"],
  gloss_note="※ 팬덤 용어는 **영어 차용어를 그대로** 쓴다. 위 목록이 그렇게 돼 있다.",
  tail="ภาษาไทย 로. 팬덤 용어는 영어 차용어를 그대로 쓴다.",
  num="「12종 중 랜덤 2종」 → 「สุ่ม 2 แบบ จาก 12 แบบ」",
  words=["초회 한정 → first press", "포토카드 → โฟโต้การ์ด", "랜덤 → สุ่ม",
         "~종 → แบบ (12종 = 12 แบบ)", "세트 구매 → ซื้อเป็นเซ็ต",
         "전 버전 공통 → ทุกเวอร์ชัน", "미니 포스터 → มินิโปสเตอร์",
         "접지 포스터 → โปสเตอร์พับ", "엽서 → โพสต์การ์ด", "스티커 → สติกเกอร์",
         "북마크 → ที่คั่นหนังสือ (bookmark)", "증정 → แถม",
         "선착순 → จนของหมด", "예약판매 / 예판 → พรีออเดอร์",
         "공구 / 공동구매 → group order"],
  b_out=["    • โฟโต้การ์ด first press สุ่ม 2 แบบ จาก 12 แบบ",
         "    • ซื้อเป็นเซ็ต ได้โฟโต้การ์ด first press สุ่ม 4 แบบ จาก 12 แบบ"],
  b_tail="ภาษาไทย 로. 팬덤 용어는 영어 차용어를 그대로 쓴다."),
]

BRANDS = """- **음원 플랫폼** — 실시간 차트 · 스밍리스트
    - 멜론 → Melon
    - 지니 → Genie
    - 벅스 → Bugs
    - 플로 → FLO
    - 바이브 → VIBE
    - 카카오뮤직 → KakaoMusic
    - 스포티파이 → Spotify
    - 애플뮤직 → Apple Music
        - ※ **음악을 듣는 앱**을 말할 때. 아래 판매처 애플뮤직과 다른 회사다
- **앨범 판매처** — 예약판매
    - 예스24 → YES24
    - 핫트랙스 → Hottracks
    - 알라딘 → Aladin
    - 뮤직코리아 → Music Korea
    - 메이크스타 → Makestar
    - 올엠디 → AllMD
    - 비트로드 → Beatroad
    - 에버라인 → Everline
    - 사운드웨이브 → Soundwave
    - 위드뮤 → withmuu
    - SMTOWN &STORE · Weverse Shop · Ktown4U · Berriz — 이미 영문이다
    - 애플뮤직 → AppleMusic (KR album store)
        - ※ **앨범을 파는 가게**를 말할 때만 이렇게 적는다.
          한국 음반 쇼핑몰(applemusic.co.kr)이고 애플과 무관하다
- **투표 앱** — 앱 투표 원클릭
    - 뮤빗 → Mubeat
    - 아이돌챔프 → Idol Champ
    - 쿠궁 → Coogoong
    - 엠넷플러스 → Mnet Plus
    - 뮤니버스 → MUniverse
    - 링크 → LiNC
    - 하이어 → Higher
        - ※ 각 앱이 자기 앱스토어 · 영문 사이트에 쓰는 표기다
- **음악방송**
    - 뮤직뱅크 → Music Bank
    - 엠카운트다운 → M Countdown
    - 음악중심 / 쇼! 음악중심 → Show! Music Core
    - 인기가요 → Inkigayo
    - 쇼챔피언 → Show Champion
        - ※ 방송사가 쓰는 영문 제목이다. 음역하지 마라"""

SHOPS_SHORT = """- 예스24 → YES24
- 핫트랙스 → Hottracks
- 알라딘 → Aladin
- 메이크스타 → Makestar
- 위드뮤 → withmuu
- 사운드웨이브 → Soundwave
- SMTOWN &STORE · Weverse Shop · Ktown4U · Berriz — 이미 영문이다
- 애플뮤직 → AppleMusic (KR album store)  ※ 애플의 Apple Music 과 다른 회사다"""

KEEP_KO = """- NCT DREAM · DREAM STRM · DREAM AFTER DREAM
- YouTube Music · Weverse · X (Twitter) · Instagram
- 다음 카페 (Daum Cafe)
- SBS 파워FM · SBS 러브FM · KBS COOL FM · MBC FM4U · MBC 표준FM"""

# 태국어만 쓰는 곳이 다르다 — 노션 AI 자동 채우기가 태국어를 지원하지 않는다.
# 노션에 넣을 수 없으니, 이 파일은 messages/th.json 을 손으로 번역할 때 쓰는 용어집이다.
HEADER_TH_NOTE = """> ⚠ **이 프롬프트는 노션에 넣을 수 없다** — 노션 AI 자동 채우기가 태국어를
> 지원하지 않는다. 이 파일은 `messages/th.json` 을 **손으로** 번역할 때 쓰는 용어집이다
> (노션 콘텐츠의 태국어판은 `_EN` 으로 떨어진다 — [i18n.md](./i18n.md)).
>
> 아래 `---` 다음 줄부터가 전문이다. 사람이 번역하는 경우 첫 줄의 `@__ATCOL__` 자리에는
> 번역할 원문을 직접 넣는다.
>"""

HEADER_NOTION_NOTE = """> 아래 `---` **다음 줄부터 파일 끝까지가 프롬프트 전문**이다. 그대로 긁어서 노션 AI
> 자동 채우기(사용자 지정) 입력란에 붙여넣는다. 붙여넣은 뒤 **첫 줄의 `@__ATCOL__` 을
> 지우고**, 노션에서 `@` 를 쳐서 그 DB 의 원문 열을 삽입한다.
>"""

HEADER = """# __TITLE__

__USAGE__
> 규칙의 근거와 용어집 설계는 [notion-ai-translate-prompt.md](./notion-ai-translate-prompt.md).
> 이 파일은 `scripts/gen-translate-prompts.py` 가 찍어낸다 — **용어집은 그 스크립트에서 고친다.**

---

"""

BASE = """@원문열 을 __WORD__로 번역해서 번역문만 출력해. 설명·따옴표·원문을 덧붙이지 마.

이건 NCT DREAM 스트리밍팀 팬 사이트의 화면에 그대로 들어가는 문구다.
읽는 사람은 해외 팬이다.

규칙

1. 짧고 또렷하게. 원문보다 길어지지 않게 한다. 자리가 좁은 화면이다.
2. 줄바꿈 구조를 그대로 유지한다. 여러 줄이면 줄 수와 순서를 바꾸지 않는다.
3. 날짜·시각·숫자·가격은 값을 바꾸지 않는다. 표기만 __STYLE__식으로.
4. 중괄호로 싸인 것({count} 같은 것)은 글자 하나도 바꾸지 않고 그대로 둔다.
5. 팬에게 친근한 말투. 원문의 격식을 따른다.
6. 원문이 비어 있으면 아무것도 출력하지 않는다.
7. 아래 용어집을 반드시 따른다. 확신이 없으면 추측하지 말고 비워 둔다.
8. 브랜드·서비스·앨범 판매처 이름은 **대상 언어와 무관하게 아래 영문 표기**를 쓴다.
   「メロン」이 아니라 Melon, 중국어판에도 YES24 다. 음역하지 마라 — 해외 팬이
   앱스토어·판매처에서 **검색해서 찾아야 하는 글자**다. (멤버 이름은 다르다 — 아래)

__MEMBER_HEAD__

__MEMBERS__

__MEMBER_NOTE__

용어집 — 이렇게 옮긴다

__GLOSS__

브랜드 · 서비스 이름 — 대상 언어와 무관하게 아래 영문 표기를 쓴다

__BRANDS__

번역하지 말고 **한국어 그대로** 두는 이름

__KEEP_KO__

__TAIL__"""

BENEFIT = """@추가 특전 칸에 적힌 **내용**을 __WORD__로 번역해. 칸 이름(「추가 특전」)은 번역하지 마라.
번역문만 출력하고 설명·따옴표·원문을 덧붙이지 마.

이 칸은 앨범 한 종의 **특전 목록**이다. 한 줄에 한 항목이다.
팬이 앨범사끼리 특전을 비교하는 자리라, 줄이 합쳐지거나 빠지면 비교가 깨진다.

규칙

1. **입력의 줄 수와 순서를 그대로 유지한다.** 2줄이 들어오면 2줄을 출력한다.
   줄을 합치거나 요약하지 마라. 한 줄을 한 줄로 옮긴다.
2. 각 줄은 「무엇을 몇 개 주는가」다. 수량·종류 수·조건을 **하나도 빼지 않는다.**
3. 숫자는 값을 바꾸지 않는다. __NUM__.
4. 글머리표(•)는 있어도 없어도 된다.
5. **길이 제한은 없다.** 짧게 줄이려고 내용을 버리지 마라.
6. 원문이 비어 있으면 아무것도 출력하지 않는다.

낱말

__WORDS__

__MEMBER_HEAD__

__MEMBERS__

__MEMBER_NOTE__

브랜드·판매처 이름도 **대상 언어와 무관하게** 영문 표기를 쓴다

__SHOPS__

보기 ─ 이렇게 나와야 한다

입력

    • 초회 한정 포토카드 12종 중 랜덤 2종
    • 세트 구매 시 초회 한정 포토카드 12종 중 랜덤 4종

출력

__B_OUT__

__B_TAIL__"""

def bullets(items):
    return "\n".join("- " + i for i in items)

written = []
for L in LANGS:
    gloss = []
    for g in L["gloss"]:
        gloss.append(chonggong(L["chong"]) if g is None else "- " + g)
    if L["gloss_note"]:
        gloss.append("")
        gloss.append(L["gloss_note"])

    body = (BASE
        .replace("__WORD__", L["word"]).replace("__STYLE__", L["style"])
        .replace("__MEMBER_HEAD__", L["member_head"])
        .replace("__MEMBER_NOTE__", "\n".join(filter(None, [L.get("member_extra"), MEMBER_NOTE])))
        .replace("__MEMBERS__", bullets(L["members"]))
        .replace("__GLOSS__", "\n".join(gloss))
        .replace("__BRANDS__", BRANDS).replace("__KEEP_KO__", KEEP_KO)
        .replace("__TAIL__", L["tail"]))
    head = HEADER.replace("__USAGE__",
        HEADER_TH_NOTE if L["code"] == "th" else HEADER_NOTION_NOTE).replace("__TITLE__",
        f"번역 프롬프트 — {L['name']} · 기본 (`설명_{L['suffix']}` · "
        f"`타이틀_{L['suffix']}` · `비고_{L['suffix']}` · `제목_{L['suffix']}`)"
        ).replace("__ATCOL__", "원문열")
    f = DOCS / f"translate-prompt-{L['code']}.md"
    f.write_text(head + body + "\n"); written.append(f)

    body = (BENEFIT
        .replace("__WORD__", L["word"]).replace("__NUM__", L["num"])
        .replace("__WORDS__", bullets(L["words"]))
        .replace("__MEMBER_HEAD__", L["member_head"])
        .replace("__MEMBER_NOTE__", "\n".join(filter(None, [L.get("member_extra"), MEMBER_NOTE])))
        .replace("__MEMBERS__", bullets(L["members"]))
        .replace("__SHOPS__", SHOPS_SHORT)
        .replace("__B_OUT__", "\n".join(L["b_out"]))
        .replace("__B_TAIL__", L["b_tail"]))
    head = HEADER.replace("__USAGE__",
        HEADER_TH_NOTE if L["code"] == "th" else HEADER_NOTION_NOTE).replace("__TITLE__",
        f"번역 프롬프트 — {L['name']} · 특전 목록 (`추가 특전_{L['suffix']}`)"
        ).replace("__ATCOL__", "추가 특전")
    f = DOCS / f"translate-prompt-특전-{L['code']}.md"
    f.write_text(head + body + "\n"); written.append(f)

for f in written:
    print(f"{len(f.read_text().splitlines()):4d}  {f}")
