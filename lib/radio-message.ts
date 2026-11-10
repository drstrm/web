/*
 * 라디오 사연 문자 자동 생성 (서버 전용)
 * ------------------------------------------------------------------
 * 지금이 언제인지(평일 · 주말 × 아침 · 점심 · 오후 · 저녁 · 밤)와 지금 방송 중인
 * 프로그램의 DJ 호칭을 조합해, 매번 다른 사연 문장을 하나 뽑아준다.
 *
 * 문장 안의 자리표시자는 두 종류다.
 *   ${dj_name}   → DJ 호칭 ("완디", "철업디" …). 문장 어디에 와도 된다
 *   ${은는} ${이가} ${을를} ${와과} ${이랑} ${으로} ${이나}
 *                → 바로 앞 호칭의 받침에 맞는 조사 (JOSA)
 * 받침과 상관없는 조사(의 · 도 · 만 · 한테 · 에게 · 께 · 께서)는 그냥 붙여 쓴다.
 * DJ 가 없는 시간대(음악 방송 · 편성 공백)에는 호칭과 바로 뒤 조사를 통째로 지운다.
 *
 * 문장을 고치거나 늘릴 때는 docs/radio-message-prompt.md 의 프롬프트 · 규칙을 따른다.
 */

import { kstNow } from "@/lib/datetime";
import { dayTypeOf, type RadioSlot } from "@/lib/radio";

type TimeSlot = "morning" | "lunch" | "afternoon" | "evening" | "night";

type SentencePool = Record<TimeSlot, string[]>;

