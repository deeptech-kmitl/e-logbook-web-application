import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  CheckBox,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
  Pressable,
  Modal
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
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import SubHeader from "../../component/SubHeader";

function EditActivityScreen({ route, navigation }) {
  const { activityData } = route.params;

  const [selectedDate, setSelectedDate] = useState(
    activityData.admissionDate.toDate()
  );

  const [selectedDate2, setSelectedDate2] = useState(
    activityData?.recordDate ? activityData.recordDate.toDate() : new Date()
  );

  const [topic, setTopic] = useState(activityData.topic);
  const [professorId, setProfessorId] = useState(activityData.professorId);
  const [professorName, setProfessorName] = useState(
    activityData.professorName
  ); // สถานะสำหรับเก็บชื่ออาจารย์ที่ถูกเลือก
  const [teachers, setTeachers] = useState([]);

  // const [patientName, setPatientName] = useState(activityData.patientName || "");

  const [activityType, setActivityType] = useState([]);
  const [selectedActivityType, setSelectedActivityType] = useState(
    activityData.activityType
  );

  const [note, setNote] = useState(activityData.note); // Note
  const status = "pending"; // Status
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedHour, setSelectedHour] = useState(
    activityData.hours.toString()
  );
  const [selectedMinute, setSelectedMinute] = useState(
    activityData.minutes.toString()
  );

  const [
    professionalismScoresModalVisible,
    setProfessionalismScoresModalVisible,
  ] = useState(false);

  const defaultScores = {
    basicKnowledge: false,
    clinicalSkills: false,
    problemIdentification: false,
    managementProblem: false,
    patientEducation: false,
    evidenceBase: false,
    ethicalManner: false,
  };

  const [professionalismScores, setProfessionalismScores] = useState({
    ...defaultScores,
    ...(activityData.professionalismScores || {}),
  });

    // ฟังก์ชันเพื่อจัดการการเปลี่ยนแปลงของ Checkbox
  const handleCheckboxChange = (scoreName) => {
    setProfessionalismScores((prevScores) => ({
      ...prevScores,
      [scoreName]: !prevScores[scoreName],
    }));
  };

  const [uploadedImages, setUploadedImages] = useState([]);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const isMobile = windowWidth < 768; // ตรวจสอบว่าอุปกรณ์เป็น Mobile หรือไม่
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // ตรวจสอบว่าอุปกรณ์เป็น Tablet หรือไม่
  const isPC = windowWidth >= 1024; // ตรวจสอบว่าอุปกรณ์เป็น PC หรือไม่

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
    uploadContainer: {
      marginBottom: 16,
    },
    uploadTitle: {
      fontSize: 20,
      fontWeight: "400",
      marginVertical: 8,
      textAlign: "left",
    },
    dropzone: {
      height: 50,
      borderColor: "gray",
      borderWidth: 1,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    uploadedFileName: {
      marginLeft: 10,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalImage: {
      width: "90%",
      height: "auto",
      marginVertical: 10,
      borderRadius: 10,
    },
    imageText: {
      fontSize: 18,
      marginTop: 10,
      textAlign: "center",
      color: "blue",
    },
    professionalismHeader: {
      fontWeight: "bold",
      fontSize: 24,
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
      fontSize: 20,
    },
    centerView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalView: {
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
      height: "auto", // Auto height for mobile
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
    },
    buttonClose: {
      backgroundColor: "green",
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: "center",
      marginTop: 10,
    },
    buttonProfessional: {
      backgroundColor: "blue", // สีที่คุณต้องการ
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      marginRight: 15,
    },
  });

  const selectImages = (event) => {
    const files = event.target.files;
    if (files) {
      const imagesArray = Array.from(files);
      setUploadedImages(imagesArray);
    }
  };

  const uploadImages = async (uploadedImages, docId) => {
    const storageURLs = [];
    const uploadPromises = uploadedImages.map(async (image) => {
      const imageRef = ref(storage, `activity_images/${docId}/${image.name}`);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      storageURLs.push(downloadURL);
    });

    await Promise.all(uploadPromises);
    return storageURLs;
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

  const DateInput2 = () => {
    if (Platform.OS === "web") {
      return (
        <input
          type="date"
          disabled
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
          value={selectedDate2.toISOString().substr(0, 10)}
          onChange={(event) => setSelectedDate2(new Date(event.target.value))}
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
              disabled
            />
          )}
        </>
      );
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

  useEffect(() => {
    async function fetchActivityType() {
      try {
        const activityTypeRef = collection(db, "activity_type");
        const querySnapshot = await getDocs(activityTypeRef);

        const activityArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          data.activityType.forEach((activity) => {
            activityArray.push({ key: activity, value: activity });
          });
        });

        setActivityType(activityArray);
      } catch (error) {
        console.error("Error fetching activity:", error);
      }
    }

    fetchActivityType();
  }, []);

  const saveDataToFirestore = async () => {
    try {
      if (!topic) {
        alert("โปรดกรอกหัวข้อที่เรียนรู้");
        return;
      }

      if (!selectedActivityType) {
        alert("โปรดเลือกประเภท");
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

      // if (uploadedImages.length === 0) {
      //   alert("กรุณาเลือกรูปภาพก่อนทำการบันทึก");
      //   return;
      // }
      // Get the currently authenticated user
      const user = auth.currentUser;
      if (!user) {
        alert("ไม่พบข้อมูลผู้ใช้");
        return;
      }

      // Step 1: Save patient data (excluding images) and retrieve the Document ID
      const activityDocRef = doc(db, "activity", activityData.id);
      const activityDocSnapshot = await getDoc(activityDocRef);

      if (activityDocSnapshot.exists()) {
        const activityData = activityDocSnapshot.data();

        if (activityData.status === "recheck") {
          await updateDoc(activityDocRef, {
            admissionDate: Timestamp.fromDate(new Date(selectedDate)),
            activityType: selectedActivityType, // Activity
            createBy_id: user.uid, // User ID
            topic: topic,
            note: note, // Note
            professorName: teachers.find((t) => t.key === professorId)?.value,
            professorId: professorId,
            images:
              uploadedImages.length > 0
                ? await uploadImages(uploadedImages, activityData.id)
                : activityData.images, // We'll store the image URLs in the next step
            hours: parseInt(selectedHour),
            minutes: parseInt(selectedMinute),
            isEdited: true,
            professionalismScores: professionalismScores,
          });

          alert("อัปเดตข้อมูลสำเร็จ");
        } else if (
          activityData.status === "pending" ||
          activityData.status === "rejected"
        ) {
          await updateDoc(activityDocRef, {
            admissionDate: Timestamp.fromDate(new Date(selectedDate)),
            activityType: selectedActivityType, // Activity
            createBy_id: user.uid, // User ID
            topic: topic,
            note: note, // Note
            professorName: teachers.find((t) => t.key === professorId)?.value,
            professorId: professorId,
            images:
              uploadedImages.length > 0
                ? await uploadImages(uploadedImages, activityData.id)
                : activityData.images, // We'll store the image URLs in the next step
            hours: parseInt(selectedHour),
            minutes: parseInt(selectedMinute),
            professionalismScores: professionalismScores,
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

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={{ marginVertical: dimensions.width < 768 ? 40 : 60 }}>
          <SubHeader text="EDIT ACTIVITY" />
        </View>

        <View
          style={{
            flexDirection: dimensions.width < 768 ? "column" : "row",
            alignItems: "left",
            marginBottom: 8,
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
              วันที่บันทึกข้อมูล
            </Text>
            <DateInput2 />
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
              
            </View>
          </View>
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
              Activity Date
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
                Activity Time
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
              }}
            >
              Activity Type
            </Text>
            <SelectList
              setSelected={setSelectedActivityType}
              defaultOption={{
                key: selectedActivityType,
                value: selectedActivityType,
              }}
              data={activityType}
              placeholder={"Select activity type"}
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

        <View style={{ marginBottom: 16, width: "70%" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 400,
              marginVertical: 8,
              textAlign: "left",
            }}
          >
            Topic
          </Text>

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
                placeholder="Fill the topic"
                placeholderTextColor="grey"
                value={topic} // Display otherDiagnosis value here
                onChangeText={setTopic}
                style={{
                  width: "100%",
                  textAlign: "center",
                  height: "100%",
                  fontSize: 20,
                  backgroundColor: "#FEF0E6",
                }}
              />
            </View>
        </View>

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

        <View style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "10%",
          }}>
          <Pressable
            style={[styles.button, styles.buttonProfessional]}
            onPress={() =>
              setProfessionalismScoresModalVisible(true)
            }
            >
            <Text style={styles.textStyle}>
              Professionalism Score
            </Text>
          </Pressable>
        </View>

        {/* UI for image upload */}
        <View style={styles.uploadContainer}>
          <Text style={styles.uploadTitle}>
            Upload Image ( Unable to support files larger than 5 MB.) (Optional)
          </Text>
          <View style={styles.dropzone}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={selectImages}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20%",
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

          {/* Modal สำหรับแสดงคะแนนความเป็นมืออาชีพ */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={
                      professionalismScoresModalVisible 
                    }
                    onRequestClose={() => {
                      setProfessionalismScoresModalVisible(
                        !professionalismScoresModalVisible
                      );
                    }}
                  >
                    <View style={styles.centerView}>
                      <View style={styles.modalView}>

                        <Text style={styles.professionalismHeader}>
                            Professionalism
                          </Text>{" "}
                          (เลือกได้หลายตัวเลือก)
                          {/* แสดง Checkbox และ Label */}

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.basicKnowledge}
                                onValueChange={() =>
                                  handleCheckboxChange("basicKnowledge")
                                }
                              />
                              <Text style={styles.checkboxLabel}>Basic knowledge/basic science</Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.clinicalSkills
                                }
                                onValueChange={() =>
                                  handleCheckboxChange("clinicalSkills")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Clinical skills (history taking and physical examination)
                              </Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.problemIdentification}
                                onValueChange={() =>
                                  handleCheckboxChange("problemIdentification")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Problem identification and approaching
                              </Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.managementProblem}
                                onValueChange={() =>
                                  handleCheckboxChange("managementProblem")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Management/Problem solving
                              </Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={professionalismScores.patientEducation}
                                onValueChange={() =>
                                  handleCheckboxChange("patientEducation")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Patient education
                              </Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.evidenceBase
                                }
                                onValueChange={() =>
                                  handleCheckboxChange("evidenceBase")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Evidence-based medicine
                              </Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                              <CheckBox
                                value={
                                  professionalismScores.ethicalManner
                                }
                                onValueChange={() =>
                                  handleCheckboxChange("ethicalManner")
                                }
                              />
                              <Text style={styles.checkboxLabel}>
                              Ethical and manner issues
                              </Text>
                            </View>

                        <Pressable
                          style={[styles.button, styles.buttonClose]}
                          onPress={() =>
                            setProfessionalismScoresModalVisible(
                              !professionalismScoresModalVisible
                            )
                          }
                        >
                          <Text style={styles.textStyle}>Confirm</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Modal>

        </View>
      </View>
    </ScrollView>
  );
}

export default EditActivityScreen;
