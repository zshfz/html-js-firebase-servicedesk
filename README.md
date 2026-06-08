# 카카오모빌리티 IT서비스데스크 방문자 기록 시스템 (Html + JavaScript + Firebase)
## 1. 프로젝트 개요
* IT 서비스데스크 방문자의 QR 접수 내역을 실시간으로 확인하고 처리 내역을 관리하는 웹 애플리케이션
* Firebase Cloud Functions와 Firestore를 활용하여 서버리스(Serverless) 아키텍처로 구현되었으며, 실시간 데이터 동기화를 통해 업무 효율성 향상
* 베포 url : https://servicedesk-web-app.web.app/

## 2. 개발환경
* 프론트엔드 : HTML, JavaScript, Tailwind CSS
* 백엔드 : Spring Boot
* DB : Firebase Firestore
* 연동: Google Sheets, Google Apps Script

## 3. 사용 기술
### 프론트엔드
* HTML/JS (바닐라)
  * Firebase SDK 모듈(firebase-app.js, firebase-firestore.js)을 활용해 브라우저 환경에서 직접 DB 연동
  * `onSnapshot` 메서드를 이용한 Firestore 컬렉션 실시간 구독 (새로고침 없이 대기열 갱신)
* Tailwind CSS
  * CDN 방식으로 적용하여 별도의 빌드 과정 없이 빠른 UI 스타일링
  * `tailwind.config`를 통해 카카오모빌리티 브랜드 컬러(kmo-yellow, kmo-navy 등) 커스텀

### 백엔드
* Firebase Cloud Functions (v2)
  * `index.js`에 작성된 웹훅 API(`receiveqrqueue`)를 통해 외부(구글 시트)로부터 POST 요청 수신
  * Firestore의 `qrQueue` 컬렉션에 대기열 데이터를 타임스탬프와 함께 안전하게 저장
* Firebase Firestore
  * `qrQueue`: 실시간 접수 대기열 컬렉션
  * `serviceDeskLogs`: 처리 완료된 방문 내역 컬렉션
* Google Apps Script (GAS)
  * 구글 폼/시트로 접수되는 내역을 감지하는 트리거 스크립트 작성
  * `LockService`를 통한 동시성 제어 및 `PropertiesService`를 활용한 중복 발송 방지 로직 구현

## 4. 시나리오
### 서비스데스크 방문자 시나리오
1. 서비스데스크에 방문하면 QR코드를 찍는다. (업무 접수)
![Image](https://github.com/user-attachments/assets/db1f1672-eb1d-494a-a47e-4ab1c031b476)

2. QR 코드를 찍으면 아래와 같은 항목들에 대해 답변하고 제출한다.
![Image](https://github.com/user-attachments/assets/787c92f7-e4a7-434f-ba3d-37751371d51d)

3. 설문을 제출하면 옆에 비치되어 있는 노트북에 구글 시트 화면이 띄워져 있는데 행이 업데이트 된 것을 확인한다.
![Image](https://github.com/user-attachments/assets/9142a10e-f18a-4e98-a3de-a357c9c22eaa)

4. 데스크에 사람이 몰렸을 경우 해당 시트를 통해 나의 순서를 확인한다.

5. 업무 접수를 완료했으면 서비스데스크 직원의 응대를 기다린다.

### 서비스데스크 응대자 시나리오
1. 서비스데스크에 사람이 오면 앞에 있는 QR코드를 찍어달라고 안내한다.
2. 구글 시트에 행이 업데이트 된 것을 확인한다.
3. 시트에서 아이디, 방문목적을 확인하고 그에 맞는 응대를 진행한다.


## 5. 주요 기능
| 구글 시트와 연동                                                      |
|--------------------------------------------------------------|
| ![Image](https://github.com/user-attachments/assets/167ac450-8aa1-438c-8e30-28cccbd4e7eb) |
- 사용자가 QR 스캔 후 구글 폼을 제출하면, GAS가 이를 감지해 내 사이트로 파이어베이스 웹훅으로 전송
- 프론트엔드에서 `onSnapshot`으로 실시간 감지하여 사이트에 대기열 카드 즉각 생성

| 수동 접수                                                      |
|--------------------------------------------------------------|
| ![Image](https://github.com/user-attachments/assets/ae28172c-0182-436b-a98a-9f2f99379f57) |
- QR 접수 불가한 상황이나 GAS 오류로 구글 폼 제출이 정상적으로 되지 않을 경우를 대비해 모달 창으로 수동 접수 지원

| 방문 기록 상세 입력                                                     |
|--------------------------------------------------------------|
| ![Image](https://github.com/user-attachments/assets/d80e9d99-c2d7-4911-936c-f07e04ed8971) |
- 대기열에서 대상자를 선택해 처리 자산(노트북, 전산소모품 등)과 액션(수령, 반납 등)을 다중 선택하여 기록
- 등록 시 대기열에서 대상이 삭제되고 처리 내역으로 이동

| 처리 내역 조회 및 통계                                                        |
|--------------------------------------------------------------|
| ![Image](https://github.com/user-attachments/assets/62ae95eb-d23b-4d04-a81a-9ff153fea2e5) |
- 선택된 날짜의 '가장 많이 처리한 업무 Top 3' 요약 제공

| 실행 취소                                                       |
|--------------------------------------------------------------|
| ![Image](https://github.com/user-attachments/assets/43d119fa-f166-4396-912d-326546ad8039) |
- 처리 내역에서 실수로 등록한 로그를 삭제할 경우, 해당 데이터의 원본 방문 목적을 복원하여 대기열(`qrQueue`)로 재배치
