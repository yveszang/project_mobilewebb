// Firebase configuration (แทนที่ด้วยค่าจริงของคุณ)
const firebaseConfig = {
    apiKey: "AIzaSyBQxyTdXu_tLr0MxCj8D8_o6b_rlp6u1qc",
    authDomain: "web2567-2ae3c.firebaseapp.com",
    projectId: "web2567-2ae3c",
    storageBucket: "web2567-2ae3c.firebasestorage.app",
    messagingSenderId: "3818215302",
    appId: "1:3818215302:web:c0ed0b7e9ea0519023fe07",
    measurementId: "G-KYSZTEQ4HJ"
};

// Initialize Firebase ONLY ONCE.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

// Global variable to store the current classroom ID.  VERY IMPORTANT.
let currentClassroomId = null;
let currentCheckinId = null;

// DOM Elements (Consolidated for clarity)
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userEmailSpan = document.getElementById('user-email');
const userPhotoImg = document.getElementById('user-photo');
const editProfileButton = document.getElementById('edit-profile-button');
const editProfileDiv = document.getElementById('edit-profile');
const editNameInput = document.getElementById('edit-name');
const editEmailInput = document.getElementById('edit-email');
const editPhotoInput = document.getElementById('edit-photo');
const saveProfileButton = document.getElementById('save-profile-button');
const addClassButton = document.getElementById('add-class-button');
const addClassDiv = document.getElementById('add-class');
const classCodeInput = document.getElementById('class-code');
const classNameInput = document.getElementById('class-name');
const classRoomInput = document.getElementById('class-room');
const classPhotoInput = document.getElementById('class-photo');
const saveClassButton = document.getElementById('save-class-button');
const cancelAddClassButton = document.getElementById('cancel-add-class-button');
const classListUl = document.getElementById('class-list');
const manageClassDiv = document.getElementById('manage-class');
const classTitleH3 = document.getElementById('class-title');
const classImageImg = document.getElementById('class-image');
const qrcodeDiv = document.getElementById('qrcode');
const showStudentsButton = document.getElementById('show-students-button');
const addCheckinButton = document.getElementById('add-checkin-button');
const checkinListUl = document.getElementById('checkin-list');
const checkinDiv = document.getElementById('checkin');
const checkinTitleH3 = document.getElementById('checkin-title');
const checkinImageImg = document.getElementById('checkin-image');
const exitCheckinButton = document.getElementById('exit-checkin-button');
const startCheckinButton = document.getElementById('start-checkin-button');
const closeCheckinButton = document.getElementById('close-checkin-button');
const saveCheckinButton = document.getElementById('save-checkin-button'); // Not used yet, but good to have
const showCheckinCodeButton = document.getElementById('show-checkin-code-button'); // Not used yet
const showCheckinQrcodeButton = document.getElementById('show-checkin-qrcode-button'); // Not used yet
const qnaButton = document.getElementById('qna-button');
const showStudentsCheckinButton = document.getElementById('show-students-checkin-button');
const studentsCheckinListUl = document.getElementById('students-checkin-list');
const studentListContainer = document.getElementById('student-list-container');
const qnaDiv = document.getElementById('qna');
const questionNoInput = document.getElementById('question-no');
const questionTextInput = document.getElementById('question-text');
const startQnaButton = document.getElementById('start-qna-button');
const closeQnaButton = document.getElementById('close-qna-button');
const answersListUl = document.getElementById('answers-list');
const goBackButton = document.getElementById('go-back');
const goBackButton2 = document.getElementById('go-back2');
const goBackButton3 = document.getElementById('go-back3');
const createQuestionButton = document.getElementById('create-question-button');
const attendanceQuestionsList = document.getElementById('attendance-questions-list');
const studentList = document.getElementById('student-list');
const addStudentButton = document.getElementById('add-student-button'); // Not used
const studentIdInput = document.getElementById('student-id'); //Not used
const studentNameInput = document.getElementById('student-name'); //Not used
const attendanceQuestionsUl = document.getElementById('attendance-questions');
const showAddStudentModalButton = document.getElementById('show-add-student-modal');
const addStudentModal = document.getElementById('add-student-modal');
const studentIdInputModal = document.getElementById('student-id-modal');
const searchStudentButton = document.getElementById('search-student-button');
const studentInfoModal = document.getElementById('student-info-modal');
const studentNameModal = document.getElementById('student-name-modal');
const addStudentButtonModal = document.getElementById('add-student-button-modal');
const cancelAddStudentModal = document.getElementById('cancel-add-student-modal');
const addStudentErrorMessage = document.getElementById('add-student-error-message');
const checkinCode = document.getElementById('checkin-code').value; // รับค่าโค้ดจาก input

