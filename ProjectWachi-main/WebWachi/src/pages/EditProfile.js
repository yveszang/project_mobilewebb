import { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";


const EditProfile = () => {
  const auth = getAuth();
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    photoURL: "",
  });
  const [imageFile, setImageFile] = useState(null);  // เก็บไฟล์ที่อัปโหลด
  const [imagePreview, setImagePreview] = useState(null);  // แสดงตัวอย่างรูปภาพ
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      setUserInfo({
        name: auth.currentUser.displayName || "",
        email: auth.currentUser.email || "",
        photoURL: auth.currentUser.photoURL || "",
      });
    } else {
      navigate("/"); // หากผู้ใช้ไม่ได้ล็อกอินให้ไปที่หน้า login
    }
  }, [auth, navigate]);

  // ฟังก์ชันเลือกไฟล์และแสดงตัวอย่าง
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // แสดงตัวอย่าง
      };
      reader.readAsDataURL(file); // แปลงไฟล์เป็น Data URL
    }
  };

  // ฟังก์ชันอัปเดตโปรไฟล์
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = userInfo.photoURL; // ใช้รูปเดิมก่อน ถ้าไม่มีการเลือกไฟล์ใหม่

      if (imageFile) {
        setUploading(true);

        // แปลงไฟล์เป็น Data URL (จาก FileReader)
        const reader = new FileReader();
        reader.onloadend = () => {
          imageUrl = reader.result; // เก็บ Data URL ของรูป
        };
        reader.readAsDataURL(imageFile); // แปลงไฟล์เป็น Data URL
      }

      // อัปเดตโปรไฟล์ใน Firebase Authentication
      await updateProfile(auth.currentUser, {
        photoURL: imageUrl,
      });

      // อัปเดตข้อมูลใน Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: userInfo.name,
        email: userInfo.email,
        photo: imageUrl,  // เก็บ Data URL ใน Firestore
      });

      alert("อัปเดตโปรไฟล์สำเร็จ!");
      navigate("/dashboard"); // ไปที่ Dashboard หลังจากอัปเดตสำเร็จ
    } catch (error) {
      console.error("Error updating profile: ", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h1
        style={{
          fontWeight: "bold",
          fontSize: "6rem",
          position: "relative",
          display: "inline-block",
          background: "linear-gradient(90deg, rgba(149, 121, 205, 1) 0%, rgba(0, 0, 0, 1) 100%)",
          WebkitBackgroundClip: "text",
          color: "transparent", // เปลี่ยนจาก WebkitTextFillColor เป็น color: transparent
        }}
      >
          EditProfile
      </h1>
      <form onSubmit={handleUpdateProfile}>
        {/* แสดงรูปโปรไฟล์ปัจจุบัน */}
        <div className="mb-3 text-center">
          
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Profile Preview"
              className="img-thumbnail w-25 mb-2 rounded-circle"
            />
          ) : (
            <img
              src={userInfo.photoURL || "default-profile-pic.jpg"}
              alt="Current Profile"
              className="img-thumbnail w-25 mb-2 rounded-circle"
            />
          )}
        </div>

        {/* ปุ่มเลือกไฟล์ */}
        <div className="mb-3">
          <label className="form-label">อัปโหลดรูปภาพใหม่</label>
          <input type="file" className="form-control" onChange={handleImageChange} />
        </div>

        {/* ฟอร์มแก้ไขชื่อ */}
        <div className="mb-3">
          <label className="form-label">ชื่อ</label>
          <input
            type="text"
            className="form-control"
            value={userInfo.name}
            onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
          />
        </div>

        {/* ฟอร์มแสดงอีเมล (แก้ไขไม่ได้) */}
        <div className="mb-3">
          <label className="form-label">อีเมล</label>
          <input type="email" className="form-control" value={userInfo.email} disabled />
        </div>

        {/* ปุ่มบันทึก */}
        <button
          type="submit"
          disabled={uploading}
          style={{
            backgroundColor: uploading ? "#888888" : "#000000", // เปลี่ยนสีถ้าอัปโหลดอยู่
            color: "#ffffff",
            padding: "16px 16px",
            border: "none",
            borderRadius: "10px",
            cursor: uploading ? "not-allowed" : "pointer", // ป้องกันการคลิกเมื่อปิดใช้งาน
            fontSize: "16px",
            boxShadow: "0 4px 8px rgba(0.1, 0.1, 0.1, 0.3)",
            transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.target.style.backgroundColor = "#cdb6fb";
              e.target.style.color = "#000000";
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.target.style.backgroundColor = "#000000";
              e.target.style.color = "#ffffff";
            }
          }}
        >
          {uploading ? "กำลังอัปโหลด..." : "อัปเดตข้อมูล"}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;