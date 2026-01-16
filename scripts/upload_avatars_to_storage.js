const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
);

async function uploadAvatars() {
  console.log('Starting avatar upload to Supabase Storage...');

  const avatarsDir = path.join(__dirname, '../assets/avatars');
  const avatarFiles = [
    'avatar1.jpg',
    'avatar2.jpg',
    'avatar3.jpg',
    'avatar4.jpg',
    'avatar5.jpg',
  ];

  try {
    // Create avatars bucket if it doesn't exist
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const avatarsBucket = buckets.find((bucket) => bucket.name === 'avatars');

    if (!avatarsBucket) {
      console.log('Creating avatars bucket...');
      const { data, error } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      console.log('Avatars bucket created successfully');
    } else {
      console.log('Avatars bucket already exists');
    }

    // Upload each avatar file
    for (const filename of avatarFiles) {
      const filePath = path.join(avatarsDir, filename);

      if (!fs.existsSync(filePath)) {
        console.log(`File ${filename} not found, skipping...`);
        continue;
      }

      console.log(`Uploading ${filename}...`);

      const fileBuffer = fs.readFileSync(filePath);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // Overwrite if exists
        });

      if (error) {
        console.error(`Error uploading ${filename}:`, error);
      } else {
        console.log(`Successfully uploaded ${filename}`);

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filename);

        console.log(`Public URL for ${filename}: ${urlData.publicUrl}`);
      }
    }

    console.log('Avatar upload process completed!');
  } catch (error) {
    console.error('Error during avatar upload:', error);
  }
}

// Run the upload
uploadAvatars();
