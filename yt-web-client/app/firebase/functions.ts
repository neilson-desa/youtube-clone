import {getFunctions, httpsCallable} from "@firebase/functions";

// this lets us call the firebase serverless functions we created in yt-api-service
const functions = getFunctions();

// firebase configs in other file helps configure this functions variable automatically
const generateUploadUrl = httpsCallable(functions, 'generateUploadUrl');

export async function uploadVideo(file: File) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await generateUploadUrl({
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