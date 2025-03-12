import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import "bootstrap/dist/css/bootstrap.min.css";

const ManageClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [checkinStudents, setCheckinStudents] = useState(null);
  const [studentsMap, setStudentsMap] = useState({}); // *** เพิ่ม state สำหรับเก็บข้อมูลนักศึกษา Map


  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;
      const classRef = doc(db, "classroom", classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        setClassInfo(classSnap.data());
      } else {
        console.error("Class not found");
        navigate("/dashboard");
      }
    };

    const fetchCheckins = async () => {
      const checkinQuery = query(collection(db, `classroom/${classId}/checkin`));
      const checkinSnapshot = await getDocs(checkinQuery);

      const checkinData = await Promise.all(
        checkinSnapshot.docs.map(async (docSnap) => {
          const checkinInfo = docSnap.data();

          // ดึงข้อมูลคำถาม (question_text) จาก document ของ check-in
          const checkinRef = doc(db, `classroom/${classId}/checkin`, docSnap.id);
          const checkinDoc = await getDoc(checkinRef);
          const questionText = checkinDoc.exists() ? checkinDoc.data().question_text : "No question"; // Default value

          const answersData = await fetchAnswers(docSnap.id);
          const studentsQuery = query(
            collection(db, `classroom/${classId}/checkin/${docSnap.id}/students`)
          );
          const studentsSnapshot = await getDocs(studentsQuery);
          const studentsInThisCheckin = studentsSnapshot.docs.map(
            (studentDoc) => studentDoc.data()
          );

          return {
            id: docSnap.id,
            ...checkinInfo,
            question: questionText, // เพิ่ม question เข้าไปในข้อมูล check-in
            studentCount: studentsInThisCheckin.length,
            students: studentsInThisCheckin,
            answers: answersData,
          };
        })
      );

      setCheckins(checkinData);
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

    const fetchStudents = async () => {
      const studentQuery = query(collection(db, `classroom/${classId}/students`));
      const studentSnapshot = await getDocs(studentQuery);

      // สร้าง Map ของนักศึกษา
      const studentMapData = {};
      studentSnapshot.docs.forEach((docSnap) => {
        studentMapData[docSnap.id] = {
          id: docSnap.id,
          ...docSnap.data(),
        };
      });
      setStudentsMap(studentMapData); // เก็บ Map ลง state
      setStudents(Object.values(studentMapData));  // เก็บ Array ของนักศึกษา (เผื่อใช้แบบเดิม)
    };


    fetchClassData();
    fetchCheckins();
    fetchStudents();
  }, [classId, navigate]);

  const handleStartCheckIn = () => {
    navigate(`/checkin/${classId}`);
  };

  const handleViewCheckinStudents = (checkinId) => {
    const selectedCheckin = checkins.find((checkin) => checkin.id === checkinId);

    if (selectedCheckin) {
      // สร้าง Array ของนักศึกษา พร้อมข้อมูลคะแนน คำตอบ และหมายเหตุ
      const studentsWithData = selectedCheckin.students.map((student) => {
        let studentAnswers = {};
        if (selectedCheckin.answers && selectedCheckin.answers[student.stdid]) {
          studentAnswers = selectedCheckin.answers[student.stdid];
        }

        // ดึงข้อมูลคะแนนและหมายเหตุจาก collection "scores"
        let studentScore = 0; // ค่าเริ่มต้น
        let studentRemark = ""; // ค่าเริ่มต้น
        const getStudentData = async () => {
          const scoreRef = doc(db, `classroom/${classId}/checkin/${checkinId}/scores`, student.stdid);
          const scoreSnap = await getDoc(scoreRef);
          if (scoreSnap.exists()) {
            studentScore = scoreSnap.data().score || 0;
            studentRemark = scoreSnap.data().remark || ""; // เพิ่มการดึง remark
          }
          return {
            ...student,
            answers: studentAnswers,
            score: studentScore,
            remark: studentRemark, // เพิ่ม remark เข้าไปในข้อมูล
          };
        }

        return getStudentData();
      });

      // ใช้ Promise.all รอให้ดึงข้อมูลของทุกคนเสร็จ
      Promise.all(studentsWithData).then(completedStudents => {
        setCheckinStudents(completedStudents);
      });

    } else {
      setCheckinStudents([]);
    }
  };



  return (
    <div
      style={{
        background: "#f6f4fd",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          width: "100%",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <h1
          style={{
            fontWeight: "bold",
            fontSize: "2.5rem",
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          จัดการห้องเรียน
        </h1>
        {classInfo && (
          <div
            style={{
              padding: "20px",
              marginBottom: "30px",
              boxShadow: "0 4px 8px rgba(0.1, 0.1, 0.1, 0.3)",
              borderRadius: "10px",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2.25px solid #9579cd",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h4>{classInfo.info.name} ({classInfo.info.code})</h4>
              <QRCodeCanvas value={`${window.location.origin}/register/${classId}`} size={180} />
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/checkin/${classId}`)}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            padding: "16px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            width: "100%",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
            marginBottom: "20px",
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
          เริ่มเช็คชื่อ
        </button>

        <h5>ประวัติการเช็คชื่อ</h5>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>วัน-เวลา</th>
              <th>คำถาม</th>
              <th>จำนวนคนเข้าเรียน</th>
              <th>สถานะ</th>
              <th>ดูรายชื่อนักศึกษา</th>
            </tr>
          </thead>
          <tbody>
            {checkins.map((record, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{record.date}</td>
                <td>{record.question}</td>
                <td>{record.studentCount}</td>
                <td>{record.status === 1 ? "กำลังเรียน" : "เสร็จสิ้น"}</td>
                <td>
                  <button
                    onClick={() => handleViewCheckinStudents(record.id)}
                    style={{
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      padding: "12px 16px",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
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
                    ดูรายชื่อนักศึกษา
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {checkinStudents && (
          <div className="mt-4">
            <h5>รายชื่อนักศึกษาที่เช็คชื่อในรอบนี้</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัส</th>
                  <th>ชื่อ</th>
                  <th>คำตอบ</th>
                  <th>คะแนน</th>
                  <th>หมายเหตุ</th> {/* เพิ่ม column หมายเหตุ */}
                </tr>
              </thead>
              <tbody>
                {/* ใช้ studentsMap โดยตรง */}
                {checkinStudents.map((student, index) => {
                  const studentInfo = studentsMap[student.stdid];

                  return studentInfo ? (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{studentInfo.stdid}</td>
                      <td>{studentInfo.name}</td>
                      <td>
                        {Object.keys(student.answers).map((questionId) => (
                          <div key={questionId}>
                            {student.answers[questionId].text || "ไม่มีคำตอบ"}
                          </div>
                        ))}
                      </td>
                      <td>{student.score}</td>
                      <td>{student.remark}</td> {/* แสดงหมายเหตุ */}
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
          </div>
        )}


        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowStudents(!showStudents)}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "12px 16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "17px",
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
            {showStudents ? "ซ่อนรายชื่อนักศึกษา" : "แสดงรายชื่อนักศึกษา"}
          </button>
        </div>

        {showStudents && (
          <div className="mt-4">
            <h5>รายชื่อนักศึกษา</h5>
            <table className="table" >
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัส</th>
                  <th>ชื่อ</th>
                </tr>
              </thead>
              <tbody>
                {/* แสดงรายชื่อจาก students array ปกติ */}
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{student.stdid}</td>
                    <td>{student.name}</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            backgroundColor: "#cdb6fb",
            color: "white",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            width: "100%",
            marginTop: "20px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#9579cd";
            e.target.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#cdb6fb";
            e.target.style.color = "#000000";
          }}
        >
          กลับไป Dashboard
        </button>


      </div>
    </div>
  );
};

export default ManageClass;