"use client";

import { useEffect } from "react";

export default function PusherBeamsInit() {
  useEffect(() => {
    const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID;
    if (!instanceId) return;

    // Wait for the CDN script to be available
    const init = () => {
      const PusherPushNotifications = (window as any).PusherPushNotifications;
      if (!PusherPushNotifications) return;

      const beamsClient = new PusherPushNotifications.Client({ instanceId });

      beamsClient
        .start()
        .then(() => beamsClient.addDeviceInterest("hello"))
        .then(() => console.log("Successfully registered and subscribed!"))
        .catch(console.error);
    };

    // Script may already be loaded, or we wait for it
    if ((window as any).PusherPushNotifications) {
      init();
    } else {
      const script = document.querySelector(
        'script[src*="push-notifications-cdn"]'
      );
      script?.addEventListener("load", init);
    }
  }, []);

  return null;
}
