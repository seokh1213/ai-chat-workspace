PRAGMA foreign_keys = ON;

BEGIN;

INSERT INTO workspaces (id, name, created_at, updated_at)
SELECT 'workspace_personal_travel', '개인 여행', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z'
WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE id = 'workspace_bbc7e467-17e8-45d7-aacf-80fb06146a64');

DELETE FROM trips WHERE id = 'trip_okinawa_20260505';

INSERT INTO trips (id, workspace_id, title, destination_name, start_date, end_date, timezone, created_at, updated_at, destination_lat, destination_lng)
VALUES ('trip_okinawa_20260505', 'workspace_bbc7e467-17e8-45d7-aacf-80fb06146a64', '오키나와 3박 4일 여행', '오키나와', '2026-05-05', '2026-05-08', 'Asia/Seoul', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z', 26.3344, 127.8056);

INSERT INTO trip_days (id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at)
VALUES ('day_okinawa_20260505_1', 'trip_okinawa_20260505', 1, '2026-05-05', '화', 'Day 1', 10, '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO trip_days (id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at)
VALUES ('day_okinawa_20260505_2', 'trip_okinawa_20260505', 2, '2026-05-06', '수', 'Day 2', 20, '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO trip_days (id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at)
VALUES ('day_okinawa_20260505_3', 'trip_okinawa_20260505', 3, '2026-05-07', '목', 'Day 3', 30, '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO trip_days (id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at)
VALUES ('day_okinawa_20260505_4', 'trip_okinawa_20260505', 4, '2026-05-08', '금', 'Day 4', 40, '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_05edc94024f7ed03', 'trip_okinawa_20260505', '나하 공항', '교통', NULL, NULL, '한국, 중국, 대만과 일본 내륙을 오가는 오키나와의 대표적인 국제공항

지역: 나하', NULL, 'triple-schedule-md', NULL, NULL, 26.200129699999998, 127.64664519999998, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"나하 공항"},{"sourceFile":"오키나와 여행 일정.md","dayNumber":4,"scheduleTitle":"나하 공항"}],"aliases":["나하 공항"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_1c27e72b16341a10', 'trip_okinawa_20260505', 'タイムズカー那覇空港店', '관광', NULL, NULL, '지역: 나하

셔틀버스 승차장 11번에서 직원이 기다리고 있습니다.
  
  【출발 시】국내선 도착/국제선 도착: 국내선 출구→횡단보도⇒셔틀버스 승차장 11번
  ※나하공항에서 매장까지 셔틀버스로 송영합니다 (약 1.5Km)
  
  【귀착 시】※비행 시간 90분 전을 기준으로 반납(매장에서 공항까지 셔틀 제공: 약 3분)
  
  ✔️보험 제일 비싼걸로 들었슴
  etc단말기는 무료로 빌렸는데 카드는 현장에서 빌릴수있는지 물어보기
  전화통화시 한국어 가능하냐 물어보면 한국어 가능직원 바꿔줄수도..?

지역: 나하

시내에서 전날 싸게 주유하고
  당일 지정주유소 들러서 주유후 반납', NULL, 'triple-schedule-md', NULL, NULL, 26.2108782, 127.6581071, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"タイムズカー那覇空港店"},{"sourceFile":"오키나와 여행 일정.md","dayNumber":4,"scheduleTitle":"タイムズカー那覇空港店"}],"aliases":["タイムズカー那覇空港店"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_8cee59fd6e105802', 'trip_okinawa_20260505', '아라하 비치 파크', '관광', NULL, NULL, '여유로운 산책을 즐기며 아름다운 일몰을 감상할 수 있는 해변 공원

지역: 차탄

무료주차장: 비치바로뒤 / 해피볼 카페 인근 주차장', NULL, 'triple-schedule-md', NULL, NULL, 26.304431, 127.758551, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"아라하 비치 파크"}],"aliases":["아라하 비치 파크"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_d31d5a7b108997ce', 'trip_okinawa_20260505', '해피 보울스 오키나와', '교통', NULL, NULL, '야자수로 우거진 테라스가 하와이에 온듯한 분위기를 풍기는 카페

지역: 차탄

아사히 볼, 피크닉 용품무료대여
  ㄴ스노쿨링, 파라솔 대여가능
  
  ㄴHappy bowls araha', NULL, 'triple-schedule-md', NULL, NULL, 26.306479, 127.7599861, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"해피 보울스 오키나와"}],"aliases":["해피 보울스 오키나와"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_df6fb35e3b65da11', 'trip_okinawa_20260505', '미하마 아메리칸 빌리지', '관광', NULL, NULL, '볼거리와 즐길거리가 넘쳐나는 미국풍 복합 쇼핑 타운

지역: 차탄', NULL, 'triple-schedule-md', NULL, NULL, 26.31599542178522, 127.75402950923154, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"미하마 아메리칸 빌리지"}],"aliases":["미하마 아메리칸 빌리지"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_f5e5607c68e84f63', 'trip_okinawa_20260505', '이온몰 오키나와 라이카무 점', '교통', NULL, NULL, '220개 이상의 다양한 매장이 입점한 오키나와 최대 규모의 쇼핑몰

지역: 차탄

초대형마트.. 밥, 장보기, 쇼핑 그 무엇이든/포켓몬센터💛
  ㄴ주차무료
  
  야식, 다음날 물놀이할때 먹을간식같은거 미리사면 좋을듯', NULL, 'triple-schedule-md', NULL, NULL, 26.3137504, 127.7966025, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"이온몰 오키나와 라이카무 점"}],"aliases":["이온몰 오키나와 라이카무 점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_0fa62364cb085206', 'trip_okinawa_20260505', '이온 빅 익스프레스 하닌스 기노완 점', '쇼핑', '3.9', '524', '합리적인 가격에 신선한 식재료와 식료품을 구입할 수 있는 마트

지역: 차탄

ㄴ음식종류 많고 쌈
  소고기 , 회 초밥류 쌈
  
  옆에 다이소', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.2864482, 127.7469493, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"이온 빅 익스프레스 하닌스 기노완 점"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":31,"categoryRaw":"할인점","coordinateSource":"트리플 일정 매칭: 이온 빅 익스프레스 하닌스 기노완 점"}],"aliases":["이온 빅 익스프레스 하닌스 기노완 점","Aeon Big Express"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_eed9a89da3e7951f', 'trip_okinawa_20260505', 'BEB5 오키나와 세라가키 바이 호시노 리조트', '호텔', '4.6', '657', '지역: 중부

- 스위트룸(싱글침대2, 소파베드2)
  - 취사가능, 전자렌지
  - 객실내 세탁기 있음
  - 수영장, 사우나
  - 다이슨 드라이기 ㅋㅋ
  - 자전거 무료 대여', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.50338, 127.862488, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"BEB5 오키나와 세라가키 바이 호시노 리조트"},{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"BEB5 오키나와 세라가키 바이 호시노 리조트"},{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"BEB5 오키나와 세라가키 바이 호시노 리조트"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":50,"categoryRaw":"4성급 호텔","coordinateSource":"트리플 일정 매칭: BEB5 Okinawa Seragaki by Hoshino Resorts"}],"aliases":["BEB5 오키나와 세라가키 바이 호시노 리조트","BEB5 Okinawa Seragaki by Hoshino Resorts"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_e344b1fcdf5ddf8e', 'trip_okinawa_20260505', '만좌모', '관광', NULL, NULL, '자연이 만들어낸 절경을 감상할 수 있는 ''코끼리 절벽''

지역: 중부

무료주차, 입장료 100엔
  
  1.날씨 좋을때 꼭꼭 썬크림 꼼꼼히!!!
  엄청 탐. 목 뒤도 바르삼.
  2.점심시간~ 오후4시까지는 관광버스 대절해서 중국관광객들 넘 많음
  3.입장권 파는 건물안에 무료로 사진스페이스 있는데 줄 짧으면 꼭 찍기
  4.건물 2층에서 파는 오키나와 튀김 도너츠 존맛이라함', NULL, 'triple-schedule-md', NULL, NULL, 26.505252564221784, 127.85047547020514, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":1,"scheduleTitle":"만좌모"}],"aliases":["만좌모"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_31b08dfcb5b0c048', 'trip_okinawa_20260505', '고릴라 촙', '관광', '4.5', '11', '지역: 북부

주차비 : 무료 (17:00마감)
  샤워비 : 3분에 100엔 (15:30마감)
  ㄴ세면용품, 수건지참하기, 온수나옴
  바깥 간이 샤워장은 찬물만나옴
  
  접근로: 방파제쪽으로! 비치쪽에는 물고기 없음.. 콘크리트 계단이라 이끼 등에 미끄러지지 않게 조심! 계단에서 바로 물로 들어가자마자 약간 수심이 깊어지니 주의
  
  간조에서 만조로 바뀌는 시점에 해수가 유입되며 시야가 많이 탁해지는 현상발생
  해안 근처보다는 약간 멀리 나가야 좋은 시야확보 및 발달된 산호군락,다양한 어종 관찰가능

고릴라춉', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.63618749999999, 127.8830625, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"고릴라 촙"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":1,"categoryRaw":"공원","coordinateSource":"트리플 일정 매칭: 고릴라 촙"}],"aliases":["고릴라 촙","崎本部緑地公園（トートーメー石）"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_4963691f8c8c6b38', 'trip_okinawa_20260505', '오키나와 츄라우미 수족관', '관광', '4.6', '70,502', '다양한 해양 생물과 더불어 돌고래 쇼를 볼 수 있는 대형 수족관

지역: 북부

8:30~18:30 (입장마감 17:30)
  ㄴ관람 소요시간 2시간
  ㄴ4시이후 티켓 저렴
  ✅ 열대어 : 오후 1시 & 3시 반
  ✅ 고래상어 : 오전 9시 반 & 오후 3시 & 5시
  ✅ 돌고래 : 공연 시작 20분 전 도착 추천(약 20분간 진행)
  - 10:30, 11:30, 13:00, 15:00, 17:00 - 앞자리 착석 시 수건 지참 추천
  ✅다이버 쇼(약 15분간 진행)
  - 12:00, 14:00, 15:30
  
  아침 오픈시간 맞춰 수족관가서 구경하고 밥먹고 고릴라춉 스노쿨링???', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.694338, 127.8780131, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"오키나와 츄라우미 수족관"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":56,"categoryRaw":"수족관","coordinateSource":"트리플 일정 매칭: 오키나와 츄라우미 수족관"}],"aliases":["오키나와 츄라우미 수족관","오키나와 추라우미 수족관"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_de84a3f78f021815', 'trip_okinawa_20260505', 'Jungle Photo Land亜熱帯サウナ', '나만의 장소', NULL, NULL, '느좋 커피집
  (아열대사우나+카페)', NULL, 'triple-schedule-md', NULL, NULL, 26.641910552978516, 127.95207214355469, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"Jungle Photo Land亜熱帯サウナ"}],"aliases":["Jungle Photo Land亜熱帯サウナ"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_c493d08b7ee6e352', 'trip_okinawa_20260505', '야치문 킷샤', '교통', NULL, NULL, '드라마 ''괜찮아, 사랑이야'' 촬영 장소로 잘 알려진 자연 속 카페

지역: 북부', NULL, 'triple-schedule-md', NULL, NULL, 26.6438348, 127.9411989, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"야치문 킷샤"}],"aliases":["야치문 킷샤"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_f2b1fef1f7a1c840', 'trip_okinawa_20260505', '비세 후쿠기 가로수길', '관광', NULL, NULL, '1,000여 그루 고목 사잇길에서 즐기는 산림욕

지역: 북부', NULL, 'triple-schedule-md', NULL, NULL, 26.7007146, 127.8799436, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"비세 후쿠기 가로수길"}],"aliases":["비세 후쿠기 가로수길"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_3ee38dc217265cbd', 'trip_okinawa_20260505', '코우리 대교', '교통', NULL, NULL, '''코우리 섬''으로 갈 수 있는 해변 드라이브 코스

지역: 북부

날씨안좋으면 pass
  쾌청할때 가야좋음 아니면 그닥이라함', NULL, 'triple-schedule-md', NULL, NULL, 26.6788745, 128.0128861, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"코우리 대교"}],"aliases":["코우리 대교"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_69ccbba8c1c5543d', 'trip_okinawa_20260505', '헤도 곶', '관광', NULL, NULL, '해안 절경을 감상할 수 있는 오키나와 최북단의 전망대

지역: 북부

여유되면 드라이브', NULL, 'triple-schedule-md', NULL, NULL, 26.872222952994218, 128.26403973554724, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":2,"scheduleTitle":"헤도 곶"}],"aliases":["헤도 곶"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_659a9cd6832806ee', 'trip_okinawa_20260505', '푸른동굴렌탈冒険島', '나만의 장소', '4.8', '554', '★ 소요시간 약 2.5시간 투어입니다 ♪
  
  ◯업체집합 (08:00)
  접수 후, 기재 사이즈를 맞추고 탈의실에서 옷을 갈아입습니다.귀중품은 매장 내 사물함에서 보관합니다(무료).갈아입을 옷이나 짐 보관소도 전용 선반을 준비하고 있습니다.동행자 분들은 매장 내에서 기다리실 수도 있습니다.
  ↓
  ◯ [항구로 이동하여 스노클 설명 (렉처)]
  항구까지 도보 1분.수영이 서투른 분이나 어린이 등 고객의 페이스에 맞춰 전속 가이드가 사용하는 장비를 사용하여 천천히 친절하게 설명!요청사항도 편하게 말씀해주세요.
  ↓
  
  ◯보트로 푸른 동굴로 이동
  보트 타고 5분이면 포인트 도착! ♪ 장비 장착 등 모두 도와드리겠습니다.
  ↓
  ◯ 스노클링 투어 (약 40~50분)
  전속 가이드가 여러분을 물속으로 천천히 에스코트.푸른 동굴의 신비로운 경치, 많은 열대어들과의 시간을 즐겨보세요.유영 시간 듬뿍!모험섬을 고집하는 스케줄.회전율보다 서비스 내용 중시!
  ↓
  ◯귀항·가게로 이동
  매장 내 샤워실, 탈의실, 파우더룸을 이용해주세요.샴푸, 린스, 바디워시, 스킨, 로션, 드라이기 모두 무료로 이용 가능합니다.
  ↓
  ◯투어 사진 전달·해산(10:30)
  사진 매수 무제한(평균 50매 정도입니다만, 많은 사진 촬영이나 동영상 촬영을 희망하시는 분은 주저하지 말고 리퀘스트 해 주세요) 그 자리에서 스마트폰으로 모든 사진을 데이터 전송합니다.
  
  [플랜명]
  푸른 동굴 스노클링【보트 개최】
  
  [집합장소 안내]
  주소 : 오키나와현 구니가미군 온나무라마에카네히사149
  MAP:https://goo.gl/maps/8GJUJzN9RS22
  
  [준비물]
  수영복 목욕타월 샌들
  
  ◆ 취소 정책
  ·전일,당일 취소수수료: 100%
  ※날씨나 해황 악화로 인한 중지, 태풍 등 자연재해, 항공 및 선박의 결항 등 부득이한 사정으로 인한 취소에 대해서는 취소 수수료가 부과되지 않습니다.
  
  ◆ 안전에 관한 부탁
  참가신청서의 ''건강상태 확인''에 해당하는 항목이 있는 분은 당일 투어 참가를 거절하고 있습니다.
  반드시 참가자 전원 사전에 참가 신청서를 확인해 주시기 바랍니다.
  （参加申込書 https://www.bokenjima.jp/web/wp-content/uploads/2025/03/SNA.pdf）
  
  병력에 ''YES'' 해당 항목이 있는 분
  ·사전에 의사의 진단을 받으셔야 합니다.
  ·아래에서 병력진단서를 인쇄하여 의사의 진단과 서명을 받아 당일 지참하여 주시기 바랍니다.
  （病歴診断書 https://www.bokenjima.jp/web/wp-content/uploads/2025/02/SNM.pdf）
  
  주소 : 오키나와현 구니가미군 온나무라마에카네히사149
  [운영시간 8:00~18:00]
  TEL/FAX: 098-989-3511
  (영업시간외 연락처) 080-7826-0388

푸른동굴업체', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.447439193725586, 127.80436706542969, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"푸른동굴렌탈冒険島"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":34,"categoryRaw":"다이빙 센터","coordinateSource":"트리플 일정 매칭: 푸른동굴렌탈冒険島"}],"aliases":["푸른동굴렌탈冒険島","푸른동굴렌탈"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_3eb6e149cf645a53', 'trip_okinawa_20260505', '푸른 동굴', '관광', '4.6', '1,274', '지역: 중부

<업체이용료 포함사항>
  강사 개별 가이드 비용
  ·모든 기자재 대여료
  ·보트 승선료
  ·보험료(배상보험, 상해보험)
  ·사진 및 동영상 촬영 비용(~50장 정도)
  ·시설 사용료(샤워,주차)
  
  
  <업체이용 안할시>
  샤워장 3분 100엔
  주차장 시간당 100엔', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.4434485, 127.7725524, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"푸른 동굴"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":51,"categoryRaw":"명승지","coordinateSource":"트리플 일정 매칭: 푸른 동굴"}],"aliases":["푸른 동굴","오키나와 푸른동굴"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_9a1a20c176208cf4', 'trip_okinawa_20260505', '블루 씰 마키미나토 점', '교통', NULL, NULL, '다양한 종류의 아이스크림과 크레페를 판매하는 디저트 전문점

지역: 차탄

본점 특별메뉴 묵어보자', NULL, 'triple-schedule-md', NULL, NULL, 26.266979, 127.721576, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"블루 씰 마키미나토 점"}],"aliases":["블루 씰 마키미나토 점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_e0e5b9c124359822', 'trip_okinawa_20260505', '슈리성', '관광', NULL, NULL, '화재로 인해 큰 피해를 입은 오키나와의 상징

지역: 나하

pass가능', NULL, 'triple-schedule-md', NULL, NULL, 26.217044899999998, 127.71948330000001, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"슈리성"}],"aliases":["슈리성"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_fecb6122a00fdbc9', 'trip_okinawa_20260505', '스이 둔치', '음식', NULL, NULL, '지역: 나하', NULL, 'triple-schedule-md', NULL, NULL, 26.2145438, 127.7141863, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"스이 둔치"}],"aliases":["스이 둔치"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_3ace96931657c47b', 'trip_okinawa_20260505', '더 네스트 나하', '기타', '4.1', '357', '2025년 7월 오픈한, 나하 관광에 편리한 호텔

지역: 나하

- Corner Deluxe Double Room 2개
  - 조식 인당 2만원
  - 6-8pm 수영장옆 무제한 무료주류
  - 코인 세탁기 ?층, 전자렌지는 3층
  - 국제거리 인근
  - 유료 주차장 1박 1.8만

2025년 7월 오픈한, 나하 관광에 편리한 호텔

지역: 나하

차타고 공항까지 5-10분
  유어레일 타고 공항까지 15분
  ㄴ인당 290엔', NULL, 'triple-schedule-md + google-maps-md', NULL, NULL, 26.21257, 127.671891, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"더 네스트 나하"},{"sourceFile":"오키나와 여행 일정.md","dayNumber":4,"scheduleTitle":"더 네스트 나하"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":49,"categoryRaw":"3성급 호텔","coordinateSource":"트리플 일정 매칭: THE NEST那覇"}],"aliases":["더 네스트 나하","THE NEST那覇"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_74d2c729bc5688fd', 'trip_okinawa_20260505', '나하 국제 거리', '쇼핑', NULL, NULL, '쇼핑부터 먹거리와 축제까지 모두 한곳에서 즐길 수 있는 오키나와 대표 번화가

지역: 나하

현금만 받는곳 많음
  면세되는곳 있을수있어서 여권지참', NULL, 'triple-schedule-md', NULL, NULL, 26.216143300000002, 127.6880667, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"나하 국제 거리"}],"aliases":["나하 국제 거리"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_366a52247afb6e20', 'trip_okinawa_20260505', '츠보야 도자기 거리', '관광', NULL, NULL, '오키나와 전통 도자기 공방들이 모여 있는 거리

지역: 나하', NULL, 'triple-schedule-md', NULL, NULL, 26.2130933, 127.6912774, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"츠보야 도자기 거리"}],"aliases":["츠보야 도자기 거리"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_9443eebd0f7cac86', 'trip_okinawa_20260505', '우미카지 테라스', '교통', NULL, NULL, '탁 트인 바다를 배경 삼아 여행을 즐길 수 있는 지중해풍 쇼핑 단지

지역: 남부

저녁이나먹자', NULL, 'triple-schedule-md', NULL, NULL, 26.1766603, 127.6404367, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"우미카지 테라스"}],"aliases":["우미카지 테라스"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_b4d162057357b3ee', 'trip_okinawa_20260505', '돈키호테 나하 츠보가와 점', '쇼핑', NULL, NULL, '대형 주차장 구비와 새벽까지 영업해 편리하게 쇼핑하기 좋은 드럭 스토어

지역: 나하

국제거리점 보다 여기가 더 싸다함', NULL, 'triple-schedule-md', NULL, NULL, 26.2080336, 127.677485, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"돈키호테 나하 츠보가와 점"}],"aliases":["돈키호테 나하 츠보가와 점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_ade5ca697d8858da', 'trip_okinawa_20260505', '파르코 시티', '쇼핑', NULL, NULL, '지역: 나하

쇼핑', NULL, 'triple-schedule-md', NULL, NULL, 26.2617542, 127.6981799, 'ready', '{"sources":[{"sourceFile":"오키나와 여행 일정.md","dayNumber":3,"scheduleTitle":"파르코 시티"}],"aliases":["파르코 시티"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_8d0069786c55147c', 'trip_okinawa_20260505', 'moco salt coffee【モコソルトコーヒー】近くの駐車場をご利用ください', '교통', '4.6', '67', '카페', NULL, 'google-maps-md', NULL, NULL, 26.701693, 127.884453, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":2,"categoryRaw":"¥1~1,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町備瀬462)"}],"aliases":["moco salt coffee【モコソルトコーヒー】近くの駐車場をご利用ください"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_a65baa12529ba434', 'trip_okinawa_20260505', '마-블루 가든 하우스', '음식', '4.5', '427', '수제버거', NULL, 'google-maps-md', NULL, NULL, 26.699842, 127.895706, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":3,"categoryRaw":"₩₩ · 하와이 요리","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町新里247-1)"}],"aliases":["마-블루 가든 하우스"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_efe2b57213faea84', 'trip_okinawa_20260505', '오키나와 소바 에이분', '음식', '4.3', '1,414', '소바', NULL, 'google-maps-md', NULL, NULL, 26.212674, 127.6900415, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":4,"categoryRaw":"¥1,000~2,000 · 국수 전문점","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Okinawa Soba Eibun Naha)"}],"aliases":["오키나와 소바 에이분"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_99e7824827f4351f', 'trip_okinawa_20260505', '포타마 마키시시장점', '음식', '4.3', '3,796', '무스비', NULL, 'google-maps-md', NULL, NULL, 26.215151, 127.688011, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":5,"categoryRaw":"¥1~1,000 · 아침식사","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県那覇市松尾2-8-35)"}],"aliases":["포타마 마키시시장점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_4893f5a5daa707f1', 'trip_okinawa_20260505', '스시로 나하 국제거리점', '음식', '4.0', '787', '스시', NULL, 'google-maps-md', NULL, NULL, 26.2146037, 127.6824079, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":6,"categoryRaw":"¥1,000~2,000 · 초밥","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (スシロー 那覇国際通り店)"}],"aliases":["스시로 나하 국제거리점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_fd0e1a0fa4390143', 'trip_okinawa_20260505', 'FIFI PARLOR', '카페', '4.5', '383', '오션뷰 느느느좋 카페', NULL, 'google-maps-md', NULL, NULL, 26.634502, 127.99826, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":7,"categoryRaw":"¥1~1,000 · 커피숍/커피 전문점","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県名護市呉我1335-4)"}],"aliases":["FIFI PARLOR"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_412064932f699f06', 'trip_okinawa_20260505', '우오마루', '음식', '4.3', '2,422', '카이센동개맛집', NULL, 'google-maps-md', NULL, NULL, 26.1904231, 127.6598659, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":8,"categoryRaw":"¥1,000~2,000 · 해산물 요리","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (魚まる 那覇)"}],"aliases":["우오마루"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_28a8ea40927c8cbe', 'trip_okinawa_20260505', 'MKCAFE 우미카지테라스 오키나와점', '교통', '4.7', '136', '수제버거, 오키나와 도넛

우미카지테라스 타코라이스', NULL, 'google-maps-md', NULL, NULL, 26.175915, 127.64978, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":9,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県豊見城市瀬長174-6 #38)"},{"sourceFile":"오키나와 조사 장소.md","originalIndex":17,"categoryRaw":"¥1,000~2,000 · 일식","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県豊見城市瀬長174-6 瀬長島ウミカジテラス 28)"}],"aliases":["MKCAFE 우미카지테라스 오키나와점","타코라이스 카페 키지무나 세나가지마 우미카지 테라스점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_a890b0f95b2a6a0d', 'trip_okinawa_20260505', 'Ocean Blue Café', '교통', '3.7', '234', '츄라우미 식당겸카페', NULL, 'google-maps-md', NULL, NULL, 26.693777, 127.878372, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":10,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町石川424 海洋博公園 沖縄美ら海水族館)"}],"aliases":["Ocean Blue Café"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_090535cfa1a55b9e', 'trip_okinawa_20260505', '카페 차하야불란', '교통', '4.6', '1,118', '팬케이크', NULL, 'google-maps-md', NULL, NULL, 26.702049, 127.87986, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":11,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町備瀬429-1)"}],"aliases":["카페 차하야불란"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_369284b603b21f34', 'trip_okinawa_20260505', 'A&W Naha Airport', '¥1,000~2,000 · 패스트푸드', '3.9', '1,786', '오키나와 햄버거 체인', NULL, 'google-maps-md', NULL, NULL, 26.2061074, 127.6505482, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":12,"categoryRaw":"¥1,000~2,000 · 패스트푸드","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (A&W 那覇空港店)"}],"aliases":["A&W Naha Airport"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_f44223b4a047b84a', 'trip_okinawa_20260505', '야키니쿠 모토부 목장 모토부점', '음식', '4.5', '3,250', NULL, NULL, 'google-maps-md', NULL, NULL, 26.658037, 127.885056, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":13,"categoryRaw":"₩₩₩ · 야키니쿠","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町大浜881-1)"}],"aliases":["야키니쿠 모토부 목장 모토부점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_54a0c6c4ee5620f8', 'trip_okinawa_20260505', '88 스테이크 하우스 나하공항점', '교통', '4.1', '1,168', NULL, NULL, 'google-maps-md', NULL, NULL, 26.210526, 127.649277, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":14,"categoryRaw":"¥2,000~3,000 · 스테이크","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県那覇市鏡水150 際内連結ターミナルビル3F)"}],"aliases":["88 스테이크 하우스 나하공항점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_057e130db82def55', 'trip_okinawa_20260505', '잭스 스테이크 하우스', '음식', '4.2', '10,607', '스테이크', NULL, 'google-maps-md', NULL, NULL, 26.2128982, 127.6724589, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":15,"categoryRaw":"¥2,000~3,000 · 스테이크","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (ジャッキーステーキハウス 那覇)"}],"aliases":["잭스 스테이크 하우스"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_7b4a2d5028b1d89c', 'trip_okinawa_20260505', '타코라이스 키지므나 데포아일랜드점', '교통', '4.3', '746', '타코라이스 체인점', NULL, 'google-maps-md', NULL, NULL, 26.315735, 127.754196, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":16,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県中頭郡北谷町美浜9-1 デポアイランドビルC)"}],"aliases":["타코라이스 키지므나 데포아일랜드점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_7e0fe490692622a6', 'trip_okinawa_20260505', '카리카', '교통', '4.3', '337', NULL, NULL, 'google-maps-md', NULL, NULL, 26.141106, 127.796989, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":18,"categoryRaw":"¥1,000~2,000 · 네팔 요리","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県南城市玉城百名1360)"}],"aliases":["카리카"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_65745dabfa6a39a5', 'trip_okinawa_20260505', '하마베노차야', '교통', '4.4', '2,248', NULL, NULL, 'google-maps-md', NULL, NULL, 26.1335318, 127.7846118, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":19,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (浜辺の茶屋 南城市 沖縄)"}],"aliases":["하마베노차야"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_fb19f51facfd615a', 'trip_okinawa_20260505', '토리소바야 이시구후 (소바)', '음식', '4.6', '840', '오키나와식 소바 닭', NULL, 'google-maps-md', NULL, NULL, 26.263432, 127.716011, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":20,"categoryRaw":"¥1,000~2,000 · 국수 전문점","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県浦添市港川2-13-6 カンサスストリート40番)"}],"aliases":["토리소바야 이시구후 (소바)"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_be3483800ebf06b8', 'trip_okinawa_20260505', '오하코르테', '교통', '4.3', '1,013', '타르트', NULL, 'google-maps-md', NULL, NULL, 26.262496, 127.7153399, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":21,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (oHacorte Okinawa)"}],"aliases":["오하코르테"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_abfd36c82dbb9871', 'trip_okinawa_20260505', '플라우만스 런치 베이커리', '교통', '4.5', '496', NULL, NULL, 'google-maps-md', NULL, NULL, 26.2944131, 127.7916172, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":22,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Ploughman''s Lunch Bakery Okinawa)"}],"aliases":["플라우만스 런치 베이커리"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_8026872b0f499532', 'trip_okinawa_20260505', '산스시', '교통', '4.2', '594', NULL, NULL, 'google-maps-md', NULL, NULL, 26.291952, 127.794113, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":23,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県中頭郡北中城村荻道150-3)"}],"aliases":["산스시"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_e9b55b61f29deb0f', 'trip_okinawa_20260505', '와규 카페 카푸카', '교통', '4.4', '954', NULL, NULL, 'google-maps-md', NULL, NULL, 26.3203643, 127.7535511, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":24,"categoryRaw":"¥1,000~2,000 · 음식점","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Wagyu Cafe Kapuka Chatan Okinawa)"}],"aliases":["와규 카페 카푸카"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_1f3d947c39c84cab', 'trip_okinawa_20260505', '씨사이드 카페 하논', '교통', '4.6', '852', '팬케이크', NULL, 'google-maps-md', NULL, NULL, 26.3161314, 127.7538932, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":25,"categoryRaw":"¥1,000~2,000 · 팬케이크","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Seaside Cafe Hanon Chatan Okinawa)"}],"aliases":["씨사이드 카페 하논"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_30340958990a1f4d', 'trip_okinawa_20260505', '포크타마고 오니기리', '음식', '4.4', '1,307', '오니기리', NULL, 'google-maps-md', NULL, NULL, 26.215151, 127.6880064, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":26,"categoryRaw":"¥1~1,000 · 아침식사","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (ポークたまごおにぎり本店 那覇)"}],"aliases":["포크타마고 오니기리"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_db541de2287e9882', 'trip_okinawa_20260505', '반타 카페 by 호시노 리조트', '호텔', '4.5', '2,154', '뷰맛집카페', NULL, 'google-maps-md', NULL, NULL, 26.417427, 127.718498, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":27,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県中頭郡読谷村儀間560)"}],"aliases":["반타 카페 by 호시노 리조트"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_c8d2553925950f60', 'trip_okinawa_20260505', '스마일스푼', '음식', '4.7', '206', '양식 다이닝 , 양적음 ㅜ', NULL, 'google-maps-md', NULL, NULL, 26.646774, 127.958939, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":28,"categoryRaw":"¥2,000~3,000 · 미국 서부 요리","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町伊豆味2795-1)"}],"aliases":["스마일스푼"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_08e078e8f5050b27', 'trip_okinawa_20260505', '농원찻집 시키노아야', '교통', '4.4', '90', '일본식 가정식', NULL, 'google-maps-md', NULL, NULL, 26.652498, 127.947823, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":29,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡本部町伊豆味371-1)"}],"aliases":["농원찻집 시키노아야"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_ce5bc8673d7564a2', 'trip_okinawa_20260505', '쿠니가미 미나토 쇼쿠도', '음식', '4.5', '1,296', '해산물 식당', NULL, 'google-maps-md', NULL, NULL, 26.7212229, 128.1584623, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":30,"categoryRaw":"¥1,000~2,000 · 해산물 요리","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (国頭港食堂 沖縄)"}],"aliases":["쿠니가미 미나토 쇼쿠도"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_454159a85c568030', 'trip_okinawa_20260505', '빅익스프레스', '쇼핑', '4.1', '1,956', '저녁마트, 근처 다이소 있음', NULL, 'google-maps-md', NULL, NULL, 26.6534599, 127.8798658, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":32,"categoryRaw":"할인점","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (The Big Express Motobu Okinawa)"}],"aliases":["빅익스프레스"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_abb98865c033f5fd', 'trip_okinawa_20260505', '아포가마', '관광', '4.6', '181', '날씨 안좋을때도 스노쿨링가능', NULL, 'google-maps-md', NULL, NULL, 26.485386, 127.858391, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":33,"categoryRaw":"관광 명소","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡恩納村恩納4484)"}],"aliases":["아포가마"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_2ea6b0abee8bf50d', 'trip_okinawa_20260505', 'Suehiro Blues', '교통', '4.0', '298', NULL, NULL, 'google-maps-md', NULL, NULL, 26.21446, 127.6875, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":35,"categoryRaw":"₩₩ · 이자카야","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県那覇市松尾2-7-20)"}],"aliases":["Suehiro Blues"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_a63e8a1890beb384', 'trip_okinawa_20260505', '레스토랑 플리퍼', '음식', '4.4', '3,243', '스테쿠', NULL, 'google-maps-md', NULL, NULL, 26.5948181, 127.9594362, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":36,"categoryRaw":"¥3,000~4,000 · 스테이크","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Restaurant Flipper Nago Okinawa)"}],"aliases":["레스토랑 플리퍼"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_652052ca3763a77c', 'trip_okinawa_20260505', 'Kurumaebi Kitchen TAMAYA', '음식', '4.5', '821', NULL, NULL, 'google-maps-md', NULL, NULL, 26.670431, 128.001312, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":37,"categoryRaw":"¥2,000~3,000 · 일식","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県名護市運天原285)"}],"aliases":["Kurumaebi Kitchen TAMAYA"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_47e4214129c9cb70', 'trip_okinawa_20260505', '유키노', '음식', '4.5', '1,079', NULL, NULL, 'google-maps-md', NULL, NULL, 26.5937856, 127.9649912, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":38,"categoryRaw":"¥1,000~2,000 · 일식","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Yukino restaurant Okinawa)"}],"aliases":["유키노"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_e657f95c1e8d55b8', 'trip_okinawa_20260505', '스시로 이토만 니시자키점', '음식', '3.8', '1,444', NULL, NULL, 'google-maps-md', NULL, NULL, 26.1430329, 127.6609682, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":39,"categoryRaw":"¥1,000~2,000 · 초밥","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (Sushiro Itoman Nishizaki)"}],"aliases":["스시로 이토만 니시자키점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_1b4174330429807e', 'trip_okinawa_20260505', '삿짱 소바', '음식', '4.5', '1,539', NULL, NULL, 'google-maps-md', NULL, NULL, 26.59399, 127.974701, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":40,"categoryRaw":"¥1~1,000 · 국수 전문점","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県名護市大南2-11-3)"}],"aliases":["삿짱 소바"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_0e06a5059562f631', 'trip_okinawa_20260505', 'StandardProducts', '쇼핑', '4.3', '40', '그릇쇼핑', NULL, 'google-maps-md', NULL, NULL, 26.314575, 127.796043, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":41,"categoryRaw":"잡화점","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県中頭郡北中城村字ライカム1 イオンモール沖縄ライカム店2階)"}],"aliases":["StandardProducts"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_a228237a2083d902', 'trip_okinawa_20260505', 'Oodomari Beach', '관광', '4.1', '1,107', '스노쿨링', NULL, 'google-maps-md', NULL, NULL, 26.3935719, 127.9911225, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":42,"categoryRaw":"해변","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (大泊ビーチ うるま)"}],"aliases":["Oodomari Beach"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_25b62e1b06dfb365', 'trip_okinawa_20260505', '나고 파인애플 파크', '관광', '3.9', '10,526', NULL, NULL, 'google-maps-md', NULL, NULL, 26.6165795, 127.9708586, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":43,"categoryRaw":"테마파크","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (ナゴパイナップルパーク)"}],"aliases":["나고 파인애플 파크"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_80fa4ebedfe538da', 'trip_okinawa_20260505', '코우리 오션타워', '관광', '4.3', '12,592', NULL, NULL, 'google-maps-md', NULL, NULL, 26.6995856, 128.0245384, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":44,"categoryRaw":"전망대","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (古宇利オーシャンタワー)"}],"aliases":["코우리 오션타워"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_66e280dbc1959451', 'trip_okinawa_20260505', 'CASA SOL', '교통', '4.5', '387', NULL, NULL, 'google-maps-md', NULL, NULL, 26.653025, 127.98143, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":45,"categoryRaw":"¥1,000~2,000 · 카페","coordinateSource":"검색 보강: 국토지리원 주소 검색 (沖縄県国頭郡今帰仁村湧川661)"}],"aliases":["CASA SOL"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_d126e44f8d5b33ea', 'trip_okinawa_20260505', '비세자키', '관광', '4.5', '1,751', '스노쿨링', NULL, 'google-maps-md', NULL, NULL, 26.7121307, 127.8766805, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":46,"categoryRaw":"명승지","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (備瀬崎 沖縄)"}],"aliases":["비세자키"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_8e8ff11ddc44063b', 'trip_okinawa_20260505', '토구치항', '교통', '4.2', '45', NULL, NULL, 'google-maps-md', NULL, NULL, 26.6592346, 127.8899352, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":47,"categoryRaw":"페리/국내여객선","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (渡久地港 本部町)"}],"aliases":["토구치항"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_a688bd6f8843bc39', 'trip_okinawa_20260505', '코우리해변', '관광', '4.4', '4,398', NULL, NULL, 'google-maps-md', NULL, NULL, 26.694528, 128.0209461, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":48,"categoryRaw":"해변","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (古宇利ビーチ)"}],"aliases":["코우리해변"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_5a3da0f50bfe0aa8', 'trip_okinawa_20260505', '민나 섬', '관광', '4.5', '32', NULL, NULL, 'google-maps-md', NULL, NULL, 26.6476712, 127.8179109, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":52,"categoryRaw":"섬","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (水納島 本部町 沖縄)"}],"aliases":["민나 섬"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_34398e02f57555cb', 'trip_okinawa_20260505', '돈키호테 국제거리점', '쇼핑', '3.8', '11,642', NULL, NULL, 'google-maps-md', NULL, NULL, 26.2150682, 127.6840298, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":53,"categoryRaw":"할인점","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (ドン・キホーテ 国際通り店)"}],"aliases":["돈키호테 국제거리점"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_ea944bef7153fe91', 'trip_okinawa_20260505', '야치문 킷사 시사엔', '임시 휴업', '4.5', '466', NULL, NULL, 'google-maps-md', NULL, NULL, 26.643861, 127.9412569, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":54,"categoryRaw":"임시 휴업","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (やちむん喫茶シーサー園 沖縄)"}],"aliases":["야치문 킷사 시사엔"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES ('place_okinawa_68829529b10b65a9', 'trip_okinawa_20260505', '백년고가 우후야', '음식', '4.1', '5,770', NULL, NULL, 'google-maps-md', NULL, NULL, 26.6210197, 127.9636378, 'ready', '{"sources":[{"sourceFile":"오키나와 조사 장소.md","originalIndex":55,"categoryRaw":"₩₩ · 음식점","coordinateSource":"검색 보강: OpenStreetMap/Nominatim (百年古家 大家 名護)"}],"aliases":["백년고가 우후야"]}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_be7a145c75839a2d', 'day_okinawa_20260505_1', NULL, 'custom', '❤️먹거리 모음.zip🍣🍜🍡🍢🍦', '메모', NULL, NULL, '❤️먹거리 모음.zip🍣🍜🍡🍢🍦

밥
- 오키나와 소바
- 라후테(돼지고기 조림)
- 테비치(족발)
- 간소우미부도혼텐(바다포도 밥)
- 히라야치(오키나와식 부침개)
(아래 스크롤 하면 더 보임)

이색음식
- 이라부지루(바다뱀)
- 이카스미지루(오징어먹물스프)
- 미미가(삶은 돼지귀), 치라가(돼지얼굴 포)
- 스쿠가라스(치어+두부)

간식
- 블루씰 아이스크림
- 사타안다기(도넛)
- 레몬케이크
- 베니이모(자색고구마 타르트)
- 산도(소금샌드)
- 소금과자(친스코)
- 젠자이(흑설탕 빙수)', NULL, NULL, 10, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_e0764c80423d9acf', 'day_okinawa_20260505_1', NULL, 'transport', '항공편: ICN 09:45 - OKA 12:05', '항공편', '09:45', NULL, '- 항공사: 진에어 LJ341', NULL, NULL, 20, 0, '{"source":"triple-schedule-md","heading":"항공편: ICN 09:45 - OKA 12:05"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_a3f8b9c43c84270d', 'day_okinawa_20260505_1', 'place_okinawa_05edc94024f7ed03', 'transport', '나하 공항', '교통', '12:05', NULL, '한국, 중국, 대만과 일본 내륙을 오가는 오키나와의 대표적인 국제공항

지역: 나하', 26.200129699999998, 127.64664519999998, 30, 0, '{"source":"triple-schedule-md","heading":"12:05 1. 나하 공항","originalCategory":"관광명소","region":"나하","description":"한국, 중국, 대만과 일본 내륙을 오가는 오키나와의 대표적인 국제공항"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_1a6550e868f71f22', 'day_okinawa_20260505_1', 'place_okinawa_1c27e72b16341a10', 'poi', 'タイムズカー那覇空港店', '관광', '12:30', NULL, '지역: 나하

셔틀버스 승차장 11번에서 직원이 기다리고 있습니다.
  
  【출발 시】국내선 도착/국제선 도착: 국내선 출구→횡단보도⇒셔틀버스 승차장 11번
  ※나하공항에서 매장까지 셔틀버스로 송영합니다 (약 1.5Km)
  
  【귀착 시】※비행 시간 90분 전을 기준으로 반납(매장에서 공항까지 셔틀 제공: 약 3분)
  
  ✔️보험 제일 비싼걸로 들었슴
  etc단말기는 무료로 빌렸는데 카드는 현장에서 빌릴수있는지 물어보기
  전화통화시 한국어 가능하냐 물어보면 한국어 가능직원 바꿔줄수도..?', 26.2108782, 127.6581071, 40, 0, '{"source":"triple-schedule-md","heading":"12:30 2. タイムズカー那覇空港店","originalCategory":"테마/체험","region":"나하","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_8acdfd19afb5313d', 'day_okinawa_20260505_1', 'place_okinawa_8cee59fd6e105802', 'poi', '아라하 비치 파크', '관광', NULL, NULL, '여유로운 산책을 즐기며 아름다운 일몰을 감상할 수 있는 해변 공원

지역: 차탄

무료주차장: 비치바로뒤 / 해피볼 카페 인근 주차장', 26.304431, 127.758551, 50, 0, '{"source":"triple-schedule-md","heading":"3. 아라하 비치 파크","originalCategory":"관광명소","region":"차탄","description":"여유로운 산책을 즐기며 아름다운 일몰을 감상할 수 있는 해변 공원"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_80570209e74d0a90', 'day_okinawa_20260505_1', 'place_okinawa_d31d5a7b108997ce', 'transport', '해피 보울스 오키나와', '교통', NULL, NULL, '야자수로 우거진 테라스가 하와이에 온듯한 분위기를 풍기는 카페

지역: 차탄

아사히 볼, 피크닉 용품무료대여
  ㄴ스노쿨링, 파라솔 대여가능
  
  ㄴHappy bowls araha', 26.306479, 127.7599861, 60, 0, '{"source":"triple-schedule-md","heading":"4. 해피 보울스 오키나와","originalCategory":"카페/디저트","region":"차탄","description":"야자수로 우거진 테라스가 하와이에 온듯한 분위기를 풍기는 카페"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_43c1673aacdc0466', 'day_okinawa_20260505_1', 'place_okinawa_df6fb35e3b65da11', 'poi', '미하마 아메리칸 빌리지', '관광', NULL, NULL, '볼거리와 즐길거리가 넘쳐나는 미국풍 복합 쇼핑 타운

지역: 차탄', 26.31599542178522, 127.75402950923154, 70, 0, '{"source":"triple-schedule-md","heading":"5. 미하마 아메리칸 빌리지","originalCategory":"관광명소","region":"차탄","description":"볼거리와 즐길거리가 넘쳐나는 미국풍 복합 쇼핑 타운"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_aa1afea804502b6c', 'day_okinawa_20260505_1', 'place_okinawa_f5e5607c68e84f63', 'transport', '이온몰 오키나와 라이카무 점', '교통', NULL, NULL, '220개 이상의 다양한 매장이 입점한 오키나와 최대 규모의 쇼핑몰

지역: 차탄

초대형마트.. 밥, 장보기, 쇼핑 그 무엇이든/포켓몬센터💛
  ㄴ주차무료
  
  야식, 다음날 물놀이할때 먹을간식같은거 미리사면 좋을듯', 26.3137504, 127.7966025, 80, 0, '{"source":"triple-schedule-md","heading":"6. 이온몰 오키나와 라이카무 점","originalCategory":"쇼핑","region":"차탄","description":"220개 이상의 다양한 매장이 입점한 오키나와 최대 규모의 쇼핑몰"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_a2b83a1c1204c1ab', 'day_okinawa_20260505_1', 'place_okinawa_0fa62364cb085206', 'poi', '이온 빅 익스프레스 하닌스 기노완 점', '쇼핑', NULL, NULL, '합리적인 가격에 신선한 식재료와 식료품을 구입할 수 있는 마트

지역: 차탄

ㄴ음식종류 많고 쌈
  소고기 , 회 초밥류 쌈
  
  옆에 다이소', 26.2864482, 127.7469493, 90, 0, '{"source":"triple-schedule-md","heading":"7. 이온 빅 익스프레스 하닌스 기노완 점","originalCategory":"쇼핑","region":"차탄","description":"합리적인 가격에 신선한 식재료와 식료품을 구입할 수 있는 마트"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_d0b1c14608eaa8dc', 'day_okinawa_20260505_1', 'place_okinawa_eed9a89da3e7951f', 'poi', 'BEB5 오키나와 세라가키 바이 호시노 리조트', '호텔', '15:00', NULL, '지역: 중부

- 스위트룸(싱글침대2, 소파베드2)
  - 취사가능, 전자렌지
  - 객실내 세탁기 있음
  - 수영장, 사우나
  - 다이슨 드라이기 ㅋㅋ
  - 자전거 무료 대여', 26.50338, 127.862488, 100, 0, '{"source":"triple-schedule-md","heading":"15:00 8. BEB5 오키나와 세라가키 바이 호시노 리조트","originalCategory":null,"region":"중부","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_1063e34516128bdf', 'day_okinawa_20260505_1', 'place_okinawa_e344b1fcdf5ddf8e', 'poi', '만좌모', '관광', NULL, NULL, '자연이 만들어낸 절경을 감상할 수 있는 ''코끼리 절벽''

지역: 중부

무료주차, 입장료 100엔
  
  1.날씨 좋을때 꼭꼭 썬크림 꼼꼼히!!!
  엄청 탐. 목 뒤도 바르삼.
  2.점심시간~ 오후4시까지는 관광버스 대절해서 중국관광객들 넘 많음
  3.입장권 파는 건물안에 무료로 사진스페이스 있는데 줄 짧으면 꼭 찍기
  4.건물 2층에서 파는 오키나와 튀김 도너츠 존맛이라함', 26.505252564221784, 127.85047547020514, 110, 0, '{"source":"triple-schedule-md","heading":"9. 만좌모","originalCategory":"관광명소","region":"중부","description":"자연이 만들어낸 절경을 감상할 수 있는 ''코끼리 절벽''"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_f9716be1aeb54ed2', 'day_okinawa_20260505_2', NULL, 'custom', '북부투어', '메모', NULL, NULL, '북부투어', NULL, NULL, 10, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_60b039d03757686d', 'day_okinawa_20260505_2', 'place_okinawa_eed9a89da3e7951f', 'poi', 'BEB5 오키나와 세라가키 바이 호시노 리조트', '호텔', NULL, NULL, '지역: 중부', 26.50338, 127.862488, 20, 0, '{"source":"triple-schedule-md","heading":"1. BEB5 오키나와 세라가키 바이 호시노 리조트","originalCategory":null,"region":"중부","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_60b1aea4f352c6ed', 'day_okinawa_20260505_2', 'place_okinawa_31b08dfcb5b0c048', 'poi', '고릴라 촙', '관광', NULL, NULL, '지역: 북부

주차비 : 무료 (17:00마감)
  샤워비 : 3분에 100엔 (15:30마감)
  ㄴ세면용품, 수건지참하기, 온수나옴
  바깥 간이 샤워장은 찬물만나옴
  
  접근로: 방파제쪽으로! 비치쪽에는 물고기 없음.. 콘크리트 계단이라 이끼 등에 미끄러지지 않게 조심! 계단에서 바로 물로 들어가자마자 약간 수심이 깊어지니 주의
  
  간조에서 만조로 바뀌는 시점에 해수가 유입되며 시야가 많이 탁해지는 현상발생
  해안 근처보다는 약간 멀리 나가야 좋은 시야확보 및 발달된 산호군락,다양한 어종 관찰가능', 26.63618749999999, 127.8830625, 30, 0, '{"source":"triple-schedule-md","heading":"2. 고릴라 촙","originalCategory":"관광명소","region":"북부","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_4495f2fde93eace7', 'day_okinawa_20260505_2', 'place_okinawa_4963691f8c8c6b38', 'poi', '오키나와 츄라우미 수족관', '관광', NULL, NULL, '다양한 해양 생물과 더불어 돌고래 쇼를 볼 수 있는 대형 수족관

지역: 북부

8:30~18:30 (입장마감 17:30)
  ㄴ관람 소요시간 2시간
  ㄴ4시이후 티켓 저렴
  ✅ 열대어 : 오후 1시 & 3시 반
  ✅ 고래상어 : 오전 9시 반 & 오후 3시 & 5시
  ✅ 돌고래 : 공연 시작 20분 전 도착 추천(약 20분간 진행)
  - 10:30, 11:30, 13:00, 15:00, 17:00 - 앞자리 착석 시 수건 지참 추천
  ✅다이버 쇼(약 15분간 진행)
  - 12:00, 14:00, 15:30
  
  아침 오픈시간 맞춰 수족관가서 구경하고 밥먹고 고릴라춉 스노쿨링???', 26.694338, 127.8780131, 40, 0, '{"source":"triple-schedule-md","heading":"3. 오키나와 츄라우미 수족관","originalCategory":"테마/체험","region":"북부","description":"다양한 해양 생물과 더불어 돌고래 쇼를 볼 수 있는 대형 수족관"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_07f0d9971a9d5d3c', 'day_okinawa_20260505_2', NULL, 'custom', '츄라우미 수족관 카페 꿀팁', '메모', NULL, NULL, '츄라우미 수족관 카페 꿀팁
1. 입장하자마자 카페로 달려 키오스크부터 확인하세요.
2. 대기를 걸어두고 나서, 주변 상어 수족관
과
지나쳤던 수조들을 구경하는 시간을 가져요!
3. 구경하다 보면 차례가 오는데, 이때 자리에 앉아 고래상어를 보면서 물멍 타임을 누려봐요!', NULL, NULL, 50, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_a483480e1abd7f3f', 'day_okinawa_20260505_2', NULL, 'custom', '츄라우미 근처 먹', '메모', NULL, NULL, '츄라우미 근처 먹
ㄴ카페 오션블루 (식당겸 카페, 사람많음)
ㄴ뷔페 레스토랑 (오션블루보다는 적음, 인당 2200엔)
ㄴ차하야 불란: 츄라우미 근처 팬케이크', NULL, NULL, 60, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_fccf4a6a0c625a96', 'day_okinawa_20260505_2', 'place_okinawa_de84a3f78f021815', 'poi', 'Jungle Photo Land亜熱帯サウナ', '나만의 장소', NULL, NULL, '느좋 커피집
  (아열대사우나+카페)', 26.641910552978516, 127.95207214355469, 70, 0, '{"source":"triple-schedule-md","heading":"4. Jungle Photo Land亜熱帯サウナ","originalCategory":"나만의 장소","region":null,"description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_31c3754fba0116d6', 'day_okinawa_20260505_2', 'place_okinawa_c493d08b7ee6e352', 'transport', '야치문 킷샤', '교통', NULL, NULL, '드라마 ''괜찮아, 사랑이야'' 촬영 장소로 잘 알려진 자연 속 카페

지역: 북부', 26.6438348, 127.9411989, 80, 0, '{"source":"triple-schedule-md","heading":"5. 야치문 킷샤","originalCategory":"카페/디저트","region":"북부","description":"드라마 ''괜찮아, 사랑이야'' 촬영 장소로 잘 알려진 자연 속 카페"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_cd7b1e414469d5ab', 'day_okinawa_20260505_2', 'place_okinawa_f2b1fef1f7a1c840', 'poi', '비세 후쿠기 가로수길', '관광', NULL, NULL, '1,000여 그루 고목 사잇길에서 즐기는 산림욕

지역: 북부', 26.7007146, 127.8799436, 90, 0, '{"source":"triple-schedule-md","heading":"6. 비세 후쿠기 가로수길","originalCategory":"관광명소","region":"북부","description":"1,000여 그루 고목 사잇길에서 즐기는 산림욕"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_2697f0a9ec29a6a3', 'day_okinawa_20260505_2', 'place_okinawa_3ee38dc217265cbd', 'transport', '코우리 대교', '교통', NULL, NULL, '''코우리 섬''으로 갈 수 있는 해변 드라이브 코스

지역: 북부

날씨안좋으면 pass
  쾌청할때 가야좋음 아니면 그닥이라함', 26.6788745, 128.0128861, 100, 0, '{"source":"triple-schedule-md","heading":"7. 코우리 대교","originalCategory":"관광명소","region":"북부","description":"''코우리 섬''으로 갈 수 있는 해변 드라이브 코스"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_22d89d6e28159c19', 'day_okinawa_20260505_2', 'place_okinawa_69ccbba8c1c5543d', 'poi', '헤도 곶', '관광', NULL, NULL, '해안 절경을 감상할 수 있는 오키나와 최북단의 전망대

지역: 북부

여유되면 드라이브', 26.872222952994218, 128.26403973554724, 110, 0, '{"source":"triple-schedule-md","heading":"8. 헤도 곶","originalCategory":"관광명소","region":"북부","description":"해안 절경을 감상할 수 있는 오키나와 최북단의 전망대"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_38850e7a16f8f0e1', 'day_okinawa_20260505_3', NULL, 'custom', '푸른동굴 갔다가 남부투어~', '메모', NULL, NULL, '푸른동굴 갔다가 남부투어~', NULL, NULL, 10, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_522dc3f4a10f1690', 'day_okinawa_20260505_3', 'place_okinawa_eed9a89da3e7951f', 'poi', 'BEB5 오키나와 세라가키 바이 호시노 리조트', '호텔', '11:00', NULL, '지역: 중부', 26.50338, 127.862488, 20, 0, '{"source":"triple-schedule-md","heading":"11:00 1. BEB5 오키나와 세라가키 바이 호시노 리조트","originalCategory":null,"region":"중부","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_9628aaa26d62a1ff', 'day_okinawa_20260505_3', 'place_okinawa_659a9cd6832806ee', 'poi', '푸른동굴렌탈冒険島', '나만의 장소', '08:00', NULL, '★ 소요시간 약 2.5시간 투어입니다 ♪
  
  ◯업체집합 (08:00)
  접수 후, 기재 사이즈를 맞추고 탈의실에서 옷을 갈아입습니다.귀중품은 매장 내 사물함에서 보관합니다(무료).갈아입을 옷이나 짐 보관소도 전용 선반을 준비하고 있습니다.동행자 분들은 매장 내에서 기다리실 수도 있습니다.
  ↓
  ◯ [항구로 이동하여 스노클 설명 (렉처)]
  항구까지 도보 1분.수영이 서투른 분이나 어린이 등 고객의 페이스에 맞춰 전속 가이드가 사용하는 장비를 사용하여 천천히 친절하게 설명!요청사항도 편하게 말씀해주세요.
  ↓
  
  ◯보트로 푸른 동굴로 이동
  보트 타고 5분이면 포인트 도착! ♪ 장비 장착 등 모두 도와드리겠습니다.
  ↓
  ◯ 스노클링 투어 (약 40~50분)
  전속 가이드가 여러분을 물속으로 천천히 에스코트.푸른 동굴의 신비로운 경치, 많은 열대어들과의 시간을 즐겨보세요.유영 시간 듬뿍!모험섬을 고집하는 스케줄.회전율보다 서비스 내용 중시!
  ↓
  ◯귀항·가게로 이동
  매장 내 샤워실, 탈의실, 파우더룸을 이용해주세요.샴푸, 린스, 바디워시, 스킨, 로션, 드라이기 모두 무료로 이용 가능합니다.
  ↓
  ◯투어 사진 전달·해산(10:30)
  사진 매수 무제한(평균 50매 정도입니다만, 많은 사진 촬영이나 동영상 촬영을 희망하시는 분은 주저하지 말고 리퀘스트 해 주세요) 그 자리에서 스마트폰으로 모든 사진을 데이터 전송합니다.
  
  [플랜명]
  푸른 동굴 스노클링【보트 개최】
  
  [집합장소 안내]
  주소 : 오키나와현 구니가미군 온나무라마에카네히사149
  MAP:https://goo.gl/maps/8GJUJzN9RS22
  
  [준비물]
  수영복 목욕타월 샌들
  
  ◆ 취소 정책
  ·전일,당일 취소수수료: 100%
  ※날씨나 해황 악화로 인한 중지, 태풍 등 자연재해, 항공 및 선박의 결항 등 부득이한 사정으로 인한 취소에 대해서는 취소 수수료가 부과되지 않습니다.
  
  ◆ 안전에 관한 부탁
  참가신청서의 ''건강상태 확인''에 해당하는 항목이 있는 분은 당일 투어 참가를 거절하고 있습니다.
  반드시 참가자 전원 사전에 참가 신청서를 확인해 주시기 바랍니다.
  （参加申込書 https://www.bokenjima.jp/web/wp-content/uploads/2025/03/SNA.pdf）
  
  병력에 ''YES'' 해당 항목이 있는 분
  ·사전에 의사의 진단을 받으셔야 합니다.
  ·아래에서 병력진단서를 인쇄하여 의사의 진단과 서명을 받아 당일 지참하여 주시기 바랍니다.
  （病歴診断書 https://www.bokenjima.jp/web/wp-content/uploads/2025/02/SNM.pdf）
  
  주소 : 오키나와현 구니가미군 온나무라마에카네히사149
  [운영시간 8:00~18:00]
  TEL/FAX: 098-989-3511
  (영업시간외 연락처) 080-7826-0388', 26.447439193725586, 127.80436706542969, 30, 0, '{"source":"triple-schedule-md","heading":"08:00 2. 푸른동굴렌탈冒険島","originalCategory":"나만의 장소","region":null,"description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_d90700bd272ec1cb', 'day_okinawa_20260505_3', 'place_okinawa_3eb6e149cf645a53', 'poi', '푸른 동굴', '관광', NULL, NULL, '지역: 중부

<업체이용료 포함사항>
  강사 개별 가이드 비용
  ·모든 기자재 대여료
  ·보트 승선료
  ·보험료(배상보험, 상해보험)
  ·사진 및 동영상 촬영 비용(~50장 정도)
  ·시설 사용료(샤워,주차)
  
  
  <업체이용 안할시>
  샤워장 3분 100엔
  주차장 시간당 100엔', 26.4434485, 127.7725524, 40, 0, '{"source":"triple-schedule-md","heading":"3. 푸른 동굴","originalCategory":"관광명소","region":"중부","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_c490be322058f1d9', 'day_okinawa_20260505_3', 'place_okinawa_9a1a20c176208cf4', 'transport', '블루 씰 마키미나토 점', '교통', NULL, NULL, '다양한 종류의 아이스크림과 크레페를 판매하는 디저트 전문점

지역: 차탄

본점 특별메뉴 묵어보자', 26.266979, 127.721576, 50, 0, '{"source":"triple-schedule-md","heading":"4. 블루 씰 마키미나토 점","originalCategory":"카페/디저트","region":"차탄","description":"다양한 종류의 아이스크림과 크레페를 판매하는 디저트 전문점"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_f4f30ef2e88d8d49', 'day_okinawa_20260505_3', 'place_okinawa_e0e5b9c124359822', 'poi', '슈리성', '관광', NULL, NULL, '화재로 인해 큰 피해를 입은 오키나와의 상징

지역: 나하

pass가능', 26.217044899999998, 127.71948330000001, 60, 0, '{"source":"triple-schedule-md","heading":"5. 슈리성","originalCategory":"관광명소","region":"나하","description":"화재로 인해 큰 피해를 입은 오키나와의 상징"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_04dbd2f6b356cd87', 'day_okinawa_20260505_3', 'place_okinawa_fecb6122a00fdbc9', 'meal', '스이 둔치', '음식', NULL, NULL, '지역: 나하', 26.2145438, 127.7141863, 70, 0, '{"source":"triple-schedule-md","heading":"6. 스이 둔치","originalCategory":"음식점","region":"나하","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_139d5f4bdfa8c5a5', 'day_okinawa_20260505_3', 'place_okinawa_3ace96931657c47b', 'poi', '더 네스트 나하', '기타', '15:00', NULL, '2025년 7월 오픈한, 나하 관광에 편리한 호텔

지역: 나하

- Corner Deluxe Double Room 2개
  - 조식 인당 2만원
  - 6-8pm 수영장옆 무제한 무료주류
  - 코인 세탁기 ?층, 전자렌지는 3층
  - 국제거리 인근
  - 유료 주차장 1박 1.8만', 26.21257, 127.671891, 80, 0, '{"source":"triple-schedule-md","heading":"15:00 7. 더 네스트 나하","originalCategory":null,"region":"나하","description":"2025년 7월 오픈한, 나하 관광에 편리한 호텔"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_d1ccc59ccaff9439', 'day_okinawa_20260505_3', NULL, 'custom', '주차비 1.8만원', '메모', NULL, NULL, '주차비 1.8만원', NULL, NULL, 90, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_c695d919aa09e459', 'day_okinawa_20260505_3', 'place_okinawa_74d2c729bc5688fd', 'poi', '나하 국제 거리', '쇼핑', NULL, NULL, '쇼핑부터 먹거리와 축제까지 모두 한곳에서 즐길 수 있는 오키나와 대표 번화가

지역: 나하

현금만 받는곳 많음
  면세되는곳 있을수있어서 여권지참', 26.216143300000002, 127.6880667, 100, 0, '{"source":"triple-schedule-md","heading":"8. 나하 국제 거리","originalCategory":"쇼핑","region":"나하","description":"쇼핑부터 먹거리와 축제까지 모두 한곳에서 즐길 수 있는 오키나와 대표 번화가"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_faaa2fa6cdc55520', 'day_okinawa_20260505_3', 'place_okinawa_366a52247afb6e20', 'poi', '츠보야 도자기 거리', '관광', NULL, NULL, '오키나와 전통 도자기 공방들이 모여 있는 거리

지역: 나하', 26.2130933, 127.6912774, 110, 0, '{"source":"triple-schedule-md","heading":"9. 츠보야 도자기 거리","originalCategory":"관광명소","region":"나하","description":"오키나와 전통 도자기 공방들이 모여 있는 거리"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_00548c7e33e51feb', 'day_okinawa_20260505_3', 'place_okinawa_9443eebd0f7cac86', 'transport', '우미카지 테라스', '교통', NULL, NULL, '탁 트인 바다를 배경 삼아 여행을 즐길 수 있는 지중해풍 쇼핑 단지

지역: 남부

저녁이나먹자', 26.1766603, 127.6404367, 120, 0, '{"source":"triple-schedule-md","heading":"10. 우미카지 테라스","originalCategory":"쇼핑, 관광명소","region":"남부","description":"탁 트인 바다를 배경 삼아 여행을 즐길 수 있는 지중해풍 쇼핑 단지"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_0f22447e588fb6a8', 'day_okinawa_20260505_3', 'place_okinawa_b4d162057357b3ee', 'poi', '돈키호테 나하 츠보가와 점', '쇼핑', NULL, NULL, '대형 주차장 구비와 새벽까지 영업해 편리하게 쇼핑하기 좋은 드럭 스토어

지역: 나하

국제거리점 보다 여기가 더 싸다함', 26.2080336, 127.677485, 130, 0, '{"source":"triple-schedule-md","heading":"11. 돈키호테 나하 츠보가와 점","originalCategory":"쇼핑","region":"나하","description":"대형 주차장 구비와 새벽까지 영업해 편리하게 쇼핑하기 좋은 드럭 스토어"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_174dadf4ebbcfbd8', 'day_okinawa_20260505_3', 'place_okinawa_ade5ca697d8858da', 'poi', '파르코 시티', '쇼핑', NULL, NULL, '지역: 나하

쇼핑', 26.2617542, 127.6981799, 140, 0, '{"source":"triple-schedule-md","heading":"12. 파르코 시티","originalCategory":"쇼핑","region":"나하","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_155ea6b3a7784158', 'day_okinawa_20260505_4', NULL, 'custom', '11시에 체크아웃하고 출발!', '메모', NULL, NULL, '11시에 체크아웃하고 출발!
렌트카 지정주유소 주유 후 반납
렌트카 반납하고 체크인하고
공항에서 밥묵쟈!
(50분전 카운터 수속마감 12:25수속마감)', NULL, NULL, 10, 0, '{"source":"triple-schedule-md","heading":"메모"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_e22e62dd72e483d5', 'day_okinawa_20260505_4', 'place_okinawa_3ace96931657c47b', 'poi', '더 네스트 나하', '기타', '11:00', NULL, '2025년 7월 오픈한, 나하 관광에 편리한 호텔

지역: 나하

차타고 공항까지 5-10분
  유어레일 타고 공항까지 15분
  ㄴ인당 290엔', 26.21257, 127.671891, 20, 0, '{"source":"triple-schedule-md","heading":"11:00 1. 더 네스트 나하","originalCategory":null,"region":"나하","description":"2025년 7월 오픈한, 나하 관광에 편리한 호텔"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_4404acc5d415c11d', 'day_okinawa_20260505_4', 'place_okinawa_1c27e72b16341a10', 'poi', 'タイムズカー那覇空港店', '관광', '11:10', NULL, '지역: 나하

시내에서 전날 싸게 주유하고
  당일 지정주유소 들러서 주유후 반납', 26.2108782, 127.6581071, 30, 0, '{"source":"triple-schedule-md","heading":"11:10 2. タイムズカー那覇空港店","originalCategory":"테마/체험","region":"나하","description":null}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_a9e7689aa559792a', 'day_okinawa_20260505_4', 'place_okinawa_05edc94024f7ed03', 'transport', '나하 공항', '교통', '11:30', NULL, '한국, 중국, 대만과 일본 내륙을 오가는 오키나와의 대표적인 국제공항

지역: 나하', 26.200129699999998, 127.64664519999998, 40, 0, '{"source":"triple-schedule-md","heading":"11:30 3. 나하 공항","originalCategory":"관광명소","region":"나하","description":"한국, 중국, 대만과 일본 내륙을 오가는 오키나와의 대표적인 국제공항"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES ('item_okinawa_0506727f954d117b', 'day_okinawa_20260505_4', NULL, 'transport', '항공편: OKA 13:15 - ICN 15:30', '항공편', '13:15', NULL, '- 항공사: 진에어 LJ342', NULL, NULL, 50, 0, '{"source":"triple-schedule-md","heading":"항공편: OKA 13:15 - ICN 15:30"}', '2026-04-29T05:13:08.763Z', '2026-04-29T05:13:08.763Z');

COMMIT;
