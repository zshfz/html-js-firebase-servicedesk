function sendOnSheetChange() {
  // 1. 🔒 동시 실행 방지 자물쇠 (명령이 2개 들어오면 1개는 3초 대기 후 무시)
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return;

  Utilities.sleep(2000); // 데이터가 완전히 써질 때까지 2초 대기

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  let targetRow = null;
  let targetRowIndex = -1;

  // 맨 밑에서부터 위로 탐색 (가장 최근 데이터 찾기)
  for (let i = allData.length - 1; i >= 1; i--) {
    if (allData[i][4] && String(allData[i][4]).trim() !== "") {
      targetRow = allData[i];
      targetRowIndex = i;
      break;
    }
  }

  // 데이터 없으면 자물쇠 풀고 종료
  if (!targetRow) {
    lock.releaseLock();
    return;
  }

  // 2. 🧠 절대 중복 방지 메모리 (방금 보낸 줄 번호를 기억해서 두 번 쏘기 원천 차단)
  const props = PropertiesService.getScriptProperties();
  const lastProcessedRow = props.getProperty("LAST_PROCESSED_ROW");

  if (lastProcessedRow === String(targetRowIndex)) {
    lock.releaseLock();
    return;
  }

  // 지금 처리하는 줄 번호를 '마지막 처리 번호'로 메모리에 업데이트
  props.setProperty("LAST_PROCESSED_ROW", String(targetRowIndex));

  const data = {};
  headers.forEach((header, index) => {
    data[String(header).trim()] = targetRow[index];
  });

  const extractedLdap = data["LDAP ID"] || targetRow[4] || "";
  const extractedPurpose = data["방문 목적"] || targetRow[7] || "";
  let extractedTime = data["접수 시간"] || targetRow[1] || "";

  if (extractedTime instanceof Date) {
    extractedTime = extractedTime.toLocaleTimeString("ko-KR");
  } else if (!extractedTime) {
    extractedTime = new Date().toLocaleTimeString("ko-KR");
  }

  const payloadData = {
    date: new Date().toISOString().split("T")[0],
    time: extractedTime,
    company: data["회사명"] || targetRow[3] || "Kakaomobility",
    ldap: extractedLdap,
    purpose: extractedPurpose,
    status: "waiting",
  };

  const webhookUrl = "https://receiveqrqueue-cpywbuikcq-du.a.run.app";
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payloadData),
    muteHttpExceptions: true,
  };

  // 🔥 파이어베이스로 슛!
  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (error) {
    console.error("웹훅 전송 중 서버 오류 발생:", error.message);
    // 일시적인 에러이므로 로그만 남기고 넘어가거나,
    // 여기서 lock.releaseLock()을 해제하여 다음 트리거가 정상 작동하게 둡니다.
  } finally {
    // 모든 작업이 끝나면(성공하든 실패하든) 자물쇠 해제
    lock.releaseLock();
  }
}
