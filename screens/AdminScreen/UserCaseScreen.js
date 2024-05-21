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
  where,
  query,
} from "firebase/firestore";
import { db } from "../../data/firebaseDB";
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
  Image,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { isEmpty } from "lodash";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";

function UserCaseScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null); // เพิ่ม selectedType เข้าไปใน state

  const [CaseData, setCaseData] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [outpatientData, setOutpatientData] = useState([]);
  const [procedureData, setProcedureData] = useState([]);
  const [activityData, setActivityData] = useState([]);

  const [selectedCase, setSelectedCase] = useState(null);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [windowHeight, setWindowHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLandscape, setIsLandscape] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const [selectedStatus, setSelectedStatus] = useState("pending");
  const statusOptions = [
    { key: "pending", value: "Pending" },
    { key: "approved", value: "Approved" },
    { key: "rejected", value: "Rejected" },
    { key: "reApproved", value: "Re-approved" },
  ];

  const [
    professionalismScoresModalVisible,
    setProfessionalismScoresModalVisible,
  ] = useState(false);

  const viewImages = () => {
    setImageModalVisible(true);
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

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isPC = windowWidth >= 1024;

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: isMobile ? 10 : 20,
      flexDirection: "column",
      alignItems: "center",
    },
    boxCard: {
      height: "80%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
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
      height: isMobile ? "auto" : "70%", // Auto height for mobile
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
    },
    buttonCancel: {
      backgroundColor: "red",
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
    centerView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
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
      backgroundColor: "#1C4CA7",
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
    professionalismHeader: {
      fontWeight: "bold",
      fontSize: 20,
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

  const formatTimeUnit = (unit) => (unit < 10 ? `0${unit}` : unit.toString());

  const loadPatientData = async () => {
    try {
      const patientCollectionRef = collection(db, "patients");
      const querySnapshot = await getDocs(patientCollectionRef);
      const inpatient = [];
      const outpatient = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        data.id = docSnapshot.id;
        if (data.patientType === "inpatient") {
          inpatient.push(data);
        } else if (data.patientType === "outpatient") {
          outpatient.push(data);
        }
      });

      setPatientData(inpatient);
      setOutpatientData(outpatient);
    } catch (error) {
      console.error("Error fetching Case data:", error);
    }
  };

  const loadActivityAndProcedureData = async () => {
    try {
      const activityCollectionRef = collection(db, "activity");
      const activityQuerySnapshot = await getDocs(activityCollectionRef);
      const activities = [];

      activityQuerySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        data.id = docSnapshot.id;
        activities.push(data);
      });

      const procedureCollectionRef = collection(db, "procedures");
      const procedureQuerySnapshot = await getDocs(procedureCollectionRef);
      const procedures = [];

      procedureQuerySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        data.id = docSnapshot.id;
        procedures.push(data);
      });

      setActivityData(activities);
      setProcedureData(procedures);
    } catch (error) {
      console.error("Error fetching activity or procedure data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPatientData();
      loadActivityAndProcedureData();
    });

    return unsubscribe;
  }, [navigation]);

  const handleChange = async () => {
    try {
      console.log(selectedCase);
      if (selectedCase && selectedCase.id) {
        // ตรวจสอบว่า selectedCase ไม่เป็น null และมี id
        const documentId = selectedCase.id;

        const collectionsToCheck = ["patients", "activity", "procedure"];

        for (const collectionName of collectionsToCheck) {
          const querySnapshot = await getDocs(
            query(collection(db, collectionName), where("id", "==", documentId))
          );

          if (!isEmpty(querySnapshot.docs)) {
            // พบ documentId ใน Collection ที่เป็นไปได้ ทำการอัปเดต
            const docRef = doc(db, collectionName, documentId);
            await updateDoc(docRef, { status: "pending" });
            setChangeModalVisible(false);
            break;
          }
        }
      } else {
        console.error("Missing selectedCase or document ID.");
      }
    } catch (error) {
      console.error("Error updating document status:", error);
    }
  };

  const handleButtonChange = (caseData) => {
    setSelectedCase(caseData);
    setChangeModalVisible(true);
  };

  const handleCardPress = (caseData) => {
    setSelectedCase(caseData);
    setModalVisible(true);
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

  const renderCards = () => {
    const allCases = filterCasesByType(selectedType).filter(
      (caseData) => caseData.status === selectedStatus
    );

    return allCases
      .sort((a, b) => b.admissionDate.toDate() - a.admissionDate.toDate())
      .map((caseData, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(caseData)}
        >
          <View style={styles.card}>
            <View style={styles.leftContainer}>
              {caseData.procedureType || caseData.activityType ? (
                <>
                  {caseData.procedureType && (
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        marginLeft: 20,
                        lineHeight: 30,
                      }}
                    >
                      {caseData.procedureType} ({caseData.status})
                    </Text>
                  )}
                  {caseData.activityType && (
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        marginLeft: 20,
                        lineHeight: 30,
                      }}
                    >
                      {caseData.activityType} ({caseData.status})
                    </Text>
                  )}
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    {caseData.procedureType ? "Approved By" : "Professor Name"}:{" "}
                    {caseData.procedureType
                      ? caseData.approvedByName
                      : caseData.professorName}
                  </Text>
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
                    HN : {caseData.hn} ({caseData.status})
                  </Text>
                  <Text
                    style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                  >
                    {caseData.procedureType ? "Approved By" : "Professor Name"}:{" "}
                    {caseData.procedureType
                      ? caseData.approvedByName
                      : caseData.professorName}
                  </Text>
                  {caseData.procedureType && (
                    <Text
                      style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}
                    >
                      {caseData.procedureType}
                    </Text>
                  )}
                </>
              )}
              {caseData.status === "pending" ? (
                <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  <FontAwesome name="calendar" size={20} color="black" />{" "}
                  {formatDate2(caseData.admissionDate.toDate())} |{" "}
                  {formatTimeUnit(caseData.hours)}.
                  {formatTimeUnit(caseData.minutes)}
                </Text>
              ) : (
                <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  <FontAwesome name="calendar" size={20} color="black" />{" "}
                  {formatDate2(caseData.admissionDate.toDate())} |{" "}
                  {formatTimeUnit(caseData.hours)}.
                  {formatTimeUnit(caseData.minutes)}
                  {caseData.approvalTimestamp && (
                    <Text>
                      {" "}
                      (Approved:{" "}
                      {formatDateToThai(caseData.approvalTimestamp.toDate())})
                    </Text>
                  )}
                  {caseData.rejectionTimestamp && (
                    <Text>
                      {" "}
                      (Rejected:{" "}
                      {formatDateToThai(caseData.rejectionTimestamp.toDate())})
                    </Text>
                  )}
                </Text>
              )}
            </View>
            {caseData.status !== "pending" && (
              <View style={styles.rightContainer}>
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => {
                      handleButtonChange(caseData);
                    }}
                  >
                    <Text style={styles.buttonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ));
  };

  const filterCasesByType = (type) => {
    switch (type) {
      case "inpatient":
        return patientData.filter(
          (caseData) => caseData.status === selectedStatus
        );
      case "outpatient":
        return outpatientData.filter(
          (caseData) => caseData.status === selectedStatus
        );
      case "procedure":
        return procedureData.filter(
          (caseData) => caseData.status === selectedStatus
        );
      case "activity":
        return activityData.filter(
          (caseData) => caseData.status === selectedStatus
        );
      default:
        return [
          ...patientData.filter(
            (caseData) => caseData.status === selectedStatus
          ),
          ...outpatientData.filter(
            (caseData) => caseData.status === selectedStatus
          ),
          ...procedureData.filter(
            (caseData) => caseData.status === selectedStatus
          ),
          ...activityData.filter(
            (caseData) => caseData.status === selectedStatus
          ),
        ];
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
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
          }}
          dropdownStyles={{ backgroundColor: "#FEF0E6" }}
        />

        <SelectList
          data={[
            { key: "inpatient", value: "IPD" },
            { key: "outpatient", value: "OPD" },
            { key: "procedure", value: "Procedure" },
            { key: "activity", value: "Activity" },
          ]}
          setSelected={setSelectedType}
          placeholder="Select case type"
          defaultOption={selectedType}
          search={false}
          boxStyles={{
            width: "auto",
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            marginLeft: 15,
          }}
          dropdownStyles={{ backgroundColor: "#FEF0E6" }}
        />
      </View>

      <View style={styles.boxCard}>
        <ScrollView>{renderCards()}</ScrollView>
      </View>

      {/* Modal สำหรับยืนยันการเปลี่ยน */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={changeModalVisible}
        onRequestClose={() => setChangeModalVisible(false)}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Change status this case to pending?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonApprove]}
                onPress={handleChange}
              >
                <Text style={styles.textStyle}>Confirm</Text>
              </Pressable>
              <Pressable
                style={[styles.recheckModalButton, styles.buttonCancel]}
                onPress={() => setChangeModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView2}>
            <ScrollView>
              {selectedCase && (
                <>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Admission Date :{" "}
                    </Text>
                    {formatDate2(selectedCase.admissionDate.toDate())}
                  </Text>
                  {selectedCase.hours !== "" && selectedCase.minutes !== "" && (
                    <>
                      <Text style={styles.modalText}>
                        <Text style={{ fontWeight: "bold" }}>
                          Admission Time :{" "}
                        </Text>
                        {formatTimeUnit(selectedCase.hours)}.
                        {formatTimeUnit(selectedCase.minutes)}
                      </Text>
                    </>
                  )}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      {selectedCase.procedureType
                        ? "Approved By"
                        : "Professor Name"}
                      :{" "}
                    </Text>{" "}
                    {selectedCase.procedureType
                      ? selectedCase.approvedByName
                      : selectedCase.professorName}
                  </Text>
                  {selectedCase.activityType && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Type :</Text>{" "}
                      {selectedCase.activityType}
                    </Text>
                  )}
                  {selectedCase.procedureType && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Type :</Text>{" "}
                      {selectedCase.procedureType}
                    </Text>
                  )}
                  {selectedCase.hn && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>HN :</Text>{" "}
                      {selectedCase.hn}
                    </Text>
                  )}
                  {selectedCase.procedureLevel && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Level :</Text>{" "}
                      {displayLevel(selectedCase.procedureLevel)}
                    </Text>
                  )}
                  {selectedCase.mainDiagnosis && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>
                        Main Diagnosis :
                      </Text>{" "}
                      {selectedCase.mainDiagnosis}
                    </Text>
                  )}
                  {selectedCase.coMorbid && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>
                        Co - Morbid Diseases :{" "}
                      </Text>
                      {selectedCase.coMorbid &&
                      selectedCase.coMorbid.length > 0 &&
                      selectedCase.coMorbid.some((diagnosis) => diagnosis.value)
                        ? selectedCase.coMorbid
                            .map((diagnosis) => diagnosis.value)
                            .join(", ")
                        : "ไม่ระบุ"}
                    </Text>
                  )}
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>
                      Note/Reflection :{" "}
                    </Text>{" "}
                    {selectedCase.note || "ไม่มี"}
                  </Text>
                  {selectedCase.rating && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>Rating :</Text>{" "}
                      {selectedCase.rating}
                    </Text>
                  )}
                  {selectedCase.comment && (
                    <Text style={styles.modalText}>
                      <Text style={{ fontWeight: "bold" }}>***Comment :</Text>{" "}
                      {selectedCase.comment}
                    </Text>
                  )}
                  <View style={styles.buttonRow}>
                    {selectedCase.professionalismScores && (
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

                    {selectedCase.pdfUrl && (
                      <Pressable
                        style={[styles.button, styles.buttonViewPDF]}
                        onPress={() => Linking.openURL(selectedCase.pdfUrl)}
                      >
                        <Text style={styles.textStyle}>View Upload File</Text>
                      </Pressable>
                    )}

                    {selectedCase.images && selectedCase.images.length > 0 && (
                      <Pressable
                        onPress={viewImages}
                        style={[styles.button, styles.buttonViewImages]}
                      >
                        <Text style={styles.textStyle}>View Picture</Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setModalVisible(!modalVisible)}
                    >
                      <Text style={styles.textStyle}>Close</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={professionalismScoresModalVisible}
        onRequestClose={() => {
          setProfessionalismScoresModalVisible(
            !professionalismScoresModalVisible
          );
        }}
      >
        {selectedCase && ( // ตรวจสอบว่า selectedCase ไม่ใช่ null ก่อนแสดง Modal
          <View style={styles.centerView}>
            <View style={styles.modalView}>
              <Text
                style={{ fontWeight: "bold", fontSize: 28, marginBottom: 10 }}
              >
                Professionalism scores
              </Text>
              {selectedCase.professionalismScores && (
                <>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      Punctual :{" "}
                    </Text>
                    {selectedCase.professionalismScores.punctual ? "✔️" : "❌"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      Appropriately dressed:{" "}
                    </Text>
                    {selectedCase.professionalismScores.appropriatelyDressed
                      ? "✔️"
                      : "❌"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      Respect the Case :{" "}
                    </Text>
                    {selectedCase.professionalismScores.respectsCases
                      ? "✔️"
                      : "❌"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      Good listener :{" "}
                    </Text>
                    {selectedCase.professionalismScores.goodListener
                      ? "✔️"
                      : "❌"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      Respect colleagues :{" "}
                    </Text>
                    {selectedCase.professionalismScores.respectsColleagues
                      ? "✔️"
                      : "❌"}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      Accurately record Case information :{" "}
                    </Text>
                    {selectedCase.professionalismScores.accurateRecordKeeping
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
        )}
      </Modal>

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
              {selectedCase?.images &&
                selectedCase.images.map((imageUrl, index) => {
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
                        <Text style={{ color: "white", textAlign: "center" }}>
                          Click to view picture url
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
            </ScrollView>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setImageModalVisible(!imageModalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
export default UserCaseScreen;
