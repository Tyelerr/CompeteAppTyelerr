// components/LoginForms/LFInput_Fixed.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardTypeOptions,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  InputAccessoryView,
} from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';
import { Ionicons } from '@expo/vector-icons';
import { EInputValidation, IPickerOption } from './Interface';
import {
  EmailIsValid,
  NumberIsGreatThenZero,
  NumberIsGreatThenZero_ErrorMessage,
  PasswordIsValid,
  PasswordIsValid_ErrorMessage,
  UsernameIsValid,
} from '../../hooks/Validations';
import RNPickerSelect from 'react-native-picker-select';
import UICalendar from '../UI/UIDateTime/UICalendar';
import { CapitalizeWords } from '../../hooks/hooks';
import { DONE_ACCESSORY_ID } from '../UI/GlobalDoneBar';

export default function LFInput({
  keyboardType,
  typeInput = 'default',
  label,
  isPassword,
  onChangeText,
  onChangeIndex,
  placeholder,
  validations = [],
  items = [],
  description = '',
  defaultValue = '',
  value, // may be undefined (uncontrolled)
  iconFront,
  textIconFront,
  marginBottomInit,
  onlyRead,
  capitalizeTheWords,
  pingValidation,
  disableAccessoryBar = false,
}: {
  typeInput?: 'default' | 'dropdown' | 'textarea' | 'calendar';
  keyboardType?: KeyboardTypeOptions;
  isPassword?: boolean;
  label?: string;
  onChangeText?: (v: string) => void;
  onChangeIndex?: (v: number) => void;
  placeholder?: string;
  validations?: EInputValidation[];
  items?: IPickerOption[];
  description?: string;
  defaultValue?: string;
  value?: string;
  iconFront?: keyof typeof Ionicons.glyphMap;
  textIconFront?: string;
  marginBottomInit?: number;
  onlyRead?: boolean;
  capitalizeTheWords?: boolean;
  pingValidation?: boolean;
  disableAccessoryBar?: boolean;
}) {
  const [passwordEyeOff, set_passwordEyeOff] = useState(false);
  const [errorMessage, set_errorMessage] = useState('');
  const [RNPickerSelectDefaultValue, set_RNPickerSelectDefaultValue] =
    useState('');
  const [dropdownIndexSelected, set_dropdownIndexSelected] = useState(-1);

  // Local value for uncontrolled usage
  const [localValue, set_localValue] = useState<string>('');

  // Seed local value ONCE from defaultValue if the field is uncontrolled
  const isControlled = value !== undefined;
  useEffect(() => {
    if (!isControlled && defaultValue && localValue === '') {
      set_localValue(defaultValue);
    }
    if (
      isControlled &&
      value !== undefined &&
      value !== RNPickerSelectDefaultValue
    ) {
      set_RNPickerSelectDefaultValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, defaultValue, value]);

  const [iCanCheckValidation, setICanCheckValidation] = useState(false);
  useEffect(() => setICanCheckValidation(true), []);

  useEffect(() => {
    if (iCanCheckValidation)
      __CheckTheValidations(isControlled ? value! : localValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pingValidation]);

  const _keyboardType = (): KeyboardTypeOptions =>
    (keyboardType as KeyboardTypeOptions | undefined) ?? ('default' as const);

  // Local accessory for number/phone pads on iOS
  const needsLocalAccessory =
    Platform.OS === 'ios' &&
    ['number-pad', 'numeric', 'decimal-pad', 'phone-pad'].includes(
      String(_keyboardType()),
    );

  const localAccessoryId = useRef(
    needsLocalAccessory ? `lfinput-${Math.random().toString(36).slice(2)}` : '',
  ).current;

  const accessoryId = useMemo(
    () =>
      Platform.OS !== 'ios'
        ? undefined
        : disableAccessoryBar
        ? undefined
        : needsLocalAccessory
        ? localAccessoryId
        : DONE_ACCESSORY_ID,
    [needsLocalAccessory, localAccessoryId, disableAccessoryBar],
  );

  const pickerRef = useRef<any>(null);
  const handleArrowClick = () => {
    pickerRef.current?.togglePicker?.();
  };

  const __CheckTheValidations = (text: string) => {
    for (let i = 0; i < validations.length; i++) {
      if (validations[i] === EInputValidation.Required && text === '') {
        set_errorMessage(`This field is required.`);
        return;
      } else if (
        validations[i] === EInputValidation.Email &&
        !EmailIsValid(text)
      ) {
        set_errorMessage('Please enter a valid email address.');
        return;
      }
      if (
        validations[i] === EInputValidation.Password &&
        !PasswordIsValid(text)
      ) {
        set_errorMessage(PasswordIsValid_ErrorMessage(text));
        return;
      }
      if (
        validations[i] === EInputValidation.GreatThenZero &&
        !NumberIsGreatThenZero(text)
      ) {
        set_errorMessage(NumberIsGreatThenZero_ErrorMessage());
        return;
      }
      const username = UsernameIsValid(text);
      if (validations[i] === EInputValidation.Username && !username.valid) {
        set_errorMessage(username.message);
        return;
      }
    }
    set_errorMessage('');
  };

  const displayValue = isControlled ? value! : localValue;

  const handleChangeText = (text: string) => {
    onChangeText?.(text); // lift to parent if controlled
    if (!isControlled) set_localValue(text);
    // Only validate if pingValidation is true, not on every text change
    if (pingValidation) {
      __CheckTheValidations(text);
    } else {
      // Clear error message when user is typing (unless pingValidation is active)
      set_errorMessage('');
    }
  };

  const _input = () => {
    if (typeInput === 'calendar') {
      return <UICalendar set_currentDate={onChangeText} />;
    } else if (typeInput === 'dropdown') {
      return (
        <View>
          <RNPickerSelect
            ref={pickerRef}
            value={
              defaultValue !== undefined && RNPickerSelectDefaultValue === ''
                ? defaultValue
                : RNPickerSelectDefaultValue
            }
            onValueChange={(v, index: number) => {
              const stringValue = String(v ?? '');
              set_RNPickerSelectDefaultValue(stringValue);
              onChangeText?.(stringValue);
              onChangeIndex?.(index);
              __CheckTheValidations(stringValue);
              set_dropdownIndexSelected(index - 1);
            }}
            items={items}
            placeholder={
              placeholder !== '' ? { label: placeholder!, value: '' } : {}
            }
            useNativeAndroidPickerStyle={false}
            doneText="Done"
            onDonePress={() => Keyboard.dismiss()}
            style={{
              done: { color: BaseColors.light, fontSize: 17 },
              modalViewMiddle: {
                backgroundColor: BaseColors.dark,
                borderTopColor: BaseColors.secondary,
              },
              viewContainer: {
                backgroundColor: BaseColors.dark,
                paddingVertical: 0,
              },
            }}
            pickerProps={{
              mode: 'dropdown',
              itemStyle: {
                color: BaseColors.light,
                backgroundColor: BaseColors.dark,
                fontSize: TextsSizes.p,
              },
            }}
            Icon={() => (
              <Ionicons
                name="chevron-down"
                size={15}
                color={BaseColors.light}
              />
            )}
            fixAndroidTouchableBug={true}
          >
            <TouchableOpacity
              onPress={handleArrowClick}
              style={[
                StyleZ.loginFormInput,
                _frontIconWidth() > 0
                  ? { paddingLeft: _frontIconWidth() + 5 }
                  : null,
                {
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                  position: 'relative',
                },
                errorMessage !== '' ? { borderColor: BaseColors.danger } : null,
              ]}
            >
              <View>
                <Text
                  style={{
                    color: BaseColors.othertexts,
                    fontSize: TextsSizes.p,
                  }}
                >
                  {((): string => {
                    const text: string =
                      defaultValue !== undefined &&
                      RNPickerSelectDefaultValue === ''
                        ? defaultValue
                        : RNPickerSelectDefaultValue;
                    if (
                      items[dropdownIndexSelected] === undefined &&
                      placeholder
                    )
                      return placeholder;
                    if (items.length > 0 && items[dropdownIndexSelected]?.label)
                      return items[dropdownIndexSelected].label;
                    if (text !== '') return text;
                    if (text === '' && placeholder) return placeholder;
                    return '';
                  })()}
                </Text>
              </View>
              <View>
                <Ionicons
                  name="chevron-down"
                  size={TextsSizes.p}
                  color={BaseColors.othertexts}
                />
              </View>
            </TouchableOpacity>
          </RNPickerSelect>
        </View>
      );
    }

    // --- Text / Textarea / Phone ---

    const baseInputStyle = [
      StyleZ.loginFormInput,
      _frontIconWidth() > 0 ? { paddingLeft: _frontIconWidth() + 5 } : null,
      onlyRead === true ? StyleZ.loginFormInput_onlyRead : null,
      errorMessage !== '' ? { borderColor: BaseColors.danger } : null,
    ] as any;

    const commonProps = {
      // IMPORTANT: keep this controlled and stable
      value: displayValue,
      // never pass defaultValue to TextInput (prevents controlled/uncontrolled swaps)
      placeholder: placeholder ?? '',
      placeholderTextColor: BaseColors.othertexts,
      onChangeText: handleChangeText,
      returnKeyType: 'done' as const,
      keyboardAppearance: 'dark' as const,
      secureTextEntry: isPassword === true && !passwordEyeOff,
      autoCorrect: false,
      autoCapitalize: 'none' as const,
      // Android: avoid fullscreen editor overlay
      disableFullscreenUI: true,
      // FIXED: Disable autofill to prevent flickering
      importantForAutofill: 'no' as const,
      autoComplete: 'off' as const,
      textContentType: 'none' as const,
      editable: !(onlyRead === true),
      style: baseInputStyle,
      onBlur: () => {
        if (
          displayValue !== '' &&
          onChangeText &&
          capitalizeTheWords === true
        ) {
          onChangeText(CapitalizeWords(displayValue));
        }
      },
      // Conditionally add inputAccessoryViewID only when not disabled
      ...(disableAccessoryBar ? {} : { inputAccessoryViewID: accessoryId }),
    };

    if (typeInput === 'textarea') {
      return (
        <TextInput
          {...commonProps}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          keyboardType={_keyboardType()}
          style={[baseInputStyle, StyleZ.loginFormInput_Textarea]}
        />
      );
    }

    if (_keyboardType() === 'phone-pad') {
      return (
        <TextInput
          {...commonProps}
          keyboardType={_keyboardType()}
          // FIXED: Remove autofill for phone numbers to prevent flickering
          textContentType="none"
          autoComplete="off"
        />
      );
    }

    return (
      <TextInput
        {...commonProps}
        keyboardType={
          Platform.OS === 'ios' && _keyboardType() === 'numeric'
            ? ('number-pad' as const)
            : _keyboardType()
        }
      />
    );
  };

  const _TheEyeButton = () => (
    <TouchableOpacity
      onPress={() => set_passwordEyeOff(!passwordEyeOff)}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingInline: 15,
        backgroundColor: 'transparent',
      }}
    >
      <Ionicons
        style={{ color: BaseColors.othertexts, fontSize: 15 }}
        name={passwordEyeOff ? 'eye-off' : 'eye'}
      />
    </TouchableOpacity>
  );

  const _frontIconWidth = () =>
    iconFront !== undefined || textIconFront !== undefined
      ? BasePaddingsMargins.m35
      : 0;

  const _frontIcon = () =>
    iconFront !== undefined || textIconFront !== undefined ? (
      <View
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: BasePaddingsMargins.m5,
          pointerEvents: 'none',
          left: 0,
          top: 0,
          width: _frontIconWidth(),
          height: '100%',
          zIndex: 100,
        }}
      >
        {textIconFront ? (
          <Text
            style={{
              fontSize: TextsSizes.p,
              fontWeight: 'bold',
              color: BaseColors.othertexts,
              paddingRight: 3,
            }}
          >
            {textIconFront}
          </Text>
        ) : (
          <Ionicons
            name={iconFront!}
            size={TextsSizes.p}
            color={BaseColors.othertexts}
          />
        )}
      </View>
    ) : null;

  return (
    <View
      style={[
        StyleZ.loginFormInputHolder,
        marginBottomInit !== undefined
          ? { marginBottom: marginBottomInit }
          : null,
        onlyRead === true ? StyleZ.loginFormInputHolder_onlyRead : null,
      ]}
    >
      {label ? <Text style={StyleZ.loginFormInputLabel}>{label}</Text> : null}

      <View style={{ position: 'relative' }}>
        {_frontIcon()}
        {_input()}
        {isPassword === true ? _TheEyeButton() : null}
      </View>

      {description ? (
        <Text
          style={[
            StyleZ.loginFormInputLabel,
            {
              fontWeight: 'regular',
              fontSize: TextsSizes.p,
              paddingTop: BasePaddingsMargins.m5,
              width: '100%',
            },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {errorMessage !== '' ? (
        <Text style={StyleZ.LFErrorMessage}>{errorMessage}</Text>
      ) : null}

      {/* Local bar for number/phone inputs on iOS */}
      {needsLocalAccessory && !disableAccessoryBar ? (
        <InputAccessoryView nativeID={localAccessoryId}>
          <View
            style={{
              backgroundColor: BaseColors.dark,
              borderTopWidth: 1,
              borderTopColor: BaseColors.secondary,
              paddingHorizontal: BasePaddingsMargins.m15,
              paddingVertical: BasePaddingsMargins.m10,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: BaseColors.primary,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      ) : null}
      {/* Disable the default accessory bar on iOS */}
      {Platform.OS === 'ios' && !needsLocalAccessory && !disableAccessoryBar ? (
        <InputAccessoryView nativeID={DONE_ACCESSORY_ID}>
          <View style={{ height: 0, width: 0 }} />
        </InputAccessoryView>
      ) : null}
    </View>
  );
}
