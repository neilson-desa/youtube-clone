// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User, onAuthStateChanged } from "firebase/auth";
import {getFunctions, httpsCallable} from "@firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

const auth = getAuth(app);

// firebase configs in other file helps configure this functions variable automatically
const generateUploadUrlFunction = httpsCallable(functions, 'generateUploadUrl');
const getVideosFunction = httpsCallable(functions, 'getVideos');

/**
 * Signs the user in with a Google popup.
 * @returns A promise that resolves with the user's credentials.
 */
export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider())
}

/**
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */
export function signOut() {
    return auth.signOut();
}

/**
 * Trigger a callback when user auth state changes
 * @returns A function to unsubscribe callback.
 */
export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
}

export async function getVideos() {
    // need to add Math.random() otherwise this function returns same cached response for ages
    const response = await getVideosFunction({random: Math.random()});
    console.log('calling getVideo here, with this response: ' + JSON.stringify(response, null, 2));
    return response.data as Video[];
}

export async function uploadVideo(file: File) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await generateUploadUrlFunction({
        fileExtension: file.name.split('.').pop()
    });

    // Upload the file via the signed URL
    await fetch(response?.data?.url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
    })
    return;
}