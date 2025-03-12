import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDocs, updateDoc, collection, query, where, getDoc } from "firebase/firestore";

const QAPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [questionNo, setQuestionNo] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [currentCno, setCurrentCno] = useState(null);
  const [questionActive, setQuestionActive] = useState(false);
  const [activeQuestionText, setActiveQuestionText] = useState(""); // เพิ่มตัวแปรเก็บคำถามที่เปิดอยู่

  // โหลดข้อมูลเช็คชื่อที่เปิดอยู่
  useEffect(() => {
    const fetchCurrentCheckin = async () => {
      const q = query(collection(db, `classroom/${classId}/checkin`), where("status", "==", 1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // ดึง CNO ของเซสชันที่กำลังเปิดอยู่
        const checkinDoc = querySnapshot.docs[0];
        setCurrentCno(checkinDoc.id);

        // ตรวจสอบว่ามีคำถามเปิดอยู่หรือไม่
        const questionRef = doc(db, `classroom/${classId}/checkin/${checkinDoc.id}`);
        const questionSnap = await getDoc(questionRef);
        if (questionSnap.exists()) {
          const data = questionSnap.data();
          if (data.question_show) {
            setQuestionActive(true);
            setActiveQuestionText(data.question_text || ""); // เก็บคำถามที่กำลังแสดงอยู่
          } else {
            setQuestionActive(false);
            setActiveQuestionText("");
          }
        } else {
          setQuestionActive(false);
          setActiveQuestionText("");
        }
      } else {
        setCurrentCno(null);
        setQuestionActive(false);
        setActiveQuestionText("");
      }
    };

    fetchCurrentCheckin();
  }, [classId]);

  // ฟังก์ชันเพิ่มคำถามใหม่
  const handleAddQuestion = async () => {
    if (!currentCno) {
      alert("❌ ไม่มีการเช็คชื่อที่เปิดอยู่!");
      return;
    }

    if (!questionNo || !questionText) {
      alert("⚠️ กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const questionRef = doc(db, `classroom/${classId}/checkin/${currentCno}`);
    await updateDoc(questionRef, {
      question_no: parseInt(questionNo),
      question_text: questionText,
      question_show: true,
    });

    setActiveQuestionText(questionText); // อัปเดตคำถามที่กำลังแสดง
    setQuestionNo("");
    setQuestionText("");
    setQuestionActive(true);
    alert("✅ ตั้งคำถามเรียบร้อย!");
  };

  // ฟังก์ชันปิดคำถาม
  const handleCloseQuestion = async () => {
    if (!currentCno) {
      alert("❌ ไม่มีการเช็คชื่อที่เปิดอยู่!");
      return;
    }

    if (!questionActive) {
      alert("❌ ไม่มีคำถามที่เปิดอยู่!");
      return;
    }

    const questionRef = doc(db, `classroom/${classId}/checkin/${currentCno}`);
    await updateDoc(questionRef, {
      question_show: false,
    });

    setQuestionActive(false);
    setActiveQuestionText(""); // ล้างคำถามที่กำลังแสดง
    alert("✅ ปิดคำถามเรียบร้อย!");
  };

  return (
    <div className="container mt-5">

      <button
        className="btn mb-3"
        onClick={() => navigate(`/checkin/${classId}`)}
        style={{
          padding: "12px 30px",
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "8px",
          backgroundColor: "#000000",
          color: "#ffffff",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s ease-in-out, transform 0.2s ease",
          margin: "20px 0px"
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#6c757d";
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#000000";
          e.target.style.transform = "scale(1)";
          e.target.style.color = "#ffffff";
        }}
      >
        กลับไปหน้าเช็คชื่อ
      </button>

      <h1 className="mb-4">หน้าถาม-ตอบ</h1>
      
      {currentCno ? (
        <>
          <p>กำลังถามในเซสชันเช็คชื่อที่ #{currentCno}</p>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="หมายเลขคำถาม"
            value={questionNo}
            onChange={(e) => setQuestionNo(e.target.value)}
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="พิมพ์คำถามที่นี่..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />

          {/* ปุ่มต่างๆ เรียงต่อกันแนวนอน */}
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginTop: "20px" }}>
            {/* ปุ่มเริ่มถาม */}
            <button
              className="btn"
              onClick={handleAddQuestion}
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "8px",
                backgroundColor: "#a2cffe",
                color: "#ffffff",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                transition: "background-color 0.3s ease-in-out, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5ba4d1";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#a2cffe";
                e.target.style.transform = "scale(1)";
              }}
            >
              เริ่มถาม
            </button>

            {/* ปุ่มปิดคำถาม */}
            {questionActive && (
              <button
                className="btn"
                onClick={handleCloseQuestion}
                style={{
                  padding: "12px 30px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  backgroundColor: "#f5a9b8",
                  color: "#ffffff",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  transition: "background-color 0.3s ease-in-out, transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#e24e57";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f5a9b8";
                  e.target.style.transform = "scale(1)";
                }}
              >
                ปิดคำถาม
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-danger">ไม่มีการเช็คชื่อที่เปิดอยู่</p>
      )}

      {/* แสดงคำถามที่กำลังแสดงอยู่ (ไม่ใช่คำถามจาก input) */}
      {activeQuestionText && questionActive && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            position: "absolute",
            top: "65%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "85%",
          }}
        >
          <h1 className="fw-bold" style={{ fontSize: "7rem" }}>
            {activeQuestionText}
          </h1>
        </div>
      )}
    </div>
  );
};

export default QAPage;