const SENTENCES: {
  weekday: SentencePool;
  weekend: SentencePool;
  /** 시간대를 타지 않는 문장. 항상 후보에 섞인다 */
  all: string[];
} = {
  weekday: {
    morning: [
      "${dj_name} 안녕하세요. 지하철 문 닫히는 거 보고 계단 두 칸씩 뛰었는데 결국 놓쳤어요ㅠㅠ 다음 차 기다리면서 NCT DREAM의 Boogie Woogie 신청합니다.",
      "알람 세 번 끄고 머리도 못 말린 채 버스 탔어요. 창문에 비친 제 머리 보고 혼자 웃는 중이에요ㅎㅎ ${dj_name}, 엔시티 드림의 부기우기 틀어주세요~",
      "${dj_name}${은는} 아침에 뭐 드세요? 저는 편의점 삼각김밥 먹으면서 길밥합니다! 삼김은 역시 전주비빔이죠. 오늘은 NCT DREAM의 Boogie Woogie 들으면서 가고 싶어요.",
      "입사하고 첫 발표날이라 지하철에서 대본만 보고 있습니다. 다 외운 줄 알았는데 자꾸 까먹네요ㅠㅠ 떨지 말라고 ${dj_name}${이가} 엔시티 드림의 부기우기 틀어주시면 좋겠어요.",
      "1교시 수업 가는 길이에요. 과제 내고 나니 새벽 세 시였어요ㅠㅠ 눈이 반쯤 감긴 채로 걷고 있는데 ${dj_name} 라디오 듣고 정신 차릴게요. NCT DREAM의 Boogie Woogie 부탁드려요.",
      "${dj_name}~ 요즘 출근길엔 엔드림 정규 6집만 돌려 들어요. 데뷔 때 중학생이던 제가 벌써 회사원이라니ㅎㅎ NCT DREAM의 Boogie Woogie 신청해요.",
      "야간 근무 끝나고 퇴근하는 간호사예요. 다들 출근할 때 저는 집에 가는 중이라 반대쪽 지하철이 텅 비어 있네요. ${dj_name}, 자기 전에 엔시티 드림의 부기우기 듣고 싶어요.",
      "${dj_name} 안녕하세요! 회사 엘리베이터에서 팀장님이랑 단둘이 탔습니다... 20층까지 가는 동안 숨도 못 쉬었어요ㅠㅠ 스트레스 날려버리게 NCT DREAM의 Boogie Woogie 틀어주세요!",
    ],
    lunch: [
      "${dj_name}~ 점심 메뉴 고르다가 결국 또 김치찌개 먹었어요. 회사 앞 사장님이 이제 제 얼굴만 보고 주문 넣으세요ㅋㅋ 오늘은 계란말이도 서비스로 주셨어요. NCT DREAM의 Boogie Woogie 신청합니다.",
      "편의점 앞 파라솔에서 도시락 먹고 회사 근처 한 바퀴 도는 중이에요. 점심시간 십 분 남았는데 들어가기 싫네요ㅠㅠ ${dj_name}, 엔시티 드림의 부기우기 들려주세요.",
      "학식 줄이 너무 길어서 친구랑 컵라면 먹고 있습니다. 저는 튀김우동, 친구는 육개장이에요. 둘 다 시즈니라 ${dj_name} 라디오 같이 듣는 중이에요. NCT DREAM의 Boogie Woogie 부탁드립니다.",
      "다이어트한다고 샐러드 시켰는데 옆자리 동료가 떡볶이를 먹지 뭐예요... 냄새만 맡으면서 ${dj_name}한테 문자 보냅니다. 엔시티 드림의 부기우기 신청해요.",
      "${dj_name}${은는} 점심 드셨어요? 저는 커피 사러 나왔는데 앞에 줄이 열 명이에요.. 오늘은 아메리카노 말고 바닐라라떼로 사치 좀 부리려고요. 기다리는 동안 NCT DREAM의 Boogie Woogie 들려주실 수 있을까요?",
      "회사에서 하루종일 엔시티드림 노래 듣고있는데, 오후 회의 들어가기 전에 ${dj_name} 라디오로 한 번만 더 듣고 싶어요. NCT DREAM의 Boogie Woogie 신청합니다!",
      "${dj_name} 안녕하세요. 도시락 싸 왔는데 젓가락을 안 챙겼어요. 결국 커피 스틱 두 개로 먹는 중입니다. NCT DREAM의 Boogie Woogie 부탁드려요.",
    ],
    afternoon: [
      "가게 점심 장사 끝내고 이제야 한숨 돌리는 사장입니다. 손님 없을 때 틀어 놓는 ${dj_name}의 라디오가 제 낙이에요. 엔시티 드림의 부기우기 틀어주세요~",
      "오후 세 시만 되면 모니터 글자가 흐려져요. 팀장님 몰래 이어폰 한쪽만 끼고 ${dj_name} 라디오 듣는 중입니다! NCT DREAM의 Boogie Woogie 신청해요.",
      "도서관에서 시험공부하다 잠깐 나왔어요. 자판기 커피 뽑아 놓고 벤치에 앉았는데 다시 들어가기가 싫네요ㅠㅠ ${dj_name}, NCT DREAM의 Boogie Woogie 틀어주세요.",
      "카페 알바 중인데 손님이 뚝 끊겨서 컵만 계속 닦고 있습니다. 사장님이 ${dj_name} 라디오를 틀어 놓으셔서 몰래 문자 보내요. 엔시티 드림의 부기우기 신청합니다~",
      "${dj_name}${은는} 오후에 졸릴 때 뭐 하세요? 저는 퇴근까지 세 시간 남았는데 시계를 벌써 다섯 번 봤답니다. NCT DREAM의 Boogie Woogie 틀어주시면 시간이 빨리 갈 것 같아요!",
      "취준 중이라 오후 내내 자기소개서만 고치고 있어요. 지원 동기 한 줄 쓰는 데 한 시간 걸렸습니다ㅠㅠ ${dj_name}, 엔시티 드림의 부기우기 틀어주시면 좋겠어요.",
      "아기 낮잠 재우고 겨우 앉아서 커피 마셔요. 깰까 봐 ${dj_name} 라디오 볼륨은 2로 해 놨어요ㅎㅎ NCT DREAM의 Boogie Woogie 신청할게요!",
      "${dj_name} 안녕하세요. 외근 나왔다가 차가 막혀서 강변북로 위에 30분째 서 있습니다. 앞차 번호판을 다 외웠어요.. 엔시티 드림의 부기우기로 지루함 날려주세요~",
    ],
    evening: [
      "드디어 퇴근했어요. 오늘 하루가 일주일 같았는데 버스에 앉자마자 다리가 풀리네요ㅠㅠ ${dj_name}, 집까지 버틸 수 있게 NCT DREAM의 Boogie Woogie 들려주세요.",
      "${dj_name}~ 오늘 칼퇴 성공했습니다! 괜히 기분 좋아서 한 정거장 먼저 내려서 걷는 중이에요ㅎㅎ 이 기분 그대로 엔시티 드림의 부기우기 신청해요.",
      "야근 확정이라 사무실에 혼자 남았어요ㅠㅠ 편의점 도시락 데워 놓고 ${dj_name} 라디오 켰는데 조금 덜 외롭네요. 남은 일 후딱 끝내게 NCT DREAM의 Boogie Woogie 틀어주세요~",
      "오늘 회사에서 작은 실수로 한 소리 들었거든요. 별일 아닌데 집에 가는 내내 생각나네요. ${dj_name}${이랑} 같이 털어 버리고 싶어서 엔시티 드림의 부기우기 신청합니다.",
      "${dj_name}${은는} 퇴근길에 무슨 노래 들으세요? 저는 엔드림 정규 6집을 처음부터 끝까지 듣는데, 제일 좋아하는 수록곡은 두 번씩 돌려 들어서 집 앞에서 딱 끝나요. NCT DREAM의 Boogie Woogie 부탁드립니다.",
      "학원 끝나고 집 가는 길이에요. 독서실 들어가기 전에 딱 한 곡만 듣고 가려고요. ${dj_name}, 엔시티 드림의 부기우기 틀어주실 수 있을까요?",
      "${dj_name}~ 저녁 먹고 동네 한 바퀴 걷는 중입니다. 이어폰 끼고 걸으면 아무 생각이 안 나서 좋더라고요. 한 바퀴 더 돌 수 있게 NCT DREAM의 Boogie Woogie 들려주세요.",
      "퇴근길 지하철에서 앞사람 폰 배경화면이 엔드림 단체 사진이더라고요ㅋㅋ 괜히 반가워서 혼자 웃었어요. 그분도 같이 듣고 계시면 좋겠다 싶어서 ${dj_name}, 엔시티 드림의 부기우기 부탁드려요~",
    ],
    night: [
      "${dj_name}~ 씻고 누웠는데 잠이 안 와서 라디오 켰어요. 내일 아침에 후회할 거 아는데 폰을 못 내려놓겠네요.. 이 노래만 듣고 진짜 잘게요. NCT DREAM의 Boogie Woogie 신청합니다.",
      "내일 시험인데 범위 절반도 못 봤어요. 커피 두 잔째 마시는 중입니다ㅠㅠ 이 노래 듣고 다시 책 펼 테니 ${dj_name}, 엔시티 드림의 부기우기 틀어주세요.",
      "컴백 무대 직캠 보다가 시간 가는 줄 몰랐어요. 정신 차려 보니 한 시간이 지났더라고요ㅋㅋ ${dj_name}, 여운 이어 가게 NCT DREAM의 Boogie Woogie 들려주세요~",
      "${dj_name} 안녕하세요. 야식 먹을까 말까 삼십 분째 고민 중이에요. 배달 앱 장바구니에 떡볶이 착한맛, 중국당면 추가까지 담아 놓고 버티는 중이랍니다. 이 노래 들으면서 꾹 참아 볼게요. 엔시티 드림의 부기우기 부탁드립니다.",
      "${dj_name}${은는} 잠 안 올 때 뭐 하세요? 저는 내일 입을 옷까지 골라 놓고 누웠는데 아직 말똥말똥하답니다. 오늘 마지막 노래로 NCT DREAM의 Boogie Woogie 신청해요.",
      "이직 준비한다고 책상에 앉았는데 한 시간째 책상 정리만 하고 있어요.. 이것도 준비라고 생각할게요ㅎㅎ ${dj_name}, 정신 차리게 엔시티 드림의 부기우기 틀어주시면 좋겠어요.",
      "편의점 야간 알바 중이에요. 손님 없는 시간엔 ${dj_name} 라디오가 유일한 말동무거든요. 손님 오기 전에 NCT DREAM의 Boogie Woogie 신청할게요!",
      "오늘 드림이들 브이로그 올라온 거 보고 하루 피로가 싹 풀렸어요. 여섯 명이 다 같이 웃는 소리가 아직도 귀에 남아 있네요ㅎㅎ ${dj_name}, 엔시티 드림의 부기우기 들려주실 수 있을까요?",
    ],
  },
  weekend: {
    morning: [
      "${dj_name}~ 알람 없이 잤는데 눈 떠 보니 열 시예요. 이불 속에서 라디오 듣는 중입니다. 이불 밖으로 나올 수 있게 NCT DREAM의 Boogie Woogie 신청해요.",
      "팝업 오픈런하려고 새벽같이 나왔는데 벌써 줄이 길어서 놀랐어요.. 기다리는 동안 ${dj_name}, 엔시티 드림의 부기우기 틀어주세요.",
      "친구랑 브런치 약속이 있는데 뭘 입을지 30분째 고민 중이에요. 결국 늘 입던 거 입을 것 같아요ㅠㅠ ${dj_name}, NCT DREAM의 Boogie Woogie 부탁드려요.",
      "${dj_name} 안녕하세요. 주말인데 출근하는 길이에요. 텅 빈 지하철은 좋은데 조금 억울하네요ㅠㅠ 위로 삼아 엔시티 드림의 부기우기 들려주세요~",
      "${dj_name}${은는} 주말 아침에 뭐 하세요? 저는 밀린 빨래 돌려 놓고 엔드림 정규 6집 틀어 놨어요. 빨래 개면서 들을 수 있게 NCT DREAM의 Boogie Woogie 신청합니다.",
      "아이 둘 데리고 놀이터 나왔습니다. 그네 밀어 주면서 한쪽 귀로 ${dj_name} 라디오 듣는 중이에요. 엔시티 드림의 부기우기 틀어주시면 좋겠어요.",
      "주말마다 동네 뒷산 오르는 게 요즘 루틴이에요. 정상에서 먹는 컵라면이 그렇게 맛있더라고요ㅎㅎ ${dj_name}, 내려가는 길에 NCT DREAM의 Boogie Woogie 듣고 싶어요.",
      "${dj_name}~ 어젯밤 늦게까지 드림쇼 영상 보다가 잤더니 눈이 퉁퉁 부었어요ㅠㅠ 냉찜질하면서 문자 보내고 있어요. 엔시티 드림의 부기우기 부탁드립니다.",
    ],
    lunch: [
      "친구랑 성수 놀러 왔다가 점심 먹으려고 줄 서 있어요. 오는 길에 그렇게 찾던 최애 포카로 교환해서 기분이 좋네요ㅎㅎ ${dj_name}, NCT DREAM의 Boogie Woogie 신청합니다.",
      "${dj_name} 안녕하세요. 본가 왔더니 엄마가 돼지고기 큼직하게 썰어 넣은 김치찌개를 끓여 주셨어요. 두 그릇 먹고 소파에 누워 있는 중입니다ㅋㅋ 엔시티 드림의 부기우기 들려주세요.",
      "늦게 일어나서 아침 겸 점심으로 라면 끓였어요. 파 송송에 계란은 반숙으로요. 쉬는 날엔 이게 제일 맛있더라고요. ${dj_name}, NCT DREAM의 Boogie Woogie 틀어주세요~",
      "${dj_name}${은는} 주말 점심 뭐 드셨어요? 저는 배달 시킬까 하다가 결국 냉장고 털어서 볶음밥 했답니다. 남은 김치에 스팸 반 캔 넣었더니 꽤 그럴듯해요. 엔시티 드림의 부기우기 부탁드려요.",
      "주말 알바로 웨딩홀 서빙 중인데 잠깐 쉬는 시간이에요. 오늘만 신랑 신부 세 쌍 봤어요ㅎㅎ 남은 타임도 힘내게 ${dj_name}, NCT DREAM의 Boogie Woogie 신청할게요!",
      "친구들이랑 앨범깡 하려고 카페에 모였어요. 테이블 위에 앨범이 열두 장이라 사장님이 계속 쳐다보세요ㅋㅋ ${dj_name}${이랑} 같이 듣고 싶어서 엔시티 드림의 부기우기 신청해요.",
      "${dj_name}~ 집에서 김밥 싸다가 옆구리가 다 터졌습니다. 그래도 맛은 똑같다고 우기는 중이에요ㅋㅋ NCT DREAM의 Boogie Woogie 들려주실 수 있을까요?",
      "오랜만에 아빠랑 둘이 점심 먹었는데 아빠가 드림이들 이름을 다 외우셨더라고요. 제가 영업한 보람이 있네요. ${dj_name}, 엔시티 드림의 부기우기 틀어주시면 좋겠어요.",
    ],
    afternoon: [
      "친구들이랑 드라이브 중이에요. 운전하는 친구가 ${dj_name} 라디오로 채널 고정해 놨어요. 다 같이 따라 부르게 NCT DREAM의 Boogie Woogie 틀어주세요.",
      "${dj_name}~ 카페에서 밀린 과제 하려고 노트북 폈는데 두 시간째 한 줄도 못 썼어요ㅠㅠ 엔시티 드림의 부기우기 들으면 좀 써질 것 같아요. 부탁드려요.",
      "방 청소 시작했는데 옛날 앨범 상자가 나와서 하나씩 꺼내 보고 있어요. 청소는 언제 끝날지 모르겠어요ㅋㅋ ${dj_name}, 청소 마저 할 수 있게 NCT DREAM의 Boogie Woogie 신청해요.",
      "라디오에 문자는 처음 보내 봐요. 올해 입덕한 새내기라 아직 모르는 게 많은데 이 노래는 벌써 백 번은 들었어요. ${dj_name}, 엔시티 드림의 부기우기 들려주세요.",
      "${dj_name}${은는} 낮잠 주무세요? 저는 잠깐 눈만 붙인다는 게 두 시간 잤지 뭐예요. 잠 깨게 NCT DREAM의 Boogie Woogie 틀어주세요~",
      "조카 데리고 키즈카페 왔는데 제가 더 지쳤어요. 트램펄린에서 열 번 뛰고 바로 항복했습니다ㅋㅋ ${dj_name}, 엔시티 드림의 부기우기 부탁드립니다.",
      "${dj_name} 안녕하세요. 응원봉 배터리 갈다가 나사 하나를 잃어버렸어요ㅠㅠ 바닥을 기어다니면서 찾는 중이라 같이 찾아 주시는 셈 치고 NCT DREAM의 Boogie Woogie 신청합니다.",
      "한강에서 돗자리 펴고 누워 있어요. 옆 돗자리에서 드림이들 노래가 나와서 괜히 반가웠어요ㅎㅎ ${dj_name}, 엔시티 드림의 부기우기 신청할게요!",
    ],
    evening: [
      "친구랑 코인노래방에서 엔시티 드림 노래만 한 시간 불렀어요. 목이 다 쉬었답니다ㅋㅋ ${dj_name}, NCT DREAM의 Boogie Woogie 신청해요.",
      "${dj_name} 안녕하세요. 치킨 시켜 놓고 기다리는 중인데 예상 시간이 한 시간이래요. 고민하다 반반 말고 양념 한 마리로 했어요. 기다리는 동안 엔시티 드림의 부기우기 들려주세요.",
      "가족들이랑 저녁 먹고 거실에서 다 같이 ${dj_name} 라디오 듣고 있어요. 엄마한테 영업 중이라 이 노래 나오면 좋겠어요. NCT DREAM의 Boogie Woogie 부탁드려요.",
      "하루 종일 집에만 있다가 저녁 먹고 겨우 나왔어요. 편의점까지만 걷는데도 기분이 좋네요. ${dj_name}, 산책 BGM으로 엔시티 드림의 부기우기 틀어주세요~",
      "${dj_name}${은는} 주말 저녁에 뭐 하세요? 저는 드림쇼 영상 틀어 놓고 맥주 한 캔 땄어요ㅎㅎ NCT DREAM의 Boogie Woogie 신청합니다.",
      "오늘 결혼식 두 탕 뛰고 이제야 구두 벗었어요. 발뒤꿈치가 다 까졌지 뭐예요ㅠㅠ ${dj_name}, 엔시티 드림의 부기우기 들려주실 수 있을까요?",
      "자취방에서 혼자 떡볶이 만들었는데 물을 너무 많이 넣어서 떡국이 됐어요ㅋㅋ ${dj_name}, NCT DREAM의 Boogie Woogie 틀어주시면 좋겠어요.",
      "${dj_name}~ 오늘 시즈니 친구들이랑 엔드림 정규 6집 감상회 했어요. 수록곡 순위 정하다가 세 시간이 지났답니다ㅋㅋ 엔시티 드림의 부기우기 신청할게요!",
    ],
    night: [
      "친구들이랑 아직 안 헤어지고 마지막 카페에 앉아 있어요. 다들 집에 가기 싫어하네요ㅋㅋ ${dj_name}, 마지막 곡으로 다 같이 듣게 NCT DREAM의 Boogie Woogie 틀어주세요.",
      "${dj_name} 안녕하세요. 컴백 무대 영상 무한 반복하다가 문자 보내요. 10년째인데 아직도 볼 때마다 새롭네요. 엔시티 드림의 부기우기 부탁드립니다.",
      "영화 한 편 보고 나니 벌써 이 시간이에요. 주말 밤은 왜 이렇게 빨리 가는지 모르겠어요ㅠㅠ ${dj_name}, NCT DREAM의 Boogie Woogie 들려주세요~",
      "주말에 하려던 일 목록 보니까 하나도 안 했네요.. 그래도 잘 쉬었으니 됐다고 생각하려고요. ${dj_name}, 엔시티 드림의 부기우기 신청합니다.",
      "${dj_name}${은는} 주말 밤에 주로 뭐 하세요? 저는 누워서 드림이들 브이로그 보다가 라디오로 넘어왔어요. NCT DREAM의 Boogie Woogie 신청해요.",
      "콘서트 끝나고 집 가는 막차 안이에요. 응원봉 불빛이 아직도 눈앞에 아른거려요ㅠㅠ ${dj_name}, 엔시티 드림의 부기우기 들려주실 수 있을까요?",
      "${dj_name}~ 동생이랑 보드게임 하다가 세 판 연속 졌어요. 억울해서 잠이 안 오네요ㅠㅠ 분 풀리게 NCT DREAM의 Boogie Woogie 틀어주시면 좋겠어요.",
      "야간 근무 들어가기 전에 병원 앞에서 커피 마시는 중이에요. 남들 쉴 때 일하는 게 익숙해졌지만 ${dj_name} 라디오 들으니까 덜 외롭네요. 엔시티 드림의 부기우기 신청할게요!",
    ],
  },
  all: [
    "엔시티 드림이 올해 데뷔 10주년이에요. 중학생 때부터 좋아했으니 저도 같이 큰 셈이네요ㅎㅎ ${dj_name}, 타이틀곡 NCT DREAM의 Boogie Woogie 틀어주세요.",
    "${dj_name}~ 앨범깡 하다가 최애 포카 나와서 소리 질렀어요ㅠㅠ 아직도 손이 떨리네요. NCT DREAM의 Boogie Woogie 신청할게요!",
    "10년째 시즈니로 살고 있는 고인물입니다. 데뷔 무대 보던 날이 엊그제 같은데 벌써 10주년이라니요. ${dj_name}, 엔시티 드림의 부기우기 틀어주시면 좋겠어요.",
    "${dj_name}~ 이 노래 들으면 저도 모르게 어깨가 들썩거려서 큰일이에요. 엘리베이터에서 혼자 춤추다 들킨 적도 있답니다ㅋㅋ NCT DREAM의 Boogie Woogie 신청합니다.",
    "${dj_name} 안녕하세요. 오늘 생일인데 아무도 축하를 안 해 줘서 직접 문자 보냅니다ㅋㅋ 생일 선물로 NCT DREAM의 Boogie Woogie 틀어주세요.",
    "친구랑 싸우고 아직 화해를 못 했어요. 둘 다 엔시티 드림 좋아하는데 이 노래 같이 들으면 풀릴 것 같아서요. ${dj_name}, 엔시티 드림의 부기우기 부탁드려요.",
    "${dj_name}${을를} 제일 좋아하는 언니가 이 문자 보내 보라고 시켰어요. 언니랑 같이 듣게 NCT DREAM의 Boogie Woogie 신청할게요!",
    "${dj_name} 안녕하세요. 오늘 드디어 운전면허 도로주행 합격했어요! 세 번 떨어지고 네 번째라 더 기뻐요ㅠㅠ 축하곡으로 NCT DREAM의 Boogie Woogie 틀어주세요.",
    "이사한 집에서 처음으로 라디오 켰어요. 아직 박스가 열 개나 남았는데 정리할 엄두가 안 나네요.. ${dj_name}, 짐 풀 힘 나게 엔시티 드림의 부기우기 부탁드려요.",
    "${dj_name}~ 강아지 산책시키는데 이 노래만 나오면 꼬리를 더 세게 흔들어요ㅋㅋ 저희 집 강아지도 엔시티 드림 팬인가 봐요. NCT DREAM의 Boogie Woogie 신청합니다.",
    "응원봉 새로 샀는데 아직 쓸 데가 없어서 방에서 켜 놓고 있어요ㅎㅎ 이 노래 나오면 흔들려고 대기 중이에요. ${dj_name}, NCT DREAM의 Boogie Woogie 틀어주세요.",
    "오늘 첫 월급 받았어요. 제일 먼저 엔드림 앨범을 버전별로 하나씩 샀습니다ㅎㅎ 통장은 가벼워졌지만 마음은 든든해요. ${dj_name}, 엔시티 드림의 부기우기 신청할게요!",
    "${dj_name} 안녕하세요. 오늘 엄마 생신이라 몰래 케이크 사 왔어요. 초 꽂는 동안 엄마가 방에서 안 나오시게 붙잡아 두는 게 관건이에요ㅋㅋ 생신 축하 겸 NCT DREAM의 Boogie Woogie 부탁드려요.",
    "${dj_name}~ 저 오늘 퇴사했습니다! 시원섭섭한데 생각보다 시원한 쪽이 더 크네요ㅎㅎ 새 출발 기념으로 NCT DREAM의 Boogie Woogie 신청합니다.",
    "이번 주에 드디어 다이어트 목표 몸무게를 찍었어요! 두 달 동안 야식 참은 보람이 있네요ㅠㅠ ${dj_name}, 오늘만큼은 치킨 시키면서 NCT DREAM의 Boogie Woogie 신청해요.",
    "${dj_name} 안녕하세요. 오랜만에 고등학교 친구들 단톡방이 터졌어요. 다 같이 엔드림 좋아하던 사이라 이 노래 얘기만 백 개 넘게 했답니다ㅋㅋ 단톡방 친구들이랑 같이 듣게 엔시티 드림의 부기우기 틀어주세요.",
    "자취 시작하고 처음으로 혼자 아팠어요. 죽 끓이다 냄비까지 태웠는데 이제 좀 살 만하네요ㅠㅠ ${dj_name}, 얼른 다 나으라고 NCT DREAM의 Boogie Woogie 들려주세요.",
    "${dj_name}${이가} 오늘 이 노래 틀어 주시면 회사 동기한테 커피 사기로 내기했어요. 지고 싶은 내기는 처음이에요ㅎㅎ NCT DREAM의 Boogie Woogie 부탁드립니다!",
  ],
};

