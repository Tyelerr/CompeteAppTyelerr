const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  'screens',
  'BarOwner',
  'ScreenBarOwnerDashboard.tsx',
);

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add Pressable to imports
console.log('Step 1: Adding Pressable to imports...');
content = content.replace(
  `import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';`,
  `import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  RefreshControl,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';`,
);

// Step 2: Fix Tournament Directors Modal
console.log('Step 2: Fixing Tournament Directors Modal...');
content = content.replace(
  `      {/* Tournament Directors Modal */}
      <Modal visible={showDirectorsModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setShowDirectorsModal(false)}
        >
          <View`,
  `      {/* Tournament Directors Modal */}
      <Modal visible={showDirectorsModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setShowDirectorsModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}`,
);

// Find and replace the closing tags for Tournament Directors Modal
content = content.replace(
  `            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add New Tournament Director Modal */}`,
  `            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add New Tournament Director Modal */}`,
);

// Step 3: Fix Add Tournament Director Modal
console.log('Step 3: Fixing Add Tournament Director Modal...');
content = content.replace(
  `      {/* Add New Tournament Director Modal */}
      <Modal visible={showAddDirectorModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setShowAddDirectorModal(false)}
        >
          <View`,
  `      {/* Add New Tournament Director Modal */}
      <Modal visible={showAddDirectorModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setShowAddDirectorModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}`,
);

// Find and replace the closing tags for Add Tournament Director Modal
content = content.replace(
  `            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Confirmation Modal */}`,
  `            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Confirmation Modal */}`,
);

// Step 4: Fix Confirmation Modal
console.log('Step 4: Fixing Confirmation Modal...');
content = content.replace(
  `      {/* Custom Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={handleCancelConfirmation}
        >
          <View`,
  `      {/* Custom Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={handleCancelConfirmation}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}`,
);

// Find and replace the closing tags for Confirmation Modal
content = content.replace(
  `            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Venue Selection Modal */}`,
  `            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Venue Selection Modal */}`,
);

// Step 5: Fix Venue Selection Modal
console.log('Step 5: Fixing Venue Selection Modal...');
content = content.replace(
  `      {/* Venue Selection Modal */}
      <Modal visible={showVenueSelection} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={handleCancelVenueSelection}
        >
          <View`,
  `      {/* Venue Selection Modal */}
      <Modal visible={showVenueSelection} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={handleCancelVenueSelection}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}`,
);

// Find and replace the closing tags for Venue Selection Modal
content = content.replace(
  `            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Venue Modal */}`,
  `            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Venue Modal */}`,
);

// Write the fixed content back
console.log('Writing fixed content...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fix applied successfully!');
console.log('\nChanges made:');
console.log('1. Added Pressable to imports');
console.log('2. Fixed Tournament Directors Modal backdrop');
console.log('3. Fixed Add Tournament Director Modal backdrop');
console.log('4. Fixed Confirmation Modal backdrop');
console.log('5. Fixed Venue Selection Modal backdrop');
