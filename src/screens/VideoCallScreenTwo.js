// import React, { useEffect } from "react";
// import { useRoute } from "@react-navigation/native";
// import {
//   useStreamVideoClient,
//   StreamCall,
//   CallContent,
// } from "@stream-io/video-react-native-sdk";
// import { PermissionsAndroid, Platform } from "react-native";

// const requestPermissions = async () => {
//   if (Platform.OS === "android") {
//     await PermissionsAndroid.requestMultiple([
//       PermissionsAndroid.PERMISSIONS.CAMERA,
//       PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//     ]);
//   }
// };

// const VideoCallScreen = () => {
//   const client = useStreamVideoClient();
//   const { params } = useRoute();
//   const { callId, callType } = params || {};

//   const call = client?.call(callType || "default", callId || "test-call");

//   useEffect(() => {
//     requestPermissions();

//     if (call) {
//       call.join().then(() => {
//         call.camera.enable();
//         call.microphone.enable();
//         call.startPublishing();
//       });
//     }

//     return () => {
//       call?.leave();
//     };
//   }, [call]);

//   if (!call) return null;

//   return (
//     <StreamCall call={call}>
//       <CallContent showControlsOnEmptyCall />
//     </StreamCall>
//   );
// };

// export default VideoCallScreen;