/** [받침 있음, 받침 없음]. 「으로」만 ㄹ 받침이면 받침 없음 쪽(로)을 쓴다 */
const JOSA: Record<string, [string, string]> = {
  은는: ["은", "는"],
  이가: ["이", "가"],
  을를: ["을", "를"],
  와과: ["과", "와"],
  이랑: ["이랑", "랑"],
  으로: ["으로", "로"],
  이나: ["이나", "나"],
};

/** 받침과 상관없이 호칭에 바로 붙는 조사. 호칭을 지울 때 같이 지운다 (긴 것부터) */
const PLAIN_JOSA = ["께서", "에게", "한테", "의", "도", "만", "께"];

/** 마지막 글자의 종성 번호. 한글 음절이 아니면(영문 · 숫자) 받침 없음(0)으로 본다 */
function finalConsonant(name: string): number {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return 0;
  return (code - 0xac00) % 28;
}

const JONG_RIEUL = 8;

function josaFor(key: string, dj: string): string {
  const jong = finalConsonant(dj);
  const useBatchim = key === "으로" ? jong !== 0 && jong !== JONG_RIEUL : jong !== 0;
  return JOSA[key][useBatchim ? 0 : 1];
}

const JOSA_KEYS = Object.keys(JOSA).join("|");
const PLAIN = PLAIN_JOSA.join("|");

