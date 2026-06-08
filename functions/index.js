const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// 관리자 권한 초기화
admin.initializeApp();
const db = admin.firestore();

// 구글 시트에서 데이터를 받을 웹훅 API (v2 문법)
exports.receiveqrqueue = onRequest(
  { region: "asia-northeast3" },
  async (req, res) => {
    // POST 요청만 허용
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const data = req.body; // 구글 시트에서 보낸 JSON 데이터

      // Firestore의 'qrQueue' 컬렉션에 새 대기열 등록
      const docRef = await db.collection("qrQueue").add({
        date: data.date || "",
        time: data.time || "",
        company: data.company || "",
        ldap: data.ldap || "",
        purpose: data.purpose || "",
        rawDetail: data.rawDetail || "",
        status: "waiting", // 처리 대기 상태
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // 서버 시간 기록
      });

      console.log("대기열 추가 성공! ID:", docRef.id);
      res.status(200).send({ success: true, id: docRef.id });
    } catch (error) {
      console.error("데이터 저장 중 오류 발생:", error);
      res.status(500).send("Internal Server Error");
    }
  },
);
