import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Linking,
  Dimensions
} from "react-native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from '../../data/firebaseDB';
import { useSelector } from "react-redux";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

function OpdHistoryScreen() {
    const currentUserUid = useSelector((state) => state.user.uid);
    const currentUserRole = useSelector((state) => state.user.role);
    const [patientData, setPatientData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('approved');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
  
    const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
    
    const [professionalismScoresModalVisible, setProfessionalismScoresModalVisible] = useState(false);

    useEffect(() => {
      const updateWindowDimensions = () => {
        setWindowWidth(Dimensions.get('window').width);
      };
  
      Dimensions.addEventListener('change', updateWindowDimensions);
  
      return () => {
        Dimensions.removeEventListener('change', updateWindowDimensions);
      };
    }, []);

    const isMobile = windowWidth < 768; // ตรวจสอบว่าอุปกรณ์เป็น Mobile หรือไม่

    const styles = StyleSheet.create({
      container: {
        width: "100%",
        height: "100%",
        paddingTop: isMobile ? 10 : 20,
        flexDirection: "column",
        alignItems: "center",
      },
      buttonContainer: {
        flexDirection: 'row', // เพิ่มสไตล์นี้เพื่อให้ปุ่มอยู่ในบรรทัดเดียวกัน
        justifyContent: 'space-around', // จัดระยะห่างระหว่างปุ่มให้เท่ากัน
        width: '100%', // กำหนดขนาดความกว้างของคอนเทนเนอร์
        marginTop: 20, // ระยะห่างจากด้านล่าง
      },
      boxCard: {
        height: isMobile ? "80%" : "80%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
        width: isMobile ? "90%" : "90%", // ปรับแต่งความกว้างของ boxCard ตามอุปกรณ์
        marginLeft: isMobile ? "50" : "50",
        marginRight: isMobile ? "50" : "50",
        marginTop: isMobile ? 10 : 50,
      },
      textStyle: {
        color: 'white'
      },
      button: {
        backgroundColor: '#05AB9F',
        borderRadius: 5,
      },
      buttonApproved: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 5,
      },
      buttonRejected: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 5,
      },
      buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 24
      },
      cardContainer: {
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
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
      cardText: {
        fontSize: 16,
      },
      modalText: {
        marginBottom: 15,
        textAlign: "left",
        fontSize: 16
      },
      centerView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      },
      modalView: {
        width: 400,
        height: 400,
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        paddingTop: 35,
        paddingBottom: 35,
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
      },
      buttonClose: {
        backgroundColor: 'red',
        padding: 10,
        marginTop: 10
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        // width: '100%', // ขนาดของ container ที่มีปุ่ม
      },
      buttonViewPDF: {
        backgroundColor: "#05AB9F", // สีที่คุณต้องการ
        padding: 10,
        marginTop: 10,
        marginRight: 15
      },
      buttonProfessional: {
        backgroundColor: "blue", // สีที่คุณต้องการ
        padding: 10,
        borderRadius: 10,
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center'
      }
    });  

    const thaiMonths = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม'
    ];
  
    const formatDateToThai = (date) => {
      if (!date) return '';
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear() + 543;
        const hours = formatTimeUnit(date.getHours());
        const minutes = formatTimeUnit(date.getMinutes());
        return `${day} ${thaiMonths[month]} ${year} ${hours}:${minutes}`;
    };


    const handleCardPress = (patient) => {
      setSelectedPatient(patient);
      setModalVisible(true);
    };

    const formatTimeUnit = (unit) => unit < 10 ? `0${unit}` : unit.toString();

    const loadHistoryData = async () => {
      try {
        const patientCollectionRef = collection(db, "patients");
        const userCollectionRef = collection(db, "users"); // เพิ่มรายการนี้เพื่ออ้างอิง collection ของผู้ใช้
        const querySnapshot = await getDocs(patientCollectionRef);
        const patients = [];
      
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          
          let studentName = ''; // ตั้งค่าเริ่มต้นเป็น string ว่าง
    
          if (data.createBy_id) {
            const userDocRef = doc(userCollectionRef, data.createBy_id);
            const userDocSnapshot = await getDoc(userDocRef);
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              studentName = userData.displayName || '';
            }
          }
      
          const displayData = { ...data, studentName, id: docSnapshot.id };
    
          // ตรวจสอบว่าเป็น professor หรือไม่ และ professorId ตรงกับ currentUserUid หรือไม่
          const isProfessorRelated =
            currentUserRole === 'teacher' && data.professorId === currentUserUid;
    
          // ถ้าเป็น student ตรวจสอบ createBy_id หรือถ้าเป็น professor ตรวจสอบ professorId
          if ((data.createBy_id === currentUserUid || isProfessorRelated) && data.status === filterStatus && data.patientType === 'outpatient') {
            patients.push(displayData);
          }
        }
      
        setPatientData(patients);
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    };
  
    useEffect(() => {
      loadHistoryData();
    }, [filterStatus, currentUserUid]);

    
    
    const renderCards = () => {
      return patientData
      .filter(patient => patient.status === filterStatus && patient.patientType === 'outpatient')
      .map((patient, index) => (
          <TouchableOpacity
            style={styles.cardContainer}
            key={index}
            onPress={() => handleCardPress(patient)}
          >
            <View style={styles.card}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, lineHeight: 30 }}>
                HN : {patient.hn} ({patient.status})
              </Text>
              {currentUserRole === 'student' ? (
                <>
                <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  อาจารย์ : {patient.professorName}
                </Text>
                </>
              ) : (
                <>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    นักเรียน : {patient.studentName || "-"} {/* ใช้ || "-" เพื่อให้แสดง "-" ถ้าไม่มีข้อมูล */}
                  </Text>
                </>
              )}
              <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  <FontAwesome name="calendar" size={20} color="black" />
                  {" "} {formatDateToThai(patient.admissionDate.toDate())}
                  {patient.approvalTimestamp && (
                    <Text> (Approved: {formatDateToThai(patient.approvalTimestamp.toDate())})</Text>
                  )}
                  {patient.rejectionTimestamp && (
                    <Text> (Rejected: {formatDateToThai(patient.rejectionTimestamp.toDate())})</Text>
                  )}
              </Text>

              <View style={{ position: 'absolute', bottom: 5, right: 5 }}>
                {patient.status === 'approved' && <Ionicons name="checkmark-circle" size={36} color="green" />}
                {patient.status === 'rejected' && <Ionicons name="close-circle" size={36} color="red" />}
                {/* {patient.status === 'pending' && <MaterialIcons name="pending" size={24} color="black" />} */}
              </View>
            </View>
          </TouchableOpacity>
        ));
    };
  
    return (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => setFilterStatus('approved')} style={styles.buttonApproved}>
            <Text style={styles.buttonText}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterStatus('rejected')} style={styles.buttonRejected}>
            <Text style={styles.buttonText}>Rejected</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.boxCard}>
          <ScrollView>
            {renderCards()}
          </ScrollView>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
      }}
    >
      <View style={styles.centerView}>
          <View style={styles.modalView}>
            <ScrollView>
            {selectedPatient && (
              <>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>วันที่รับผู้ป่วย : </Text>
                  {formatDateToThai(selectedPatient.admissionDate.toDate())}
                  {selectedPatient.hours !== '' && selectedPatient.minutes !== '' && (
                    <>
                      <Text style={{ fontWeight: "bold" }}> เวลา </Text>
                      {formatTimeUnit(selectedPatient.hours)}:{formatTimeUnit(selectedPatient.minutes)}
                    </>
                  )}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>อาจารย์ผู้รับผิดชอบ : </Text> {selectedPatient.professorName}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>HN :</Text> {selectedPatient.hn || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Main Diagnosis : </Text> 
                  {selectedPatient.mainDiagnosis || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Co - Morbid Diseases : </Text> 
                  {selectedPatient.coMorbid.map(diagnosis => diagnosis.value).join(', ')}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Note/Reflection : </Text> {selectedPatient.note || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Rating : </Text>
                  {selectedPatient.rating || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold"}}>***ความคิดเห็นของอาจารย์ : </Text>
                  {selectedPatient.comment || "ไม่มี"}
                </Text>
                <Pressable
                  style={[styles.button, styles.buttonProfessional]}
                  onPress={() => setProfessionalismScoresModalVisible(true)}
                >
                  <Text style={styles.textStyle}>ดูคะแนนความเป็นมืออาชีพ</Text>
                </Pressable>

                <View style={styles.buttonRow}>
              {selectedPatient.pdfUrl && (
                <Pressable
                  style={[styles.button, styles.buttonViewPDF]}
                  onPress={() => Linking.openURL(selectedPatient.pdfUrl)}
                >
                  <Text style={styles.textStyle}>ดูไฟล์ PDF</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>ปิดหน้าต่าง</Text>
              </Pressable>
            </View>

            {/* Modal สำหรับแสดงคะแนนความเป็นมืออาชีพ */}
                  <Modal
                    animationType="slide"
                    transparent={true}
                    visible={professionalismScoresModalVisible}
                    onRequestClose={() => {
                      setProfessionalismScoresModalVisible(!professionalismScoresModalVisible);
                    }}
                  >
                    <View style={styles.centerView}>
                      <View style={styles.modalView}>
                        <Text style={{ fontWeight: "bold", fontSize: 28, marginBottom: 10 }}>คะแนนความเป็นมืออาชีพ</Text>
                          <Text style={styles.modalText}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>ตรงต่อเวลา : </Text>
                            {selectedPatient.professionalismScores.punctual ? '✔️' : '❌'}
                          </Text>
                          <Text style={styles.modalText}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>การแต่งกายเหมาะสม : </Text>
                            {selectedPatient.professionalismScores.appropriatelyDressed ? '✔️' : '❌'}
                          </Text>
                          <Text style={styles.modalText}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>เคารพผู้ป่วย : </Text>
                            {selectedPatient.professionalismScores.respectsPatients ? '✔️' : '❌'}
                          </Text>
                          <Text style={styles.modalText}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>เป็นผู้ฟังที่ดี : </Text>
                            {selectedPatient.professionalismScores.goodListener ? '✔️' : '❌'}
                          </Text>
                          <Text style={styles.modalText}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>ให้เกียรติเพื่อนร่วมงาน : </Text>
                            {selectedPatient.professionalismScores.respectsColleagues ? '✔️' : '❌'}
                          </Text>
                          <Text style={styles.modalText}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>บันทึกข้อมูลผู้ป่วยอย่างถูกต้อง : </Text>
                            {selectedPatient.professionalismScores.accurateRecordKeeping ? '✔️' : '❌'}
                          </Text>

                        <Pressable
                          style={[styles.button, styles.buttonClose]}
                          onPress={() => setProfessionalismScoresModalVisible(!professionalismScoresModalVisible)}
                        >
                          <Text style={styles.textStyle}>ปิดหน้าต่าง</Text>
                        </Pressable>
                        
                      </View>
                    </View>
                  </Modal>
          </>
        )}
        </ScrollView>
      </View>
    </View>
  </Modal>
      </View>
    );
  }

export default OpdHistoryScreen;