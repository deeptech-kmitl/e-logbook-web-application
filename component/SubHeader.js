// components/SubHeader.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const SubHeader = ({ text }) => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const subHeaderTextSize = windowWidth > 768 ? 24 : 16; // ขนาดข้อความย่อย

  return (
    <View style={styles.subHeaderContainer}>
      <View style={styles.line} />
      <Text style={[styles.subHeaderText, {fontSize: subHeaderTextSize}]}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  subHeaderContainer: {
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    height: 1,
    width: 100,
    backgroundColor: '#FE810E',
    marginHorizontal: 15,
  },
  subHeaderText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center'
  },
});

export default SubHeader;
