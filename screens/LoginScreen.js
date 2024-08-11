import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView
} from "react-native";
import { auth, db } from "../data/firebaseDB";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

import { useDispatch, useSelector } from "react-redux";
import { setUser, setRole, clearUser } from "../redux/action";

import Header from "../component/Header";
import SubHeader from "../component/SubHeader";
import Footer from "../component/Footer";

const LoginScreen = ({ route, navigation }) => {
  const { role } = route.params;
  const dispatch = useDispatch();
  const loggedInRole = useSelector((state) => state.role);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    setErrorMessage("");
    return () => {
      dispatch(clearUser());
    };
  }, [dispatch]);

  const handleLogin = () => {
    const lowercaseEmail = email.toLowerCase();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userRef = collection(db, "users");
        getDocs(userRef)
          .then((querySnapshot) => {
            let foundUser = null;

            querySnapshot.forEach((doc) => {
              if (doc.exists()) {
                const userData = doc.data();
                if (
                  userData.email === lowercaseEmail &&
                  userData.role === role
                ) {
                  foundUser = userData;
                }
              }
            });

            if (foundUser) {
              dispatch(setUser(foundUser));
              dispatch(setRole(role));
              if (role === "student") {
                navigation.navigate("Subject");
              } else {
                navigation.navigate("Home");
              }
            } else {
              setErrorMessage("บทบาทของผู้ใช้ไม่ตรงกับที่คุณเลือก");
            }
          })
          .catch((error) => {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", error);
          });
      })
      .catch((error) => {
        if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        ) {
          setErrorMessage("ชื่อผู้ใช้งานหรือรหัสผ่านผิดพลาด");
        } else {
          setErrorMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
        console.error("เข้าสู่ระบบผิดพลาด:", error);
      });
  };

  let roleText = "";
  if (role === "student") {
    roleText = "Medical Student";
  } else if (role === "teacher") {
    roleText = "Instructor/Staff";
  } else if (role === "staff") {
    roleText = "Staff";
  }

  const emailFontSize = screenWidth < 768 ? 20 : 28;
  const passwordFontSize = screenWidth < 768 ? 20 : 28;
  const inputFontSize = screenWidth < 768 ? 14 : 18;
  const loginButtonFontSize = screenWidth < 768 ? 20 : 28;
  const inputWidth = screenWidth < 768 ? "85%" : "65%";
  // const loginButtonWidthSize = screenWidth < 768 ? 373 : 520;
  const loginButtonHeightSize = screenWidth < 768 ? 46 : 65;
  const marginLeftTest = screenWidth < 768 ? "8%" : "18%";
  const backFontSize = screenWidth < 768 ? 20 : 28;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <Header />
          <SubHeader text={roleText} />
          <Image
            source={
              role === "student"
                ? require("../assets/student.png")
                : role === "teacher"
                ? require("../assets/professor.png")
                : require("../assets/staff.png")
            }
            style={{ width: 300, height: 300, alignSelf: "center", marginTop: 20 }}
            resizeMode="contain"
          />
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: emailFontSize,
                alignSelf: "flex-start",
                marginLeft: marginLeftTest,
                marginBottom: 10,
                marginTop: 10,
              }}
            >
              Email
            </Text>
            <TextInput
              placeholder="username"
              placeholderTextColor={"grey"}
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
              style={[
                styles.input,
                {
                  width: inputWidth,
                  fontSize: inputFontSize,
                  backgroundColor: "#FEF0E6",
                },
              ]}
            />
          </View>

          <View style={{ alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: inputWidth,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: passwordFontSize,
                  textAlign: "left",
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                Password
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ResetPassword")}
              >
                <Text style={{ color: "#9D5716", marginLeft: "auto" }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="password"
              placeholderTextColor={"grey"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[
                styles.input,
                {
                  width: inputWidth,
                  fontSize: inputFontSize,
                  backgroundColor: "#FEF0E6",
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                width: inputWidth,
                height: loginButtonHeightSize,
                backgroundColor: loggedInRole ? "#FE810E" : "gray",
                alignSelf: "center",
                justifyContent: "center",
                marginTop: 20,
              },
            ]}
            onPress={handleLogin}
          >
            <Text
              style={{
                fontSize: loginButtonFontSize,
                color: "white",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "red", marginTop: 10, textAlign: "center" }}>
            {errorMessage}
          </Text>
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
  input: {
    padding: 15,
    marginVertical: 10,
    borderColor: "#FEF0E6",
    borderWidth: 1,
    borderRadius: 10,
  },
  loginButton: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: "gray",
    alignItems: "center",
    borderRadius: 10,
  },
  passwordResetLink: {
    marginTop: 10,
    color: "#9D5716",
  },
});

export default LoginScreen;
