/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as auth from "firebase-functions/v1/auth";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";
import {https} from "firebase-functions";

const RAW_VIDEO_BUCKET_NAME = "nd-youtube-clone-raw-videos";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

// triggered by signInWithGoogle function in web client (see react code)
export const createUser = auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(userInfo.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

// note: this function requires the service account associated with this function to:
// 1. have access to cloud storage bucket
// 2. and its own permissions Role to be a Token Creator
export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  // Check if user is authenticated
  const auth = request.auth;

  if (!request.auth) {
    throw new https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated"
    );
  }

  const data = request.data;
  const bucket = storage.bucket(RAW_VIDEO_BUCKET_NAME);

  // Generate a unique filename for upload
  const fileName = `${auth?.uid}-${Date.now()}.${data.fileExtension}`;

  // Get a v4 signed URL for uploading file
  const [url] = await bucket
    .file(fileName)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

  return {url, fileName};
});
