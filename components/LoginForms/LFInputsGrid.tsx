import { Text, View } from 'react-native';
import LFButton from './Button/LFButton';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import LFInput from './LFInput';
import { StyleZTable } from '../../assets/css/styles';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export interface ILFInputGridInput {
  label: string;
  value?: string;
  placeholder?: string;
  textIconFront?: string;
}

export interface ILFInputsGrid {
  inputs: ILFInputGridInput[];
}

/**
 * It have title and button for adding inputs as a table.
 * Each row have option to delete the input
 */
export default function LFInputsGrid({
  label,
  labelAdd,
  // inputs_grid_values
  inputs,
  rows_data,
  set_rows_data,
}: {
  label: string;
  labelAdd: string;
  // inputs_grid_values: ILFInputsGrid
  inputs: ILFInputGridInput[];
  rows_data: ILFInputGridInput[][];
  set_rows_data: (td: ILFInputGridInput[][]) => void;
}) {
  /**
   * This is the init values
   */
  // const inputs_grid_values = [];
  /**
   * This is the definition of the inputs
   */
  /*const inputs:ILFInputGridInput[] = [
    {label: 'Name', value: ''},
    {label: 'Fee', value: ''},
  ];*/
  /*const rows_data = [
    {

    },
    {

    },
    {

    },
  ];*/

  // const [rows_data, set_rows_data] = useState<ILFInputGridInput[][]>([]);
  const AddNewRow = () => {
    rows_data.push(inputs);
    /*rows_data.push({
      inputs:inputs
    } as ILFInputsGrid);*/
    set_rows_data([...rows_data]);
  };
  const DeleteRow = (n: number) => {
    rows_data.splice(n, 1);
    set_rows_data([...rows_data]);
  };

  const _xCellWidth = (): number => {
    return 10;
  };
  const _CellWidth = (): number => {
    return (100 - _xCellWidth()) / inputs.length;
  };

  return (
    <View
      style={{
        marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: BasePaddingsMargins.m15,
        }}
      >
        <Text
          style={{
            color: BaseColors.othertexts,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            width: 140,
          }}
        >
          <LFButton
            type="secondary"
            icon="add"
            label={labelAdd}
            size="small"
            onPress={() => {
              AddNewRow();
            }}
          />
        </View>
      </View>

      <View
        style={[
          StyleZTable.container,
          rows_data.length > 0 ? null : { display: 'none' },
        ]}
      >
        <View
          style={[
            StyleZTable.row,
            {
              // backgroundColor: 'yellow'
            },
          ]}
        >
          {inputs.map((inputObj, key_input) => {
            return (
              <View
                key={`grid-row-${key_input}`}
                style={[
                  StyleZTable.cell,
                  key_input === 0 ? StyleZTable.cellFirst : null,
                  {
                    width: `${_CellWidth()}%`,
                  },
                ]}
              >
                <Text
                  style={[
                    StyleZTable.headerTexts,
                    {
                      // color: 'white',
                      // backgroundColor: 'yellow'
                    },
                  ]}
                >
                  {inputObj.label}
                </Text>
              </View>
            );
          })}
        </View>
        {rows_data.map((obj, key) => {
          return (
            <View key={`grid-row-${key}`} style={[StyleZTable.row]}>
              {inputs.map((inputObj: ILFInputGridInput, key_input) => {
                return (
                  <View
                    key={`input-holder-${key}-${key_input}`}
                    style={[
                      StyleZTable.cell,
                      key_input === 0 ? StyleZTable.cellFirst : null,
                      {
                        width: `${_CellWidth()}%`,
                      },
                    ]}
                  >
                    <LFInput
                      keyboardType="default"
                      marginBottomInit={0}
                      defaultValue={''}
                      textIconFront={rows_data[key][key_input].textIconFront}
                      value={rows_data[key][key_input].value}
                      placeholder={
                        rows_data[key][key_input].placeholder !== undefined
                          ? rows_data[key][key_input].placeholder
                          : inputObj.placeholder !== undefined
                          ? inputObj.placeholder
                          : ''
                      }
                      onFocus={() => {
                        // Clear placeholder when user focuses on the input
                        if (
                          rows_data[key][key_input].placeholder !== undefined &&
                          rows_data[key][key_input].placeholder !== ''
                        ) {
                          const NewArray = JSON.parse(
                            JSON.stringify(rows_data),
                          );
                          NewArray[key][key_input].placeholder = '';
                          set_rows_data(NewArray);
                        }
                      }}
                      onChangeText={(text: string) => {
                        // set_username(text);
                        // // // // // // // // // // // console.log('rows_data before:', rows_data);
                        // // // // // // // // // // // console.log('rows_data[key] before:', rows_data[key]);
                        rows_data[key][key_input].value = text;
                        // // // // // // // // // // // console.log(`rows_data[${key}][${key_input}].value`, rows_data[key][key_input].value);
                        // // // // // // // // // // // console.log('rows_data[key] after:', rows_data[key]);
                        // // // // // // // // // // // console.log('rows_data:', rows_data);
                        const NewArray = JSON.parse(JSON.stringify(rows_data));
                        NewArray[key][key_input].value = text;
                        // // // // // // // // // // // console.log('rows_data:', rows_data);
                        //rows_data[key] = [...]
                        // // // // // // // // // // // console.log('New_rows_data:', New_rows_data);
                        set_rows_data(NewArray);
                        // setErrorForm('')
                        // // // // // // // // // // console.log('NewArray:', NewArray);
                      }}
                      validations={
                        [
                          // EInputValidation.Required,
                        ]
                      }
                    />
                  </View>
                );
              })}
              <View
                style={[
                  StyleZTable.cell,
                  StyleZTable.cellLast,
                  StyleZTable.cellCentered,
                  {
                    width: `${_xCellWidth()}%`,
                    // padding: 0
                  },
                ]}
              >
                <LFButton
                  size="small"
                  type="secondary"
                  icon="close"
                  onPress={() => {
                    DeleteRow(key);
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
