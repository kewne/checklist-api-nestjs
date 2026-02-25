#!/usr/bin/env tsx

import { FirebaseOptions, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  connectAuthEmulator,
} from 'firebase/auth';
import { password } from '@inquirer/prompts';

// Firebase configuration - replace with your project config
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

async function authenticateUser() {
  // Get email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: tsx scripts/get-user-token.ts <email>');
    process.exit(1);
  }
  if (!firebaseConfig.projectId) {
    console.error(
      'Please set FIREBASE_API_KEY and FIREBASE_PROJECT_ID environment variables',
    );
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig, 'auth-test-app');
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://localhost:9099');

  const userPassword = await password({
    message: 'Enter your password:',
    mask: true,
    validate: (value) => !!value,
  });

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    userPassword,
  );
  const user = userCredential.user;

  console.log('✅ Authentication successful!');
  console.log(`User ID: ${user.uid}`);
  console.log(`Email: ${user.email}`);
  console.log(`Email verified: ${user.emailVerified}`);

  // Get and display the ID token
  const idToken = await user.getIdToken();
  console.log('\n🔑 Full ID Token:');
  console.log(idToken);
}

// Run the authentication
authenticateUser()
  .then(() => {
    console.log('\n✨ Authentication test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
