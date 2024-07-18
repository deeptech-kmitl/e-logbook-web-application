import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { deleteUser, updateProfile, updateEmail } from "firebase/auth";
import { db } from "../../data/firebaseDB";
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";

function UserManagementScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [userData, setUserData] = useState([]); // state เก็บข้อมูลผู้ใช้ทั้งหมด
  const [filteredUserData, setFilteredUserData] = useState([]); // state เก็บข้อมูลผู้ใช้ที่ผ่านการกรอง
  const [loading, setLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");

  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");

  const [selectedRole, setSelectedRole] = useState("");

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [windowHeight, setWindowHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLandscape, setIsLandscape] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024; // ตรวจสอบว่าอุปกรณ์เป็น Tablet หรือไม่

  const [searchText, setSearchText] = useState("");
  const [unfilteredUserData, setUnfilteredUserData] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("student");
  const statusOptions = [
    { key: "student", value: "Student" },
    { key: "teacher", value: "Teacher" },
  ];

  const updateWindowDimensions = () => {
    setWindowWidth(Dimensions.get("window").width);
    setWindowHeight(Dimensions.get("window").height);
  };

  useEffect(() => {
    updateWindowDimensions();
    Dimensions.addEventListener("change", updateWindowDimensions);

    return () => {
      Dimensions.removeEventListener("change", updateWindowDimensions);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData(); // ตรวจสอบว่ามีการเรียกใช้งาน loadUserData ใน useEffect อยู่
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const updateLayout = () => {
      const windowWidth = Dimensions.get("window").width;
      const windowHeight = Dimensions.get("window").height;
      setIsLandscape(windowWidth > windowHeight);
    };

    updateLayout();

    Dimensions.addEventListener("change", updateLayout);

    return () => {
      Dimensions.removeEventListener("change", updateLayout);
    };
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateLayout);
    return () => Dimensions.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setDisplayName(selectedUser.displayName);
      setOriginalDisplayName(selectedUser.displayName);
      setEmail(selectedUser.email);
      setOriginalEmail(selectedUser.email);
    }
  }, [selectedUser]);

  const handleCancelUpdate = () => {
    setDisplayName(originalDisplayName);
    setEmail(originalEmail);
    setModalEditVisible(false);
  };

  const handleCardPress = (user) => {
    console.log(selectedUser)
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setModalEditVisible(true);
  };

  const loadUserData = async () => {
    try {
      const userCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(userCollectionRef);
      const users = [];

      querySnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        userData.id = docSnapshot.id; // กำหนด id ให้กับข้อมูลผู้ใช้
        users.push(userData);
      });

      // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไปใช้งาน
      setUserData(users);
      console.log(users);
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error; // ส่ง error กลับไปให้ caller จัดการต่อไป
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const handleSearch = (text) => {
    const searchText = text.toLowerCase();

    // ตรวจสอบว่าถ้าไม่มีการค้นหา (text ว่าง) ให้แสดงทุกรายชื่อ
    if (!searchText.trim()) {
      setFilteredUserData(unfilteredUserData); // ใช้ข้อมูลทั้งหมดโดยไม่กรองเมื่อไม่มีการค้นหา
      return;
    }

    const filteredUsers = unfilteredUserData.filter(
      (user) =>
        user.displayName && user.displayName.toLowerCase().includes(searchText)
    );

    setFilteredUserData(filteredUsers);
  };

  useEffect(() => {
    // ตั้งค่าข้อมูลทั้งหมดของผู้ใช้เมื่อคอมโพเนนต์โหลด
    setUnfilteredUserData(userData);
  }, [userData]); // ให้ useEffect ทำงานเมื่อ patientData เปลี่ยน

  useEffect(() => {
    // เรียก handleSearch เมื่อ searchText เปลี่ยน
    handleSearch(searchText);
  }, [searchText, unfilteredUserData]); // ให้ useEffect ทำงานเมื่อ searchText หรือ unfilteredPatientData เปลี่ยน

  const handleUpdateUser = async () => {
  };

  const handleDeleteUser = async () => {
    try {
      if (selectedUser) {
        setLoading(true);

        const uid = selectedUser.uid; 
        console.log(selectedUser);
  
        const deleteUser = httpsCallable(getFunctions(), 'deleteUser');
        deleteUser({ uid }).then(async (result) => {
          console.log(result.data);
          
          // เพิ่มการลบใน Collection users ด้วย uid ที่ได้
          const userRef = doc(db, 'users', uid);
          await deleteDoc(userRef);
          
          console.log("User document successfully deleted!");
          alert("User deleted successfully!");
          setConfirmationModalVisible(false);
          loadUserData();
        }).catch((error) => {
          console.error("Error deleting user:", error.message);
          // ทำการ handle ข้อผิดพลาดได้ตามที่เหมาะสม
        })
        .finally(() => {
          setLoading(false); // สิ้นสุดการโหลด
      });
      }} catch (error) {
      console.error("Error deleting user:", error.message);
      // ทำการ handle ข้อผิดพลาดได้ตามที่เหมาะสม
      setLoading(false); // สิ้นสุดการโหลดในกรณีเกิด error
    }
  };

  const renderAddDataButton = () => {
    return (
      <TouchableOpacity
        onPress={handleAddData}
        style={{
          height: 37,
          width: 174,
          marginTop: isLandscape ? 25 : 50,
          // marginRight: isLandscape ? 60 : 50,
          marginBottom: isLandscape ? 25 : 0,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FE810E",
          borderRadius: 10,
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
        <Text style={{ fontSize: 22, color: "white" }}>Add</Text>
      </TouchableOpacity>
    );
  };

  const handleAddData = () => {
    navigation.navigate("AddUser");
  };

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      height: "100%",
      paddingTop: isMobile ? 10 : 20,
      flexDirection: "column",
      alignItems: "center",
    },
    boxCard: {
      height: "60%", // ปรับแต่งความสูงของ boxCard ตามอุปกรณ์
      width: isMobile ? "90%" : "90%", // ปรับแต่งความกว้างของ boxCard ตามอุปกรณ์
      marginLeft: isMobile ? "50" : "50",
      marginRight: isMobile ? "50" : "50",
      marginTop: isMobile ? 10 : 20,
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
    centerView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    cardContainer: {
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
    },
    leftContainer: {
      flex: 3,
      justifyContent: "center",
    },
    rightContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "flex-end",
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginRight: 20,
      marginBottom: 20,
    },
    buttonsContainer2: {
      flexDirection: "row",
      justifyContent: "center",
      marginRight: 20,
      marginBottom: 20,
    },
    editButton: {
      position: "absolute",
      top: 10,
      right: 10
    },
    deleteButton: {
      position: "absolute",
      bottom: 10,
      right: 10,
    },

    buttonText: {
      color: "white",
    },
    centerView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalView2: {
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
      height: isMobile ? "auto" : "70%", // Auto height for mobile
    },
    buttonClose: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: "center",
      marginTop: 10,
    },
    button: {
      backgroundColor: "#05AB9F",
      borderRadius: 5,
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
    },
    buttonClose: {
      backgroundColor: "red",
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: "center",
      marginTop: 10,
    },
    buttonUpdate: {
      backgroundColor: "green",
      padding: 10,
      borderRadius: 10,
      elevation: 2,
      alignSelf: "center",
      marginTop: 10,
      marginRight: 20,
    },
  });

  const renderCards = () => {
    return filteredUserData
      .filter((user) => user.role === selectedStatus)
      .map((user, index) => (
        <TouchableOpacity
          style={styles.cardContainer}
          key={index}
          onPress={() => handleCardPress(user)}
        >
          <View style={styles.card}>
            <View style={styles.leftContainer}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  marginLeft: 20,
                  lineHeight: 30,
                }}
              >
                {user.displayName}
              </Text>
              <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                Role : {user.role}
              </Text>
              <Text style={{ marginLeft: 20, lineHeight: 30, opacity: 0.4 }}>
                Email : {user.email}
              </Text>
            </View>

                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => {
                    handleEditUser(user);
                }}>
                <FontAwesome name="edit" size={24} color="gray" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setSelectedUser(user);
                    // setAction('reject');
                    setConfirmationModalVisible(true);
                  }}
                >
                  <MaterialIcons name="delete" size={24} color="red" />
                </TouchableOpacity>

          </View>
        </TouchableOpacity>
      ));
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          marginVertical: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <SelectList
          data={statusOptions}
          setSelected={setSelectedStatus}
          placeholder="Select role"
          defaultOption={selectedStatus}
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

        <TextInput
          style={{
            flex: 1,
            backgroundColor: "#FEF0E6",
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            marginLeft: 15,
          }}
          placeholder="Search by name"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
          }}
        />
      </View>
      <View style={styles.boxCard}>
        <ScrollView>{renderCards()}</ScrollView>
      </View>

      {/* Modal ดูข้อมูลในการ์ด */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView2}>
            {selectedUser && (
              <>
                <View
                  style={{ width: dimensions.width < 768 ? "100%" : "45%" }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 400,
                      marginVertical: 8,
                      textAlign: "left",
                      alignItems: "flex-start",
                    }}
                  >
                    Name
                  </Text>
                  <View
                    style={{
                      height: 48,
                      borderColor: "#FEF0E6",
                      borderWidth: 1,
                      borderRadius: 10,
                      alignItems: "left",
                      justifyContent: "left",
                    }}
                  >
                    <TextInput
                      value={selectedUser.displayName}
                      editable={false}
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

                <View
                  style={{ width: dimensions.width < 768 ? "100%" : "45%" }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 400,
                      marginVertical: 8,
                      textAlign: "left",
                      alignItems: "flex-start",
                    }}
                  >
                    E-mail
                  </Text>
                  <View
                    style={{
                      height: 48,
                      borderColor: "#FEF0E6",
                      borderWidth: 1,
                      borderRadius: 10,
                      alignItems: "left",
                      justifyContent: "left",
                    }}
                  >
                    <TextInput
                      value={selectedUser.email}
                      editable={false}
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

                <View
                  style={{ width: dimensions.width < 768 ? "100%" : "45%" }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 400,
                      marginVertical: 8,
                      textAlign: "left",
                      alignItems: "flex-start",
                    }}
                  >
                    Role
                  </Text>
                  <View
                    style={{
                      height: 48,
                      borderColor: "#FEF0E6",
                      borderWidth: 1,
                      borderRadius: 10,
                      alignItems: "left",
                      justifyContent: "left",
                    }}
                  >
                    <TextInput
                      value={selectedUser.role}
                      editable={false}
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
              </>
            )}
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Edit */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalEditVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalEditVisible(!modalEditVisible);
        }}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView2}>
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
                Name
              </Text>
              <View
                style={{
                  height: 48,
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                  alignItems: "left",
                  justifyContent: "left",
                }}
              >
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
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
                E-mail
              </Text>
              <View
                style={{
                  height: 48,
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                  alignItems: "left",
                  justifyContent: "left",
                }}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
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
                Role
              </Text>
              <View
                style={{
                  height: 48,
                  borderColor: "#FEF0E6",
                  borderWidth: 1,
                  borderRadius: 10,
                  alignItems: "left",
                  justifyContent: "left",
                }}
              >
                <SelectList
                  data={statusOptions}
                  setSelected={setSelectedRole}
                  placeholder="Select role"
                  defaultOption={selectedUser ? selectedUser.role : ""} // แก้ไขตรงนี้
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

            <View style={styles.buttonsContainer2}>
              <Pressable
                style={[styles.button, styles.buttonUpdate]}
                onPress={handleUpdateUser}
              >
                <Text style={styles.textStyle}>Update</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={handleCancelUpdate}
              >
                <Text style={styles.textStyle}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for confirmation */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={() => {
          setConfirmationModalVisible(false);
        }}
      >
        <View style={styles.centerView}>
          <View style={styles.modalView2}>
            <Text
              style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}
            >
              Are you sure you want to delete this user?
            </Text>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <View style={styles.buttonsContainer2}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonUpdate]}
                        onPress={handleDeleteUser}
                    >
                        <Text style={styles.textStyle}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => setConfirmationModalVisible(false)}
                    >
                        <Text style={styles.textStyle}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
          </View>
        </View>
      </Modal>

      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          alignSelf: "flex-start",
          marginLeft: 50,
        }}
      >
        {renderAddDataButton()}
      </View>
    </View>
  );
}
export default UserManagementScreen;
