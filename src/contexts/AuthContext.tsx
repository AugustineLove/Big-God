import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import { Company } from "../data/mockData";

interface LoginResponse {
  requires2FA?: boolean;
  companyId?: string;
  success: boolean;
}

interface SignUpResponse {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  company: Company | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  signUp: (companyData: Omit<Company, "id">) => Promise<SignUpResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* 🔁 Restore session */
  useEffect(() => {
    const storedCompany = localStorage.getItem("susupro_company");
    if (storedCompany) {
      setCompany(JSON.parse(storedCompany));
    }
    setIsLoading(false);
  }, []);

  /* 🔐 LOGIN */
  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    setIsLoading(true);
    const toastId = toast.loading("Signing in...");

    try {
      const res = await fetch(
        "https://susu-pro-backend.onrender.com/api/auth/login-company",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Invalid email or password", {
          id: toastId,
        });
        return { success: false };
      }

      const { token, data: companyData } = data;

      setCompany(companyData);
      localStorage.setItem("susupro_company", JSON.stringify(companyData));
      localStorage.setItem("susupro_token", token);

      toast.success("Login successful", { id: toastId });

      if (companyData.two_factor_enabled) {
        return {
          requires2FA: true,
          companyId: companyData.id,
          success: true,
        };
      }

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Unable to login. Please try again.", { id: toastId });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  /* 🏢 SIGN UP */
  const signUp = async (
    companyData: Omit<Company, "id">
  ): Promise<SignUpResponse> => {
    setIsLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      const res = await fetch(
        "https://susu-pro-backend.onrender.com/api/companies/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companyData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Signup failed", { id: toastId });
        return { success: false, message: data.message };
      }

      toast.success("Account created successfully", { id: toastId });
      return { success: true };
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong during signup", { id: toastId });
      return {
        success: false,
        message: "Unexpected error occurred",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /* 🚪 LOGOUT */
  const logout = () => {
    setCompany(null);
    localStorage.removeItem("susupro_company");
    localStorage.removeItem("susupro_token");
    toast.success("Logged out");
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{ company, isLoading, login, signUp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
