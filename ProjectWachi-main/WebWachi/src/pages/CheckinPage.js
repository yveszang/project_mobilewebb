import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import "bootstrap/dist/css/bootstrap.min.css";

const CheckinPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState([]);
  const [studentsCheckedIn, setStudentsCheckedIn] = useState([]);
  const [latestCheckinNo, setLatestCheckinNo] = useState(null);
  const [studentsScores, setStudentsScores] = useState([]);
  const [showScores, setShowScores] = useState(false);
  const [checkinCode, setCheckinCode] = useState(null); // ✅ เก็บ Check-in Code
  const [showCheckinCode, setShowCheckinCode] = useState(false); // ✅ เพิ่ม state ควบคุมปุ่ม
  const [studentsMap, setStudentsMap] = useState({}); // *** เพิ่ม state สำหรับเก็บข้อมูลนักศึกษา


  const handleGoToQuestionPage = () => {
    navigate(`/qa/${classId}`);
  };

  const fetchCheckinCode = async () => {
    if (!latestCheckinNo) {
      // alert("❌ ไม่มีรหัสเช็คชื่อที่เปิดอยู่!"); // Removed alert
      return;
    }
    const checkinDoc = await getDoc(
      doc(db, `classroom/${classId}/checkin/${latestCheckinNo}`)
    );
    if (checkinDoc.exists()) {
      setCheckinCode(checkinDoc.data().code);
      setShowCheckinCode(true); // ✅ ตั้งค่าให้แสดงรหัสเช็คชื่อ
    } else {
      setCheckinCode(null);
      // alert("❌ ไม่พบรหัสเช็คชื่อ!"); // Removed alert
    }
  };

  // โหลดข้อมูลนักศึกษาทั้งหมด ***********************************
  useEffect(() => {
    const fetchStudents = async () => {
      const studentsRef = collection(db, `classroom/${classId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsData = {};
      studentsSnapshot.forEach((doc) => {
        studentsData[doc.id] = { ...doc.data(), id: doc.id }; // เพิ่ม id เข้าไปด้วย
      });
      setStudentsMap(studentsData);
    };

    fetchStudents();
  }, [classId]);

  useEffect(() => {
    if (!latestCheckinNo) return;

    const scoresRef = collection(
      db,
      `classroom/${classId}/checkin/${latestCheckinNo}/scores`
    );
    const unsubscribe = onSnapshot(scoresRef, (querySnapshot) => {
      const scores = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudentsScores(scores);
    });

    return () => unsubscribe();
  }, [classId, latestCheckinNo]);

  // ✅ ฟังก์ชันบันทึกคะแนน
  const handleSaveScores = async () => {
    try {
      for (let student of studentsScores) {
        const studentRef = doc(
          db,
          `classroom/${classId}/checkin/${latestCheckinNo}/scores/${student.id}`
        );
        await updateDoc(studentRef, {
          score: student.score,
          remark: student.remark,
          status: student.status,
        });
      }
      alert("✅ บันทึกข้อมูลเรียบร้อย!");
    } catch (error) {
      console.error("Error updating scores:", error);
      alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล!");
    }
  };
  // Add this to your useEffect for loading student scores
  useEffect(() => {
    if (!latestCheckinNo) return;

    const scoresRef = collection(
      db,
      `classroom/${classId}/checkin/${latestCheckinNo}/scores`
    );

    const unsubscribe = onSnapshot(scoresRef, async (querySnapshot) => {
      const scores = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch answers and combine them with the scores
      const answersData = await fetchAnswers(latestCheckinNo);

      // Merge answers with student scores
      const scoresWithAnswers = scores.map(student => {
        return {
          ...student,
          answers: answersData[student.id] || {}  // Add answers for each student, or empty object if none
        };
      });

      setStudentsScores(scoresWithAnswers);
    });

    return () => unsubscribe();
  }, [classId, latestCheckinNo]);

  // โหลดข้อมูลเช็คชื่อ
  useEffect(() => {
    const q = query(collection(db, `classroom/${classId}/checkin`));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const checkinList = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const checkinInfo = docSnap.data();
          const studentQuery = collection(
            db,
            `classroom/${classId}/checkin/${docSnap.id}/students`
          );
          const studentSnapshot = await getDocs(studentQuery);
          return {
            id: docSnap.id,
            ...checkinInfo,
            studentCount: studentSnapshot.size,
          };
        })
      );

      setCheckins(checkinList);
      // Find the latest checkin with status 1 (active)
      const activeCheckin = checkinList.find((checkin) => checkin.status === 1);
      if (activeCheckin) {
        setLatestCheckinNo(parseInt(activeCheckin.id)); // Convert ID to number
      } else {
        setLatestCheckinNo(null);
      }

    });

    return () => unsubscribe();
  }, [classId]);

  // โหลดรายชื่อนักศึกษาที่เช็คชื่อแล้ว
  useEffect(() => {
    if (!latestCheckinNo) return;

    const studentCheckinRef = collection(
      db,
      `classroom/${classId}/checkin/${latestCheckinNo}/students`
    );
    const unsubscribe = onSnapshot(studentCheckinRef, (querySnapshot) => {
      const checkedInStudents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudentsCheckedIn(checkedInStudents);
    });

    return () => unsubscribe();
  }, [classId, latestCheckinNo]);

  // ✅ **เริ่มเช็คชื่อใหม่**
  const handleStartCheckIn = async () => {
    try {
      const newCno = checkins.length + 1;
      const studentsRef = collection(db, `classroom/${classId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);

      // ✅ 1. สร้าง /classroom/{cid}/checkin/{cno}
      await setDoc(doc(db, `classroom/${classId}/checkin/${newCno}`), {
        code: uuidv4().substring(0, 6).toUpperCase(),
        date: new Date().toLocaleString(),
        status: 1,
      });

      // ✅ 2. คัดลอกรายชื่อนักเรียนไปยัง /classroom/{cid}/checkin/{cno}/scores
      studentsSnapshot.forEach(async (student) => {
        await setDoc(
          doc(db, `classroom/${classId}/checkin/${newCno}/scores/${student.id}`),
          {
            stdid: student.data().stdid,
            name: student.data().name,
            remark: "",
            score: 0, // ค่าคะแนนเริ่มต้น
            status: 0, // สถานะ 0 = ยังไม่เข้าเรียน
            date: "", // ยังไม่เช็คชื่อ
          }
        );
      });

      alert(`✅ เริ่มเช็คชื่อครั้งที่ ${newCno} สำเร็จ!`);
      setLatestCheckinNo(newCno);
      // ไม่ต้อง fetchCheckinCode() ที่นี่ เพราะมันจะถูกเรียกเมื่อ showCheckinCode ถูกเปิด
    } catch (error) {
      console.error("Error starting new check-in:", error);
      alert("❌ เกิดข้อผิดพลาดในการเริ่มเช็คชื่อ!");
    }
  };
  const fetchAnswers = async (checkinId) => {
    const answersCollection = collection(db, `classroom/${classId}/checkin/${checkinId}/answers`);
    const answersSnapshot = await getDocs(answersCollection);

    const answersData = {};
    for (const answerDoc of answersSnapshot.docs) {
      const answerData = answerDoc.data();  // { text: "...", time: "..." }
      // วนลูปผ่านแต่ละ field ที่เป็น student id
      if (answerData.students) {
        for (const studentId in answerData.students) {
          if (answerData.students.hasOwnProperty(studentId)) {
            const studentAnswer = answerData.students[studentId];

            // สร้างโครงสร้างข้อมูล answers ให้เหมาะสมกับการใช้งาน
            if (!answersData[studentId]) {
              answersData[studentId] = {};
            }
            answersData[studentId][answerDoc.id] = studentAnswer; // เก็บคำตอบของนักศึกษาแต่ละคนในแต่ละคำถาม
          }
        }
      }
    }
    return answersData;
  };

  // ปิดการเช็คชื่อ
  const handleCloseCheckIn = async () => {
    try {
      if (!latestCheckinNo) {
        alert("ยังไม่มีการเช็คชื่อที่เปิดอยู่!");
        return;
      }

      await updateDoc(
        doc(db, `classroom/${classId}/checkin/${latestCheckinNo}`),
        { status: 2 }
      );

      // ลบค่ารหัสเช็คชื่อออกเมื่อปิดการเช็คชื่อ
      setCheckinCode(null);
      setShowCheckinCode(false);
      setLatestCheckinNo(null); // Reset latestCheckinNo

      alert("ปิดการเช็คชื่อเรียบร้อย!");
    } catch (error) {
      console.error("Error closing check-in:", error);
      alert("เกิดข้อผิดพลาดในการปิดการเช็คชื่อ!");
    }
  };

  return (
    <div className="container mt-5">
      {/* <h1
        className="mb-4 text-center"
        style={{
          fontSize: "3rem", // ขนาดฟอนต์
          fontWeight: "bold", // หนา
          color: "#000000", // สีตัวอักษร
          textTransform: "uppercase", // ทำให้ข้อความตัวพิมพ์ใหญ่ทั้งหมด
          background: "linear-gradient(90deg, rgba(149, 121, 205, 1) 0%, rgba(0, 0, 0, 1) 100%)", // การไล่สีพื้นหลัง
          WebkitBackgroundClip: "text", // ใช้การไล่สีพื้นหลัง
          color: "transparent", // ตัวอักษรโปร่งแสงเพื่อให้เห็นพื้นหลัง
          marginBottom: "30px", // เพิ่มช่องว่างด้านล่าง
        }}
      >
        หน้าตรวจเช็คชื่อ
      </h1> */}

      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          onClick={handleStartCheckIn}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            padding: "14px 18px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#cdb6fb";
            e.target.style.color = "#000000";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#000000";
            e.target.style.color = "#ffffff";
          }}
        >
          เริ่มเช็คชื่อใหม่
        </button>

        <button
          onClick={handleCloseCheckIn}
          style={{
            backgroundColor: "#ff4d4d",
            color: "#ffffff",
            padding: "14px 18px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#ff4d4d";
            e.target.style.color = "#000000";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#000000";
            e.target.style.color = "#ffffff";
          }}
        >
          ปิดการเช็คชื่อ
        </button>
        <button
          onClick={() => {
            if (showCheckinCode) {
              setShowCheckinCode(false);
              setCheckinCode(null); // ✅ ซ่อนรหัสเช็คชื่อ
            } else {
              fetchCheckinCode();
            }
          }}
          style={{
            backgroundColor: "#ffcc00",
            color: "#000000",
            padding: "12px 16px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#ffdb4d";
            e.target.style.color = "#000000";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#000000";
            e.target.style.color = "#ffffff";
          }}
        >
          {showCheckinCode ? "ซ่อนรหัสเช็คชื่อ" : " แสดงรหัสเช็คชื่อ"}
        </button>
      </div>

      {/* ✅ แสดง Check-in Code */}
      {checkinCode && (
        <div
          style={{
            backgroundColor: "#cdb6fb",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h5 style={{ fontWeight: "bold", marginBottom: "10px" }}>รหัสเช็คชื่อ</h5>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#000000",
              backgroundColor: "#ffffff",
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: "8px",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            {checkinCode}
          </h2>
        </div>
      )}

      {/* ✅ แสดง QR Code */}
      {checkinCode && (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "#ffffff",
            border: "2px solid #cdb6fb",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 6px 12px rgba(0,1, 0.1, 0.1, 0.3)",
          }}
        >
          <h5 style={{ fontWeight: "bold", marginBottom: "10px" }}>QR Code สำหรับเช็คชื่อ</h5>
          <QRCodeCanvas
            value={`${window.location.origin}/checkin/${classId}/${checkinCode}`}
            size={200}
            style={{
              padding: "10px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

      {/* ✅ รายชื่อนักศึกษาที่เช็คชื่อแล้ว */}
      <div className="card">
        <div className="card-body">
          <h5>รายชื่อนักศึกษาที่เช็คชื่อแล้ว</h5>
          {studentsCheckedIn.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>รหัสนักศึกษา</th>
                  <th>ชื่อ</th>
                  <th>วัน-เวลา</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {studentsCheckedIn
                  .filter((student) => student.date !== "")
                  .map((student, index) => {
                    // ใช้ studentsMap ในการแสดงข้อมูล ********************
                    const studentInfo = studentsMap[student.id];
                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        {/* แสดง stdid และ name จาก studentsMap */}
                        <td>{studentInfo?.stdid}</td>
                        <td>{studentInfo?.name}</td>
                        <td>{student.date}</td>
                        <td>{student.remark || "-"}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">ยังไม่มีนักศึกษาที่เช็คชื่อ</p>
          )}
        </div>
      </div>



      {/* ✅ ประวัติการเช็คชื่อ */}
      <div className="card mt-4">
        <div className="card-body">
          <h5>ประวัติการเช็คชื่อ</h5>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>วัน-เวลา</th>
                <th>จำนวนคนเข้าเรียน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((checkin, index) => (
                <tr key={checkin.id}>
                  <td>{index + 1}</td>
                  <td>{checkin.date}</td>
                  <td>{checkin.studentCount}</td>
                  <td>{checkin.status === 1 ? "กำลังเรียน" : "เสร็จสิ้น"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ ปุ่มแสดง/ซ่อนคะแนน */}
      <button
        className="btn mb-3"
        onClick={() => setShowScores(!showScores)}
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
          padding: "12px 16px",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize: "18px",
          fontWeight: "bold",
          marginTop: "20px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#6d686f";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#000000";
          e.target.style.color = "#ffffff";
        }}

      >
        {showScores ? "ซ่อนคะแนน" : "แสดงคะแนน"}
      </button>

     
      {showScores && (
        <div className="card mt-3">
          <div className="card-body">
            <h5>คะแนนการเข้าเรียน</h5>
            {studentsScores.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>รหัส</th>
                    <th>ชื่อ</th>
                    <th>หมายเหตุ</th>
                    <th>วันเวลา</th>
                    <th>คะแนน</th>
                    <th>สถานะ</th>
                    <th>คำตอบ</th> {/* เพิ่มคอลัมน์สำหรับคำตอบ */}
                  </tr>
                </thead>
                <tbody>
                  {studentsScores.map((student, index) => {
                    const studentInfo = studentsMap[student.id];

                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{studentInfo?.stdid}</td>
                        <td>{studentInfo?.name}</td>
                        <td>
                          <input
                            type="text"
                            value={student.remark}
                            onChange={(e) =>
                              setStudentsScores((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, remark: e.target.value }
                                    : s
                                )
                              )
                            }
                          />
                        </td>
                        <td>{student.date || "-"}</td>
                        <td>
                          <input
                            type="number"
                            value={student.score}
                            onChange={(e) =>
                              setStudentsScores((prev) =>
                                prev.map((s) =>
                                  s.id === student.id
                                    ? { ...s, score: Number(e.target.value) }
                                    : s
                                )
                              )
                            }
                          />
                        </td>
                        <td>{student.status === 1 ? "เข้าเรียน" : "ไม่เข้าเรียน"}</td>
                          {/* แสดงคำตอบจาก answers */}
                          
                          <td>
                            {student.answers && Object.keys(student.answers).length > 0 ? (
                              Object.keys(student.answers).map((answerId) => (
                                <div key={answerId}>
                                  {student.answers[answerId]?.text || "ไม่มีคำตอบ"}
                                </div>
                              ))
                            ) : (
                              <span>ไม่มีคำตอบ</span>
                            )}
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">ยังไม่มีคะแนน</p>
            )}

            {/* ✅ ปุ่มบันทึก */}
            <button
              className="btn btn-success mt-3"
              onClick={handleSaveScores}
              style={{
                backgroundColor: "#000000", // สีเขียว
                color: "#ffffff", // ตัวอักษรสีขาว
                padding: "12px 20px", // ขนาดปุ่ม
                border: "none", // ไม่มีขอบ
                borderRadius: "8px", // มุมโค้งมน
                cursor: "pointer", // ให้ปุ่มตอบสนอง
                fontWeight: "bold", // ตัวอักษรหนา
                fontSize: "16px", // ขนาดตัวอักษร
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // เงา
                transition: "background-color 0.3s ease-in-out, transform 0.2s ease", // การเปลี่ยนแปลงเรียบเนียน
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#218838"; // สีเขียวเข้มเมื่อ hover
                e.target.style.transform = "scale(1.05)"; // ขยายเล็กน้อย
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#000000"; // สีเดิมเมื่อไม่ hover
                e.target.style.transform = "scale(1)"; // ขนาดเดิม
              }}
            >
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        {/* ปุ่ม "กลับไปจัดการห้องเรียน" */}
        <button
          className="btn mb-3"
          onClick={() => navigate(`/manage-class/${classId}`)}
          style={{
            padding: "12px 30px",  // ตั้งค่า padding ให้เท่ากัน
            fontSize: "16px", // ขนาดตัวอักษร
            fontWeight: "bold", // ตัวอักษรหนา
            borderRadius: "8px",
            backgroundColor: "#000000", // มุมโค้งมน
            color: "#ffffff", 
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // เพิ่มเงา
            transition: "background-color 0.3s ease-in-out, transform 0.2s ease", // การเปลี่ยนแปลง
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#6c757d"; // สีเทาเข้มเมื่อ hover
            e.target.style.transform = "scale(1.05)"; // ขยายขนาดเล็กน้อย
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#000000"; // สีเดิม
            e.target.style.transform = "scale(1)"; // ขนาดเดิม
            e.target.style.color = "#ffffff";
          }}
        >
          กลับไปจัดการห้องเรียน
        </button>

        {/* ปุ่ม "ไปที่หน้าถาม-ตอบ" */}
        <button
          className="btn mb-3 ms-2"
          onClick={handleGoToQuestionPage}
          style={{
            padding: "12px 30px",  // ตั้งค่า padding ให้เท่ากัน
            fontSize: "16px", // ขนาดตัวอักษร
            fontWeight: "bold", // ตัวอักษรหนา
            backgroundColor: "#000000",
            color: "#ffffff",
            borderRadius: "8px", // มุมโค้งมน
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // เพิ่มเงา
            transition: "background-color 0.3s ease-in-out, transform 0.2s ease", // การเปลี่ยนแปลง
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#007b8f"; // สีเหลืองเข้มเมื่อ hover
            e.target.style.transform = "scale(1.05)"; // ขยายขนาดเล็กน้อย

          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#000000";
            e.target.style.transform = "scale(1)"; // ขนาดเดิม
            e.target.style.color = "#ffffff";

          }}
        >
          ไปที่หน้าถาม-ตอบ
        </button>
      </div>
    </div>
  );
};

export default CheckinPage;