import React,{ useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const Header = () => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // กำหนดขนาดของโลโก้และข้อความตามเงื่อนไขของแต่ละอุปกรณ์
  const logoSize = windowWidth > 768 ? 180 : 120; // ขนาดโลโก้
  const boldHeaderTextSize = windowWidth > 768 ? 40 : 32; // ขนาดข้อความหัวข้อ
  const smallHeaderTextSize = windowWidth > 768 ? 24 : 16; // ขนาดข้อความย่อย
  const smallHeaderTextLineHeight = windowWidth > 768 ? 40 : 20; // ความสูงของบรรทัดข้อความย่อย

  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get('window'));
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => Dimensions.removeEventListener('change', updateLayout);
  }, []);

  const styles = StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
      width: '100%',
    },
    logoContainer: {
      marginRight: 20,
    },
    logo: {
      // ขนาดโลโก้จะถูกปรับโดยตรงในการกำหนดในโค้ดด้านบน
    },
    textContainer: {
      alignItems: 'flex-start',
      flex: 1, // ให้ข้อความทำการเต็มพื้นที่ของคอลัมน์
      flexWrap: 'wrap', // ให้ข้อความขึ้นบรรทัดใหม่เมื่อเกินขนาด
    },
    boldHeaderText: {
      fontWeight: 'bold',
      // ขนาดข้อความหัวข้อจะถูกปรับโดยตรงในการกำหนดในโค้ดด้านบน
    },
    smallHeaderText: {
      color: '#888',
      // ความสูงของบรรทัดข้อความย่อยจะถูกปรับโดยตรงในการกำหนดในโค้ดด้านบน
    },
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            { width: logoSize, height: logoSize }, // ปรับขนาดของโลโก้ตามเงื่อนไขของแต่ละอุปกรณ์
          ]}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.boldHeaderText,
          { fontSize: boldHeaderTextSize }, // ปรับขนาดข้อความหัวข้อตามเงื่อนไขของแต่ละอุปกรณ์
        ]}>E-Log Book</Text>
        <Text style={[
          styles.smallHeaderText,
          { fontSize: smallHeaderTextSize, lineHeight: smallHeaderTextLineHeight }, // ปรับขนาดและความสูงของข้อความย่อยตามเงื่อนไขของแต่ละอุปกรณ์
        ]}>
          Faculty of Medicine,
          {"\n"}
          King Mongkut's Institute of Technology Ladkrabang
        </Text>
      </View>
    </View>
  );
};


export default Header;
