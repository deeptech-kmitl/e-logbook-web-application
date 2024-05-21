import React, { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import SelectRoleScreen from '../screens/SelectRoleScreen';
import SelectSubjectScreen from '../screens/SelectSubjectScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import IpdScreen from '../screens/IpdScreen';
import OpdScreen from '../screens/OpdScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProcedureScreen from '../screens/ProcedureScreen';
import ReportScreen from '../screens/ReportScreen';
import AddIpdScreen from '../screens/AddScreen/AddIpdScreen';
import AddOpdScreen from '../screens/AddScreen/AddOpdScreen';
import AddActivityScreen from '../screens/AddScreen/AddActivityScreen';
import AddProcedureScreen from '../screens/AddScreen/AddProcedureScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontAwesome, FontAwesome5,  AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from "react-redux";

import IpdHistoryScreen from '../screens/AddHistoryScreen/IpdHistoryScreen'
import OpdHistoryScreen from '../screens/AddHistoryScreen/OpdHistoryScreen'
import ActivityHistoryScreen from '../screens/AddHistoryScreen/ActivityHistoryScreen';
import ProcedureHistoryScreen from '../screens/AddHistoryScreen/ProcedureHistoryScreen';

import EditIpdScreen from '../screens/EditScreen/EditIpdScreen'
import EditOpdScreen from '../screens/EditScreen/EditOpdScreen'
import EditProcedureScreen from '../screens/EditScreen/EditProcedureScreen';
import EditActivityScreen from '../screens/EditScreen/EditActivityScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen'

import DashBoardScreen from '../screens/AdminScreen/DashBoardScreen'
import UserManagementScreen from '../screens/AdminScreen/UserManagementScreen'
import UserCaseScreen from '../screens/AdminScreen/UserCaseScreen'
import ExportScreen from '../screens/AdminScreen/ExportScreen'

import AddUserScreen from '../screens/AdminScreen/AddUserScreen';
// สร้าง Stack Navigator สำหรับหน้า Login และ Home
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {

  const role = useSelector((state) => state.user.role);
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // กำหนดเกณฑ์สำหรับอุปกรณ์มือถือ
  
  return (
    <Tab.Navigator
    screenOptions={{
      tabBarLabelPosition: isMobile ? 'below-icon' : 'beside-icon',
      tabBarStyle: { backgroundColor: '#FE810E' },
    }}
  >
    { (role === "student" || role === "teacher") && (
      <Tab.Screen name="หน้าหลัก" component={HomeScreen}
        options={{
          headerShown: false,
          title: 'Home',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={24} color={focused ? 'white' : 'grey'} />
          ),
        }} />
    )}

  { (role === "student" || role === "teacher") && (
        <Tab.Screen
          name="ผู้ป่วยใน"
          component={IpdScreen}
          options={({ navigation }) => ({
            headerShown: false,
            title: 'IPD',
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome5 name="file-medical" size={24} color={focused ? 'white' : 'grey'} />
            ),
            headerStyle: {
              backgroundColor: '#7274AE',
            },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerRight: () => <IpdHeaderRight navigation={navigation} />
          })}
        />
  )}

  { (role === "student" || role === "teacher") && (
      <Tab.Screen 
        name="ผู้ป่วยนอก" 
        component={OpdScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: 'OPD',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="file-medical-alt" size={24} color={focused ? 'white' : 'grey'} />
          ),
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <OpdHeaderRight navigation={navigation} />
        })} />
  )}
  { (role === "student" || role === "teacher") && (
      <Tab.Screen 
        name="หัตถการ" 
        component={ProcedureScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: 'Procedure',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="hand-holding-medical" size={24} color={focused ? 'white' : 'grey'} />
          ),
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <ProcedureHeaderRight navigation={navigation} />
        })} />
  )}
  { (role === "student" || role === "teacher") && (
      <Tab.Screen 
        name="กิจกรรม" 
        component={ActivityScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: 'Activity',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="pump-medical" size={24} color={focused ? 'white' : 'grey'} />
          ),
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <ActivityHeaderRight navigation={navigation} />
        })} />
  )}
      {/* {role == "teacher" && (
          <Tab.Screen 
              name="รายงานผล" 
              component={ReportScreen}
              options={{
                  tabBarIcon: ({ focused, color, size }) => (
                      <Ionicons name="document" size={24} color={focused ? '#007BFF' : 'white'} />
                  ),
                  headerStyle: {
                      backgroundColor: '#7274AE',
                  },
                  headerTintColor: '#fff',
                  headerTitleAlign: 'center',
                  headerTitleStyle: {
                      fontWeight: 'bold',
                  },
              }} 
          />
      )} */}
      { role == "staff" && (
        <Tab.Screen 
        name="Dashboard" 
        component={DashBoardScreen} 
        options={({ navigation }) => ({
            title: 'Dashboard',
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'grey',
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome name="dashboard" size={24} color={focused ? 'white' : 'grey'} />
            ),
            headerStyle: {
              backgroundColor: '#FE810E',
            },
            headerTintColor: '#fff',
            headerTitleAlign: 'center',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          })} 
          />
        )} 

      { role == "staff" && (
        <Tab.Screen 
        name="User Management" 
        component={UserManagementScreen} 
        options={({ navigation }) => ({
          title: 'User Management',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <AntDesign name="user" size={24} color={focused ? 'white' : 'grey'} />
          ),
          headerStyle: {
            backgroundColor: '#FE810E',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        })} 
        />
      )}

      { role == "staff" && (
        <Tab.Screen name="User Case" 
        component={UserCaseScreen} 
        options={({ navigation }) => ({
          title: 'Cases',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome name="th-list" size={24} color={focused ? 'white' : 'grey'} />
          ),
          headerStyle: {
            backgroundColor: '#FE810E',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        })} 
        />
      )}

      { role == "staff" && (
        <Tab.Screen name="Export" 
        component={ExportScreen} 
        options={({ navigation }) => ({
          title: 'Export',
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'grey',
          tabBarIcon: ({ focused, color, size }) => (
            <AntDesign name="export2" size={24} color={focused ? 'white' : 'grey'} />
          ),
          headerStyle: {
            backgroundColor: '#FE810E',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          }
        })} 
        />
      )}
    </Tab.Navigator>

  );
}

function IpdHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('IpdHistory')}
    />
  );
}

function OpdHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('OpdHistory')}
    />
  );
}

function ActivityHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('ActivityHistory')}
    />
  );
}

function ProcedureHeaderRight({ navigation }) {
  return (
    <FontAwesome5
      name="history"
      size={24}
      color="white"
      style={{ marginRight: 15 }}
      onPress={() => navigation.navigate('ProcedureHistory')}
    />
  );
}


function MyNavigator() {

  const user = useSelector((state) => state.user);
  const role = user ? user.role : null;
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectRole">
        <Stack.Screen name="SelectRole" component={SelectRoleScreen} options={{ 
          headerShown: false,
          title: 'เลือกบทบาท'
          }} />

        <Stack.Screen name="Login" component={LoginScreen} options={{
          title: 'เข้าสู่ระบบ',
          headerShown: false,
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="Subject" component={SelectSubjectScreen} options={{
          title: 'เลือกรายวิชา',
          headerShown: false,
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="Home" component={MainTabNavigator} options={{ 
          headerShown: false,
          title: 'หน้าหลัก'
          }} />

        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{
          title: 'เปลี่ยนรหัสผ่าน',
          headerShown: false,
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddIpd" component={AddIpdScreen} options={{
          headerShown: false,
          title: 'เพิ่มข้อมูลผู้ป่วยใน',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        <Stack.Screen name="EditIpd" component={EditIpdScreen} options={{
          headerShown: false,
          title: 'แก้ไขข้อมูลผู้ป่วยใน',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        <Stack.Screen name="IpdHistory" component={IpdHistoryScreen} options={{ headerShown: true }} options={{
          title: 'ประวัติผู้ป่วยใน',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddOpd" component={AddOpdScreen} options={{
          headerShown: false,
          title: 'เพิ่มข้อมูลผู้ป่วยนอก',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="EditOpd" component={EditOpdScreen} options={{
          headerShown: false,
          title: 'แก้ไขข้อมูลผู้ป่วยนอก',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
        
        <Stack.Screen name="OpdHistory" component={OpdHistoryScreen} options={{
          title: 'ประวัติผู้ป่วยนอก',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{
          headerShown: false,
          title: 'เพิ่มข้อมูลกิจกรรม',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="EditActivity" component={EditActivityScreen} options={{
          headerShown: false,
          title: 'แก้ไขข้อมูลกิจกรรม',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} options={{
          title: 'ประวัติกิจกรรม',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddProcedure" component={AddProcedureScreen} options={{
          headerShown: false,
          title: 'เพิ่มข้อมูลหัตถการ',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="EditProcedure" component={EditProcedureScreen} options={{
          headerShown: false,
          title: 'แก้ไขข้อมูลหัตถการ',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="ProcedureHistory" component={ProcedureHistoryScreen} options={{
          title: 'ประวัติหัตถการ',
          headerStyle: {
            backgroundColor: '#7274AE',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />

        <Stack.Screen name="AddUser" component={AddUserScreen} options={{
          title: 'Add user',
          headerStyle: {
            backgroundColor: '#FE810E',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default MyNavigator;