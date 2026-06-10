import React, { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";
import { companyId } from "../../constants/appConstants";

interface UpdateStaffPayload {
  full_name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
}

interface SettingsContextType {
  loading: boolean;
  changePassword: (
    staffId: string,
    oldPassword: string,
    newPassword: string
  ) => Promise<boolean>;

  updateStaffDetails: (
    staffId: string,
    payload: UpdateStaffPayload
  ) => Promise<boolean>;

    resetStaffPassword: (
    staffId: string,
    newPassword: string
  ) => Promise<boolean>;

  forceResetPassword: (
    staffId: string,
    currentPassword: string,
    newPassword: string,
    companyId: string,
  ) => Promise<boolean>;

}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);

  // 🔐 Change Password
  const changePassword = async (
    staffId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    const toastId = toast.loading('Changing password...');
    try {
      const res = await fetch(
        "https://susu-pro-backend.onrender.com/api/staff/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staff_id: staffId,
            current_password: oldPassword,
            new_password: newPassword,
            companyId: companyId,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Password change failed:", errorText);
      throw new Error(errorText || 'Failed to change password');
      }
      toast.success("Successfully changed staff password", {id: toastId})

      return true;
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed changing staff password", {id: toastId})
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 👤 Update Staff Details
  const updateStaffDetails = async (
    staffId: string,
    payload: UpdateStaffPayload
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/staff/${staffId}?company_id=${companyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to update staff:", errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating staff:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetStaffPassword = async (
  staff_id: string,
  newPassword: string
): Promise<boolean> => {
  setLoading(true);
  console.log(`Selected staff ${staff_id}`)

  try {
    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/staff/${staff_id}/reset-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          companyId,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Reset staff password failed:", errorText);
      throw new Error(errorText || 'Failed to change password');
      return false;
    }

    return true;
  } catch (error) {
    console.error("Reset staff password error:", error);
    return false;
  } finally {
    setLoading(false);
  }
};
  const forceResetPassword = async (
  staff_id: string,
  current_password: string,
  new_password: string,
  companyId: string,
): Promise<boolean> => {
  setLoading(true);
  console.log(`Selected staff ${staff_id}`)

  try {
    const res = await fetch(
      `https://susu-pro-backend.onrender.com/api/staff/${staff_id}/force-reset-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staff_id,
          current_password,
          new_password,
          companyId,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Reset staff password failed:", errorText);
      throw new Error(errorText || 'Failed to change password');
      return false;
    }

    return true;
  } catch (error) {
    console.error("Reset staff password error:", error);
    return false;
  } finally {
    setLoading(false);
  }
};


  return (
    <SettingsContext.Provider
      value={{
        loading,
        changePassword,
        updateStaffDetails,
        resetStaffPassword,
        forceResetPassword,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
