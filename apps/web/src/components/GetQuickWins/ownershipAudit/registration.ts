export interface Registration {
  name: string;
  email: string;
  organisation: string;
}

export const emptyRegistration: Registration = {
  name: "",
  email: "",
  organisation: "",
};