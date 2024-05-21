import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Picker, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import { db } from "../data/firebaseDB";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { AntDesign } from "@expo/vector-icons";

const ReportScreen = () => {
  const currentUserUid = useSelector((state) => state.user.uid);
  const [patientsData, setPatientsData] = useState([]);
  const [proceduresData, setProceduresData] = useState([]);
  // const [activityData, setActivityData] = useState([]);
  const [fileFormat, setFileFormat] = useState("csv");
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
      // getActivityData();
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

  // Fetch procedures data
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

  // Fetch activity data
  // const getActivityData = async () => {
  //   const activityCollection = collection(db, 'activity');
  //   const activitySnapshot = await getDocs(activityCollection);
  //   setActivityData(activitySnapshot.docs.map(doc => doc.data()));
  // };

  const formatPatientsData = (data) => {
    return data.map((patient) => {
      return {
        ...patient,
        coMorbid: patient.coMorbid
          ? patient.coMorbid.map((diagnosis) => diagnosis.value).join(", ")
          : "",
        admissionDate: patient.admissionDate
          ? new Date(patient.admissionDate.seconds * 1000).toLocaleDateString()
          : "", // แปลง timestamp เป็นวันที่
        approvalTimestamp: patient.approvalTimestamp
          ? new Date(
              patient.approvalTimestamp.seconds * 1000
            ).toLocaleDateString()
          : "", // แปลง timestamp เป็นวันที่
        rejectionTimestamp: patient.rejectionTimestamp
          ? new Date(
              patient.rejectionTimestamp.seconds * 1000
            ).toLocaleDateString()
          : "", // แปลง timestamp เป็นวันที่
      };
    });
  };

  const formatDataForExport = (data) => {
    return data.map((procedure) => {
      return {
        ...procedure,
        admissionDate: procedure.admissionDate
          ? new Date(
              procedure.admissionDate.seconds * 1000
            ).toLocaleDateString()
          : "", // แปลง timestamp เป็นวันที่
        approvalTimestamp: procedure.approvalTimestamp
          ? new Date(
              procedure.approvalTimestamp.seconds * 1000
            ).toLocaleDateString()
          : "", // แปลง timestamp เป็นวันที่
        rejectionTimestamp: procedure.rejectionTimestamp
          ? new Date(
              procedure.rejectionTimestamp.seconds * 1000
            ).toLocaleDateString()
          : "", // แปลง timestamp เป็นวันที่
        images: procedure.images ? procedure.images.join(", ") : "",
      };
    });
  };

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    // เรียงข้อมูลผู้ป่วยตามวันที่รับผู้ป่วย
    const sortedPatientsData = formatPatientsData(patientsData).sort((a, b) => {
      const dateA = new Date(a.admissionDate);
      const dateB = new Date(b.admissionDate);
      return dateA - dateB;
    });

    const sortedProceduresData = formatDataForExport(proceduresData).sort(
      (a, b) => {
        const dateA = new Date(a.admissionDate);
        const dateB = new Date(b.admissionDate);
        return dateA - dateB;
      }
    );

    const translateProfessionalismScores = (scores) => {
      const translationMap = {
        punctual: "ตรงต่อเวลา",
        appropriatelyDressed: "แต่งกายเหมาะสม",
        respectsPatients: "เคารพผู้ป่วย",
        goodListener: "เป็นผู้ฟังที่ดี",
        respectsColleagues: "ให้เกียรติเพื่อนร่วมงาน",
        accurateRecordKeeping: "บันทึกข้อมูลผู้ป่วยอย่างถูกต้อง",
      };

      // ตรวจสอบว่า scores ไม่ใช่ null หรือ undefined
      if (scores) {
        return Object.entries(scores)
          .filter(([key, value]) => value)
          .map(([key]) => translationMap[key] || key)
          .join(", ");
      } else {
        return "";
      }
    };

    const formattedPatientsData = sortedPatientsData.map((patient) => ({
      // ปรับเรียงลำดับ column ตามที่กำหนด
      "วันที่รับผู้ป่วย (admissionDate)": patient.admissionDate,
      "ชั่วโมง (hours)": patient.hours,
      "นาที (minutes)": patient.minutes,
      "ชื่อผู้บันทึกข้อมูล (displayName)": patient.displayName,
      "ไอดีผู้บันทึกข้อมูล (createBy_id)": patient.createBy_id,
      "เลขประจำตัวผู้ป่วย (hn)": patient.hn,
      "ประเภทผู้ป่วย (patientType)": patient.patientType,
      "ผลวินิฉัย (mainDiagnosis)": patient.mainDiagnosis,
      "โรคแทรกซ้อน (coMorbid)": patient.coMorbid,
      "ชื่อผู้อนุมัติ (professorName)": patient.professorName,
      "ไอดีผู้อนุมัติ (professorId)": patient.professorId,
      "สถานะ (status)": patient.status,
      "ลิ้งค์เอกสารแนบ (pdfUrl)": patient.pdfUrl,
      "หมายเหตุ (note)": patient.note,
      "คอมเมนต์ (comment)": patient.comment,
      "เวลาที่อนุมัติ (approvalTimestamp)": patient.approvalTimestamp,
      "เวลาที่ปฏิเสธ (rejectionTimestamp)": patient.rejectionTimestamp,
      "คะแนน (rating)": patient.rating,
      "คะแนนการประเมิน (professionalismScores)": translateProfessionalismScores(
        patient.professionalismScores
      ),
    }));

    const formattedProceduresData = sortedProceduresData.map((procedure) => ({
      // ปรับเรียงลำดับ column ตามที่กำหนด
      "วันที่รับผู้ป่วย (admissionDate)": procedure.admissionDate,
      "ชั่วโมง (hours)": procedure.hours,
      "นาที (minutes)": procedure.minutes,
      "ชื่อผู้บันทึกข้อมูล (displayName)": procedure.displayName,
      "ไอดีผู้บันทึกข้อมูล (createBy_id)": procedure.createBy_id,
      "เลขประจำตัวผู้ป่วย (hn)": procedure.hn,
      "เลเวลหัตถการ (procedureLevel)": procedure.procedureLevel,
      "ประเภทหัตถการ (procedureType)": procedure.procedureType,
      "ชื่อผู้อนุมัติ (approvedByName)": procedure.approvedByName,
      "ไอดีผู้อนุมัติ (approvedById)": procedure.approvedById,
      "สถานะ (status)": procedure.status,
      "ลิ้งค์รูปภาพ (images)": procedure.images,
      "หมายเหตุ (remarks)": procedure.remarks,
      "คอมเมนต์ (comment)": procedure.comment,
      "เวลาที่อนุมัติ (approvalTimestamp)": procedure.approvalTimestamp,
      "เวลาที่ปฏิเสธ (rejectionTimestamp)": procedure.rejectionTimestamp,
      "คะแนน (rating)": procedure.rating,
    }));

    // const formattedActivityData = formatDataForExport(activityData);

    // สร้าง worksheet สำหรับแต่ละ collection
    const wsPatients = XLSX.utils.json_to_sheet(formattedPatientsData);
    const wsProcedures = XLSX.utils.json_to_sheet(formattedProceduresData);
    // const wsActivities = XLSX.utils.json_to_sheet(formattedActivityData);

    // ใส่ worksheet เข้า workbook
    XLSX.utils.book_append_sheet(wb, wsPatients, "Patients");
    XLSX.utils.book_append_sheet(wb, wsProcedures, "Procedures");
    // XLSX.utils.book_append_sheet(wb, wsActivities, 'Activities');

    if (fileFormat === "csv") {
      const csvPatients = XLSX.utils.sheet_to_csv(wsPatients);
      const csvProcedures = XLSX.utils.sheet_to_csv(wsProcedures);
      // const csvActivities = XLSX.utils.sheet_to_csv(wsActivities);
      const csvData = `Patients Data:\n${csvPatients}\n\nProcedures Data:\n${csvProcedures}`;
      // const csvData = `Patients Data:\n${csvPatients}\n\nProcedures Data:\n${csvProcedures}\n\nActivities Data:\n${csvActivities}`;
      const csvLink = document.createElement("a");
      const blob = new Blob([csvData], { type: "text/csv" });
      csvLink.href = URL.createObjectURL(blob);
      csvLink.setAttribute("download", `CombinedData.csv`);
      csvLink.click();
    } else {
      XLSX.writeFile(wb, `CombinedData.${fileFormat}`);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.reportContainer}>
        <View style={styles.reportContent}>
          <Text style={{ fontSize: 16 }}>Save As : </Text>
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
            style={styles.downloadButton}
            onPress={handleDownload}
          >
            <AntDesign name="download" size={16} color="white" />
            <Text style={styles.downloadText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: "#2196F3", // สีฟ้า
    padding: 5,
    borderRadius: 16,
    marginLeft: 20,
  },
  downloadText: {
    marginLeft: 5, // เพิ่มระยะห่างระหว่างไอคอนกับข้อความ
    marginRight: 10,
    color: "white", // สีข้อความเป็นสีขาว
  },
  pickerStyle: {
    textAlign: "center", // ปรับแต่งให้ข้อความอยู่ตรงกลาง
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
});
export default ReportScreen;
