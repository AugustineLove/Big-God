import { getToken } from "firebase/messaging";
import { db, messaging } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { data } from "react-router-dom";

export const saveCompanyToken = async (companyId: string) => {
  try {
    const token = await getToken(messaging, { vapidKey: "BKSnq2x_Ygszk1NWyUE5y_ExVBpdVXqBj6Y53My-y6gVFxKi2ffQEDtDb_5yPRn-picvti61VtJ9y_AyW1rt6JI" });
    if (token) {
      const tokenRef = doc(db, "companies", companyId, "tokens", token);
      await setDoc(tokenRef, {
        token,
        platform: "web",
        createdAt: new Date(),
      });
      console.log("Token saved for company:", token);
    }
  } catch (err) {
    console.error("Error saving token:", err);
  }
}

export const sendMessageToStaff = async (companyId: string, staffId: string, title: string, body: string, data: any) => {
   try {
        await fetch("https://susu-pro-backend.onrender.com/api/messages/send-staff-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: companyId,
            staffId: staffId,
            title: title,
            body: body,
            data: data
          }),
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
}
