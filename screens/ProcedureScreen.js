import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  deleteDoc,
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
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { useSelector } from "react-redux";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import SubHeader from "../component/SubHeader";

function ProcedureScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState(null);
  const [procedureData, setProcedureData] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [comment, setComment] = useState(""); // สำหรับเก็บความคิดเห็นของอาจารย์
  const currentUserUid = useSelector((state) => state.user.uid); // สมมติว่า uid เก็บอยู่ใน userUid ของ state
  const role = useSelector((state) => state.role);
  const subject = useSelector((state) => state.subject);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [windowHeight, setWindowHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLandscape, setIsLandscape] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const [selectedStatus, setSelectedStatus] = useState("pending");
  const statusOptions = [
    { key: "pending", value: "Pending" },
    { key: "approved", value: "Approved" },
    { key: "rejected", value: "Rejected" },
    { key: "reApproved", value: "Re-approved" },
  ];

  const [selectedSubject, setSelectedSubject] = useState("All");
  const subjectsByYear = [
    { key: "All", value: "All" },
    { key: "Family medicine clerkship", value: "Family medicine clerkship" },
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

  const [searchText, setSearchText] = useState("");
  const [filteredProcedureData, setFilteredProcedureData] = useState([]); // state เก็บข้อมูลผู้ใช้ที่ผ่านการกรอง
  const [unfilteredProcedureData, setUnfilteredProcedureData] = useState([]);

  const [
    professionalismScoresModalVisible,
    setProfessionalismScoresModalVisible,
  ] = useState(false);

  const [professionalismScores, setProfessionalismScores] = useState({
    punctual: false,
    appropriatelyDressed: false,
    respectsProcedures: false,
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
      setFilteredProcedureData(unfilteredProcedureData); // ใช้ข้อมูลทั้งหมดโดยไม่กรองเมื่อไม่มีการค้นหา
      return;
    }

    // ค้นหาใน Collection Procedures และ filter ตามเงื่อนไขที่กำหนด
    const filteredProcedures = unfilteredProcedureData.filter(
      (procedure) =>
        procedure.hn && procedure.hn.toLowerCase().includes(searchText) // ค้นหา hn ใน Collection Procedures
    );

    setFilteredProcedureData(filteredProcedures);
  };

  useEffect(() => {
    // ตั้งค่าข้อมูลทั้งหมดของผู้ใช้เมื่อคอมโพเนนต์โหลด
    setUnfilteredProcedureData(procedureData);
  }, [procedureData]); // ให้ useEffect ทำงานเมื่อ ProcedureData เปลี่ยน

  useEffect(() => {
    // เรียก handleSearch เมื่อ searchText เปลี่ยน
    handleSearch(searchText);
  }, [searchText, unfilteredProcedureData]); // ให้ useEffect ทำงานเมื่อ searchText หรือ unfilteredProcedureData เปลี่ยน

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
    if (selectedProcedure) {
      if (selectedStatus === "reApproved") {
        setComment(selectedProcedure.comment || "");
        setRating(selectedProcedure.rating || "");
        setProfessionalismScores(
          selectedProcedure.professionalismScores || {
            punctual: false,
            appropriatelyDressed: false,
            respectsProcedures: false,
            goodListener: false,
            respectsColleagues: false,
            accurateRecordKeeping: false,
          }
        );
      } else if (selectedStatus === "pending") {
        setComment("");
        setRating("");
        setProfessionalismScores({
          punctual: false,
          appropriatelyDressed: false,
          respectsProcedures: false,
          goodListener: false,
          respectsColleagues: false,
          accurateRecordKeeping: false,
        });
      }
    }
  }, [selectedStatus, selectedProcedure]);

  const isEditable = () => {
    if (selectedStatus === "pending") {
      return true;
    } else if (selectedStatus === "reApproved") {
      return selectedProcedure ? selectedProcedure.isEdited : false;
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

  const loadProcedureData = async () => {
    try {
      setIsLoading(true);
      const procedureCollectionRef = collection(db, "procedures");
      const userCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(procedureCollectionRef);
      const procedures = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        data.id = docSnapshot.id; // กำหนด id ให้กับข้อมูลของผู้ป่วย

        // if (data.procedureType === "inprocedure") {
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
          (role === "teacher" && data.approvedById === currentUserUid)
        ) {
          procedures.push(displayData);
        }
      }
      // }

      setProcedureData(procedures);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching procedure data:", error);
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
      loadProcedureData();
    });

    return unsubscribe;
  }, [navigation]);

  const formatTimeUnit = (unit) => (unit < 10 ? `0${unit}` : unit.toString());

  const handleCardPress = (procedure) => {
    setSelectedProcedure(procedure);
    setModalVisible(true);
  };

  const handleAddData = () => {
    navigation.navigate("AddProcedure");
  };

  const handleApprove = async () => {
    try {
      const procedureDocRef = doc(db, "procedures", selectedProcedure.id);
      await updateDoc(procedureDocRef, {
        status: "approved",
        comment: comment,
        rating: rating,
        approvalTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores, // บันทึกคะแนนความเป็นมืออาชีพ
      });
      resetScoresAndComment();
      setModalVisible(false);
      loadProcedureData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error approving procedure:", error);
    }
  };

  const handleReApprove = async () => {
    try {
      const procedureDocRef = doc(db, "procedures", selectedProcedure.id);
      await updateDoc(procedureDocRef, {
        status: "reApproved",
        comment: comment,
        rating: rating,
        reApprovalTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores, // บันทึกคะแนนความเป็นมืออาชีพ
        isReApproved: true,
        isEdited: false,
      });
      // รีเซ็ตคะแนนและความคิดเห็น
      resetScoresAndComment();
      setModalVisible(false);
      loadProcedureData();
    } catch (error) {
      console.error("Error re-approving Procedure:", error);
    }
  };

  const handleReject = async () => {
    try {
      const procedureDocRef = doc(db, "procedures", selectedProcedure.id);
      await updateDoc(procedureDocRef, {
        status: "rejected",
        comment: comment,
        rating: rating,
        rejectionTimestamp: Timestamp.now(),
        professionalismScores: professionalismScores, // บันทึกคะแนนความเป็นมืออาชีพ
      });
      resetScoresAndComment();
      setModalVisible(false);
      loadProcedureData(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error rejecting procedure:", error);
    }
  };

  const resetScoresAndComment = () => {
    setComment("");
    setRating("");
    setProfessionalismScores({
      punctual: false,
      appropriatelyDressed: false,
      respectsProcedures: false,
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

  const handleActualApproveAll = async () => {
    try {
      // ประมวลผลทั้งหมดที่มีสถานะเป็น pending
      const updates = procedureData
        .filter((procedure) => procedure.status === "pending")
        .map((procedure) =>
          updateDoc(doc(db, "procedures", procedure.id), { status: "approved" })
        );

      // รอให้ทั้งหมดเสร็จสิ้น
      await Promise.all(updates);

      // โหลดข้อมูลใหม่
      loadProcedureData();
    } catch (error) {
      console.error("Error approving all procedures:", error);
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

  const displayLevel = (level) => {
    switch (level) {
      case 1:
        return "Observe";
      case 2:
        return "Assist";
      case 3:
        return "Perform";
      default:
        return "None";
    }
  };

  const handleDelete = async (procedureId) => {
    try {
      const proceduresDocRef = doc(db, "procedures", procedureId);
      await deleteDoc(proceduresDocRef);
      loadProcedureData(); // โหลดข้อมูลผู้ป่วยใหม่หลังจากลบ
    } catch (error) {
      console.error("Error deleting procedure:", error);
    }
  };

  const renderCards = () => {
    if (isLoading) {
      // แสดง animation loading หรือข้อความแสดงสถานะ loading
      return (
        <ActivityIndicator size="large" color="#0000ff" />

        // <Text>Loading...</Text>
      );
    }
    return filteredProcedureData
      .filter(
        (procedure) =>
          selectedSubject === "All" ||
          (procedure.subject && procedure.subject === selectedSubject)
      )
      .filter((procedure) => procedure.status === selectedStatus) // กรองเฉพาะข้อมูลที่มีสถานะเป็น pending
      .filter((procedure) =>
        role === "student" ? procedure.subject === subject : true
      )
      .sort((a, b) => b.admissionDate.toDate() - a.admissionDate.toDate()) // เรียงลำดับตามวันที่ล่าสุดไปยังเก่าสุด
      .map((procedure, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(procedure)}
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
                    HN : {procedure.hn} (
                    <Text
                      style={{
                        color: procedure.isEdited
                          ? "red"
                          : procedure.isEdited === false
                          ? "#e9c46a"
                          : "inherit",
                      }}
                    >
                      {procedure.status}
                    </Text>
                    )
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Professor Name : {procedure.approvedByName}
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Type : {procedure.procedureType}
                  </Text>

                  {procedure.status === "pending" ? (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(procedure.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(procedure.hours)}.
                      {formatTimeUnit(procedure.minutes)}
                    </Text>
                  ) : (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(procedure.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(procedure.hours)}.
                      {formatTimeUnit(procedure.minutes)}
                      {procedure.approvalTimestamp && (
                        <Text>
                          {" "}
                          (Approved:{" "}
                          {formatDateToThai(
                            procedure.approvalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {procedure.rejectionTimestamp && (
                        <Text>
                          {" "}
                          (Rejected:{" "}
                          {formatDateToThai(
                            procedure.rejectionTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {procedure.reApprovalTimestamp && (
                        <Text>
                          {" "}
                          (Re-Approved:{" "}
                          {formatDateToThai(
                            procedure.reApprovalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                    </Text>
                  )}

                  {selectedStatus !== "approved" &&
                    selectedStatus !== "rejected" && (
                      <>
                        <TouchableOpacity
                          style={{ position: "absolute", top: 10, right: 10 }}
                          onPress={() => {
                            navigation.navigate("EditProcedure", {
                              procedureData: procedure,
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
                            setProcedureToDelete(procedure.id);
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
                    HN : {procedure.hn} (
                    <Text
                      style={{
                        color: procedure.isEdited
                          ? "red"
                          : procedure.isEdited === false
                          ? "#e9c46a"
                          : "inherit",
                      }}
                    >
                      {procedure.status}
                    </Text>
                    )
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Student Name : {procedure.studentName}
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    Type : {procedure.procedureType}
                  </Text>
                  {procedure.status === "pending" ? (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(procedure.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(procedure.hours)}.
                      {formatTimeUnit(procedure.minutes)}
                    </Text>
                  ) : (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      <FontAwesome name="calendar" size={20} color="black" />{" "}
                      {formatDate2(procedure.admissionDate.toDate())} |{" "}
                      {formatTimeUnit(procedure.hours)}.
                      {formatTimeUnit(procedure.minutes)}
                      {procedure.approvalTimestamp && (
                        <Text>
                          {" "}
                          (Approved:{" "}
                          {formatDateToThai(
                            procedure.approvalTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {procedure.rejectionTimestamp && (
                        <Text>
                          {" "}
                          (Rejected:{" "}
                          {formatDateToThai(
                            procedure.rejectionTimestamp.toDate()
                          )}
                          )
                        </Text>
                      )}
                      {procedure.reApprovalTimestamp && (
                        <Text>
                          {" "}
                          (Re-Approved:{" "}
                          {formatDateToThai(
                            procedure.reApprovalTimestamp.toDate()
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
                  {procedure.status === "pending" && (
                    <>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => {
                          setSelectedProcedure(procedure);
                          setAction("approve");
                          setConfirmationModalVisible(true);
                        }}
                      >
                        <Text style={styles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => {
                          setSelectedProcedure(procedure);
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
              {procedure.status === "approved" && (
                <Ionicons name="checkmark-circle" size={24} color="green" />
              )}
              {procedure.status === "rejected" && (
                <Ionicons name="close-circle" size={24} color="red" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ));
  };

  return (
    <View style={styles.container}>
      <View style={{ marginVertical: windowWidth < 768 ? 10 : 50 }}>
        <SubHeader text="PROCEDURE" />
      </View>

      {renderApprovedButton()}

      <View
        style={{
          // marginVertical: 10,
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
        }}
      >
        {role !== "student" && (
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
              marginRight: isMobile ? 0 : 10,
              marginBottom: isMobile ? 10 : 0,
            }}
            dropdownStyles={{ backgroundColor: "#FEF0E6" }}
          />
        )}

        <SelectList
          data={statusOptions}
          setSelected={setSelectedStatus}
          placeholder="Select status"
          defaultOption={selectedStatus}
          search={false}
          boxStyles={{
            width: "auto",
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            marginBottom: isMobile ? 10 : 0,
          }}
          dropdownStyles={{ backgroundColor: "#FEF0E6" }}
        />

        <TextInput
          style={{
            flex: 1,
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            marginLeft: isMobile ? 0 : 15,
            textAlign: "center",
          }}
          placeholder="Search by hn"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
          }}
        />
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
              Confirm deletion of procedure information?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonApprove]}
                onPress={() => {
                  handleDelete(procedureToDelete);
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
              {selectedProcedure && (
                <>
                  {role !== "student" && selectedProcedure.subject ? (
                    <Text style={styles.modalText2}>
                      <Text style={{ fontWeight: "bold" }}>
                        {selectedProcedure.subject}
                      </Text>
                    </Text>
                  ) : null}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Admission Date :{" "}
                    </Text>
                    {formatDate2(selectedProcedure.admissionDate.toDate())}
                  </Text>
                  {selectedProcedure.hours !== "" &&
                    selectedProcedure.minutes !== "" && (
                      <>
                        <Text style={styles.modalText}>
                          <Text style={{ fontWeight: "bold" }}>
                            Admission Time :{" "}
                          </Text>
                          {formatTimeUnit(selectedProcedure.hours)}.
                          {formatTimeUnit(selectedProcedure.minutes)}
                        </Text>
                      </>
                    )}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Professor Name :{" "}
                    </Text>{" "}
                    {selectedProcedure.approvedByName}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Type : </Text>{" "}
                    {selectedProcedure.procedureType}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>HN :</Text>{" "}
                    {selectedProcedure.hn || "None"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Level : </Text>{" "}
                    {displayLevel(selectedProcedure.procedureLevel)}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Note/Reflection :{" "}
                    </Text>{" "}
                    {selectedProcedure.remarks || "None"}
                  </Text>

                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "reApproved" &&
                      role === "student")) && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Rating : </Text>
                      {selectedProcedure.rating || "ไม่มี"}
                    </Text>
                  )}

                  {(selectedStatus === "approved" ||
                    selectedStatus === "rejected" ||
                    (selectedStatus === "reApproved" &&
                      role === "student")) && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>***Comment : </Text>
                      {selectedProcedure.comment || "ไม่มี"}
                    </Text>
                  )}

                  <View style={styles.buttonRow}>
                    {(selectedStatus === "approved" ||
                      selectedStatus === "rejected" ||
                      (selectedStatus === "reApproved" &&
                        role === "student")) && (
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
                      selectedStatus !== "rejected" && (
                        <View style={styles.centerView2}>
                          <Text style={styles.professionalismHeader}>
                            Professionalism
                          </Text>{" "}
                          (เลือกได้หลายตัวเลือก)
                          {/* แสดง Checkbox และ Label */}
                          {selectedProcedure && (
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
                          {selectedProcedure && (
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
                          {selectedProcedure && (
                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.respectsProcedures}
                                disabled={!isEditable()}
                                onValueChange={() =>
                                  handleCheckboxChange("respectsProcedures")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                                Respect the Patient
                              </Text>
                            </View>
                          )}
                          {selectedProcedure && (
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
                          {selectedProcedure && (
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
                          {selectedProcedure && (
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
                                Accurately record Procedure information
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
                          {selectedProcedure.images &&
                            selectedProcedure.images.length > 0 && (
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
                            {(selectedProcedure.isEdited ||
                              selectedStatus === "pending") && (
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
                            {!selectedProcedure.isReApproved && (
                              <Pressable
                                style={[
                                  styles.recheckModalButton,
                                  styles.buttonReApprove,
                                ]}
                                onPress={() => handleReApprove()}
                              >
                                <Text style={styles.textStyle}>Re-approve</Text>
                              </Pressable>
                            )}
                            {(selectedProcedure.isEdited ||
                              selectedStatus === "pending") && (
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
                          selectedStatus === "rejected"))) &&
                      selectedProcedure.images &&
                      selectedProcedure.images.length > 0 && (
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
                          selectedStatus === "rejected"))) && (
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
                          {selectedProcedure?.images &&
                            selectedProcedure.images.map((imageUrl, index) => {
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
                      (selectedProcedure.status === "approved" ||
                        selectedProcedure.status === "rejected" ||
                        (selectedProcedure.status === "reApproved" &&
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
                        {selectedProcedure.professionalismScores && (
                          <>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Punctual :{" "}
                              </Text>
                              {selectedProcedure.professionalismScores.punctual
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Appropriately dressed:{" "}
                              </Text>
                              {selectedProcedure.professionalismScores
                                .appropriatelyDressed
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Respect the Procedure :{" "}
                              </Text>
                              {selectedProcedure.professionalismScores
                                .respectsProcedures
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Good listener :{" "}
                              </Text>
                              {selectedProcedure.professionalismScores
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
                              {selectedProcedure.professionalismScores
                                .respectsColleagues
                                ? "✔️"
                                : "❌"}
                            </Text>
                            <Text style={styles.modalText}>
                              <Text
                                style={{ fontWeight: "bold", fontSize: 20 }}
                              >
                                Accurately record Procedure information :{" "}
                              </Text>
                              {selectedProcedure.professionalismScores
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
      {/* <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          alignSelf: "flex-start",
          marginLeft: 50,
        }}
      >
        {renderAddDataButton()}
      </View> */}
    </View>
  );
}

export default ProcedureScreen;
