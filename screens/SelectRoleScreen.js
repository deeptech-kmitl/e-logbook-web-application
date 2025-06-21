import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useDispatch } from "react-redux";
import { setRole } from "../redux/action"; // ตรงนี้ต้องแก้ import จาก reducers เป็น action
import Header from "../component/Header"; // แก้ตรงนี้
import SubHeader from "../component/SubHeader"; // แก้ตรงนี้
import Footer from "../component/Footer"; // แก้ตรงนี้

const SelectRoleScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const dispatch = useDispatch();
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  useEffect(() => {
    const onChange = () => {
      setScreenWidth(Dimensions.get("window").width);
    };

    Dimensions.addEventListener("change", onChange);
    return () => {
      Dimensions.removeEventListener("change", onChange);
    };
  }, []);

  const handleRolePress = (role) => {
    setSelectedRole(role);
    dispatch(setRole(role));
    navigation.navigate("Login", { role });
  };

  return (
    <View style={styles.container}>
      <Header />
      <SubHeader text="Please select a role from below to log in." />

      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => handleRolePress("student")}
      >
        <Text style={styles.roleButtonText}>Medical student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => handleRolePress("teacher")}
      >
        <Text style={styles.roleButtonText}>Instructor/Staff</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => handleRolePress("staff")}
      >
        <Text style={styles.roleButtonText}>Admin</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  roleButton: {
    height: 80,
    width: 340,
    marginTop: 50,
    borderRadius: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "orange",
  },
  roleButtonText: {
    fontSize: 24,
  },
  continueButton: {
    height: 63,
    width: 216,
    marginTop: 70,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  continueButtonText: {
    fontSize: 28,
    color: "white",
  },
});

export default SelectRoleScreen;
