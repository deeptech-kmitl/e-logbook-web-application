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
import { useSelector } from "react-redux";
import { db, auth, storage } from "../../data/firebaseDB";
import {
  getDocs,
  addDoc,
  collection,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesome, AntDesign } from "@expo/vector-icons";
import SubHeader from "../../component/SubHeader";

function AddOpdScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [mainDiagnosis, setMainDiagnosis] = useState(""); // ใช้ TextInput สำหรับ Main Diagnosis
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([{}]); // เก็บโรคที่เลือกทั้งหมด
  const [mainDiagnoses, setMainDiagnoses] = useState([]); // เก็บรายชื่อโรค
  const [otherDiagnosis, setOtherDiagnosis] = useState(""); // ใช้ TextInput สำหรับโรคอื่นๆ
  const [isOtherSelected, setIsOtherSelected] = useState(false); // ตัวแปรสำหรับตรวจสอบว่าเลือก Other หรือไม่

  const [hn, setHN] = useState(""); // HN
  const [hnYear, setHNYear] = useState(""); // ปีพ.ศ.
  const [coMorbid, setCoMorbid] = useState(""); // Co-Morbid Diagnosis
  const [note, setNote] = useState(""); // Note
  const status = "pending"; // Status
  const patientType = "outpatient"; // Patient Type
  const [createBy_id, setCreateById] = useState(null); // User ID
  const [professorId, setProfessorId] = useState(null); // สถานะสำหรับเก็บ id ของอาจารย์ที่ถูกเลือก
  const [professorName, setProfessorName] = useState(null); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]); // สถานะสำหรับเก็บรายการอาจารย์ทั้งหมด
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");

  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const subject = useSelector((state) => state.subject);

  const hours = Array.from({ length: 24 }, (_, i) => ({
    key: i.toString(),
    value: i.toString(),
  }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    key: i.toString(),
    value: i.toString(),
  }));

  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateLayout);
    return () => Dimensions.removeEventListener("change", updateLayout);
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
    // Check if the uploaded file is a PDF
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
      const storageRef = ref(storage, "pdfs/" + pdfFile.name);
      await uploadBytes(storageRef, pdfFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading PDF to Firebase Storage:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PDF");
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

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const teacherRef = collection(db, "users");
        const q = query(teacherRef, where("role", "==", "teacher")); // ใช้ query และ where ในการ filter

        const querySnapshot = await getDocs(q); // ใช้ query ที่ถูก filter ในการ getDocs

        const teacherArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          teacherArray.push({ key: doc.id, value: data.displayName });
        });

        setTeachers(teacherArray); // ตั้งค่ารายการอาจารย์
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    }

    fetchTeachers(); // เรียกฟังก์ชันเพื่อดึงข้อมูลอาจารย์
  }, []);

  const saveDataToFirestore = async () => {
    try {
      if (selectedDiagnosis.length === 0 || selectedDiagnosis.some(diagnosis => !diagnosis.value)) {
        alert("โปรดเลือก Co-Morbid Diagnosis");
        return;
      }

      if (!mainDiagnosis && !otherDiagnosis) {
        alert("โปรดกรอก Main Diagnosis หรือใส่โรคอื่นๆ");
        return;
      }

      if (!hn || !hnYear) {
        alert("โปรดกรอก HN และปีพ.ศ.");
        return;
      }

      // Validate hn and hnYear to be numbers and not empty
      if (isNaN(hn) || isNaN(hnYear) || hn.trim() === "" || hnYear.trim() === "") {
        alert("HN และปีพ.ศ.ต้องเป็นตัวเลขและไม่เป็นค่าว่าง");
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

      // Get the currently authenticated user
      const user = auth.currentUser;
      const uploadedPdfUrl = await uploadPdfToStorage();

      // ปรับปรุง HN และปีพ.ศ. เพื่อให้ครบ 6 หลักและ 2 หลักตามที่ต้องการ
      const formattedHN = hn.padStart(6, "0");
      const formattedHNYear = hnYear.padStart(2, "0");

      // รวม HN และปีพ.ศ. เข้าด้วยกัน
      const fullHN = formattedHNYear + formattedHN;

      // Check if a user is authenticated
      if (user) {
        const { uid } = user;
        const timestamp = Timestamp.fromDate(selectedDate);
        // Add a new document with a generated ID to a collection
        await addDoc(collection(db, "patients"), {
          admissionDate: timestamp,
          coMorbid: selectedDiagnosis.length > 0 ? selectedDiagnosis : null,
          createBy_id: uid, // User ID
          hn: fullHN, // HN
          mainDiagnosis: isOtherSelected ? otherDiagnosis : mainDiagnosis,
          note: note, // Note
          patientType: patientType,
          professorName: professorName,
          status: status,
          professorId: professorId,
          pdfUrl: uploadedPdfUrl || "",
          hours: selectedHour,
          minutes: selectedMinute,
          subject,
          lastHN: formattedHN,
          hnYear,
          // Add more fields as needed
        });

        // Clear the input fields after successfully saving data
        setHN("");
        setHNYear("");
        setSelectedDate(new Date());
        setSelectedDiagnosis([{}]);
        setCoMorbid("");
        setNote("");
        setPdfFile(null);
        setSelectedHour("");
        setSelectedMinute("");
        setMainDiagnosis("");
        setOtherDiagnosis("");
        setIsOtherSelected(false);

        // Display a success message or perform any other action
        alert("บันทึกข้อมูลสำเร็จ");
        navigation.navigate('ผู้ป่วยนอก')
      } else {
        // Handle the case when no user is authenticated
        alert("ไม่พบข้อมูลผู้ใช้");
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      // Handle errors or display an error message
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={{ marginVertical: dimensions.width < 768 ? 40 : 60 }}>
          <SubHeader text="ADD OUTPATIENT" />
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
              OPD Admission Date
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
                OPD Admission Time
              </Text>
              <View style={{ flexDirection: "row", alignItems: "left" }}>
                <SelectList
                  setSelected={setSelectedHour}
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
                value={hn}
                onChangeText={setHN}
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

        <SelectList
            setSelected={(value) => {
              if (value === "Other") {
                setIsOtherSelected(true);
                setMainDiagnosis(""); // Clear the selected diagnosis when "Other" is selected
              } else {
                setIsOtherSelected(false);
                setMainDiagnosis(value);
              }
            }}
            data={[...mainDiagnoses, { key: "Other", value: "Other" }]}
            placeholder={"Select a diagnosis"}
            boxStyles={{
              width: "auto",
              backgroundColor: "#FEF0E6",
              borderColor: "#FEF0E6",
              borderWidth: 1,
              borderRadius: 10,
            }}
            dropdownStyles={{ backgroundColor: "#FEF0E6" }}
          />
          {isOtherSelected && (
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
                value={otherDiagnosis}
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

export default AddOpdScreen;