// --- Event Listeners for Navigation ---
goBackButton.addEventListener('click', () => {
    manageClassDiv.style.display = 'none';
    userInfoDiv.style.display = 'block';
});

goBackButton2.addEventListener('click', () => {
    checkinDiv.style.display = 'none';
    manageClassDiv.style.display = 'block';
});

goBackButton3.addEventListener('click', () => {
    qnaDiv.style.display = 'none';
    checkinDiv.style.display = 'block';
});

// --- Authentication ---
loginButton.addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login successful", result.user);
        })
        .catch((error) => {
            console.error("Login error:", error);
        });
});

logoutButton.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            console.log("Logout successful");
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
});

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Auth state changed: User logged in", user);
        displayUserInfo(user);
        checkIfTeacher(user.uid).then(isTeacher => {
            if (isTeacher) {
                addClassButton.style.display = 'inline-block';
                displayClassrooms(user.uid, true);
            } else {
                addClassButton.style.display = 'none';
                displayClassrooms(user.uid, false);
            }
        });
        updateOrCreateUser(user);
    } else {
        console.log("Auth state changed: User logged out");
        hideUserInfo();
        addClassButton.style.display = 'none';
    }
});

// --- User Information Display ---
function displayUserInfo(user) {
    loginButton.style.display = 'none';
    logoutButton.style.display = 'inline-block';
    userInfoDiv.style.display = 'block';
    userNameSpan.textContent = user.displayName;
    userEmailSpan.textContent = user.email;
    if (user.photoURL) {
        userPhotoImg.src = user.photoURL;
        userPhotoImg.style.display = 'inline';
    }
}

function hideUserInfo() {
    loginButton.style.display = 'inline-block';
    logoutButton.style.display = 'none';
    userInfoDiv.style.display = 'none';
    userPhotoImg.style.display = 'none';
    userNameSpan.textContent = '';
    userEmailSpan.textContent = '';
}

