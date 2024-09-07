import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  deleteDoc,
  query,
  where,
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
  Image,
  Linking,
  Dimensions,
  TextInput,
  CheckBox,
  ActivityIndicator,
  Platform
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import SubHeader from "../component/SubHeader";

function ActivityScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comment, setComment] = useState(""); // สำหรับเก็บความคิดเห็นของอาจารย์
  const [action, setAction] = useState(null);
  const currentUserUid = useSelector((state) => state.user.uid);
  const role = useSelector((state) => state.role);
  const [isLoading, setIsLoading] = useState(true);
  const subject = useSelector((state) => state.subject);

  const [students, setStudents] = useState([]); // สถานะสำหรับเก็บรายการอาจารย์ทั้งหมด
  const [studentId, setStudentId] = useState(null); // สถานะสำหรับเก็บ id ของอาจารย์ที่ถูกเลือก
  const [studentName, setStudentName] = useState(null); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [windowHeight, setWindowHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLandscape, setIsLandscape] = useState(false);

  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const [sortOrder, setSortOrder] = useState('newest');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filteredActivityData, setFilteredActivityData] = useState([]); // state เก็บข้อมูลผู้ใช้ที่ผ่านการกรอง
  const [unfilteredActivityData, setUnfilteredActivityData] = useState([]);

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
    { key: "All", 
      value: "All" 
    },
    { key: "Family medicine clerkship", 
      value: "Family medicine clerkship" 
    },
    {
      key: "Internal medicine clerkship",
      value: "Internal medicine clerkship",
    },
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
  ];

  const [
    professionalismScoresModalVisible,
    setProfessionalismScoresModalVisible,
  ] = useState(false);

  const [professionalismScores, setProfessionalismScores] = useState({
    punctual: false,
    appropriatelyDressed: false,
    respectsActivities: false,
    goodListener: false,
    respectsColleagues: false,
    accurateRecordKeeping: false,
  });

  // ประกาศ State สำหรับการเก็บค่าการให้คะแนน
  const [rating, setRating] = useState("");

  // ฟังก์ชันสำหรับการจัดการการเปลี่ยนแปลงของ CheckBox
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSearch = (text) => {
    const searchText = text.toLowerCase();

    // ตรวจสอบว่าถ้าไม่มีการค้นหา (text ว่าง) ให้แสดงทุกรายชื่อ
    if (!searchText.trim()) {
      setFilteredActivityData(unfilteredActivityData); // ใช้ข้อมูลทั้งหมดโดยไม่กรองเมื่อไม่มีการค้นหา
      return;
    }

    // ค้นหาใน Collection patients และ filter ตามเงื่อนไขที่กำหนด
    const filteredActivities = unfilteredActivityData.filter(
      (activity) =>
        activity.activityType &&
        activity.activityType.toLowerCase().includes(searchText)
    );

    setFilteredActivityData(filteredActivities);
  };

  useEffect(() => {
    // ตั้งค่าข้อมูลทั้งหมดของผู้ใช้เมื่อคอมโพเนนต์โหลด
    setUnfilteredActivityData(activityData);
  }, [activityData]);

  useEffect(() => {
    // เรียก handleSearch เมื่อ searchText เปลี่ยน
    handleSearch(searchText);
  }, [searchText, unfilteredActivityData, sortOrder]); // ให้ useEffect ทำงานเมื่อ searchText หรือ unfilteredPatientData เปลี่ยน

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

  const filterByDateRange = (activities) => {
    return activities.filter((activity) => {
      const admissionDate = activity.admissionDate.toDate();
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
    if (selectedActivity) {
      if (selectedStatus === "recheck") {
        setComment(selectedActivity.comment || "");
        setRating(selectedActivity.rating || "");
        setProfessionalismScores(
          selectedActivity.professionalismScores || {
            punctual: false,
            appropriatelyDressed: false,
            respectsActivities: false,
            goodListener: false,
            respectsColleagues: false,
            accurateRecordKeeping: false,
          }
        );
      } else if (selectedStatus === "all") {
        setComment(selectedActivity.comment || "");
        setRating(selectedActivity.rating || "");
        setProfessionalismScores(
          selectedActivity.professionalismScores || {
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
          punctual: false,
          appropriatelyDressed: false,
          respectsActivities: false,
          goodListener: false,
          respectsColleagues: false,
          accurateRecordKeeping: false,
        });
      }
    }
  }, [selectedStatus, selectedActivity]);

  const isEditable = () => {
    if (selectedStatus === "pending") {
      return true;
    } else if (selectedStatus === "recheck") { 
      return selectedActivity ? selectedActivity.isEdited : false;
    } else if (selectedStatus === "all") {
      if (selectedActivity && selectedActivity.isEdited === false) {
        return false;
      }
      return true; // Default to true if the condition for 'false' is not met
    }
    return false;
  };

  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [isApproveAllModalVisible, setApproveAllModalVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: isMobile ? 10 : 20,
      flexDirection: "column",
      alignItems: "center",
    },
    boxCard: {
      height: "60%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
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
      borderRadius: 20,
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
    recheckModalButton: {
      flex: 1,
      borderRadius: 13,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginHorizontal: 5, // เพิ่มระยะห่างระหว่างปุ่ม
    },
    buttonApprove: {
      backgroundColor: "green",
      marginTop: 10,
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
      marginRight: 5,
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
    modalImageView: {
      backgroundColor: "white",
      padding: 20,
      borderRadius: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxWidth: "90%",
      maxHeight: "80%",
    },
    buttonViewImages: {
      backgroundColor: "blue", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15,
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
      fontSize: 20,
      marginBottom: 10,
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

  const viewImages = () => {
    setImageModalVisible(true);
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

  const loadActivityData = async () => {
    try {
      setIsLoading(true);
      const activityCollectionRef = collection(db, "activity");
      const userCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(activityCollectionRef);
      const activities = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        data.id = docSnapshot.id; // กำหนด id ให้กับข้อมูลของผู้ป่วย

        let studentName = "";
        let displayData = data;

        if (role === "teacher" && data.createBy_id) {
          const userDocRef = doc(userCollectionRef, data.createBy_id);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            studentName = userData.displayName || "";
            displayData = { ...data, studentName };
          }
        }

        if (
          (role === "student" && data.createBy_id === currentUserUid) ||
          (role === "teacher" && data.professorId === currentUserUid)
        ) {
          activities.push(displayData);
        }
      }

      setActivityData(activities);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching activity data:", error);
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
      loadActivityData();
    });

    return unsubscribe;
  }, [navigation]);

  const formatTimeUnit = (unit) => (unit < 10 ? `0${unit}` : unit.toString());

  const handleCardPress = (activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const handleAddData = () => {
    navigation.navigate("AddActivity");
  };

  const handleApprove = async () => {
    try {
      if (rating === "Unsatisfied") {
        alert("ไม่สามารถ Approve ได้(เนื่องจากคุณเลือก Unsatisfied)");
        return; // หยุดการทำงานของฟังก์ชันที่นี่ถ้า rating เป็น unsatisfied
      }

      const activityDocRef = doc(db, "activity", selectedActivity.id);
      await updateDoc(activityDocRef, {
        status: "approved",
        comment: comment,
        rating: rating,
        approvalTimestamp: Timestamp.now(),
        // professionalismScores: professionalismScores,
      });
      resetScoresAndComment();
      setModalVisible(false);
      loadActivityData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error approving activity:", error);
    }
  };

  const handleReApprove = async () => {
    try {
      if (rating === "Unsatisfied") {
        alert("ไม่สามารถ Recheck ได้(เนื่องจากคุณเลือก Unsatisfied)");
        return; // หยุดการทำงานของฟังก์ชันที่นี่ถ้า rating เป็น unsatisfied
      }
      const activityDocRef = doc(db, "activity", selectedActivity.id);
      await updateDoc(activityDocRef, {
        status: "recheck",
        comment: comment,
        rating: rating,
        reApprovalTimestamp: Timestamp.now(),
        // professionalismScores: professionalismScores, 
        isRecheck: true,
        isEdited: false,
      });
      // รีเซ็ตคะแนนและความคิดเห็น
      resetScoresAndComment();
      setModalVisible(false);
      loadActivityData();
    } catch (error) {
      console.error("Error re-approving activity:", error);
    }
  };

  const handleReject = async () => {
    try {
      const activityDocRef = doc(db, "activity", selectedActivity.id);
      await updateDoc(activityDocRef, {
        status: "rejected",
        comment: comment,
        rejectionTimestamp: Timestamp.now(),
        rating: rating,
        // professionalismScores: professionalismScores, 
      });
      resetScoresAndComment();
      setModalVisible(false);
      loadActivityData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error approving activity:", error);
    }
  };

  const resetScoresAndComment = () => {
    setComment("");
    setRating("");
    setProfessionalismScores({
      punctual: false,
      appropriatelyDressed: false,
      respectsActivities: false,
      goodListener: false,
      respectsColleagues: false,
      accurateRecordKeeping: false,
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

  const handleDelete = async (activityId) => {
    try {
      const activityDocRef = doc(db, "activity", activityId);
      await deleteDoc(activityDocRef);
      loadActivityData(); // โหลดข้อมูลผู้ป่วยใหม่หลังจากลบ
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleActualApproveAll = async () => {
    try {
      // ประมวลผลทั้งหมดที่มีสถานะเป็น pending
      const updates = activityData
        .filter((activity) => activity.status === "pending")
        .map((activity) =>
          updateDoc(doc(db, "activity", activity.id), { status: "approved" })
        );

      // รอให้ทั้งหมดเสร็จสิ้น
      await Promise.all(updates);

      // โหลดข้อมูลใหม่
      loadActivityData();
    } catch (error) {
      console.error("Error approving all activity:", error);
    }
  };

  const handleApproveAll = () => {
    setApproveAllModalVisible(true);
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
    const filteredByDate = filterByDateRange(filteredActivityData);

    return filteredByDate
      .filter(
        (activity) =>
          selectedSubject === "All" ||
          (activity.subject && activity.subject === selectedSubject)
      )
      .filter((activity) =>
        selectedStatus === "all" ? true : activity.status === selectedStatus
      )
      .filter((activity) =>
        role === "student" ? activity.subject === subject : true
      )
      .filter((activity) =>
        studentId ? activity.createBy_id === studentId : true // Show all students if studentId is not selected
      )
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return b.admissionDate.toDate() - a.admissionDate.toDate();
        } else {
          return a.admissionDate.toDate() - b.admissionDate.toDate();
        }
      })
      .map((activity, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(activity)}
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
                    Type : {activity.activityType} (
                    <Text
                      style={{
                        color: activity.isEdited
                          ? "red"
                          : activity.isEdited === false
                          ? "#e9c46a"
                          : "inherit",
                      }}
                    >
                      {activity.status}
                    </Text>
                    )
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Instructor Name : {activity.professorName}
                  </Text>

                  {activity.status === "pending" ? (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(activity.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(activity.hours)}.
                      {formatTimeUnit(activity.minutes)}
                    </Text>
                  ) : (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(activity.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(activity.hours)}.
                      {formatTimeUnit(activity.minutes)}
                      {activity.approvalTimestamp && (
                        <Text>
                          {" "}
                          (Approved:{" "}
                          {formatDateToThai(
                            activity.approvalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {activity.rejectionTimestamp && (
                        <Text>
                          {" "}
                          (Rejected:{" "}
                          {formatDateToThai(
                            activity.rejectionTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {activity.reApprovalTimestamp && (
                        <Text>
                          {" "}
                          (Re-Approved:{" "}
                          {formatDateToThai(
                            activity.reApprovalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                    </Text>
                  )}

                  {
                  (selectedStatus === "all" || selectedStatus === "pending" || selectedStatus === "recheck") &&
                      (activity.status === "pending" || activity.status === "recheck") && (
                      <>
                        <TouchableOpacity
                          style={{ position: "absolute", top: 10, right: 10 }}
                          onPress={() => {
                            navigation.navigate("EditActivity", {
                              activityData: activity,
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
                            setActivityToDelete(activity.id);
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
                    Type : {activity.activityType} (
                    <Text
                      style={{
                        color: activity.isEdited
                          ? "red"
                          : activity.isEdited === false
                          ? "#e9c46a"
                          : "inherit",
                      }}
                    >
                      {activity.status}
                    </Text>
                    )
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Student Name : {activity.studentName}
                  </Text>
                  {activity.status === "pending" ? (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(activity.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(activity.hours)}.
                      {formatTimeUnit(activity.minutes)}
                    </Text>
                  ) : (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(activity.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(activity.hours)}.
                      {formatTimeUnit(activity.minutes)}
                      {activity.approvalTimestamp && (
                        <Text>
                          {" "}
                          (Approved:{" "}
                          {formatDateToThai(
                            activity.approvalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {activity.rejectionTimestamp && (
                        <Text>
                          {" "}
                          (Rejected:{" "}
                          {formatDateToThai(
                            activity.rejectionTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {activity.reApprovalTimestamp && (
                        <Text>
                          {" "}
                          (Recheck:{" "}
                          {formatDateToThai(
                            activity.reApprovalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                    </Text>
                  )}
                </>
              )}
            </View>
            {/* {role !== 'student' && (
              <View style={styles.rightContainer}>
                <View style={styles.buttonsContainer}>
                  {activity.status === 'pending' && (
                  <>
                    <TouchableOpacity style={styles.approveButton} onPress={() => {
                      setSelectedActivity(activity);
                      setAction('approve');
                      setConfirmationModalVisible(true);
                    }}>
                      <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => {
                      setSelectedActivity(activity);
                      setAction('reject');
                      setConfirmationModalVisible(true);
                    }}>
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                  )}
                </View>
              </View>
            )} */}
            <View style={{ position: "absolute", bottom: 5, right: 5 }}>
              {activity.status === "approved" && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {activity.status === "rejected" && (
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
        <SubHeader text="ACTIVITY" />
      </View>

      {/* {renderApprovedButton()} */}

      <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",             // Center items vertically                 // Full width of the parent container
        }}
      >
     <View> <Text style={{ marginBottom: 10, textAlign: 'center'}}>Filter by type name : </Text>
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
      placeholder="Search by type name"
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

      {/* Modal สำหรับยืนยัน Approve/Reject */}
      {/* <Modal
                animationType="fade"
                transparent={true}
                visible={confirmationModalVisible}
            >
                <View style={styles.centerView}>
                    <View style={styles.modalView}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Rating</Text>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Excellent'}
                        onValueChange={() => handleRatingChange('Excellent')}
                      />
                      <Text style={{ marginLeft: 5 }}>Excellent</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Good'}
                        onValueChange={() => handleRatingChange('Good')}
                      />
                      <Text style={{ marginLeft: 5 }}>Good</Text>
                    </View>
                    <View style={styles.checkboxContainer}>
                      <CheckBox
                        value={rating === 'Acceptable'}
                        onValueChange={() => handleRatingChange('Acceptable')}
                      />
                      <Text style={{ marginLeft: 5 }}>Acceptable</Text>
                    </View>

                    <Text style={{marginBottom: 10, fontSize: 20, fontWeight: 'bold'}}>Add comment(optional)</Text>
                    <TextInput
                      placeholder="Please enter a comment."
                      placeholderTextColor="grey"
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      numberOfLines={4}
                      style={{ height: 150, width: '100%', borderColor: 'gray', borderWidth: 1, borderRadius: 10, marginBottom: 20, textAlignVertical: 'top' }}
                    />
                        
                        <View style={styles.buttonContainer}>
                            <Pressable
                                style={[styles.recheckModalButton, styles.buttonApprove]}
                                onPress={() => {
                                    action === 'approve' ? handleApprove() : handleReject();
                                }}
                            >
                                <Text style={styles.textStyle}>Confirm</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.recheckModalButton, styles.buttonCancel]}
                                onPress={handleCloseModal}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal> */}

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
              Confirm deletion of activity information?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonApprove]}
                onPress={() => {
                  handleDelete(activityToDelete);
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

      {/*  Modal สำหรับแสดงข้อมูลในการ์ด */}
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
              {selectedActivity && (
                <>
                  {role !== "student" && selectedActivity.subject ? (
                    <Text style={styles.modalText2}>
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedActivity.subject}
                      </Text>
                    </Text>
                  ) : null}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Admission Date :{" "}
                    </Text>
                    {formatDate2(selectedActivity.admissionDate.toDate())}
                  </Text>
                  {selectedActivity.hours !== "" &&
                    selectedActivity.minutes !== "" && (
                      <>
                        <Text style={styles.modalText}>
                          <Text style={{ fontWeight: "bold" }}>
                            Admission Time :{" "}
                          </Text>
                          {formatTimeUnit(selectedActivity.hours)}.
                          {formatTimeUnit(selectedActivity.minutes)}
                        </Text>
                      </>
                    )}

                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Instructor Name :{" "}
                    </Text>{" "}
                    {selectedActivity.professorName}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Type :</Text>{" "}
                    {selectedActivity.activityType || "None"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Topic : </Text>{" "}
                    {selectedActivity.topic || "None"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Note/Reflection :{" "}
                    </Text>{" "}
                    {selectedActivity.note || "None"}
                  </Text>

                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "all" && 
                      (selectedActivity.status !== "pending" && 
                      (role === "student" || (role === "teacher" && selectedActivity.status !== "recheck")) && 
                      (selectedActivity.status === "approved" || selectedActivity.status === "rejected" || selectedActivity.status === "recheck"))) ||
                    (selectedStatus === "recheck" && role === "student")) && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Rating : </Text>
                      {selectedActivity.rating || "ไม่มี"}
                    </Text>
                  )}

                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "all" && 
                      (selectedActivity.status !== "pending" && 
                      (role === "student" || (role === "teacher" && selectedActivity.status !== "recheck")) && 
                      (selectedActivity.status === "approved" || selectedActivity.status === "rejected" || selectedActivity.status === "recheck"))) ||
                    (selectedStatus === "recheck" && role === "student")) && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>***Comment : </Text>
                      {selectedActivity.comment || "ไม่มี"}
                    </Text>
                  )}

                  <View style={styles.buttonRow}>
                  {/* {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "all" && 
                      (selectedActivity.status !== "pending" && 
                      (role === "student" || (role === "teacher" && selectedActivity.status !== "recheck")) && 
                      (selectedActivity.status === "approved" || selectedActivity.status === "rejected" || selectedActivity.status === "recheck"))) ||
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
                    )} */}

                    {role !== "student" &&
                      selectedStatus !== "approved" &&
                      selectedStatus !== "rejected" &&
                      (selectedStatus === "all" || selectedStatus === "pending" || selectedStatus === "recheck") &&
                      (selectedActivity.status === "pending" || selectedActivity.status === "recheck") &&  (
                        <View style={styles.centerView2}>
                          {/* <Text style={styles.professionalismHeader}>
                            Professionalism
                          </Text>{" "}
                          (เลือกได้หลายตัวเลือก)
                          
                          {selectedActivity && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.punctual}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("punctual")
                                }
                              />
                              <Text style={styles.checkboxLabel}>Punctual</Text>
                            </View>
                          )}
                          {selectedActivity && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.appropriatelyDressed
                                }
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("appropriatelyDressed")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                                Appropriately dressed
                              </Text>
                            </View>
                          )}
                          {selectedActivity && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.respectsActivities}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("respectsActivities")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                                Respect the Patient
                              </Text>
                            </View>
                          )}
                          {selectedActivity && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.goodListener}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("goodListener")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                                Good listener
                              </Text>
                            </View>
                          )}
                          {selectedActivity && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.respectsColleagues}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("respectsColleagues")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                                Respect colleagues
                              </Text>
                            </View>
                          )}
                          {selectedActivity && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.accurateRecordKeeping
                                }
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("accurateRecordKeeping")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                                Accurately record Activity information
                              </Text>
                            </View>
                          )} */}
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
                          {selectedActivity.images &&
                            selectedActivity.images.length > 0 && (
                              <Pressable
                                onPress={viewImages}
                                style={[styles.button, styles.buttonViewImages]}
                              >
                                <Text style={styles.textStyle}>
                                  View Picture
                                </Text>
                              </Pressable>
                            )}
                          <View style={styles.buttonContainer}>
                          {((selectedActivity.isEdited === undefined || selectedActivity.isEdited === true) &&
                              selectedStatus === "all" || selectedStatus === "pending" || (selectedStatus === "recheck" && selectedActivity.isEdited === true)) &&
                              (selectedActivity.status === "pending" || selectedActivity.status === "recheck") && (
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
                            {((selectedActivity.isEdited === undefined && selectedActivity.isRecheck === undefined) || selectedActivity.isEdited === true) && (
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
                            {((selectedActivity.isEdited === undefined || selectedActivity.isEdited === true) &&
                              selectedStatus === "all" || selectedStatus === "pending" || (selectedStatus === "recheck" && selectedActivity.isEdited === true)) &&
                              (selectedActivity.status === "pending" || selectedActivity.status === "recheck") && (
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
                          (selectedStatus === "all" && (selectedActivity.status !== "pending" && selectedActivity.status !== "recheck"))))) &&
                      selectedActivity.images &&
                      selectedActivity.images.length > 0 && (
                        <Pressable
                          onPress={viewImages}
                          style={[styles.button, styles.buttonViewImages]}
                        >
                          <Text style={styles.textStyle}>View Picture</Text>
                        </Pressable>
                      )}

                    {(role !== "teacher" ||
                      (role === "teacher" &&
                        (selectedStatus === "approved" ||
                          selectedStatus === "rejected" ||
                          (selectedStatus === "all" && (selectedActivity.status !== "pending" && selectedActivity.status !== "recheck"))))) && (
                      <Pressable
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => setModalVisible(!modalVisible)}
                      >
                        <Text style={styles.textStyle}>Close</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Modal สำหรับเปิดดูรูปภาพ */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={imageModalVisible}
                    onRequestClose={() => {
                      Alert.alert("Image viewer has been closed.");
                      setImageModalVisible(!imageModalVisible);
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      <View
                        style={{
                          width: "70%",
                          height: "70%",
                          backgroundColor: "white",
                          borderRadius: 10,
                        }}
                      >
                        <ScrollView>
                          {selectedActivity?.images &&
                            selectedActivity.images.map((imageUrl, index) => {
                              return (
                                <View
                                  key={index}
                                  style={{
                                    marginBottom: 10,
                                    borderColor: "#ccc",
                                    borderWidth: 1,
                                    padding: 10,
                                    borderRadius: 5,
                                  }}
                                >
                                  <Image
                                    source={{ uri: imageUrl }}
                                    style={{
                                      width: "100%",
                                      height: 200,
                                      resizeMode: "contain",
                                      marginVertical: 10,
                                    }}
                                  />
                                  <Pressable
                                    style={{
                                      backgroundColor: "#2196F3",
                                      padding: 5,
                                      borderRadius: 5,
                                      marginTop: 5,
                                    }}
                                    onPress={() => Linking.openURL(imageUrl)} // เปิด URL ในเบราว์เซอร์เริ่มต้น
                                  >
                                    <Text
                                      style={{
                                        color: "white",
                                        textAlign: "center",
                                      }}
                                    >
                                      Click to view picture url
                                    </Text>
                                  </Pressable>
                                </View>
                              );
                            })}
                        </ScrollView>
                        <Pressable
                          style={[styles.button, styles.buttonClose]}
                          onPress={() =>
                            setImageModalVisible(!imageModalVisible)
                          }
                        >
                          <Text style={styles.textStyle}>Close</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Modal>
                  {/* Modal สำหรับแสดงคะแนนความเป็นมืออาชีพ */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={
                      professionalismScoresModalVisible &&
                      (selectedActivity.status === "approved" ||
                        selectedActivity.status === "rejected" ||
                        (selectedStatus === "all" && selectedActivity.status !== "pending") ||
                        (selectedActivity.status === "recheck" &&
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
                        {selectedActivity.professionalismScores && (
                          <>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Punctual :{" "}
                              </Text>
                              {selectedActivity.professionalismScores.punctual
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Appropriately dressed:{" "}
                              </Text>
                              {selectedActivity.professionalismScores
                                .appropriatelyDressed
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Respect the Activities :{" "}
                              </Text>
                              {selectedActivity.professionalismScores
                                .respectsActivities
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Good listener :{" "}
                              </Text>
                              {selectedActivity.professionalismScores
                                .goodListener
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Respect colleagues :{" "}
                              </Text>
                              {selectedActivity.professionalismScores
                                .respectsColleagues
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Accurately record activity information :{" "}
                              </Text>
                              {selectedActivity.professionalismScores
                                .accurateRecordKeeping
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

export default ActivityScreen;
