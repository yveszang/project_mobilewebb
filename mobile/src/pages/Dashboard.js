import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { getAuth, signOut } from "firebase/auth"; // Import signOut
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchClasses = useCallback(async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;

    const q = query(collection(db, "classroom"), where("owner", "==", auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    setClasses(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      if (!auth.currentUser) {
        navigate("/");
        return;
      }

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setUser(docSnap.data());
      } else {
        console.error("User not found in Firestore");
        navigate("/");
      }
    };

    fetchData();
    fetchClasses();
  }, [fetchClasses, navigate]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }

  };

  return (
    <div
      style={{
        // background: "linear-gradient(180deg, rgba(232,239,254,1) 0%, rgba(255,255,255,1) 45%, rgba(209,230,254,1) 100%)", // Changed the gradient
        background: "#f6f4fd",
        minHeight: "100vh",
        padding: "30px 0",
        fontFamily: "'Arial', sans-serif", // Updated font
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: " #ffffff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)", // Heavier shadow for contrast
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
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
            Dashboard
          </h1>
          
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "16px 16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              boxShadow: "0 4px 8px rgba(0.1, 0.1, 0.1, 0.3)",
              transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out", // ✅ ทำให้เปลี่ยนสีอย่างนุ่มนวล
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#575055";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#000000";
              e.target.style.color = "#ffffff";
            }}
          >
            ออกจากระบบ
          </button>
        </div>

        {user && (
          <div
            style={{
              padding: "20px",
              marginBottom: "30px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              borderRadius: "10px",
              backgroundColor: "#ffffff",
              display: "flex",
              border: "2.25px solid #9579cd",
              alignItems: "center",
            }}
          >
            <img
              src={user.photo || "default-profile-pic.jpg"} // Provide a default image path
              alt="User Profile"
              style={{
                width: "75px",
                height: "75px",
                objectFit: "cover",
                borderRadius: "50%",
                marginRight: "20px",
              }}
            />
            <div>
              <h4 style={{ marginBottom: "10px", fontSize: "20px" }}>{user.name}</h4>
              <p style={{ color: "#666", marginBottom: "0" }}>{user.email}</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "30px", display: "flex", gap: "20px" }}>
          <button
            onClick={() => navigate("/edit-profile")}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "16px 16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              boxShadow: "0 4px 8px rgba(0.1, 0.1, 0.1, 0.3)",
              transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out", // ✅ ทำให้เปลี่ยนสีอย่างนุ่มนวล
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#cdb6fb";
              e.target.style.color = "#000000"; // เปลี่ยนสีตัวอักษรให้เข้ากับพื้นหลังใหม่
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#000000";
              e.target.style.color = "#ffffff";
            }}
          >
            แก้ไขโปรไฟล์
          </button>

          <button
            onClick={() => navigate("/add-class")}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "15px 16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
              boxShadow: "0 4px 8px rgba(0.1, 0.1, 0.1, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#cdb6fb";
              e.target.style.color = "#000000"; // เปลี่ยนสีตัวอักษรให้เข้ากับพื้นหลังใหม่
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#000000";
              e.target.style.color = "#ffffff";
            }}
          >
            เพิ่มห้องเรียน
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div
                key={cls.id}
                style={{
                  width: "calc(33.333% - 20px)", // Three columns with gap.  (100% / 3) - (gap * (items -1) / items)
                  marginBottom: "30px",
                  borderRadius: "12px", // Rounded corners
                  overflow: "hidden", // Prevent overflow of content
                  backgroundColor: "#ffffff", // White background for better contrast
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", // Soft shadow for depth
                  transition: "transform 0.3s ease, box-shadow 0.3s ease", // Smooth transition for hover
                  cursor: "pointer", // Make it clear it's clickable
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)"; // Scale the card slightly on hover
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.2)"; // Enhance shadow on hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)"; // Reset scale
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"; // Reset shadow
                }}
              >
                {cls.info.photo && (
                  <img
                    src={cls.info.photo}
                    alt="Class"
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderTopLeftRadius: "12px", // Rounded top left corner
                      borderTopRightRadius: "12px", // Rounded top right corner
                    }}
                  />
                )}
                <div style={{ padding: "20px" }}>
                  <h5 style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "18px" }}>
                    {cls.info.code} - {cls.info.name}
                  </h5>
                  <p style={{ color: "#777", marginBottom: "10px" }}>📍 ห้องเรียน: {cls.info.room}</p>
                  <button
                    onClick={() => navigate(`/manage-class/${cls.id}`)}
                    style={{
                      backgroundColor: "#cdb6fb",
                      color: "white",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      width: "100%",
                      marginTop: "15px",
                      fontWeight: "bold", // Make the button text stand out
                      transition: "background-color 0.3s ease", // Smooth transition on hover
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#9579cd"; // Darker blue on hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#cdb6fb"; // Reset to original blue
                    }}
                  >
                    จัดการห้องเรียน
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#777", fontSize: "18px" }}>📌 ยังไม่มีห้องเรียน</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;