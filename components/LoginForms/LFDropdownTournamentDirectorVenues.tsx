import { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import {
  fetchVenuesForTournamentDirector,
  fetchVenueTableInfo,
} from '../../ApiSupabase/CrudVenues';
import { useContextAuth } from '../../context/ContextAuth';
import { IVenue, IVenueTable } from '../../hooks/InterfacesGlobal';
import LFInput from './LFInput';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { Ionicons } from '@expo/vector-icons';

interface VenueTableData {
  table_size: string;
  table_brand: string | null;
  count: number;
}

interface IPickerOption {
  label: string;
  value: string;
}

export default function LFDropdownTournamentDirectorVenues({
  onVenueChange,
  onTableSizeChange,
  onTableBrandChange,
  onTableCountChange,
  selectedVenueId,
  selectedTableSize,
  selectedTableBrand,
  selectedTableCount,
}: {
  onVenueChange?: (venue: IVenue) => void;
  onTableSizeChange?: (tableSize: string, availableCount: number) => void;
  onTableBrandChange?: (tableBrand: string) => void;
  onTableCountChange?: (count: number) => void;
  selectedVenueId?: number;
  selectedTableSize?: string;
  selectedTableBrand?: string;
  selectedTableCount?: number;
}) {
  const { user } = useContextAuth();

  const [venues, setVenues] = useState<IVenue[]>([]);
  const [venueItems, setVenueItems] = useState<IPickerOption[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<IVenue | null>(null);

  const [venueTables, setVenueTables] = useState<VenueTableData[]>([]);
  const [tableSizeItems, setTableSizeItems] = useState<IPickerOption[]>([]);
  const [tableBrandItems, setTableBrandItems] = useState<IPickerOption[]>([]);

  const [availableTableCount, setAvailableTableCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tablesLoadComplete, setTablesLoadComplete] = useState(false);

  // Load venues assigned to this tournament director
  const loadVenues = async () => {
    if (!user?.id_auto) return;

    setLoading(true);
    try {
      const { data, error } = await fetchVenuesForTournamentDirector(
        user.id_auto,
      );

      if (error) {
        console.error('Error loading TD venues:', error);
        return;
      }

      if (data && data.length > 0) {
        setVenues(data);

        // Create dropdown items for venues
        const venueDropdownItems: IPickerOption[] = data.map((venue) => ({
          label: venue.venue,
          value: venue.id.toString(),
        }));

        setVenueItems(venueDropdownItems);

        // If there's a selectedVenueId, find and set the venue
        if (selectedVenueId) {
          const venue = data.find((v) => v.id === selectedVenueId);
          if (venue) {
            setSelectedVenue(venue);
            await loadVenueTables(venue.id);
          }
        }
      } else {
        setVenues([]);
        setVenueItems([]);
      }
    } catch (error) {
      console.error('Exception loading TD venues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load table information for selected venue
  const loadVenueTables = async (venueId: number) => {
    setLoadingTables(true);
    setTablesLoadComplete(false);

    try {
      const { data, error } = await fetchVenueTableInfo(venueId);

      if (error) {
        console.error('Error loading venue tables:', error);
        setTablesLoadComplete(true);
        return;
      }

      if (data && data.length > 0) {
        setVenueTables(data);

        // Create unique table sizes
        const uniqueSizes = [...new Set(data.map((table) => table.table_size))];
        const sizeItems: IPickerOption[] = uniqueSizes.map((size) => ({
          label: size,
          value: size,
        }));
        setTableSizeItems(sizeItems);

        // If there's a selected table size, update brands and count
        if (selectedTableSize) {
          updateTableBrandsAndCount(selectedTableSize, data);
        }
      } else {
        setVenueTables([]);
        setTableSizeItems([]);
        setTableBrandItems([]);
        setAvailableTableCount(0);
      }
    } catch (error) {
      console.error('Exception loading venue tables:', error);
    } finally {
      setLoadingTables(false);
      setTablesLoadComplete(true);
    }
  };

  // Update available brands and count for selected table size
  const updateTableBrandsAndCount = (
    tableSize: string,
    tables: VenueTableData[],
  ) => {
    const tablesForSize = tables.filter(
      (table) => table.table_size === tableSize,
    );

    if (tablesForSize.length === 0) {
      setTableBrandItems([]);
      setAvailableTableCount(0);
      return;
    }

    // Get unique brands for this table size (filter out null values)
    const uniqueBrands = [
      ...new Set(
        tablesForSize
          .map((table) => table.table_brand)
          .filter((brand): brand is string => brand !== null),
      ),
    ];

    if (uniqueBrands.length === 0) {
      // No brands specified, just use the count
      const totalCount = tablesForSize.reduce(
        (sum, table) => sum + table.count,
        0,
      );
      setTableBrandItems([]);
      setAvailableTableCount(totalCount);

      // Notify parent of the available count
      if (onTableSizeChange) {
        onTableSizeChange(tableSize, totalCount);
      }
    } else if (uniqueBrands.length === 1) {
      // Only one brand, auto-select it
      const brand = uniqueBrands[0];
      const totalCount = tablesForSize
        .filter((table) => table.table_brand === brand)
        .reduce((sum, table) => sum + table.count, 0);

      setTableBrandItems([{ label: brand, value: brand }]);
      setAvailableTableCount(totalCount);

      // Auto-select the brand and notify parent
      if (onTableBrandChange) {
        onTableBrandChange(brand);
      }
      if (onTableSizeChange) {
        onTableSizeChange(tableSize, totalCount);
      }
    } else {
      // Multiple brands, let user choose
      const brandItems: IPickerOption[] = uniqueBrands.map((brand) => ({
        label: brand,
        value: brand,
      }));
      setTableBrandItems(brandItems);

      // If there's a selected brand, calculate count for that brand
      if (selectedTableBrand && uniqueBrands.includes(selectedTableBrand)) {
        const totalCount = tablesForSize
          .filter((table) => table.table_brand === selectedTableBrand)
          .reduce((sum, table) => sum + table.count, 0);
        setAvailableTableCount(totalCount);
      } else {
        setAvailableTableCount(0);
      }

      if (onTableSizeChange) {
        onTableSizeChange(tableSize, 0); // No count until brand is selected
      }
    }
  };

  // Handle venue selection
  const handleVenueChange = (venueId: string) => {
    const venue = venues.find((v) => v.id.toString() === venueId);
    if (venue) {
      setSelectedVenue(venue);

      // Reset table selections and loading states
      setTableSizeItems([]);
      setTableBrandItems([]);
      setAvailableTableCount(0);
      setTablesLoadComplete(false);

      loadVenueTables(venue.id);

      if (onVenueChange) {
        onVenueChange(venue);
      }
    }
  };

  // Handle table size selection
  const handleTableSizeChange = (tableSize: string) => {
    updateTableBrandsAndCount(tableSize, venueTables);
  };

  // Handle table brand selection
  const handleTableBrandChange = (brand: string) => {
    if (selectedTableSize) {
      const tablesForSizeAndBrand = venueTables.filter(
        (table) =>
          table.table_size === selectedTableSize && table.table_brand === brand,
      );
      const totalCount = tablesForSizeAndBrand.reduce(
        (sum, table) => sum + table.count,
        0,
      );
      setAvailableTableCount(totalCount);

      if (onTableBrandChange) {
        onTableBrandChange(brand);
      }
      if (onTableSizeChange) {
        onTableSizeChange(selectedTableSize, totalCount);
      }
    }
  };

  // Format the display text for available tables
  const formatAvailableTablesText = (
    count: number,
    size: string,
    brand?: string,
  ) => {
    // Ensure count is treated as a number to remove any leading zeros
    const numericCount = Number(count);
    const brandText = brand ? ` ${brand}` : '';
    const plural = numericCount === 1 ? '' : 's';
    return `${numericCount} ${size}${brandText}${plural} Available`;
  };

  // Validate table count input
  const validateTableCount = (
    inputCount: string,
  ): { isValid: boolean; errorMessage?: string } => {
    const count = parseInt(inputCount) || 0;

    if (count <= 0) {
      return {
        isValid: false,
        errorMessage: 'Please Enter A Valid Number Of Tables',
      };
    }

    if (count > availableTableCount) {
      // Ensure availableTableCount is treated as a number to remove leading zeros
      const numericAvailableCount = Number(availableTableCount);
      const brandText = selectedTableBrand ? ` ${selectedTableBrand}` : '';
      const plural = numericAvailableCount === 1 ? '' : 's';
      return {
        isValid: false,
        errorMessage: `Only ${Number(
          numericAvailableCount,
        )} ${selectedTableSize}${brandText}${plural} Available`,
      };
    }

    return { isValid: true };
  };

  useEffect(() => {
    loadVenues();
  }, [user]);

  // Return null if no venues are assigned - overlay is now handled at screen level
  if (venues.length === 0 && !loading) {
    return null;
  }

  if (loading) {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{ color: BaseColors.light, textAlign: 'center', padding: 16 }}
        >
          Loading your assigned venues...
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Venue Selection */}
      <LFInput
        label="*Select Venue"
        typeInput="dropdown"
        placeholder="Choose your venue"
        items={venueItems}
        value={selectedVenueId?.toString() || ''}
        onChangeText={handleVenueChange}
        marginBottomInit={10}
      />

      {/* Table Size Selection */}
      {selectedVenue && tableSizeItems.length > 0 && (
        <LFInput
          label="*Table Size"
          typeInput="dropdown"
          placeholder="Select table size first"
          items={tableSizeItems}
          value={selectedTableSize || ''}
          onChangeText={handleTableSizeChange}
          marginBottomInit={10}
        />
      )}

      {/* Table Brand Selection (only if multiple brands) */}
      {selectedTableSize && tableBrandItems.length > 1 && (
        <LFInput
          label="*Table Brand"
          typeInput="dropdown"
          placeholder="Select table brand"
          items={tableBrandItems}
          value={selectedTableBrand || ''}
          onChangeText={handleTableBrandChange}
          marginBottomInit={10}
        />
      )}

      {/* Available Table Count Display */}
      {selectedTableSize && availableTableCount > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: BaseColors.success, fontSize: 14 }}>
            ✓{' '}
            {formatAvailableTablesText(
              availableTableCount,
              selectedTableSize,
              selectedTableBrand,
            )}
          </Text>
        </View>
      )}

      {/* Table Count Selection */}
      {selectedTableSize && availableTableCount > 0 && (
        <View style={{ marginBottom: 10 }}>
          <LFInput
            label="*Number of Tables to Use"
            keyboardType="numeric"
            placeholder={`Enter Number (Max: ${Number(availableTableCount)})`}
            value={
              selectedTableCount && selectedTableCount > 0
                ? selectedTableCount.toString()
                : ''
            }
            onChangeText={(text: string) => {
              // Handle empty string (when user clears the field)
              if (text === '') {
                if (onTableCountChange) {
                  onTableCountChange(0);
                }
                return;
              }

              // Only allow numeric input
              const numericText = text.replace(/[^0-9]/g, '');
              let count = parseInt(numericText) || 0;

              // Auto-cap to maximum available tables
              if (count > availableTableCount) {
                count = Number(availableTableCount);
              }

              // Always update the display value for immediate feedback
              if (onTableCountChange) {
                onTableCountChange(count);
              }
            }}
            description={`Maximum Available: ${Number(
              availableTableCount,
            )} Tables`}
            marginBottomInit={0}
          />

          {/* Validation Error Message */}
          {selectedTableCount !== undefined &&
            selectedTableCount > 0 &&
            (() => {
              const validation = validateTableCount(
                selectedTableCount.toString(),
              );
              if (!validation.isValid) {
                return (
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ color: BaseColors.warning, fontSize: 12 }}>
                      ⚠️ {validation.errorMessage}
                    </Text>
                  </View>
                );
              }
              return (
                <View style={{ marginTop: 5 }}>
                  <Text style={{ color: BaseColors.success, fontSize: 14 }}>
                    ✓ {selectedTableCount} Table
                    {selectedTableCount !== 1 ? 's' : ''} Selected
                  </Text>
                </View>
              );
            })()}
        </View>
      )}

      {/* Guidance Messages */}
      {selectedVenue &&
        !loadingTables &&
        tablesLoadComplete &&
        tableSizeItems.length === 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: BaseColors.warning, fontSize: 14 }}>
              ⚠️ No tables configured for this venue. Contact the venue owner to
              add table information.
            </Text>
          </View>
        )}

      {selectedTableSize &&
        tableBrandItems.length > 1 &&
        !selectedTableBrand && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: BaseColors.warning, fontSize: 14 }}>
              ⚠️ Please select a table brand to see available count.
            </Text>
          </View>
        )}
    </View>
  );
}
