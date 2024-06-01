import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Picker,
  Dimensions,
  Image,
  ScrollView
} from "react-native";
import { useDispatch } from "react-redux";
import { setSubject } from "../redux/action";

import Header from "../component/Header";
import SubHeader from "../component/SubHeader";
import Footer from "../component/Footer";

const SelectSubjectScreen = ({ navigation }) => {
  const dispatch = useDispatch();

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
    ],
  };

  const handleSubjectSelection = () => {
    const selectedSubjectData = subjectsByYear[selectedYear].find(
      (subject) => subject.id === selectedSubject
    );
    if (selectedSubjectData) {
      dispatch(setSubject(selectedSubjectData.name));
      navigation.navigate("Home");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1 }}>
          <Header />
          <SubHeader text="Select your subject" />

          <Image
            source={require("../assets/bookshelf.png")}
            style={{ width: 300, height: 300, alignSelf: "center", marginTop: 20 }}
            resizeMode="contain"
          />

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
    flex: 1, // ให้ส่วนเนื้อหาขยายตามพื้นที่ที่เหลือ
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
