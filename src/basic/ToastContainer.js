/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import {
  Keyboard,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { connectStyle } from 'native-base-shoutem-theme';
import { ViewPropTypes } from 'deprecated-react-native-prop-types';

import mapPropsToStyleNames from '../utils/mapPropsToStyleNames';
import { PLATFORM } from '../theme/variables/commonColor';

import { Text } from './Text';
import { Button } from './Button';
import { Toast } from './Toast';

const POSITION = {
  ABSOLUTE: 'absolute',
  BOTTOM: 'bottom',
  TOP: 'top',
};

class ToastContainer extends Component {
  static show({ ...config }) {
    if (this.toastInstance) {
      this.toastInstance.showToast({ config });
    } else {
      console.warn('ToastContainer instance is not initialized');
    }
  }

  static hide() {
    if (this.toastInstance && this.toastInstance.getModalState()) {
      this.toastInstance.closeToast('functionCall');
    }
  }
  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      pan: new Animated.ValueXY({ x: 0, y: 0 }),
      keyboardHeight: 0,
      isKeyboardVisible: false,
      modalVisible: false,
    };

    this.keyboardDidHide = this.keyboardDidHide.bind(this);
    this.keyboardDidShow = this.keyboardDidShow.bind(this);
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderRelease: (evt, { dx }) => {
        if (dx !== 0) {
          Animated.timing(this.state.pan, {
            toValue: { x: dx, y: 0 },
            duration: 100,
            useNativeDriver: false,
          }).start(() => this.closeToast('swipe'));
        }
      },
    });
  }

  componentDidMount() {
    ToastContainer.toastInstance = this; // Set the instance
    this.keyboardDidShowSubscription = Keyboard.addListener(
      'keyboardDidShow',
      this.keyboardDidShow
    );
    this.keyboardDidHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      this.keyboardDidHide
    );
  }

  componentWillUnmount() {
    this.keyboardDidShowSubscription.remove();
    this.keyboardDidHideSubscription.remove();
    ToastContainer.toastInstance = null; // Clear the instance
  }

  getToastStyle() {
    return {
      position: POSITION.ABSOLUTE,
      opacity: this.state.fadeAnim,
      width: '100%',
      elevation: 9,
      paddingHorizontal: Platform.OS === PLATFORM.IOS ? 20 : 0,
      top: this.state.position === POSITION.TOP ? 30 : undefined,
      bottom: 
        this.state.position === POSITION.BOTTOM ? this.getTop() : undefined,
    };
  }

  getTop() {
    if (Platform.OS === PLATFORM.IOS) {
      if (this.state.isKeyboardVisible) {
        return this.state.keyboardHeight;
      }
      return 30;
    }
    return 0;
  }

  getButtonText(buttonText) {
    if (buttonText) {
      if (buttonText.trim().length === 0) {
        return undefined;
      }
      return buttonText;
    }
    return undefined;
  }
  getModalState() {
    return this.state.modalVisible;
  }

  keyboardDidHide() {
    this.setState({
      keyboardHeight: 0,
      isKeyboardVisible: false,
    });
  }

  keyboardDidShow(e) {
    this.setState({
      keyboardHeight: e.endCoordinates.height,
      isKeyboardVisible: true,
    });
  }

  showToast({ config }) {
    this.setState({
      modalVisible: true,
      text: config.text,
      buttonText: this.getButtonText(config.buttonText),
      type: config.type,
      position: config.position ? config.position : POSITION.BOTTOM,
      supportedOrientations: config.supportedOrientations,
      style: config.style,
      buttonTextStyle: config.buttonTextStyle,
      buttonStyle: config.buttonStyle,
      textStyle: config.textStyle,
      onClose: config.onClose,
      swipeDisabled: config.swipeDisabled || false
    });
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    if (config.duration !== 0) {
      const duration = config.duration > 0 ? config.duration : 1500;
      this.closeTimeout = setTimeout(() => this.closeToast('timeout'), duration);
    }
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }
  closeModal = (reason) => {
    this.setState({
      modalVisible: false,
    });
    const { onClose } = this.state;
    if (onClose && typeof onClose === 'function') {
      onClose(reason);
    }
  };
  closeToast(reason) {
    clearTimeout(this.closeTimeout);
    Animated.timing(this.state.fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      this.closeModal(reason);
      this.state.pan.setValue({ x: 0, y: 0 });
    });
  }

  render() {
    if (this.state.modalVisible) {
      const { x, y } = this.state.pan;
      return (
        <Animated.View
          {...this.state.swipeDisabled ? {} : this._panResponder.panHandlers}
          style={[
            this.getToastStyle(),
            { transform: [{ translateX: x }, { translateY: y }] },
          ]}
        >
          <Toast
            style={[this.state.style]}
            danger={this.state.type === 'danger'}
            success={this.state.type === 'success'}
            warning={this.state.type === 'warning'}
          >
            <Text style={this.state.textStyle}>{this.state.text}</Text>
            {this.state.buttonText && (
              <Button
                style={this.state.buttonStyle}
                onPress={() => this.closeToast('user')}
              >
                <Text style={this.state.buttonTextStyle}>
                  {this.state.buttonText}
                </Text>
              </Button>
            )}
          </Toast>
        </Animated.View>
      );
    }
    return null;
  }
}

ToastContainer.propTypes = {
  ...ViewPropTypes,
};

const StyledToastContainer = connectStyle(
  'NativeBase.ToastContainer',
  {},
  mapPropsToStyleNames
)(ToastContainer);

export { StyledToastContainer as ToastContainer };
