interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (configuration: GoogleIdConfiguration) => void;
        renderButton: (
          parent: HTMLElement,
          configuration: GoogleButtonConfiguration,
        ) => void;
        cancel: () => void;
      };
    };
  };
}
