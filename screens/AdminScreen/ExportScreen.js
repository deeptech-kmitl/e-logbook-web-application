import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Picker,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { db } from "../../data/firebaseDB";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { AntDesign } from "@expo/vector-icons";

const ExportScreen = () => {
  const currentUserUid = useSelector((state) => state.user.uid);
  const [patientsData, setPatientsData] = useState([]);
  const [proceduresData, setProceduresData] = useState([]);
  const [fileFormat, setFileFormat] = useState("csv");
  const [selectedData, setSelectedData] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [previewData, setPreviewData] = useState([]);
  const [usersData, setUsersData] = useState({});

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
    };

    fetchData();
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

  const getSelectedDataForExport = () => {
    let dataForExport;
    if (selectedData === "patients") {
      dataForExport = patientsData.filter(
        (patient) =>
          (selectedStatus === "all" || patient.status === selectedStatus) &&
          (selectedType === "all" || patient.patientType === selectedType)
      );
    } else {
      dataForExport = proceduresData.filter(
        (procedure) =>
          selectedStatus === "all" || procedure.status === selectedStatus
      );
    }
    return dataForExport;
  };

  const handlePreview = () => {
    setPreviewData([]);
    const dataForPreview = getSelectedDataForExport().slice(0, 5);
    const formattedPreviewData = dataForPreview.map((item) => ({
      ...item,
      admissionDate: formatTimestamp(item.admissionDate),
      approvalTimestamp: formatTimestamp(item.approvalTimestamp),
      rejectionTimestamp: formatTimestamp(item.rejectionTimestamp),
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
        : sortProceduresByAdmissionDate(dataForExport);
    const formattedData =
      selectedData === "patients"
        ? formatPatientsDataForExport(sortedData)
        : formatProceduresDataForExport(sortedData);

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

  const translateProfessionalismScores = (scores) => {
    if (scores) {
      const translationMap = {
        punctual: "ตรงต่อเวลา",
        appropriatelyDressed: "แต่งกายเหมาะสม",
        respectsPatients: "เคารพผู้ป่วย",
        goodListener: "เป็นผู้ฟังที่ดี",
        respectsColleagues: "ให้เกียรติเพื่อนร่วมงาน",
        accurateRecordKeeping: "บันทึกข้อมูลผู้ป่วยอย่างถูกต้อง",
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
      Hours: patient.hours,
      Minutes: patient.minutes,
      "Display Name": patient.displayName,
      "Creator ID": patient.createBy_id,
      HN: patient.hn,
      "Patient Type": patient.patientType,
      "Main Diagnosis": patient.mainDiagnosis,
      "Co-Morbid": patient.coMorbid
        ? patient.coMorbid.map((item) => item.value).join(", ")
        : "", // แปลง JSON ให้เป็นสตริง
      "Professor Name": patient.professorName,
      "Professor ID": patient.professorId,
      Status: patient.status,
      Note: patient.note,
      Comment: patient.comment,
      "Approval Timestamp": formatTimestamp(patient.approvalTimestamp),
      "Rejection Timestamp": formatTimestamp(patient.rejectionTimestamp),
      Rating: patient.rating || "",
      "Professionalism Scores": translateProfessionalismScores(
        patient.professionalismScores || null
      ),
    }));
  };

  const formatProceduresDataForExport = (data) => {
    return data.map((procedure) => ({
      "Admission Date": formatTimestamp(procedure.admissionDate),
      Hours: procedure.hours,
      Minutes: procedure.minutes,
      "Display Name": procedure.displayName,
      "Creator ID": procedure.createBy_id,
      HN: procedure.hn,
      "Procedure Level": procedure.procedureLevel,
      "Procedure Type": procedure.procedureType,
      "Approved By Name": procedure.approvedByName,
      "Approved By ID": procedure.approvedById,
      Status: procedure.status,
      Remarks: procedure.remarks,
      Comment: procedure.comment,
      "Approval Timestamp": formatTimestamp(
        procedure.approvalTimestamp || null
      ),
      "Rejection Timestamp": formatTimestamp(
        procedure.rejectionTimestamp || null
      ),
      Rating: procedure.rating || "",
    }));
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.reportContainer}>
        {/* <Text style={{ fontSize: 16 }}>Export Data: </Text> */}
        <View style={styles.reportContent}>
          <Picker
            selectedValue={selectedData}
            style={styles.pickerStyle}
            onValueChange={(itemValue, itemIndex) => setSelectedData(itemValue)}
          >
            <Picker.Item label="Patients" value="patients" />
            <Picker.Item label="Procedures" value="procedures" />
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

      <ScrollView>
        <ScrollView horizontal={true} style={{ flex: 1 }}>
          <View>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {selectedData === "patients" ? (
                  <>
                    <Text style={styles.columnHeader}>Admission Date</Text>
                    <Text style={styles.columnHeader}>Hours</Text>
                    <Text style={styles.columnHeader}>Minutes</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>HN</Text>
                    <Text style={styles.columnHeader}>Patient Type</Text>
                    <Text style={styles.columnHeader}>Main Diagnosis</Text>
                    {/* <Text style={styles.columnHeader}>Co-Morbid</Text> */}
                    <Text style={styles.columnHeader}>Professor Name</Text>
                    <Text style={styles.columnHeader}>Professor ID</Text>
                    <Text style={styles.columnHeader}>Status</Text>
                    {/* <Text style={styles.columnHeader}>PDF URL</Text> */}
                    <Text style={styles.columnHeader}>Note</Text>
                    <Text style={styles.columnHeader}>Comment</Text>
                    <Text style={styles.columnHeader}>Approval Timestamp</Text>
                    <Text style={styles.columnHeader}>Rejection Timestamp</Text>
                    <Text style={styles.columnHeader}>Rating</Text>
                    <Text style={styles.columnHeader}>
                      Professionalism Scores
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.columnHeader}>Admission Date</Text>
                    <Text style={styles.columnHeader}>Hours</Text>
                    <Text style={styles.columnHeader}>Minutes</Text>
                    <Text style={styles.columnHeader}>Display Name</Text>
                    <Text style={styles.columnHeader}>Creator ID</Text>
                    <Text style={styles.columnHeader}>HN</Text>
                    <Text style={styles.columnHeader}>Procedure Level</Text>
                    <Text style={styles.columnHeader}>Procedure Type</Text>
                    <Text style={styles.columnHeader}>Approved By Name</Text>
                    <Text style={styles.columnHeader}>Approved By ID</Text>
                    <Text style={styles.columnHeader}>Status</Text>
                    {/* <Text style={styles.columnHeader}>Images</Text> */}
                    <Text style={styles.columnHeader}>Remarks</Text>
                    <Text style={styles.columnHeader}>Comment</Text>
                    <Text style={styles.columnHeader}>Approval Timestamp</Text>
                    <Text style={styles.columnHeader}>Rejection Timestamp</Text>
                    <Text style={styles.columnHeader}>Rating</Text>
                  </>
                )}
              </View>
              {previewData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  {selectedData === "patients" ? (
                    <>
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.hours}</Text>
                      <Text style={styles.tableCell}>{item.minutes}</Text>
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
                      <Text style={styles.tableCell}>{item.rating}</Text>
                      <Text style={styles.tableCell}>
                        {translateProfessionalismScores(
                          item.professionalismScores
                        )}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.tableCell}>{item.admissionDate}</Text>
                      <Text style={styles.tableCell}>{item.hours}</Text>
                      <Text style={styles.tableCell}>{item.minutes}</Text>
                      <Text style={styles.tableCell}>{item.displayName}</Text>
                      <Text style={styles.tableCell}>{item.createBy_id}</Text>
                      <Text style={styles.tableCell}>{item.hn}</Text>
                      <Text style={styles.tableCell}>
                        {item.procedureLevel}
                      </Text>
                      <Text style={styles.tableCell}>{item.procedureType}</Text>
                      <Text style={styles.tableCell}>
                        {item.approvedByName}
                      </Text>
                      <Text style={styles.tableCell}>{item.approvedById}</Text>
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
                      <Text style={styles.tableCell}>{item.rating}</Text>
                    </>
                  )}
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
    height: 121,
    width: 766,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 5,
    marginTop: 20,
  },
  reportContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 5,
    borderRadius: 16,
    marginLeft: 20,
  },
  downloadText: {
    marginLeft: 5,
    marginRight: 10,
    color: "white",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 16,
    marginLeft: 20,
  },
  previewText: {
    marginLeft: 5,
    marginRight: 10,
    color: "white",
  },
  pickerStyle: {
    textAlign: "center",
    shadowColor: "#000",
    marginLeft: 10,
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
