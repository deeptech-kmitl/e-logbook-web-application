import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Picker,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Button
} from "react-native";
import { useSelector } from "react-redux";
import { db } from "../../data/firebaseDB";
import { collection, getDocs, query, where,} from "firebase/firestore";
import * as XLSX from "xlsx";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SelectList } from "react-native-dropdown-select-list";

const ExportScreen = () => {
  const currentUserUid = useSelector((state) => state.user.uid);
  const [patientsData, setPatientsData] = useState([]);
  const [proceduresData, setProceduresData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [fileFormat, setFileFormat] = useState("csv");
  const [selectedData, setSelectedData] = useState("patients");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [previewData, setPreviewData] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [layoutType, setLayoutType] = useState("column");
  const [containerHeight, setContainerHeight] = useState(121);  // เพิ่ม state สำหรับ container height
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [students, setStudents] = useState([]); 
  const [studentId, setStudentId] = useState(null); 
  const [studentName, setStudentName] = useState(null); 
  const [selectedStudent, setSelectedStudent] = useState("all");

  const [isVisible, setIsVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [windowHeight, setWindowHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLandscape, setIsLandscape] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const isMobile = windowWidth < 768; // ตรวจสอบว่าอุปกรณ์เป็น Mobile หรือไม่
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // ตรวจสอบว่าอุปกรณ์เป็น Tablet หรือไม่
  const isPC = windowWidth >= 1024; // ตรวจสอบว่าอุปกรณ์เป็น PC หรือไม่

  const [selectedSubject, setSelectedSubject] = useState("all");
  const subjectsByYear = [
    { key: "all", value: "All" },
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

  const statusOptions = [
    { key: "all", value: "All"},
    { key: "pending", value: "Pending" },
    { key: "approved", value: "Approved" },
    { key: "rejected", value: "Rejected" },
    { key: "recheck", value: "Recheck" },
  ];

  const formatFiles = [
    { key: "csv", value: "CSV" },
    { key: "xls", value: "XLS" },
    { key: "xlsx", value: "XLSX" },
  ];

  // useEffect(() => {
  //   const updateLayout = () => {
  //     setDimensions(Dimensions.get("window"));
  //   };

  //   Dimensions.addEventListener("change", updateLayout);
  //   return () => Dimensions.removeEventListener("change", updateLayout);
  // }, []);

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
      
      if (windowWidth >= 768 && windowWidth < 1024) {
        setLayoutType("row");
        setContainerHeight(150);  // ตั้งค่าความสูงตามที่ต้องการสำหรับหน้าจอกว้าง
      } else if (windowWidth < 768) {
        setLayoutType("column");
        setContainerHeight(180);  // ตั้งค่าความสูงตามที่ต้องการสำหรับหน้าจอแคบ
      } else {
        setLayoutType("row");
        setContainerHeight(121);  // ความสูงเริ่มต้นสำหรับหน้าจอใหญ่กว่า 1024
      }
    };
  
    updateLayout();  // เรียกใช้งานเมื่อ component ถูก mount
  
    Dimensions.addEventListener("change", updateLayout);
    return () => {
      Dimensions.removeEventListener("change", updateLayout);
    };
  }, []);

  useEffect(() => {
    const fetchUsersData = async () => {
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(usersCollection);
      const users = {};
      userSnapshot.forEach((doc) => {
        const userData = doc.data();
        users[userData.uid] = userData.displayName;
      });
      return users;
    };

    const fetchData = async () => {
      const fetchedUsersData = await fetchUsersData();
      setUsersData(fetchedUsersData);
      await getPatientsData(fetchedUsersData);
      await getProceduresData(fetchedUsersData);
      await getActivityData(fetchedUsersData);
    };

    fetchData();
  }, []);


  useEffect(() => {
    async function fetchStudents() {
      try {
        const studentRef = collection(db, "users");
        const q = query(studentRef, where("role", "==", "student"));
  
        const querySnapshot = await getDocs(q);
        const studentArray = [{ key: "", value: "All" }]; // Add 'All' option
  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          studentArray.push({ key: doc.id, value: data.displayName });
        });
  
        setStudents(studentArray);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    }
  
    fetchStudents();
  }, []);
  
  const onSelectStudent = (selectedStudentId) => {
    setSelectedStudent(selectedStudentId); // <= สำคัญมาก

    if (selectedStudentId === "") {
      setStudentName("All");
      setStudentId("");
    } else {
      const selectedStudent = students.find(
        (student) => student.key === selectedStudentId
      );

      if (selectedStudent) {
        setStudentName(selectedStudent.value);
        setStudentId(selectedStudent.key);
      } else {
        console.error("Student not found:", selectedStudentId);
      }
    }
  };

  const getPatientsData = async (usersData) => {
    const patientsCollection = collection(db, "patients");
    const patientSnapshot = await getDocs(patientsCollection);
    const patientData = patientSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        displayName: usersData[data.createBy_id] || "ไม่พบข้อมูล",
      };
    });
    setPatientsData(patientData);
  };

  const getProceduresData = async (usersData) => {
    const proceduresCollection = collection(db, "procedures");
    const procedureSnapshot = await getDocs(proceduresCollection);
    const procedureData = procedureSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        displayName: usersData[data.createBy_id] || "ไม่พบข้อมูล",
      };
    });
    setProceduresData(procedureData);
  };

  const getActivityData = async (usersData) => {
    const activityCollection = collection(db, "activity");
    const activitySnapshot = await getDocs(activityCollection);
    const activityData = activitySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        displayName: usersData[data.createBy_id] || "ไม่พบข้อมูล",
      };
    });
    setActivityData(activityData);
  };

  const sortPatientsByAdmissionDate = (data) => {
    return data.sort((a, b) => {
      const dateA = new Date(a.admissionDate);
      const dateB = new Date(b.admissionDate);
      return dateA - dateB;
    });
  };

  const sortProceduresByAdmissionDate = (data) => {
    return data.sort((a, b) => {
      const dateA = new Date(a.admissionDate);
      const dateB = new Date(b.admissionDate);
      return dateA - dateB;
    });
  };

  const sortActivitiesByAdmissionDate = (data) => {
    return data.sort((a, b) => {
      const dateA = new Date(a.admissionDate);
      const dateB = new Date(b.admissionDate);
      return dateA - dateB;
    });
  };

  const filterByDateRange = (data) => {
    return data.filter((item) => {
      if (!item.admissionDate || typeof item.admissionDate.toDate !== 'function') {
        return false; // ข้ามรายการที่ไม่มีค่า admissionDate หรือไม่ใช่ Firestore Timestamp
      }
      
      const admissionDate = item.admissionDate.toDate(); // Assuming admissionDate is a Firestore Timestamp
      const admissionDateOnly = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), admissionDate.getDate());
      const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
      const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;
  
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

const getSelectedDataForExport = () => {
  let dataForExport;
  
  if (selectedData === "patients") {
    dataForExport = filterByDateRange(patientsData).filter(
      (patient) =>
        (selectedStatus === "all" || patient.status === selectedStatus) &&
        (selectedType === "all" || patient.patientType === selectedType) &&
        (selectedSubject === "all" || patient.subject === selectedSubject) &&
        (selectedStudent === "all" || selectedStudent === "" || patient.createBy_id === studentId)
    );
  } else if (selectedData === "procedures") {
    dataForExport = filterByDateRange(proceduresData).filter(
      (procedure) =>
        (selectedStatus === "all" || procedure.status === selectedStatus) &&
        (selectedSubject === "all" || procedure.subject === selectedSubject) &&
        (selectedStudent === "all" || selectedStudent === "" || procedure.createBy_id === studentId)
    );
  } else if (selectedData === "activity") {
    dataForExport = filterByDateRange(activityData).filter(
      (activity) =>
        (selectedStatus === "all" || activity.status === selectedStatus) &&
        (selectedSubject === "all" || activity.subject === selectedSubject) &&
        (selectedStudent === "all" || selectedStudent === "" || activity.createBy_id === studentId)
    );
  }
  
  return dataForExport;
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

  const handlePreview = () => {
    setPreviewData([]);
    // const dataForPreview = getSelectedDataForExport().slice(0, 5);
    const dataForPreview = getSelectedDataForExport();
    const formattedPreviewData = dataForPreview.map((item) => ({
      ...item,
      recordDate: formatTimestamp(item.recordDate),
      admissionDate: formatTimestamp(item.admissionDate),
      approvalTimestamp: formatTimestamp(item.approvalTimestamp),
      rejectionTimestamp: formatTimestamp(item.rejectionTimestamp),
      reApprovalTimestamp: formatTimestamp(item.reApprovalTimestamp),
      Time: formatTime(item.hours, item.minutes),
      // professionalismScores: translateProfessionalismScores(item.professionalismScores)
    }));
    setPreviewData(formattedPreviewData);
  };

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();
    const dataForExport = getSelectedDataForExport();

    const sortedData =
      selectedData === "patients"
        ? sortPatientsByAdmissionDate(dataForExport)
        : selectedData === "procedures"
        ? sortProceduresByAdmissionDate(dataForExport)
        : selectedData === "activity"
        ? sortActivitiesByAdmissionDate(dataForExport)
        : dataForExport; 
    const formattedData =
      selectedData === "patients"
        ? formatPatientsDataForExport(sortedData)
        : selectedData === "procedures"
        ? formatProceduresDataForExport(sortedData)
        : formatActivityDataForExport(sortedData);

    const ws = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${selectedData.charAt(0).toUpperCase() + selectedData.slice(1)} Data`
    );

    if (fileFormat === "csv") {
      const csvData = XLSX.utils.sheet_to_csv(ws);
      const csvLink = document.createElement("a");
      const blob = new Blob([csvData], { type: "text/csv" });
      csvLink.href = URL.createObjectURL(blob);
      csvLink.setAttribute(
        "download",
        `${
          selectedData.charAt(0).toUpperCase() + selectedData.slice(1)
        }Data.csv`
      );
      csvLink.click();
    } else {
      XLSX.writeFile(
        wb,
        `${
          selectedData.charAt(0).toUpperCase() + selectedData.slice(1)
        }Data.${fileFormat}`
      );
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  };

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
  
  const formatTime = (hours, minutes) => {
    if (hours === undefined || hours === null || hours === '' || minutes === undefined || minutes === null || minutes === '') {
      return "ไม่พบข้อมูล";
    }
    
    // Ensure both hours and minutes are two digits
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
  
    return `${paddedHours}:${paddedMinutes}`;
  };
  
  const translateProfessionalismScores = (scores) => {
    if (scores) {
      const translationMap = {
        basicKnowledge: "Basic knowledge/basic science",
        clinicalSkills: "Clinical skills (history taking and physical examination)",
        problemIdentification: "Problem identification and approaching",
        managementProblem: "Management/Problem solving",
        patientEducation: "Patient education",
        evidenceBase: "Evidence-based medicine",
        ethicalManner: "Ethical and manner issues"
      };
      return JSON.stringify(
        Object.entries(scores)
          .filter(([key, value]) => value)
          .map(([key]) => translationMap[key] || key)
          .join(", ")
      );
    } else {
      return "";
    }
  };

  const formatPatientsDataForExport = (data) => {
    return data.map((patient) => ({
      "Record Date": formatTimestamp(patient.recordDate),
      "Admission Date": formatTimestamp(patient.admissionDate),
      "Time": formatTime(patient.hours, patient.minutes),
      "Display Name": patient.displayName,
      "Creator ID": patient.createBy_id,
      HN: patient.hn,
      "Patient Name": patient.patientName,
      "Patient Type": patient.patientType,
      "หมวดหมู่การวินิจฉัย": patient.diagnosticType,
      "Main Diagnosis": patient.mainDiagnosis,
      "Co-Morbid": patient.coMorbid
        ? patient.coMorbid.map((item) => item.value).join(", ")
        : "", // แปลง JSON ให้เป็นสตริง
      "Instructor Name": patient.professorName,
      "Instructor ID": patient.professorId,
      Status: patient.status,
      Note: patient.note,
      Comment: patient.comment,
      "Approval Timestamp": formatTimestamp(patient.approvalTimestamp),
      "Rejection Timestamp": formatTimestamp(patient.rejectionTimestamp),
      "Recheck Timestamp": formatTimestamp(patient.reApprovalTimestamp),
      Rating: patient.rating || "",
      "Professionalism Scores": translateProfessionalismScores(
        patient.professionalismScores || null
      ),
      "Subject": patient.subject
    }));
  };

  const formatProceduresDataForExport = (data) => {
    return data.map((procedure) => ({
      "Record Date": formatTimestamp(procedure.recordDate),
      "Admission Date": formatTimestamp(procedure.admissionDate),
      "Time": formatTime(procedure.hours, procedure.minutes),
      "Display Name": procedure.displayName,
      "Creator ID": procedure.createBy_id,
      HN: procedure.hn,
      "Patient Name": procedure.patientName,
      "Procedure Level": procedure.procedureLevel,
      "Procedure Type": procedure.procedureType,
      "Instructor Name": procedure.professorName,
      "Instructor ID": procedure.professorId,
      Status: procedure.status,
      Remarks: procedure.remarks,
      Comment: procedure.comment,
      "Approval Timestamp": formatTimestamp(
        procedure.approvalTimestamp || null
      ),
      "Rejection Timestamp": formatTimestamp(
        procedure.rejectionTimestamp || null
      ),
      "Recheck Timestamp": formatTimestamp(
        procedure.reApprovalTimestamp || null
      ),
      Rating: procedure.rating || "",
      "Professionalism Scores": translateProfessionalismScores(
        procedure.professionalismScores || null
      ),
      "Subject": procedure.subject
    }));
  };

  const formatActivityDataForExport = (data) => {
    return data.map((activity) => ({
      "Record Date": formatTimestamp(activity.recordDate),
      "Admission Date": formatTimestamp(activity.admissionDate),
      "Time": formatTime(activity.hours, activity.minutes),
      "Display Name": activity.displayName,
      "Creator ID": activity.createBy_id,
      "Topic": activity.topic,
      "Activity Type": activity.activityType,
      "Instructor Name": activity.professorName,
      "Instructor ID": activity.professorId,
      Status: activity.status,
      Note: activity.note,
      Comment: activity.comment,
      "Approval Timestamp": formatTimestamp(activity.approvalTimestamp) || null,
      "Rejection Timestamp": formatTimestamp(activity.rejectionTimestamp) || null,
      "Recheck Timestamp": formatTimestamp(activity.reApprovalTimestamp) || null,
      Rating: activity.rating || "",
      "Professionalism Scores": translateProfessionalismScores(
        activity.professionalismScores || null
      ),
      "Subject": activity.subject
    }));
  };

  return (
    <View style={styles.mainContainer}>

        <View style={{ marginVertical: 20 }}>
          <Button
            color="#FE810E"
            title={isVisible ? "Hide Filters" : "Show Filters"}
            onPress={() => setIsVisible(!isVisible)}
          />
        </View>
      {isVisible && (
        <>
      <View
              style={{
                marginVertical: 10,
                flexDirection: isPC ? 'row' : 'column', // Row only for wide screens
                alignItems: isPC ? 'flex-start' : 'center',
                justifyContent: isPC ? 'flex-start' : 'center',
                flexWrap: isPC ? 'wrap' : 'nowrap', // Allow wrap on wide screens if needed
              }}
            >

          {!isPC ? (
            <View
              style={{
                // marginVertical: 10,
                flexDirection: "row",
                alignContent: 'space-between',
                alignItems: "center",  
              }}
            >
                <View style={{ marginBottom: isPC ? 0 : 10, marginRight: 20 }}>
                  <Text style={{ marginBottom: 10, textAlign: 'center' }}>Start Date:</Text>
                  <StartDateInput />
                </View>
                
                <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
                  <Text style={{ marginBottom: 10, textAlign: 'center' }}>End Date:</Text>
                  <EndDateInput />
                </View>
          
              </View>
              ) : (
                <>
                <View style={{ marginBottom: isPC ? 0 : 10, marginRight: 20 }}>
                  <Text style={{ marginBottom: 10, textAlign: 'center' }}>Start Date:</Text>
                  <StartDateInput />
                </View>
                
                <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
                  <Text style={{ marginBottom: 10, textAlign: 'center' }}>End Date:</Text>
                  <EndDateInput />
                </View>
                </>
          )}
{!isPC ? (
      <View
        style={{
          // marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",  
        }}
      >
        
        <View style={{ marginBottom: 10, marginRight: 20 }}>
          <Text style={{ textAlign: 'center', marginBottom: 10 }}>Select data type :</Text>
            <SelectList
              data={[
                { key: "patients", value: "Patients" },
                { key: "procedures", value: "Procedures" },
                { key: "activity", value: "Activity" },
              ]}
              setSelected={setSelectedData}
              placeholder="Select Data"
              defaultOption={{ key: selectedData, value: selectedData.charAt(0).toUpperCase() + selectedData.slice(1) }}
              search={false}
              boxStyles={{
                width: "100%",
                backgroundColor: "#FEF0E6",
                borderColor: "#FEF0E6",
                borderWidth: 1,
                borderRadius: 10,
                marginBottom: 10,
              }}
              dropdownStyles={{
                backgroundColor: "#FEF0E6",
                width: "100%",
              }}
            />
        </View>

        {selectedData === "patients" && (
            <>
          <View style={{ marginBottom: 10, marginRight: 20 }}> 
              <Text style={{ textAlign: 'center', marginBottom: 10 }}>Select patient type :</Text>
              <SelectList
                data={[
                  { key: "all", value: "All Types" },
                  { key: "inpatient", value: "Inpatient" },
                  { key: "outpatient", value: "Outpatient" },
                ]}
                setSelected={setSelectedType}
                placeholder="All Types"
                defaultOption={{ key: selectedType, value: selectedType.charAt(0).toUpperCase() + selectedType.slice(1) }}
                search={false}
                boxStyles={{
                  width: "100%",
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                  marginBottom: 10,
                }}
                dropdownStyles={{
                  backgroundColor: "#FEF0E6",
                  width: "100%",
                }}
              />
          </View>
            </>
          )}
        </View>
        ) : (
        <>
        <View style={{ marginBottom: 10, marginRight: 20 }}>
          <Text style={{ textAlign: 'center', marginBottom: 10 }}>Select data type :</Text>
            <SelectList
              data={[
                { key: "patients", value: "Patients" },
                { key: "procedures", value: "Procedures" },
                { key: "activity", value: "Activity" },
              ]}
              setSelected={setSelectedData}
              placeholder="Select Data"
              defaultOption={{ key: selectedData, value: selectedData.charAt(0).toUpperCase() + selectedData.slice(1) }}
              search={false}
              boxStyles={{
                width: "100%",
                backgroundColor: "#FEF0E6",
                borderColor: "#FEF0E6",
                borderWidth: 1,
                borderRadius: 10,
                marginBottom: 10,
              }}
              dropdownStyles={{
                backgroundColor: "#FEF0E6",
                width: "100%",
              }}
            />
        </View>

        {selectedData === "patients" && (
            <>
          <View style={{ marginBottom: 10, marginRight: 20 }}> 
              <Text style={{ textAlign: 'center', marginBottom: 10 }}>Select patient type :</Text>
              <SelectList
                data={[
                  { key: "all", value: "All Types" },
                  { key: "inpatient", value: "Inpatient" },
                  { key: "outpatient", value: "Outpatient" },
                ]}
                setSelected={setSelectedType}
                placeholder="All Types"
                defaultOption={{ key: selectedType, value: selectedType.charAt(0).toUpperCase() + selectedType.slice(1) }}
                search={false}
                boxStyles={{
                  width: "100%",
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                  marginBottom: 10,
                }}
                dropdownStyles={{
                  backgroundColor: "#FEF0E6",
                  width: "100%",
                }}
              />
          </View>
            </>
          )}
           </>
        )}

          <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center' }}>Select subject:</Text>
            <SelectList
              data={subjectsByYear}
              setSelected={setSelectedSubject}
              placeholder="All"
              defaultOption={selectedSubject}
              search={false}
              boxStyles={{
                width: '100%',
                backgroundColor: "#FEF0E6",
                borderColor: "#FEF0E6",
                borderWidth: 1,
                borderRadius: 10,
              }}
              dropdownStyles={{
                backgroundColor: "#FEF0E6",
                width: "100%",
              }}
            />
          </View>

          <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center' }}>Select medical student name:</Text>
            <SelectList
              setSelected={onSelectStudent}
              data={students}
              placeholder="All"
              placeholderTextColor="grey"
              boxStyles={{
                width: '100%',
                backgroundColor: "#FEF0E6",
                borderColor: "#FEF0E6",
                borderWidth: 1,
                borderRadius: 10,
              }}
              dropdownStyles={{ backgroundColor: "#FEF0E6" }}
            />
          </View>

    {!isPC ? (
      <View
        style={{
          // marginVertical: 10,
          flexDirection: "row",
          alignContent: 'space-between',
          alignItems: "center",  
        }}
      >
          <View style={{ marginBottom: 10, marginRight: 20 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center' }}>Select status:</Text>
              <SelectList
                data={statusOptions}
                setSelected={setSelectedStatus}
                placeholder="All"
                defaultOption={selectedStatus}
                search={false}
                boxStyles={{
                  width: '100%',
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                }}
                dropdownStyles={{
                  backgroundColor: "#FEF0E6",
                  width: "100%",
                }}
              />
          </View>

          <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center' }}>Select Format:</Text>
              <SelectList
                data={formatFiles}
                // defaultOption={fileFormat}
                setSelected={setFileFormat}
                placeholder="Select format"
                search={false}
                boxStyles={{
                  width: '100%',
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                }}
                dropdownStyles={{
                  backgroundColor: "#FEF0E6",
                  width: "100%",
                }}
              />
          </View>
        </View>
      ) : (
          <>
          <View style={{ marginBottom: 10, marginRight: 20 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center' }}>Select status:</Text>
              <SelectList
                data={statusOptions}
                setSelected={setSelectedStatus}
                placeholder="All"
                defaultOption={selectedStatus}
                search={false}
                boxStyles={{
                  width: '100%',
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                }}
                dropdownStyles={{
                  backgroundColor: "#FEF0E6",
                  width: "100%",
                }}
              />
          </View>

          <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
            <Text style={{ marginBottom: 10, textAlign: 'center' }}>Select Format:</Text>
              <SelectList
                data={formatFiles}
                // defaultOption={fileFormat}
                setSelected={setFileFormat}
                placeholder="Select format"
                search={false}
                boxStyles={{
                  width: '100%',
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                }}
                dropdownStyles={{
                  backgroundColor: "#FEF0E6",
                  width: "100%",
                }}
              />
          </View>
          </>
        )}

        <View style={{ marginBottom: isPC ? 0 : 10, marginRight: isPC ? 20 : 0 }}>
          <TouchableOpacity
                style={styles.previewButton}
                onPress={handlePreview}
              >
                <AntDesign name="eye" size={16} color="white" />
                <Text style={styles.previewText}>Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownload}
              >
                <AntDesign name="download" size={16} color="white" />
                <Text style={styles.downloadText}>Download</Text>
              </TouchableOpacity>
        </View>

      </View>
      </>
      )}


      <ScrollView>
        <ScrollView horizontal={true} style={{ flex: 1, marginTop: 20 }}>
          <View>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {selectedData === "patients" ? (
                  <>
                    <Text style={styles.columnHeader}>Record Date</Text>
                    <Text style={styles.columnHeader}>Admission Date</Text>
                    <Text style={styles.columnHeader}>Time</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>HN</Text>
                    <Text style={styles.columnHeader}>Patient Name</Text>
                    <Text style={styles.columnHeader}>Patient Type</Text>
                    <Text style={styles.columnHeader}>หมวดหมู่การวินิจฉัย</Text>
                    <Text style={styles.columnHeader}>Main Diagnosis</Text>
                    {/* <Text style={styles.columnHeader}>Co-Morbid</Text> */}
                    <Text style={styles.columnHeader}>Instructor Name</Text>
                    <Text style={styles.columnHeader}>Instructor ID</Text>
                    <Text style={styles.columnHeader}>Status</Text>
                    {/* <Text style={styles.columnHeader}>PDF URL</Text> */}
                    <Text style={styles.columnHeader}>Note</Text>
                    <Text style={styles.columnHeader}>Comment</Text>
                    <Text style={styles.columnHeader}>Approval Timestamp</Text>
                    <Text style={styles.columnHeader}>Rejection Timestamp</Text>
                    <Text style={styles.columnHeader}>Recheck Timestamp</Text>
                    <Text style={styles.columnHeader}>Rating</Text>
                    <Text style={styles.columnHeader}>
                      Professionalism Scores
                    </Text>
                    <Text style={styles.columnHeader}>Subject</Text>
                  </>
                ) : selectedData === "procedures" ? (
                  <>
                    <Text style={styles.columnHeader}>Record Date</Text>
                    <Text style={styles.columnHeader}>Admission Date</Text>
                    <Text style={styles.columnHeader}>Time</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>HN</Text>
                    <Text style={styles.columnHeader}>Patient Name</Text>
                    <Text style={styles.columnHeader}>Procedure Level</Text>
                    <Text style={styles.columnHeader}>Procedure Type</Text>
                    <Text style={styles.columnHeader}>Instructor Name</Text>
                    <Text style={styles.columnHeader}>Instructor ID</Text>
                    <Text style={styles.columnHeader}>Status</Text>
                    {/* <Text style={styles.columnHeader}>Images</Text> */}
                    <Text style={styles.columnHeader}>Remarks</Text>
                    <Text style={styles.columnHeader}>Comment</Text>
                    <Text style={styles.columnHeader}>Approval Timestamp</Text>
                    <Text style={styles.columnHeader}>Rejection Timestamp</Text>
                    <Text style={styles.columnHeader}>Recheck Timestamp</Text>
                    <Text style={styles.columnHeader}>Rating</Text>
                    <Text style={styles.columnHeader}>
                      Professionalism Scores
                    </Text>
                    <Text style={styles.columnHeader}>Subject</Text>
                  </>
                ) : selectedData === "activity" ? (
                  <>
                    <Text style={styles.columnHeader}>Record Date</Text>
                    <Text style={styles.columnHeader}>Activity Date</Text>
                    <Text style={styles.columnHeader}>Time</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>Topic</Text>
                    <Text style={styles.columnHeader}>Activity Type</Text>
                    <Text style={styles.columnHeader}>Instructor Name</Text>
                    <Text style={styles.columnHeader}>Instructor ID</Text>
                    <Text style={styles.columnHeader}>Status</Text>
                    <Text style={styles.columnHeader}>Remarks</Text>
                    <Text style={styles.columnHeader}>Comment</Text>
                    <Text style={styles.columnHeader}>Approval Timestamp</Text>
                    <Text style={styles.columnHeader}>Rejection Timestamp</Text>
                    <Text style={styles.columnHeader}>Recheck Timestamp</Text>
                    <Text style={styles.columnHeader}>Rating</Text>
                    <Text style={styles.columnHeader}>
                      Professionalism Scores
                    </Text>
                    <Text style={styles.columnHeader}>Subject</Text>
                  </>
                ) : null}
              </View>
              {previewData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  {selectedData === "patients" ? (
                    <>
                      <Text style={styles.tableCell}>{item.recordDate}</Text>
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.Time}</Text>
                      <Text style={styles.tableCell}>{item.displayName}</Text>
                      <Text style={styles.tableCell}>{item.createBy_id}</Text>
                      <Text style={styles.tableCell}>{item.hn}</Text>
                      <Text style={styles.tableCell}>{item.patientName}</Text>
                      <Text style={styles.tableCell}>{item.patientType}</Text>
                      <Text style={styles.tableCell}>{item.diagnosticType}</Text>
                      <Text style={styles.tableCell}>{item.mainDiagnosis}</Text>
                      {/* <Text style={styles.tableCell}>{item.coMorbid.map(cm => cm.value).join(', ')}</Text> */}
                      <Text style={styles.tableCell}>{item.professorName}</Text>
                      <Text style={styles.tableCell}>{item.professorId}</Text>
                      <Text style={styles.tableCell}>{item.status}</Text>
                      {/* <Text style={styles.tableCell}>{item.pdfUrl}</Text> */}
                      <Text style={styles.tableCell}>{item.note}</Text>
                      <Text style={styles.tableCell}>{item.comment}</Text>
                      <Text style={styles.tableCell}>
                        {item.approvalTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>
                        {item.rejectionTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>
                        {item.reApprovalTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>{item.rating}</Text>
                      <Text style={styles.tableCell}>
                        {translateProfessionalismScores(
                          item.professionalismScores
                        )}
                      </Text>
                      <Text style={styles.tableCell}>{item.subject}</Text>
                    </>
                  ) : selectedData === "procedures" ? (
                    <>
                      <Text style={styles.tableCell}>{item.recordDate}</Text>
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.Time}</Text>
                      <Text style={styles.tableCell}>{item.displayName}</Text>
                      <Text style={styles.tableCell}>{item.createBy_id}</Text>
                      <Text style={styles.tableCell}>{item.hn}</Text>
                      <Text style={styles.tableCell}>{item.patientName}</Text>
                      <Text style={styles.tableCell}>
                        {item.procedureLevel}
                      </Text>
                      <Text style={styles.tableCell}>{item.procedureType}</Text>
                      <Text style={styles.tableCell}>
                        {item.professorName}
                      </Text>
                      <Text style={styles.tableCell}>{item.professorId}</Text>
                      <Text style={styles.tableCell}>{item.status}</Text>
                      {/* <Text style={styles.tableCell}>{item.images}</Text> */}
                      <Text style={styles.tableCell}>{item.remarks}</Text>
                      <Text style={styles.tableCell}>{item.comment}</Text>
                      <Text style={styles.tableCell}>
                        {item.approvalTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>
                        {item.rejectionTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>
                        {item.reApprovalTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>{item.rating}</Text>
                      <Text style={styles.tableCell}>
                        {translateProfessionalismScores(
                          item.professionalismScores
                        )}
                      </Text>
                      <Text style={styles.tableCell}>{item.subject}</Text>
                    </>
                  ) : selectedData === "activity" ? (
                    <>
                      <Text style={styles.tableCell}>{item.recordDate}</Text>
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.Time}</Text>
                      <Text style={styles.tableCell}>{item.displayName}</Text>
                      <Text style={styles.tableCell}>{item.createBy_id}</Text>
                      <Text style={styles.tableCell}>{item.topic}</Text>
                      <Text style={styles.tableCell}>{item.activityType}</Text>
                      <Text style={styles.tableCell}>{item.professorName}</Text>
                      <Text style={styles.tableCell}>{item.professorId}</Text>
                      <Text style={styles.tableCell}>{item.status}</Text>
                      {/* <Text style={styles.tableCell}>{item.images}</Text> */}
                      <Text style={styles.tableCell}>{item.note}</Text>
                      <Text style={styles.tableCell}>{item.comment}</Text>
                      <Text style={styles.tableCell}>
                        {item.approvalTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>
                        {item.rejectionTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>
                        {item.reApprovalTimestamp}
                      </Text>
                      <Text style={styles.tableCell}>{item.rating}</Text>
                      <Text style={styles.tableCell}>
                        {translateProfessionalismScores(
                          item.professionalismScores
                        )}
                      </Text>
                      <Text style={styles.tableCell}>{item.subject}</Text>
                    </>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  reportContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "auto",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 5,
    marginTop: 20,
  },
  reportContent: {
    flexDirection: "column", // ค่าเริ่มต้นเป็น column
    justifyContent: "space-between",
    marginBottom: 20, 
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 5,
    borderRadius: 16,
    marginLeft: 10,
    marginRight: 10
  },
  downloadText: {
    marginLeft: 5,
    marginRight: 10,
    color: "white",
  },
  previewButton: {
    flexDirection: "row",
    marginVertical: 10,
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 16,
    marginLeft: 10,
    marginRight: 10
  },
  previewText: {
    marginLeft: 5,
    marginRight: 10,
    color: "white",
  },
  pickerStyle: {
    textAlign: "center",
    marginVertical: 5,
    marginRight: 10,
    shadowColor: "#000",
    width: "auto",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  previewContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: "white",
  },
  tableRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
  },
  tableHeader: {
    backgroundColor: "#f2f2f2",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "grey",
  },
  columnHeader: {
    width: 150,
    paddingVertical: 10,
    paddingHorizontal: 5,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    fontWeight: "bold",
    backgroundColor: "grey",
  },
  tableCell: {
    backgroundColor: "white",
    width: 150,
    paddingVertical: 10,
    paddingHorizontal: 5,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
});

export default ExportScreen;
