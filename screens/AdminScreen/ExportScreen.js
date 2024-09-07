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
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

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

  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateLayout);
    return () => Dimensions.removeEventListener("change", updateLayout);
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
    const updateLayout = () => {
      const windowWidth = Dimensions.get("window").width;
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
        (selectedType === "all" || patient.patientType === selectedType)
    );
  } else if (selectedData === "procedures") {
    dataForExport = filterByDateRange(proceduresData).filter(
      (procedure) =>
        (selectedStatus === "all" || procedure.status === selectedStatus)
    );
  } else if (selectedData === "activity") {
    dataForExport = filterByDateRange(activityData).filter(
      (activity) =>
        (selectedStatus === "all" || activity.status === selectedStatus)
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
            width: "80%",
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
            width: "80%",
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
    const dataForPreview = getSelectedDataForExport().slice(0, 5);
    const formattedPreviewData = dataForPreview.map((item) => ({
      ...item,
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
      "Admission Date": formatTimestamp(patient.admissionDate),
      "Time": formatTime(patient.hours, patient.minutes),
      "Display Name": patient.displayName,
      "Creator ID": patient.createBy_id,
      HN: patient.hn,
      "Patient Type": patient.patientType,
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
      "Admission Date": formatTimestamp(procedure.admissionDate),
      "Time": formatTime(procedure.hours, procedure.minutes),
      "Display Name": procedure.displayName,
      "Creator ID": procedure.createBy_id,
      HN: procedure.hn,
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
      "Subject": procedure.subject
    }));
  };

  const formatActivityDataForExport = (data) => {
    return data.map((activity) => ({
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
      "Subject": activity.subject
    }));
  };

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.reportContainer, { height: containerHeight }]}>
        {/* <Text style={{ fontSize: 16 }}>Export Data: </Text> */}
        <View style={{flexDirection: "row", justifyContent: 'space-between'}}>
          <View style={{flexDirection: "column"}}>
            <Picker
              selectedValue={selectedData}
              style={styles.pickerStyle}
              onValueChange={(itemValue, itemIndex) => setSelectedData(itemValue)}
            >
              <Picker.Item label="Patients" value="patients" />
              <Picker.Item label="Procedures" value="procedures" />
              <Picker.Item label="Activity" value="activity" />
            </Picker>

            {selectedData === "patients" && (
              <Picker
                selectedValue={selectedType}
                style={styles.pickerStyle}
                onValueChange={(itemValue, itemIndex) =>
                  setSelectedType(itemValue)
                }
              >
                <Picker.Item label="All Types" value="all" />
                <Picker.Item label="Inpatient" value="inpatient" />
                <Picker.Item label="Outpatient" value="outpatient" />
              </Picker>
            )}

            <Picker
              selectedValue={selectedStatus}
              style={styles.pickerStyle}
              onValueChange={(itemValue, itemIndex) =>
                setSelectedStatus(itemValue)
              }
            >
              <Picker.Item label="All Status" value="all" />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Approved" value="approved" />
              <Picker.Item label="Rejected" value="rejected" />
              <Picker.Item label="Recheck" value="recheck" />
            </Picker>

            <Picker
              selectedValue={fileFormat}
              style={styles.pickerStyle}
              onValueChange={(itemValue, itemIndex) => setFileFormat(itemValue)}
            >
              <Picker.Item label="CSV" value="csv" />
              <Picker.Item label="XLS" value="xls" />
              <Picker.Item label="XLSX" value="xlsx" />
            </Picker>
          </View>
          
          <View style={{flexDirection: "column", justifyContent: 'center', alignSelf: 'center'}}>
            <View style={{marginVertical: 10}}>
              <StartDateInput />
            </View>
              <EndDateInput />
          </View>

          <View style={{flexDirection: "column", justifyContent: 'center', alignSelf: 'center'}}>
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
        </View>


      <ScrollView>
        <ScrollView horizontal={true} style={{ flex: 1 }}>
          <View>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {selectedData === "patients" ? (
                  <>
                    <Text style={styles.columnHeader}>Admission Date</Text>
                    <Text style={styles.columnHeader}>Time</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>HN</Text>
                    <Text style={styles.columnHeader}>Patient Type</Text>
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
                    <Text style={styles.columnHeader}>Admission Date</Text>
                    <Text style={styles.columnHeader}>Time</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>HN</Text>
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
                    <Text style={styles.columnHeader}>Subject</Text>
                  </>
                ) : selectedData === "activity" ? (
                  <>
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
                    <Text style={styles.columnHeader}>Subject</Text>
                  </>
                ) : null}
              </View>
              {previewData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  {selectedData === "patients" ? (
                    <>
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.Time}</Text>
                      <Text style={styles.tableCell}>{item.displayName}</Text>
                      <Text style={styles.tableCell}>{item.createBy_id}</Text>
                      <Text style={styles.tableCell}>{item.hn}</Text>
                      <Text style={styles.tableCell}>{item.patientType}</Text>
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
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.Time}</Text>
                      <Text style={styles.tableCell}>{item.displayName}</Text>
                      <Text style={styles.tableCell}>{item.createBy_id}</Text>
                      <Text style={styles.tableCell}>{item.hn}</Text>
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
                      <Text style={styles.tableCell}>{item.subject}</Text>
                    </>
                  ) : selectedData === "activity" ? (
                    <>
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
    width: 766,
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
    width: 130,
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
  },
  tableRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tableHeader: {
    backgroundColor: "#f2f2f2",
    flexDirection: "row",
    flexWrap: "wrap",
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
  },
  tableCell: {
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
