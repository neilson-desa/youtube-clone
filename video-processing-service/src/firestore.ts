import { credential } from "firebase-admin";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";

// apparently only once firestore instance per gcp project, so default credential points to this and thus no custom config
initializeApp({credential: credential.applicationDefault()});

const firestore = new Firestore();

// Note: This requires setting an env variable in Cloud Run
/** if (process.env.NODE_ENV !== 'production') {
 firestore.settings({
 host: "localhost:8080", // Default port for Firestore emulator
 ssl: false
 });
 } */

const videoCollectionId = 'videos';

// Document definition
export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string
}

export function setVideo(videoId: string, video: Video) {
    return firestore.collection(videoCollectionId).doc(videoId)
        // merge true means Video fields are patched (if field provided, override existing doc.field; else don't touch field)
        .set(video, { merge: true })
}

async function getVideo(videoId: string) {
    const snapshot = await firestore.collection(videoCollectionId).doc(videoId).get()
    return (snapshot.data() as Video) ?? {};
}

export async function isVideoNew(videoId: string) {
    const video = await getVideo(videoId);
    return video?.status === undefined;
}

