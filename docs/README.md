# 문서

## 운영진용 — 노션에서 사이트 내용 바꾸기

| 문서 | 무엇을 관리하나 | 사이트에서 보이는 곳 |
|---|---|---|
| [가이드 관리하기](./guide-admin-manual.md) | 플랫폼별 가이드 이미지 · 목록 | `/guide/…` |
| [홈 배너 관리하기](./banner-admin-manual.md) | 메인 상단 슬라이드 배너 | 홈 최상단 |
| [스밍리스트 원클릭 관리하기](./streaming-admin-manual.md) | 플랫폼 · 기기별 원클릭 스밍 링크 | `/oneclick/streaming` |
| [폼 · 헬퍼 목록](./notion-forms-db.md) | 신청 · 설문 폼과 헬퍼 모집 폼 | `/forms` · `/helper` |
| [일정 관리하기](./notion-schedule-db.md) | 캘린더 · 할일 · 투표 기간 (한 DB) | 홈 캘린더 · To Do · `/oneclick/voting` |

앞의 세 문서는 노션만 알면 되고, 개발 지식은 필요 없습니다.
(폼 · 헬퍼는 DB 를 처음 만드는 절차가 섞여 있어 스키마 문서 하나로 합쳐 두었습니다.)
바꾼 내용은 **최대 5분** 뒤에 사이트에 반영됩니다 (투표 버튼만 1분).

> DB마다 순서를 정하는 방법이 다릅니다. 헷갈릴 때 여기를 보세요.
>
> | DB | 순서를 정하는 곳 |
> |---|---|
> | 가이드 · 배너 · 바로가기 · 폼 | `순서` 숫자 칸 (없거나 비면 **만든 순서**) |
> | 스밍리스트 | 플랫폼 · 기기는 **드롭다운 선택지 순서**, 링크는 `순서` 숫자 칸 |
> | 일정 | To Do 는 `순서` 숫자 칸 → **마감 임박 순**. 달력은 날짜순, 투표는 마감 빠른 순 |
>
> ⚠ **노션에서 줄을 드래그해도 사이트 순서는 바뀌지 않습니다.** 노션 API가 끌어
> 옮긴 순서를 알려주지 않기 때문입니다. 순서를 정하려면 그 DB에 `순서` 숫자 칸을
> 만들고 1, 2, 3… 을 넣으세요 — 칸을 만들기만 하면 코드 수정 없이 적용됩니다.
>
> 지금 어떤 순서로 나가는지는 `node scripts/notion-check.mjs` 로 확인할 수 있습니다.

## 개발자용 — 스키마 · 셋업

- [notion-guide-db.md](./notion-guide-db.md) — 가이드 DB 스키마, 노션 연결 · 토큰 · 데이터 소스 셋업 (공통)
- [notion-banner-db.md](./notion-banner-db.md) — 배너 DB 스키마
- [notion-streaming-db.md](./notion-streaming-db.md) — 스밍리스트 DB 스키마
- [notion-links-db.md](./notion-links-db.md) — 홈 바로가기 아이콘 DB 스키마
- [notion-forms-db.md](./notion-forms-db.md) — 폼 · 헬퍼 목록 DB 스키마 (`/forms` · `/helper`)
- [notion-schedule-db.md](./notion-schedule-db.md) — 일정 DB 스키마 (홈 캘린더 · To Do · 투표 버튼이 공유)

### 링크 처리

사이트의 모든 링크는 `lib/url.ts`의 `resolveHref()`로 주소를 보정하고,
`<SmartLink>`(`components/SmartLink.tsx`)로 렌더한다. 스킴 보정(`tinyurl.com/x` →
`https://tinyurl.com/x`), 내부 · 외부 · 기기 앱(`mailto:` · `sms:`) 구분,
`target="_blank"` · `rel="noopener noreferrer"` 부착, `javascript:` 차단이 전부
여기 한 곳에 있다. **새 화면에서 `<a href>` · `<Link>`를 직접 쓰지 말 것.**
