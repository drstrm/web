# 스밍리스트 원클릭 노션 DB 스키마 (개발자용)

`/oneclick/streaming` 의 원클릭 스밍 링크를 노션에서 관리하기 위한 설계 문서.
연결(Connection) 만들기 · 토큰 발급 · 데이터 소스 개념은
[notion-guide-db.md](./notion-guide-db.md)의 「노션 셋업 절차」와 동일하므로
여기서는 스밍리스트 DB에만 해당하는 내용을 적는다.
운영진용 사용법은 [streaming-admin-manual.md](./streaming-admin-manual.md) 참고.

- DB URL: `https://app.notion.com/p/3b48b57d7cf48061b652fee1c199b1d1?v=…`
- 코드: `lib/notion.ts`의 `getStreamingLists()` → `lib/content.ts`의 `getStreamingLists()`
  → `app/oneclick/streaming/page.tsx` → `components/StreamingLists.tsx`

## DB 속성 정의

| 속성명 | 타입 | 용도 |
|---|---|---|
| `플랫폼` | 선택(Select) | 멜론 · 지니 · 벅스 · 플로 · 바이브 |
| `운영체제` | 다중 선택(Multi-select) | 안드로이드 · ios · 아이패드 · PC |
| `URL` | URL | 원클릭 스밍 링크 |
| `순서` | 숫자(Number) | 한 칸에 링크가 여러 개일 때의 1 · 2 · 3 · 4 |
| `Name` | 제목(Title) | 노션에서 행을 알아보기 위한 이름. 화면에는 안 나온다 |

**한 행이 링크 하나다.** 화면은 `플랫폼 > 운영체제 > 링크` 3단으로 묶어서 보여준다.

`플랫폼` · `운영체제` · `URL` 중 하나라도 비면 그 행은 화면에 나오지 않는다
(버튼을 만들 수 없을뿐더러, 노션이 기본으로 만들어 두는 빈 행이 여기서 함께 걸러진다).
바꿔 말해 **행을 지우지 않고 `URL` 만 비워 두면 임시로 내릴 수 있다.**

### `운영체제` 는 다중 선택이다

한 링크가 여러 기기에 걸리는 경우(벅스 앱 = 안드로이드 · iOS · 아이패드)를 위한 것이다.
**링크가 완전히 같은 기기끼리는 화면에서 한 줄로 합쳐진다** — 같은 버튼이 기기 수만큼
반복되지 않는다.

```
🤖🍎📱 안드로이드 · iOS · 아이패드   [ 원클릭 스밍 바로가기 ▶ ]
💻 PC                             [ 원클릭 스밍 바로가기 ▶ ]
```

`ios` 는 화면에서만 `iOS` 로 고쳐 쓴다(`lib/notion.ts`의 `OS_LABELS`). 노션 선택지
이름은 그대로 둬도 된다. 기기 뱃지 이모지는 `lib/oneclick.ts`의 `OS_EMOJI` 에 있고,
여기 없는 선택지를 노션에서 새로 만들어도 **이모지만 빠질 뿐 링크는 정상 노출된다.**

### `URL`

`https://` 를 빠뜨리고 `tinyurl.com/xxxx` 로만 적어도 된다 — 코드가 붙여 준다
(실제로 이 DB의 링크 대부분이 그 형태다). `http(s)` 가 아닌 주소(`javascript:` 등)는
무시된다.

보정 규칙은 사이트 공용이다 — `lib/url.ts`의 `resolveHref()`, 렌더링은
`<SmartLink>`. 자세한 표는 [notion-links-db.md](./notion-links-db.md) 참고.

## 순서

- **플랫폼 순서** = `플랫폼` 열의 **선택지 순서**
- **기기 순서** = `운영체제` 열의 **선택지 순서**
- **한 칸 안의 링크 순서** = `순서` 숫자 열 (비면 맨 뒤)

앞의 둘은 노션에서 속성을 열고 선택지를 끌어 옮기면 바뀐다. 순서 전용 열을 따로
만들지 않은 이유는, 플랫폼과 기기는 목록이 고정적이라 「선택지에 보이는 순서」가
가장 설명이 필요 없기 때문이다. 구현상으로는 데이터 소스 스키마
(`GET /data_sources/{id}`)를 한 번 더 조회해서 선택지 순서를 읽는다.

행 순서(드래그)는 화면에 영향을 주지 않는다. 배너 DB와 다른 점이니 주의.

## 환경변수

```sh
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxx        # 가이드 · 배너 DB와 같은 토큰
NOTION_STREAMING_DB_ID=3b48b57d7cf48061b652fee1c199b1d1
NOTION_STREAMING_DS_ID=3b48b57d-7cf4-80fd-a785-000b2f0c15c3   # 선택: 요청당 왕복 한 번을 아낀다
```

스밍리스트 DB 페이지에서 `⋯` → **연결(Connections)** → 가이드와 같은 연결을 붙여야 한다.
**이 단계를 빠뜨리면 API가 404를 반환하고** 스밍리스트가 통째로 비어 보인다
(서버 로그에 `[streaming-lists] 노션 조회 실패` 가 찍히고, 화면에는
「스밍리스트가 아직 등록되지 않았습니다」가 뜬다).

반영 주기는 ISR 300초 (`app/oneclick/streaming/page.tsx`의 `revalidate`).
