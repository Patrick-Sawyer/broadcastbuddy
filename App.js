import { StatusBar } from 'expo-status-bar';
import React, { Fragment, useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Icon2 from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";

const Colors = {
  turq1: '#84d1ce',
  turq2: '#009da3',
  turq3: '#006c78',
  turq4: '#a9d0d1',
  turq5: '#008f8f',
  turq6: '#005659',
  turq7: '#f0f0f0',
  turq8: '#e6f0f0',
  grey1: '#808080',
  grey2: '#586a6e',
  lightGrey: '#f7f7f7',
  lightGrey2: '#dde7ed',
  lightGrey3: '#f2f5f5'
}

export default function App() {

  const [manualDurationText, setManualDurationText] = useState('');
  const [frameRate, setFrameRate] = useState(25);
  const [durationBlockWidth, setDurationBlockWidth] = useState(130);
  const [favourites, setFavourites] = useState([]);
  const [includedDurations, setIncludedDurations] = useState([]);
  const [invalidModalVisible, setInvalidModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalText, setInfoModalText] = useState('');

  const getStoredData = async (type, updateState) => {
    try {
      const value = await AsyncStorage.getItem(type);
      if(value !== null) {
        updateState(JSON.parse(value));
      }else{
        if (type == '@broadcastBuddyFavs') {
          updateState([2250, 1500, 3750]);
        }
      }
    } catch(e) {
      console.log(e);
    }
  }

  const storeData = async (value, name) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(name, jsonValue);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    getStoredData('@broadcastBuddyFramerate', setFrameRate);
    getStoredData('@broadcastBuddyDurations', setIncludedDurations);
    getStoredData('@broadcastBuddyFavs', setFavourites);
  }, [])

  const divider = (
    <View style={styles.dividerParent}>
      <View style={styles.divider}/>
    </View>
  )

  const darkButton = (duration, callback, key, isDuration = true, longPressCallback) => {
    return (
      <TouchableOpacity 
        key={key} 
        onPress={callback} 
        delayLongPress={200} 
        onLongPress={longPressCallback ? longPressCallback : callback} 
        style={isDuration && {minWidth: durationBlockWidth}}
      >
        <View style={[styles.darkButton]}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.smallText, {color: 'white'}]}>{duration}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const calculatorButton = (text, callback, longPress) => {
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <TouchableOpacity 
          onPress={longPress ? callback : null} 
          onPressIn={longPress ? null : callback} 
          delayLongPress={200} 
          onLongPress={longPress ? longPress : () => {}}
        >
          <View style={styles.calculatorButton}>
            <Text style={{fontSize: 20, color: Colors.turq2, fontWeight: 'bold'}}>{text}</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  const fpsSelect = (rate) => {
    return (
      <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableOpacity onPressIn={() => {
          if(rate != frameRate){
            setFrameRate(rate);
            storeData(rate, '@broadcastBuddyFramerate');
            setInfoModalText('Frame rate is now ' + rate + ' frames a second. Durations adjusted accordingly.');
            setInfoModalVisible(true);
          }
        }}>
          <Text style={[{padding: 10, color: Colors.turq1, fontSize: 15}, frameRate == rate && {fontWeight: 'bold', color: Colors.turq2}]}>
            {rate + 'FPS'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const displayDigit = (text, fontSize, isGreen, keyValue) => {
    return (
      <Text key={keyValue} numberOfLines={1} adjustsFontSizeToFit style={[
        {
          fontSize: fontSize, 
          color: Colors.lightGrey3, 
          fontFamily: Platform.OS == 'ios' ? 'Helvetica Neue' : 'Roboto'
        },
        isGreen && {color: Colors.turq2}, 
      ]}>{text}</Text>
    )
  }

  const displayDigits = (digits, fontSize) => {
    let digitString = digits;
    while (digitString.length < 8) {digitString = '0' + digitString};
    let digitArray = [];
    for(let i = 0; i < digitString.length; i++){
      let isGreen = digits.length > (7 - i);
      digitArray.push(
        displayDigit(
          digitString[i], 
          fontSize, 
          isGreen, 
          'digit' + i
        ));
      if((i + 8 - digitString.length) % 2 == 1 && i != (digitString.length - 1)){
        digitArray.push(
          displayDigit(
            ':', 
            fontSize, 
            isGreen, 
            'colon' + i
          ));
      }
    }
    return (
      <View style={styles.displayDigits}>
        {digitArray}
      </View>
    )
  }

  const inputDigit = (digit) => {
    let newText = manualDurationText + digit;
    while(newText.length > 8){
      newText = newText.substring(1);
    }
    setManualDurationText(newText);
  }

  const checkValidityAndSplit = (timecodeString) => {
    let timecode = splitTimeCode(timecodeString);
    if(timecode.minutes < 60 && timecode.seconds < 60 && timecode.frames < frameRate){
      return timecode
    }else{
      setInvalidModalVisible(true);
      setTimeout(() => {
        setInvalidModalVisible(false);
      }, 1250) 
      return null;
    }
  }

  const splitTimeCode = (timecode) => {
    while(timecode.length < 8){
      timecode = '0' + timecode;
    }
    return {
      hours: parseInt(timecode.substr(0, 2)),
      minutes: parseInt(timecode.substr(2, 2)),
      seconds: parseInt(timecode.substr(4, 2)),
      frames: parseInt(timecode.substr(6, 2))
    }
  }

  const calculateFrames = ({hours, minutes, seconds, frames}) => {
    hours = hours * 3600 * frameRate;
    minutes = minutes * 60 * frameRate;
    seconds = seconds * frameRate;
    return hours + minutes + seconds + frames;
  }

  const addZeros = (num) => {
    let s = num + "";
    while (s.length < 2) {s = "0" + s};
    return s;
  }

  const framesToText = (value) => {
    let hours = Math.floor(value / (3600 * frameRate));
    let leftOverFrames = value - (hours * 3600 * frameRate);
    let minutes = Math.floor(leftOverFrames / (60 * frameRate));
    leftOverFrames = leftOverFrames - (minutes * 60 * frameRate);
    let seconds = Math.floor(leftOverFrames / frameRate);
    let frames = leftOverFrames - (seconds * frameRate);
    hours = addZeros(hours);
    minutes = addZeros(minutes);
    seconds = addZeros(seconds);
    frames = addZeros(frames);
    let string = hours + minutes + seconds + frames + "";
    while(string[0] == '0'){
      string = string.substring(1);
    }
    return string;
  }

  const formatTimeCodeString = (string) => {
    switch(string.length) {
      case 0:
        return '0:00';
      case 1:
        return '0:0' + string;
      case 2:
        return '0:' + string;
      default:
        let {hours, minutes, seconds, frames} = splitTimeCode(string);
        hours = addZeros(hours);
        minutes = addZeros(minutes);
        seconds = addZeros(seconds);
        frames = addZeros(frames);
        let newString = hours + ':' + minutes + ':' + seconds + ':' + frames;
        while(newString[0] == '0' || newString[0] == ':'){
          newString = newString.substring(1);
        }
        return newString;
    }
  }

  const checkAndPushToState = (state, updateState) => {
    if(manualDurationText){
      let timecode = checkValidityAndSplit(manualDurationText);
      if(timecode){
        let totalFrames = calculateFrames(timecode);
        let array = [...state];
        array.push(totalFrames);
        updateState(array);
        setManualDurationText('');
        let type = state == favourites ? '@broadcastBuddyFavs' : '@broadcastBuddyDurations';
        storeData(array, type);
      }
    }
  }

  const renderDurations = (array, type) => {
    return [...array].map((frames, index) => {
      let string = framesToText(frames);
      let formatted = formatTimeCodeString(string);
      return darkButton(
        formatted, 
        () => {
          let newArray = [...includedDurations];
          newArray.push(frames);
          setIncludedDurations(newArray);
          storeData(newArray, '@broadcastBuddyDurations');
        }, 
        type + index, 
        true, 
        () => {
          let newArray = type == 'included' ? [...includedDurations] : [...favourites];
          newArray.splice(index, 1);
          if(type == 'included'){
            setIncludedDurations(newArray);
            storeData(newArray, '@broadcastBuddyDurations');
          }else if(type == 'favourites'){
            setFavourites(newArray);
            storeData(newArray, '@broadcastBuddyFavs');
          }
        }
      );
    })
  }

  const calculateTotal = () => {
    let total = 0;
    includedDurations.forEach((frames) => {
      total += frames;
    });
    return framesToText(total);
  }

  return (
    <Fragment>
      <Modal
        animationType="fade"
        transparent={true}
        visible={invalidModalVisible}
        presentationStyle="overFullScreen"
        statusBarTranslucent={false}
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <LinearGradient colors={[Colors.turq2, Colors.turq5]} style={styles.modalView}>
            <View style={{alignItems: 'center', padding: 25}}>
              <Icon name="alert-triangle" size={90} color={Colors.turq1} style={{paddingBottom: 20}}/>
              <Text style={styles.modalText}>Error: Invalid Timecode</Text>
            </View>
          </LinearGradient>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        presentationStyle="overFullScreen"
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
        statusBarTranslucent={false}
      >
        <View style={styles.centeredView}>
          <LinearGradient colors={[Colors.turq2, Colors.turq5]} style={[styles.modalView, {maxWidth: 500}]}>
            <View style={{alignItems: 'center', paddingVertical: 25}}>
              <Icon2 name="info" size={90} color={Colors.turq1} style={{paddingBottom: 20}}/>
              <Text style={[styles.modalText, {marginBottom: 20, fontSize: 19}]}>{infoModalText}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setInfoModalVisible(false);
                  setInfoModalText('');
                }}
                style={{backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 50, marginTop: 10}}>
                <Text style={{fontSize: 15, color: Colors.turq2}}>OK</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
      <StatusBar style="light" translucent={false} backgroundColor={Colors.turq6}/>
      <SafeAreaView style={styles.iosStatusBar} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={{alignSelf: 'center', width: '100%', backgroundColor: 'white'}}>
          <LinearGradient colors={['white', Colors.turq8, 'white']}  style={{backgroundColor: 'white'}}>
            <View style={{width: '100%', maxWidth: 1100, alignSelf: 'center'}}>
            <View style={[styles.block, styles.total, {marginTop: 2}]}>
              {displayDigits(calculateTotal(), 40)}
              <View style={{flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 15}}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.smallText}>Total:</Text>
                <TouchableOpacity
                  onPress={() => {
                    setInfoModalText('Total duration of all included durations.');
                    setInfoModalVisible(true);
                  }}
                >
                  <Icon2 name="info" size={15} color={Colors.turq2} style={{padding: 10, paddingLeft: 5}}/>
                </TouchableOpacity>
              </View>
            </View>
            {divider}
            <View style={styles.block}>
              <View style={[styles.subTitle, {marginBottom: 7}]}>
                {displayDigits(manualDurationText, 30, true)}
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={styles.smallText}>Add Duration:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setInfoModalText('Type the duration you wish to add, and either add to total or favourites.');
                      setInfoModalVisible(true);
                    }}
                  >
                    <Icon2 name="info" size={15} color={Colors.turq2} style={{padding: 10, paddingLeft: 5}}/>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.calculator}>
                <View style={styles.row}>
                  {calculatorButton(1, () => {
                    inputDigit('1');
                  })}
                  {calculatorButton(2, () => {
                    inputDigit('2');
                  })}
                  {calculatorButton(3, () => {
                    inputDigit('3');
                  })}
                  {calculatorButton(0, () => {
                    inputDigit('0');
                  })}
                </View>
                <View style={styles.row}>
                  {calculatorButton(4, () => {
                    inputDigit('4');
                  })}
                  {calculatorButton(5, () => {
                    inputDigit('5');
                  })}
                  {calculatorButton(6, () => {
                    inputDigit('6');
                  })}
                  {calculatorButton('00', () => {
                    inputDigit('00');
                  })}
                </View>
                <View style={styles.row}>
                  {calculatorButton(7, () => {
                    inputDigit('7');
                  })}
                  {calculatorButton(8, () => {
                    inputDigit('8');
                  })}
                  {calculatorButton(9, () => {
                    inputDigit('9');
                  })}
                  {calculatorButton(<Icon name="delete" size={23} color={Colors.turq2} />, () => {
                    let newString = manualDurationText.slice(0, -1);
                    setManualDurationText(newString);
                  }, () => {
                    setManualDurationText('');
                  })}
                </View>
              </View>
              <View style={{width: '100%', maxWidth: 450, paddingVertical: 5, alignSelf: 'center', paddingHorizontal: 2}}>
                {darkButton(
                  'Add to total', 
                  () => {checkAndPushToState(includedDurations, setIncludedDurations)}, 
                  'add-to-included', 
                  false
                )}
                {darkButton(
                  'Add to favourites', 
                  () => {checkAndPushToState(favourites, setFavourites)}, 
                  'add-to-favourites', 
                  false
                )}
              </View>
            </View>
            {divider}
            <View style={[styles.block, styles.breakBlock, {minHeight: 147}]}>
              <View style={styles.subTitle}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={styles.smallText}>Durations included in total:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setInfoModalText('Click a duration to duplicate and add to total. Hold to remove.');
                      setInfoModalVisible(true);
                    }}
                  >
                    <Icon2 name="info" size={15} color={Colors.turq2} style={{padding: 10, paddingLeft: 5}}/>
                  </TouchableOpacity>
                </View>
                <View style={{position: 'absolute', alignSelf: 'flex-end'}}>
                  <TouchableOpacity onPress={() => {
                    setIncludedDurations([]);
                    storeData([], '@broadcastBuddyDurations');
                  }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.smallText, {color: Colors.turq2, margin: 7, fontWeight: 'bold'}]}>Clear all</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{paddingHorizontal: 2}}>
                <View style={styles.breakContainer}
                  onLayout={(event) => {
                    const {width} = event.nativeEvent.layout;
                    const howManyWide = Math.floor(width/110);
                    const widthOfBlock = Math.floor(width/howManyWide);
                    setDurationBlockWidth(widthOfBlock);
                  }}
                >
                  {renderDurations(includedDurations, 'included')}
                </View>
              </View>
            </View>
            {divider}
            <View style={[styles.block, styles.breakBlock, {minHeight: 147}]}>
              <View style={styles.subTitle}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.smallText]}>Add duration from favourites:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setInfoModalText('Click a duration to add to the total. Hold to remove from favourites.');
                      setInfoModalVisible(true);
                    }}
                  >
                    <Icon2 name="info" size={15} color={Colors.turq2} style={{padding: 10, paddingLeft: 5}}/>
                  </TouchableOpacity>
                </View>
                <View style={{position: 'absolute', alignSelf: 'flex-end'}}>
                  <TouchableOpacity onPress={() => {
                    setFavourites([]);
                    storeData([], '@broadcastBuddyFavs');
                  }}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.smallText, {color: Colors.turq2, margin: 7, fontWeight: 'bold'}]}>Clear all</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{paddingHorizontal: 2}}>
                <View style={styles.breakContainer}>
                 {renderDurations(favourites, 'favourites')}
                </View>
              </View>
            </View>
            {divider}
            <View style={[styles.block, {paddingBottom: 0}]}>
              <View style={{flexDirection: 'row'}}>
                {fpsSelect(24)}
                {fpsSelect(25)}
                {fpsSelect(30)}
              </View>
            </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    backgroundColor: 'white'
  },
  iosStatusBar: { 
    flex:0, 
    backgroundColor: Colors.turq6
  },
  block: {
    width: '100%',
    padding: 8,
    paddingVertical: 3,
    justifyContent: 'center'
  },
  subTitle: {
    height: 50,
    justifyContent: 'center',
    marginLeft: 7,
  },
  total: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
  },
  smallText: {
    fontSize: 15,
    color: Colors.grey1
  },
  divider: {
    width: '100%',
    borderBottomWidth: 1,
    height: 5,
    borderBottomColor: Colors.turq1,
    opacity: 0.4,
  },
  dividerParent: {
    width: '100%',
    paddingHorizontal: 15,
  },
  darkButton: {
    maxWidth: 450,
    marginHorizontal: 5,
    backgroundColor: Colors.grey2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    height: 32,
  },
  calculatorButton: {
    padding: 10, 
    height: 50, 
    width: 50, 
    borderRadius: 2, 
    marginVertical: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: Colors.lightGrey2,
    backgroundColor: Colors.lightGrey
  },
  breakContainer: {
    flexDirection: 'row', 
    width: '100%', 
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  breakBlock: {
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row'
  },
  calculator: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    padding: 10,
    marginBottom: 20,
    backgroundColor: Colors.turq3,
    borderRadius: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.lightGrey2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  displayDigits: {
    width: '100%', 
    alignItems: 'center', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    position: 'absolute', 
    paddingRight: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 30,
    borderRadius: 3,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    backgroundColor: Colors.turq5,
  },
  modalText: {
    fontSize: 22,
    color: 'white',
    textAlign: 'center'
  }
});
