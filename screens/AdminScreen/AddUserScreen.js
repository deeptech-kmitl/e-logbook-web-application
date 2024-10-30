import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "../../data/firebaseDB";
import { SelectList } from "react-native-dropdown-select-list"; // Import SelectList

const AddUserScreen = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("student"); // Default role is 'student'

  const [selectedStatus, setSelectedStatus] = useState("student");
  const statusOptions = [
    { key: "student", value: "Student" },
    { key: "teacher", value: "Teacher" },
  ];

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateLayout);
    return () => Dimensions.removeEventListener("change", updateLayout);
  }, []);

  const handleAddUser = async () => {
    try {
      const auth = getAuth();
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Add user data to Firestore collection 'users' with uid from Authentication
      const usersCollection = collection(db, "users");

      // Specify document ID as the user's UID
      await setDoc(doc(usersCollection, user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: email,
        role: role,
      });

      // Clear input fields
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("student");

      setIsResetSuccessful(true);
      setErrorMessage("");
      alert("User added successfully!");
    } catch (error) {
      setIsResetSuccessful(false);
      console.error("Error adding user:", error.message);
      setErrorMessage("Unable to adding user: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ width: dimensions.width < 768 ? "100%" : "45%" }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginVertical: 8,
            textAlign: "center",
            alignItems: "flex-start",
          }}
        >
          E-mail:
        </Text>
        <View
          style={{
            height: 48,
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter email"
            placeholderTextColor="grey"
            style={{
              width: "100%",
              textAlign: "center",
              height: "100%",
              fontSize: 20,
              backgroundColor: "#FEF0E6",
            }}
          />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginVertical: 8,
            textAlign: "center",
            alignItems: "flex-start",
          }}
        >
          Password:
        </Text>
        <View
          style={{
            height: 48,
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            placeholder="Enter password"
            placeholderTextColor="grey"
            style={{
              width: "100%",
              textAlign: "center",
              height: "100%",
              fontSize: 20,
              backgroundColor: "#FEF0E6",
            }}
          />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginVertical: 8,
            textAlign: "center",
            alignItems: "flex-start",
          }}
        >
          Display Name:
        </Text>
        <View
          style={{
            height: 48,
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter display name"
            placeholderTextColor="grey"
            style={{
              width: "100%",
              textAlign: "center",
              height: "100%",
              fontSize: 20,
              backgroundColor: "#FEF0E6",
            }}
          />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginVertical: 8,
            textAlign: "center",
            alignItems: "flex-start",
          }}
        >
          Role:
        </Text>
        <View
          style={{
            height: 48,
            borderColor: "#FEF0E6",
            borderWidth: 1,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <SelectList
            data={statusOptions}
            setSelected={setRole}
            placeholder="Select role"
            defaultOption={role}
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

        <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
          <Text style={styles.buttonText}>Add User</Text>
        </TouchableOpacity>
        {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}
      {isResetSuccessful ? (
        <Text style={styles.successMessage}>
          Add user successfully!
        </Text>
      ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
});

export default AddUserScreen;