// --- User Data Management ---
async function updateOrCreateUser(user) {
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    const userData = {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL || null,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (doc.exists) {
        await userRef.update(userData);
        console.log("User document updated");
    } else {
        userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await userRef.set(userData);
        console.log("User document created");
    }
}

// --- Edit Profile ---
editProfileButton.addEventListener('click', () => {
    editProfileDiv.style.display = 'block';
    editNameInput.value = auth.currentUser.displayName || '';
    editEmailInput.value = auth.currentUser.email || '';
});

saveProfileButton.addEventListener('click', async () => {
    const newName = editNameInput.value;
    const newEmail = editEmailInput.value;

    try {
        await auth.currentUser.updateProfile({
            displayName: newName,
        });

        if (newEmail !== auth.currentUser.email) {
            await auth.currentUser.updateEmail(newEmail);
            alert("Please check your email to verify the new email address.");
        }

        const userRef = db.collection('users').doc(auth.currentUser.uid);
        await userRef.update({
            name: newName,
            email: newEmail,
        });

        console.log("Profile updated successfully!");
        editProfileDiv.style.display = 'none';
        alert("Profile updated successfully!");

    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile: " + error.message);
    }
});

// --- Add Class ---
addClassButton.addEventListener('click', () => {
    addClassDiv.style.display = 'block';
});

cancelAddClassButton.addEventListener('click', () => {
    addClassDiv.style.display = 'none';
    clearAddClassForm();
});

saveClassButton.addEventListener('click', async () => {
    const code = classCodeInput.value.trim();
    const name = classNameInput.value.trim();
    const room = classRoomInput.value.trim();
    const photo = classPhotoInput.value.trim();

    if (!code || !name) {
        alert("Please enter course code and name.");
        return;
    }

    try {
        const newClassRef = db.collection('classrooms').doc();
        const classId = newClassRef.id;

        await newClassRef.set({
            owner: auth.currentUser.uid,
            info: {
                code: code,
                name: name,
                room: room,
                photo: photo || null,
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('users').doc(auth.currentUser.uid).collection('classroom').doc(classId).set({
            status: 1
        });

        // Add to teachers collection (if it doesn't exist)
        await db.collection('teachers').doc(auth.currentUser.uid).set({}, { merge: true });

        console.log("Classroom added successfully!");
        addClassDiv.style.display = 'none';
        clearAddClassForm();
        displayClassrooms(auth.currentUser.uid, true);

    } catch (error) {
        console.error("Error adding classroom:", error);
        alert("Error adding classroom: " + error.message);
    }
});

function clearAddClassForm() {
    classCodeInput.value = '';
    classNameInput.value = '';
    classRoomInput.value = '';
    classPhotoInput.value = '';
}

// --- Teacher Check ---
async function checkIfTeacher(uid) {
    const teacherDoc = await db.collection('teachers').doc(uid).get();
    return teacherDoc.exists;
}

// --- Display Classrooms ---
async function displayClassrooms(uid, isTeacher) {
    try {
        const userClassroomsRef = db.collection('users').doc(uid).collection('classroom');
        const snapshot = await userClassroomsRef.get();

        classListUl.innerHTML = '';

        if (snapshot.empty) {
            classListUl.innerHTML = '<li>No classrooms found.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const classData = doc.data();
            const classroomId = doc.id;
            getClassroomDetails(classroomId, classData.status, isTeacher);
        });

    } catch (error) {
        console.error("Error fetching classrooms:", error);
        alert("Error fetching classrooms: " + error.message);
    }
}
async function getClassroomDetails(classroomId, userStatus, isTeacher) {
    try {
        const classroomRef = db.collection('classrooms').doc(classroomId);
        const classroomDoc = await classroomRef.get();

        if (!classroomDoc.exists) {
            console.log('No such classroom!');
            return;
        }

        const classroomData = classroomDoc.data();
        const listItem = document.createElement('li');
        let roleText = userStatus === 1 ? " (Teacher)" : " (Student)";

        // Make the ENTIRE list item clickable
        listItem.textContent = `${classroomData.info.code} - ${classroomData.info.name} ${roleText} `;
        listItem.style.cursor = 'pointer'; // Change cursor to indicate clickability
        listItem.addEventListener('click', () => {
            gotoManageClass(classroomId);
        });

        classListUl.appendChild(listItem);

    } catch (error) {
        console.error("Error fetching classroom details:", error);
        alert("Error fetching classroom details: " + error.message);
    }
}

// --- Manage Class ---
function gotoManageClass(classroomId) {
    currentClassroomId = classroomId;
    userInfoDiv.style.display = 'none';
    manageClassDiv.style.display = 'block';

    const classroomRef = db.collection('classrooms').doc(classroomId);
    classroomRef.get().then((doc) => {
        if (doc.exists) {
            const classroomData = doc.data();
            classTitleH3.textContent = `${classroomData.info.code} - ${classroomData.info.name}`;
            classImageImg.src = classroomData.info.photo || '';
            showQRCode(classroomId);
            displayAttendanceQuestions(classroomId);
        } else {
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
        alert("Error: " + error.message);
    });

    // Event listeners (OUTSIDE the .then())
    showStudentsButton.addEventListener('click', () => showStudentsInClass(classroomId));
    addCheckinButton.addEventListener('click', () => addCheckin(classroomId));
    goBackButton.addEventListener('click', () => {
        manageClassDiv.style.display = 'none';
        userInfoDiv.style.display = 'block';
    });

    // --- Event Listener for showing the modal ---
    showAddStudentModalButton.addEventListener('click', () => {
        addStudentModal.style.display = 'block';
        // Clear previous values
        studentIdInputModal.value = '';
        studentInfoModal.style.display = 'none';
        addStudentButtonModal.style.display = 'none';
        addStudentErrorMessage.style.display = 'none';
        addStudentErrorMessage.textContent = '';
    });

    // --- Event Listener for searching student ---
    searchStudentButton.addEventListener('click', async () => {
        const studentId = studentIdInputModal.value.trim();
        if (!studentId) {
            addStudentErrorMessage.textContent = "กรุณากรอกรหัสนักเรียน";
            addStudentErrorMessage.style.display = "block";
            return;
        }

        try {
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where("stid", "==", studentId).get(); // แก้ให้ค้นหาด้วย stid

            if (querySnapshot.empty) {
                addStudentErrorMessage.textContent = "ไม่พบนักเรียนด้วยรหัสนี้";
                addStudentErrorMessage.style.display = 'block';
                studentInfoModal.style.display = 'none';
                addStudentButtonModal.style.display = 'none';
                return;
            }

            const studentDoc = querySnapshot.docs[0];
            const studentData = studentDoc.data();
            const studentUid = studentDoc.id;

            // แสดงข้อมูลนักเรียน
            studentNameModal.textContent = studentData.name;
            studentInfoModal.style.display = 'block';
            addStudentButtonModal.style.display = 'inline-block';
            addStudentErrorMessage.style.display = 'none';

            // ปุ่มเพิ่มนักเรียน
            addStudentButtonModal.onclick = () => {
                addStudentToClass(studentId, studentData.name, studentUid); // ส่งค่า studentId ที่ถูกต้อง
                addStudentModal.style.display = 'none';
            };

        } catch (error) {
            console.error("Error searching for student:", error);
            alert("Error searching for student: " + error.message);
        }
    });

    // --- Event Listener for canceling add student ---
    cancelAddStudentModal.addEventListener('click', () => {
        addStudentModal.style.display = 'none';
    });
}

function showQRCode(cid) {
    qrcodeDiv.innerHTML = '';
    new QRCode(qrcodeDiv, cid);
}

// --- Attendance Questions ---
createQuestionButton.addEventListener('click', () => {
    const questionText = prompt("กรุณากรอกคำถามเช็คชื่อ:");
    if (questionText) {
        createAttendanceQuestion(questionText);
    }
});

async function displayAttendanceQuestions(classroomId) {
    try {
        const questionsRef = db.collection('classrooms').doc(classroomId).collection('attendanceQuestions');
        const snapshot = await questionsRef.orderBy('createdAt', 'desc').get();

        attendanceQuestionsUl.innerHTML = '';

        if (snapshot.empty) {
            attendanceQuestionsUl.innerHTML = '<li>No attendance questions found.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const questionData = doc.data();
            const listItem = document.createElement('li');
            listItem.textContent = questionData.question;
            attendanceQuestionsUl.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error fetching attendance questions:", error);
        alert("Error fetching attendance questions: " + error.message);
    }
}

async function createAttendanceQuestion(questionText) {
    try {
        const questionRef = db.collection('classrooms').doc(currentClassroomId).collection('attendanceQuestions').doc();
        await questionRef.set({
            question: questionText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("คำถามเช็คชื่อถูกสร้างแล้ว");
        alert("คำถามเช็คชื่อถูกสร้างแล้ว");
        displayAttendanceQuestions(currentClassroomId);
    } catch (error) {
        console.error("Error creating attendance question:", error);
        alert("เกิดข้อผิดพลาดในการสร้างคำถามเช็คชื่อ");
    }
}

// --- Add Student --- 
async function addStudentToClass(stid, name, studentUid) {
    try {
        const classroomRef = db.collection('classrooms').doc(currentClassroomId);
        const classroomDoc = await classroomRef.get();
        if (!classroomDoc.exists) {
            alert("ไม่พบห้องเรียนนี้");
            return;
        }

        // Check for duplicates (optional, but good practice)
        const studentRef = classroomRef.collection('student').doc(stid);
        const studentDoc = await studentRef.get();
        if (studentDoc.exists) {
            alert("นักเรียนคนนี้อยู่ในห้องเรียนนี้แล้ว");
            return;
        }

        await studentRef.set({
            stid: stid,
            name: name,
            status: 0,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            photo: ""
        });

        // Add to /users/{uid}/classroom/{cid}
        await db.collection('users').doc(studentUid).collection('classroom').doc(currentClassroomId).set({
            status: 0 // Student
        });

        // เพิ่มข้อมูลวิชา (courses) ในผู้เรียน
        await db.collection('users').doc(studentUid).update({
            courses: firebase.firestore.FieldValue.arrayUnion(currentClassroomId) // เพิ่มห้องเรียนในฟิลด์ courses ของผู้เรียน
        });

        console.log("เพิ่มนักเรียนเข้าห้องเรียนสำเร็จ");
        alert("เพิ่มนักเรียนเข้าห้องเรียนสำเร็จ");
        // No need to clear inputs here, as we clear them when the modal opens.
        showStudentsInClass(currentClassroomId); // Refresh student list

    } catch (error) {
        console.error("Error adding student:", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มนักเรียน: " + error.message);
    }
}

// --- Show Students ---
async function showStudentsInClass(classroomId) {
    try {
        const studentsRef = db.collection('classrooms').doc(classroomId).collection('student');
        const snapshot = await studentsRef.get();

        studentList.innerHTML = '';

        if (snapshot.empty) {
            studentList.innerHTML = '<p>ยังไม่มีนักเรียนในห้องเรียนนี้</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>รหัส</th>
                <th>ชื่อ</th>
            </tr>
        `;

        snapshot.forEach(doc => {
            const studentData = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${studentData.stid}</td>
                <td>${studentData.name}</td>
            `;
            table.appendChild(row);
        });

        studentList.appendChild(table);

    } catch (error) {
        console.error("Error fetching students:", error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน");
    }
}

document.getElementById('add-checkin-button').addEventListener('click', () => {
    // ดึงค่าโค้ดจาก input
    const checkinCode = document.getElementById('checkin-code').value.trim();

    // ตรวจสอบว่าผู้ใช้กรอกโค้ดหรือไม่
    if (!checkinCode) {
        alert("กรุณากรอกโค้ดการเช็คชื่อ");
        return;
    }


    addCheckin(currentClassroomId, checkinCode);
});




// --- ฟังก์ชันสำหรับเพิ่มการเช็คชื่อ ---
async function addCheckin(classroomId, checkinCode) {
    // ตรวจสอบว่าอาจารย์กรอกโค้ดหรือไม่
    if (!checkinCode || checkinCode.trim() === "") {
        alert("กรุณากรอกโค้ดการเช็คชื่อ");
        return; // หยุดการทำงานหากไม่มีโค้ด
    }

    try {
        const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc();
        currentCheckinId = checkinRef.id;

        // เพิ่มการเช็คชื่อใน Firebase
        await checkinRef.set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'open', // กำหนดสถานะเริ่มต้นเป็น "เปิด"
            code: checkinCode
        });

        console.log("Check-in created successfully!");
        alert("Check-in created successfully!");
        displayCheckins(classroomId); // แสดงการเช็คชื่อที่เพิ่มเข้ามา
        gotoCheckin(classroomId, currentCheckinId); // ไปที่หน้าจัดการเช็คชื่อ
    } catch (error) {
        console.error("Error creating check-in:", error);
        alert("Error creating check-in: " + error.message);
    }
}

// --- Display Check-ins ---
async function displayCheckins(classroomId) {
    try {
        const checkinsRef = db.collection('classrooms').doc(classroomId).collection('checkins');
        const snapshot = await checkinsRef.orderBy('createdAt', 'desc').get();

        checkinListUl.innerHTML = '';

        if (snapshot.empty) {
            checkinListUl.innerHTML = '<li>No check-ins found.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const checkinData = doc.data();
            const listItem = document.createElement('li');
            const checkinId = doc.id;
            listItem.textContent = `Check-in: ${checkinData.createdAt.toDate().toLocaleString()} - Status: ${checkinData.status}`;

            const manageCheckinButton = document.createElement('button');
            manageCheckinButton.textContent = 'Manage';
            manageCheckinButton.addEventListener('click', () => {
                gotoCheckin(classroomId, checkinId);
            });

            listItem.appendChild(manageCheckinButton);
            checkinListUl.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error fetching check-ins:", error);
        alert("Error fetching check-ins: " + error.message);
    }
}

// --- Goto Check-in ---
function gotoCheckin(classroomId, checkinId) {
    currentCheckinId = checkinId;
    manageClassDiv.style.display = 'none';
    checkinDiv.style.display = 'block';

    const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId);
    checkinRef.get().then((doc) => {
        if (doc.exists) {
            const checkinData = doc.data();
            checkinTitleH3.textContent = `Check-in: ${checkinData.createdAt.toDate().toLocaleString()}`;

            startCheckinButton.disabled = checkinData.status === 'open';
            closeCheckinButton.disabled = checkinData.status === 'closed';

            // Event listeners (OUTSIDE the .then())
            startCheckinButton.addEventListener('click', () => startCheckin(classroomId, checkinId));
            closeCheckinButton.addEventListener('click', () => closeCheckin(classroomId, checkinId));
            showStudentsCheckinButton.addEventListener('click', () => showCheckedInStudents(classroomId, checkinId));
            qnaButton.addEventListener('click', () => gotoQnA(classroomId, checkinId));
            goBackButton2.addEventListener('click', () => {
                checkinDiv.style.display = 'none';
                manageClassDiv.style.display = 'block';
            });

        } else {
            console.log("No such check-in document!");
        }
    }).catch((error) => {
        console.log("Error getting check-in document:", error);
    });
}

// --- Start/Close Check-in ---
async function startCheckin(classroomId, checkinId) {
    try {
        const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId);
        await checkinRef.update({
            status: 'open'
        });
        startCheckinButton.disabled = true;
        closeCheckinButton.disabled = false;
        console.log("Check-in started!");
        alert("Check-in started!");
    } catch (error) {
        console.error("Error starting check-in:", error);
        alert("Error starting check-in: " + error.message);
    }
}

async function closeCheckin(classroomId, checkinId) {
    try {
        const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId);
        await checkinRef.update({
            status: 'closed'
        });
        startCheckinButton.disabled = false;
        closeCheckinButton.disabled = true;
        console.log("Check-in closed!");
        alert("Check-in closed!");
    } catch (error) {
        console.error("Error closing check-in:", error);
        alert("Error closing check-in: " + error.message);
    }
}

// --- แสดงรายชื่อผู้เช็กชื่อ ---
async function showCheckedInStudents(classroomId, checkinId) {
    try {
        const checkedInRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId).collection('checkedInStudents');
        const snapshot = await checkedInRef.get();

        studentsCheckinListUl.innerHTML = '';

        if (snapshot.empty) {
            studentsCheckinListUl.innerHTML = '<li>No students have checked in yet.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const studentData = doc.data();
            const listItem = document.createElement('li');
            listItem.textContent = `${studentData.stid} - ${studentData.name} - คะแนน: ${studentData.grade || 1}`;

            // เพิ่มปุ่มเพื่อให้ครูสามารถบันทึกคะแนนการเข้าเรียน
            const gradeButton = document.createElement('button');
            gradeButton.textContent = 'บันทึกคะแนน';
            gradeButton.addEventListener('click', () => {
                // ฟังก์ชันบันทึกคะแนนการเข้าเรียน
                recordAttendanceGrade(classroomId, checkinId, studentData.stid);
            });

            listItem.appendChild(gradeButton);
            studentsCheckinListUl.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching checked-in students:", error);
        alert("Error fetching checked-in students: " + error.message);
    }
}

// --- ฟังก์ชันสำหรับบันทึกคะแนนการเข้าเรียน ---
async function recordAttendanceGrade(classroomId, checkinId, studentId) {
    const currentGrade = prompt("กรุณากรอกคะแนนการเข้าเรียนสำหรับนักเรียนคนนี้:", 1);
    if (currentGrade !== null) {
        try {
            const grade = parseInt(currentGrade, 10);
            if (isNaN(grade)) {
                alert("กรุณากรอกคะแนนที่เป็นตัวเลข");
                return;
            }

            const studentRef = db.collection('classrooms').doc(classroomId)
                .collection('checkins').doc(checkinId)
                .collection('checkedInStudents').doc(studentId);

            await studentRef.update({
                grade: grade  // บันทึกคะแนนเข้าเรียน
            });

            console.log("Attendance grade recorded!");
            alert("บันทึกคะแนนการเข้าเรียนสำเร็จ!");
        } catch (error) {
            console.error("Error recording attendance grade:", error);
            alert("Error recording attendance grade: " + error.message);
        }
    }
}

// --- ฟังก์ชันสำหรับเพิ่มผู้เช็คชื่อและตั้งค่าคะแนนเริ่มต้นเป็น 1 ---
async function addStudentToCheckin(classroomId, checkinId, studentId, studentName) {
    try {
        const studentRef = db.collection('classrooms').doc(classroomId)
            .collection('checkins').doc(checkinId)
            .collection('checkedInStudents').doc(studentId);

        // เพิ่มข้อมูลนักเรียนพร้อมคะแนนเริ่มต้น
        await studentRef.set({
            stid: studentId,
            name: studentName,
            grade: 1,  
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("Student added to check-in with initial grade of 1.");
    } catch (error) {
        console.error("Error adding student to check-in:", error);
        alert("Error adding student: " + error.message);
    }
}










// // --- ฟังก์ชันสำหรับเพิ่มการเช็คชื่อ ---
// async function addCheckin(classroomId, checkinCode) {
//     if (!checkinCode || checkinCode.trim() === "") {
//         alert("กรุณากรอกโค้ดการเช็คชื่อ");
//         return;
//     }

//     try {
//         const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc();
//         currentCheckinId = checkinRef.id;

//         await checkinRef.set({
//             createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             status: 'open',  // สถานะเริ่มต้นเป็น 'open'
//             code: checkinCode
//         });

//         console.log("Check-in created successfully!");
//         alert("Check-in created successfully!");
//         displayCheckins(classroomId); // แสดงรายการเช็กชื่อ
//         showCheckinCode(checkinCode); // แสดงรหัสเช็กชื่อ
//         gotoCheckin(classroomId, currentCheckinId);
//     } catch (error) {
//         console.error("Error creating check-in:", error);
//         alert("Error creating check-in: " + error.message);
//     }
// }

// // --- แสดงรหัสเช็กชื่อ ---
// function showCheckinCode(checkinCode) {
//     // แสดงรหัสการเช็คชื่อในหน้า UI
//     const checkinCodeDiv = document.getElementById('checkin-code-display');
//     checkinCodeDiv.textContent = `รหัสเช็กชื่อ: ${checkinCode}`;
// }

// // --- แสดงรายการการเช็คชื่อ ---
// async function displayCheckins(classroomId) {
//     try {
//         const checkinsRef = db.collection('classrooms').doc(classroomId).collection('checkins');
//         const snapshot = await checkinsRef.orderBy('createdAt', 'desc').get();

//         checkinListUl.innerHTML = '';

//         if (snapshot.empty) {
//             checkinListUl.innerHTML = '<li>No check-ins found.</li>';
//             return;
//         }

//         snapshot.forEach(doc => {
//             const checkinData = doc.data();
//             const listItem = document.createElement('li');
//             const checkinId = doc.id;
//             listItem.textContent = `Check-in: ${checkinData.createdAt.toDate().toLocaleString()} - Status: ${checkinData.status}`;

//             const manageCheckinButton = document.createElement('button');
//             manageCheckinButton.textContent = 'Manage';
//             manageCheckinButton.addEventListener('click', () => {
//                 gotoCheckin(classroomId, checkinId);
//             });

//             listItem.appendChild(manageCheckinButton);
//             checkinListUl.appendChild(listItem);
//         });
//     } catch (error) {
//         console.error("Error fetching check-ins:", error);
//         alert("Error fetching check-ins: " + error.message);
//     }
// }

// // --- ไปที่หน้าจัดการการเช็คชื่อ ---
// function gotoCheckin(classroomId, checkinId) {
//     currentCheckinId = checkinId;
//     manageClassDiv.style.display = 'none';
//     checkinDiv.style.display = 'block';

//     const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId);
//     checkinRef.get().then((doc) => {
//         if (doc.exists) {
//             const checkinData = doc.data();
//             checkinTitleH3.textContent = `Check-in: ${checkinData.createdAt.toDate().toLocaleString()}`;

//             startCheckinButton.disabled = checkinData.status === 'open';
//             closeCheckinButton.disabled = checkinData.status === 'closed';

//             startCheckinButton.addEventListener('click', () => startCheckin(classroomId, checkinId));
//             closeCheckinButton.addEventListener('click', () => closeCheckin(classroomId, checkinId));
//             showStudentsCheckinButton.addEventListener('click', () => showCheckedInStudents(classroomId, checkinId));
//             qnaButton.addEventListener('click', () => gotoQnA(classroomId, checkinId));
//             goBackButton2.addEventListener('click', () => {
//                 checkinDiv.style.display = 'none';
//                 manageClassDiv.style.display = 'block';
//             });
//         } else {
//             console.log("No such check-in document!");
//         }
//     }).catch((error) => {
//         console.log("Error getting check-in document:", error);
//     });
// }

// // --- แสดงรายชื่อผู้เช็กชื่อ ---
// async function showCheckedInStudents(classroomId, checkinId) {
//     try {
//         const checkedInRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId).collection('checkedInStudents');
//         const snapshot = await checkedInRef.get();

//         studentsCheckinListUl.innerHTML = '';

//         if (snapshot.empty) {
//             studentsCheckinListUl.innerHTML = '<li>No students have checked in yet.</li>';
//             return;
//         }

//         snapshot.forEach(doc => {
//             const studentData = doc.data();
//             const listItem = document.createElement('li');
//             listItem.textContent = `${studentData.stid} - ${studentData.name} - คะแนน: ${studentData.grade || 1}`;

//             // เพิ่มปุ่มเพื่อให้ครูสามารถบันทึกคะแนนการเข้าเรียน
//             const gradeButton = document.createElement('button');
//             gradeButton.textContent = 'บันทึกคะแนน';
//             gradeButton.addEventListener('click', () => {
//                 // ฟังก์ชันบันทึกคะแนนการเข้าเรียน
//                 recordAttendanceGrade(classroomId, checkinId, studentData.stid);
//             });

//             listItem.appendChild(gradeButton);
//             studentsCheckinListUl.appendChild(listItem);
//         });
//     } catch (error) {
//         console.error("Error fetching checked-in students:", error);
//         alert("Error fetching checked-in students: " + error.message);
//     }
// }

// // --- ฟังก์ชันสำหรับบันทึกคะแนนการเข้าเรียน ---
// async function recordAttendanceGrade(classroomId, checkinId, studentId) {
//     const currentGrade = prompt("กรุณากรอกคะแนนการเข้าเรียนสำหรับนักเรียนคนนี้:", 1);
//     if (currentGrade !== null) {
//         try {
//             const grade = parseInt(currentGrade, 10);
//             if (isNaN(grade)) {
//                 alert("กรุณากรอกคะแนนที่เป็นตัวเลข");
//                 return;
//             }

//             const studentRef = db.collection('classrooms').doc(classroomId)
//                 .collection('checkins').doc(checkinId)
//                 .collection('checkedInStudents').doc(studentId);

//             await studentRef.update({
//                 grade: grade  // บันทึกคะแนนเข้าเรียน
//             });

//             console.log("Attendance grade recorded!");
//             alert("บันทึกคะแนนการเข้าเรียนสำเร็จ!");
//         } catch (error) {
//             console.error("Error recording attendance grade:", error);
//             alert("Error recording attendance grade: " + error.message);
//         }
//     }
// }

// // --- ฟังก์ชันสำหรับเพิ่มผู้เช็คชื่อและตั้งค่าคะแนนเริ่มต้นเป็น 1 ---
// async function addStudentToCheckin(classroomId, checkinId, studentId, studentName) {
//     try {
//         const studentRef = db.collection('classrooms').doc(classroomId)
//             .collection('checkins').doc(checkinId)
//             .collection('checkedInStudents').doc(studentId);

//         // เพิ่มข้อมูลนักเรียนพร้อมคะแนนเริ่มต้น
//         await studentRef.set({
//             stid: studentId,
//             name: studentName,
//             grade: 1,  // ตั้งค่าคะแนนเริ่มต้นเป็น 1
//             timestamp: firebase.firestore.FieldValue.serverTimestamp()
//         });

//         console.log("Student added to check-in with initial grade of 1.");
//     } catch (error) {
//         console.error("Error adding student to check-in:", error);
//         alert("Error adding student: " + error.message);
//     }
// }
// async function closeCheckin(classroomId, checkinId) {
//         try {
//             const checkinRef = db.collection('classrooms').doc(classroomId).collection('checkins').doc(checkinId);
//             await checkinRef.update({
//                 status: 'closed'
//             });
//             startCheckinButton.disabled = false;
//             closeCheckinButton.disabled = true;
//             console.log("Check-in closed!");
//             alert("Check-in closed!");
//         } catch (error) {
//             console.error("Error closing check-in:", error);
//             alert("Error closing check-in: " + error.message);
//         }
//     }










// --- Q&A ---
function gotoQnA(classroomId, checkinId) {
    checkinDiv.style.display = 'none';
    qnaDiv.style.display = 'block';

    startQnaButton.addEventListener('click', () => startQnA(classroomId, checkinId));
    closeQnaButton.addEventListener('click', () => closeQnA(classroomId, checkinId));
    goBackButton3.addEventListener('click', () => { //add go back button
        qnaDiv.style.display = 'none';
        checkinDiv.style.display = 'block';
    });
}

async function startQnA(classroomId, checkinId) {
    const questionNo = questionNoInput.value.trim();
    const questionText = questionTextInput.value.trim();

    if (!questionNo || !questionText) {
        alert("Please enter both question number and text.");
        return;
    }

    try {
        const qnaRef = db.collection('classrooms').doc(classroomId)
            .collection('checkins').doc(checkinId)
            .collection('qna').doc(questionNo);

        await qnaRef.set({
            question: questionText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "open",
            answers: {}
        });

        console.log("Question added!");
        alert("Question added!");
        questionNoInput.value = '';
        questionTextInput.value = '';

    } catch (error) {
        console.error("Error adding question:", error);
        alert("Error adding question: " + error.message);
    }
}

async function closeQnA(classroomId, checkinId) {
    const questionNo = questionNoInput.value.trim();
    if (!questionNo) {
        alert("Please enter question number to close.");
        return;
    }
    try {
        const qnaRef = db.collection('classrooms').doc(classroomId)
            .collection('checkins').doc(checkinId)
            .collection('qna').doc(questionNo);

        await qnaRef.update({ status: 'closed' });

        console.log("Question closed!");
        alert("Question closed!");
    }
    catch (error) {
        console.error("Error closing question:", error);
        alert("Error closing question: " + error.message);
    }
}
