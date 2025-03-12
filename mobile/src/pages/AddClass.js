import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const AddClass = () => {
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classRoom, setClassRoom] = useState("");
  const [classImageUrl, setClassImageUrl] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClassImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();

    if (!className || !classCode || !classRoom || !classImageUrl) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const classId = uuidv4();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      alert("กรุณาเข้าสู่ระบบ");
      return;
    }

    try {
      await setDoc(doc(db, "classroom", classId), {
        owner: userId,
        info: {
          name: className,
          code: classCode,
          room: classRoom,
          photo: classImageUrl,
        },
      });

      await setDoc(doc(db, `users/${userId}/classroom`, classId), {
        status: 1,
      });

      alert("เพิ่มห้องเรียนสำเร็จ!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding class: ", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มห้องเรียน!");
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
          maxWidth: "600px",
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
            fontSize: "3rem",
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          เพิ่มห้องเรียน
        </h1>

        <form onSubmit={handleAddClass}>
          <div className="mb-3">
            <label className="form-label">ชื่อวิชา</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">รหัสวิชา</label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">ห้องเรียน</label>
            <input
              type="text"
              value={classRoom}
              onChange={(e) => setClassRoom(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">เลือกไฟล์รูปภาพ</label>
            <input type="file" onChange={handleImageChange} className="form-control" required />
          </div>
          

          {classImageUrl && (
            <div className="mb-3 text-center">
              <img
                src={classImageUrl}
                alt="Preview"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              width: "100%",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
              marginTop: "20px", 
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
            เพิ่มห้องเรียน
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddClass;