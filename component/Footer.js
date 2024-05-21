// components/Footer.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const Footer = () => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  
  const footerTextSize = windowWidth > 768 ? 18 : 14; // ขนาดข้อความย่อย
  const footerContainerHeight = windowWidth > 430 ? 40 : 45; // ขนาดข้อความย่อย
  return (
    <View style={[styles.footerContainer, {height: footerContainerHeight}]}>
      <Text style={[styles.footerText, {fontSize: footerTextSize}]}>
        Faculty of Medicine, King Mongkut's Institute of Technology Ladkrabang
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#FE810E', // สีส้ม
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  footerText: {
    color: 'black',
    textAlign: 'center'
  },
});

export default Footer;