/** DJ 가 없을 때: 호칭 + 바로 뒤 조사 + 호격의 여운(~ ! , 공백)을 지운다 */
const REMOVE_DJ = new RegExp(`\\$\\{dj_name\\}(?:\\$\\{(?:${JOSA_KEYS})\\}|${PLAIN})?[~!,\\s]*`, "g");

/**
 * 호칭 바로 뒤에 올 수 있는 것: 끝 · 공백 · ~ ! , · 조사 자리표시자 · 받침 무관 조사(+ 공백/문장부호/끝).
 * 그 밖의 글자가 붙으면(「님」 등) DJ 가 없을 때 그 글자만 남아 문장이 깨진다.
 */
const BAD_AFTER_DJ = new RegExp(
  `\\$\\{dj_name\\}(?!$|[~!,\\s]|\\$\\{(?:${JOSA_KEYS})\\}|(?:${PLAIN})(?=$|[\\s~!,.?]))`
);

/** 문장 틀이 규칙에 맞는가 — 모르는 자리표시자 · 호칭 1번 · 조사 위치 · 호칭 뒤 글자 */
export function isValidTemplate(text: string): boolean {
  const keys = [...text.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1]);
  if (keys.some((k) => !(k === "dj_name" || k in JOSA))) return false;
  if (keys.filter((k) => k === "dj_name").length !== 1) return false;
  // 조사 자리표시자는 호칭 바로 뒤에서만 의미가 있다
  if (new RegExp(`(?<!\\$\\{dj_name\\})\\$\\{(?:${JOSA_KEYS})\\}`).test(text)) return false;
  return !BAD_AFTER_DJ.test(text);
}

