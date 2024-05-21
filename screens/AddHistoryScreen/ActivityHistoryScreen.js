import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Image,
  Linking,
  Dimensions
} from "react-native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from '../../data/firebaseDB';
import { useSelector } from "react-redux";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

function ActivityHistoryScreen() {
    const currentUserUid = useSelector((state) => state.user.uid);
    const currentUserRole = useSelector((state) => state.user.role);
    const [activityData, setActivityData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('approved');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

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
      textStyle: {
        color: 'white'
      },
      boxCard: {
        height: isMobile ? "80%" : "80%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
        width: isMobile ? "90%" : "90%", // ปรับแต่งความกว้างของ boxCard ตามอุปกรณ์
        marginLeft: isMobile ? "50" : "50",
        marginRight: isMobile ? "50" : "50",
        marginTop: isMobile ? 10 : 50,
      },
      buttonCancel: {
        backgroundColor: 'red'
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
        textAlign: "center",
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
      },
      buttonClose: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 10,
        elevation: 2,
        alignSelf: 'center',
        marginTop: 10,
      },
      modalImageView: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxWidth: '90%',
        maxHeight: '80%'
      },
      buttonViewImages: {
        backgroundColor: "blue", // สีที่คุณต้องการ
        padding: 10,
        borderRadius: 10,
        marginTop: 10,
        marginRight: 15
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // ขนาดของ container ที่มีปุ่ม
      },
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

    const handleCardPress = (activity) => {
      setSelectedActivity(activity);
      setModalVisible(true);
    };

    const viewImages = () => {
      setImageModalVisible(true);
    }

    const loadHistoryData = async () => {
      try {
        const activityCollectionRef = collection(db, "activity");
        const userCollectionRef = collection(db, "users"); // เพิ่มรายการนี้เพื่ออ้างอิง collection ของผู้ใช้
        const querySnapshot = await getDocs(activityCollectionRef);
        const activities = [];
      
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
          if ((data.createBy_id === currentUserUid || isProfessorRelated) && data.status === filterStatus) {
            activities.push(displayData);
          }
        }
      
        setActivityData(activities);
      } catch (error) {
        console.error("Error fetching activity data:", error);
      }
    };
  
    const formatTimeUnit = (unit) => unit < 10 ? `0${unit}` : unit.toString();

    useEffect(() => {
      loadHistoryData();
    }, [filterStatus, currentUserUid]);

    
    
    const renderCards = () => {
      return activityData
      .filter(activity => activity.status === filterStatus)
      .map((activity, index) => (
          <TouchableOpacity
            style={styles.cardContainer}
            key={index}
            onPress={() => handleCardPress(activity)}
          >
            <View style={styles.card}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 20, lineHeight: 30 }}>
                ประเภท : {activity.activityType} ({activity.status})
              </Text>
              {currentUserRole === 'student' ? (
                <>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    อาจารย์ : {activity.professorName}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                    นักเรียน : {activity.studentName || "-"} {/* ใช้ || "-" เพื่อให้แสดง "-" ถ้าไม่มีข้อมูล */}
                  </Text>
                </>
              )}
              <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                  <FontAwesome name="calendar" size={20} color="black" />
                  {" "} {formatDateToThai(activity.admissionDate.toDate())}
                  {activity.approvalTimestamp && (
                    <Text> (Approved: {formatDateToThai(activity.approvalTimestamp.toDate())})</Text>
                  )}
                  {activity.rejectionTimestamp && (
                    <Text> (Rejected: {formatDateToThai(activity.rejectionTimestamp.toDate())})</Text>
                  )}
                </Text>

              <View style={{ position: 'absolute', bottom: 5, right: 5 }}>
                {activity.status === 'approved' && <Ionicons name="checkmark-circle" size={36} color="green" />}
                {activity.status === 'rejected' && <Ionicons name="close-circle" size={36} color="red" />}
                {/* {activity.status === 'pending' && <MaterialIcons name="pending" size={24} color="black" />} */}
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
            {selectedActivity && (
              <>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>วันที่รับผู้ป่วย : </Text>
                  {formatDateToThai(selectedActivity.admissionDate.toDate())}
                  {selectedActivity.hours !== '' && selectedActivity.minutes !== '' && (
                    <>
                      <Text style={{ fontWeight: "bold" }}> เวลา </Text>
                      {formatTimeUnit(selectedActivity.hours)}:{formatTimeUnit(selectedActivity.minutes)}
                    </>
                  )}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>อาจารย์ผู้รับผิดชอบ : </Text> {selectedActivity.professorName}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>ประเภท :</Text> {selectedActivity.activityType || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Diagnosis : </Text> {selectedActivity.mainDiagnosis}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Note/Reflection : </Text> {selectedActivity.note || "ไม่มี"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>ความคิดเห็นของอาจารย์ : </Text>
                  {selectedActivity.comment || "ไม่มี"}
                </Text>
                <View style={styles.buttonRow}>
                  {selectedActivity.images && selectedActivity.images.length > 0 && (
                    <Pressable
                      onPress={viewImages}
                      style={[styles.button, styles.buttonViewImages]}
                    >
                      <Text style={styles.textStyle}>ดูรูปภาพ</Text>
                    </Pressable>
                  )}

                  <Pressable
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => setModalVisible(!modalVisible)}
                          >
                            <Text style={styles.textStyle}>ปิดหน้าต่าง</Text>
                          </Pressable>
                </View>

                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={imageModalVisible}
                  onRequestClose={() => {
                    Alert.alert("Image viewer has been closed.");
                    setImageModalVisible(!imageModalVisible);
                  }}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View style={{ width: '70%', height: '70%', backgroundColor: 'white', borderRadius: 10 }}>
                      <ScrollView>
                        {selectedActivity?.images && selectedActivity.images.map((imageUrl, index) => {
                          return (
                            <View key={index} style={{ marginBottom: 10, borderColor: '#ccc', borderWidth: 1, padding: 10, borderRadius: 5 }}>
                              <Image
                                source={{ uri: imageUrl }}
                                style={{ width: '100%', height: 200, resizeMode: 'contain', marginVertical: 10 }}
                              />
                              <Pressable
                                style={{ backgroundColor: '#2196F3', padding: 5, borderRadius: 5, marginTop: 5 }}
                                onPress={() => Linking.openURL(imageUrl)} // เปิด URL ในเบราว์เซอร์เริ่มต้น
                              >
                                <Text style={{ color: 'white', textAlign: 'center' }}>ดูลิ้งค์รูปภาพ</Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </ScrollView>
                      <Pressable
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => setImageModalVisible(!imageModalVisible)}
                      >
                        <Text style={styles.textStyle}>ปิดหน้าต่าง</Text>
                      </Pressable>
                    </View>
                  </View>
                </Modal>

              </>
            )}
          </View>
        </View>
    </Modal>
      </View>
    );
  }



export default ActivityHistoryScreen;