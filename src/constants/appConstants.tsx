export const companyJSON = localStorage.getItem('susupro_company');
const user = companyJSON ? JSON.parse(companyJSON) : null;
console.log(user)
export const getEffectiveCompanyId = () => {
  if (!user) return null;

  if (user.type === "company") {
    return user.id; 
  }

  if (user.type === "staff") {
    return user.companyId; // staff points to parent company id
  }

  return null;
};

export const getChangePassword = () =>{
  if (!user) return null;
  return user.change_password_after_signin;
}

export const getUserPermissions = () =>{
  if (!user) return null;
  return user.permissions;
}

const formatFallbackRole = (role: string) => {
  if (!role) return "User";

  return role
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


export const getUserRole = () => {
  if (!user) return null;

  const rawRole =
    user.type === "company"
      ? "admin"
      : String(user.role || "").toLowerCase().trim();

  const roleMap: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    teller: "Teller",
    mobile_banker: "Mobile Banker",
    "mobile banker": "Mobile Banker",
    mobilebanker: "Mobile Banker",
    cashier: "Cashier",
    accountant: "Accountant",
    sales_manager: "Sales Manager",
    hr: "Human Resource"
  };

  return roleMap[rawRole] || formatFallbackRole(rawRole);
};

export const getUserUUID = () => {
  if (!user) return null;
  return user.id;
}

export const getStaffID = () => {
  if (!user) return null;
  return user.staffId;
}
export const getDisplayName = () => {
  if (!user) return null;

  return user.type === "company" ? user.companyName : user.staffName;
};

export const getParentCompanyName = () => {
  if (!user) return null;
  return user.type === "staff" ? user.companyName : user.companyName;
}

      
export function formatDate(dateString: string, locale: string = "en-US"): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",  
    day: "numeric", 
  }).format(date);
}

export const makeSuSuProName = (companyName: string) => {
  if (!companyName || typeof companyName !== 'string') return 'SuSuPro';
  if(companyName === 'Big God Susu Enterprise') return 'BigGod Susu'
  // Get words (handles extra spaces, punctuation, hyphens)
  const words = companyName
    .trim()
    .split(/[\s\-_.]+/g)                // split on space, hyphen, underscore, dot
    .filter(Boolean);

  // Collect initials (letters only), uppercase
  const initials = words
    .map(w => (w.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)?.[0] || '')) // first letter (incl. accents)
    .join('')
    .toUpperCase();

  return `${initials}SuSu`;
}


export const companyId = getEffectiveCompanyId();
export const companyName = getDisplayName();
export const userRole = getUserRole();
export const userStaffId = getStaffID();
export const userPermissions = getUserPermissions();
export const resetPassword = getChangePassword();
export const userUUID = getUserUUID();
export const parentCompanyName = getParentCompanyName();