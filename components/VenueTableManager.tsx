import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { BaseColors } from '../hooks/Template';
import {
  IVenueTable,
  ETableSizes,
  ItemsTableSizes,
  TableBrands,
  ETableBrands,
} from '../hooks/InterfacesGlobal';

interface VenueTableManagerProps {
  tables: Omit<IVenueTable, 'id' | 'venue_id' | 'created_at' | 'updated_at'>[];
  onTablesChange: (
    tables: Omit<
      IVenueTable,
      'id' | 'venue_id' | 'created_at' | 'updated_at'
    >[],
  ) => void;
}

const VenueTableManager: React.FC<VenueTableManagerProps> = ({
  tables,
  onTablesChange,
}) => {
  const addTable = () => {
    const newTable: Omit<
      IVenueTable,
      'id' | 'venue_id' | 'created_at' | 'updated_at'
    > = {
      table_size: ETableSizes.TableSize_9ft,
      table_brand: ETableBrands.Diamond,
      count: 1,
    };
    onTablesChange([...tables, newTable]);
  };

  const removeTable = (index: number) => {
    const updatedTables = tables.filter((_, i) => i !== index);
    onTablesChange(updatedTables);
  };

  const updateTable = (
    index: number,
    field: keyof Omit<
      IVenueTable,
      'id' | 'venue_id' | 'created_at' | 'updated_at'
    >,
    value: string | number,
  ) => {
    const updatedTables = [...tables];
    if (field === 'table_size') {
      updatedTables[index] = {
        ...updatedTables[index],
        table_size: value as ETableSizes,
      };
    } else if (field === 'table_brand') {
      updatedTables[index] = {
        ...updatedTables[index],
        table_brand: value as string,
      };
    } else if (field === 'count') {
      updatedTables[index] = {
        ...updatedTables[index],
        count: value as number,
      };
    }
    onTablesChange(updatedTables);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Header with Add Button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
          Tables ({tables.length})
        </Text>
        <TouchableOpacity
          onPress={addTable}
          style={{
            backgroundColor: '#3b82f6',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            + Add Table
          </Text>
        </TouchableOpacity>
      </View>

      {tables.length === 0 ? (
        <View
          style={{
            padding: 20,
            backgroundColor: '#16171a',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 14 }}>
            No tables added yet. Click "Add Table" to get started.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ maxHeight: 250 }}
          showsVerticalScrollIndicator={false}
        >
          {tables.map((table, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#16171a',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
                padding: 16,
                marginBottom: 12,
              }}
            >
              {/* Table Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: 'white', fontWeight: '600', fontSize: 16 }}
                >
                  Table {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => removeTable(index)}
                  style={{
                    backgroundColor: '#dc2626',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{ color: 'white', fontSize: 12, fontWeight: '600' }}
                  >
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Table Size and Brand Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#9ca3af',
                      marginBottom: 6,
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                  >
                    Table Size
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      backgroundColor: '#1f2937',
                      minHeight: 44,
                    }}
                  >
                    <Picker
                      selectedValue={table.table_size}
                      onValueChange={(value) =>
                        updateTable(index, 'table_size', value)
                      }
                      style={{ color: 'white', height: 44 }}
                      dropdownIconColor="white"
                    >
                      {ItemsTableSizes.map((size) => (
                        <Picker.Item
                          key={size.value}
                          label={size.label}
                          value={size.value}
                          color="white"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#9ca3af',
                      marginBottom: 6,
                      fontSize: 14,
                      fontWeight: '500',
                    }}
                  >
                    Brand
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      backgroundColor: '#1f2937',
                      minHeight: 44,
                    }}
                  >
                    <Picker
                      selectedValue={table.table_brand || ETableBrands.Diamond}
                      onValueChange={(value) =>
                        updateTable(index, 'table_brand', value)
                      }
                      style={{ color: 'white', height: 44 }}
                      dropdownIconColor="white"
                    >
                      {TableBrands.map((brand) => (
                        <Picker.Item
                          key={brand.value}
                          label={brand.label}
                          value={brand.value}
                          color="white"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              {/* Count Row */}
              <View>
                <Text
                  style={{
                    color: '#9ca3af',
                    marginBottom: 6,
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  Count
                </Text>
                <TextInput
                  value={table.count?.toString() || '1'}
                  onChangeText={(text) => {
                    const count = parseInt(text) || 1;
                    if (count > 0 && count <= 99) {
                      updateTable(index, 'count', count);
                    }
                  }}
                  placeholder="Number of tables"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  style={{
                    color: 'white',
                    borderWidth: 1,
                    borderColor: BaseColors.PanelBorderColor,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: '#1f2937',
                    fontSize: 16,
                    minHeight: 44,
                  }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default VenueTableManager;
