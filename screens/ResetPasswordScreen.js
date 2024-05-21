import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import validator from "validator";

import Header from "../component/Header";
import SubHeader from "../component/SubHeader";
import Footer from "../component/Footer";

const ResetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  const textFontSize = screenWidth < 768 ? 16 : 24;
  const inputWidth = screenWidth < 768 ? "85%" : "65%";
  const marginLeftTest = screenWidth < 768 ? "8%" : "18%";
  const emailFontSize = screenWidth < 768 ? 20 : 28;
  const inputFontSize = screenWidth < 768 ? 14 : 18;
  const resetButtonHeightSize = screenWidth < 768 ? 46 : 65;
  const backFontSize = screenWidth < 768 ? 20 : 28;

  const handleSendResetLink = () => {
    // ตรวจสอบว่าอีเมลว่างหรือไม่
    if (email.trim() === "") {
      setErrorMessage("Please enter your email.");
      return;
    }
    // ตรวจสอบ format ของอีเมล
    if (!validator.isEmail(email)) {
      setErrorMessage("Please enter your email in the correct format.");
      return;
    }

    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setIsResetSuccessful(true);
        setErrorMessage("");
      })
      .catch((error) => {
        setIsResetSuccessful(false);
        setErrorMessage("Unable to send password reset link: " + error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Header />
      <SubHeader text="Forgot Password" />

      <Image
        source={require("../assets/logo.png")}
        style={{ width: 300, height: 300, alignSelf: "center", marginTop: 20 }}
        resizeMode="contain"
      />
      <View style={{ margin: 10 }}>
        <Text style={{ fontSize: textFontSize, textAlign: "center" }}>
          Enter your email, and we’ll send you instructions to reset your
          password.
        </Text>
      </View>

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
          placeholder="example@gmail.com"
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

      <TouchableOpacity
        style={[
          styles.resetButton,

          {
            width: inputWidth,
            height: resetButtonHeightSize,
            backgroundColor: "#FE810E",
            alignSelf: "center",
            justifyContent: "center",
            marginTop: 20,
          },
        ]}
        onPress={handleSendResetLink}
      >
        <Text
          style={{
            fontSize: emailFontSize,
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Send Reset Link
        </Text>
      </TouchableOpacity>
      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}
      {isResetSuccessful ? (
        <Text style={styles.successMessage}>
          A password reset link has been sent to your email.
        </Text>
      ) : null}

      <Text
        style={[
          styles.passwordResetLink,
          { textAlign: "center", fontSize: backFontSize },
        ]}
        onPress={() => navigation.goBack()}
      >
        ◄ Back to login
      </Text>

      <View style={{ flex: 1 }} />
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    fontSize: 36,
    marginBottom: 20,
  },
  input: {
    padding: 15,
    marginVertical: 10,
    borderColor: "#FEF0E6",
    borderWidth: 1,
    borderRadius: 10,
  },
  resetButton: {
    // height: 63,
    // width: 216,
    padding: 15,
    marginVertical: 10,
    backgroundColor: "gray",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
  },
  errorMessage: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  successMessage: {
    color: "green",
    marginTop: 10,
    textAlign: "center",
  },
  passwordResetLink: {
    marginTop: 10,
    color: "#9D5716",
    textAlign: "center",
  },
});

export default ResetPasswordScreen;
