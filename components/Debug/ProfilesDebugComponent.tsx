import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../../ApiSupabase/supabase';
import {
  fetchProfilesSimple,
  fetchProfilesNoStatus,
  testSpecificUsernames,
} from '../../ApiSupabase/SimpleProfilesFetch';
import {
  checkUsernameAvailability,
  checkEmailAvailability,
} from '../../ApiSupabase/CrudUser';

export default function ProfilesDebugComponent() {
  const [debugResults, setDebugResults] = useState<string>('');

  const addLog = (message: string) => {
    console.log(message);
    setDebugResults((prev) => prev + '\n' + message);
  };

  const runDebugTests = async () => {
    setDebugResults('=== PROFILES DEBUG TESTS ===');

    try {
      // Test 1: Simple profiles fetch
      addLog('\n1. Testing simple profiles fetch...');
      const simpleResult = await fetchProfilesSimple();
      addLog(`Simple fetch: ${simpleResult.data?.length || 0} profiles found`);

      if (simpleResult.data && simpleResult.data.length > 0) {
        addLog(
          `Sample: "${simpleResult.data[0].user_name}" - ${simpleResult.data[0].email}`,
        );
      }

      // Test 2: No status filter
      addLog('\n2. Testing profiles without status filter...');
      const noStatusResult = await fetchProfilesNoStatus();
      addLog(
        `No status filter: ${noStatusResult.data?.length || 0} profiles found`,
      );

      // Test 3: Direct Supabase query
      addLog('\n3. Testing direct Supabase query...');
      const { data: directData, error: directError } = await supabase
        .from('profiles')
        .select('user_name, email')
        .limit(5);

      addLog(`Direct query: ${directData?.length || 0} profiles found`);
      if (directError) {
        addLog(`Direct query error: ${directError.message}`);
      }

      // Test 4: Test specific usernames
      addLog('\n4. Testing specific usernames...');
      await testSpecificUsernames();

      // Test 5: Test validation functions
      addLog('\n5. Testing validation functions...');
      const usernameTest = await checkUsernameAvailability('tyelerr');
      addLog(
        `Username "tyelerr" available: ${usernameTest.available} - ${usernameTest.message}`,
      );

      const emailTest = await checkEmailAvailability('tyelerr@yahoo.com');
      addLog(
        `Email "tyelerr@yahoo.com" available: ${emailTest.available} - ${emailTest.message}`,
      );
    } catch (error) {
      addLog(`Error in debug tests: ${error}`);
    }
  };

  const clearLogs = () => {
    setDebugResults('');
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Profiles Debug Component
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={runDebugTests}
          style={{
            backgroundColor: '#007bff',
            padding: 10,
            borderRadius: 5,
            marginRight: 10,
          }}
        >
          <Text style={{ color: 'white' }}>Run Debug Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearLogs}
          style={{
            backgroundColor: '#6c757d',
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: 'white' }}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{
          backgroundColor: '#000',
          padding: 10,
          borderRadius: 5,
          maxHeight: 400,
        }}
      >
        <Text
          style={{
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {debugResults || 'Click "Run Debug Tests" to start...'}
        </Text>
      </ScrollView>
    </View>
  );
}
