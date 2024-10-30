import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../data/firebaseDB";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  TextInput,
  CheckBox,
  ActivityIndicator,
  Platform,
  Button
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import SubHeader from "../component/SubHeader";

function IpdScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [patientData, setPatientData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [comment, setComment] = useState(""); // สำหรับเก็บความคิดเห็นของอาจารย์
  const currentUserUid = useSelector((state) => state.user.uid); // สมมติว่า uid เก็บอยู่ใน userUid ของ state
  const role = useSelector((state) => state.role);
  const subject = useSelector((state) => state.subject);
  const [isVisible, setIsVisible] = useState(false);

  const [students, setStudents] = useState([]); 
  const [studentId, setStudentId] = useState(null); 
  const [studentName, setStudentName] = useState(null); 
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [windowHeight, setWindowHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLandscape, setIsLandscape] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState("pending");
  const statusOptions = [
    { key: "all", value: "All" },
    { key: "pending", value: "Pending" },
    { key: "approved", value: "Approved" },
    { key: "rejected", value: "Rejected" },
    { key: "recheck", value: "Recheck" },
];

  const dateOptions = [
    { key: 'newest', value: 'Newest to Oldest' },
    { key: 'oldest', value: 'Oldest to Newest' }
  ];
  
  const [selectedSubject, setSelectedSubject] = useState("All");
  const subjectsByYear = [
    { key: "All", value: "All" },
    { key: "Family medicine clerkship", value: "Family medicine clerkship" },
    { key: "Internal medicine clerkship", value: "Internal medicine clerkship" },
    { key: "Surgery clerkship", value: "Surgery clerkship" },
    {
      key: "Anesthesiology, cardiology and critical care medicine clerkship",
      value: "Anesthesiology, cardiology and critical care medicine clerkship",
    },
    {
      key: "Obstetrics and gynecology clerkship",
      value: "Obstetrics and gynecology clerkship",
    },
    {
      key: "Pediatric clerkship",
      value: "Pediatric clerkship",
    },
    {
      key: "Ambulatory medicine clerkship",
      value: "Ambulatory medicine clerkship",
    },
    {
      key: "Accident and emergency medicine clerkship",
      value: "Accident and emergency medicine clerkship",
    },
    {
      key: "Oncology and palliative medicine clerkship",
      value: "Oncology and palliative medicine clerkship",
    },
    {
      key: "Practicum in internal medicine",
      value: "Practicum in internal medicine",
    },
    { key: "Practicum in surgery", value: "Practicum in surgery" },
    { key: "Practicum in Pediatrics", value: "Practicum in Pediatrics" },
    {
      key: "Practicum in Obstetrics and gynecology",
      value: "Practicum in Obstetrics and gynecology",
    },
    {
      key: "Practicum in orthopedics and emergency medicine",
      value: "Practicum in orthopedics and emergency medicine",
    },
    {
      key: "Practicum in community hospital",
      value: "Practicum in community hospital",
    },
  ];

  const [searchText, setSearchText] = useState("");
  const [filteredPatientData, setFilteredPatientData] = useState([]); // state เก็บข้อมูลผู้ใช้ที่ผ่านการกรอง
  const [unfilteredPatientData, setUnfilteredPatientData] = useState([]);

  const [
    professionalismScoresModalVisible,
    setProfessionalismScoresModalVisible,
  ] = useState(false);

  const [professionalismScores, setProfessionalismScores] = useState({
    basicKnowledge: false,
    clinicalSkills: false,
    problemIdentification: false,
    managementProblem: false,
    patientEducation: false,
    evidenceBase: false,
    ethicalManner: false
  });

  // ประกาศ State สำหรับการเก็บค่าการให้คะแนน
  const [rating, setRating] = useState("");

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSearch = (text) => {
    const searchText = text.toLowerCase();

    // ตรวจสอบว่าถ้าไม่มีการค้นหา (text ว่าง) ให้แสดงทุกรายชื่อ
    if (!searchText.trim()) {
      setFilteredPatientData(unfilteredPatientData); // ใช้ข้อมูลทั้งหมดโดยไม่กรองเมื่อไม่มีการค้นหา
      return;
    }

    // ค้นหาใน Collection patients และ filter ตามเงื่อนไขที่กำหนด
    const filteredPatients = unfilteredPatientData.filter(
      (patient) =>
        patient.patientType === "inpatient" && // ตรวจสอบ patientType เป็น inpatient
        patient.hn &&
        patient.hn.toLowerCase().includes(searchText)
    );

    setFilteredPatientData(filteredPatients);
  };

  useEffect(() => {
    // ตั้งค่าข้อมูลทั้งหมดของผู้ใช้เมื่อคอมโพเนนต์โหลด
    setUnfilteredPatientData(patientData);
  }, [patientData]); // ให้ useEffect ทำงานเมื่อ patientData เปลี่ยน

  useEffect(() => {
    // เรียก handleSearch เมื่อ searchText เปลี่ยน
    handleSearch(searchText);
  }, [searchText, unfilteredPatientData, sortOrder]); // ให้ useEffect ทำงานเมื่อ searchText หรือ unfilteredPatientData เปลี่ยน

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  const filterByDateRange = (patients) => {
    return patients.filter((patient) => {
      const admissionDate = patient.admissionDate.toDate();
      const admissionDateOnly = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), admissionDate.getDate());
      const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
      if (startDateOnly && endDateOnly) {
        return admissionDateOnly >= startDateOnly && admissionDateOnly <= endDateOnly;
      } else if (startDateOnly) {
        return admissionDateOnly >= startDateOnly;
      } else if (endDateOnly) {
        return admissionDateOnly <= endDateOnly;
      }
      return true;
    });
  };

  const StartDateInput = () => {
    if (Platform.OS === "web") {
      return (
        <input
          type="date"
          style={{
            padding: 10,
            fontSize: 16,
            width: "90%",
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
          }}
          value={startDate ? startDate.toISOString().substr(0, 10) : ""}
          onChange={(event) => setStartDate(event.target.value ? new Date(event.target.value) : null)}
        />
      );
    } else {
      return (
        <>
          <Button onPress={showStartDatePicker} title="Show date picker!" />
          {showStartDatePicker && (
            <DateTimePicker
              testID="startDateTimePicker"
              value={startDate || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleStartDateChange}
            />
          )}
        </>
      );
    }
  };

  const EndDateInput = () => {
    if (Platform.OS === "web") {
      return (
        <input
          type="date"
          style={{
            padding: 10,
            fontSize: 16,
            width: "90%",
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
          }}
          value={endDate.toISOString().substr(0, 10)}
          onChange={(event) => setEndDate(new Date(event.target.value))}
        />
      );
    } else {
      return (
        <>
          <Button onPress={showEndDatePicker} title="Show date picker!" />
          {showEndDatePicker && (
            <DateTimePicker
              testID="endDateTimePicker"
              value={endDate || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleEndDateChange}
            />
          )}
        </>
      );
    }
  };

  const updateWindowDimensions = () => {
    setWindowWidth(Dimensions.get("window").width);
    setWindowHeight(Dimensions.get("window").height);
  };

  useEffect(() => {
    updateWindowDimensions();
    Dimensions.addEventListener("change", updateWindowDimensions);

    return () => {
      Dimensions.removeEventListener("change", updateWindowDimensions);
    };
  }, []);

  const isMobile = windowWidth < 768; // ตรวจสอบว่าอุปกรณ์เป็น Mobile หรือไม่
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // ตรวจสอบว่าอุปกรณ์เป็น Tablet หรือไม่
  const isPC = windowWidth >= 1024; // ตรวจสอบว่าอุปกรณ์เป็น PC หรือไม่

  // ฟังก์ชันเพื่อจัดการการเปลี่ยนแปลงของ Checkbox
  const handleCheckboxChange = (scoreName) => {
    setProfessionalismScores((prevScores) => ({
      ...prevScores,
      [scoreName]: !prevScores[scoreName],
    }));
  };

  useEffect(() => {
    if (selectedPatient) {
      if (selectedStatus === "recheck") {
        setComment(selectedPatient.comment || "");
        setRating(selectedPatient.rating || "");
        setProfessionalismScores(
          selectedPatient.professionalismScores || {
            basicKnowledge: false,
            clinicalSkills: false,
            problemIdentification: false,
            managementProblem: false,
            patientEducation: false,
            evidenceBase: false,
            ethicalManner: false
          }
        );
      } else if (selectedStatus === "all") {
        setComment(selectedPatient.comment || "");
        setRating(selectedPatient.rating || "");
        setProfessionalismScores(
          selectedPatient.professionalismScores || {
            basicKnowledge: false,
            clinicalSkills: false,
            problemIdentification: false,
            managementProblem: false,
            patientEducation: false,
            evidenceBase: false,
            ethicalManner: false
        });
      } else if (selectedStatus === "pending") {
        setComment("");
        setRating("");
        setProfessionalismScores({
          basicKnowledge: false,
          clinicalSkills: false,
          problemIdentification: false,
          managementProblem: false,
          patientEducation: false,
          evidenceBase: false,
          ethicalManner: false
        });
      }
    }
  }, [selectedStatus, selectedPatient]);

  const isEditable = () => {
    if (selectedStatus === "pending") {
      return true;
    } else if (selectedStatus === "recheck") { 
      return selectedPatient ? selectedPatient.isEdited : false;
    } else if (selectedStatus === "all") {
      if (selectedPatient && selectedPatient.isEdited === false) {
        return false;
      }
      return true; // Default to true if the condition for 'false' is not met
    }
    return false;
  };

  const [isApproveAllModalVisible, setApproveAllModalVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: isMobile ? 10 : 20,
      flexDirection: "column",
      alignItems: "center",
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    inputRow: {
      flexDirection: "row",
      alignContent: "space-between",
      alignItems: "center",
    },
    textInput: {
      width: "100%",
      backgroundColor: "#FEF0E6",
      borderColor: "#FEF0E6",
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      textAlign: "center",
      marginRight: role !== "student" ? 10 : 0,
    },
    selectListBox: {
      width: "100%",
      backgroundColor: "#FEF0E6",
      borderColor: "#FEF0E6",
      borderWidth: 1,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    selectListDropdown: {
      backgroundColor: "#FEF0E6",
      width: "100%",
    },
    boxCard: {
      height: "70%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
      width: isMobile ? "90%" : "90%", // ปรับแต่งความกว้างของ boxCard ตามอุปกรณ์
      marginLeft: isMobile ? "50" : "50",
      marginRight: isMobile ? "50" : "50",
      marginTop: isMobile ? 10 : 20,
    },
    card: {
      width: "95%",
      height: isMobile ? 150 : 150, // ปรับแต่งความสูงของ card ตามอุปกรณ์
      marginVertical: isMobile ? 10 : 20, // ปรับแต่งระยะห่างระหว่าง card ตามอุปกรณ์
      borderRadius: 8,
      backgroundColor: "white",
      alignItems: "left",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 8,
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: isMobile ? "90%" : isTablet ? "70%" : "50%", // Responsive width
      height: isMobile ? "auto" : 400, // Auto height for mobile
    },
    modalView2: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 8,
      padding: 35,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: isMobile ? "90%" : isTablet ? "70%" : "50%", // Responsive width
      height: isMobile ? "80%" : "70%", // Auto height for mobile
    },
    button: {
      backgroundColor: "#05AB9F",
      borderRadius: 5,
    },
    buttonViewPDF: {
      backgroundColor: "#1C4CA7", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15,
    },
    buttonApprove: {
      backgroundColor: "green",
      marginTop: 10,
      textAlign: 'center'
    },
    buttonCancel: {
      backgroundColor: "red",
      marginTop: 10,
    },
    buttonReApprove: {
      backgroundColor: "orange",
      marginTop: 10,
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
    },
    modalText: {
      marginBottom: 15,
      textAlign: "left",
      fontSize: windowWidth < 768 ? 20 : 24,
    },
    modalText2: {
      marginBottom: 15,
      textAlign: "center",
      fontSize: windowWidth < 768 ? 22 : 26,
    },
    centerView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    centerView2: {
      flex: 1,
      justifyContent: "left",
      alignItems: "left",
      backgroundColor: "white",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 20,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginRight: 20,
      marginBottom: 20,
    },
    approveButton: {
      backgroundColor: "green",
      padding: 10,
      borderRadius: 13,
      marginRight: 10,
    },
    rejectButton: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 13,
    },
    buttonText: {
      color: "white",
    },
    icon: {
      position: "absolute",
      right: 10,
      bottom: 10,
      width: 20,
      height: 20,
    },
    leftContainer: {
      flex: 3,
      justifyContent: "center",
    },
    rightContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "flex-end",
    },
    recheckModalButton: {
      flex: 1,
      borderRadius: 13,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginHorizontal: 5, // เพิ่มระยะห่างระหว่างปุ่ม
    },
    buttonLink: {
      backgroundColor: "#2196F3",
      borderRadius: 20,
      padding: 10,
      elevation: 2,
      marginTop: 10,
    },
    cardContainer: {
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    buttonRow: {
      flexDirection: "column",
      justifyContent: "left",
      alignItems: "left",
      width: "100%", // ขนาดของ container ที่มีปุ่ม
    },
    buttonClose: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: "center",
      marginTop: 10,
    },
    buttonClose2: {
      backgroundColor: "blue",
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: "center",
      marginTop: 10,
    },
    professionalismHeader: {
      fontWeight: "bold",
      fontSize: 24,
      marginBottom: 10,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%", // Full width for checkbox row
      justifyContent: "flex-start", // Align items to left
      marginBottom: 10,
    },
    checkboxLabel: {
      marginLeft: 10,
      fontSize: 20,
    },
    deleteButton: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 5,
      margin: 5,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
    },
    buttonProfessional: {
      backgroundColor: "blue", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15,
    },
  });

  const thaiMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatDateToThai = (date) => {
    if (!date) return "";
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = formatTimeUnit(date.getHours());
    const minutes = formatTimeUnit(date.getMinutes());
    return `${day} ${thaiMonths[month]} ${year} | ${hours}:${minutes}`;
  };

  const formatDate2 = (date) => {
    if (!date) return "";
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    return `${day} ${thaiMonths[month]} ${year}`;
  };

  useEffect(() => {
    async function fetchStudents() {
      try {
        const studentRef = collection(db, "users");
        const q = query(studentRef, where("role", "==", "student")); // ใช้ query และ where ในการ filter

        const querySnapshot = await getDocs(q); // ใช้ query ที่ถูก filter ในการ getDocs

        const studentArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          studentArray.push({ key: doc.id, value: data.displayName });
        });

        setStudents(studentArray); // ตั้งค่ารายการอาจารย์
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    }

    fetchStudents(); // เรียกฟังก์ชันเพื่อดึงข้อมูลอาจารย์
  }, []);

  const onSelectStudent = (selectedStudentId) => {
    const selectedStudent = students.find(
      (student) => student.key === selectedStudentId
    );
    // console.log(selectedTeacher)
    if (selectedStudent) {
      setStudentName(selectedStudent.value);
      setStudentId(selectedStudent.key);
    } else {
      console.error("Student not found:", selectedStudentId);
    }
  };


  const loadPatientData = async () => {
    try {
      setIsLoading(true);
  
      const patientCollectionRef = collection(db, "patients");
      let q;
  
      if (role === "student") {
        // Fetch inpatients created by the current student
        q = query(
          patientCollectionRef,
          where("patientType", "==", "inpatient"),
          where("createBy_id", "==", currentUserUid)
        );
      } else if (role === "teacher") {
        // Fetch inpatients related to the current teacher
        q = query(
          patientCollectionRef,
          where("patientType", "==", "inpatient"),
          where("professorId", "==", currentUserUid)
        );
      }
  
      const querySnapshot = await getDocs(q);
      const patients = [];
  
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        data.id = docSnapshot.id; // Assign id to patient data
  
        let studentName = "";
        let displayData = data;
  
        if (role === "teacher" && data.createBy_id) {
          const userDocRef = doc(db, "users", data.createBy_id);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const patientData = userDocSnapshot.data();
            studentName = patientData.displayName || "";
            displayData = { ...data, studentName };
          }
        }
  
        patients.push(displayData);
      }
  
      setPatientData(patients);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching patient data:", error);
    }
  };

  useEffect(() => {
    const updateLayout = () => {
      const windowWidth = Dimensions.get("window").width;
      const windowHeight = Dimensions.get("window").height;
      setIsLandscape(windowWidth > windowHeight);
    };

    updateLayout();

    Dimensions.addEventListener("change", updateLayout);

    return () => {
      Dimensions.removeEventListener("change", updateLayout);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPatientData();
    });

    return unsubscribe;
  }, [navigation]);

  const formatTimeUnit = (unit) => (unit < 10 ? `0${unit}` : unit.toString());

  const handleCardPress = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);    
  };

  const handleAddData = () => {
    navigation.navigate("AddIpd");
  };

  const handleApprove = async () => {
    try {
      if (rating === "Unsatisfied") {
        alert("ไม่สามารถ Approve ได้(เนื่องจากคุณเลือก Unsatisfied)");
        return; // หยุดการทำงานของฟังก์ชันที่นี่ถ้า rating เป็น unsatisfied
      }
  
      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        status: "approved",
        comment: comment,
        rating: rating,
        approvalTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores, // บันทึกคะแนนความเป็นมืออาชีพ
      });
  
      // รีเซ็ตคะแนนและความคิดเห็น
      resetScoresAndComment();
      setModalVisible(false);
      loadPatientData();
    } catch (error) {
      console.error("Error approving patient:", error);
    }
  };

  const handleReApprove = async () => {
    try {
      if (rating === "Unsatisfied") {
        alert("ไม่สามารถ Recheck ได้(เนื่องจากคุณเลือก Unsatisfied)");
        return; // หยุดการทำงานของฟังก์ชันที่นี่ถ้า rating เป็น unsatisfied
      }

      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        status: "recheck",
        comment: comment,
        rating: rating,
        reApprovalTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores, // บันทึกคะแนนความเป็นมืออาชีพ
        isRecheck: true,
        isEdited: false,
      });
      // รีเซ็ตคะแนนและความคิดเห็น
      resetScoresAndComment();
      setModalVisible(false);
      loadPatientData();
    } catch (error) {
      console.error("Error re-approving patient:", error);
    }
  };

  const handleReject = async () => {
    try {
      const patientDocRef = doc(db, "patients", selectedPatient.id);
      await updateDoc(patientDocRef, {
        status: "rejected",
        comment: comment,
        rating: rating,
        rejectionTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores,
      });
      resetScoresAndComment();
      setModalVisible(false);
      loadPatientData();
    } catch (error) {
      console.error("Error rejecting patient:", error);
    }
  };

  const resetScoresAndComment = () => {
    setComment("");
    setRating("");
    setProfessionalismScores({
      basicKnowledge: false,
      clinicalSkills: false,
      problemIdentification: false,
      managementProblem: false,
      patientEducation: false,
      evidenceBase: false,
      ethicalManner: false
    });
  };

  const renderAddDataButton = () => {
    if (role == "student") {
      return (
        <TouchableOpacity
          onPress={handleAddData}
          style={{
            height: isLandscape ? 37 : 30,
            width: isLandscape ? 174 : 120,
            marginTop: isLandscape ? 25 : 0,
            // marginRight: isLandscape ? 60 : 50,
            marginBottom: isLandscape ? 25 : 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FE810E",
            borderRadius: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: isLandscape ? 22 : 18, color: "white" }}>Add</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const handleActualApproveAll = async () => {
    try {
      // ประมวลผลทั้งหมดที่มีสถานะเป็น pending
      const updates = patientData
        .filter((patient) => patient.status === "pending")
        .map((patient) =>
          updateDoc(doc(db, "patients", patient.id), { status: "approved" })
        );

      // รอให้ทั้งหมดเสร็จสิ้น
      await Promise.all(updates);

      // โหลดข้อมูลใหม่
      loadPatientData();
    } catch (error) {
      console.error("Error approving all patients:", error);
    }
  };

  const handleApproveAll = () => {
    setApproveAllModalVisible(true);
  };

  const renderApprovedButton = () => {
    if (role == "teacher") {
      return (
        <TouchableOpacity
          onPress={handleApproveAll}
          style={{
            height: 52,
            width: 373,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1C4CA7",
            borderRadius: 59,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 22, color: "white" }}>
            Approve all (for professor)
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const handleDelete = async (patientId) => {
    try {
      const patientDocRef = doc(db, "patients", patientId);
      await deleteDoc(patientDocRef);
      loadPatientData(); // โหลดข้อมูลผู้ป่วยใหม่หลังจากลบ
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  const renderCards = () => {
    if (isLoading) {
      // แสดง animation loading หรือข้อความแสดงสถานะ loading
      return (
        <ActivityIndicator size="large" color="#0000ff" />
        // หรือแสดงข้อความเพื่อแจ้งให้ผู้ใช้รู้ว่ากำลังโหลดข้อมูล
        // <Text>Loading...</Text>
      );
    }
    const filteredByDate = filterByDateRange(filteredPatientData);

    return filteredByDate
      .filter(
        (patient) =>
          selectedSubject === "All" ||
          (patient.subject && patient.subject === selectedSubject)
      )
      .filter((patient) =>
            selectedStatus === "all" ? true : patient.status === selectedStatus
          )
      .filter((patient) =>
        role === "student" ? patient.subject === subject : true
      )
      .filter((patient) =>
        studentId ? patient.createBy_id === studentId : true // Show all students if studentId is not selected
      )
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return b.admissionDate.toDate() - a.admissionDate.toDate();
        } else {
          return a.admissionDate.toDate() - b.admissionDate.toDate();
        }
      })
      .map((patient, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(patient)}
        >
          <View style={styles.card}>
            <View style={styles.leftContainer}>
              {role === "student" ? (
                <>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginLeft: 20,
                      lineHeight: 30,
                    }}
                  >
                    HN : {patient.hn} (
                    <Text
                      style={{
                        color: patient.isEdited
                          ? "red"
                          : patient.isEdited === false
                          ? "#e9c46a"
                          : "inherit",
                      }}
                    >
                      {patient.status}
                    </Text>
                    )
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Instructor Name : {patient.professorName}
                  </Text>
                  {patient.status === "pending" ? (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(patient.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(patient.hours)}.
                      {formatTimeUnit(patient.minutes)}
                    </Text>
                  ) : (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(patient.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(patient.hours)}.
                      {formatTimeUnit(patient.minutes)}
                      {patient.approvalTimestamp && (
                        <Text>
                          {" "}
                          (Approved:{" "}
                          {formatDateToThai(patient.approvalTimestamp.toDate())}
                          )
                        </Text>
                      )}
                      {patient.rejectionTimestamp && (
                        <Text>
                          {" "}
                          (Rejected:{" "}
                          {formatDateToThai(
                            patient.rejectionTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {patient.reApprovalTimestamp && (
                        <Text>
                          {" "}
                          (Recheck:{" "}
                          {formatDateToThai(
                            patient.reApprovalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                    </Text>
                  )}

                  { 
                    (selectedStatus === "all" || selectedStatus === "pending" || selectedStatus === "recheck") &&
                      (patient.status === "pending" || patient.status === "recheck") && (
                      <>
                        <TouchableOpacity
                          style={{ position: "absolute", top: 10, right: 10 }}
                          onPress={() => {
                            navigation.navigate("EditIpd", {
                              patientData: patient,
                            });
                          }}
                        >
                          <FontAwesome name="edit" size={24} color="gray" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                          }}
                          onPress={() => {
                            setPatientToDelete(patient.id);
                            setDeleteConfirmationVisible(true);
                          }}
                        >
                          <MaterialIcons name="delete" size={24} color="red" />
                        </TouchableOpacity>
                      </>
                    )}
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginLeft: 20,
                      lineHeight: 30,
                    }}
                  >
                    HN : {patient.hn} (
                    <Text
                      style={{
                        color: patient.isEdited
                          ? "red"
                          : patient.isEdited === false
                          ? "#e9c46a"
                          : "inherit",
                      }}
                    >
                      {patient.status}
                    </Text>
                    )
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Student Name : {patient.studentName}
                  </Text>
                  {patient.status === "pending" ? (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(patient.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(patient.hours)}.
                      {formatTimeUnit(patient.minutes)}
                    </Text>
                  ) : (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(patient.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(patient.hours)}.
                      {formatTimeUnit(patient.minutes)}
                      {patient.approvalTimestamp && (
                        <Text>
                          {" "}
                          (Approved:{" "}
                          {formatDateToThai(patient.approvalTimestamp.toDate())}
                          )
                        </Text>
                      )}
                      {patient.rejectionTimestamp && (
                        <Text>
                          {" "}
                          (Rejected:{" "}
                          {formatDateToThai(
                            patient.rejectionTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {patient.reApprovalTimestamp && (
                        <Text>
                          {" "}
                          (Recheck:{" "}
                          {formatDateToThai(
                            patient.reApprovalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                    </Text>
                  )}
                </>
              )}
            </View>
            {/* {role !== "student" && (
              <View style={styles.rightContainer}>
                <View style={styles.buttonsContainer}>
                  {patient.status === "pending" && (
                    <>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => {
                          setSelectedPatient(patient);
                          setAction("approve");
                          setConfirmationModalVisible(true);
                        }}
                      >
                        <Text style={styles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => {
                          setSelectedPatient(patient);
                          setAction("reject");
                          setConfirmationModalVisible(true);
                        }}
                      >
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )} */}
            <View style={{ position: "absolute", bottom: 5, right: 5 }}>
              {patient.status === "approved" && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {patient.status === "rejected" && (
                <Ionicons name="close-circle" size={24} color="red" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ));
  };

  return (
    <View style={styles.container}>
      <View style={{ marginVertical: windowWidth < 768 ? 0 : 20 }}>
        <SubHeader text="INPATIENT" />
      </View>

      {/* {renderApprovedButton()} */}

      <Button
          title={isVisible ? "Hide Filters" : "Show Filters"}
          onPress={() => setIsVisible(!isVisible)}
        />

      {isVisible && (
        <>
      <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",             // Center items vertically                 // Full width of the parent container
        }}
      >
     <View> <Text style={{ marginBottom: 10, textAlign: 'center'}}>Filter by hn : </Text>
    <TextInput
      style={{
        width: '100%',
        backgroundColor: "#FEF0E6",
        borderColor: "#FEF0E6",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        textAlign: "center",
        marginRight: role !== "student" ? 10 : 0, // Add margin between TextInput and SelectList
      }}
      placeholder="Search by hn"
      value={searchText}
      onChangeText={(text) => {
        setSearchText(text);
      }}
    />
    </View>
  
  </View>
  {role !== "student" && (
  <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",  
        }}
      >
      
        <View> <Text style={{ textAlign: 'center', marginBottom: 10}}>Filter by subject : </Text>
          <SelectList
            data={subjectsByYear}
            setSelected={setSelectedSubject}
            placeholder="Select subjects"
            defaultOption={selectedSubject}
            search={false}
            boxStyles={{
              width: "auto",
              backgroundColor: "#FEF0E6",
              borderColor: "#FEF0E6",
              borderWidth: 1,
              borderRadius: 10,
              marginLeft: 10,
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center'
            }}
            dropdownStyles={{ 
              backgroundColor: "#FEF0E6", 
              width: "50%",              
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center' }}
          />
          </View>
    </View>
    )}

      <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",  
        }}
      >
        <View> <Text style={{ textAlign: 'center', marginBottom: 10}}>Sort by date : </Text>
        <SelectList
          data={dateOptions}
          setSelected={setSortOrder}
          placeholder="Sort by date"
          defaultOption={sortOrder}
          search={false}
          boxStyles={{
            width: '100%',
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          dropdownStyles={{ 
            backgroundColor: "#FEF0E6",
            width: "100%",
           }}
        />
        </View>

        <View style={{ marginLeft: 20}}> <Text style={{ textAlign: 'center', marginBottom: 10}}>Filter by status : </Text>
        <SelectList
          data={statusOptions}
          setSelected={setSelectedStatus}
          placeholder="Pending"
          defaultOption={selectedStatus}
          search={false}
          boxStyles={{
            width: '100%',
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            // marginLeft: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          dropdownStyles={{ 
            backgroundColor: "#FEF0E6" ,
            // marginLeft: 20,
            width: "100%",
          }}
        />
        </View>

      </View>

        <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",  
        }}
      >
        <View> <Text style={{ textAlign: 'center', marginBottom: 10}}>Start Date : </Text>
          <StartDateInput />
        </View>
        <View style={{ marginLeft: 20 }}> <Text style={{ textAlign: 'center', marginBottom: 10}}>End Date : </Text>
          <EndDateInput />
        </View>
      </View>
      
      {role !== "student" && (
      <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",  
        }}
      >
        <View> <Text style={{ textAlign: 'center', marginBottom: 10}}>Filter by medical student name : </Text>
          <SelectList
              setSelected={onSelectStudent}
              data={students}
              placeholder={"Select the Medical student name"}
              placeholderTextColor="grey"
              boxStyles={{
                width: "auto",
                backgroundColor: "#FEF0E6",
                borderColor: "#FEF0E6",
                borderWidth: 1,
                borderRadius: 10,
              }}
              dropdownStyles={{ backgroundColor: "#FEF0E6" }}
            />
        </View>
      </View>
    )}
        </>
      )}

      {/* Modal สำหรับยืนยัน ApproveAll */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isApproveAllModalVisible}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Confirm approval
              <Text style={{ fontWeight: "bold", fontSize: 20 }}> all?</Text>
            </Text>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonApprove]}
                onPress={() => {
                  handleActualApproveAll();
                  setApproveAllModalVisible(false);
                }}
              >
                <Text style={styles.textStyle}>Confirm</Text>
              </Pressable>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonCancel]}
                onPress={() => setApproveAllModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal สำหรับยืนยันการลบ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmationVisible}
        onRequestClose={() => setDeleteConfirmationVisible(false)}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Confirm deletion of patient information?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonApprove]}
                onPress={() => {
                  handleDelete(patientToDelete);
                  setDeleteConfirmationVisible(false);
                }}
              >
                <Text style={styles.textStyle}>Confirm</Text>
              </Pressable>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonCancel]}
                onPress={() => setDeleteConfirmationVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.boxCard}>
        {role === "student" && (
          <View styles={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.modalText}>
              <Text style={{ fontWeight: "bold" }}>{subject}</Text>
            </Text>
            {renderAddDataButton()}
          </View>
        )}
        <ScrollView>{renderCards()}</ScrollView>
      </View>

      {/*  Modal สำหรับแสดงข้อมูลในการ์ด */}
      {/* สำคัญ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView2}>
            <ScrollView>
              {selectedPatient && (
                <>
                  {role !== "student" && selectedPatient.subject ? (
                    <Text style={styles.modalText2}>
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedPatient.subject}
                      </Text>
                    </Text>
                  ) : null}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Admission Date :{" "}
                    </Text>
                    {formatDate2(selectedPatient.admissionDate.toDate())}
                  </Text>
                  {selectedPatient.hours !== "" &&
                    selectedPatient.minutes !== "" && (
                      <>
                        <Text style={styles.modalText}>
                          <Text style={{ fontWeight: "bold" }}>
                            Admission Time :{" "}
                          </Text>
                          {formatTimeUnit(selectedPatient.hours)}.
                          {formatTimeUnit(selectedPatient.minutes)}
                        </Text>
                      </>
                    )}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Instructor Name :{" "}
                    </Text>{" "}
                    {selectedPatient.professorName}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>HN :</Text>{" "}
                    {selectedPatient.hn || "ไม่มี"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Main Diagnosis :{" "}
                    </Text>
                    {selectedPatient.mainDiagnosis || "None"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Co - Morbid Diseases :{" "}
                    </Text>
                    {selectedPatient.coMorbid &&
                    selectedPatient.coMorbid.length > 0 &&
                    selectedPatient.coMorbid.some(
                      (diagnosis) => diagnosis.value
                    )
                      ? selectedPatient.coMorbid
                          .map((diagnosis) => diagnosis.value)
                          .join(", ")
                      : "ไม่ระบุ"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Note/Reflection :{" "}
                    </Text>{" "}
                    {selectedPatient.note || "ไม่มี"}
                  </Text>

                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "all" && 
                      (selectedPatient.status !== "pending" && 
                      (role === "student" || (role === "teacher" && selectedPatient.status !== "recheck")) && 
                      (selectedPatient.status === "approved" || selectedPatient.status === "rejected" || selectedPatient.status === "recheck"))) ||
                    (selectedStatus === "recheck" && role === "student")) && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Rating : </Text>
                      {selectedPatient.rating || "ไม่มี"}
                    </Text>
                  )}

                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "all" && 
                      (selectedPatient.status !== "pending" && 
                      (role === "student" || (role === "teacher" && selectedPatient.status !== "recheck")) && 
                      (selectedPatient.status === "approved" || selectedPatient.status === "rejected" || selectedPatient.status === "recheck"))) ||
                    (selectedStatus === "recheck" && role === "student")) && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>***Comment : </Text>
                      {selectedPatient.comment || "ไม่มี"}
                    </Text>
                  )}

                  <View style={styles.buttonRow}>
                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "all" && 
                      (selectedPatient.status !== "pending" && 
                      (role === "student" || (role === "teacher" && selectedPatient.status !== "recheck")) && 
                      (selectedPatient.status === "approved" || selectedPatient.status === "rejected" || selectedPatient.status === "recheck"))) ||
                    (selectedStatus === "recheck" && role === "student")) && (
                      <Pressable
                        style={[styles.button, styles.buttonProfessional]}
                        onPress={() =>
                          setProfessionalismScoresModalVisible(true)
                        }
                      >
                        <Text style={styles.textStyle}>
                          View Professionalism Score
                        </Text>
                      </Pressable>
                    )}

                    {role !== "student" &&
                      selectedStatus !== "approved" &&
                      selectedStatus !== "rejected" &&
                      (selectedStatus === "all" || selectedStatus === "pending" || selectedStatus === "recheck") &&
                      (selectedPatient.status === "pending" || selectedPatient.status === "recheck") &&  (
                        <View style={styles.centerView2}>
                          <Text style={styles.professionalismHeader}>
                            Professionalism
                          </Text>{" "}
                          (เลือกได้หลายตัวเลือก)
                          {/* แสดง Checkbox และ Label */}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.basicKnowledge}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("basicKnowledge")
                                }
                              />
                              <Text style={styles.checkboxLabel}>Basic knowledge/basic science</Text>
                            </View>
                          )}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.clinicalSkills
                                }
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("clinicalSkills")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Clinical skills (history taking and physical examination)
                              </Text>
                            </View>
                          )}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.problemIdentification}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("problemIdentification")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Problem identification and approaching
                              </Text>
                            </View>
                          )}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.managementProblem}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("managementProblem")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Management/Problem solving
                              </Text>
                            </View>
                          )}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.patientEducation}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("patientEducation")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Patient education
                              </Text>
                            </View>
                          )}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.evidenceBase
                                }
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("evidenceBase")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Evidence-based medicine
                              </Text>
                            </View>
                          )}
                          {selectedPatient && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.ethicalManner
                                }
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("ethicalManner")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Ethical and manner issues
                              </Text>
                            </View>
                          )}
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: "bold",
                              marginBottom: 10,
                            }}
                          >
                            Rating
                          </Text>{" "}
                          (เลือกได้เพียง 1 ตัวเลือก)
                          <View style={styles.checkboxContainer}>
                            <CheckBox
                              value={rating === "Excellent"}
                              disabled={!isEditable()}
                              onValueChange={() =>
                                handleRatingChange("Excellent")
                              }
                            />
                            <Text style={styles.checkboxLabel}>Excellent</Text>
                          </View>
                          <View style={styles.checkboxContainer}>
                            <CheckBox
                              value={rating === "Good"}
                              disabled={!isEditable()}
                              onValueChange={() => handleRatingChange("Good")}
                            />
                            <Text style={styles.checkboxLabel}>Good</Text>
                          </View>
                          <View style={styles.checkboxContainer}>
                            <CheckBox
                              value={rating === "Acceptable"}
                              disabled={!isEditable()}
                              onValueChange={() =>
                                handleRatingChange("Acceptable")
                              }
                            />
                            <Text style={styles.checkboxLabel}>Acceptable</Text>
                          </View>
                          <View style={styles.checkboxContainer}>
                            <CheckBox
                              value={rating === "Unsatisfied"}
                              disabled={!isEditable()}
                              onValueChange={() =>
                                handleRatingChange("Unsatisfied")
                              }
                            />
                            <Text style={styles.checkboxLabel}>
                              Unsatisfied
                            </Text>
                          </View>
                          {rating === "Unsatisfied" && ( 
                            <Text>(ไม่สามารถเลือก Approve หรือ Recheck ได้)</Text>
                          )}
                          <Text
                            style={{
                              marginBottom: 10,
                              fontSize: 24,
                              fontWeight: "bold",
                            }}
                          >
                            Add comment (optional)
                          </Text>
                          <TextInput
                            placeholder="Please enter a comment."
                            placeholderTextColor="grey"
                            value={comment}
                            onChangeText={(text) => setComment(text)}
                            multiline
                            numberOfLines={4}
                            editable={isEditable()}
                            style={{
                              height: 150,
                              width: "100%",
                              borderColor: "gray",
                              borderWidth: 1,
                              borderRadius: 10,
                              marginBottom: 20,
                              textAlignVertical: "top",
                            }}
                          />
                          {selectedPatient.pdfUrl && (
                            <Pressable
                              style={[styles.button, styles.buttonViewPDF]}
                              onPress={() =>
                                Linking.openURL(selectedPatient.pdfUrl)
                              }
                            >
                              <Text style={styles.textStyle}>
                                View Upload File
                              </Text>
                            </Pressable>
                          )}
                          <View style={styles.buttonContainer}>
                          {((selectedPatient.isEdited === undefined || selectedPatient.isEdited === true) &&
                              selectedStatus === "all" || selectedStatus === "pending" || (selectedStatus === "recheck" && selectedPatient.isEdited === true)) &&
                              (selectedPatient.status === "pending" || selectedPatient.status === "recheck") && (
                              <Pressable
                                style={[
                                  styles.recheckModalButton,
                                  styles.buttonApprove,
                                ]}
                                onPress={() => handleApprove()}
                              >
                                <Text style={styles.textStyle}>Approve</Text>
                              </Pressable>
                            )}
                            {/* {!selectedPatient.isrecheck && ( */}
                          {((selectedPatient.isEdited === undefined && selectedPatient.isRecheck === undefined) || selectedPatient.isEdited === true) && (
                            <Pressable
                              style={[
                                styles.recheckModalButton,
                                styles.buttonReApprove,
                              ]}
                              onPress={() => handleReApprove()}
                            >
                              <Text style={styles.textStyle}>Recheck</Text>
                            </Pressable>
                          )}
                            {/* )} */}
                           {((selectedPatient.isEdited === undefined || selectedPatient.isEdited === true) &&
                              selectedStatus === "all" || selectedStatus === "pending" || (selectedStatus === "recheck" && selectedPatient.isEdited === true)) &&
                              (selectedPatient.status === "pending" || selectedPatient.status === "recheck") && (
                              <Pressable
                                style={[
                                  styles.recheckModalButton,
                                  styles.buttonCancel,
                                ]}
                                onPress={() => handleReject()}
                              >
                                <Text style={styles.textStyle}>Reject</Text>
                              </Pressable>
                            )}
                          </View>
                          <Pressable
                            style={[styles.button, styles.buttonClose2]}
                            onPress={() => setModalVisible(false)}
                          >
                            <Text style={styles.textStyle}>Close</Text>
                          </Pressable>
                        </View>
                      )}

                    {(role !== "teacher" ||
                      (role === "teacher" &&
                        (selectedStatus === "approved" ||
                          selectedStatus === "rejected" ||
                          (selectedStatus === "all" && (selectedPatient.status !== "pending" && selectedPatient.status !== "recheck"))))) &&
                      selectedPatient.pdfUrl && (
                        <Pressable
                          style={[styles.button, styles.buttonViewPDF]}
                          onPress={() =>
                            Linking.openURL(selectedPatient.pdfUrl)
                          }
                        >
                          <Text style={styles.textStyle}>View Upload File</Text>
                        </Pressable>
                      )}

                    {(role !== "teacher" ||
                      (role === "teacher" &&
                        (selectedStatus === "approved" ||
                          selectedStatus === "rejected" ||
                          (selectedStatus === "all" && (selectedPatient.status !== "pending" && selectedPatient.status !== "recheck"))))) && (
                      <Pressable
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => setModalVisible(!modalVisible)}
                      >
                        <Text style={styles.textStyle}>Close</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Modal สำหรับแสดงคะแนนความเป็นมืออาชีพ */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={
                      professionalismScoresModalVisible &&
                      (selectedPatient.status === "approved" ||
                        selectedPatient.status === "rejected" ||
                        (selectedStatus === "all" && selectedPatient.status !== "pending") ||
                        (selectedPatient.status === "recheck" &&
                          role === "student"))
                    }
                    onRequestClose={() => {
                      setProfessionalismScoresModalVisible(
                        !professionalismScoresModalVisible
                      );
                    }}
                  >
                    <View style={styles.centerView}>
                      <View style={styles.modalView}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 28,
                            marginBottom: 10,
                          }}
                        >
                          Professionalism scores
                        </Text>
                        {selectedPatient.professionalismScores && (
                          <>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Basic knowledge/basic science :{" "}
                              </Text>
                              {selectedPatient.professionalismScores.basicKnowledge
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Clinical skills (history taking and physical examination) :{" "}
                              </Text>
                              {selectedPatient.professionalismScores
                                .clinicalSkills
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Problem identification and approaching :{" "}
                              </Text>
                              {selectedPatient.professionalismScores
                                .problemIdentification
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Management/Problem solving :{" "}
                              </Text>
                              {selectedPatient.professionalismScores
                                .managementProblem
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Patient education :{" "}
                              </Text>
                              {selectedPatient.professionalismScores
                                .patientEducation
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Evidence-based medicine :{" "}
                              </Text>
                              {selectedPatient.professionalismScores
                                .evidenceBase
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Ethical and manner issues :{" "}
                              </Text>
                              {selectedPatient.professionalismScores
                                .ethicalManner
                                ? "✔️"
                                : "❌"}
                            </Text>
                          </>
                        )}

                        <Pressable
                          style={[styles.button, styles.buttonClose]}
                          onPress={() =>
                            setProfessionalismScoresModalVisible(
                              !professionalismScoresModalVisible
                            )
                          }
                        >
                          <Text style={styles.textStyle}>Close</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Modal>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default IpdScreen;
