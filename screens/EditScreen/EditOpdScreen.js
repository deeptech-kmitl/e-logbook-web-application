import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db, auth, storage } from "../../data/firebaseDB";
import {
  getDocs,
  addDoc,
  collection,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import SubHeader from "../../component/SubHeader";

function EditOpdScreen({ route, navigation }) {
  const { patientData } = route.params;

  const [selectedDate, setSelectedDate] = useState(
    patientData.admissionDate.toDate()
  );
  const [mainDiagnosis, setMainDiagnosis] = useState(
    patientData.mainDiagnosis || []
  );
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(
    patientData.coMorbid || []
  );
  const [hn, setHN] = useState(patientData.hn);
  const [hnYear, setHNYear] = useState(patientData.hnYear);
  const [lastHN, setLastHN] = useState(patientData.lastHN);
  const [note, setNote] = useState(patientData.note);
  const [selectedHour, setSelectedHour] = useState(
    patientData.hours.toString()
  );
  const [selectedMinute, setSelectedMinute] = useState(
    patientData.minutes.toString()
  );
  const [professorName, setProfessorName] = useState(patientData.professorName); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [professorId, setProfessorId] = useState(patientData.professorId);
  const [mainDiagnoses, setMainDiagnoses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(patientData.pdfUrl);
  const [isFocused, setIsFocused] = useState(false);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [otherDiagnosis, setOtherDiagnosis] = useState("");

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const hours = Array.from({ length: 24 }, (_, i) => ({
    key: i.toString(),
    value: i.toString(),
  }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    key: i.toString(),
    value: i.toString(),
  }));

  useEffect(() => {
    console.log("Loaded data:", patientData);
  }, [patientData]);
  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateLayout);
    return () => Dimensions.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const diagnoses = await fetchMainDiagnoses();
      setMainDiagnoses(diagnoses);

      const teachers = await fetchTeachers();
      setTeachers(teachers);
    }

    fetchData();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: "#fff",
      alignItems: "left",
      justifyContent: "left",
      paddingHorizontal: dimensions.width < 768 ? 10 : 30,
    },
  });

  const fetchMainDiagnoses = async () => {
    try {
      const mainDiagnosisDocRef = doc(
        db,
        "mainDiagnosis",
        "LcvLDMSEraOH9zH4fbmS"
      );
      const docSnap = await getDoc(mainDiagnosisDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const diagnoses = data.diseases.map((disease, index) => ({
          key: `${(index + 1).toString().padStart(3, "0")} | ${disease}`, // ปรับแก้ที่นี่เพื่อให้ key เป็นชื่อโรคด้วย
          value: `${(index + 1).toString().padStart(3, "0")} | ${disease}`,
        }));

        diagnoses.sort((a, b) => a.value.localeCompare(b.value));

        setMainDiagnoses(diagnoses);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching main diagnoses:", error);
    }
  };

  useEffect(() => {
    fetchMainDiagnoses();
  }, []);

  const fetchTeachers = async () => {
    const teacherRef = collection(db, "users");
    const q = query(teacherRef, where("role", "==", "teacher"));
    const teacherSnapshot = await getDocs(q);
    return teacherSnapshot.docs.map((doc) => ({
      key: doc.id,
      value: doc.data().displayName,
    }));
  };

  const saveDataToFirestore = async () => {
    try {
      if (!mainDiagnosis && !otherDiagnosis) {
        alert("โปรดกรอก Main Diagnosis หรือใส่โรคอื่นๆ");
        return;
      }

      if (!hn || !hnYear) {
        alert("โปรดกรอก HN และปีพ.ศ.");
        return;
      }

      if (!selectedDate) {
        alert("โปรดเลือกวันที่รับผู้ป่วย");
        return;
      }

      if (!professorName) {
        alert("โปรดเลือกอาจารย์");
        return;
      }

      // ปรับปรุง HN และปีพ.ศ. เพื่อให้ครบ 6 หลักและ 2 หลักตามที่ต้องการ
      const formattedHN = lastHN.padStart(6, "0");
      const formattedHNYear = hnYear.padStart(2, "0");

      // รวม HN และปีพ.ศ. เข้าด้วยกัน
      const fullHN = formattedHNYear + formattedHN;

      let uploadedPdfUrl = pdfUrl;
      if (pdfFile && typeof pdfFile === "object") {
        uploadedPdfUrl = await uploadPdfToStorage();
      }

      const patientDocRef = doc(db, "patients", patientData.id);
      const patientDocSnapshot = await getDoc(patientDocRef);

      if (patientDocSnapshot.exists()) {
        const patientData = patientDocSnapshot.data();

        if (patientData.status === "recheck") {
          await updateDoc(patientDocRef, {
            admissionDate: Timestamp.fromDate(new Date(selectedDate)),
            coMorbid: selectedDiagnosis,
            hn: fullHN,
            mainDiagnosis: isOtherSelected ? otherDiagnosis : mainDiagnosis,
            note,
            professorId,
            professorName: teachers.find((t) => t.key === professorId)?.value,
            hours: parseInt(selectedHour),
            minutes: parseInt(selectedMinute),
            pdfUrl: uploadedPdfUrl,
            isEdited: true,
          });

          alert("อัปเดตข้อมูลสำเร็จ");
        } else if (
          patientData.status === "pending" ||
          patientData.status === "rejected"
        ) {
          await updateDoc(patientDocRef, {
            admissionDate: Timestamp.fromDate(new Date(selectedDate)),
            coMorbid: selectedDiagnosis,
            hn: fullHN,
            mainDiagnosis: isOtherSelected ? otherDiagnosis : mainDiagnosis,
            note,
            professorId,
            professorName: teachers.find((t) => t.key === professorId)?.value,
            hours: parseInt(selectedHour),
            minutes: parseInt(selectedMinute),
            pdfUrl: uploadedPdfUrl,
            lastHN: formattedHN,
            hnYear,
          });

          alert("อัปเดตข้อมูลสำเร็จ");
        } else {
          alert("ไม่สามารถอัปเดตข้อมูลได้");
        }
      } else {
        alert("ไม่สามารถอัปเดตข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const DateInput = () => {
    if (Platform.OS === "web") {
      return (
        <input
          type="date"
          style={{
            marginTop: 5,
            padding: 10,
            fontSize: 16,
            width: "95%",
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
          }}
          value={selectedDate.toISOString().substr(0, 10)}
          onChange={(event) => setSelectedDate(new Date(event.target.value))}
        />
      );
    } else {
      return (
        <>
          <Button onPress={showDatepicker} title="Show date picker!" />
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={"date"}
              is24Hour={true}
              display="default"
              onChange={onChange}
            />
          )}
        </>
      );
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles[0].type !== "application/pdf") {
      alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF");
      return;
    }
    setPdfFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "application/pdf",
  });

  const uploadPdfToStorage = async () => {
    if (!pdfFile) return null;

    try {
      const storageRef = ref(storage, `pdfs/${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading PDF to Firebase Storage:", error);
      return null;
    }
  };

  const onSelectTeacher = (selectedTeacherId) => {
    const selectedTeacher = teachers.find(
      (teacher) => teacher.key === selectedTeacherId
    );
    // console.log(selectedTeacher)
    if (selectedTeacher) {
      setProfessorName(selectedTeacher.value);
      setProfessorId(selectedTeacher.key);
    } else {
      console.error("Teacher not found:", selectedTeacherId);
    }
  };

  const addDiagnosis = () => {
    setSelectedDiagnosis([...selectedDiagnosis, {}]);
  };

  const removeDiagnosis = (index) => {
    const newDiagnosis = [...selectedDiagnosis];
    newDiagnosis.splice(index, 1);
    setSelectedDiagnosis(newDiagnosis);
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={{ marginVertical: windowWidth.width < 768 ? 40 : 60 }}>
          <SubHeader text="EDIT OUTPATIENT" />
        </View>

        <View
          style={{
            flexDirection: dimensions.width < 768 ? "column" : "row",
            alignItems: "left",
            marginBottom: 16,
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: dimensions.width < 768 ? "100%" : "45%" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 400,
                marginVertical: 8,
                textAlign: "left",
              }}
            >
              Opd Admission Date
            </Text>
            <DateInput />
          </View>
          <View
            style={{
              width: dimensions.width < 768 ? "100%" : "45%",
              flexDirection: "row",
              justifyContent: "left",
              alignItems: "left",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 400,
                  marginVertical: 8,
                  textAlign: "left",
                }}
              >
                Opd Admission Time
              </Text>
              <View style={{ flexDirection: "row", alignItems: "left" }}>
                <SelectList
                  setSelected={setSelectedHour}
                  defaultOption={{ key: selectedHour, value: selectedHour }}
                  data={hours}
                  placeholder="Hours"
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
                <Text style={{ marginHorizontal: 5, alignSelf: "center" }}>
                  :
                </Text>
                <SelectList
                  setSelected={setSelectedMinute}
                  defaultOption={{ key: selectedMinute, value: selectedMinute }}
                  data={minutes}
                  placeholder="Minutes"
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
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: dimensions.width < 768 ? "column" : "row",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View style={{ width: dimensions.width < 768 ? "100%" : "45%" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 400,
                marginVertical: 8,
                textAlign: "left",
                alignItems: "flex-start",
              }}
            >
              HN
            </Text>
            <View
              style={{
                flexDirection: "row",
                borderColor: "#FEF0E6",
                borderWidth: 1,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TextInput
                placeholder="6-digit HN"
                placeholderTextColor="grey"
                value={lastHN}
                onChangeText={setLastHN}
                keyboardType="numeric"
                maxLength={6}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 20,
                  backgroundColor: "#FEF0E6",
                }}
              />
              <Text style={{ marginHorizontal: 5 }}>/</Text>
              <TextInput
                placeholder="YY"
                placeholderTextColor="grey"
                value={hnYear}
                onChangeText={setHNYear}
                keyboardType="numeric"
                maxLength={2}
                style={{
                  width: 60,
                  textAlign: "center",
                  fontSize: 20,
                  backgroundColor: "#FEF0E6",
                }}
              />
            </View>
          </View>

          <View style={{ width: dimensions.width < 768 ? "100%" : "45%" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 400,
                marginVertical: 8,
                textAlign: "left",
                alignItems: "flex-start",
              }}
            >
              Instructor
            </Text>
            <SelectList
              setSelected={onSelectTeacher}
              defaultOption={{ key: professorId, value: professorName }}
              data={teachers}
              placeholder={"Select the instructor name"}
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

        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: "left",
            }}
          >
            Main Diagnosis (ถ้าไม่มีตัวเลือก ให้เลือก Other)
          </Text>
        </View>

        {isOtherSelected ? (
          <View
            style={{
              height: 48,
              borderColor: "#FEF0E6",
              borderWidth: 1,
              borderRadius: 10,
              alignItems: "left",
              justifyContent: "left",
              marginVertical: 8,
            }}
          >
            <TextInput
              placeholder="Fill the main diagnosis"
              placeholderTextColor="grey"
              value={otherDiagnosis} // Display otherDiagnosis value here
              onChangeText={setOtherDiagnosis}
              style={{
                width: "100%",
                textAlign: "center",
                height: "100%",
                fontSize: 20,
                backgroundColor: "#FEF0E6",
              }}
            />
          </View>
        ) : (
          <SelectList
            setSelected={(value) => {
              if (value === "Other") {
                setIsOtherSelected(true);
                setMainDiagnosis(""); // เปลี่ยนเป็น string และกำหนดให้เป็นค่าว่างเมื่อเลือก Other
              } else {
                setIsOtherSelected(false);
                setMainDiagnosis(value); // เปลี่ยนค่า mainDiagnosis เมื่อเลือก diagnosis อื่น
              }
            }}
            data={[...mainDiagnoses, { key: "Other", value: "Other" }]}
            placeholder={"Select a diagnosis"}
            defaultOption={{ key: mainDiagnosis, value: mainDiagnosis }} // กำหนด defaultOption ให้เป็นค่า mainDiagnosis ปัจจุบัน
            boxStyles={{
              width: "auto",
              backgroundColor: "#FEF0E6",
              borderColor: "#FEF0E6",
              borderWidth: 1,
              borderRadius: 10,
            }}
            dropdownStyles={{ backgroundColor: "#FEF0E6" }}
          />
        )}

        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: "left",
            }}
          >
            Co-Morbid Diagnosis
          </Text>
        </View>
        {selectedDiagnosis.map((diagnosis, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <SelectList
                setSelected={(value) => {
                  const newDiagnoses = [...selectedDiagnosis];
                  newDiagnoses[index] = { value: value };
                  setSelectedDiagnosis(newDiagnoses);
                }}
                data={mainDiagnoses}
                placeholder={"Select a diagnosis"}
                boxStyles={{
                  width: "auto",
                  backgroundColor: "#FEF0E6",
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                }}
                dropdownStyles={{ backgroundColor: "#FEF0E6" }}
                defaultOption={
                  diagnosis.value
                    ? { key: diagnosis.value, value: diagnosis.value }
                    : null
                } // กำหนดค่าเริ่มต้นโดยใช้โครงสร้าง key-value
              />
            </View>
            {index === selectedDiagnosis.length - 1 ? (
              <TouchableOpacity
                onPress={addDiagnosis}
                style={{
                  marginLeft: 10,
                  backgroundColor: "#5F7D8E",
                  borderRadius: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 16, color: "white" }}>+ Add</Text>
              </TouchableOpacity>
            ) : null}
            {selectedDiagnosis.length > 1 ? (
              <TouchableOpacity
                onPress={() => removeDiagnosis(index)}
                style={{
                  marginLeft: 10,
                  backgroundColor: "#5F7D8E",
                  borderRadius: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 16, color: "white" }}>- Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        <View style={{ marginBottom: 16, width: "70%" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: "left",
            }}
          >
            Note / Reflection (optional)
          </Text>
          <View
            style={{
              height: 260,
              borderColor: "#FEF0E6",
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: "#FEF0E6",
            }}
          >
            <TextInput
              placeholder={isFocused ? "" : "Fill a note/reflection"}
              placeholderTextColor="grey"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(note.length > 0)}
              value={note}
              onChangeText={setNote}
              multiline
              style={{
                width: "100%",
                height: "100%",
                textAlign: "left", // ตั้งค่าให้ข้อความจัดชิดซ้าย
                textAlignVertical: "top", // ตั้งค่าให้ข้อความเริ่มที่บน
                paddingTop: 8, // พิจารณาเพิ่ม padding ด้านบน
                paddingLeft: 8, // พิจารณาเพิ่ม padding ด้านซ้าย
                fontSize: 20,
              }}
            ></TextInput>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: "left",
            }}
          >
            Upload File ( Unable to support files larger than 5 MB.) (Optinal)
          </Text>
          <View
            {...getRootProps({ className: "dropzone" })}
            style={{
              height: 50,
              borderColor: "gray",
              borderWidth: 1,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <input {...getInputProps()} />
            <FontAwesome name="upload" size={24} color="black" />
            <Text style={{ marginLeft: 10 }}>
              {pdfFile ? pdfFile.name : "Import PDF only."}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "10%",
          }}
        >
          <TouchableOpacity
            onPress={saveDataToFirestore}
            style={{
              height: 48,
              width: 120,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#008000",
              borderRadius: 30,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              marginRight: 20,
            }}
          >
            <Text style={{ fontSize: 20, color: "white" }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              height: 48,
              width: 120,
              marginRight: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "grey",
              borderRadius: 30,
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
            <Text style={{ fontSize: 20, color: "white" }}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default EditOpdScreen;
