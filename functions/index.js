/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';

// Enable CORS using Express middleware
const cors = require('cors')({ origin: true });

const functions = require('firebase-functions');
const admin = require("firebase-admin");

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
    const { uid } = data;

    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const firestore = admin.firestore();

    try {
        // Delete user from Firebase Authentication
        await admin.auth().deleteUser(uid);

        // Delete related documents in Firestore
        const batch = firestore.batch();

        // Query and delete documents in 'patients' collection
        const patientsQuery = await firestore.collection('patients').where('createBy_id', '==', uid).get();
        patientsQuery.forEach(doc => batch.delete(doc.ref));

        // Query and delete documents in 'activity' collection
        const activityQuery = await firestore.collection('activity').where('createBy_id', '==', uid).get();
        activityQuery.forEach(doc => batch.delete(doc.ref));

        // Query and delete documents in 'procedures' collection
        const proceduresQuery = await firestore.collection('procedures').where('createBy_id', '==', uid).get();
        proceduresQuery.forEach(doc => batch.delete(doc.ref));

        // Commit the batch
        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete user', error.message);
    }
});

