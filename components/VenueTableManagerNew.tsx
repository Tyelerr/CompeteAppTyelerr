import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
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

interface DropdownModalProps {
  visible: boolean;
  onClose: () => void;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  title: string;
}

const DropdownModal: React.FC<DropdownModalProps> = ({
  visible,
  onClose,
  options,
  onSelect,
  title,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: '#141416',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            maxWidth: 280,
            width: '100%',
            maxHeight: 350,
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.PanelBorderColor,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
                style={{
                  padding: 14,
                  borderBottomWidth: 0.5,
                  borderBottomColor: BaseColors.PanelBorderColor,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 15,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const VenueTableManager: React.FC<VenueTableManagerProps> = ({
  tables,
  onTablesChange,
}) => {
  const [sizeDropdownVisible, setSizeDropdownVisible] = useState(false);
  const [brandDropdownVisible, setBrandDropdownVisible] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState<number | null>(null);
  const [customBrandModalVisible, setCustomBrandModalVisible] = useState(false);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [customSizeModalVisible, setCustomSizeModalVisible] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState('');

  const addTable = () => {
    const newTable: Omit<
      IVenueTable,
      'id' | 'venue_id' | 'created_at' | 'updated_at'
    > = {
      table_size: ETableSizes.TableSize_9ft,
      table_brand: ETableBrands.Diamond,
      count: undefined, // Start with empty quantity for user input
    };
    // Add table immediately for responsive UI
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

  const openSizeDropdown = (index: number) => {
    setActiveTableIndex(index);
    setSizeDropdownVisible(true);
  };

  const openBrandDropdown = (index: number) => {
    setActiveTableIndex(index);
    setBrandDropdownVisible(true);
  };

  const handleSizeSelect = (value: string) => {
    if (activeTableIndex !== null) {
      if (value === ETableSizes.Custom) {
        // Show custom size input modal
        setCustomSizeInput('');
        setCustomSizeModalVisible(true);
      } else {
        updateTable(activeTableIndex, 'table_size', value);
      }
    }
  };

  const handleCustomSizeSubmit = () => {
    if (activeTableIndex !== null && customSizeInput.trim()) {
      updateTable(activeTableIndex, 'table_size', customSizeInput.trim());
      setCustomSizeModalVisible(false);
      setCustomSizeInput('');
    }
  };

  const handleBrandSelect = (value: string) => {
    if (activeTableIndex !== null) {
      if (value === ETableBrands.Other) {
        // Show custom brand input modal
        setCustomBrandInput('');
        setCustomBrandModalVisible(true);
      } else {
        updateTable(activeTableIndex, 'table_brand', value);
      }
    }
  };

  const handleCustomBrandSubmit = () => {
    if (activeTableIndex !== null && customBrandInput.trim()) {
      updateTable(activeTableIndex, 'table_brand', customBrandInput.trim());
      setCustomBrandModalVisible(false);
      setCustomBrandInput('');
    }
  };

  const getSizeLabel = (size: ETableSizes) => {
    const sizeOption = ItemsTableSizes.find((item) => item.value === size);
    return sizeOption ? sizeOption.label : size;
  };

  const getBrandLabel = (brand?: string) => {
    const brandOption = TableBrands.find((item) => item.value === brand);
    return brandOption ? brandOption.label : brand || 'Diamond';
  };

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Header Section */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingTop: 8,
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
          Pool Tables ({tables.length})
        </Text>
        <TouchableOpacity
          onPress={addTable}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
            + Add Table
          </Text>
        </TouchableOpacity>
      </View>

      {tables.length === 0 ? (
        <View
          style={{
            padding: 16,
            backgroundColor: '#1f2937',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 13 }}>
            No tables added yet. Click "Add Table" to get started.
          </Text>
        </View>
      ) : (
        <View>
          {tables.map((table, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#1f2937',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
                padding: 12,
                marginBottom: 8,
              }}
            >
              {/* Compact Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: 'white', fontWeight: '600', fontSize: 14 }}
                >
                  Table {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => removeTable(index)}
                  style={{
                    backgroundColor: '#dc2626',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{ color: 'white', fontSize: 11, fontWeight: '600' }}
                  >
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Compact Three-Column Layout */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Size Column */}
                <View style={{ flex: 2 }}>
                  <Text
                    style={{
                      color: '#9ca3af',
                      marginBottom: 4,
                      fontSize: 12,
                      fontWeight: '500',
                    }}
                  >
                    Size
                  </Text>
                  <TouchableOpacity
                    onPress={() => openSizeDropdown(index)}
                    style={{
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 6,
                      backgroundColor: '#374151',
                      minHeight: 36,
                      paddingHorizontal: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                    >
                      {getSizeLabel(table.table_size)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Brand Column */}
                <View style={{ flex: 2 }}>
                  <Text
                    style={{
                      color: '#9ca3af',
                      marginBottom: 4,
                      fontSize: 12,
                      fontWeight: '500',
                    }}
                  >
                    Brand
                  </Text>
                  <TouchableOpacity
                    onPress={() => openBrandDropdown(index)}
                    style={{
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 6,
                      backgroundColor: '#374151',
                      minHeight: 36,
                      paddingHorizontal: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                    >
                      {getBrandLabel(table.table_brand)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Count Column */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#9ca3af',
                      marginBottom: 4,
                      fontSize: 12,
                      fontWeight: '500',
                    }}
                  >
                    Qty
                  </Text>
                  <TextInput
                    value={table.count ? Number(table.count).toString() : ''}
                    onChangeText={(text) => {
                      if (text === '') {
                        // Set to 1 instead of undefined to prevent database errors
                        updateTable(index, 'count', 1);
                      } else {
                        // Remove any leading zeros and parse as number
                        const numericText = text.replace(/^0+/, '') || '0';
                        const count = parseInt(numericText);
                        if (!isNaN(count) && count > 0 && count <= 99) {
                          updateTable(index, 'count', count);
                        }
                      }
                    }}
                    onBlur={() => {
                      // Ensure count is always at least 1
                      if (!table.count || table.count < 1) {
                        updateTable(index, 'count', 1);
                      }
                    }}
                    placeholder="Qty"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    style={{
                      color: 'white',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      backgroundColor: '#374151',
                      fontSize: 14,
                      minHeight: 36,
                      textAlign: 'center',
                      fontWeight: '500',
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Size Dropdown Modal */}
      <DropdownModal
        visible={sizeDropdownVisible}
        onClose={() => setSizeDropdownVisible(false)}
        options={ItemsTableSizes}
        onSelect={handleSizeSelect}
        title="Select Table Size"
      />

      {/* Brand Dropdown Modal */}
      <DropdownModal
        visible={brandDropdownVisible}
        onClose={() => setBrandDropdownVisible(false)}
        options={TableBrands}
        onSelect={handleBrandSelect}
        title="Select Table Brand"
      />

      {/* Custom Brand Input Modal */}
      <Modal visible={customBrandModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setCustomBrandModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#141416',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              maxWidth: 320,
              width: '100%',
              padding: 20,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Enter Custom Brand
            </Text>

            <TextInput
              value={customBrandInput}
              onChangeText={setCustomBrandInput}
              placeholder="Enter table brand name"
              placeholderTextColor="#9ca3af"
              autoFocus={true}
              style={{
                color: 'white',
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 20,
                backgroundColor: '#374151',
                fontSize: 15,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleCustomBrandSubmit}
                disabled={!customBrandInput.trim()}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: customBrandInput.trim()
                    ? '#10b981'
                    : '#6b7280',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Add Brand
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCustomBrandModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: '#dc2626',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Size Input Modal */}
      <Modal visible={customSizeModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setCustomSizeModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#141416',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              maxWidth: 320,
              width: '100%',
              padding: 20,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Enter Custom Table Size
            </Text>

            <TextInput
              value={customSizeInput}
              onChangeText={setCustomSizeInput}
              placeholder="e.g., 6ft, 11ft, 4.5x9, etc."
              placeholderTextColor="#9ca3af"
              autoFocus={true}
              style={{
                color: 'white',
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 20,
                backgroundColor: '#374151',
                fontSize: 15,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleCustomSizeSubmit}
                disabled={!customSizeInput.trim()}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: customSizeInput.trim()
                    ? '#10b981'
                    : '#6b7280',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Add Size
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCustomSizeModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: '#dc2626',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default VenueTableManager;
