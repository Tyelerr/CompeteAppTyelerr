import { View, Text, TouchableOpacity } from 'react-native';
import { StyleZ } from '../../../assets/css/styles';
import { BasePaddingsMargins } from '../../../hooks/Template';
import { Ionicons } from '@expo/vector-icons';

export default function Pagination({
  totalCount,
  offset,
  countPerPage,
  FLoadDataByOffset,
  currentItemsCount,
  guardrailTriggered, // BUILD 204: Add this prop
}: {
  totalCount: number;
  offset: number;
  countPerPage: number;
  FLoadDataByOffset?: (n?: number) => void;
  currentItemsCount?: number;
  guardrailTriggered?: boolean; // BUILD 204: Add this prop
}) {
  const __totalPages = (): number => {
    return Math.ceil(totalCount / countPerPage);
  };

  const __currentPage = (): number => {
    return Math.floor(offset / countPerPage) + 1;
  };

  const __displayRange = (): string => {
    // BUILD 200 FIX: Only check currentItemsCount (actual items on page)
    // Don't check totalCount - it might be 0 due to state timing issues
    if (currentItemsCount !== undefined && currentItemsCount === 0) {
      return '0-0';
    }

    // If we have items, always show the range based on actual items
    const start = offset + 1;
    const end = currentItemsCount
      ? offset + currentItemsCount
      : Math.min(offset + countPerPage, totalCount);
    return `${start}-${end}`;
  };

  return (
    <View
      style={[
        {
          marginBottom: BasePaddingsMargins.m15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 40,
        },
      ]}
    >
      <Text style={StyleZ.p}>
        Total count: {totalCount} Displaying {__displayRange()}
      </Text>

      {(() => {
        // BUILD 204: Smart arrow logic that works with fallback counts
        const hasPrev = offset > 0;
        const hasNextReal = offset + (currentItemsCount || 0) < totalCount;
        const hasMoreGuess = (currentItemsCount || 0) === countPerPage;
        const hasNext = guardrailTriggered ? hasMoreGuess : hasNextReal;
        const showArrows = hasPrev || hasNext;

        return showArrows ? (
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
          >
            <TouchableOpacity
              disabled={!hasPrev}
              onPress={() => {
                if (FLoadDataByOffset !== undefined) {
                  const newOffset = offset - countPerPage;
                  FLoadDataByOffset(newOffset >= 0 ? newOffset : 0);
                }
              }}
              style={[StyleZ.pageArrow, !hasPrev && StyleZ.pageArrowDisabled]}
            >
              <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <Text style={[StyleZ.pageText]}>
              Page {__currentPage()} / {__totalPages()}
            </Text>
            <TouchableOpacity
              disabled={!hasNext}
              onPress={() => {
                if (FLoadDataByOffset !== undefined && hasNext) {
                  const newOffset = offset + countPerPage;
                  FLoadDataByOffset(newOffset);
                }
              }}
              style={[StyleZ.pageArrow, !hasNext && StyleZ.pageArrowDisabled]}
            >
              <Ionicons name="chevron-forward" size={20} color="#60A5FA" />
            </TouchableOpacity>
          </View>
        ) : null;
      })()}
    </View>
  );
}