/** 문장 틀 → 실제 문자. dj 가 없으면 호칭과 조사를 지우고 빈칸을 정리한다 */
export function renderMessage(template: string, dj: string | null): string {
  if (!dj) {
    return template.replace(REMOVE_DJ, "").replace(/\s{2,}/g, " ").trim();
  }
  return template.replace(/\$\{([^}]+)\}/g, (_, key: string) =>
    key === "dj_name" ? dj : josaFor(key, dj)
  );
}

function timeSlotOf(hour: number): TimeSlot {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------------- 날짜별 문장 풀 (수파베이스) ---------------- */

/**
 * 그날 하루치 문장 풀. 매일 00시 예약 작업이 그날 날짜 · 이벤트 · 날씨를 반영해
 * 수파베이스 `radio_messages` 에 넣는다 (docs/radio-message-prompt.md 5절).
 * 이 풀이 비어 있는 칸은 위의 SENTENCES 로 돌아간다.
 */
export type DailyPool = Partial<Record<TimeSlot | "all", string[]>>;

const SLOT_KEYS = new Set<string>(["morning", "lunch", "afternoon", "evening", "night", "all"]);

/**
 * 조회한 줄을 칸별로 묶는다. 사람이 손으로 넣은 줄도 있을 수 있으니 여기서 한 번 더 거른다 —
 * 모르는 자리표시자가 있거나, 호칭 바로 뒤에 지워지지 않는 글자가 붙은 문장은 버린다
 * (DJ 가 없을 때 "님 안녕하세요" 처럼 깨진다).
 */
export function toDailyPool(rows: { time_slot: string; text: string }[]): DailyPool {
  const pool: DailyPool = {};
  for (const { time_slot, text } of rows) {
    if (!SLOT_KEYS.has(time_slot)) continue;
    if (!isValidTemplate(text)) continue;
    (pool[time_slot as TimeSlot | "all"] ??= []).push(text.trim());
  }
  return pool;
}

/**
 * 지금 시간대 · 지금 방송 중인 프로그램에 맞는 사연 문자 한 통.
 * slot 이 null 이면(편성 공백 · 편성표 없는 채널) 호칭 없는 문장이 나온다.
 * daily 가 있으면 그날 풀에서, 지금 시간대와 all 이 둘 다 비어 있으면 기본 풀에서 뽑는다.
 */
export function buildRadioMessage(
  slot: RadioSlot | null,
  now: Date = new Date(),
  daily: DailyPool | null = null
): string {
  const { day, hour } = kstNow(now);
  const dayType = dayTypeOf(day);
  const group = dayType === "weekday" ? "weekday" : "weekend";
  const timeSlot = timeSlotOf(hour);

  const todays = [...(daily?.[timeSlot] ?? []), ...(daily?.all ?? [])];
  const sentence = pickRandom(
    todays.length > 0 ? todays : [...SENTENCES[group][timeSlot], ...SENTENCES.all]
  );

  return renderMessage(sentence, slot?.djName ?? null);
}
