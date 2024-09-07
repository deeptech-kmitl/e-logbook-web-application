import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Picker,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setSubject } from "../redux/action";

import Header from "../component/Header";
import SubHeader from "../component/SubHeader";
import Footer from "../component/Footer";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../data/firebaseDB"; // ตรวจสอบว่ามีการ import db
Chart.register(ArcElement, Tooltip, Legend);

const SelectSubjectScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [caseData, setCaseData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("4");
  const [selectedSubject, setSelectedSubject] = useState("1766603");
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  const backFontSize = screenWidth < 768 ? 20 : 28;

  const years = ["4", "5", "6"];
  const subjectsByYear = {
    "4": [{ id: "1766603", name: "Family medicine clerkship" }],
    "5": [
      { id: "17666007", name: "Internal medicine clerkship" },
      { id: "17666008", name: "Surgery clerkship" },
      {
        id: "17666009",
        name: "Anesthesiology, cardiology and critical care medicine clerkship",
      },
      { id: "17666013", name: "Obstetrics and gynecology clerkship" },
      { id: "17666014", name: "Pediatric clerkship" },
      { id: "17666010", name: "Ambulatory medicine clerkship" },
      { id: "17666011", name: "Accident and emergency medicine clerkship" },
      { id: "17666012", name: "Oncology and palliative medicine clerkship" },
    ],
    "6": [
      { id: "17676002", name: "Practicum in internal medicine" },
      { id: "17676003", name: "Practicum in surgery" },
      { id: "17676004", name: "Practicum in Pediatrics" },
      { id: "17676005", name: "Practicum in Obstetrics and gynecology" },
      {
        id: "17676006",
        name: "Practicum in orthopedics and emergency medicine",
      },
      {
        id: "17676007",
        name: "Practicum in community hospital",
      },
    ],
  };

  useEffect(() => {
    fetchDataForPieChart();
  }, [selectedSubject]);

  useEffect(() => {
    // เมื่อ selectedYear เปลี่ยน ให้ตั้ง selectedSubject เป็นค่าแรกใน subjectsByYear ของ year นั้น
    const firstSubject = subjectsByYear[selectedYear][0].id;
    setSelectedSubject(firstSubject);
  }, [selectedYear]);

  const handleSubjectSelection = () => {
    const selectedSubjectData = subjectsByYear[selectedYear].find(
      (subject) => subject.id === selectedSubject
    );
    if (selectedSubjectData) {
      dispatch(setSubject(selectedSubjectData.name));
      navigation.navigate("Home");
    }
  };

  const fetchDataForPieChart = async () => {
    try {
      let collectionRefs = [
        collection(db, "patients"),
        collection(db, "activity"),
        collection(db, "procedures"),
      ];
  
      let approvedCases = 0;
      let rejectedCases = 0;
      let pendingCases = 0;
      let recheckCases = 0;
  
      // แปลง selectedSubject (id) เป็น name ของวิชา
      const selectedSubjectName = subjectsByYear[selectedYear].find(
        (subject) => subject.id === selectedSubject
      )?.name;
  
      for (const collectionRef of collectionRefs) {
        let queryField = "createBy_id";
        const queries = [where(queryField, "==", user.uid)];
        queries.push(where("subject", "==", selectedSubjectName)); // ใช้ name ของวิชาในการ Query
        const userQuerySnapshot = await getDocs(query(collectionRef, ...queries));
  
        console.log("Fetched documents from collection:", collectionRef.path);
        console.log("Document count:", userQuerySnapshot.size);
  
        userQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Document data:", data);
  
          if (data.status === "approved") {
            approvedCases++;
          } else if (data.status === "rejected") {
            rejectedCases++;
          } else if (data.status === "pending") {
            pendingCases++;
          } else if (data.status === "recheck") {
            recheckCases++;
          }
        });
      }
  
      console.log("Approved Cases:", approvedCases);
      console.log("Rejected Cases:", rejectedCases);
      console.log("Pending Cases:", pendingCases);
      console.log("Recheck Cases:", recheckCases);
  
      const data = {
        labels: ["Approved", "Rejected", "Pending", "Recheck"],
        datasets: [
          {
            data: [approvedCases, rejectedCases, pendingCases, recheckCases],
            backgroundColor: ["#2a9d8f", "#e76f51", "#e9c46a", "#7ecafc"],
          },
        ],
      };
  
      setCaseData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  
  const options = {
    maintainAspectRatio: false,
    legend: {
      display: true,
      position: "right",
    },
    tooltips: {
      enabled: true,
      callbacks: {
        label: function (tooltipItem, data) {
          const label = data.labels[tooltipItem.index];
          const value = data.datasets[0].data[tooltipItem.index];
          return `${label}: ${value}`;
        },
      },
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <Header />
          <SubHeader text="Select your subject" />

          <View style={{ alignItems: "center", marginTop: 20 }}>
            {caseData && caseData.datasets && (
              <Pie data={caseData} options={options} width={500} height={500} />
            )}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Year:</Text>
              <Picker
                selectedValue={selectedYear}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedYear(itemValue)}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={`Year ${year}`} value={year} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Subject:</Text>
              <Picker
                selectedValue={selectedSubject}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedSubject(itemValue)}
              >
                {subjectsByYear[selectedYear].map((subject) => (
                  <Picker.Item
                    key={subject.id}
                    label={subject.name}
                    value={subject.id}
                  />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleSubjectSelection}
              disabled={!selectedSubject} // disabled ถ้าไม่มี subject ที่ถูกเลือก
            >
              <Text style={styles.buttonText}>Select Subject</Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.passwordResetLink,
                { textAlign: "center", fontSize: backFontSize },
              ]}
              onPress={() => navigation.goBack()}
            >
              ◄ Back to select role
            </Text>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    marginVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 18,
    marginBottom: 5,
  },
  picker: {
    width: "80%",
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
  },
  loginButton: {
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: "#FE810E",
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
  },
  passwordResetLink: {
    marginTop: 10,
    color: "#9D5716",
  },
});

export default SelectSubjectScreen;
