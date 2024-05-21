import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import store from './redux/store';
import MyNavigator from "./navigation/MyNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <Helmet>
        <title>E-LogBook Web Application</title>
      </Helmet>
      <MyNavigator />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});