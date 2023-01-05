interface FeatureFlag {
  enableCustomBrand: boolean;
}

export type ConfigBaseInfo = {
  selfDomain: boolean;
  cloudHosting: boolean;
  workspaceMode: "SAAS" | "ENTERPRISE";
  warning?: string;
  featureFlag: FeatureFlag;
};

export type ConfigResponseData = {
  authConfigs: {
    enableRegister?: boolean;
    enableLogin?: boolean;
    source: string;
    sourceName: string;
  }[];
} & ConfigBaseInfo;

export type SystemConfig = {
  email: {
    enableRegister: boolean;
    enableLogin: boolean;
  };
} & ConfigBaseInfo;

export const transToSystemConfig = (responseData: ConfigResponseData): SystemConfig => {
  const emailConfig = responseData.authConfigs?.find((c) => c.source === "EMAIL");
  return {
    ...responseData,
    email: {
      enableRegister: !!emailConfig?.enableRegister,
      enableLogin: !!emailConfig?.enableLogin,
    },
  };
};
